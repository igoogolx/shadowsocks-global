import { BrowserWindow } from "electron";

const creatMainWindow = () => {
  let mainWindow: BrowserWindow | undefined = undefined;
  const get = () => {
    return mainWindow;
  };
  const set = (value: BrowserWindow | undefined) => {
    mainWindow = value;
  };
  return {
    get,
    set,
  };
};

export const mainWindow = creatMainWindow();
