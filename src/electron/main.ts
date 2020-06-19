import { app, BrowserWindow } from "electron";
import * as path from "path";
import { ipcMain as ipc } from "electron-better-ipc";
import { setMenu, installExtensions, getAppState, isDev } from "./utils";
import { VpnManager } from "./vpnManager";
import { logger } from "./log";
import { AppTray } from "./tray";
import { mainWindow } from "./common";
import "./ipc";

let tray: AppTray | undefined;
let isAppQuitting = false;

let vpnManager: VpnManager | undefined;

async function createWindow() {
  mainWindow.set(
    new BrowserWindow({
      width: 850,
      height: 600,
      useContentSize: true,
      fullscreen: isDev,
      resizable: isDev,
      webPreferences: {
        nodeIntegration: true,
        devTools: isDev,
      },
    })
  );

  if (isDev) {
    try {
      mainWindow.get()?.webContents.openDevTools();
      console.log("Installing extensions");
      await installExtensions();
      console.log("Install extensions successfully");
    } catch (e) {
      console.log(e);
    }
  }

  setMenu();
  await mainWindow
    .get()
    ?.loadURL(
      isDev
        ? "http://localhost:3000"
        : `file://${path.join(__dirname, "index.html")}`
    );

  // Emitted when the window is closed.
  mainWindow.get()?.on("closed", () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow.set(undefined);
  });

  const minimizeWindowToTray = (event: Event) => {
    if (!mainWindow || isAppQuitting) {
      return;
    }
    event.preventDefault(); // Prevent the app from exiting on the 'close' event.
    mainWindow.get()?.hide();
  };
  mainWindow.get()?.on("minimize", minimizeWindowToTray);
  mainWindow.get()?.on("close", async (event: Event) => {
    const isHideWhenWindowIsClosed = getAppState().setting.general
      .hideWhenWindowIsClosed;
    if (isHideWhenWindowIsClosed) minimizeWindowToTray(event);
    else await quitApp();
  });

  tray = new AppTray(createWindow, quitApp);
  tray.setToolTip("disconnected");
}

app.on("ready", createWindow);

// Signals that the app is quitting and quits the app. This is necessary because we override the
// window 'close' event to support minimizing to the system tray.
async function quitApp() {
  isAppQuitting = true;
  await vpnManager?.stop();
  app.quit();
}

if (!app.requestSingleInstanceLock()) {
  console.log("another instance is running - exiting");
  app.quit();
}

app.on("second-instance", () => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow.get()?.isMinimized() || !mainWindow.get()?.isVisible()) {
    mainWindow.get()?.restore();
    mainWindow.get()?.show();
  }
  mainWindow.get()?.focus();
});

app.setAsDefaultProtocolClient("ss");

ipc.answerRenderer("start", async () => {
  vpnManager = new VpnManager(tray);
  await vpnManager.start();
});
ipc.answerRenderer("changeServer", async () => {
  if (vpnManager) {
    await vpnManager.changeServer();
  }
});

ipc.answerRenderer("stop", async () => {
  if (vpnManager) {
    await vpnManager.stop();
    vpnManager = undefined;
  }
});

//Prevent main process from crashing.
//TODO: add system log
process.on("uncaughtException", function (err) {
  logger.error(err);
});
