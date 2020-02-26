import React, { useCallback, useState } from "react";
import { Button, Field, Form, INPUT_SIZE } from "../Core";
import styles from "./setting.module.css";
import { isPort } from "../../utils/validator";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import {
  GeneralState,
  setShadowsocksLocalPort
} from "../../reducers/settingReducer";
import { notifier } from "../Core/Notification";

export const General = React.memo(() => {
  const general = useSelector<AppState, GeneralState>(
    state => state.setting.general
  );
  const disabled = useSelector<AppState, boolean>(
    state => state.proxy.isProcessing || state.proxy.isStarted
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
    data => {
      dispatch(setShadowsocksLocalPort(data.shadowsocksLocalPort));
      setIsChanged(false);
      notifier.success("Update setting successfully");
    },
    [dispatch]
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
