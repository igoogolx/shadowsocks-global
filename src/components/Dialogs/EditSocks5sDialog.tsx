import { addProxy, Socks5, updateProxy } from "../../reducers/proxyReducer";
import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { useHistory, useLocation } from "react-router-dom";
import { lookupRegionCodes } from "../../utils/lookupRegionCodes";
import { Field, Form } from "../Core/Form";
import styles from "./dialogs.module.css";
import { Button, Dialog, INPUT_SIZE } from "../Core";
import { RegionCodeSelector } from "./RegioncodeSelector";
import { isPort } from "../../utils/validator";

type EditSocks5sDialogProps = {
  isShow: boolean;
  close: () => void;
  initialValue?: Socks5;
};

export const EditSocks5sDialog = React.memo((props: EditSocks5sDialogProps) => {
  const { isShow, close, initialValue } = props;

  const [isChanged, setIsChanged] = useState(false);
  const [value, setValue] = useState(initialValue || { regionCode: "Auto" });
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
    if (initialValue)
      dispatch(
        updateProxy({
          type: "socks5",
          config: {
            ...socks5,
            id: initialValue.id,
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
    <Dialog isShow={isShow} close={close}>
      <Form
        onSubmit={onSubmit}
        className={styles.container}
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
          <Button isPrimary={true} onClick={close} className={styles.button}>
            Cancel
          </Button>
        </div>
      </Form>
    </Dialog>
  );
});
