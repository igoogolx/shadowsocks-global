import React, { ReactNode } from "react";
import styles from "./table.module.css";
import classNames from "classnames";

type ColumnProps = {
  children: ReactNode;
  className?: string;
};

export const Column = React.memo((props: ColumnProps) => {
  const { children, className } = props;
  return <th className={classNames(styles.column, className)}>{children}</th>;
});
