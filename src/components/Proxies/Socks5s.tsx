import React from "react";
import { useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { Socks5 } from "../../reducers/proxyReducer";
import styles from "./proxies.module.css";
import { Socks5Card } from "../Cards/Socks5Card";

export const Socks5s = React.memo(() => {
  const socks5s = useSelector<AppState, Socks5[]>(state => state.proxy.socks5s);
  return (
    <>
      {socks5s.length !== 0 && <div className={styles.title}>Sock5s</div>}
      <div className={styles.shadowsockses}>
        {socks5s.map(socks5 => (
          <Socks5Card socks5={socks5} key={socks5.id} />
        ))}
      </div>
    </>
  );
});
