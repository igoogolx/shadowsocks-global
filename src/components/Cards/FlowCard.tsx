import React from "react";
import { Card } from "../Core/Card/Card";
import styles from "./cards.module.css";
import { useFlow } from "../../hooks";
import { convertFlowData } from "../../share";

export const FlowCard = React.memo(() => {
  const flow = useFlow();

  return (
    <Card className={styles.traffic}>
      <div className={styles.statistic}>
        <div className={styles.title}>download</div>
        <div className={styles.data}>
          {convertFlowData(flow.downloadBytesPerSecond) + "/S"}
        </div>
      </div>
      <div className={styles.statistic}>
        <div className={styles.title}>upload</div>
        <div className={styles.data}>
          {convertFlowData(flow.uploadBytesPerSecond) + "/S"}
        </div>
      </div>
      <div className={styles.statistic}>
        <div className={styles.title}>usage</div>
        <div className={styles.data}>{convertFlowData(flow.totalUsage)}</div>
      </div>
    </Card>
  );
});
