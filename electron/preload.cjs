'use strict';

const { contextBridge, ipcRenderer } = require('electron');

/**
 * Secure bridge between the renderer process (React) and the main process.
 * Exposed as `window.electronAPI` in the browser context.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // ─── File System ──────────────────────────────────────────────────────────
  /** Opens a native folder picker. Returns the selected path or null. */
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),

  /** Opens a native file picker for videos. Returns array of file paths. */
  openVideoFiles: (filters) => ipcRenderer.invoke('dialog:openFiles', filters),

  // ─── Notifications ────────────────────────────────────────────────────────
  /** Sends a native Windows notification. */
  sendNotification: (title, body) =>
    ipcRenderer.invoke('notification:send', { title, body }),

  // ─── Auto-Launch ──────────────────────────────────────────────────────────
  /** Returns whether the app is set to auto-launch on system startup. */
  getAutoLaunch: () => ipcRenderer.invoke('autoLaunch:get'),

  /** Enables or disables auto-launch on system startup. */
  setAutoLaunch: (enabled) => ipcRenderer.invoke('autoLaunch:set', enabled),

  // ─── Navigation (from Tray / Shortcuts) ───────────────────────────────────
  /** Listen for navigation events triggered by tray menu or global shortcuts. */
  onNavigate: (callback) => ipcRenderer.on('navigate', (_, route) => callback(route)),

  /** Listen for notification toggle events from tray. */
  onToggleNotifications: (callback) =>
    ipcRenderer.on('toggle-notifications', (_, enabled) => callback(enabled)),

  // ─── Shell ────────────────────────────────────────────────────────────────
  /** Opens a URL in the system's default browser. */
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),

  // ─── App Info ─────────────────────────────────────────────────────────────
  /** Returns true if running inside Electron. */
  isElectron: () => ipcRenderer.invoke('app:isElectron'),

  /** Returns the current app version from package.json. */
  getVersion: () => ipcRenderer.invoke('app:getVersion'),

  // ─── Phase 2: Drag & Drop ─────────────────────────────────────────────────
  /** Get file metadata for dropped file paths. */
  getFileInfo: (filePaths) => ipcRenderer.invoke('dragdrop:getFileInfo', filePaths),

  /** Read a file as base64 (thumbnails, small files). */
  readFileBase64: (filePath) => ipcRenderer.invoke('fs:readFileBase64', filePath),

  // ─── Phase 2: Screen Capture ──────────────────────────────────────────────
  /** Get available screen/window sources for capture. */
  getCaptureSources: () => ipcRenderer.invoke('capture:getSources'),

  // ─── FFmpeg Local Video Editing ───────────────────────────────────────────
  ffmpeg: {
    trim: (args) => ipcRenderer.invoke('ffmpeg:trim', args),
    reencode: (args) => ipcRenderer.invoke('ffmpeg:reencode', args),
    concat: (args) => ipcRenderer.invoke('ffmpeg:concat', args),
    thumbnail: (args) => ipcRenderer.invoke('ffmpeg:thumbnail', args),
    probe: (args) => ipcRenderer.invoke('ffmpeg:probe', args),
    onProgress: (callback) => {
      const listener = (_, data) => callback(data);
      ipcRenderer.on('ffmpeg:progress', listener);
      return () => ipcRenderer.removeListener('ffmpeg:progress', listener);
    }
  },

  // ─── Offline Storage & Sync ───────────────────────────────────────────────
  offline: {
    save: (args) => ipcRenderer.invoke('offline:save', args),
    get: (args) => ipcRenderer.invoke('offline:get', args),
    getAll: (args) => ipcRenderer.invoke('offline:getAll', args),
    delete: (args) => ipcRenderer.invoke('offline:delete', args),
    enqueue: (args) => ipcRenderer.invoke('offline:enqueue', args),
    getQueue: () => ipcRenderer.invoke('offline:getQueue'),
    clearQueue: () => ipcRenderer.invoke('offline:clearQueue'),
    dequeue: (args) => ipcRenderer.invoke('offline:dequeue', args),
    goOnline: () => ipcRenderer.invoke('offline:goOnline'),
    status: () => ipcRenderer.invoke('offline:status'),
    bulkSave: (args) => ipcRenderer.invoke('offline:bulkSave', args),
    markSynced: (args) => ipcRenderer.invoke('offline:markSynced', args),
    clearAll: () => ipcRenderer.invoke('offline:clearAll'),
  }
});
