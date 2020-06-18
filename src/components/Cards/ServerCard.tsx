import styles from "./cards.module.css";
import { Button, Checkbox, Dropdown, Icon, ICON_NAME } from "../Core";
import React, { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { Dot } from "../Dot/Dot";
import { Card } from "../Core/Card/Card";
import { MenuItemProps } from "../Core/Menu/Menu";
import { useAsync, usePing } from "../../hooks";
import classNames from "classnames";
import { getRegionCodeFromGeoIp } from "../../utils/helper";
import { proxy, Shadowsocks } from "../../reducers/proxyReducer";

type ServerCardProps = {
  id: string;
  type: "shadowsocks";
  menuItems: MenuItemProps[];
  onClick: () => void;
  name?: string;
  host: string;
  port: number;
  regionCode?: string;
  disabled?: boolean;
} & Pick<Shadowsocks, "pingTime">;

export const ServerCard = React.memo((props: ServerCardProps) => {
  const {
    name,
    host,
    regionCode,
    onClick,
    id,
    menuItems,
    port,
    type,
    pingTime,
  } = props;
  const activeId = useSelector<AppState, string>(
    (state) => state.proxy.activeId
  );
  const disabled = useSelector<AppState, boolean>(
    (state) => state.proxy.isProcessing
  );
  const isSelecting = useSelector<AppState, boolean>(
    (state) => state.proxy.isSelecting
  );
  const isSelected = useSelector<AppState, boolean>(
    (state) => state.proxy.selectedIds.indexOf(id) !== -1
  );
  const isConnected = useSelector<AppState, boolean>(
    (state) => state.proxy.isConnected
  );

  const dispatch = useDispatch();

  const { ping } = usePing([{ type, id, host, port }]);

  const handleOnClickPing = useCallback(
    (e: any) => {
      e.stopPropagation();
      ping().catch((e) => {
        console.log(e);
      });
    },
    [ping]
  );

  useEffect(() => {
    if (pingTime)
      dispatch(proxy.actions.update({ type, id, config: { pingTime } }));
  }, [dispatch, id, pingTime, type]);
  const isActive = activeId === id;

  const getRegionCode = useCallback(
    async () => await getRegionCodeFromGeoIp(host),
    [host]
  );

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
  const handleOnSelect = useCallback(
    (isSelected: boolean) => {
      if (isSelected) dispatch(proxy.actions.select(id));
      else dispatch(proxy.actions.unSelect(id));
    },
    [dispatch, id]
  );
  return (
    <div className={styles.server}>
      {isSelecting ? (
        <Checkbox
          checked={Boolean(isSelected)}
          onChange={handleOnSelect}
          className={styles.checkbox}
        />
      ) : (
        <Dropdown items={menuItems} className={styles.dropdown}>
          <Icon iconName={ICON_NAME.OMIT} />
        </Dropdown>
      )}
      <Card
        onClick={onClick}
        className={classNames(styles.card, { [styles.selected]: isSelected })}
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

      {pingTime && (
        <Button
          className={classNames(styles.delay, {
            [styles.timeout]: pingTime === "timeout",
            [styles.fast]: pingTime && Number(pingTime) <= 500,
            [styles.slow]: pingTime && Number(pingTime) > 500,
          })}
          onClick={handleOnClickPing}
          isLoading={pingTime === "pinging"}
          disabled={isConnected || disabled}
        >
          {pingTime === "pinging"
            ? ""
            : pingTime === "timeout"
            ? "Timeout"
            : pingTime + "ms"}
        </Button>
      )}
    </div>
  );
});
