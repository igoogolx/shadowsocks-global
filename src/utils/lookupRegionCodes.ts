import regions from "i18n-iso-countries";
import { lookupIp } from "./connectivity";
import path from "path";
import ip2region from "./ip2region";
import promiseIpc from "electron-promise-ipc";

regions.registerLocale(require("i18n-iso-countries/langs/zh.json"));

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
