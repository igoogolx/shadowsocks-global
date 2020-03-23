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
      <div className={styles.item}>
        <div className={styles.title}>Shadowsocks running port:</div>
        <Field
          name={"shadowsocksLocalPort"}
          type={"number"}
          size={INPUT_SIZE.S}
          placeholder={"0-65535"}
          className={styles.input}
          disabled={disabled}
          //TODO:Remove improper type assertion, because the input value must be number .
          validate={isPort as (port: number | string) => boolean}
        />
      </div>
      <FieldToggle
        name={"isProxyUdp"}
        disabled={disabled}
        className={styles.item}
      >
        Proxy Udp
      </FieldToggle>
      <FieldToggle
        name={"isUpdateSubscriptionsOnOpen"}
        disabled={disabled}
        className={styles.item}
      >
        Update Subscriptions On Open
      </FieldToggle>
      <FieldToggle
        name={"isRunAtSystemStartup"}
        disabled={disabled}
        className={styles.item}
      >
        Run at system startup
      </FieldToggle>
      <FieldToggle name={"isHideWhenWindowIsClosed"} disabled={disabled}>
        Hide when window is closed
      </FieldToggle>
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
