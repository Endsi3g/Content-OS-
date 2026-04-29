const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // You can expose functions from Node.js here safely
  platform: process.platform,
});
