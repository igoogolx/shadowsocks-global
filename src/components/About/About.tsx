import React, { useState } from "react";
import styles from "./about.module.css";
import { shell, ipcRenderer } from "electron";
import { Button, notifier } from "../Core";
import { useOnMount } from "../../hooks";
import promiseIpc from "electron-promise-ipc";
import Store from "electron-store";

const About = () => {
  const [appVersion, setAppVersion] = useState();

  useOnMount(() => {
    try {
      // @ts-ignore
      promiseIpc.send("getAppVersion").then((version) => {
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
          https://github.com/igoogolx/shadowsocks-global/issues
        </Button>
      </div>
      <div>
        Releases:
        <Button
          onClick={async () => {
            await shell.openExternal(
              "https://github.com/igoogolx/shadowsocks-global/releases"
            );
          }}
          isLink={true}
        >
          https://github.com/igoogolx/shadowsocks-global/releases
        </Button>
      </div>
      <div className={styles.buttons}>
        <Button
          onClick={() => {
            ipcRenderer.send("openLogFile");
          }}
          isPrimary={true}
        >
          Open Log File
        </Button>
        <Button
          onClick={() => {
            const store = new Store();
            store.openInEditor();
          }}
          isPrimary={true}
        >
          Open Config File
        </Button>
      </div>
    </div>
  );
};

export default About;
