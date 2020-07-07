import { ipcRenderer as ipc } from "electron-better-ipc";
import { store } from "../store/store";
import { CheckingOption } from "../electron/connectivity";
import { ipcRenderer, IpcRendererEvent } from "electron";
import { FlowData } from "../electron/flow";
import { decodeSsUrl } from "./url";
import { v4 as uuid } from "uuid";

//TODO:refactor
export const checkUpdStatus = async () => {
  return await ipc.callMain("checkUdpStatus");
};
export const checkDns = async () => {
  return await ipc.callMain("checkDns");
};
export const checkServer = async (option: CheckingOption) => {
  return await ipc.callMain("checkServer", option);
};

//TODO:refactor
export const checkInternet = async () => {
  return await ipc.callMain("checkInternet");
};

export const subscribeFlow = (
  listener: (event: IpcRendererEvent, flow: FlowData) => void
) => ipcRenderer.on("proxy-flow", listener);
export const unsubscribeFlow = (
  listener: (event: IpcRendererEvent, flow: FlowData) => void
  //RemoveAllListeners is disabled here.It will remove other subscriptions in use.
) => ipcRenderer.removeListener("proxy-flow", listener);

export const subscribeMessage = (
  listener: (event: IpcRendererEvent, message: string) => void
) => ipcRenderer.on("proxy-message", listener);
export const unsubscribeMessage = () =>
  ipcRenderer.removeAllListeners("proxy-message");

export const subscribeDisconnected = (listener: () => void) =>
  ipcRenderer.on("proxy-disconnected", listener);
export const unsubscribeDisconnected = () =>
  ipcRenderer.removeAllListeners("proxy-disconnected");

export const getBuildInRules = async () =>
  await ipc.callMain("getBuildInRules");

export const startProxy = async () => await ipc.callMain("start");
export const stopProxy = async () => await ipc.callMain("stop");
export const changeServer = async () => await ipc.callMain("changeServer");

export const hideWindow = () => ipcRenderer.send("hideWindow");

export const getAppVersion = async () => await ipc.callMain("getAppVersion");

export const setRunAtSystemStartup = () =>
  ipcRenderer.send("setRunAtSystemStartup");

export const openLogFile = () => ipcRenderer.send("openLogFile");

export const updateSubscription = async (url: string) => {
  const nodes = await ipc.callMain("fetchSubscription", url);
  const shadowsockses = decodeSsUrl(nodes as string);

  return shadowsockses.map((shadowsocks) => ({
    ...shadowsocks,
    regionCode: "Auto",
    id: uuid(),
  }));
};
export const getRegionCodeFromGeoIp = async (host: string) => {
  try {
    return await ipc.callMain("getRegionCode", host);
  } catch {
    return undefined;
  }
};
export const localize = (translation: { [key: string]: string }) => {
  ipcRenderer.send("localize", translation);
};
