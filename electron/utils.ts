import { BrowserWindow, Menu } from "electron";
import { app } from "electron";
import path from "path";
import fs from "fs";
import { Dns } from "./process_manager";
import { DNS_SMART_TYPE, SMART_DNS_ADDRESS } from "../src/constants";
import {
  GLOBAL_PROXY_ROUTES,
  GLOBAL_RESERVED_ROUTES,
  SMART_DNS_WHITE_LIST_SERVERS
} from "./constant";
import { AdditionalRoute } from "./main";
import { lookupIp } from "../src/share";

export const setMenu = (mainWindow: BrowserWindow) => {
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.on("context-menu", (e, props) => {
      const { x, y } = props;
      Menu.buildFromTemplate([
        {
          label: "Inspect element",
          click: () => {
            mainWindow.webContents.inspectElement(x, y);
          }
        }
      ]).popup({ window: mainWindow });
    });
  } else {
    mainWindow.removeMenu();
  }
};

export const installExtensions = async () => {
  const devtoolsInstaller = require("electron-devtools-installer");
  const extensions = [
    devtoolsInstaller.REACT_DEVELOPER_TOOLS,
    devtoolsInstaller.REDUX_DEVTOOLS
  ];
  await Promise.all(extensions.map(name => devtoolsInstaller.default(name)));
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

  proxyPort?: number;
}
const isDev = process.env.NODE_ENV === "development";

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

export const getConfig = async (
  serverHost: string,
  rule: { type: "Global" } | { type: "Customized"; path: string },
  dns: Dns,
  additionalRoutes: AdditionalRoute
) => {
  const serverIp = await lookupIp(serverHost);
  let dnsServers: string[],
    dnsWhiteListServers: string[],
    proxyRoutes: string[],
    reservedRoutes = [serverIp + "/32"];
  //Proxy rule
  if (rule.type === "Global") {
    proxyRoutes = GLOBAL_PROXY_ROUTES;
    reservedRoutes = [...reservedRoutes, ...GLOBAL_RESERVED_ROUTES];
  } else {
    const customizedRule = await readRule(rule.path);
    if (customizedRule.isProxy) {
      proxyRoutes = customizedRule.subnets;
    } else {
      proxyRoutes = GLOBAL_PROXY_ROUTES;
      reservedRoutes = [
        ...reservedRoutes,
        ...GLOBAL_RESERVED_ROUTES,
        ...customizedRule.subnets
      ];
    }
  }
  //Smart Dns
  if (dns.type === DNS_SMART_TYPE) {
    dnsServers = [SMART_DNS_ADDRESS];
    dnsWhiteListServers = SMART_DNS_WHITE_LIST_SERVERS;
    if (dns.defaultWebsite.isProxy) {
      proxyRoutes = [
        ...proxyRoutes,
        dns.defaultWebsite.alternateServer + "/32",
        dns.defaultWebsite.preferredServer + "/32"
      ];
    } else {
      reservedRoutes = [
        ...reservedRoutes,
        dns.defaultWebsite.preferredServer + "/32",
        dns.defaultWebsite.alternateServer + "/32"
      ];
    }
    if (dns.nativeWebsite.isProxy) {
      proxyRoutes = [
        ...proxyRoutes,
        dns.nativeWebsite.alternateServer + "/32",
        dns.nativeWebsite.preferredServer + "/32"
      ];
    } else {
      reservedRoutes = [
        ...reservedRoutes,
        dns.nativeWebsite.preferredServer + "/32",
        dns.nativeWebsite.alternateServer + "/32"
      ];
    }
    //Customized Dns
  } else {
    dnsWhiteListServers = dnsServers = [
      dns.preferredServer,
      dns.alternateServer
    ];
    if (dns.isProxy) {
      proxyRoutes = [
        ...proxyRoutes,
        dns.preferredServer + "/32",
        dns.alternateServer + "/32"
      ];
    } else {
      reservedRoutes = [
        ...reservedRoutes,
        dns.preferredServer + "/32",
        dns.alternateServer + "/32"
      ];
    }
  }

  proxyRoutes = [
    ...proxyRoutes,
    ...additionalRoutes.proxy.map(ip => ip + "/32")
  ];
  reservedRoutes = [
    ...reservedRoutes,
    ...additionalRoutes.reserved.map(ip => ip + "/32")
  ];

  return {
    route: { proxy: proxyRoutes, reserved: reservedRoutes },
    dns: { servers: dnsServers, whiteListServers: dnsWhiteListServers }
  };
};
