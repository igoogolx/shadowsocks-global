import React, { useEffect, useState } from "react";
import { SpeedGraph } from "../Graphs/SpeedGraph";
import { Card } from "../Core/Card/Card";
import styles from "./cards.module.css";
import { ipcRenderer } from "electron";
import { useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";

export const SpeedGraphCard = () => {
  const [netSpeed, setNetSpeed] = useState<
    { download: number; upload: number; time: number }[]
  >([]);
  const isStarted = useSelector<AppState, boolean>(
    state => state.proxy.isStarted
  );
  useEffect(() => {
    if (!isStarted)
      setNetSpeed(netSpeeds => {
        if (netSpeeds.length !== 0) return [];
        return netSpeeds;
      });
  }, [isStarted]);
  useEffect(() => {
    ipcRenderer.on("netSpeed", (event, traffic) => {
      if (traffic) {
        const { receivedBytesPerSecond, sentBytesPerSecond, time } = traffic;
        setNetSpeed(data => {
          const speed = {
            download: receivedBytesPerSecond,
            upload: sentBytesPerSecond,
            time: time
          };
          if (data.length < 10) return [...data, speed];
          else return [...data.splice(data.length - 9, data.length), speed];
        });
      }
    });
    return () => {
      ipcRenderer.removeAllListeners("netSpeed");
    };
  }, []);

  return (
    <Card className={styles.speed}>
      <SpeedGraph statistics={netSpeed} />
    </Card>
  );
};
