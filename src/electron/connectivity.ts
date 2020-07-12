import net from "net";
import dns from "dns";
import { timeoutPromise } from "./utils";

const DNS_TEST_SERVER = "8.8.8.8";
const DNS_TEST_DOMAIN = "google.com";
const TEST_TIMEOUT_MS = 2000;
export type CheckingOption = {
  address: string;
  port: number;
  attempts: number;
};
const check = (address: string, port: number) =>
  new Promise<number>((resolve, reject) => {
    const s = new net.Socket();
    const startTime = Date.now();
    s.connect(port, address, function () {
      const endTime = Date.now();
      const time = endTime - startTime;
      resolve(time);
      s.destroy();
    });
    s.on("error", function (e) {
      reject(e);
      s.destroy();
    });
    s.setTimeout(TEST_TIMEOUT_MS, function () {
      reject("Timeout");
      s.destroy();
    });
  });
export const checkServer = async (option: CheckingOption) => {
  const { address = "localhost", port = 80, attempts } = option;
  for (let i = 0; i < attempts; i++) {
    try {
      return await check(address, port);
    } catch (e) {}
  }
  throw new Error("ss-server is not reachable ");
};
//Measure dns lookup's time(millisecond)
export const checkDns = () =>
  timeoutPromise<number>(
    new Promise<number>((fulfill, reject) => {
      const resolver = new dns.Resolver();
      resolver.setServers([DNS_TEST_SERVER]);

      const lastTime = Date.now();

      resolver.resolve(DNS_TEST_DOMAIN, (err, address) => {
        if (err || !address) reject("Fail to lookup dns");
        else {
          fulfill(Date.now() - lastTime);
        }
      });
    }),
    TEST_TIMEOUT_MS
  );
