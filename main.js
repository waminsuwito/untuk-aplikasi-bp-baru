const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // Important for security: keep these settings unless you know what you're doing
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'out/logo.png')
  });

  // Load the statically exported Next.js app
  mainWindow.loadFile(path.join(__dirname, 'out/index.html'));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
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
