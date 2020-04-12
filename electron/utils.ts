import { BrowserWindow, Menu, nativeImage } from "electron";
import { app } from "electron";
import path from "path";
import fs from "fs";
import { DNS_SMART_TYPE, SMART_DNS_ADDRESS } from "../src/constants";
import { GLOBAL_PROXY_ROUTES, GLOBAL_RESERVED_ROUTES } from "./constant";
import { lookupIp } from "../src/share";
import Store from "electron-store";
import { AppState } from "../src/reducers/rootReducer";
import { getActivatedServer } from "../src/components/Proxies/util";
import detectPort from "detect-port";

const appConfig = new Store();
export const getAppConfig = () => appConfig.get("state") as AppState;
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
  disconnected: createTrayIconImage("disconnected.png"),
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
          },
        },
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

export const getConfig = async () => {
  const state = getAppConfig();
  let activatedServer = getActivatedServer(state.proxy);
  const serverIp = await lookupIp(activatedServer.host);
  activatedServer = { ...activatedServer, host: serverIp };
  const shadowsocksLocalPort = state.setting.general.shadowsocksLocalPort;
  const isShadowsocks = activatedServer.type === "shadowsocks";
  if (isShadowsocks) {
    const _port = await detectPort(shadowsocksLocalPort);
    if (_port !== shadowsocksLocalPort)
      throw new Error(
        `port: ${shadowsocksLocalPort} was occupied, try port: ${_port}`
      );
  }
  let dnsServer: {},
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
    let rulePath;
    let rule = defaultRulePaths.find(
      (rulePath) => path.basename(rulePath, ".rules") === currentRule
    );

    if (rule) rulePath = path.join(defaultRuleDirPath, rule);
    if (!rule && state.setting.rule.dirPath) {
      const customizedRulePaths = await fs.promises.readdir(
        state.setting.rule.dirPath
      );
      rule = customizedRulePaths.find(
        (rulePath) => path.basename(rulePath, ".rules") === currentRule
      );
      if (rule) rulePath = path.join(state.setting.rule.dirPath, rule);
    }
    if (!rulePath) throw new Error("The rule is invalid");
    //Check whether rule path is valid
    await fs.promises.access(rulePath);
    const customizedRule = await readRule(rulePath);
    if (customizedRule.isProxy) {
      proxyRoutes = customizedRule.subnets;
    } else {
      proxyRoutes = GLOBAL_PROXY_ROUTES;
      reservedRoutes = [
        ...reservedRoutes,
        ...GLOBAL_RESERVED_ROUTES,
        ...customizedRule.subnets,
      ];
    }
  }
  //Smart Dns
  const dns = state.setting.dns;
  if (dns.type === DNS_SMART_TYPE) {
    const defaultServer = dns.smart.defaultWebsite.server;
    const nativeServer = dns.smart.nativeWebsite.server;
    dnsServer = {
      type: "smart",
      server: { native: nativeServer, default: defaultServer },
    };
    dnsWhiteListServers = [SMART_DNS_ADDRESS, defaultServer, nativeServer];
    if (dns.smart.defaultWebsite.isProxy) {
      proxyRoutes = [...proxyRoutes, defaultServer + "/32"];
    } else {
      reservedRoutes = [...reservedRoutes, defaultServer + "/32"];
    }
    if (dns.smart.nativeWebsite.isProxy) {
      proxyRoutes = [...proxyRoutes, nativeServer + "/32"];
    } else {
      reservedRoutes = [...reservedRoutes, nativeServer + "/32"];
    }
    //Customized Dns
  } else {
    const preferredServer = dns.customized.preferredServer;
    const alternateServer = dns.customized.alternateServer;
    dnsServer = {
      type: "customized",
      server: { preferred: preferredServer, alternate: alternateServer },
    };
    dnsWhiteListServers = [preferredServer, alternateServer];
    if (dns.customized.isProxy) {
      proxyRoutes = [
        ...proxyRoutes,
        preferredServer + "/32",
        alternateServer + "/32",
      ];
    } else {
      reservedRoutes = [
        ...reservedRoutes,
        preferredServer + "/32",
        alternateServer + "/32",
      ];
    }
  }

  const proxy: string[] = [],
    reserved: string[] = [];
  const additionalRoutes = state.setting.rule.additionalRoutes;
  additionalRoutes.forEach((route) => {
    if (route.isProxy) proxy.push(route.ip);
    else reserved.push(route.ip);
  });

  proxyRoutes = [...proxyRoutes, ...proxy.map((ip) => ip + "/32")];
  reservedRoutes = [...reservedRoutes, ...reserved.map((ip) => ip + "/32")];

  return {
    rule: state.setting.rule.current,
    route: { proxy: proxyRoutes, reserved: reservedRoutes },
    dns: { ...dnsServer, whiteListServers: dnsWhiteListServers },
    isProxyUdp: state.setting.general.isProxyUdp,
    remoteServer: isShadowsocks
      ? {
          ...activatedServer,
          local_port: state.setting.general.shadowsocksLocalPort,
        }
      : activatedServer,
  };
};

export const DNS_NATIVE_WEBSITES_FILE_PATH = pathToConfig(
  "unbound",
  "accelerated-domains.china.raw.txt"
);
