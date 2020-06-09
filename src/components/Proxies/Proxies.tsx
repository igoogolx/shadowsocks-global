import React from "react";
import styles from "./proxies.module.css";
import { Shadowsockses } from "./Shadowsockses";
import { Socks5s } from "./Socks5s";
import { Subscriptions } from "./Subscriptions";
import { useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { Shadowsocks, Socks5, Subscription } from "../../reducers/proxyReducer";

export const Proxies = () => {
  const shadowsockses = useSelector<AppState, Shadowsocks[]>(
    (state) => state.proxy.shadowsockses
  );
  const subscriptions = useSelector<AppState, Subscription[]>(
    (state) => state.proxy.subscriptions
  );
  const socks5s = useSelector<AppState, Socks5[]>(
    (state) => state.proxy.socks5s
  );
  return (
    <div className={styles.container}>
      {shadowsockses.length !== 0 && (
        <Shadowsockses shadowsockses={shadowsockses} />
      )}
      {subscriptions.length !== 0 && (
        <Subscriptions subscriptions={subscriptions} />
      )}
      {socks5s.length !== 0 && <Socks5s socks5s={socks5s} />}
    </div>
  );
};

export default Proxies;
