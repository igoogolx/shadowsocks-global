import { mainWindow } from "./common";
import { app, BrowserWindow, dialog, shell, ipcMain } from "electron";
import { ipcMain as ipc } from "electron-better-ipc";
import {
  getAppState,
  getBuildInRules,
  getResourcesPath,
  lookupRegionCode,
} from "./utils";
import { LOG_FILE_PATH, logger } from "./log";
import { FlowData } from "./flow";
import axios from "axios";
import {
  checkDns,
  CheckingOption,
  checkServer,
  checkUdpForwardingEnabled,
  validateServerCredentials,
} from "./connectivity";

export enum ConnectionStatus {
  CONNECTED,
  DISCONNECTED,
  RECONNECTING,
}
ipc.answerRenderer(
  "getCustomizedRulesDirPath",
  async (defaultPath: unknown) => {
    try {
      if (mainWindow.get()) {
        const result = await dialog.showOpenDialog(
          mainWindow.get() as BrowserWindow,
          {
            defaultPath: defaultPath as string,
            properties: ["openDirectory"],
          }
        );
        if (result.canceled) return null;
        else return result.filePaths[0];
      }
    } catch (e) {
      return null;
    }
  }
);

ipc.answerRenderer("getResourcesPath", async () => getResourcesPath());

ipc.answerRenderer("getAppVersion", async () => await app.getVersion());

ipcMain.on("setRunAtSystemStartup", () => {
  const appConfig = getAppState();
  if (appConfig.setting.general.runAtSystemStartup)
    app.setLoginItemSettings({ openAtLogin: true });
  else app.setLoginItemSettings({ openAtLogin: false });
});

ipcMain.on("openLogFile", async () => {
  try {
    await shell.openPath(LOG_FILE_PATH);
  } catch (e) {}
});

ipcMain.on("hideWindow", () => {
  mainWindow.get()?.hide();
});

const sendToRender = (channel: string, data?: any) => {
  if (!mainWindow.get())
    logger.error(`received ${channel} channel but no mainWindow to notify`);
  else mainWindow.get()?.webContents.send(channel, data);
};

export const sendMessageToRender = (msg: string) => {
  sendToRender("proxy-message", msg);
};
export const sendFlowToRender = (data: FlowData & { time: number }) => {
  sendToRender("proxy-flow", data);
};
export const sendConnectionStatus = (status: ConnectionStatus) => {
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
  sendToRender(event);
};
ipc.answerRenderer("getRegionCode", async (host: string) => {
  return await lookupRegionCode(host);
});

const UPDATE_SUBSCRIPTIONS_TIMEOUT_MS = 5000;
ipc.answerRenderer("fetchSubscription", async (url: string) => {
  const nodesBase64 = await axios(url, {
    timeout: UPDATE_SUBSCRIPTIONS_TIMEOUT_MS,
  });
  return Buffer.from(nodesBase64.data, "base64").toString();
});

export const PROXY_ADDRESS = "127.0.0.1";
ipc.answerRenderer(
  "checkUdpStatus",
  async (port: number) => await checkUdpForwardingEnabled(PROXY_ADDRESS, port)
);

ipc.answerRenderer(
  "checkServer",
  async (option: CheckingOption) => await checkServer(option)
);
ipc.answerRenderer("checkDns", async () => await checkDns());
ipc.answerRenderer(
  "checkInternet",
  async (port: number) => await validateServerCredentials(PROXY_ADDRESS, port)
);

ipc.answerRenderer("getBuildInRules", async () => await getBuildInRules());

export const listenLocalize = (
  listener: (translation: { [key: string]: string }) => void
) => {
  ipcMain.on("localize", (event, arg) => {
    listener(arg);
  });
};

export const listenStart = (listener: () => void) => {
  ipc.answerRenderer("start", listener);
};
export const listenChangeServer = (listener: () => void) => {
  ipc.answerRenderer("changeServer", listener);
};
export const listenStop = (listener: () => void) => {
  ipc.answerRenderer("stop", listener);
};
