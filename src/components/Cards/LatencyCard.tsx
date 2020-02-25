import styles from "./cards.module.css";
import { StatusCard } from "./StatusCard";
import { ICON_NAME } from "../Core";
import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { getActivatedServer } from "../Proxies/util";
import { ProxyState } from "../../reducers/proxyReducer";
import {
  checkServer,
  checkDns,
  validateServerCredentials
} from "../../utils/connectivity";

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
  const [latency, setLatency] = useState<number | null>(0);
  const [isChecking, setIsChecking] = useState(false);
  const proxy = useSelector<AppState, ProxyState>(state => state.proxy);
  const isOnchangeToStared = useSelector<AppState, boolean>(
    state => state.proxy.isStarted && !state.proxy.isProcessing
  );
  const disabled = !proxy.isStarted || isChecking;
  const onClick = useCallback(async () => {
    setIsChecking(true);
    const activatedServer = getActivatedServer(proxy);
    try {
      const latency = await checkServer({
        address: activatedServer.host,
        port: activatedServer.port,
        attempts: 5,
        timeout: 2000
      });
      if (latency) setLatency(latency);
      else setLatency(null);
      setIsChecking(false);
    } catch (e) {
      setIsChecking(false);
      setLatency(null);
    }
  }, [proxy]);
  useEffect(() => {
    if (isOnchangeToStared)
      onClick()
        //Ignore promise returned from onClick
        .then();
  }, [onClick, isOnchangeToStared]);
  return (
    <StatusCard
      iconName={ICON_NAME.PAPER_PLANE}
      title={"To Server"}
      data={
        isChecking ? "Checking" : latency === null ? "Timeout" : latency + "ms"
      }
      iconClassname={styles.server}
      disabled={disabled}
      onClick={onClick}
    />
  );
};

export const ToDnsCard = () => {
  const [latency, setLatency] = useState<number | null>(0);
  const [isChecking, setIsChecking] = useState(false);
  const isStarted = useSelector<AppState, boolean>(
    state => state.proxy.isStarted
  );
  const isOnchangeToStared = useSelector<AppState, boolean>(
    state => state.proxy.isStarted && !state.proxy.isProcessing
  );
  const disabled = !isStarted || isChecking;
  const onClick = useCallback(async () => {
    setIsChecking(true);
    try {
      const latency = await checkDns();

      if (latency) setLatency(latency);
      else setLatency(null);
      setIsChecking(false);
    } catch (e) {
      setIsChecking(false);
      setLatency(null);
    }
  }, []);
  useEffect(() => {
    if (isOnchangeToStared)
      onClick()
        //Ignore promise returned from onClick
        .then();
  }, [isOnchangeToStared, onClick]);
  return (
    <StatusCard
      iconName={ICON_NAME.DNS}
      title={"To Dns"}
      data={
        isChecking ? "Checking" : latency === null ? "Timeout" : latency + "ms"
      }
      iconClassname={styles.dns}
      disabled={disabled}
      onClick={onClick}
    />
  );
};

export const ToInternetCard = () => {
  const [latency, setLatency] = useState<number | null>(0);
  const [isChecking, setIsChecking] = useState(false);
  const shadowsocksLocalPort = useSelector<AppState, number>(
    state => state.setting.general.shadowsocksLocalPort
  );
  const isOnchangeToStared = useSelector<AppState, boolean>(
    state => state.proxy.isStarted && !state.proxy.isProcessing
  );
  const proxy = useSelector<AppState, ProxyState>(state => state.proxy);
  const isStarted = useSelector<AppState, boolean>(
    state => state.proxy.isStarted
  );

  const disabled = !isStarted || isChecking;
  const onClick = useCallback(async () => {
    setIsChecking(true);
    try {
      let latency;
      const activatedServer = getActivatedServer(proxy);
      if (activatedServer.type === "shadowsocks")
        latency = await validateServerCredentials(
          "127.0.0.1",
          shadowsocksLocalPort
        );
      else
        latency = await validateServerCredentials(
          activatedServer.host,
          activatedServer.port
        );
      if (latency) setLatency(latency);
      else setLatency(null);
      setIsChecking(false);
    } catch (e) {
      setIsChecking(false);
      setLatency(null);
    }
  }, [proxy, shadowsocksLocalPort]);

  useEffect(() => {
    if (isOnchangeToStared)
      onClick()
        //Ignore promise returned from onClick
        .then();
  }, [isOnchangeToStared, onClick]);

  return (
    <StatusCard
      iconName={ICON_NAME.INTERNET}
      title={"To Internet"}
      data={
        isChecking ? "Checking" : latency === null ? "Timeout" : latency + "ms"
      }
      iconClassname={styles.internet}
      disabled={disabled}
      onClick={onClick}
    />
  );
};
