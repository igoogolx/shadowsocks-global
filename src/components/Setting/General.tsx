import React, { useCallback, useState } from "react";
import { Button, Field, Form, INPUT_SIZE } from "../Core";
import styles from "./setting.module.css";
import { isPort } from "../../utils/validator";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { GeneralState, setting } from "../../reducers/settingReducer";
import { notifier } from "../Core/Notification";
import { FieldToggle } from "../Core/Toggle/Toggle";
import { setRunAtSystemStartup } from "../../utils/ipc";
import { useTranslation } from "react-i18next";

type GeneralProps = {
  close: () => void;
};

export const General = React.memo((props: GeneralProps) => {
  const { close } = props;
  const general = useSelector<AppState, GeneralState>(
    (state) => state.setting.general
  );
  const disabled = useSelector<AppState, boolean>(
    (state) => state.proxy.isProcessing || state.proxy.isConnected
  );
  const [value, setValue] = useState(general);
  const [isChanged, setIsChanged] = useState(false);
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const onChange = useCallback(
    (field: { [key: string]: any }) => {
      setValue({ ...value, ...field });
      setIsChanged(true);
    },
    [value]
  );
  const onSubmit = useCallback(
    async (data) => {
      dispatch(setting.actions.setGeneral(data));
      setIsChanged(false);
      if (general.runAtSystemStartup !== data.isRunAtSystemStartup)
        setRunAtSystemStartup();
      close();
      notifier.success(t("message.success.updateSetting"));
    },
    [close, dispatch, general.runAtSystemStartup, t]
  );
  const reset = useCallback(() => {
    setValue(general);
    setIsChanged(false);
    notifier.success(t("message.success.resetSetting"));
  }, [general, t]);
  return (
    <Form onSubmit={onSubmit} onChange={onChange} value={value}>
      <div>
        <div className={styles.title}>{t("setting.general.port")}</div>
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
        name={"dnsOverUdp"}
        disabled={disabled}
        className={styles.item}
      >
        {t("setting.general.dns")}
      </FieldToggle>
      <FieldToggle
        name={"updateSubscriptionsOnOpen"}
        disabled={disabled}
        className={styles.item}
      >
        {t("setting.general.subscription")}
      </FieldToggle>
      <FieldToggle
        name={"runAtSystemStartup"}
        disabled={disabled}
        className={styles.item}
      >
        {t("setting.general.run")}
      </FieldToggle>
      <FieldToggle
        name={"hideWhenWindowIsClosed"}
        disabled={disabled}
        className={styles.item}
      >
        {t("setting.general.close")}
      </FieldToggle>
      <FieldToggle
        name={"hideAfterConnection"}
        disabled={disabled}
        className={styles.item}
      >
        {t("setting.general.connection")}
      </FieldToggle>
      <FieldToggle name={"autoConnect"} disabled={disabled}>
        {t("setting.general.auto")}
      </FieldToggle>
      <div className={styles.delayInput}>
        <div className={styles.label}>
          {t("setting.general.delay.description")}:
        </div>
        <Field
          name={"autoConnectDelay"}
          className={styles.field}
          type={"number"}
          disabled={disabled}
        />
        <div className={styles.label}>{t("setting.general.delay.unit")}</div>
      </div>
      <div className={styles.footer}>
        <Button
          type={"submit"}
          disabled={!isChanged || disabled}
          isPrimary={true}
        >
          {t("form.button.apply")}
        </Button>
        <Button
          disabled={!isChanged || disabled}
          isBorder={true}
          onClick={reset}
        >
          {t("form.button.reset")}
        </Button>
      </div>
    </Form>
  );
});
