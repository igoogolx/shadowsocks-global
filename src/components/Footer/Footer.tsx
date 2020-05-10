import React, { useEffect, useState } from "react";
import styles from "./footer.module.css";
import { Dot } from "../Dot/Dot";
import { ipcRenderer } from "electron";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { proxy } from "../../reducers/proxyReducer";
import { useFlow } from "../../hooks";
import { convertFlowData } from "../../share";

const Footer = () => {
  const [udpStatus, setUdpStatus] = useState<
    undefined | "disabled" | "enabled"
  >();
  const dispatch = useDispatch();
  const [message, setMessage] = useState("");
  const isStarted = useSelector<AppState, boolean>(
    (state) => state.proxy.isStarted
  );

  const flow = useFlow();

  useEffect(() => {
    if (!isStarted) setUdpStatus(undefined);
  }, [isStarted]);

  useEffect(() => {
    ipcRenderer.on("updateMessage", (event, message) => {
      if (message) setMessage(message);
      if (message === "Disconnected") dispatch(proxy.actions.stopVpn());
    });
    ipcRenderer.on("updateMessage", (event, udpStatus) => {
      setUdpStatus(udpStatus);
    });

    return () => {
      ipcRenderer.removeAllListeners("updateMessage");
      ipcRenderer.removeAllListeners("udpStatus");
      console.log("remove listeners");
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
