import * as dgram from "dgram";
import { SocksClient } from "socks";
import { logger } from "./log";

const UDP_FORWARDING_TEST_TIMEOUT_MS = 5000;
const UDP_FORWARDING_TEST_RETRY_INTERVAL_MS = 1000;
// ss-local will almost always start, and fast: short timeouts, fast retries.

// DNS request to google.com.
const DNS_REQUEST = Buffer.from([
  0,
  0, // [0-1]   query ID
  1,
  0, // [2-3]   flags; byte[2] = 1 for recursion desired (RD).
  0,
  1, // [4-5]   QDCOUNT (number of queries)
  0,
  0, // [6-7]   ANCOUNT (number of answers)
  0,
  0, // [8-9]   NSCOUNT (number of name server records)
  0,
  0, // [10-11] ARCOUNT (number of additional records)
  6,
  103,
  111,
  111,
  103,
  108,
  101, // google
  3,
  99,
  111,
  109, // com
  0, // null terminator of FQDN (root TLD)
  0,
  1, // QTYPE, set to A
  0,
  1, // QCLASS, set to 1 = IN (Internet)
]);

// Verifies that the remote server has enabled UDP forwarding by sending a DNS request through it.
export async function checkUdpForwardingEnabled(
  address: string,
  port: number
): Promise<boolean> {
  const client = new SocksClient({
    proxy: {
      host: address,
      port,
      type: 5,
    },
    command: "associate",
    destination: { host: "0.0.0.0", port: 0 }, // Specify the actual target once we get a response.
  });

  return await new Promise<boolean>((fulfill) => {
    client.on("error", () => {
      fulfill(false);
    });

    client.on("established", (info) => {
      const packet = SocksClient.createUDPFrame({
        remoteHost: { host: "8.8.8.8", port: 53 },
        data: DNS_REQUEST,
      });
      const udpSocket = dgram.createSocket("udp4");

      udpSocket.on("error", () => {
        fulfill(false);
      });

      udpSocket.on("message", () => {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        stopUdp();
        fulfill(true);
      });

      // Retry sending the query every second.
      // TODO: logging here is a bit verbose
      const intervalId = setInterval(() => {
        try {
          if (info.remoteHost)
            udpSocket.send(
              packet,
              info.remoteHost.port,
              info.remoteHost.host,
              (err) => {
                if (err) {
                  logger.error(`Failed to send data through UDP: ${err}`);
                }
              }
            );
        } catch (e) {
          logger.error(`Failed to send data through UDP ${e}`);
        }
      }, UDP_FORWARDING_TEST_RETRY_INTERVAL_MS);
      const stopUdp = () => {
        try {
          clearInterval(intervalId);
          udpSocket.close();
        } catch (e) {
          // Ignore; there may be multiple calls to this function.
        }
      };
      // Give up after the timeout elapses.
      setTimeout(() => {
        stopUdp();
        fulfill(false);
      }, UDP_FORWARDING_TEST_TIMEOUT_MS);
    });
    client.connect();
  });
}
