//The code is used by main and renderer process.
//TODO: Remove shared code
import * as dns from "dns";
import { SocksClient } from "socks";
import {
  ProxyState,
  Shadowsocks,
  Subscription,
} from "../../reducers/proxyReducer";

const DNS_LOOKUP_TIMEOUT_MS = 2000;
const SERVER_TEST_TIMEOUT_MS = 2000;
const CREDENTIALS_TEST_DOMAIN = "google.com";

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

// Resolves with true iff a response can be received from a semi-randomly-chosen website through the
// Shadowsocks proxy.
export const validateServerCredentials = (address: string, port: number) =>
  timeoutPromise(
    new Promise<number>((fulfill, reject) => {
      const lastTime = Date.now();
      SocksClient.createConnection({
        proxy: { host: address, port, type: 5 },
        destination: { host: CREDENTIALS_TEST_DOMAIN, port: 80 },
        command: "connect",
      })
        .then((client) => {
          client.socket.write(
            `HEAD / HTTP/1.1\r\nHost: ${CREDENTIALS_TEST_DOMAIN}\r\n\r\n`
          );
          client.socket.on("data", (data) => {
            if (data.toString().startsWith("HTTP/1.1")) {
              client.socket.end();
              fulfill(Date.now() - lastTime);
            } else {
              client.socket.end();
              reject("unexpected response from remote test website");
            }
          });

          client.socket.on("close", () => {
            reject("could not connect to remote test website");
          });
          client.socket.resume();
        })
        .catch((e) => {
          reject(e);
        });
    }),
    SERVER_TEST_TIMEOUT_MS
  );
const KB = 1024;
const MB = 1024 * KB;
const GB = 1024 * MB;
export const convertFlowData = (data: number) => {
  function financial(x: number, fractionDigits = 2) {
    return Number(Number.parseFloat(x.toString()).toFixed(fractionDigits));
  }

  if (data < KB) return `${financial(data)} B`;
  if (data < MB) return `${financial(data / KB)} KB`;
  if (data < GB) return `${financial(data / MB)} MB`;
  else return `${financial(data / GB)} GB`;
};

export const BUILD_IN_RULE_GLOBAL = "Global";
export const BUILD_IN_RULE_BYPASS_MAINLAND_CHINA = "Bypass mainland China";
export const SMART_DNS_ADDRESS = "127.0.0.1";
//Note: If no server has been selected, this function will return undefined.
export const getActivatedServer = (proxy: ProxyState) => {
  const activatedId = proxy.activeId;
  const socks5 = proxy.socks5s.find((sock5s) => sock5s.id === activatedId);
  if (!socks5) {
    const shadowsocks = proxy.shadowsockses.find(
      (shadowsocks) => shadowsocks.id === activatedId
    );
    if (!shadowsocks) {
      const subscription = proxy.subscriptions.find((subscription) =>
        subscription.shadowsockses.some(
          (shadowsocks) => shadowsocks.id === activatedId
        )
      );
      return {
        type: "shadowsocks",
        ...((subscription as Subscription).shadowsockses.find(
          (shadowsocks) => shadowsocks.id === activatedId
        ) as Shadowsocks),
      };
    }
    return { type: "shadowsocks", ...shadowsocks };
  }
  return { type: "socks5", ...socks5 };
};
