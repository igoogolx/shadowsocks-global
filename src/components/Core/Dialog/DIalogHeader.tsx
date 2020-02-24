import React from "react";
import styles from "./dialog.module.css";

type DialogHeaderProps = {
  title: string;
};

export const DialogHeader = (props: DialogHeaderProps) => {
  const { title } = props;
  return (
    <div className={styles.header}>
      <span className={styles.title}>{title}</span>
    </div>
  );
};
