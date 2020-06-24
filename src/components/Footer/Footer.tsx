import React, { useEffect, useState } from "react";
import styles from "./footer.module.css";
import { Dot } from "../Dot/Dot";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { useAsync, useFlow } from "../../hooks";
import { convertFlowData } from "../../electron/share";
import {
  checkUpdStatus,
  subscribeMessage,
  unsubscribeMessage,
} from "../../utils/ipc";
import { Icon, ICON_NAME, ICON_SIZE } from "../Core";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const dispatch = useDispatch();
  const [message, setMessage] = useState("");
  const isConnected = useSelector<AppState, boolean>(
    (state) => state.proxy.isConnected
  );

  const {
    pending: checking,
    execute: checkUdp,
    value: udpStatus,
    error,
  } = useAsync(checkUpdStatus);
  const flow = useFlow();
  useEffect(() => {
    if (isConnected) {
      checkUdp().catch(() => {
        //Do noting
      });
    }
  }, [checkUdp, isConnected]);
  const { t } = useTranslation();

  useEffect(() => {
    subscribeMessage((event, message) => {
      if (message) setMessage(message);
    });

    return () => {
      unsubscribeMessage();
    };
  }, [dispatch]);
  return (
    <div className={styles.container}>
      <div className={styles.udp}>
        <span>UDP:</span>
        {checking || error ? (
          <Icon
            iconName={ICON_NAME.LOADING}
            isLoading={true}
            size={ICON_SIZE.SIZE14}
          />
        ) : (
          <Dot type={udpStatus ? "enabled" : "disabled"} />
        )}
      </div>
      <div className={styles.traffic}>
        {t("footer.usage")}: {convertFlowData(flow.totalUsage)}
      </div>
      <div className={styles.traffic}>
        {t("footer.download")}:{" "}
        {convertFlowData(flow.downloadBytesPerSecond) + "/S"}
      </div>
      <div className={styles.traffic}>
        {t("footer.upload")}:{" "}
        {convertFlowData(flow.uploadBytesPerSecond) + "/S"}
      </div>
      <div className={styles.message}>{message}</div>
    </div>
  );
};

export default Footer;
