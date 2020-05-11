import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { proxy, Subscription } from "../../reducers/proxyReducer";
import { Dropdown, Icon, ICON_NAME, notifier } from "../Core";
import styles from "./proxies.module.css";
import { ShadowsocksCard } from "../Cards/ShadowsocksCard";
import { EditSubscriptionDialog } from "../Dialogs/EditSubscriptionDialog";
import { clipboard } from "electron";
import { LoadingDialog } from "../Dialogs/LoadingDialog";
import { updateSubscription } from "../../utils/helper";

export const Subscriptions = React.memo(() => {
  const subscriptions = useSelector<AppState, Subscription[]>(
    (state) => state.proxy.subscriptions
  );
  const disabled = useSelector<AppState, boolean>(
    (state) => state.proxy.isProcessing || state.proxy.isStarted
  );
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const closeEditDialog = useCallback(() => setIsEditing(false), []);

  return (
    <>
      {isEditing && (
        <EditSubscriptionDialog
          close={closeEditDialog}
          initialValue={
            isEditing
              ? subscriptions.find(
                  (subscription) => subscription.id === editingId
                )
              : undefined
          }
        />
      )}
      {isUpdating && <LoadingDialog content={"Updating the subscription..."} />}

      {subscriptions.map((subscription) => {
        return (
          <div key={subscription.id}>
            <div className={styles.title}>
              {subscription.name}
              <Dropdown
                items={[
                  {
                    iconName: ICON_NAME.UPDATE,
                    content: "Update",
                    disabled: disabled,
                    handleOnClick: async () => {
                      try {
                        setIsUpdating(true);
                        const shadowsockses = await updateSubscription(
                          subscription.url
                        );
                        dispatch(
                          proxy.actions.update({
                            type: "subscription",
                            id: subscription.id,
                            config: {
                              shadowsockses,
                            },
                          })
                        );
                      } catch {
                        notifier.error("Fail to update the subscription!");
                      } finally {
                        setIsUpdating(false);
                      }
                    },
                  },
                  {
                    iconName: ICON_NAME.EDIT,
                    content: "Edit",
                    disabled: disabled,
                    handleOnClick: () => {
                      setEditingId(subscription.id);
                      setIsEditing(true);
                    },
                  },
                  {
                    iconName: ICON_NAME.COPY,
                    content: "Copy Url",
                    handleOnClick: async () => {
                      try {
                        await clipboard.writeText(subscription.url);
                        notifier.success("Copy Url successfully");
                      } catch {}
                    },
                  },
                  {
                    iconName: ICON_NAME.DELETE,
                    content: "Delete",
                    disabled: disabled,
                    isDivider: true,
                    isDanger: true,
                    handleOnClick: () => {
                      dispatch(
                        proxy.actions.delete({
                          type: "subscription",
                          id: subscription.id,
                        })
                      );
                    },
                  },
                ]}
              >
                <Icon
                  iconName={ICON_NAME.OMIT}
                  className={styles.dropdownToggle}
                />
              </Dropdown>
            </div>
            <div className={styles.shadowsockses}>
              {subscription.shadowsockses.map((shadowsocks) => (
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
