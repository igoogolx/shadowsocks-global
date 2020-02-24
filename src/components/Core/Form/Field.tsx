import { Input, InputProps } from "../Input/Input";
import { default as React, useContext, useEffect, useState } from "react";
import classNames from "classnames";
import styles from "./form.module.css";
import { FormContext } from "./Form";
import { FormContextType } from "./index";

type FieldProps = {
  name: string;
  validate?: (value: string) => boolean;
} & Omit<InputProps, "value" | "onChange" | "isValid">;

export const Field = (props: FieldProps) => {
  const [isValid, setIsValid] = useState(true);
  const { name, validate, className, ...restProps } = props;
  const form = useContext(FormContext) as FormContextType;
  const { onChange, isSubmitted, value: formData, setValidateStatus } = form;
  const value = formData[name];

  useEffect(() => {
    setValidateStatus((validateStatus: any) => ({
      ...validateStatus,
      [name]: isValid
    }));
  }, [isValid, name, setValidateStatus]);
  useEffect(() => {
    if (validate) {
      setIsValid(validate(value || ""));
    }
  }, [value, isSubmitted]); // eslint-disable-line

  return (
    <Input
      value={formData[name] || ""}
      onChange={e => {
        onChange({
          //TODO: is this best to get number?
          [name]: e.target.valueAsNumber || e.target.value
        });
      }}
      {...restProps}
      isValid={!isSubmitted || isValid}
      className={classNames(className, styles.input)}
    />
  );
};
