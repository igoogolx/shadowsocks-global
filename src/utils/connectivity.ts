// Copyright 2019 The Outline Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import * as net from "net";
import * as dns from "dns";
import { financial, timeoutPromise } from "./helper";
import { SocksClient } from "socks";

const SERVER_TEST_TIMEOUT_MS = 2000;
const CREDENTIALS_TEST_DOMAIN = "google.com";
const NS_PER_MILLI_SECOND = 1e6;
const DNS_TEST_SERVER = "8.8.8.8";
const DNS_TEST_DOMAIN = "google.com";
const DNS_TEST_TIMEOUT_MS = 2000;

type Options = {
  address: string;
  port: number;
  attempts: number;
  timeout: number;
};

const check = (options: { address: string; port: number; timeout: number }) =>
  new Promise<number>((resolve, reject) => {
    const start = process.hrtime();
    const s = new net.Socket();
    s.connect(options.port, options.address, function() {
      const timeArr = process.hrtime(start);
      const time = financial((timeArr[0] * 1e9 + timeArr[1]) / 1e6, 0);
      resolve(time);
      s.destroy();
    });
    s.on("error", function(e) {
      reject(e);
      s.destroy();
    });
    s.setTimeout(options.timeout, function() {
      reject("Timeout");
      s.destroy();
    });
  });

export const checkServer = async (options: Options) => {
  const {
    address = "localhost",
    port = 80,
    attempts = 5,
    timeout = 2000
  } = options;
  for (let i = 0; i < attempts; i++) {
    try {
      return await check({ address, port, timeout });
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

      const lastTime = process.hrtime();

      resolver.resolve(DNS_TEST_DOMAIN, (err, address) => {
        if (err || !address) reject("Fail to lookup dns");
        else {
          fulfill(
            financial(process.hrtime(lastTime)[1] / NS_PER_MILLI_SECOND, 0)
          );
        }
      });
    }),
    DNS_TEST_TIMEOUT_MS
  );

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
