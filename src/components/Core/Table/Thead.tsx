import React, { ReactNode } from "react";
import styles from "./table.module.css";

type TheadProps = {
  children?: ReactNode;
};

export const Thead = React.memo((props: TheadProps) => {
  const { children } = props;
  return (
    <thead className={styles.head}>
      <tr>{children}</tr>
    </thead>
  );
});
