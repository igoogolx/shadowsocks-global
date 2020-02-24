import React, { ReactNode } from "react";
import styles from "./card.module.css";
import classNames from "classnames";

type CardProps = {
  onClick?: Function;
  className?: string;
  disabled?: boolean;
  children: ReactNode;
};

export const Card = React.memo((props: CardProps) => {
  const { onClick, className, children, disabled } = props;
  const isClickable = Boolean(onClick);
  const cls = classNames(className, styles.container, {
    [styles.disabled]: disabled || !isClickable,
    [styles.clickable]: isClickable
  });
  return (
    <div
      className={cls}
      onClick={() => {
        if (disabled) return;
        if (onClick) onClick();
      }}
    >
      {children}
    </div>
  );
});
