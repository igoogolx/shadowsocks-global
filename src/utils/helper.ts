import { decodeSsUrl } from "./url";
import { v4 as uuid } from "uuid";
import { ipcRenderer } from "electron-better-ipc";

export const updateSubscription = async (url: string) => {
  const nodes = await ipcRenderer.callMain("fetchSubscription", url);
  const shadowsockses = decodeSsUrl(nodes as string);

  return shadowsockses.map((shadowsocks) => ({
    ...shadowsocks,
    regionCode: "Auto",
    id: uuid(),
  }));
};

export const getRegionCodeFromGeoIp = async (host: string) => {
  try {
    return await ipcRenderer.callMain("getRegionCode", host);
  } catch {
    return undefined;
  }
};
