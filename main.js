// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require("electron");
const { trayIcon } = require("./trayIcon.js");

let cleanupTray = () => {};
async function initializeTray() {
  const lastCleanup = cleanupTray;
  cleanupTray = () => {};
  await lastCleanup();
  cleanupTray = trayIcon();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  const onlineStatusWindow = new BrowserWindow({
    width: 0,
    height: 0,
    show: false,
    webPreferences: { nodeIntegration: true },
  });
  onlineStatusWindow.loadURL(`file://${__dirname}/online-status.html`);
  initializeTray();
  ipcMain.on("online-status-changed", (event, status) => {
    initializeTray();
  });
  setInterval(() => {
    initializeTray();
  }, 1000 * 60 * 20);
});