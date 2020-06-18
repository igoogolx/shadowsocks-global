import { Menu } from "electron";
import { app } from "electron";
import path from "path";
import { getActivatedServer, lookupIp, SMART_DNS_ADDRESS } from "./share";
import Store from "electron-store";
import { AppState } from "../reducers/rootReducer";
import detectPort from "detect-port";
import { mainWindow } from "./common";
import fs from "fs";
const geoip = require("geoip-country");

const appConfig = new Store();
export const getAppState = () => appConfig.get("state") as AppState;

export const setMenu = () => {
  if (process.env.NODE_ENV === "development") {
    mainWindow.get()?.webContents.on("context-menu", (e, props) => {
      const { x, y } = props;
      Menu.buildFromTemplate([
        {
          label: "Inspect element",
          click: () => {
            mainWindow.get()?.webContents.inspectElement(x, y);
          },
        },
      ]).popup({ window: mainWindow.get() });
    });
  } else {
    mainWindow.get()?.removeMenu();
  }
};

export const installExtensions = async () => {
  const devtoolsInstaller = require("electron-devtools-installer");
  const extensions = [
    devtoolsInstaller.REACT_DEVELOPER_TOOLS,
    devtoolsInstaller.REDUX_DEVTOOLS,
  ];
  await Promise.all(extensions.map((name) => devtoolsInstaller.default(name)));
};

export interface RemoteServer {
  type: "shadowsocks";
  host: string;
  port: number;

  name?: string;

  method?: string;
  password?: string;

  plugin?: string;
  plugin_opts?: string;

  local_port?: number;
}
export const isDev = process.env.NODE_ENV === "development";

export const getResourcesPath = () => {
  const appPath = app.getAppPath();
  return isDev ? appPath : appPath.replace("app.asar", "app.asar.unpacked");
};
export const getBuildInRuleDirPath = () =>
  path.join(getResourcesPath(), "rule");

export function pathToEmbeddedBinary(toolName: string, filename: string) {
  return path.join(
    getResourcesPath(),
    "third_party",
    toolName,
    filename + ".exe"
  );
}

export class Config {
  private state = getAppState();

  getIsDnsOverUdp = () => {
    return this.state.setting.general.DnsOverUdp;
  };

  getDns = () => {
    let whiteListServers;
    //Smart Dns
    const dns = this.state.setting.dns;
    whiteListServers = [SMART_DNS_ADDRESS, dns.local, dns.remote];
    return {
      server: dns,
      whiteListServers,
    };
  };
  getRule = async () => {
    const ruleName = this.state.setting.rule.current;
    const buildInRuleDirPath = getBuildInRuleDirPath();
    const buildInRuleNames = await fs.promises.readdir(buildInRuleDirPath);
    const buildInRulePaths = buildInRuleNames.map((name) =>
      path.join(buildInRuleDirPath, name)
    );
    const customizedDirPath = this.state.setting.rule.dirPath;
    let ruleFilePath = buildInRulePaths.find(
      (rulePath) => path.basename(rulePath, ".json") === ruleName
    );
    if (!ruleFilePath && customizedDirPath) {
      const customizedRuleNames = await fs.promises.readdir(customizedDirPath);
      const customizedRulePaths = customizedRuleNames.map((name) =>
        path.join(customizedDirPath, name)
      );
      ruleFilePath = customizedRulePaths.find(
        (rulePath) => path.basename(rulePath, ".json") === ruleName
      );
    }
    if (!ruleFilePath) throw new Error("Fail to find the file");
    return ruleFilePath;
  };

  getProxyServer = async () => {
    let activatedServer = getActivatedServer(this.state.proxy);
    const serverIp = await lookupIp(activatedServer.host);
    const isShadowsocks = activatedServer.type === "shadowsocks";
    const ssLocalPort = Number(this.state.setting.general.shadowsocksLocalPort);
    activatedServer = { ...activatedServer, host: serverIp };
    if (isShadowsocks) {
      const _port = await detectPort(ssLocalPort);
      if (Number(_port) !== ssLocalPort)
        throw new Error(
          `port: ${ssLocalPort} was occupied, try port: ${_port}`
        );
    }
    return isShadowsocks
      ? {
          ...activatedServer,
          local_port: this.state.setting.general.shadowsocksLocalPort,
        }
      : activatedServer;
  };
}

export const lookupRegionCode = async (host: string) => {
  try {
    const ip = await lookupIp(host);
    return await new Promise<string | undefined>((fulfill) => {
      if (!ip) fulfill(undefined);
      const result = geoip.lookup(ip);
      if (result) fulfill(result.country);
      else fulfill(undefined);
    });
  } catch {
    return undefined;
  }
};
