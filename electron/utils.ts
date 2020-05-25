import { Menu } from "electron";
import { app } from "electron";
import path from "path";
import fs from "fs";
import { DNS_SMART_TYPE, SMART_DNS_ADDRESS } from "../src/constants";
import { GLOBAL_PROXY_ROUTES, GLOBAL_RESERVED_ROUTES } from "./constant";
import {
  BUILD_IN_RULE_BYPASS_MAINLAND_CHINA,
  BUILD_IN_RULE_GLOBAL,
  lookupIp,
} from "../src/share";
import Store from "electron-store";
import { AppState } from "../src/reducers/rootReducer";
import { getActivatedServer } from "../src/components/Proxies/util";
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
export function pathToConfig(toolName: string, filename: string) {
  return path.join(getResourcesPath(), "third_party", toolName, filename);
}

export const readRule = async (path: string) => {
  const rulesString = await fs.promises.readFile(path, "utf8");
  const stats = await fs.promises.stat(path);
  const fileSizeInKb = stats["size"] / 1000;
  console.log(fileSizeInKb);
  if (fileSizeInKb > 100)
    throw new Error("The rule file's size must be smaller than 100KB");
  const rules = rulesString.trim().split("\n");
  //According to the rule, the first line is the comment: #[english_name],[chinese_name],[isProxy:0|1]. For "isProxy", 0 means true, while 1 means false.
  const isProxy = rules[0].split(",")[2] === "0";
  return { isProxy, subnets: rules.slice(1) };
};

export class Config {
  private state = getAppState();

  getIsUdpEnabled = () => {
    return this.state.setting.general.isProxyUdp;
  };

  getDns = () => {
    let dnsServer;
    let whiteListServers;
    //Smart Dns
    const dns = this.state.setting.dns;
    if (dns.type === DNS_SMART_TYPE) {
      const defaultServer = dns.smart.defaultWebsite.server;
      const nativeServer = dns.smart.nativeWebsite.server;
      dnsServer = {
        type: "smart",
        server: { native: nativeServer, default: defaultServer },
      };
      whiteListServers = [SMART_DNS_ADDRESS, defaultServer, nativeServer];

      //Customized Dns
    } else {
      const preferredServer = dns.customized.preferredServer;
      const alternateServer = dns.customized.alternateServer;
      dnsServer = {
        type: "customized",
        server: { preferred: preferredServer, alternate: alternateServer },
      };
      whiteListServers = [preferredServer, alternateServer];
    }

    return { ...dnsServer, whiteListServers };
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
    if (dns.type === DNS_SMART_TYPE) {
      const defaultServer = dns.smart.defaultWebsite.server;
      const nativeServer = dns.smart.nativeWebsite.server;

      if (dns.smart.defaultWebsite.isProxy) {
        proxy = [...proxy, defaultServer + "/32"];
      } else {
        reserved = [...reserved, defaultServer + "/32"];
      }
      if (dns.smart.nativeWebsite.isProxy) {
        proxy = [...proxy, nativeServer + "/32"];
      } else {
        reserved = [...reserved, nativeServer + "/32"];
      }
      //Customized Dns
    } else {
      const preferredServer = dns.customized.preferredServer;
      const alternateServer = dns.customized.alternateServer;
      if (dns.customized.isProxy) {
        proxy = [...proxy, preferredServer + "/32", alternateServer + "/32"];
      } else {
        reserved = [
          ...reserved,
          preferredServer + "/32",
          alternateServer + "/32",
        ];
      }
    }

    return { proxy, reserved };
  };
}

export const DNS_NATIVE_WEBSITES_FILE_PATH = path.join(
  getResourcesPath(),
  "acl",
  "gfwlist.acl"
);
