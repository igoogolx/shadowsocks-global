import React, { useCallback, useState } from "react";
import { Button, Field, Form, INPUT_SIZE } from "../Core";
import styles from "./setting.module.css";
import { isPort } from "../../utils/validator";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { GeneralState, setting } from "../../reducers/settingReducer";
import { notifier } from "../Core/Notification";
import { FieldToggle } from "../Core/Toggle/Toggle";
import { ipcRenderer } from "electron";

export const General = React.memo(() => {
  const general = useSelector<AppState, GeneralState>(
    (state) => state.setting.general
  );
  const disabled = useSelector<AppState, boolean>(
    (state) => state.proxy.isProcessing || state.proxy.isStarted
  );
  const [value, setValue] = useState(general);
  const [isChanged, setIsChanged] = useState(false);
  const dispatch = useDispatch();

  const onChange = useCallback(
    (field: { [key: string]: any }) => {
      setValue({ ...value, ...field });
      setIsChanged(true);
    },
    [value]
  );
  const onSubmit = useCallback(
    (data) => {
      dispatch(setting.actions.setGeneral(data));
      setIsChanged(false);
      if (general.isRunAtSystemStartup !== data.isRunAtSystemStartup)
        ipcRenderer.send("setRunAtSystemStartup");
      notifier.success("Update setting successfully");
    },
    [dispatch, general.isRunAtSystemStartup]
  );
  const reset = useCallback(() => {
    setValue(general);
    setIsChanged(false);
    notifier.success("Reset setting successfully");
  }, [general]);

  return (
    <Form onSubmit={onSubmit} onChange={onChange} value={value}>
      <div>
        <div className={styles.title}>Shadowsocks running port:</div>
        <Field
          name={"shadowsocksLocalPort"}
          type={"number"}
          size={INPUT_SIZE.S}
          placeholder={"0-65535"}
          className={styles.input}
          disabled={disabled}
          validate={isPort}
        />
      </div>
      <FieldToggle
        name={"isProxyUdp"}
        disabled={disabled}
        className={styles.item}
      >
        Proxy udp
      </FieldToggle>
      <FieldToggle
        name={"isUpdateSubscriptionsOnOpen"}
        disabled={disabled}
        className={styles.item}
      >
        Update subscriptions on open
      </FieldToggle>
      <FieldToggle
        name={"isRunAtSystemStartup"}
        disabled={disabled}
        className={styles.item}
      >
        Run at system startup
      </FieldToggle>
      <FieldToggle
        name={"isHideWhenWindowIsClosed"}
        disabled={disabled}
        className={styles.item}
      >
        Hide when window is closed
      </FieldToggle>
      <FieldToggle
        name={"isHideAfterConnection"}
        disabled={disabled}
        className={styles.item}
      >
        Hide after connection
      </FieldToggle>
      <FieldToggle name={"isAutoConnect"} disabled={disabled}>
        Automatically establish connection after startup
      </FieldToggle>
      <div className={styles.delayInput}>
        <div className={styles.label}>Delayed connect:</div>
        <Field
          name={"autoConnectDelay"}
          className={styles.field}
          type={"number"}
          disabled={disabled}
        />
        <div className={styles.label}>seconds</div>
      </div>
      <div className={styles.footer}>
        <Button
          type={"submit"}
          disabled={!isChanged || disabled}
          isPrimary={true}
        >
          Apply
        </Button>
        <Button
          disabled={!isChanged || disabled}
          isBorder={true}
          onClick={reset}
        >
          Reset
        </Button>
      </div>
    </Form>
  );
});
