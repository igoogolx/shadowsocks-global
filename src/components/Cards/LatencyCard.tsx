import styles from "./cards.module.css";
import { StatusCard } from "./StatusCard";
import { Icon, ICON_NAME, ICON_SIZE } from "../Core";
import React, { useCallback, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { getActivatedServer } from "../Proxies/util";
import {
  checkServer,
  checkDns,
  validateServerCredentials
} from "../../utils/connectivity";
import { Tooltip } from "../Core/Tooltip/Tooltip";
import { useAsync } from "../../hooks";

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
  const isStarted = useSelector<AppState, boolean>(
    state => state.proxy.isStarted
  );
  const check = useCallback(async () => {
    const activatedServer = getActivatedServer();
    return await checkServer({
      address: activatedServer.host,
      port: activatedServer.port,
      attempts: 1,
      timeout: 2000
    });
  }, []);
  const { execute, pending, value, error } = useAsync(check, false);
  const disabled = !isStarted || pending;
  useEffect(() => {
    if (isStarted)
      execute()
        //Ignore promise returned from onClick
        .then();
  }, [isStarted, execute]);
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
      />
      <StatusCard
        iconName={ICON_NAME.PAPER_PLANE}
        title={"To Server"}
        data={
          isStarted
            ? pending
              ? "Checking"
              : value === null || error
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
  const isStarted = useSelector<AppState, boolean>(
    state => state.proxy.isStarted
  );
  const { execute, pending, value, error } = useAsync(checkDns, false);
  const disabled = !isStarted || pending;
  useEffect(() => {
    if (isStarted)
      execute()
        //Ignore promise returned from onClick
        .then();
  }, [isStarted, execute]);
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
      />
      <StatusCard
        iconName={ICON_NAME.DNS}
        title={"To Dns"}
        data={
          isStarted
            ? pending
              ? "Checking"
              : value === null || error
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
  const shadowsocksLocalPort = useSelector<AppState, number>(
    state => state.setting.general.shadowsocksLocalPort
  );
  const isStarted = useSelector<AppState, boolean>(
    state => state.proxy.isStarted
  );
  const check = useCallback(async () => {
    const activatedServer = getActivatedServer();
    if (activatedServer.type === "shadowsocks")
      return await validateServerCredentials("127.0.0.1", shadowsocksLocalPort);
    else
      return await validateServerCredentials(
        activatedServer.host,
        activatedServer.port
      );
  }, [shadowsocksLocalPort]);
  const { execute, pending, value, error } = useAsync(check, false);
  const disabled = !isStarted || pending;
  useEffect(() => {
    if (isStarted)
      execute()
        //Ignore promise returned from onClick
        .then();
  }, [isStarted, execute]);
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
        type={"left"}
      />
      <StatusCard
        iconName={ICON_NAME.INTERNET}
        title={"To Internet"}
        data={
          isStarted
            ? pending
              ? "Checking"
              : value === null || error
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
