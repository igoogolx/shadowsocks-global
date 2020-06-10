import { Menu } from "electron";
import { app } from "electron";
import path from "path";
import fs from "fs";
import { GLOBAL_PROXY_ROUTES, GLOBAL_RESERVED_ROUTES } from "./constant";
import {
  BUILD_IN_RULE_BYPASS_MAINLAND_CHINA,
  BUILD_IN_RULE_GLOBAL,
  getActivatedServer,
  lookupIp,
  SMART_DNS_ADDRESS,
} from "./share";
import Store from "electron-store";
import { AppState } from "../reducers/rootReducer";
import detectPort from "detect-port";
import { mainWindow } from "./common";
import { isIPv4 } from "net";

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
  type: "socks5" | "shadowsocks";
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

export function pathToEmbeddedBinary(toolName: string, filename: string) {
  return path.join(
    getResourcesPath(),
    "third_party",
    toolName,
    filename + ".exe"
  );
}

export const readRule = async (path: string) => {
  const rulesString = await fs.promises.readFile(path, "utf8");
  const stats = await fs.promises.stat(path);
  const fileSizeInKb = stats["size"] / 1000;
  if (fileSizeInKb > 100)
    throw new Error("The rule file's size must be smaller than 100KB");
  const rules = rulesString.trim().split("\n");
  //According to the rule, the first line is the comment: #[english_name],[chinese_name],[isProxy:0|1]. For "isProxy", 0 means true, while 1 means false.
  const isProxy = rules[0].split(",")[2] === "0";
  return { isProxy, subnets: rules.slice(1) };
};

export class Config {
  private state = getAppState();

  getIsDnsOverUdp = () => {
    return this.state.setting.general.DnsOverUdp;
  };

  getDns = () => {
    let whiteListServers;
    //Smart Dns
    const dns = this.state.setting.dns;
    whiteListServers = [
      SMART_DNS_ADDRESS,
      dns.default.server,
      dns.gfwList.server,
    ];
    return {
      server: { default: dns.default.server, gfwList: dns.gfwList.server },
      whiteListServers,
    };
  };

  getProxyServer = async () => {
    let activatedServer = getActivatedServer(this.state.proxy);
    const serverIp = await lookupIp(activatedServer.host);
    const isShadowsocks = activatedServer.type === "shadowsocks";
    const ssLocalPort = this.state.setting.general.shadowsocksLocalPort;
    activatedServer = { ...activatedServer, host: serverIp };
    if (isShadowsocks) {
      const _port = await detectPort(ssLocalPort);
      if (_port !== ssLocalPort)
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

  getRoutes = async () => {
    let activatedServer = getActivatedServer(this.state.proxy);
    const serverIp = await lookupIp(activatedServer.host);
    let proxy = [...GLOBAL_PROXY_ROUTES];
    let reserved = [serverIp + "/32", ...GLOBAL_RESERVED_ROUTES];
    const currentRule = this.state.setting.rule.current;
    switch (currentRule) {
      case BUILD_IN_RULE_GLOBAL:
        break;
      case BUILD_IN_RULE_BYPASS_MAINLAND_CHINA:
        {
          const ChinaIpsString = await fs.promises.readFile(
            path.join(getResourcesPath(), "acl", "chn.acl"),
            "utf8"
          );
          const ChinaIps = ChinaIpsString.split("\n").filter((line) => {
            const subnet = line.split("/");
            if (subnet.length !== 2) return false;
            return isIPv4(subnet[0]);
          });
          reserved = [...reserved, ...ChinaIps];
        }
        break;
      default: {
        let rulePath;
        let rule;
        const customizedRulesDirPath = this.state.setting.rule.dirPath;
        if (customizedRulesDirPath) {
          const customizedRulePaths = await fs.promises.readdir(
            customizedRulesDirPath
          );
          rule = customizedRulePaths.find(
            (rulePath) => path.basename(rulePath, ".rules") === currentRule
          );
          if (rule) rulePath = path.join(customizedRulesDirPath, rule);
        }
        if (!rulePath) throw new Error("The rule is invalid");
        //Check whether rule path is valid
        await fs.promises.access(rulePath);
        const customizedRule = await readRule(rulePath);
        if (customizedRule.isProxy) {
          proxy = customizedRule.subnets;
        } else {
          reserved = [...reserved, ...customizedRule.subnets];
        }
      }
    }

    //Smart Dns
    const dns = this.state.setting.dns;
    if (dns.default.isProxy) {
      proxy = [...proxy, dns.default.server + "/32"];
    } else {
      reserved = [...reserved, dns.default.server + "/32"];
    }
    if (dns.gfwList.isProxy) {
      proxy = [...proxy, dns.gfwList.server + "/32"];
    } else {
      reserved = [...reserved, dns.gfwList.server + "/32"];
    }
    return { proxy, reserved };
  };
}

export const GFW_LIST_FILE_PATH = path.join(
  getResourcesPath(),
  "acl",
  "gfwlist.acl"
);
