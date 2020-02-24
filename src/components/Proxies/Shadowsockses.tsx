import React from "react";
import { useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { Shadowsocks } from "../../reducers/proxyReducer";
import styles from "./proxies.module.css";
import { ShadowsocksCard } from "../Cards/ShadowsocksCard";

export const Shadowsockses = React.memo(() => {
  const shadowsockses = useSelector<AppState, Shadowsocks[]>(
    state => state.proxy.shadowsockses
  );
  return (
    <>
      {shadowsockses.length !== 0 && (
        <div className={styles.title}>Shadowsockses</div>
      )}
      <div className={styles.shadowsockses}>
        {shadowsockses.map(shadowsocks => (
          <ShadowsocksCard shadowsocks={shadowsocks} key={shadowsocks.id} />
        ))}
      </div>
    </>
  );
});
