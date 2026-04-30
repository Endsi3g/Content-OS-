'use strict';

/**
 * offline-store.cjs
 *
 * Provides persistent local caching for scripts, projects, and user data
 * so Content OS can work offline. Uses electron-store for encrypted JSON storage.
 * Implements a sync queue that replays changes when back online.
 */

const { ipcMain } = require('electron');
const Store = require('electron-store');

const cache = new Store({
  name: 'content-os-offline',
  encryptionKey: 'content-os-offline-v1',
  defaults: {
    scripts: {},       // { [id]: { ...scriptData, _dirty: bool, _lastSync: timestamp } }
    projects: {},      // { [id]: { ...projectData, _dirty: bool, _lastSync: timestamp } }
    syncQueue: [],     // [{ action: 'PUT'|'POST'|'DELETE', endpoint: string, body: object, timestamp: number }]
    lastOnline: null,  // ISO timestamp
  },
});

/**
 * Register all offline-mode IPC handlers.
 * Call this once from main.cjs during app.whenReady().
 */
function registerOfflineHandlers(mainWindow) {

  // ─── Cache Read/Write ───────────────────────────────────────────────────

  // Save an item to local cache
  ipcMain.handle('offline:save', (_, { collection, id, data }) => {
    const key = `${collection}.${id}`;
    cache.set(key, {
      ...data,
      _dirty: true,
      _lastSync: Date.now(),
    });
    return { success: true };
  });

  // Get an item from local cache
  ipcMain.handle('offline:get', (_, { collection, id }) => {
    const key = `${collection}.${id}`;
    return cache.get(key, null);
  });

  // Get all items in a collection
  ipcMain.handle('offline:getAll', (_, { collection }) => {
    const all = cache.get(collection, {});
    return Object.values(all);
  });

  // Delete an item from local cache
  ipcMain.handle('offline:delete', (_, { collection, id }) => {
    const key = `${collection}.${id}`;
    cache.delete(key);
    return { success: true };
  });

  // ─── Sync Queue ─────────────────────────────────────────────────────────

  // Add an action to the sync queue (to replay when online)
  ipcMain.handle('offline:enqueue', (_, { action, endpoint, body }) => {
    const queue = cache.get('syncQueue', []);
    queue.push({
      action,
      endpoint,
      body,
      timestamp: Date.now(),
    });
    cache.set('syncQueue', queue);
    return { success: true, queueLength: queue.length };
  });

  // Get the current sync queue
  ipcMain.handle('offline:getQueue', () => {
    return cache.get('syncQueue', []);
  });

  // Clear the sync queue (after successful sync)
  ipcMain.handle('offline:clearQueue', () => {
    cache.set('syncQueue', []);
    return { success: true };
  });

  // Remove a specific item from the queue by index
  ipcMain.handle('offline:dequeue', (_, { index }) => {
    const queue = cache.get('syncQueue', []);
    queue.splice(index, 1);
    cache.set('syncQueue', queue);
    return { success: true, queueLength: queue.length };
  });

  // ─── Online/Offline Detection ───────────────────────────────────────────

  // Mark as online and return pending queue count
  ipcMain.handle('offline:goOnline', () => {
    cache.set('lastOnline', new Date().toISOString());
    const queue = cache.get('syncQueue', []);
    return { queueLength: queue.length };
  });

  // Get offline status
  ipcMain.handle('offline:status', () => {
    const queue = cache.get('syncQueue', []);
    const lastOnline = cache.get('lastOnline', null);
    const scripts = cache.get('scripts', {});
    const projects = cache.get('projects', {});
    const dirtyScripts = Object.values(scripts).filter((s) => s._dirty).length;
    const dirtyProjects = Object.values(projects).filter((p) => p._dirty).length;
    return {
      lastOnline,
      queueLength: queue.length,
      cachedScripts: Object.keys(scripts).length,
      cachedProjects: Object.keys(projects).length,
      dirtyScripts,
      dirtyProjects,
    };
  });

  // ─── Bulk cache operations ──────────────────────────────────────────────

  // Bulk save from server (after successful fetch, mark as clean)
  ipcMain.handle('offline:bulkSave', (_, { collection, items }) => {
    const existing = cache.get(collection, {});
    for (const item of items) {
      existing[item.id] = {
        ...item,
        _dirty: false,
        _lastSync: Date.now(),
      };
    }
    cache.set(collection, existing);
    return { success: true, count: items.length };
  });

  // Mark items as synced (clean)
  ipcMain.handle('offline:markSynced', (_, { collection, ids }) => {
    const existing = cache.get(collection, {});
    for (const id of ids) {
      if (existing[id]) {
        existing[id]._dirty = false;
        existing[id]._lastSync = Date.now();
      }
    }
    cache.set(collection, existing);
    return { success: true };
  });

  // Clear all offline data
  ipcMain.handle('offline:clearAll', () => {
    cache.clear();
    return { success: true };
  });
}

module.exports = { registerOfflineHandlers };
