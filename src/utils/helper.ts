import { financial, lookupIp } from "../share";

//@ts-ignore
import geoip from "geoip-country";

// Uses the OS' built-in functions, i.e. /etc/hosts, et al.:
// https://nodejs.org/dist/latest-v10.x/docs/api/dns.html#dns_dns

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
  return await Promise.all(
    ips.map(
      ip =>
        new Promise<string | undefined>(fulfill => {
          if (!ip) return undefined;
          const result = geoip.lookup(ip);
          if (result) fulfill(result.country);
        })
    )
  );
};

export const convertTrafficData = (data: number) => {
  if (data < 1024) return `${financial(data)} B`;
  if (data < 1024 * 1024) return `${financial(data / 1024)} KB`;
  else return `${financial(data / 1024 / 1024)} MB`;
};
