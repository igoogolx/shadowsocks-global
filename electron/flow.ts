import net from "net";
import { logger } from "./log";

export type FlowData = {
  downloadBytesPerSecond: number;
  uploadBytesPerSecond: number;
  totalUsage: number;
};

export const flow = (listener: (data: FlowData) => void) => {
  const client = net.createConnection({ host: "127.0.0.1", port: 1090 });
  client.on("data", (data) => {
    const rawData = JSON.parse(data.toString());
    listener({
      downloadBytesPerSecond: rawData.DownloadBytesPerSecond,
      uploadBytesPerSecond: rawData.UploadBytesPerSecond,
      totalUsage: rawData.TotalUsage,
    });
  });
  client.on("end", () => {
    logger.info("disconnected from flow server");
  });
  client.on("error", (err) => {
    logger.error(err);
  });
};
