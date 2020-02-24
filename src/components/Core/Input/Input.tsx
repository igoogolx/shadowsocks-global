import React, { ChangeEvent, ReactNode } from "react";
import classNames from "classnames";
import styles from "./input.module.css";

export type InputProps = {
  label?: string;
  isValid?: boolean;
  errorMsg?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  isBorderLess?: boolean;
  isActive?: boolean;
  className?: string;
  size?: string;
  autoFocus?: boolean;
  adornment?: ReactNode;
  htmlSize?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">;

export const INPUT_SIZE = {
  AUTO: "Auto",
  S: "sizeS",
  M: "sizeM",
  L: "sizeL",
  FULL: "sizeFULL"
};

const Input = (props: InputProps) => {
  const {
    value,
    isActive,
    label,
    isValid = true,
    errorMsg,
    isBorderLess,
    className,
    size = INPUT_SIZE.M,
    adornment,
    htmlSize,
    ...restProps
  } = props;

  const isEmpty = !value?.toString().length;

  const cls = classNames(styles.container, className, styles[size], {
    [styles.active]: isActive,
    [styles.message]: !isValid,
    [styles.empty]: isEmpty,
    [styles.borderLess]: isBorderLess
  });

  return (
    <div className={cls}>
      {adornment && <div className={styles.adornment}>{adornment}</div>}
      <input
        value={value}
        className={styles.input}
        size={htmlSize}
        {...restProps}
      />
      {!isBorderLess && <label className={styles.label}>{label}</label>}
      {!isBorderLess && <div className={styles.underline} />}
      {!isBorderLess && <div className={styles.focusUnderline} />}
      {!isBorderLess && <div className={styles.errorUnderline} />}
      {!isBorderLess && !isValid && (
        <div className={styles.errorText}>{errorMsg}</div>
      )}
    </div>
  );
};

const InputMemo = React.memo(Input);

export { InputMemo as Input };
