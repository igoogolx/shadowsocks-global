import React from "react";
import styles from "./proxies.module.css";
import { Shadowsockses } from "./Shadowsockses";
import { Socks5s } from "./Socks5s";
import { Subscriptions } from "./Subscriptions";

export const Proxies = () => {
  return (
    <div className={styles.container}>
      <Shadowsockses />
      <Subscriptions />
      <Socks5s />
    </div>
  );
};

export default Proxies;
