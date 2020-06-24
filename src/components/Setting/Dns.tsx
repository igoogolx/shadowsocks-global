import React, { useCallback, useMemo, useState } from "react";
import styles from "./setting.module.css";
import { Button, Field, Form, INPUT_SIZE } from "../Core";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { DnsSettingState, setting } from "../../reducers/settingReducer";
import { notifier } from "../Core/Notification";
import { useTranslation } from "react-i18next";

export const Dns = React.memo(() => {
  const dnsState = useSelector<AppState, DnsSettingState>(
    (state) => state.setting.dns
  );
  const initValue = useMemo(() => {
    const dns = dnsState;
    return {
      localDns: dns.local,
      remoteDns: dns.remote,
    };
  }, [dnsState]);
  const [dnsSetting, setDnsSetting] = useState(initValue);
  const disabled = useSelector<AppState, boolean>(
    (state) => state.proxy.isProcessing || state.proxy.isConnected
  );
  const [isChanged, setIsChanged] = useState(false);
  const dispatch = useDispatch();
  const { t } = useTranslation();

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
          local: data.localDns,
          remote: data.remoteDns,
        })
      );
      setIsChanged(false);
      notifier.success("Update setting successfully");
    },
    [dispatch]
  );

  return (
    <Form onSubmit={onSubmit} onChange={onChange} value={dnsSetting}>
      <div className={styles.item}>
        <div className={styles.title}> {t("setting.dns.local")}:</div>
        <Field
          name={"localDns"}
          disabled={disabled}
          className={styles.input}
          size={INPUT_SIZE.M}
        />
      </div>
      <div className={styles.item}>
        <div className={styles.title}>{t("setting.dns.remote")}:</div>
        <Field
          name={"remoteDns"}
          disabled={disabled}
          className={styles.input}
          size={INPUT_SIZE.M}
        />
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
