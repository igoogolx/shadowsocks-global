import * as React from "react";
import classNames from "classnames";
import styles from "./table.module.css";
import { ReactNode } from "react";

export type TableProps = {
  children: ReactNode;
  className?: string;
};

export const Table = React.memo((props: TableProps) => {
  const { className, children } = props;

  const cls = classNames(className, styles.container);
  return <table className={cls}>{children}</table>;
});
