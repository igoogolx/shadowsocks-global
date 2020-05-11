import { mainWindow } from "./common";
import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import promiseIpc from "electron-promise-ipc";

import {
  DNS_NATIVE_WEBSITES_FILE_PATH,
  getAppConfig,
  getResourcesPath,
} from "./utils";
import { LOG_FILE_PATH } from "./log";
import { FlowData } from "./flow";

promiseIpc.on("getCustomizedRulesDirPath", async (defaultPath: unknown) => {
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
});

promiseIpc.on("getResourcesPath", async () => await getResourcesPath());

promiseIpc.on("getAppVersion", async () => await app.getVersion());

ipcMain.on("setRunAtSystemStartup", () => {
  const appConfig = getAppConfig();
  if (appConfig.setting.general.isRunAtSystemStartup)
    app.setLoginItemSettings({ openAtLogin: true });
  else app.setLoginItemSettings({ openAtLogin: false });
});

ipcMain.on("openLogFile", () => {
  shell.openItem(LOG_FILE_PATH);
});

ipcMain.on("openDnsNativeWebsitesFile", () => {
  shell.openItem(DNS_NATIVE_WEBSITES_FILE_PATH);
});

ipcMain.on("hideWindow", () => {
  mainWindow.get()?.hide();
});

export const sendMessageToRender = async (msg: string) => {
  await mainWindow.get()?.webContents.send("updateMessage", msg);
};
export const sendUdpStatusToRender = async (status: string) => {
  await mainWindow.get()?.webContents.send("udpStatus", status);
};
export const sendFlowToRender = async (data: FlowData & { time: number }) => {
  mainWindow.get()?.webContents.send("updateFlow", data);
};
