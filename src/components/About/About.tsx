import React, { useState } from "react";
import styles from "./about.module.css";
import { shell } from "electron";
import { Button, notifier } from "../Core";
import { useOnMount } from "../../hooks";
import promiseIpc from "electron-promise-ipc";

const About = () => {
  const [appVersion, setAppVersion] = useState();

  useOnMount(() => {
    try {
      // @ts-ignore
      promiseIpc.send("getAppVersion").then(version => {
        if (version) setAppVersion(version);
        else throw new Error("");
      });
    } catch (e) {
      notifier.error("Fail to get app version");
    }
  });
  return (
    <div>
      <div className={styles.title}>{`Shadowsocks-global ${appVersion}`}</div>
      <div>
        Repository:
        <Button
          onClick={async () => {
            await shell.openExternal(
              "https://github.com/igoogolx/shadowsocks-global"
            );
          }}
          isLink={true}
        >
          https://github.com/igoogolx/shadowsocks-global
        </Button>
      </div>
      <div>
        Issues:
        <Button
          onClick={async () => {
            await shell.openExternal(
              "https://github.com/igoogolx/shadowsocks-global/issues"
            );
          }}
          isLink={true}
        >
          https://github.com/igoogolx/shadowsocks-global
        </Button>
      </div>
    </div>
  );
};

export default About;
