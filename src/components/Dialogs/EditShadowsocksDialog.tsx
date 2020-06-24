import { proxy, Shadowsocks } from "../../reducers/proxyReducer";
import React, { useCallback, useRef, useState } from "react";
import { ENCRYPTION_METHODS } from "../../constants";
import { useDispatch } from "react-redux";
import { Field, Form } from "../Core/Form";
import styles from "./dialogs.module.css";
import { Button, Dialog, Icon, ICON_NAME, INPUT_SIZE } from "../Core";
import { isEmpty, isPort } from "../../utils/validator";
import { FieldSelector } from "../Core/Selector/Selector";
import { RegionCodeSelector } from "./RegioncodeSelector";
import { useTranslation } from "react-i18next";

type EditShadowsocksDialogProps = {
  close: () => void;
  initialValue?: Shadowsocks;
};

export const EditShadowsocksDialog = React.memo(
  (props: EditShadowsocksDialogProps) => {
    const { close, initialValue } = props;
    const [value, setValue] = useState(
      initialValue || { regionCode: "Auto", method: ENCRYPTION_METHODS[0] }
    );
    const methodsOptions = useRef(
      ENCRYPTION_METHODS.map((METHOD) => ({ value: METHOD }))
    );
    const [isChanged, setIsChanged] = useState(false);
    const [isShowPassword, setIsShowPassword] = useState(false);
    const onChange = useCallback(
      (filedValue: { [key: string]: any }) => {
        setValue({ ...value, ...filedValue });
        setIsChanged(true);
      },
      [value]
    );
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const onSubmit = async (shadowsocks: Omit<Shadowsocks, "id">) => {
      if (initialValue)
        dispatch(
          proxy.actions.update({
            type: "shadowsocks",
            id: initialValue.id,
            config: shadowsocks,
          })
        );
      else
        dispatch(
          proxy.actions.add({
            type: "shadowsocks",
            config: shadowsocks,
          })
        );
      close();
    };

    return (
      <Dialog close={close}>
        <Form
          onSubmit={onSubmit}
          className={styles.container}
          onChange={onChange}
          value={value}
        >
          <Field
            name={"host"}
            label={"Host"}
            className={styles.input}
            size={INPUT_SIZE.AUTO}
            validate={isEmpty}
            autoFocus={true}
          />
          <FieldSelector
            name={"method"}
            options={methodsOptions.current}
            label={t("form.encryption")}
            className={styles.selector}
          />
          <RegionCodeSelector />
          <Field
            name={"port"}
            label={"Port"}
            className={styles.input}
            size={INPUT_SIZE.AUTO}
            type={"number"}
            validate={isPort}
          />
          <Field
            name={"password"}
            label={"Password"}
            className={styles.input}
            size={INPUT_SIZE.AUTO}
            autoComplete={"current-password"}
            type={isShowPassword ? "text" : "password"}
            validate={isEmpty}
            adornment={
              <Button
                onClick={() => setIsShowPassword(!isShowPassword)}
                type={"button"}
                className={styles.adornment}
              >
                <Icon
                  iconName={
                    isShowPassword ? ICON_NAME.EYE_SLASH : ICON_NAME.EYE
                  }
                />
              </Button>
            }
          />
          <Field
            name={"name"}
            label={"Name"}
            className={styles.input}
            size={INPUT_SIZE.AUTO}
          />
          <Field
            name={"plugin"}
            label={"Plugin"}
            className={styles.input}
            size={INPUT_SIZE.AUTO}
          />
          <Field
            name={"plugin_opts"}
            label={"Plugin_opts"}
            className={styles.input}
            size={INPUT_SIZE.AUTO}
          />
          <div className={styles.buttonContainer}>
            <Button
              isPrimary={true}
              className={styles.button}
              disabled={!isChanged}
              type={"submit"}
            >
              {t("form.button.save")}
            </Button>
            <Button isPrimary={true} onClick={close} className={styles.button}>
              {t("form.button.cancel")}
            </Button>
          </div>
        </Form>
      </Dialog>
    );
  }
);
