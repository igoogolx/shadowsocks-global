//The code is used by main and renderer process.
//TODO: Remove shared code
import * as dns from "dns";
import { SocksClient } from "socks";

const DNS_LOOKUP_TIMEOUT_MS = 2000;
const SERVER_TEST_TIMEOUT_MS = 2000;
const CREDENTIALS_TEST_DOMAIN = "google.com";
export const NS_PER_MILLI_SECOND = 1e6;

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

export function financial(x: number, fractionDigits = 2) {
  return Number(Number.parseFloat(x.toString()).toFixed(fractionDigits));
}

// Resolves with true iff a response can be received from a semi-randomly-chosen website through the
// Shadowsocks proxy.
export const validateServerCredentials = (address: string, port: number) =>
  new Promise<number>((fulfill, reject) => {
    const lastTime = process.hrtime();
    SocksClient.createConnection({
      proxy: { host: address, port, type: 5 },
      destination: { host: CREDENTIALS_TEST_DOMAIN, port: 80 },
      command: "connect",
      timeout: SERVER_TEST_TIMEOUT_MS
    })
      .then(client => {
        client.socket.write(
          `HEAD / HTTP/1.1\r\nHost: ${CREDENTIALS_TEST_DOMAIN}\r\n\r\n`
        );
        client.socket.on("data", data => {
          if (data.toString().startsWith("HTTP/1.1")) {
            client.socket.end();
            fulfill(
              financial(process.hrtime(lastTime)[1] / NS_PER_MILLI_SECOND, 0)
            );
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
      .catch(e => {
        reject(e);
      });
  });
