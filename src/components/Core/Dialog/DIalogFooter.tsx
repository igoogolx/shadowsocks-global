import React from "react";
import styles from "./dialog.module.css";

type DialogFooterProps = {
  content: React.ReactNode;
};

export const DialogFooter = (props: DialogFooterProps) => {
  const { content } = props;
  return <div className={styles.footer}>{content}</div>;
};
