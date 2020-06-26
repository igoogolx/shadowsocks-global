import React, { useState, useCallback, useLayoutEffect } from "react";
import styles from "./header.module.css";
import { Button, Icon, ICON_NAME, ICON_SIZE, Toggle } from "../Core";
import { notifier } from "../Core/Notification";
import { AppState } from "../../reducers/rootReducer";
import { useSelector, useDispatch } from "react-redux";
import { proxy, Subscription } from "../../reducers/proxyReducer";
import { LoadingDialog } from "../Dialogs/LoadingDialog";
import {
  hideWindow,
  localize,
  setRunAtSystemStartup,
  startProxy,
  stopProxy,
  subscribeDisconnected,
  unsubscribeDisconnected,
  updateSubscription,
} from "../../utils/ipc";
import { AddProxyDropdown } from "./AddProxyDropdown";
import { SelectMenu } from "./SelectMenu";
import { ManagementDropdown } from "./ManagementDropdown";
import { RuleSelector } from "./RuleSelector";
import { useTranslation } from "react-i18next";

const Header = () => {
  const subscriptions = useSelector<AppState, Subscription[]>(
    (state) => state.proxy.subscriptions
  );
  const isUpdateSubscriptionsOnOpen = useSelector<AppState, boolean>(
    (state) => state.setting.general.updateSubscriptionsOnOpen
  );
  const [isUpdatingSubscriptions, setIsUpdatingSubscriptions] = useState(false);
  const [autoConnectTimer, setConnectTimer] = useState<NodeJS.Timeout>();
  const isAutoConnect = useSelector<AppState, boolean>(
    (state) => state.setting.general.autoConnect
  );
  const autoConnectDelay = useSelector<AppState, number>(
    (state) => state.setting.general.autoConnectDelay
  );

  const dispatch = useDispatch();
  const { t } = useTranslation();

  //Init app
  useLayoutEffect(() => {
    localize(t("tray"));
    const autoConnect = () => {
      setConnectTimer(setTimeout(start, autoConnectDelay * 1000));
    };
    if (isUpdateSubscriptionsOnOpen) {
      const updateSubscriptions = async () => {
        await Promise.all(
          subscriptions.map((subscription) =>
            updateSubscription(subscription.url).then((shadowsockses) => {
              dispatch(
                proxy.actions.update({
                  type: "subscription",
                  id: subscription.id,
                  config: { shadowsockses },
                })
              );
            })
          )
        );
      };

      setIsUpdatingSubscriptions(true);
      updateSubscriptions()
        .then(() => {
          notifier.success(t("message.success.updateSubscription"));
        })
        .catch(() => {
          notifier.error("message.error.updateSubscription");
        })
        .finally(() => {
          setIsUpdatingSubscriptions(false);
          if (isAutoConnect) autoConnect();
        });
    } else if (isAutoConnect) {
      autoConnect();
    }
    subscribeDisconnected(() => {
      dispatch(proxy.actions.setIsProcessing(false));
      dispatch(proxy.actions.setIsConnected(false));
    });
    setRunAtSystemStartup();

    //If the app crashes unexpectedly, the "Connect" Button can be loading state after restarting app.
    //To avoid that, the state mush be reset.
    dispatch(proxy.actions.setIsProcessing(false));
    dispatch(proxy.actions.setIsConnected(false));
    return () => {
      unsubscribeDisconnected();
    };
    //Only be fired once to init app.
  }, []); // eslint-disable-line

  const activeId = useSelector<AppState, string>(
    (state) => state.proxy.activeId
  );

  const isHideAfterConnection = useSelector<AppState, boolean>(
    (state) => state.setting.general.hideAfterConnection
  );

  const start = useCallback(async () => {
    try {
      if (autoConnectTimer) clearTimeout(autoConnectTimer);
      if (!activeId) {
        notifier.error(t("message.error.noSelectedServer"));
        return;
      }
      dispatch(proxy.actions.setIsProcessing(true));
      await startProxy();
      dispatch(proxy.actions.setIsConnected(true));
      if (isHideAfterConnection) hideWindow();
    } catch (e) {
      if (e.message && typeof e.message === "string") notifier.error(e.message);
      else notifier.error(t("message.error.unknown"));
    } finally {
      dispatch(proxy.actions.setIsProcessing(false));
    }
  }, [activeId, autoConnectTimer, dispatch, isHideAfterConnection, t]);
  const stop = useCallback(async () => {
    dispatch(proxy.actions.setIsProcessing(true));
    try {
      await stopProxy();
      dispatch(proxy.actions.setIsConnected(false));
    } catch (e) {
      console.log(e);
    } finally {
      dispatch(proxy.actions.setIsProcessing(false));
    }
  }, [dispatch]);

  const isSelecting = useSelector<AppState, boolean>(
    (state) => state.proxy.isSelecting
  );
  const isConnected = useSelector<AppState, boolean>(
    (state) => state.proxy.isConnected
  );
  const isProcessing = useSelector<AppState, boolean>(
    (state) => state.proxy.isProcessing
  );

  return (
    <>
      {isUpdatingSubscriptions && (
        <LoadingDialog content={"Updating subscriptions..."} />
      )}
      <div className={styles.container}>
        {isSelecting ? (
          <SelectMenu />
        ) : (
          <>
            <Toggle
              size={"large"}
              className={styles.switch}
              checked={isConnected}
              disabled={isProcessing}
              onChange={async (e) => {
                if (e.currentTarget.checked) {
                  await start();
                } else {
                  await stop();
                }
              }}
            />
            <RuleSelector />
            <div className={styles.iconButtons}>
              <AddProxyDropdown />
              <ManagementDropdown />
              <Button
                className={styles.item}
                onClick={() => {
                  dispatch(proxy.actions.setIsSelecting(true));
                }}
              >
                <Icon
                  iconName={ICON_NAME.CHECK_SQUARE}
                  size={ICON_SIZE.SIZE24}
                />
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Header;
