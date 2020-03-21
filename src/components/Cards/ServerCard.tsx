import styles from "./cards.module.css";
import { Button, Dropdown, Icon, ICON_NAME } from "../Core";
import React, { useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { Dot } from "../Dot/Dot";
import { Card } from "../Core/Card/Card";
import { MenuItemProps } from "../Core/Menu/Menu";
import { checkServer } from "../../utils/connectivity";
import { useAsync } from "../../hooks";
import classNames from "classnames";

type ServerCardProps = {
  id: string;
  menuItems: MenuItemProps[];
  onClick: () => void;
  name?: string;
  host: string;
  port: number;
  regionCode?: string;
  disabled?: boolean;
};

export const ServerCard = React.memo((props: ServerCardProps) => {
  const { name, host, regionCode, onClick, id, menuItems, port } = props;
  const activeId = useSelector<AppState, string>(state => state.proxy.activeId);
  const disabled = useSelector<AppState, boolean>(
    state => state.proxy.isStarted || state.proxy.isProcessing
  );
  const pingTestStatus = useSelector<AppState, -1 | 0 | 1>(
    state => state.proxy.pingTestStatus
  );
  const ping = useCallback(
    async () =>
      await checkServer({
        address: host,
        port,
        attempts: 10,
        timeout: 2000
      }),

    [host, port]
  );

  const { execute, pending, value: delay, error } = useAsync(ping, false);
  const handleOnClickDelay = useCallback(
    (e: any) => {
      e.stopPropagation();
      execute().catch(e => {
        console.log(e);
      });
    },
    [execute]
  );
  const isActive = activeId === id;
  useEffect(() => {
    if (pingTestStatus === -1) return;
    execute();
  }, [execute, pingTestStatus]);
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
          <div className={styles.title}>{name || host}</div>
        </div>
        {isActive && <Dot type={"enabled"} className={styles.dot} />}
      </Card>

      {(delay || error || pending) && (
        <Button
          className={classNames(styles.delay, {
            [styles.timeout]: error,
            [styles.fast]: delay && Number(delay) <= 500,
            [styles.slow]: delay && Number(delay) > 500
          })}
          onClick={handleOnClickDelay}
          isLoading={pending}
        >
          {pending ? "" : error ? "Timeout" : delay + "ms"}
        </Button>
      )}
    </div>
  );
});
