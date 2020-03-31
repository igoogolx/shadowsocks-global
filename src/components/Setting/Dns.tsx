import React, { useCallback, useMemo, useState } from "react";
import styles from "./setting.module.css";
import { FieldToggle } from "../Core/Toggle/Toggle";
import { Button, Field, Form, INPUT_SIZE } from "../Core";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { DnsSettingState, setting } from "../../reducers/settingReducer";
import { FieldSelector } from "../Core/Selector/Selector";
import { isIPv4 } from "net";
import { DNS_CUSTOMIZED_TYPE, DNS_SMART_TYPE } from "../../constants";
import { notifier } from "../Core/Notification";
import { ipcRenderer } from "electron";

const typeOptions = [{ value: DNS_SMART_TYPE }, { value: DNS_CUSTOMIZED_TYPE }];
export const Dns = React.memo(() => {
  const dnsState = useSelector<AppState, DnsSettingState>(
    (state) => state.setting.dns
  );
  const initValue = useMemo(() => {
    const dns = dnsState;
    return {
      type: dns.type,
      defaultWebsiteDns: dns.smart.defaultWebsite.server,
      isProxyDefaultWebsiteDns: dns.smart.defaultWebsite.isProxy,
      nativeWebsiteDns: dns.smart.nativeWebsite.server,
      isProxyNativeWebsiteDns: dns.smart.nativeWebsite.isProxy,
      preferredCustomizedServer: dns.customized.preferredServer,
      alternateCustomizedServer: dns.customized.alternateServer,
      isProxyCustomizedDns: dns.customized.isProxy,
    };
  }, [dnsState]);
  const [dnsSetting, setDnsSetting] = useState(initValue);
  const isSmartDns = dnsSetting.type === DNS_SMART_TYPE;
  const disabled = useSelector<AppState, boolean>(
    (state) => state.proxy.isProcessing || state.proxy.isStarted
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
      if (data.type === "smart")
        dispatch(
          setting.actions.setSmartDns({
            defaultWebsite: {
              isProxy: data.isProxyDefaultWebsiteDns,
              server: data.defaultWebsiteDns,
            },
            nativeWebsite: {
              isProxy: data.isProxyNativeWebsiteDns,
              server: data.nativeWebsiteDns,
            },
          })
        );
      else
        dispatch(
          setting.actions.setCustomizedDns({
            isProxy: data.isProxyCustomizedDns,
            preferredServer: data.preferredCustomizedServer,
            alternateServer: data.alternateCustomizedServer,
          })
        );

      setIsChanged(false);
      notifier.success("Update setting successfully");
    },
    [dispatch]
  );

  const openNativeWebsitesFile = useCallback(() => {
    ipcRenderer.send("openDnsNativeWebsitesFile");
  }, []);

  return (
    <Form onSubmit={onSubmit} onChange={onChange} value={dnsSetting}>
      <div className={styles.item}>
        <div className={styles.title}>Type:</div>
        <FieldSelector
          name={"type"}
          options={typeOptions}
          disabled={disabled}
        />
      </div>
      {isSmartDns && (
        <>
          <div className={styles.item}>
            <div className={styles.title}>Default dns:</div>
            <Field
              name={"defaultWebsiteDns"}
              disabled={disabled}
              className={styles.input}
              size={INPUT_SIZE.M}
            />
            <FieldToggle name={"isProxyDefaultWebsiteDns"} disabled={disabled}>
              Proxy this dns
            </FieldToggle>
          </div>
          <div className={styles.item}>
            <div className={styles.title}>Dns for native website:</div>
            <Field
              name={"nativeWebsiteDns"}
              disabled={disabled}
              className={styles.input}
              size={INPUT_SIZE.M}
            />
            <FieldToggle name={"isProxyNativeWebsiteDns"} disabled={disabled}>
              Proxy this dns
            </FieldToggle>
          </div>
          <div className={styles.item}>
            <Button isPrimary={true} onClick={openNativeWebsitesFile}>
              Open native websites file
            </Button>
          </div>
        </>
      )}
      {isSmartDns || (
        <>
          <div className={styles.title}>Servers:</div>
          <Field
            name={"preferredCustomizedServer"}
            disabled={disabled}
            label={"Preferred server"}
            placeholder={"XXXX.XXXX.XXXX.XXXX"}
            className={styles.input}
            validate={isIPv4}
          />
          <Field
            name={"alternateCustomizedServer"}
            disabled={disabled}
            label={"Alternate server"}
            placeholder={"XXXX.XXXX.XXXX.XXXX"}
            className={styles.input}
            validate={isIPv4}
          />
          <FieldToggle name={"isProxyCustomizedDns"} disabled={disabled}>
            Proxy this dns
          </FieldToggle>
        </>
      )}

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
