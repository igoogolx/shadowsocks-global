import React, { useEffect, useState } from "react";
import { SpeedGraph } from "../Graphs/SpeedGraph";
import { Card } from "../Core/Card/Card";
import styles from "./cards.module.css";
import { useTrafficStatistics } from "../../hooks";

export const SpeedGraphCard = () => {
  const trafficStatistics = useTrafficStatistics();
  const [netSpeed, setNetSpeed] = useState<
    { download: number; upload: number; time: number }[]
  >([]);

  useEffect(() => {
    setNetSpeed((data) => {
      const speed = {
        download: trafficStatistics.receivedBytesPerSecond,
        upload: trafficStatistics.sentBytesPerSecond,
        time: trafficStatistics.time,
      };
      if (data.length < 10) return [...data, speed];
      else return [...data.splice(data.length - 9, data.length), speed];
    });
  }, [trafficStatistics]);

  return (
    <Card className={styles.speed}>
      <SpeedGraph statistics={netSpeed} />
    </Card>
  );
};
