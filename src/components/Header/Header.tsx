import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useLayoutEffect,
} from "react";
import styles from "./header.module.css";
import { Button, Selector } from "../Core";
import { notifier } from "../Core/Notification";
import { AppState } from "../../reducers/rootReducer";
import { useSelector, useDispatch } from "react-redux";
import fs from "fs";
import promiseIpc from "electron-promise-ipc";
import path from "path";
import { BUILD_IN_RULE, setting } from "../../reducers/settingReducer";
import { proxy, Subscription } from "../../reducers/proxyReducer";
import { ipcRenderer } from "electron";
import { useLocation } from "react-router-dom";
import { pingEventEmitter, updateSubscription } from "../../utils/helper";
import { LoadingDialog } from "../Dialogs/LoadingDialog";

const Header = () => {
  const subscriptions = useSelector<AppState, Subscription[]>(
    (state) => state.proxy.subscriptions
  );
  const isUpdateSubscriptionsOnOpen = useSelector<AppState, boolean>(
    (state) => state.setting.general.isUpdateSubscriptionsOnOpen
  );
  const [isUpdatingSubscriptions, setIsUpdatingSubscriptions] = useState(false);
  const [autoConnectTimer, setConnectTimer] = useState<NodeJS.Timeout>();
  const isAutoConnect = useSelector<AppState, boolean>(
    (state) => state.setting.general.isAutoConnect
  );
  const autoConnectDelay = useSelector<AppState, number>(
    (state) => state.setting.general.autoConnectDelay
  );
  const dispatch = useDispatch();

  //Init app
  useLayoutEffect(() => {
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
                  config: { ...subscription, shadowsockses },
                })
              );
            })
          )
        );
      };

      setIsUpdatingSubscriptions(true);
      updateSubscriptions()
        .then(() => {
          notifier.success("Update subscriptions successfully");
        })
        .catch(() => {
          notifier.error("Fail to update subscriptions");
        })
        .finally(() => {
          setIsUpdatingSubscriptions(false);
          if (isAutoConnect) autoConnect();
        });
    } else if (isAutoConnect) {
      autoConnect();
    }
    //TODO: use customized channel for "Disconnected" because there are others message.
    ipcRenderer.on("message", (event, message) => {
      if (message === "Disconnected") {
        dispatch(proxy.actions.setIsProcessing(false));
        dispatch(proxy.actions.stopVpn());
      }
    });

    ipcRenderer.send("setRunAtSystemStartup");

    //TODO:i18next
    ipcRenderer.send("localizationResponse", null);
    //If the app crashes unexpectedly, the "start" Button can be loading state after restarting app.
    //To avoid that, the state mush be reset.
    dispatch(proxy.actions.setIsProcessing(false));
    dispatch(proxy.actions.stopVpn());
    return () => {
      ipcRenderer.removeAllListeners("message");
    };
    //Only be fired once to init app.
  }, []); // eslint-disable-line
  const customizedRulesDirPath = useSelector<AppState, string>(
    (state) => state.setting.rule.dirPath
  );
  const isStarted = useSelector<AppState, boolean>(
    (state) => state.proxy.isStarted
  );
  const isProcessing = useSelector<AppState, boolean>(
    (state) => state.proxy.isProcessing
  );
  const activeId = useSelector<AppState, string>(
    (state) => state.proxy.activeId
  );
  const currentRule = useSelector<AppState, string>(
    (state) => state.setting.rule.current
  );
  const isHideAfterConnection = useSelector<AppState, boolean>(
    (state) => state.setting.general.isHideAfterConnection
  );
  const [rulePaths, setRulePaths] = useState<string[]>([]);
  const [isLoadingRules, setIsLoadingRules] = useState(false);
  const changeCurrentRule = useCallback(
    (rule: string) => dispatch(setting.actions.setCurrentRule(rule)),
    [dispatch]
  );

  const start = useCallback(async () => {
    try {
      if (autoConnectTimer) clearTimeout(autoConnectTimer);
      if (!activeId) {
        notifier.error("No server has been selected!");
        return;
      }
      dispatch(proxy.actions.setIsProcessing(true));
      //@ts-ignore
      await promiseIpc.send("start");
      dispatch(proxy.actions.startVpn());
      if (isHideAfterConnection) ipcRenderer.send("hideWindow");
    } catch (e) {
      if (e.message && typeof e.message === "string") notifier.error(e.message);
      else notifier.error("Unknown error");
    } finally {
      dispatch(proxy.actions.setIsProcessing(false));
    }
  }, [activeId, autoConnectTimer, dispatch, isHideAfterConnection]);

  useEffect(() => {
    const loadRulePath = async () => {
      setIsLoadingRules(true);
      let rulePaths: string[] = [];
      try {
        // @ts-ignore
        const resourcesPath = await promiseIpc.send("getResourcesPath");
        const defaultRuleDirPath = path.join(resourcesPath, "defaultRules");
        const defaultRules = await fs.promises.readdir(defaultRuleDirPath);
        defaultRules.forEach((rule) => {
          if (path.extname(rule) === ".rules")
            rulePaths.push(path.join(defaultRuleDirPath, rule));
        });
      } catch (e) {
        console.log(e);
        notifier.error("Fail to load default rules");
      }
      if (customizedRulesDirPath)
        try {
          const customizedRules = await fs.promises.readdir(
            customizedRulesDirPath
          );
          customizedRules.forEach((rule) => {
            if (path.extname(rule) === ".rules")
              rulePaths.push(path.join(customizedRulesDirPath, rule));
          });
        } catch {
          notifier.error("Fail to load customized rules");
        }
      setRulePaths(rulePaths);
    };
    loadRulePath().then(() => {
      setIsLoadingRules(false);
    });
  }, [customizedRulesDirPath]);

  const stop = useCallback(async () => {
    dispatch(proxy.actions.setIsProcessing(true));
    try {
      // @ts-ignore
      await promiseIpc.send("stop");
      dispatch(proxy.actions.stopVpn());
    } catch (e) {
      console.log(e);
    } finally {
      dispatch(proxy.actions.setIsProcessing(false));
    }
  }, [dispatch]);
  const rulesOptions = useMemo(
    () => [
      { value: BUILD_IN_RULE },
      ...rulePaths.map((rulePath) => ({
        value: path.basename(rulePath, ".rules"),
      })),
    ],
    [rulePaths]
  );
  const pingTest = useCallback(() => {
    pingEventEmitter.emit("test");
  }, []);
  const location = useLocation();
  return (
    <>
      {isUpdatingSubscriptions && (
        <LoadingDialog content={"Updating subscriptions..."} />
      )}
      <div className={styles.container}>
        {isStarted ? (
          <Button
            isDanger={true}
            className={styles.button}
            onClick={stop}
            isLoading={isProcessing}
            disabled={isProcessing}
          >
            {isProcessing ? "Stopping" : "Stop"}
          </Button>
        ) : (
          <Button
            isPrimary={true}
            className={styles.button}
            onClick={start}
            isLoading={isProcessing}
            disabled={isProcessing}
          >
            {isProcessing ? "Starting" : "Start"}
          </Button>
        )}

        <Selector
          options={rulesOptions}
          label={"Rule"}
          value={currentRule}
          onChange={changeCurrentRule}
          className={styles.selector}
          disabled={isLoadingRules || isStarted || isProcessing}
          isVirtualizedList={rulesOptions.length > 4}
        />
        {location.pathname === "/proxies" && !isStarted && !isProcessing && (
          <Button onClick={pingTest} isPrimary={true} className={styles.button}>
            Ping Test
          </Button>
        )}
      </div>
    </>
  );
};

export default Header;
