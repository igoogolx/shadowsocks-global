import React from "react";
import styles from "./proxies.module.css";
import { Shadowsockses } from "./Shadowsockses";
import { Subscriptions } from "./Subscriptions";
import { useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { Shadowsocks, Subscription } from "../../reducers/proxyReducer";

export const Proxies = () => {
  const shadowsockses = useSelector<AppState, Shadowsocks[]>(
    (state) => state.proxy.shadowsockses
  );
  const subscriptions = useSelector<AppState, Subscription[]>(
    (state) => state.proxy.subscriptions
  );
  return (
    <div className={styles.container}>
      {shadowsockses.length !== 0 && (
        <Shadowsockses shadowsockses={shadowsockses} />
      )}
      {subscriptions.length !== 0 && (
        <Subscriptions subscriptions={subscriptions} />
      )}
    </div>
  );
};

export default Proxies;
