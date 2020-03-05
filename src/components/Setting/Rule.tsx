import React, { useCallback, useMemo, useState } from "react";
import { Button, Field, Form, Icon, ICON_NAME, ICON_SIZE } from "../Core";
import styles from "./setting.module.css";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { RuleState, setting } from "../../reducers/settingReducer";
import promiseIpc from "electron-promise-ipc";
import { FieldToggle } from "../Core/Toggle/Toggle";
import { isIPv4 } from "net";
import { notifier } from "../Core/Notification";

export const Rule = React.memo(() => {
  const ruleState = useSelector<AppState, RuleState>(
    state => state.setting.rule
  );
  const initValue = useMemo(() => {
    const rule = ruleState;
    return {
      customizedRulesDirPath: rule.dirPath,
      additionalRoute: rule.additionRoutes[0]?.ip,
      isProxyAdditionalRoute: Boolean(rule.additionRoutes[0]?.isProxy)
    };
  }, [ruleState]);
  const [value, setValue] = useState(initValue);
  const disabled = useSelector<AppState, boolean>(
    state => state.proxy.isProcessing || state.proxy.isStarted
  );
  const [isChanged, setIsChanged] = useState(false);
  const dispatch = useDispatch();

  const onChange = useCallback(
    (field: { [key: string]: any }) => {
      setValue({ ...value, ...field });
      setIsChanged(true);
    },
    [value]
  );
  const reset = useCallback(() => {
    setValue(initValue);
    setIsChanged(false);
    notifier.success("Update setting successfully");
  }, [initValue]);
  const onSubmit = useCallback(
    data => {
      dispatch(
        setting.actions.setCustomizedRulesDirPath(data.customizedRulesDirPath)
      );
      if (data.additionalRoute)
        dispatch(
          setting.actions.addAdditionRoute({
            ip: data.additionalRoute,
            isProxy: data.isProxyAdditionalRoute
          })
        );
      setIsChanged(false);
      notifier.success("Reset setting successfully");
    },
    [dispatch]
  );
  return (
    <Form onSubmit={onSubmit} onChange={onChange} value={value}>
      <div className={styles.item}>
        <div className={styles.title}>Customized rules dir path:</div>
        <Field
          name={"customizedRulesDirPath"}
          placeholder={"Path to dir"}
          disabled={disabled}
          className={styles.input}
          adornment={
            <Button
              onClick={async () => {
                const rulesDir = await promiseIpc.send(
                  "getCustomizedRulesDirPath",

                  // @ts-ignore
                  ruleState.dirPath
                );
                if (rulesDir) {
                  setValue({
                    ...value,
                    customizedRulesDirPath: rulesDir as string
                  });
                  setIsChanged(true);
                }
              }}
              className={styles.adornment}
              disabled={disabled}
            >
              <Icon iconName={ICON_NAME.FOLDER} size={ICON_SIZE.SIZE24} />
            </Button>
          }
        />
      </div>
      <div className={styles.item}>
        <div className={styles.title}>Addition Route:</div>
        <Field
          name={"additionalRoute"}
          disabled={disabled}
          placeholder={"XXXX.XXXX.XXXX.XXXX"}
          //TODO: Allow to submit when addition route is empty
          validate={ip => isIPv4(ip) || ip.length === 0}
          className={styles.input}
        />
        <FieldToggle
          name={"isProxyAdditionalRoute"}
          disabled={disabled || !value.additionalRoute}
        >
          Proxy this route
        </FieldToggle>
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
