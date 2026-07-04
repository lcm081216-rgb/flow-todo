const { contextBridge } = require('electron');

const isMac = process.platform === 'darwin';

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  isMac,
});

// Inject platform class for CSS targeting
// The preload script has DOM access even with contextIsolation
if (isMac) {
  document.documentElement.classList.add('electron-mac');
}
