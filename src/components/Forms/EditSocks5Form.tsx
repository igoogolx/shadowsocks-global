import React, { useCallback, useState } from "react";
import { Button, Field, Form, INPUT_SIZE } from "../Core";
import classNames from "classnames";
import styles from "./forms.module.css";
import { useDispatch } from "react-redux";
import { addProxy, Socks5, updateProxy } from "../../reducers/proxyReducer";
import { useHistory, useLocation } from "react-router-dom";
import { RegionCodeSelector } from "./RegioncodeSelector";
import { lookupRegionCodes } from "../../utils/lookupRegionCodes";
import { isPort } from "../../utils/validator";
type EditSocks5FormProps = {
  close: () => void;
  className?: string;
  defaultValue?: Socks5;
};

export const EditSocks5Form = (props: EditSocks5FormProps) => {
  const { className, close, defaultValue } = props;
  const [isChanged, setIsChanged] = useState(false);
  const [value, setValue] = useState(defaultValue || { regionCode: "Auto" });
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();
  const success = () => {
    close();
    if (location.pathname !== "/proxies") history.push("/proxies");
  };

  const onChange = useCallback(
    (filedValue: { [key: string]: any }) => {
      setValue({ ...value, ...filedValue });
      setIsChanged(true);
    },
    [value]
  );
  const onSubmit = async (socks5: Omit<Socks5, "id">) => {
    let searchedRegionCode;
    if (socks5.regionCode === "Auto")
      try {
        searchedRegionCode = await lookupRegionCodes([socks5.host]).then(
          regionCodes => regionCodes[0]
        );
      } catch (e) {}
    if (defaultValue)
      dispatch(
        updateProxy({
          type: "socks5",
          config: {
            ...socks5,
            id: defaultValue.id,
            regionCode: searchedRegionCode || socks5.regionCode
          }
        })
      );
    else
      dispatch(
        addProxy({
          type: "socks5",
          config: {
            ...socks5,
            regionCode: searchedRegionCode || socks5.regionCode
          }
        })
      );
    success();
  };
  return (
    <Form
      onSubmit={onSubmit}
      className={classNames(styles.container, className)}
      value={value}
      onChange={onChange}
    >
      <Field
        name={"host"}
        label={"Host"}
        className={styles.input}
        size={INPUT_SIZE.AUTO}
      />

      <RegionCodeSelector />
      <Field
        name={"port"}
        label={"Port"}
        type={"number"}
        className={styles.input}
        size={INPUT_SIZE.AUTO}
        //@ts-ignore
        validate={isPort}
      />

      <div className={styles.buttonContainer}>
        <Button
          isPrimary={true}
          className={styles.button}
          type={"submit"}
          disabled={!isChanged}
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
