import { BrowserWindow, Menu, nativeImage } from "electron";
import { app } from "electron";
import path from "path";
import fs from "fs";
import { DNS_SMART_TYPE, SMART_DNS_ADDRESS } from "../src/constants";
import {
  GLOBAL_PROXY_ROUTES,
  GLOBAL_RESERVED_ROUTES,
  SMART_DNS_WHITE_LIST_SERVERS
} from "./constant";
import { lookupIp } from "../src/share";
import Store from "electron-store";
import { AppState } from "../src/reducers/rootReducer";
import { getActivatedServer } from "../src/components/Proxies/util";

function createTrayIconImage(imageName: string) {
  const image = nativeImage.createFromPath(
    path.join(app.getAppPath(), "resources", "tray", imageName)
  );
  if (image.isEmpty()) {
    throw new Error(`cannot find ${imageName} tray icon image`);
  }
  return image;
}
export const trayIconImages = {
  connected: createTrayIconImage("connected.png"),
  disconnected: createTrayIconImage("disconnected.png")
};
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

export const getConfig = async () => {
  const appConfig = new Store();
  const state = appConfig.get("state") as AppState;
  console.log(state);
  const activatedServer = getActivatedServer(state.proxy);

  const serverIp = await lookupIp(activatedServer.host);
  let dnsServers: string[],
    dnsWhiteListServers: string[],
    proxyRoutes: string[],
    reservedRoutes = [serverIp + "/32"];
  //Proxy rule
  const currentRule = state.setting.rule.current;
  if (state.setting.rule.current === "Global") {
    proxyRoutes = GLOBAL_PROXY_ROUTES;
    reservedRoutes = [...reservedRoutes, ...GLOBAL_RESERVED_ROUTES];
  } else {
    const defaultRuleDirPath = path.join(getResourcesPath(), "defaultRules");
    const defaultRulePaths = await fs.promises.readdir(defaultRuleDirPath);
    let rulePath = defaultRulePaths.find(
      rulePath => path.basename(rulePath, ".rules") === currentRule
    );
    if (!rulePath && state.setting.rule.dirPath) {
      const customizedRulePaths = await fs.promises.readdir(
        state.setting.rule.dirPath
      );
      rulePath = customizedRulePaths.find(
        rulePath => path.basename(rulePath, ".rules") === currentRule
      );
    }
    if (!rulePath) throw new Error("The rule is invalid");
    const customizedRule = await readRule(rulePath);
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
  const dns = state.setting.dns;
  if (dns.type === DNS_SMART_TYPE) {
    dnsServers = [SMART_DNS_ADDRESS];
    dnsWhiteListServers = SMART_DNS_WHITE_LIST_SERVERS;
    if (dns.smart.defaultWebsite.isProxy) {
      proxyRoutes = [
        ...proxyRoutes,
        dns.smart.defaultWebsite.dns.alternateServer + "/32",
        dns.smart.defaultWebsite.dns.preferredServer + "/32"
      ];
    } else {
      reservedRoutes = [
        ...reservedRoutes,
        dns.smart.defaultWebsite.dns.preferredServer + "/32",
        dns.smart.defaultWebsite.dns.alternateServer + "/32"
      ];
    }
    if (dns.smart.nativeWebsite.isProxy) {
      proxyRoutes = [
        ...proxyRoutes,
        dns.smart.nativeWebsite.dns.alternateServer + "/32",
        dns.smart.nativeWebsite.dns.preferredServer + "/32"
      ];
    } else {
      reservedRoutes = [
        ...reservedRoutes,
        dns.smart.nativeWebsite.dns.preferredServer + "/32",
        dns.smart.nativeWebsite.dns.alternateServer + "/32"
      ];
    }
    //Customized Dns
  } else {
    dnsWhiteListServers = dnsServers = [
      dns.customized.preferredServer,
      dns.customized.alternateServer
    ];
    if (dns.customized.isProxy) {
      proxyRoutes = [
        ...proxyRoutes,
        dns.customized.preferredServer + "/32",
        dns.customized.alternateServer + "/32"
      ];
    } else {
      reservedRoutes = [
        ...reservedRoutes,
        dns.customized.preferredServer + "/32",
        dns.customized.alternateServer + "/32"
      ];
    }
  }

  const proxy: string[] = [],
    reserved: string[] = [];
  const additionalRoutes = state.setting.rule.additionRoutes;
  additionalRoutes.forEach(route => {
    if (route.isProxy) proxy.push(route.ip);
    else reserved.push(route.ip);
  });

  proxyRoutes = [...proxyRoutes, ...proxy.map(ip => ip + "/32")];
  reservedRoutes = [...reservedRoutes, ...reserved.map(ip => ip + "/32")];

  return {
    route: { proxy: proxyRoutes, reserved: reservedRoutes },
    dns: { servers: dnsServers, whiteListServers: dnsWhiteListServers },
    isProxyUdp: state.setting.general.isProxyUdp,
    remoteServer: {
      ...activatedServer,
      proxyPort: state.setting.general.shadowsocksLocalPort
    }
  };
};
