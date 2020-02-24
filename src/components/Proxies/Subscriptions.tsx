import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { deleteProxy, Subscription } from "../../reducers/proxyReducer";
import { Dialog, Dropdown, Icon, ICON_NAME } from "../Core";
import { EditSubscriptionForm } from "../Forms/EditSubscriptionForm";
import styles from "./proxies.module.css";
import { ShadowsocksCard } from "../Cards/ShadowsocksCard";

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
      <Dialog isShow={isShowDialog} close={closeDialog}>
        {isShowDialog && (
          <EditSubscriptionForm
            close={closeDialog}
            defaultValue={subscriptions.find(
              subscription => subscription.id === editingId
            )}
          />
        )}
      </Dialog>
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
