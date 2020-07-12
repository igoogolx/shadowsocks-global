import net from "net";
import { logger } from "./log";

export type FlowData = {
  downloadBytesPerSecond: number;
  uploadBytesPerSecond: number;
  totalUsage: number;
};

class Manager {
  private port: number = 1090;
  get listeningPort() {
    return this.port;
  }
  set newListeningPort(port: number) {
    this.port = port;
  }
  public getFlow = async () => {
    try {
      return await new Promise<FlowData | null>((fulfill, reject) => {
        const client = net.createConnection(
          { host: "127.0.0.1", port: this.port },
          () => {}
        );
        client.on("data", (data) => {
          const replay = JSON.parse(data.toString());
          if (replay.errorStatus) {
            reject("");
          }
          fulfill(replay.data);
          client.end();
        });
        client.on("error", (err) => {
          reject(err);
        });
        client.write("flow");
      });
    } catch (e) {
      logger.error(`Fail to get flow:${e}`);
      return null;
    }
  };
  public testUdpStatus = async () => {
    return await new Promise<boolean>((fulfill) => {
      const client = net.createConnection(
        { host: "127.0.0.1", port: this.port },
        () => {}
      );
      client.on("data", (data) => {
        const reply = JSON.parse(data.toString());
        if (reply.errorStatus) {
          fulfill(false);
        }
        fulfill(reply.data);
      });
      client.on("error", () => {
        fulfill(false);
      });
      client.write("udpStatus");
    });
  };
  public testInternetLatency = async () => {
    return await new Promise<number>((fulfill, reject) => {
      const client = net.createConnection(
        { host: "127.0.0.1", port: this.port },
        () => {}
      );
      client.write("internetLatency");
      client.on("data", (data) => {
        const reply = JSON.parse(data.toString());
        if (reply.errorStatus) {
          reject("");
        }
        fulfill(reply.data);
      });
      client.on("error", (err) => {
        reject(err);
      });
    });
  };
}

export const manager = new Manager();
