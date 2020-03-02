import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { deleteProxy, Subscription } from "../../reducers/proxyReducer";
import { Dropdown, Icon, ICON_NAME } from "../Core";
import styles from "./proxies.module.css";
import { ShadowsocksCard } from "../Cards/ShadowsocksCard";
import { EditSubscriptionDialog } from "../Dialogs/EditSubscriptionDialog";

export const Subscriptions = React.memo(() => {
  const subscriptions = useSelector<AppState, Subscription[]>(
    state => state.proxy.subscriptions
  );
  const disabled = useSelector<AppState, boolean>(
    state => state.proxy.isProcessing || state.proxy.isStarted
  );
  const dispatch = useDispatch();
  const [isShowDialog, setIsShowDialog] = useState(false);
  const [editingId, setEditingId] = useState("");
  const closeDialog = useCallback(() => setIsShowDialog(false), []);

  return (
    <>
      {isShowDialog && (
        <EditSubscriptionDialog
          close={closeDialog}
          initialValue={
            isShowDialog
              ? subscriptions.find(
                  subscription => subscription.id === editingId
                )
              : undefined
          }
        />
      )}

      {subscriptions.map(subscription => {
        return (
          <div key={subscription.id}>
            <div className={styles.title}>
              {subscription.name}
              <Dropdown
                items={[
                  {
                    iconName: ICON_NAME.EDIT,
                    content: "Edit",
                    handleOnClick: () => {
                      setEditingId(subscription.id);
                      setIsShowDialog(true);
                    }
                  },
                  {
                    iconName: ICON_NAME.DELETE,
                    content: "Delete",
                    isDivider: true,
                    isDanger: true,
                    handleOnClick: () => {
                      dispatch(
                        deleteProxy({
                          type: "subscription",
                          id: subscription.id
                        })
                      );
                    }
                  }
                ]}
                disabled={disabled}
              >
                <Icon
                  iconName={ICON_NAME.OMIT}
                  className={styles.dropdownToggle}
                />
              </Dropdown>
            </div>
            <div className={styles.shadowsockses}>
              {subscription.shadowsockses.map(shadowsocks => (
                <ShadowsocksCard
                  shadowsocks={shadowsocks}
                  key={shadowsocks.id}
                />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
});
