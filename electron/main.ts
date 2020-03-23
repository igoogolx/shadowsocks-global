import {
  app,
  BrowserWindow,
  dialog,
  Tray,
  Menu,
  MenuItemConstructorOptions,
  ipcMain,
} from "electron";
import * as path from "path";
import promiseIpc from "electron-promise-ipc";
import {
  setMenu,
  installExtensions,
  getResourcesPath,
  trayIconImages,
  getAppConfig,
} from "./utils";
import { VpnManager } from "./vpnManager";

let mainWindow: null | BrowserWindow;
let tray: Tray | undefined;
let isAppQuitting = false;

let localizedStrings: { [key: string]: string } = {
  "connected-server-state": "Connected",
  "disconnected-server-state": "Disconnected",
  quit: "Quit",
};

const isDev = process.env.NODE_ENV === "development";

let vpnManager: VpnManager | undefined;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    fullscreen: isDev,
    resizable: isDev,
    webPreferences: {
      nodeIntegration: true,
      devTools: isDev,
      webSecurity: !isDev,
    },
  });

  if (isDev) {
    try {
      mainWindow.webContents.openDevTools();
      console.log("Installing extensions");
      await installExtensions();
      console.log("Install extensions successfully");
    } catch (e) {
      console.log(e);
    }
  }

  setMenu(mainWindow);
  await mainWindow.loadURL(
    isDev
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "index.html")}`
  );

  // Emitted when the window is closed.
  mainWindow.on("closed", () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  const minimizeWindowToTray = (event: Event) => {
    if (!mainWindow || isAppQuitting) {
      return;
    }
    event.preventDefault(); // Prevent the app from exiting on the 'close' event.
    mainWindow.hide();
  };
  vpnManager = new VpnManager(mainWindow, tray);
  mainWindow.on("minimize", minimizeWindowToTray);
  mainWindow.on("close", minimizeWindowToTray);
  mainWindow.on("show", () => {
    if (vpnManager?.traffic) vpnManager.traffic.setIsCapturePockets = true;
  });
  mainWindow.on("hide", () => {
    if (vpnManager?.traffic) vpnManager.traffic.setIsCapturePockets = false;
  });
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
  if (mainWindow) {
    if (mainWindow.isMinimized() || !mainWindow.isVisible()) {
      mainWindow.restore();
      mainWindow.show();
    }
    mainWindow.focus();
  }
});

app.setAsDefaultProtocolClient("ss");

function createTray() {
  if (tray) return;
  tray = new Tray(trayIconImages.disconnected);
  tray.on("click", () => {
    if (!mainWindow) {
      createWindow()
        .then
        //Ignore promise returned from createWindow.
        ();
      return;
    }
    if (mainWindow.isMinimized() || !mainWindow.isVisible()) {
      mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    } else {
      mainWindow.hide();
    }
  });
  tray.setToolTip("Shadowsocks-global");
  // Retrieve localized strings, falling back to the pre-populated English default.
  const quitString = localizedStrings["quit"];
  const menuTemplate = [
    { type: "separator" } as MenuItemConstructorOptions,
    { label: quitString, click: quitApp },
  ];
  tray.setContextMenu(Menu.buildFromTemplate(menuTemplate));
}

promiseIpc.on("start", async () => {
  if (vpnManager) await vpnManager.start();
});
promiseIpc.on("stop", async () => {
  if (vpnManager) await vpnManager.stop();
});

promiseIpc.on("getCustomizedRulesDirPath", async (defaultPath: unknown) => {
  try {
    if (mainWindow) {
      const result = await dialog.showOpenDialog(mainWindow, {
        defaultPath: defaultPath as string,
        properties: ["openDirectory"],
      });
      if (result.canceled) return null;
      else return result.filePaths[0];
    }
  } catch (e) {
    return null;
  }
});

promiseIpc.on("getResourcesPath", async () => await getResourcesPath());

promiseIpc.on("getAppVersion", async () => await app.getVersion());

ipcMain.on("localizationResponse", (event, localizationResult) => {
  if (!!localizationResult) {
    localizedStrings = localizationResult;
  }
  createTray();
});

ipcMain.on("setRunAtSystemStartup", () => {
  const appConfig = getAppConfig();
  if (appConfig.setting.general.isRunAtSystemStartup)
    app.setLoginItemSettings({ openAtLogin: true });
  else app.setLoginItemSettings({ openAtLogin: false });
});

//Avoid main process crash.
//TODO: add system log
process.on("uncaughtException", function (err) {
  console.log(err);
});
