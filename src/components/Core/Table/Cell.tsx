import React from "react";
import styles from "./table.module.css";
import classNames from "classnames";

type CellProps = {
  className?: string;
  children: React.ReactNode;
};

export const Cell = (props: CellProps) => {
  const { children, className, ...restProps } = props;

  const cls = classNames(className, styles.cell);

  return (
    <td {...restProps} className={cls}>
      {children}
    </td>
  );
};
