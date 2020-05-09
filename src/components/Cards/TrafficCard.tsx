import React from "react";
import { Card } from "../Core/Card/Card";
import styles from "./cards.module.css";
import { useTrafficStatistics } from "../../hooks";
import { convertTrafficData } from "../../share";

export const TrafficCard = React.memo(() => {
  const trafficStatistics = useTrafficStatistics();

  return (
    <Card className={styles.traffic}>
      <div className={styles.statistic}>
        <div className={styles.title}>download</div>
        <div className={styles.data}>
          {convertTrafficData(trafficStatistics.receivedBytesPerSecond)}
        </div>
      </div>
      <div className={styles.statistic}>
        <div className={styles.title}>upload</div>
        <div className={styles.data}>
          {convertTrafficData(trafficStatistics.sentBytesPerSecond)}
        </div>
      </div>
      <div className={styles.statistic}>
        <div className={styles.title}>usage</div>
        <div className={styles.data}>
          {convertTrafficData(trafficStatistics.usage)}
        </div>
      </div>
    </Card>
  );
});
