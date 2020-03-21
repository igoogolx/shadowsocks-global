import React, { useLayoutEffect } from "react";
import styles from "./proxies.module.css";
import { Shadowsockses } from "./Shadowsockses";
import { Socks5s } from "./Socks5s";
import { Subscriptions } from "./Subscriptions";
import { useDispatch } from "react-redux";
import { proxy } from "../../reducers/proxyReducer";

export const Proxies = () => {
  const dispatch = useDispatch();
  //Reset pingTestStatus
  useLayoutEffect(() => {
    dispatch(proxy.actions.resetPingTestStatus());
    return () => {
      dispatch(proxy.actions.resetPingTestStatus());
    };
  }, [dispatch]);
  return (
    <div className={styles.container}>
      <Shadowsockses />
      <Subscriptions />
      <Socks5s />
    </div>
  );
};

export default Proxies;
