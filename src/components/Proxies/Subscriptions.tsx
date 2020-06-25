import React, { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { proxy, Subscription } from "../../reducers/proxyReducer";
import { Dropdown, Icon, ICON_NAME, notifier } from "../Core";
import styles from "./proxies.module.css";
import { ShadowsocksCard } from "../Cards/ShadowsocksCard";
import { EditSubscriptionDialog } from "../Dialogs/EditSubscriptionDialog";
import { LoadingDialog } from "../Dialogs/LoadingDialog";
import { PingServer, usePing } from "../../hooks";
import { updateSubscription } from "../../utils/ipc";
import { useTranslation } from "react-i18next";

type SubscriptionProps = {
  subscription: Subscription;
};

const SubscriptionComponent = (props: SubscriptionProps) => {
  const { subscription } = props;
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const disabled = useSelector<AppState, boolean>(
    (state) => state.proxy.isProcessing || state.proxy.isConnected
  );
  const { t } = useTranslation();
  const closeEditDialog = useCallback(() => setIsEditing(false), []);
  const dispatch = useDispatch();
  const pingServers = useMemo(
    () =>
      subscription.shadowsockses.map((shadowsocks) => ({
        type: "shadowsocks",
        id: shadowsocks.id,
        host: shadowsocks.host,
        port: shadowsocks.port,
      })),
    [subscription.shadowsockses]
  );

  const { isPinging, ping } = usePing(pingServers as PingServer[]);

  const dropdownItems = useMemo(
    () => [
      {
        iconName: ICON_NAME.INSTRUMENT,
        content: t("proxy.subscription.ping"),
        handleOnClick: ping,
        disabled: isPinging || disabled,
      },
      {
        iconName: ICON_NAME.SORT,
        content: t("proxy.subscription.sort"),
        disabled: isPinging || disabled,
        handleOnClick: () => {
          dispatch(
            proxy.actions.sortByPingTime({
              type: "subscription",
              id: subscription.id,
            })
          );
        },
      },
      {
        iconName: ICON_NAME.UPDATE,
        content: t("proxy.subscription.update"),
        disabled: disabled,
        handleOnClick: async () => {
          try {
            setIsUpdating(true);
            const shadowsockses = await updateSubscription(subscription.url);
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
        content: t("proxy.subscription.edit"),
        disabled: disabled,
        handleOnClick: () => {
          setIsEditing(true);
        },
      },
      {
        iconName: ICON_NAME.COPY,
        content: t("proxy.subscription.copy"),
        handleOnClick: async () => {
          try {
            await navigator.clipboard.writeText(subscription.url);
            notifier.success("Copy Url successfully");
          } catch {}
        },
      },
      {
        iconName: ICON_NAME.DELETE,
        content: t("proxy.subscription.delete"),
        disabled: disabled,
        isDivider: true,
        isDanger: true,
        handleOnClick: () => {
          dispatch(
            proxy.actions.deleteOne({
              type: "subscription",
              id: subscription.id,
            })
          );
        },
      },
    ],
    [disabled, dispatch, isPinging, ping, subscription.id, subscription.url, t]
  );

  return (
    <>
      {isEditing && (
        <EditSubscriptionDialog
          close={closeEditDialog}
          initialValue={subscription}
        />
      )}
      {isUpdating && <LoadingDialog content={"Updating the subscription..."} />}
      <div key={subscription.id}>
        <div className={styles.title}>
          {subscription.name}
          <Dropdown items={dropdownItems}>
            <Icon iconName={ICON_NAME.OMIT} className={styles.dropdownToggle} />
          </Dropdown>
        </div>
        <div className={styles.shadowsockses}>
          {subscription.shadowsockses.map((shadowsocks) => (
            <ShadowsocksCard shadowsocks={shadowsocks} key={shadowsocks.id} />
          ))}
        </div>
      </div>
    </>
  );
};

type SubscriptionsProps = {
  subscriptions: Subscription[];
};

export const Subscriptions = React.memo((props: SubscriptionsProps) => {
  const { subscriptions } = props;
  return (
    <>
      {subscriptions.map((subscription) => (
        <SubscriptionComponent
          subscription={subscription}
          key={subscription.id}
        />
      ))}
    </>
  );
});
