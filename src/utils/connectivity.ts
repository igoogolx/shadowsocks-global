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
import { timeoutPromise } from "../share";

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
    const s = new net.Socket();
    const startTime = Date.now();
    s.connect(options.port, options.address, function () {
      const endTime = Date.now();
      const time = endTime - startTime;
      resolve(time);
      s.destroy();
    });
    s.on("error", function (e) {
      reject(e);
      s.destroy();
    });
    s.setTimeout(options.timeout, function () {
      reject("Timeout");
      s.destroy();
    });
  });

export const checkServer = async (options: Options) => {
  const {
    address = "localhost",
    port = 80,
    attempts = 5,
    timeout = 2000,
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

      const lastTime = Date.now();

      resolver.resolve(DNS_TEST_DOMAIN, (err, address) => {
        if (err || !address) reject("Fail to lookup dns");
        else {
          fulfill(Date.now() - lastTime);
        }
      });
    }),
    DNS_TEST_TIMEOUT_MS
  );
