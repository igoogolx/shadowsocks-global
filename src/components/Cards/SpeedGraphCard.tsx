import React, { useEffect, useState } from "react";
import { SpeedGraph } from "../Graphs/SpeedGraph";
import { Card } from "../Core/Card/Card";
import styles from "./cards.module.css";
import { useFlow } from "../../hooks";

export const SpeedGraphCard = () => {
  const flow = useFlow();
  const [netSpeeds, setNetSpeeds] = useState<
    { download: number; upload: number; time: number }[]
  >([]);

  useEffect(() => {
    setNetSpeeds((data) => {
      const speed = {
        download: flow.downloadBytesPerSecond,
        upload: flow.uploadBytesPerSecond,
        time: flow.time,
      };
      if (data.length < 20) return [...data, speed];
      else return [...data.splice(data.length - 19, data.length), speed];
    });
  }, [flow]);

  return (
    <Card className={styles.speed}>
      <SpeedGraph data={netSpeeds} />
    </Card>
  );
};
