import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { proxy, Shadowsocks } from "../../reducers/proxyReducer";
import styles from "./proxies.module.css";
import { ShadowsocksCard } from "../Cards/ShadowsocksCard";
import { Dropdown, Icon, ICON_NAME } from "../Core";

export const Shadowsockses = React.memo(() => {
  const shadowsockses = useSelector<AppState, Shadowsocks[]>(
    (state) => state.proxy.shadowsockses
  );
  const dispatch = useDispatch();
  const disabled = useSelector<AppState, boolean>(
    (state) => state.proxy.isProcessing || state.proxy.isStarted
  );
  return (
    <>
      {shadowsockses.length !== 0 && (
        <div className={styles.title}>
          Shadowsockses
          <Dropdown
            items={[
              {
                iconName: ICON_NAME.DELETE,
                content: "Delete",
                isDanger: true,
                handleOnClick: () => {
                  dispatch(
                    proxy.actions.delete({
                      type: "shadowsocks",
                      id: "",
                    })
                  );
                },
              },
            ]}
            disabled={disabled}
          >
            <Icon iconName={ICON_NAME.OMIT} className={styles.dropdownToggle} />
          </Dropdown>
        </div>
      )}
      <div className={styles.shadowsockses}>
        {shadowsockses.map((shadowsocks) => (
          <ShadowsocksCard shadowsocks={shadowsocks} key={shadowsocks.id} />
        ))}
      </div>
    </>
  );
});
