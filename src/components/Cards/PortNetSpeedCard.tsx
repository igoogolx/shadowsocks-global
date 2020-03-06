import React, { useEffect, useState } from "react";
import styles from "./cards.module.css";
import { Card } from "../Core/Card/Card";
import { ipcRenderer } from "electron";
import { convertTrafficData } from "../../utils/convert";
import { useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
export const PortNetSpeedCard = () => {
  const [netSpeeds, setNetSpeeds] = useState<{ port: number; speed: string }[]>(
    []
  );
  const isStarted = useSelector<AppState, boolean>(
    state => state.proxy.isStarted
  );
  useEffect(() => {
    if (!isStarted)
      setNetSpeeds(netSpeeds => {
        if (netSpeeds.length !== 0) return [];
        return netSpeeds;
      });
  }, [isStarted]);
  useEffect(() => {
    ipcRenderer.on(
      "portNetSpeeds",
      (event, portTraffics: { port: number; bytesPerSecond: number }[]) => {
        const sortedPortTraffics = portTraffics
          .sort((a, b) => {
            if (a.bytesPerSecond > b.bytesPerSecond) return -1;
            if (a.bytesPerSecond < b.bytesPerSecond) return 1;
            return 0;
          })
          .slice(0, 5);
        setNetSpeeds(
          sortedPortTraffics.map(portTraffic => ({
            port: portTraffic.port,
            speed: convertTrafficData(portTraffic.bytesPerSecond) + "/S"
          }))
        );
      }
    );
    return () => {
      ipcRenderer.removeAllListeners("portNetSpeeds");
    };
  }, []);
  return (
    <Card className={styles.portNetSpeed}>
      <div className={styles.item}>
        <div className={styles.title}>Port</div>
        <div className={styles.title}>Speed</div>
      </div>
      {netSpeeds.map(netSpeed => (
        <div className={styles.item} key={netSpeed.port}>
          <div>{netSpeed.port}</div>
          <div>{netSpeed.speed}</div>
        </div>
      ))}
    </Card>
  );
};
