import { Shadowsocks } from "../reducers/proxyReducer";

type Server = Omit<Shadowsocks, "id" | "regionCode">;

const decodeBase64 = (base64String: string) =>
  Buffer.from(base64String, "base64").toString("utf8");

const parseLegacyURL = (url: string) => {
  let server: Server = {
    host: "",
    port: 0,
    password: "",
    method: "",
    name: ""
  };
  const UrlFinder = new RegExp(
    "ss://(?<base64>[A-Za-z0-9+-/=_]+)(?:#(?<tag>\\S+))?",
    "i"
  );
  const DetailsParser = new RegExp(
    "^((?<method>.+?):(?<password>.*)@(?<hostname>.+?):(?<port>\\d+?))$",
    "i"
  );

  const match = UrlFinder.exec(url);
  if (!match) return null;
  const base64 = match.groups && match.groups["base64"].replace("/", "");
  const tag = match.groups && match.groups["tag"];
  if (tag) server.name = tag;
  try {
    const details = base64 && DetailsParser.exec(decodeBase64(base64));
    if (!details) return null;
    server = { ...server, ...details.groups };
  } catch (e) {
    return null;
  }
  return server;
};

export const decodeSsUrl = (url: string) => {
  const serverUrls = url.split(/[\n\r ]/);
  const shadowsockses = serverUrls.map(url => {
    if (!url.startsWith("ss://")) return null;
    const legacyServer = parseLegacyURL(url);
    if (legacyServer) return legacyServer;
    const config: Server = {
      host: "",
      port: 0,
      password: "",
      plugin: "",
      method: "",
      name: "",
      plugin_opts: ""
    };
    try {
      const serverURL = new URL(
        decodeURIComponent(url.replace(/^ss/g, "http"))
      );
      const base64 = serverURL.username;
      const [method, password] = decodeBase64(base64).split(":");
      config.method = method;
      config.password = password;
      config.host = serverURL.hostname;
      config.port = Number(serverURL.port);
      config.name = decodeURIComponent(serverURL.hash).split("#")[1] || "";
      const pluginParts = serverURL.search.split(/;(.+)?/, 2);
      config.plugin = pluginParts[0].split("=")[1] || "";
      config.plugin_opts = pluginParts[1] || "";
      return config;
    } catch (e) {
      return null;
    }
  });
  let filteredShadowsocks: Server[] = [];
  shadowsockses.forEach(shadowsocks => {
    if (shadowsocks) filteredShadowsocks.push(shadowsocks);
  });

  return filteredShadowsocks;
};

const encodeBase64 = (str: string) =>
  Buffer.from(str, "utf8").toString("base64");

export const encodeSsUrl = (server: Server) => {
  let url = "";
  if (!server.plugin) {
    const parts = `${server.method}:${server.password}@${server.host}:${server.port}`;
    url = encodeBase64(parts);
  } else {
    const base64 = encodeBase64(`${server.method}:${server.password}`);
    const webSafeBase64 = base64
      .replace("+", "-")
      .replace("/", "_")
      .replace(/=*$/g, "");
    const pluginPart = server.plugin_opts
      ? `${server.plugin};${server.plugin_opts}`
      : server.plugin;
    url = `${webSafeBase64}@${server.host}:${
      server.port
    }/?plugin=${encodeURIComponent(pluginPart)}`;
    if (server.name) {
      const tags = encodeURIComponent(server.name);
      url = `${url}#${tags}`;
    }
  }
  return `ss://${url}`;
};
