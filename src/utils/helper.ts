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

export const lookupRegionCodes = async (hosts: string[]) => {
  const ips = await Promise.all(
    hosts.map(async (host) => {
      try {
        return await lookupIp(host);
      } catch {
        return null;
      }
    })
  );
  return await Promise.all(
    ips.map(
      (ip) =>
        new Promise<string | undefined>((fulfill) => {
          if (!ip) fulfill(undefined);
          const result = geoip.lookup(ip);
          if (result) fulfill(result.country);
          else fulfill(undefined);
        })
    )
  );
};

const KB = 1024;
const MB = 1024 * KB;
const GB = 1024 * MB;
export const convertTrafficData = (data: number) => {
  function financial(x: number, fractionDigits = 2) {
    return Number(Number.parseFloat(x.toString()).toFixed(fractionDigits));
  }
  if (data < KB) return `${financial(data)} B`;
  if (data < MB) return `${financial(data / KB)} KB`;
  if (data < GB) return `${financial(data / MB)} MB`;
  else return `${financial(data / GB)} GB`;
};

export const updateSubscription = async (url: string) => {
  const nodesBase64 = await axios(url, {
    timeout: UPDATE_SUBSCRIPTIONS_TIMEOUT_MS,
  });
  const nodes = Buffer.from(nodesBase64.data, "base64").toString();
  const shadowsockses = decodeSsUrl(nodes);
  const hosts = shadowsockses.map((shadowsocks) => shadowsocks.host);
  const regionCodes = await lookupRegionCodes(hosts);

  return shadowsockses.map((shadowsocks, index) => ({
    ...shadowsocks,
    regionCode: regionCodes[index],
    id: uuid(),
  }));
};

class Ping extends EventEmitter {}
export const pingEventEmitter = new Ping();
