import React, { useCallback } from "react";
import { Button, Icon, ICON_NAME, notifier } from "../Core";
import classNames from "classnames";
import styles from "./header.module.css";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { proxy, Shadowsocks, Subscription } from "../../reducers/proxyReducer";
import { encodeSsUrl } from "../../utils/url";
import { useTranslation } from "react-i18next";

export const SelectMenu = React.memo(() => {
  const subscriptions = useSelector<AppState, Subscription[]>(
    (state) => state.proxy.subscriptions
  );
  const selectedIds = useSelector<AppState, string[]>(
    (state) => state.proxy.selectedIds
  );
  const shadowsockses = useSelector<AppState, Shadowsocks[]>(
    (state) => state.proxy.shadowsockses
  );
  const activeId = useSelector<AppState, string>(
    (state) => state.proxy.activeId
  );
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const copySelectedShadowsocksesUrl = useCallback(async () => {
    let url = "";
    let allShadowsockses = shadowsockses;
    subscriptions.forEach((subscription) => {
      allShadowsockses = [...allShadowsockses, ...subscription.shadowsockses];
    });
    allShadowsockses.forEach((shadowsocks) => {
      if (selectedIds.indexOf(shadowsocks.id) !== -1) {
        url += encodeSsUrl(shadowsocks) + "\n";
      }
    });
    try {
      await navigator.clipboard.writeText(url);
    } catch (e) {
      notifier.error(t("message.error.copy"));
      return;
    }
    notifier.success(t("message.success.copy"));
  }, [selectedIds, shadowsockses, subscriptions, t]);
  const deleteSelectedShadowsockses = useCallback(() => {
    if (selectedIds.indexOf(activeId) !== -1) {
      return notifier.error(t("message.error.deleteActivatedServer"));
    }
    dispatch(proxy.actions.delete({ type: "shadowsocks", ids: selectedIds }));
  }, [activeId, dispatch, selectedIds, t]);
  const selectAllShadowsockses = useCallback(() => {
    dispatch(proxy.actions.selectAll());
  }, [dispatch]);
  const doneSelect = useCallback(() => {
    dispatch(proxy.actions.resetSelectedIds());
    dispatch(proxy.actions.setIsSelecting(false));
  }, [dispatch]);

  return (
    <>
      <Button
        onClick={doneSelect}
        isPrimary={true}
        className={classNames(styles.button, styles.selectButton)}
      >
        {t("header.select.done")}
      </Button>
      <Button
        onClick={selectAllShadowsockses}
        className={classNames(styles.button, styles.selectButton)}
      >
        <Icon iconName={ICON_NAME.CHECK_SQUARE} />
        {t("header.select.all")}
      </Button>
      <Button
        onClick={deleteSelectedShadowsockses}
        className={classNames(styles.button, styles.selectButton)}
      >
        <Icon iconName={ICON_NAME.DELETE} />
        {t("header.select.delete")}
      </Button>
      <Button
        onClick={copySelectedShadowsocksesUrl}
        className={classNames(styles.button, styles.selectButton)}
      >
        <Icon iconName={ICON_NAME.COPY} />
        {t("header.select.copy")}
      </Button>
    </>
  );
});
