import React, { useEffect, useState } from "react";
import { Card } from "../Core/Card/Card";
import styles from "./cards.module.css";
import { convertTrafficData } from "../../utils/convert";
import { ipcRenderer } from "electron";

export const TrafficCard = React.memo(() => {
  const [netSpeed, setNetSpeed] = useState<{
    upload: string;
    download: string;
    [key: string]: string;
  }>({
    upload: "0",
    download: "0"
  });
  const [usage, setUsage] = useState("0");
  useEffect(() => {
    ipcRenderer.on("netSpeed", (event, traffic) => {
      if (traffic) {
        const { receivedBytesPerSecond, sentBytesPerSecond } = traffic;
        setNetSpeed({
          upload: convertTrafficData(sentBytesPerSecond) + "/S",
          download: convertTrafficData(receivedBytesPerSecond) + "/S"
        });
      }
    });
    ipcRenderer.on("totalTrafficUsage", (event, usage) => {
      setUsage(convertTrafficData(usage));
    });
    return () => {
      ipcRenderer.removeAllListeners("netSpeed");
      ipcRenderer.removeAllListeners("totalTrafficUsage");
    };
  }, []);

  return (
    <Card className={styles.traffic}>
      <div className={styles.statistic}>
        <div className={styles.title}>download</div>
        <div className={styles.data}>{netSpeed.download}</div>
      </div>
      <div className={styles.statistic}>
        <div className={styles.title}>upload</div>
        <div className={styles.data}>{netSpeed.upload}</div>
      </div>
      <div className={styles.statistic}>
        <div className={styles.title}>usage</div>
        <div className={styles.data}>{usage}</div>
      </div>
    </Card>
  );
});
