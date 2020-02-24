import styles from "./forms.module.css";
import { Field, Form } from "../Core/Form";
import { Button, Icon, ICON_NAME, INPUT_SIZE } from "../Core";
import React, { useState, useRef, useCallback } from "react";
import { useHistory, useLocation } from "react-router-dom";
import classNames from "classnames";
import {
  addProxy,
  Shadowsocks,
  updateProxy
} from "../../reducers/proxyReducer";
import { useDispatch } from "react-redux";
import { ENCRYPTION_METHODS } from "../../constants";
import { lookupRegionCodes } from "../../utils/lookupRegionCodes";
import { FieldSelector } from "../Core/Selector/Selector";
import { RegionCodeSelector } from "./RegioncodeSelector";
import { isEmpty, isPort } from "../../utils/validator";

type EditShadowsocksFormProps = {
  close: () => void;
  className?: string;
  defaultValue?: Shadowsocks;
};
export const EditShadowsocksForm = (props: EditShadowsocksFormProps) => {
  const { close, className, defaultValue } = props;
  const [value, setValue] = useState(
    defaultValue || { regionCode: "Auto", method: ENCRYPTION_METHODS[0] }
  );
  const methodsOptions = useRef(
    ENCRYPTION_METHODS.map(METHOD => ({ value: METHOD }))
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
  const history = useHistory();
  const location = useLocation();
  const success = () => {
    close();
    if (location.pathname !== "/proxies") history.push("/proxies");
  };

  const onSubmit = async (shadowsocks: Omit<Shadowsocks, "id">) => {
    let searchedRegionCode;
    if (shadowsocks.regionCode === "Auto")
      try {
        searchedRegionCode = await lookupRegionCodes([shadowsocks.host]).then(
          regionCodes => regionCodes[0]
        );
      } catch (e) {}
    if (defaultValue)
      dispatch(
        updateProxy({
          type: "shadowsocks",
          config: {
            ...shadowsocks,
            id: defaultValue.id,
            regionCode: searchedRegionCode || shadowsocks.regionCode
          }
        })
      );
    else
      dispatch(
        addProxy({
          type: "shadowsocks",
          config: {
            ...shadowsocks,
            regionCode: searchedRegionCode || shadowsocks.regionCode
          }
        })
      );
    success();
  };

  return (
    <Form
      onSubmit={onSubmit}
      className={classNames(styles.container, className)}
      onChange={onChange}
      value={value}
    >
      <Field
        name={"host"}
        label={"Host"}
        className={styles.input}
        size={INPUT_SIZE.AUTO}
        validate={isEmpty}
      />
      <FieldSelector
        name={"method"}
        options={methodsOptions.current}
        label={"Encryption"}
        className={styles.selector}
      />
      <RegionCodeSelector />
      <Field
        name={"port"}
        label={"Port"}
        className={styles.input}
        size={INPUT_SIZE.AUTO}
        type={"number"}
        //TODO:Remove improper type assertions, because the input value must be number .
        validate={isPort as (value: string | number) => boolean}
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
              iconName={isShowPassword ? ICON_NAME.EYE_SLASH : ICON_NAME.EYE}
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
          Save
        </Button>
        <Button
          isPrimary={true}
          onClick={() => {
            close();
          }}
          className={styles.button}
        >
          Cancel
        </Button>
      </div>
    </Form>
  );
};
