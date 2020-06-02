import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { proxy, Socks5 } from "../../reducers/proxyReducer";
import styles from "./proxies.module.css";
import { Socks5Card } from "../Cards/Socks5Card";
import { Dropdown, Icon, ICON_NAME } from "../Core";
import { PingServer, usePing } from "../../hooks";

export const Socks5s = React.memo(() => {
  const socks5s = useSelector<AppState, Socks5[]>(
    (state) => state.proxy.socks5s
  );
  const disabled = useSelector<AppState, boolean>(
    (state) => state.proxy.isProcessing || state.proxy.isConnected
  );
  const dispatch = useDispatch();
  const pingServers = useMemo(
    () =>
      socks5s.map((socks5) => ({
        type: "shadowsocks",
        id: socks5.id,
        host: socks5.host,
        port: socks5.port,
      })),
    [socks5s]
  );

  const { isPinging, ping } = usePing(pingServers as PingServer[]);
  const dropdownItems = useMemo(
    () => [
      {
        iconName: ICON_NAME.INSTRUMENT,
        content: "Ping Test",
        handleOnClick: ping,
        disabled: isPinging || disabled,
      },
      {
        iconName: ICON_NAME.SORT,
        content: "Sort By Ping Time",
        disabled: isPinging || disabled,
        handleOnClick: () => {
          dispatch(
            proxy.actions.sortByPingTime({
              type: "socks5s",
            })
          );
        },
      },
      {
        iconName: ICON_NAME.DELETE,
        content: "Delete",
        isDanger: true,
        handleOnClick: () => {
          dispatch(
            proxy.actions.delete({
              type: "socks5",
              id: "",
            })
          );
        },
      },
    ],
    [disabled, dispatch, isPinging, ping]
  );
  return (
    <>
      {socks5s.length !== 0 && (
        <div className={styles.title}>
          Sock5s
          <Dropdown items={dropdownItems} disabled={disabled}>
            <Icon iconName={ICON_NAME.OMIT} className={styles.dropdownToggle} />
          </Dropdown>
        </div>
      )}
      <div className={styles.shadowsockses}>
        {socks5s.map((socks5) => (
          <Socks5Card socks5={socks5} key={socks5.id} />
        ))}
      </div>
    </>
  );
});
