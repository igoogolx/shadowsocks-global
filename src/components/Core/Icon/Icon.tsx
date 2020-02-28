import React from "react";
import styles from "./icon.module.css";
import classNames from "classnames";
import { ICON_SIZE } from "./icon_contants";

type IconProps = {
  iconName: string;
  isLoading?: boolean;
  size?: string;
  className?: string;
  type?: "iconFont" | "flag";
  iconRef?: React.RefObject<any>;
};
const Icon = (props: IconProps) => {
  const {
    isLoading = false,
    size = ICON_SIZE.DEFAULT,
    iconName,
    className,
    type = "iconFont",
    iconRef
  } = props;
  const cls = classNames(styles.container, styles[size], className, {
    [styles.iconLoading]: isLoading
  });
  return type === "iconFont" ? (
    <svg
      aria-hidden="true"
      className={classNames(styles.svg, cls)}
      ref={iconRef}
    >
      <use href={`#icon-${iconName}`} />
    </svg>
  ) : (
    <span
      className={`flag-icon flag-icon-${iconName.toLowerCase()} ${className}`}
      ref={iconRef}
    />
  );
};

const IconMemo = React.memo(Icon);

export { IconMemo as Icon };
