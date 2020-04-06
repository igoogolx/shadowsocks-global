import * as React from "react";
import classNames from "classnames";
import styles from "./table.module.css";
import { ReactNode } from "react";

type RowProps = {
  className?: string;
  children: ReactNode;
};

export const Row = React.memo((props: RowProps) => {
  const { className, children } = props;
  const cls = classNames(className, styles.row);

  return <tr className={cls}>{children}</tr>;
});
