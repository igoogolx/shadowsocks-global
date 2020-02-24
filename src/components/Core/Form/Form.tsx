import { createContext, useState } from "react";
import * as React from "react";
import classNames from "classnames";
import styles from "./form.module.css";
import { FormContextType } from "./index";

type FormProps = {
  onSubmit: Function;
  onChange: (value: { [key: string]: any }) => void;
  children: React.ReactNode;
  className?: string;
  value: { [key: string]: any };
};

export const FormContext = createContext<FormContextType | null>(null);

export const Form = React.memo((props: FormProps) => {
  const { onSubmit, children, className, onChange, value } = props;
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validateStatus, setValidateStatus] = useState({});
  const isValid = Object.values(validateStatus).every(isValid => isValid);

  return (
    <FormContext.Provider
      value={{
        value,
        onChange,
        isSubmitted,
        setValidateStatus
      }}
    >
      <form
        onSubmit={e => {
          e.preventDefault();
          if (!isSubmitted) setIsSubmitted(true);
          if (!isValid) return;
          onSubmit(value);
        }}
        className={classNames(className, styles.container)}
      >
        {children}
      </form>
    </FormContext.Provider>
  );
});
