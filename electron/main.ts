import {
  app,
  BrowserWindow,
  dialog,
  Tray,
  nativeImage,
  Menu,
  MenuItemConstructorOptions,
  ipcMain
} from "electron";
import * as path from "path";
import promiseIpc from "electron-promise-ipc";
import { ConnectionManager, Dns } from "./process_manager";
import {
  setMenu,
  installExtensions,
  getResourcesPath,
  RemoteServer,
  getConfig
} from "./utils";
import { ConnectionStatus } from "./routing_service";
import { Traffic } from "./traffic";

const traffic = new Traffic();

export type AdditionalRoute = { proxy: string[]; reserved: string[] };

export type Config = {
  server: RemoteServer;
  rulePath?: string;
  dns: Dns;
  additionalRoute: AdditionalRoute;
};

let mainWindow: null | BrowserWindow;
let tray: Tray | undefined;
let isAppQuitting = false;

let localizedStrings: { [key: string]: string } = {
  "connected-server-state": "Connected",
  "disconnected-server-state": "Disconnected",
  quit: "Quit"
};

const isDev = process.env.NODE_ENV === "development";

const trayIconImages = {
  connected: createTrayIconImage("connected.png"),
  disconnected: createTrayIconImage("disconnected.png")
};

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,

    height: 600,
    fullscreen: isDev,
    resizable: isDev,
    transparent: !isDev,
    webPreferences: {
      nodeIntegration: true,
      devTools: isDev,
      webSecurity: !isDev
    }
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
      : `file://${path.join(__dirname, "../build/index.html")}`
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
  mainWindow.on("minimize", minimizeWindowToTray);
  mainWindow.on("close", minimizeWindowToTray);
  mainWindow.on("show", () => {
    traffic.setIsCapturePockets = true;
  });
  mainWindow.on("hide", () => {
    traffic.setIsCapturePockets = false;
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

let currentConnection: ConnectionManager | undefined;

let updateTrafficTimer: NodeJS.Timeout;
const UPDATE_TRAFFIC_INTERVAL_MS = 1000;

const startVpn = async (config: Config) => {
  if (currentConnection) {
    console.log("already connected");
    throw new Error("already connected");
  }
  const routingDaemonConfig = await getConfig(
    config.server.host,
    config.rulePath,
    config.dns,
    config.additionalRoute
  );
  try {
    currentConnection = new ConnectionManager(
      config.server,
      routingDaemonConfig.route,
      routingDaemonConfig.dns,
      mainWindow
    );

    //TODO: Fix bug: can't catch error
    currentConnection.onceStopped.then(() => {
      console.log("disconnected!");
      sendConnectionStatus(ConnectionStatus.DISCONNECTED);
      stopVpn();
    });

    currentConnection.onReconnecting = () => {
      console.log(`reconnecting`);
      sendConnectionStatus(ConnectionStatus.RECONNECTING);
    };
    currentConnection.onReconnected = () => {
      console.log(`reconnected`);
      sendConnectionStatus(ConnectionStatus.CONNECTED);
    };
    await mainWindow?.webContents.send("message", "Connecting...");
    await currentConnection.start();
    await mainWindow?.webContents.send("message", "Connected!");
    sendConnectionStatus(ConnectionStatus.CONNECTED);

    tray?.setToolTip(
      `Shadowsocks-global
${
  config.server.name
    ? `${config.server.name}(${config.server.host}:${config.server.port})`
    : `${config.server.host}:${config.server.port}`
}`
    );
    traffic.start();
    updateTrafficTimer = setInterval(async () => {
      if (!mainWindow?.isVisible()) return;
      let sentBytesPerSecond = 0;
      let receivedBytesPerSecond = 0;
      const portUsages: { port: number; bytesPerSecond: number }[] = [];
      traffic.getPockets.forEach(pocket => {
        if (pocket.type === "sent") sentBytesPerSecond += pocket.length;
        else receivedBytesPerSecond += pocket.length;
        const index = portUsages.findIndex(
          portUsage => portUsage.port === pocket.port
        );
        if (index === -1)
          portUsages.push({ port: pocket.port, bytesPerSecond: pocket.length });
        else
          portUsages[index] = {
            port: pocket.port,
            bytesPerSecond: portUsages[index].bytesPerSecond + pocket.length
          };
      });
      traffic.resetPockets();
      await mainWindow?.webContents.send(
        "totalTrafficUsage",
        traffic.getTotalUsage
      );
      await mainWindow?.webContents.send("netSpeed", {
        sentBytesPerSecond,
        receivedBytesPerSecond,
        time: Date.now()
      });

      //TODO: Port to process. Note: "find-process"(https://www.npmjs.com/package/find-process)
      // is not improper to be used to find multiple ports at the same time,
      // because of high usage of cpu.
      await mainWindow?.webContents.send("portNetSpeeds", portUsages);
    }, UPDATE_TRAFFIC_INTERVAL_MS);
  } catch (e) {
    await stopVpn();
    throw new Error(e);
  }
};

const stopVpn = async () => {
  try {
    if (updateTrafficTimer) clearInterval(updateTrafficTimer);
    traffic.stop();
    if (!currentConnection) return;
    currentConnection.stop();
    await currentConnection.onceStopped;

    currentConnection = undefined;
    sendConnectionStatus(ConnectionStatus.DISCONNECTED);
    await mainWindow?.webContents.send("message", "Disconnected");
    tray?.setToolTip("Shadowsocks-global");
  } catch (e) {
    console.log(e);
  }
};

// Signals that the app is quitting and quits the app. This is necessary because we override the
// window 'close' event to support minimizing to the system tray.
async function quitApp() {
  isAppQuitting = true;
  await stopVpn();
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

const setTayImage = (status: ConnectionStatus) => {
  const isConnected = status === ConnectionStatus.CONNECTED;
  const trayIconImage = isConnected
    ? trayIconImages.connected
    : trayIconImages.disconnected;
  if (tray) {
    tray.setImage(trayIconImage);
  }
};

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
    { label: quitString, click: quitApp }
  ];
  tray.setContextMenu(Menu.buildFromTemplate(menuTemplate));
}

function createTrayIconImage(imageName: string) {
  const image = nativeImage.createFromPath(
    path.join(app.getAppPath(), "resources", "tray", imageName)
  );
  if (image.isEmpty()) {
    throw new Error(`cannot find ${imageName} tray icon image`);
  }
  return image;
}

function sendConnectionStatus(status: ConnectionStatus) {
  let statusString;
  switch (status) {
    case ConnectionStatus.CONNECTED:
      statusString = "connected";
      break;
    case ConnectionStatus.DISCONNECTED:
      statusString = "disconnected";
      break;
    case ConnectionStatus.RECONNECTING:
      statusString = "reconnecting";
      break;
    default:
      console.error(`Cannot send unknown proxy status: ${status}`);
      return;
  }
  const event = `proxy-${statusString}`;
  if (mainWindow) {
    mainWindow.webContents.send(event);
  } else {
    console.warn(`received ${event} event but no mainWindow to notify`);
  }
  setTayImage(status);
}
// @ts-ignore
promiseIpc.on("start", startVpn);

promiseIpc.on("stop", stopVpn);

promiseIpc.on("getCustomizedRulesDirPath", async (defaultPath: unknown) => {
  try {
    if (mainWindow) {
      const result = await dialog.showOpenDialog(mainWindow, {
        defaultPath: defaultPath as string,
        properties: ["openDirectory"]
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

//Avoid main process crash.
//TODO: add system log
process.on("uncaughtException", function(err) {
  console.log(err);
});
