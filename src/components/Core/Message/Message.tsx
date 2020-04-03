import React from "react";
import styles from "./message.module.css";
import { ICON_NAME, ICON_SIZE, Icon, Button } from "..";
import classNames from "classnames";

export type MessageType = "Error" | "Success" | "Warning";

type MessageProps = {
  title: string;
  className?: string;
  type?: MessageType;
  close: () => void;
} & React.HTMLAttributes<HTMLDivElement>;

export const Message = React.memo((props: MessageProps) => {
  const { title, type = "Info", close, className, ...restProps } = props;

  const iconCls = classNames(styles.icon, {
    [styles.info]: type === "Info",
    [styles.waring]: type === "Warning",
    [styles.error]: type === "Error",
    [styles.success]: type === "Success",
  });
  const iconName =
    type === "Info"
      ? ICON_NAME.INFO
      : type === "Error"
      ? ICON_NAME.ERROR
      : type === "Success"
      ? ICON_NAME.SUCCESS
      : type === "Warning"
      ? ICON_NAME.WARNING
      : "";

  const cls = classNames(styles.message, className);

  return (
    <div className={cls} {...restProps}>
      {ICON_NAME && (
        <div className={styles.iconContainer}>
          <Icon
            className={iconCls}
            iconName={iconName}
            size={ICON_SIZE.SIZE20}
          />
        </div>
      )}
      <div className={styles.popup}>
        <span>{title}</span>
      </div>
      <Button className={styles.close} onClick={close}>
        <Icon iconName={ICON_NAME.CLOSE} size={ICON_SIZE.SIZE20} />
      </Button>
    </div>
  );
});
