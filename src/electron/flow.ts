import net from "net";
import { logger } from "./log";

export type FlowData = {
  downloadBytesPerSecond: number;
  uploadBytesPerSecond: number;
  totalUsage: number;
};

class FLow {
  private port: number = 1090;
  get listeningPort() {
    return this.port;
  }
  set newListeningPort(port: number) {
    this.port = port;
  }
  public getData = async () => {
    try {
      return await new Promise<FlowData | null>((fulfill, reject) => {
        const client = net.createConnection(
          { host: "127.0.0.1", port: this.port },
          () => {}
        );
        client.on("data", (data) => {
          const rawData = JSON.parse(data.toString());
          fulfill({
            downloadBytesPerSecond: rawData.DownloadBytesPerSecond,
            uploadBytesPerSecond: rawData.UploadBytesPerSecond,
            totalUsage: rawData.TotalUsage,
          });
        });
        client.on("error", (err) => {
          reject(err);
        });
      });
    } catch (e) {
      logger.error(`Fail to get flow:${e}`);
      return null;
    }
  };
}

export const flow = new FLow();
