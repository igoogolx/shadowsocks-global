import React, { useState, useMemo, useContext, useCallback } from "react";
import { Button, Dropdown, Icon, ICON_NAME, ICON_SIZE } from "../index";
import styles from "./selector.module.css";
import classNames from "classnames";
import { FormContext, FormContextType } from "../Form";

export type Option = {
  iconName?: string;
  iconType?: "iconFont" | "flag";
  value: string;
};
type SelectorProps = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  buttonClassName?: string;
  optionsClassName?: string;
  disabled?: boolean;
  isVirtualizedList?: boolean;
};

export const Selector = (props: SelectorProps) => {
  const {
    options,
    onChange,
    label,
    buttonClassName,
    optionsClassName,
    className,
    disabled,
    value,
    isVirtualizedList
  } = props;
  const currentOption = useMemo(
    () => options.find(option => option.value === value) || { value },
    [options, value]
  );
  const [isOpen, setIsOpen] = useState(false);

  const items = useMemo(
    () =>
      options.map(option => ({
        ...option,
        content: option.value,
        handleOnClick: () => {
          onChange(option.value);
        }
      })),
    [onChange, options]
  );

  return (
    <div className={classNames(styles.container, className)}>
      {label && (
        <div className={styles.label}>
          <span>{label}:</span>
        </div>
      )}
      <Dropdown
        items={items}
        className={styles.content}
        menuClassName={classNames(optionsClassName, styles.menu)}
        onChange={setIsOpen}
        disabled={disabled}
        isVirtualizedList={isVirtualizedList}
      >
        <Button
          isBorder={true}
          className={classNames(styles.button, buttonClassName)}
          type={"button"}
          disabled={disabled}
        >
          {currentOption.iconName && (
            <Icon
              iconName={currentOption.iconName}
              type={currentOption.iconType}
              className={styles.icon}
            />
          )}
          <div className={styles.value}>{currentOption.value}</div>
          <Icon
            iconName={isOpen ? ICON_NAME.UP : ICON_NAME.DOWN}
            size={ICON_SIZE.SIZE12}
            className={styles.icon}
          />
        </Button>
      </Dropdown>
    </div>
  );
};

export const FieldSelector = React.memo(
  (props: Omit<{ name: string } & SelectorProps, "onChange" | "value">) => {
    const { name, ...restProps } = props;
    const form = useContext(FormContext) as FormContextType;
    const { onChange, value: formValue } = form;
    const onChangeMemo = useCallback(
      (value: string) => onChange({ [name]: value }),
      [name, onChange]
    );
    return (
      <Selector
        value={formValue[name]}
        onChange={onChangeMemo}
        {...restProps}
      />
    );
  }
);
