import styles from "./cards.module.css";
import { StatusCard } from "./StatusCard";
import { Icon, ICON_NAME, ICON_SIZE, Tooltip } from "../Core";
import React, { useCallback, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { useAsync } from "../../hooks";
import { getActivatedServer } from "../../electron/share";
import { store } from "../../store/store";
import { checkDns, checkInternet, checkServer } from "../../utils/ipc";

//TODO: Remove repeated code
export const LatencyCard = () => {
  return (
    <div className={styles.latency}>
      <ToSeverCard />
      <ToDnsCard />
      <ToInternetCard />
    </div>
  );
};

export const ToSeverCard = () => {
  const isConnected = useSelector<AppState, boolean>(
    (state) => state.proxy.isConnected
  );
  const check = useCallback(async () => {
    const proxy = store.getState().proxy;
    const activatedServer = getActivatedServer(proxy);
    return await checkServer({
      address: activatedServer.host,
      port: activatedServer.port,
      attempts: 1,
    });
  }, []);
  const { execute, pending, value, error } = useAsync(check, false);
  const disabled = !isConnected || pending;
  useEffect(() => {
    if (isConnected)
      execute()
        //Ignore promise returned from onClick
        .then();
  }, [isConnected, execute]);
  const tooltipRef = useRef(null);
  return (
    <div className={styles.card}>
      <Icon
        iconName={ICON_NAME.INFO_VARIANT}
        className={styles.tooltip}
        iconRef={tooltipRef}
        size={ICON_SIZE.SIZE20}
      />
      <Tooltip
        content={"The time of connecting to proxy server"}
        target={tooltipRef}
        placement={"bottom"}
      />
      <StatusCard
        iconName={ICON_NAME.PAPER_PLANE}
        title={"To Server"}
        data={
          isConnected
            ? pending
              ? "Checking"
              : !value || error
              ? "Timeout"
              : value + "ms"
            : "0ms"
        }
        iconClassname={styles.server}
        disabled={disabled}
        onClick={execute}
      />
    </div>
  );
};

export const ToDnsCard = () => {
  const isConnected = useSelector<AppState, boolean>(
    (state) => state.proxy.isConnected
  );
  const { execute, pending, value, error } = useAsync(checkDns, false);
  const disabled = !isConnected || pending;
  useEffect(() => {
    if (isConnected)
      execute()
        //Ignore promise returned from onClick
        .then();
  }, [isConnected, execute]);
  const tooltipRef = useRef(null);
  return (
    <div className={styles.card}>
      <Icon
        iconName={ICON_NAME.INFO_VARIANT}
        className={styles.tooltip}
        iconRef={tooltipRef}
        size={ICON_SIZE.SIZE20}
      />
      <Tooltip
        content={"The time of connecting to Google Dns"}
        target={tooltipRef}
        placement={"bottom"}
      />
      <StatusCard
        iconName={ICON_NAME.DNS}
        title={"To Dns"}
        data={
          isConnected
            ? pending
              ? "Checking"
              : !value || error
              ? "Timeout"
              : value + "ms"
            : "0ms"
        }
        iconClassname={styles.dns}
        disabled={disabled}
        onClick={execute}
      />
    </div>
  );
};

export const ToInternetCard = () => {
  const isConnected = useSelector<AppState, boolean>(
    (state) => state.proxy.isConnected
  );
  const { execute, pending, value, error } = useAsync(checkInternet, false);
  const disabled = !isConnected || pending;
  useEffect(() => {
    if (isConnected)
      execute()
        //Ignore promise returned from onClick
        .then();
  }, [isConnected, execute]);
  const tooltipRef = useRef(null);
  return (
    <div className={styles.card}>
      <Icon
        iconName={ICON_NAME.INFO_VARIANT}
        className={styles.tooltip}
        iconRef={tooltipRef}
        size={ICON_SIZE.SIZE20}
      />
      <Tooltip
        content={"The time of connecting to Google.com"}
        target={tooltipRef}
        placement={"left"}
      />
      <StatusCard
        iconName={ICON_NAME.INTERNET}
        title={"To Internet"}
        data={
          isConnected
            ? pending
              ? "Checking"
              : !value || error
              ? "Timeout"
              : value + "ms"
            : "0ms"
        }
        iconClassname={styles.internet}
        disabled={disabled}
        onClick={execute}
      />
    </div>
  );
};
