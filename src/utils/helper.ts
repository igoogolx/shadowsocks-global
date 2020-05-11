import { lookupIp } from "../share";
import EventEmitter from "events";
//@ts-ignore
import geoip from "geoip-country";
import axios from "axios";
import { decodeSsUrl } from "./url";
import { v4 as uuid } from "uuid";

const UPDATE_SUBSCRIPTIONS_TIMEOUT_MS = 5000;

// Uses the OS' built-in functions, i.e. /etc/hosts, et al.:
// https://nodejs.org/dist/latest-v10.x/docs/api/dns.html#dns_dns

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

export const updateSubscription = async (url: string) => {
  const nodesBase64 = await axios(url, {
    timeout: UPDATE_SUBSCRIPTIONS_TIMEOUT_MS,
  });
  const nodes = Buffer.from(nodesBase64.data, "base64").toString();
  const shadowsockses = decodeSsUrl(nodes);

  return shadowsockses.map((shadowsocks) => ({
    ...shadowsocks,
    regionCode: "Auto",
    id: uuid(),
  }));
};

class Ping extends EventEmitter {}
export const pingEventEmitter = new Ping();
