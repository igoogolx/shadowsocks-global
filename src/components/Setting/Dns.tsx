import React, { useCallback, useMemo, useState } from "react";
import styles from "./setting.module.css";
import { FieldToggle } from "../Core/Toggle/Toggle";
import { Button, Field, Form, INPUT_SIZE } from "../Core";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { DnsSettingState, setting } from "../../reducers/settingReducer";
import { notifier } from "../Core/Notification";
import { ipcRenderer } from "electron";

export const Dns = React.memo(() => {
  const dnsState = useSelector<AppState, DnsSettingState>(
    (state) => state.setting.dns
  );
  const initValue = useMemo(() => {
    const dns = dnsState;
    return {
      defaultDns: dns.default.server,
      isProxyDefaultDns: dns.default.isProxy,
      gfwListDns: dns.gfwList.server,
      isProxyGfwListDns: dns.gfwList.isProxy,
    };
  }, [dnsState]);
  const [dnsSetting, setDnsSetting] = useState(initValue);
  const disabled = useSelector<AppState, boolean>(
    (state) => state.proxy.isProcessing || state.proxy.isConnected
  );
  const [isChanged, setIsChanged] = useState(false);
  const dispatch = useDispatch();

  const reset = useCallback(() => {
    setDnsSetting(initValue);
    setIsChanged(false);
    notifier.success("Reset setting successfully");
  }, [initValue]);

  const onChange = useCallback(
    (field: { [key: string]: any }) => {
      setDnsSetting({ ...dnsSetting, ...field });
      setIsChanged(true);
    },
    [dnsSetting]
  );
  const onSubmit = useCallback(
    (data) => {
      dispatch(
        setting.actions.setCustomizedDns({
          default: { server: data.defaultDns, isProxy: data.isProxyDefaultDns },
          gfwList: { server: data.gfwListDns, isProxy: data.isProxyGfwListDns },
        })
      );
      setIsChanged(false);
      notifier.success("Update setting successfully");
    },
    [dispatch]
  );

  const openNativeWebsitesFile = useCallback(() => {
    ipcRenderer.send("openGfwListFile");
  }, []);

  return (
    <Form onSubmit={onSubmit} onChange={onChange} value={dnsSetting}>
      <div className={styles.item}>
        <div className={styles.title}>Default dns:</div>
        <Field
          name={"defaultDns"}
          disabled={disabled}
          className={styles.input}
          size={INPUT_SIZE.M}
        />
        <FieldToggle name={"isProxyDefaultDns"} disabled={disabled}>
          Proxy this dns
        </FieldToggle>
      </div>
      <div className={styles.item}>
        <div className={styles.title}>Dns for gfw list:</div>
        <Field
          name={"gfwListDns"}
          disabled={disabled}
          className={styles.input}
          size={INPUT_SIZE.M}
        />
        <FieldToggle name={"isProxyGfwListDns"} disabled={disabled}>
          Proxy this dns
        </FieldToggle>
      </div>
      <div className={styles.item}>
        <Button isPrimary={true} onClick={openNativeWebsitesFile}>
          Open gfw list file
        </Button>
      </div>
      <div className={styles.footer}>
        <Button
          isPrimary={true}
          disabled={disabled || !isChanged}
          type={"submit"}
        >
          Apply
        </Button>
        <Button
          isBorder={true}
          onClick={reset}
          disabled={disabled || !isChanged}
        >
          Reset
        </Button>
      </div>
    </Form>
  );
});
