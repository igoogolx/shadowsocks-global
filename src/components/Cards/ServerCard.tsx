import styles from "./cards.module.css";
import { Button, Icon, ICON_NAME } from "../Core";
import React from "react";
import { useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { Dot } from "../Dot/Dot";
import { Card } from "../Core/Card/Card";

type ServerCardProps = {
  id: string;
  onClickDropdown: React.MouseEventHandler<HTMLButtonElement>;
  onClick: () => void;
  title: string;
  delay?: string;
  regionCode?: string;
  disabled?: boolean;
};

export const ServerCard = React.memo((props: ServerCardProps) => {
  const { onClickDropdown, title, regionCode, onClick, delay, id } = props;
  const activeId = useSelector<AppState, string>(state => state.proxy.activeId);
  const disabled = useSelector<AppState, boolean>(
    state => state.proxy.isStarted || state.proxy.isProcessing
  );
  const isActive = activeId === id;

  return (
    <div className={styles.server}>
      <Button
        className={styles.dropdown}
        onClick={onClickDropdown}
        disabled={isActive && disabled}
      >
        <Icon iconName={ICON_NAME.OMIT} />
      </Button>
      <Card
        onClick={onClick}
        className={styles.card}
        disabled={disabled || isActive}
      >
        <div className={styles.flagContainer}>
          {regionCode && (
            <Icon iconName={regionCode} type={"flag"} className={styles.flag} />
          )}
        </div>
        <div className={styles.body}>
          <div className={styles.title}>{title}</div>
        </div>
        {delay && <div className={styles.delay}>{delay}ms</div>}
        {isActive && <Dot type={"enabled"} className={styles.dot} />}
      </Card>
    </div>
  );
});
