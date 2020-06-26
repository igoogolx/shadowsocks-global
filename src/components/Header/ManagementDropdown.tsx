import React, { useCallback, useMemo, useState } from "react";
import { openLogFile } from "../../utils/ipc";
import Store from "electron-store";
import { Button, Dialog, Dropdown, Icon, ICON_NAME, ICON_SIZE } from "../Core";
import Dashboard from "../Dashboard/Dashboard";
import Setting from "../Setting/Setting";
import About from "../About/About";
import styles from "./header.module.css";
import { useTranslation } from "react-i18next";
export const ManagementDropdown = React.memo(() => {
  const [currentDialogType, setCurrentDialogType] = useState("");
  const closeDialog = useCallback(() => {
    setCurrentDialogType("");
  }, []);
  const { t } = useTranslation();
  const manageDropdownItems = useMemo(
    () => [
      {
        content: t("header.management.statistics"),
        handleOnClick: () => {
          setCurrentDialogType("statistics");
        },
      },
      {
        content: t("header.management.setting"),
        handleOnClick: () => {
          setCurrentDialogType("setting");
        },
      },
      {
        content: t("header.management.about"),
        handleOnClick: () => {
          setCurrentDialogType("about");
        },
      },
      {
        content: t("header.management.log"),
        handleOnClick: openLogFile,
      },
      {
        content: t("header.management.configuration"),
        handleOnClick: () => {
          const store = new Store();
          store.openInEditor();
        },
      },
    ],
    [t]
  );
  return (
    <>
      <Dropdown items={manageDropdownItems}>
        <Button className={styles.item}>
          <Icon iconName={ICON_NAME.SETTING} size={ICON_SIZE.SIZE24} />
        </Button>
      </Dropdown>
      {currentDialogType === "statistics" && (
        <Dialog close={closeDialog}>
          <Dashboard />
        </Dialog>
      )}
      {currentDialogType === "setting" && (
        <Dialog close={closeDialog}>
          <Setting close={closeDialog} />
        </Dialog>
      )}
      {currentDialogType === "about" && (
        <Dialog close={closeDialog}>
          <About />
        </Dialog>
      )}
    </>
  );
});
