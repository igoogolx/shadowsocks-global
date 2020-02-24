import React, { ChangeEvent, useCallback, useContext } from "react";
import classNames from "classnames";
import styles from "./toggle.module.css";
import { FormContext, FormContextType } from "../Form";

type ToggleProps = {
  children?: React.ReactNode;
  className?: string;
  title?: string;
  leftLabel?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

//TODO: remove unnecessary props.
export const Toggle = React.memo((props: ToggleProps) => {
  const {
    className,
    children,
    disabled,
    title,
    leftLabel,
    checked,
    ...restProps
  } = props;

  const classes = classNames(
    className,
    styles.container,
    disabled && styles.disabled
  );

  return (
    <label className={classes} title={title}>
      {leftLabel && <span className={styles.leftLabel}>{leftLabel}</span>}

      <span className={styles.switchWrapper}>
        <input
          {...restProps}
          type="checkbox"
          disabled={disabled}
          className={styles.input}
          checked={checked}
        />

        <span className={styles.switch} />
      </span>

      {children && <span className={styles.label}>{children}</span>}
    </label>
  );
});

export const FieldToggle = React.memo(
  (props: { name: string } & Omit<ToggleProps, "onChange" | "checked">) => {
    const { name, children, ...restProps } = props;
    const form = useContext(FormContext) as FormContextType;
    const { onChange: onFormChange, value: formValue } = form;
    const onChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        onFormChange({ [name]: e.currentTarget.checked });
      },
      [name, onFormChange]
    );
    return (
      <Toggle checked={formValue[name]} {...restProps} onChange={onChange}>
        {children}
      </Toggle>
    );
  }
);
