import React, { useEffect, useState } from "react";
import styles from "./footer.module.css";
import { Dot } from "../Dot/Dot";
import { ipcRenderer } from "electron";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { useFlow } from "../../hooks";
import { convertFlowData } from "../../share";

const Footer = () => {
  const [udpStatus, setUdpStatus] = useState<
    undefined | "disabled" | "enabled"
  >();
  const dispatch = useDispatch();
  const [message, setMessage] = useState("");
  const isConnected = useSelector<AppState, boolean>(
    (state) => state.proxy.isConnected
  );

  const flow = useFlow();

  useEffect(() => {
    if (!isConnected) setUdpStatus(undefined);
  }, [isConnected]);

  useEffect(() => {
    ipcRenderer.on("proxy-message", (event, message) => {
      if (message) setMessage(message);
    });
    ipcRenderer.on("proxy-udpStatus", (event, udpStatus) => {
      setUdpStatus(udpStatus);
    });

    return () => {
      ipcRenderer.removeAllListeners("proxy-message");
      ipcRenderer.removeAllListeners("proxy-udpStatus");
    };
  }, [dispatch]);
  return (
    <div className={styles.container}>
      <div className={styles.udp}>
        <span>UDP:</span>
        <Dot type={udpStatus} />
      </div>
      <div className={styles.traffic}>
        usage: {convertFlowData(flow.totalUsage)}
      </div>
      <div className={styles.traffic}>
        download: {convertFlowData(flow.downloadBytesPerSecond) + "/S"}
      </div>
      <div className={styles.traffic}>
        upload: {convertFlowData(flow.uploadBytesPerSecond) + "/S"}
      </div>
      <div className={styles.message}>{message}</div>
    </div>
  );
};

export default Footer;
