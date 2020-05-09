import React, { useEffect, useState } from "react";
import styles from "./footer.module.css";
import { Dot } from "../Dot/Dot";
import { ipcRenderer } from "electron";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { proxy } from "../../reducers/proxyReducer";
import { useTrafficStatistics } from "../../hooks";
import { convertTrafficData } from "../../share";

const Footer = () => {
  const [udpStatus, setUdpStatus] = useState<
    undefined | "disabled" | "enabled"
  >();
  const dispatch = useDispatch();
  const [message, setMessage] = useState("");
  const isStarted = useSelector<AppState, boolean>(
    (state) => state.proxy.isStarted
  );

  const trafficStatistics = useTrafficStatistics();

  useEffect(() => {
    if (!isStarted) setUdpStatus(undefined);
  }, [isStarted]);

  useEffect(() => {
    ipcRenderer.on("message", (event, message) => {
      if (message) setMessage(message);
      if (message === "Disconnected") dispatch(proxy.actions.stopVpn());
    });
    ipcRenderer.on("udpStatus", (event, udpStatus) => {
      setUdpStatus(udpStatus);
    });

    return () => {
      ipcRenderer.removeAllListeners("message");
      ipcRenderer.removeAllListeners("udpStatus");
    };
  }, [dispatch]);

  return (
    <div className={styles.container}>
      <div className={styles.udp}>
        <span>UDP:</span>
        <Dot type={udpStatus} />
      </div>
      <div className={styles.traffic}>
        usage: {convertTrafficData(trafficStatistics.usage)}
      </div>
      <div className={styles.traffic}>
        download:{" "}
        {convertTrafficData(trafficStatistics.receivedBytesPerSecond) + "/S"}
      </div>
      <div className={styles.traffic}>
        upload:{" "}
        {convertTrafficData(trafficStatistics.sentBytesPerSecond) + "/S"}
      </div>
      <div className={styles.message}>{message}</div>
    </div>
  );
};

export default Footer;
