import styles from "./cards.module.css";
import { Dropdown, Icon, ICON_NAME } from "../Core";
import React from "react";
import { useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { Dot } from "../Dot/Dot";
import { Card } from "../Core/Card/Card";
import { MenuItemProps } from "../Core/Menu/Menu";

type ServerCardProps = {
  id: string;
  menuItems: MenuItemProps[];
  onClick: () => void;
  title: string;
  delay?: string;
  regionCode?: string;
  disabled?: boolean;
};

export const ServerCard = React.memo((props: ServerCardProps) => {
  const { title, regionCode, onClick, delay, id, menuItems } = props;
  const activeId = useSelector<AppState, string>(state => state.proxy.activeId);
  const disabled = useSelector<AppState, boolean>(
    state => state.proxy.isStarted || state.proxy.isProcessing
  );
  const isActive = activeId === id;

  return (
    <div className={styles.server}>
      <Dropdown
        items={menuItems}
        className={styles.dropdown}
        isLockBodyScroll={true}
      >
        <Icon iconName={ICON_NAME.OMIT} />
      </Dropdown>
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
