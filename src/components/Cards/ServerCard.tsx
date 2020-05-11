import styles from "./cards.module.css";
import { Button, Dropdown, Icon, ICON_NAME } from "../Core";
import React, { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { Dot } from "../Dot/Dot";
import { Card } from "../Core/Card/Card";
import { MenuItemProps } from "../Core/Menu/Menu";
import { checkServer } from "../../utils/connectivity";
import { useAsync } from "../../hooks";
import classNames from "classnames";
import { lookupRegionCode, pingEventEmitter } from "../../utils/helper";
import { proxy } from "../../reducers/proxyReducer";

type ServerCardProps = {
  id: string;
  type: "shadowsocks" | "socks5";
  menuItems: MenuItemProps[];
  onClick: () => void;
  name?: string;
  host: string;
  port: number;
  regionCode?: string;
  disabled?: boolean;
};

export const ServerCard = React.memo((props: ServerCardProps) => {
  const { name, host, regionCode, onClick, id, menuItems, port, type } = props;
  const activeId = useSelector<AppState, string>(
    (state) => state.proxy.activeId
  );
  const disabled = useSelector<AppState, boolean>(
    (state) => state.proxy.isStarted || state.proxy.isProcessing
  );

  const ping = useCallback(
    async () =>
      await checkServer({
        address: host,
        port,
        attempts: 10,
        timeout: 2000,
      }),

    [host, port]
  );

  const {
    execute: executePing,
    pending: pinging,
    value: delay,
    error,
  } = useAsync(ping, false);
  const handleOnClickDelay = useCallback(
    (e: any) => {
      e.stopPropagation();
      executePing().catch((e) => {
        console.log(e);
      });
    },
    [executePing]
  );
  const isActive = activeId === id;

  const dispatch = useDispatch();

  useEffect(() => {
    pingEventEmitter.on("test", executePing);
    return () => {
      pingEventEmitter.removeListener("test", executePing);
    };
  }, [executePing]);

  const getRegionCode = useCallback(async () => await lookupRegionCode(host), [
    host,
  ]);

  const {
    execute: executeGetRegionCode,
    value: newRegionCode,
    pending: gettingRegionCode,
  } = useAsync(getRegionCode, false);

  useEffect(() => {
    if (regionCode === "Auto") {
      executeGetRegionCode().catch((e) => {
        console.log(e);
      });
    }
  }, [dispatch, executeGetRegionCode, host, regionCode]);

  useEffect(() => {
    if (newRegionCode)
      dispatch(
        proxy.actions.update({
          type,
          id,
          config: { regionCode: newRegionCode },
        })
      );
  }, [dispatch, id, newRegionCode, type]);
  return (
    <div className={styles.server}>
      <Dropdown items={menuItems} className={styles.dropdown}>
        <Icon iconName={ICON_NAME.OMIT} />
      </Dropdown>
      <Card
        onClick={onClick}
        className={styles.card}
        disabled={disabled || isActive}
      >
        <div className={styles.flagContainer}>
          {regionCode && (
            <Icon
              iconName={gettingRegionCode ? ICON_NAME.LOADING : regionCode}
              isLoading={gettingRegionCode}
              type={gettingRegionCode ? "iconFont" : "flag"}
              className={gettingRegionCode ? styles.loading : styles.flag}
            />
          )}
        </div>
        <div className={styles.body}>
          <div className={styles.title}>{name || host}</div>
        </div>
        {isActive && <Dot type={"enabled"} className={styles.dot} />}
      </Card>

      {(delay || error || pinging) && !disabled && (
        <Button
          className={classNames(styles.delay, {
            [styles.timeout]: error,
            [styles.fast]: delay && Number(delay) <= 500,
            [styles.slow]: delay && Number(delay) > 500,
          })}
          onClick={handleOnClickDelay}
          isLoading={pinging}
          disabled={disabled}
        >
          {pinging ? "" : error ? "Timeout" : delay + "ms"}
        </Button>
      )}
    </div>
  );
});
