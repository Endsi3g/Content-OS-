const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Check if we are in development mode by checking environment variables
  // (Usually set by cross-env in package.json)
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    // In dev, load from the Vite/React dev server
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // In production, load the built index.html
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Appending custom identifier to User Agent so React can detect it's running inside Electron
  mainWindow.webContents.userAgent = mainWindow.webContents.userAgent + ' ContentOS-Electron';
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
