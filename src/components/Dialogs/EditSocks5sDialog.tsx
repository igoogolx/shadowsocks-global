import { proxy, Socks5 } from "../../reducers/proxyReducer";
import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { Field, Form } from "../Core/Form";
import styles from "./dialogs.module.css";
import { Button, Dialog, INPUT_SIZE } from "../Core";
import { RegionCodeSelector } from "./RegioncodeSelector";
import { isPort } from "../../utils/validator";

type EditSocks5sDialogProps = {
  close: () => void;
  initialValue?: Socks5;
};

export const EditSocks5sDialog = React.memo((props: EditSocks5sDialogProps) => {
  const { close, initialValue } = props;

  const [isChanged, setIsChanged] = useState(false);
  const [value, setValue] = useState(initialValue || { regionCode: "Auto" });
  const dispatch = useDispatch();

  const onChange = useCallback(
    (filedValue: { [key: string]: any }) => {
      setValue({ ...value, ...filedValue });
      setIsChanged(true);
    },
    [value]
  );
  const onSubmit = async (socks5: Omit<Socks5, "id">) => {
    if (initialValue)
      dispatch(
        proxy.actions.update({
          type: "socks5",
          id: initialValue.id,
          config: socks5,
        })
      );
    else
      dispatch(
        proxy.actions.add({
          type: "socks5",
          config: socks5,
        })
      );
    close();
  };
  return (
    <Dialog close={close}>
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
          autoFocus={true}
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
