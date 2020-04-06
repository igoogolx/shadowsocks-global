import React, { ReactNode } from "react";
import styles from "./table.module.css";

type TbodyProps = {
  children?: ReactNode;
};

export const Tobody = React.memo((props: TbodyProps) => {
  const { children } = props;
  return <tbody className={styles.header}>{children}</tbody>;
});
