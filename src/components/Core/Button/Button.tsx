import React from "react";
import styles from "./button.module.css";
import { ICON_NAME, Icon, ICON_SIZE } from "..";
import classNames from "classnames";
import { BUTTON_SIZE } from "./button_contants";

type ButtonProps = {
  //For Tab component
  id?: string;

  className?: string;

  isBorder?: boolean;
  isPrimary?: boolean;
  isLoading?: boolean;
  isDanger?: boolean;

  onClick?: React.MouseEventHandler<HTMLButtonElement>;

  children?: React.ReactNode;

  size?: string;

  isLink?: boolean;

  buttonRef?: React.RefObject<HTMLButtonElement>;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "id">;

export const Button = React.memo((props: ButtonProps) => {
  const {
    className,
    children,
    onClick,
    isPrimary,
    isLoading,
    size = BUTTON_SIZE.default,
    isBorder = false,
    isLink = false,
    isDanger = false,
    buttonRef,
    type = "button",
    ...restProps
  } = props;

  const buttonCls = classNames(styles.container, className, styles[size], {
    [styles.primary]: isPrimary,
    [styles.border]: isBorder,
    [styles.link]: isLink,
    [styles.danger]: isDanger
  });

  return (
    <button
      onClick={onClick}
      className={buttonCls}
      ref={buttonRef}
      type={type}
      {...restProps}
    >
      {isLoading && (
        <Icon
          iconName={ICON_NAME.LOADING}
          isLoading={true}
          className={styles.loading}
          size={ICON_SIZE.SIZE14}
        />
      )}
      {children && <span>{children}</span>}
    </button>
  );
});
