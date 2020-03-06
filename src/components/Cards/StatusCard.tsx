import { Card } from "../Core/Card/Card";
import styles from "./cards.module.css";
import React from "react";
import classNames from "classnames";
import { Icon, ICON_SIZE } from "../Core";

type StatusCardProps = {
  iconName: string;
  iconClassname?: string;
  title: string;
  data: string;
  onClick: () => void;
  disabled: boolean;
};
export const StatusCard = (props: StatusCardProps) => {
  const { iconName, iconClassname, title, data, onClick, disabled } = props;

  return (
    <Card className={styles.status} onClick={onClick} disabled={disabled}>
      <div className={classNames(styles.iconContainer, iconClassname)}>
        <Icon
          iconName={iconName}
          className={styles.icon}
          size={ICON_SIZE.SIZE24}
        />
      </div>
      <div className={styles.body}>
        <div className={styles.title}>{title}</div>
        <div className={styles.data}>{data}</div>
      </div>
    </Card>
  );
};
