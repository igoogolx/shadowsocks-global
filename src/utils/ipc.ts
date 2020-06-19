import { ipcRenderer as ipc } from "electron-better-ipc";
import { store } from "../store/store";

export const checkUpdStatus = async () => {
  const port = store.getState().setting.general.shadowsocksLocalPort;
  return await ipc.callMain("checkUdpStatus", port);
};
