import React from "react";
import classNames from "classnames";
import styles from "./dot.module.css";

type DotProps = {
  type?: "enabled" | "disabled";
  className?: string;
};

export const Dot = React.memo((props: DotProps) => {
  const { type, className } = props;

  const cls = classNames(styles.container, className, {
    [styles.disabled]: type === "disabled",
    [styles.enabled]: type === "enabled"
  });

  return <div className={cls} />;
});
