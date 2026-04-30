'use strict';

const { app, BrowserWindow, Tray, Menu, nativeImage, globalShortcut, ipcMain, dialog, shell, Notification } = require('electron');
const path = require('path');
const AutoLaunch = require('auto-launch');

// ─── Constants ───────────────────────────────────────────────────────────────
const APP_NAME = 'Content OS';
const DEV_SERVER_URL = 'http://localhost:3000';
const isDev = process.env.NODE_ENV !== 'production';

// ─── State ────────────────────────────────────────────────────────────────────
let mainWindow = null;
let tray = null;
let isQuitting = false;

const autoLauncher = new AutoLaunch({
  name: APP_NAME,
  isHidden: false,
});

// ─── Main Window ─────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    frame: true,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0a0a0f',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    show: false, // will show after ready-to-show
  });

  // Append custom User-Agent identifier so React can detect Electron
  mainWindow.webContents.setUserAgent(
    mainWindow.webContents.getUserAgent() + ' ContentOS-Electron'
  );

  if (isDev) {
    mainWindow.loadURL(DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Show only when fully ready to avoid white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Minimize to tray instead of closing
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
      showTrayNotification('Content OS continue en arrière-plan', 'Cliquez sur l\'icône dans la barre des tâches pour rouvrir.');
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── Tray ─────────────────────────────────────────────────────────────────────
function createTray() {
  // Use a default 16x16 blank icon if no icon file exists
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(path.join(__dirname, 'tray-icon.png'));
  } catch {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip(APP_NAME);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '🎬 Ouvrir Content OS',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      },
    },
    { type: 'separator' },
    {
      label: '🔔 Notifications',
      type: 'checkbox',
      checked: true,
      click: (item) => {
        // Toggling desktop notifications
        mainWindow?.webContents.send('toggle-notifications', item.checked);
      },
    },
    { type: 'separator' },
    {
      label: '⚙️ Paramètres',
      click: () => {
        mainWindow?.show();
        mainWindow?.webContents.send('navigate', '/settings');
      },
    },
    { type: 'separator' },
    {
      label: '❌ Quitter',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.focus() : mainWindow.show();
    }
  });

  tray.on('double-click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

// ─── Global Shortcuts ─────────────────────────────────────────────────────────
function registerShortcuts() {
  // Ctrl+Shift+Space → Show/Hide the app from anywhere
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    if (mainWindow) {
      if (mainWindow.isVisible() && mainWindow.isFocused()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  // Ctrl+Shift+N → Quick New Script capture
  globalShortcut.register('CommandOrControl+Shift+N', () => {
    mainWindow?.show();
    mainWindow?.focus();
    mainWindow?.webContents.send('navigate', '/scripts?action=new');
  });

  // Ctrl+Shift+U → Quick Upload
  globalShortcut.register('CommandOrControl+Shift+U', () => {
    mainWindow?.show();
    mainWindow?.focus();
    mainWindow?.webContents.send('navigate', '/clips?action=upload');
  });
}

// ─── Native Notifications ─────────────────────────────────────────────────────
function showTrayNotification(title, body) {
  if (Notification.isSupported()) {
    const notification = new Notification({ title, body, silent: false });
    notification.on('click', () => {
      mainWindow?.show();
      mainWindow?.focus();
    });
    notification.show();
  }
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

// Open folder dialog and return selected path
ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Sélectionner un dossier de rushes',
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

// Open file dialog for video import
ipcMain.handle('dialog:openFiles', async (_, filters) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: filters || [{ name: 'Vidéos', extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm'] }],
    title: 'Sélectionner des fichiers vidéo',
  });
  if (result.canceled) return [];
  return result.filePaths;
});

// Send a native Windows notification
ipcMain.handle('notification:send', (_, { title, body }) => {
  showTrayNotification(title, body);
});

// Get/Set auto-launch preference
ipcMain.handle('autoLaunch:get', async () => {
  return autoLauncher.isEnabled();
});
ipcMain.handle('autoLaunch:set', async (_, enable) => {
  if (enable) {
    await autoLauncher.enable();
  } else {
    await autoLauncher.disable();
  }
  return enable;
});

// Open external URL in system browser
ipcMain.handle('shell:openExternal', (_, url) => {
  shell.openExternal(url);
});

// Check if running in Electron
ipcMain.handle('app:isElectron', () => true);

// Get app version
ipcMain.handle('app:getVersion', () => app.getVersion());

// ─── App Lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();
  createTray();
  registerShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else mainWindow?.show();
  });
});

app.on('window-all-closed', () => {
  // On macOS, do not quit when all windows are closed
  if (process.platform !== 'darwin') {
    // Don't quit — keep in tray
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
