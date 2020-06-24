import React, { useCallback, useMemo, useState } from "react";
import { clipboard } from "electron";
import { decodeSsUrl } from "../../utils/url";
import { proxy, Shadowsocks } from "../../reducers/proxyReducer";
import { EditShadowsocksDialog } from "../Dialogs/EditShadowsocksDialog";
import { EditSubscriptionDialog } from "../Dialogs/EditSubscriptionDialog";
import { Button, Dropdown, Icon, ICON_NAME, ICON_SIZE } from "../Core";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import styles from "./header.module.css";

export const AddProxyDropdown = React.memo(() => {
  const [currentDialogType, setCurrentDialogType] = useState("");
  const closeDialog = useCallback(() => {
    setCurrentDialogType("");
  }, []);
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const addProxyDropdownItems = useMemo(
    () => [
      {
        content: "Shadowsocks",
        handleOnClick: () => {
          setCurrentDialogType("shadowsocks");
        },
      },
      {
        content: t("header.add.subscription"),
        handleOnClick: () => {
          setCurrentDialogType("subscription");
        },
      },
      {
        content: t("header.add.clipboard"),
        handleOnClick: async () => {
          try {
            const url = clipboard.readText();
            let shadowsockses = decodeSsUrl(url);
            if (shadowsockses.length === 0) return;
            shadowsockses = shadowsockses.map((shadowsocks) => ({
              ...shadowsocks,
              regionCode: "Auto",
            }));
            (shadowsockses as Shadowsocks[]).forEach((shadowsocks) =>
              dispatch(
                proxy.actions.add({ type: "shadowsocks", config: shadowsocks })
              )
            );
          } catch (e) {}
        },
      },
    ],
    [dispatch, t]
  );
  return (
    <>
      <Dropdown items={addProxyDropdownItems}>
        <Button className={styles.item}>
          <Icon iconName={ICON_NAME.PLUS} size={ICON_SIZE.SIZE24} />
        </Button>
      </Dropdown>
      {currentDialogType === "shadowsocks" && (
        <EditShadowsocksDialog close={closeDialog} />
      )}
      {currentDialogType === "subscription" && (
        <EditSubscriptionDialog close={closeDialog} />
      )}
    </>
  );
});
