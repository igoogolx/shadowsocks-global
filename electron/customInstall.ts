import sudo from "sudo-prompt";
import path from "path";
import { getResourcesPath } from "./utils";

const sudoPromise = (cmd: string) =>
  new Promise((resolve, reject) => {
    sudo.exec(cmd, { name: "ShadowsocksGlobal" }, function(error) {
      if (error) reject(error);
      else {
        resolve();
      }
    });
  });

export const installTapDevice = async () => {
  const pathToBatFile = path.join(getResourcesPath(), "add_tap_device.bat");
  await sudoPromise(pathToBatFile);
};

export const installWindowsService = async () => {
  const pathToBatFile = path.join(
    getResourcesPath(),
    "install_windows_service.bat"
  );
  await sudoPromise(pathToBatFile);
};
