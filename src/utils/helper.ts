import regions from "i18n-iso-countries";
import path from "path";
import ip2region from "./ip2region";
import promiseIpc from "electron-promise-ipc";
import * as dns from "dns";

const DNS_LOOKUP_TIMEOUT_MS = 2000;

export function timeoutPromise<T = any>(
  promise: Promise<any>,
  ms: number,
  name = ""
): Promise<T> {
  let winner: Promise<any>;
  const timeout = new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      clearTimeout(timeoutId);
      if (winner) {
        console.log(`Promise "${name}" resolved before ${ms} ms.`);
        resolve();
      } else {
        console.log(`Promise "${name}" timed out after ${ms} ms.`);
        reject("Promise timeout");
      }
    }, ms);
  });
  winner = Promise.race([promise, timeout]);
  return winner;
}

regions.registerLocale(require("i18n-iso-countries/langs/zh.json"));

// Uses the OS' built-in functions, i.e. /etc/hosts, et al.:
// https://nodejs.org/dist/latest-v10.x/docs/api/dns.html#dns_dns
// Effectively a no-op if hostname is already an IP.
export function lookupIp(hostname: string) {
  return timeoutPromise<string>(
    new Promise<string>((fulfill, reject) => {
      dns.lookup(hostname, 4, (e, address) => {
        if (e || !address) {
          return reject("could not resolve proxy server hostname");
        }
        fulfill(address);
      });
    }),
    DNS_LOOKUP_TIMEOUT_MS,
    "DNS lookup"
  );
}

export const lookupRegionCodes = async (hosts: string[]) => {
  const ips = await Promise.all(
    hosts.map(async host => {
      try {
        return await lookupIp(host);
      } catch {
        return null;
      }
    })
  );
  // @ts-ignore
  const resourcesPath = await promiseIpc.send("getResourcesPath");
  const searcher = ip2region.create(
    path.join(resourcesPath, "third_party", "ip2region", "ip2region.db")
  );
  const regionCodes = await Promise.all(
    ips.map(
      ip =>
        new Promise<string | undefined>(fulfill => {
          if (!ip) return undefined;
          searcher.btreeSearch(
            ip,
            (err: null | Error, result: null | { region: string }) => {
              if (err) return fulfill(undefined);
              if (result) {
                if (result.region.includes("香港")) return fulfill("HK");
                if (result.region.includes("澳门")) return fulfill("MO");
                if (result.region.includes("台湾")) return fulfill("TW");
                else {
                  console.log(
                    regions.getAlpha2Code(result.region.split("|")[0], "zh")
                  );
                  return fulfill(
                    regions.getAlpha2Code(result.region.split("|")[0], "zh")
                  );
                }
              } else return fulfill(undefined);
            }
          );
        })
    )
  );
  searcher.destroy();
  return regionCodes;
};

export function financial(x: number, fractionDigits = 2) {
  return Number(Number.parseFloat(x.toString()).toFixed(fractionDigits));
}

export const convertTrafficData = (data: number) => {
  if (data < 1024) return `${financial(data)} B`;
  if (data < 1024 * 1024) return `${financial(data / 1024)} KB`;
  else return `${financial(data / 1024 / 1024)} MB`;
};
