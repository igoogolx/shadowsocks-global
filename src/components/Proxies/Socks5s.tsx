import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { proxy, Socks5 } from "../../reducers/proxyReducer";
import styles from "./proxies.module.css";
import { Socks5Card } from "../Cards/Socks5Card";
import { Dropdown, Icon, ICON_NAME } from "../Core";

export const Socks5s = React.memo(() => {
  const socks5s = useSelector<AppState, Socks5[]>(
    (state) => state.proxy.socks5s
  );
  const disabled = useSelector<AppState, boolean>(
    (state) => state.proxy.isProcessing || state.proxy.isStarted
  );
  const dispatch = useDispatch();
  return (
    <>
      {socks5s.length !== 0 && (
        <div className={styles.title}>
          Sock5s
          <Dropdown
            items={[
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
            ]}
            disabled={disabled}
          >
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
