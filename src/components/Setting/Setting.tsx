import React, { useState } from "react";
import { Tabs } from "../Core";
import { Tab } from "../Core/Tabs/Tabs";
import { Dns } from "./Dns";
import { General } from "./General";
import styles from "./setting.module.css";
import { useTranslation } from "react-i18next";

type SettingProps = {
  close: () => void;
};

const Setting = React.memo((props: SettingProps) => {
  const { close } = props;
  const [currentSetting, setCurrentSetting] = useState("general");
  const { t } = useTranslation();
  return (
    <Tabs
      activeId={currentSetting}
      onSelected={setCurrentSetting}
      className={styles.body}
    >
      <Tab id={"general"} title={t("setting.general.title")}>
        <General close={close} />
      </Tab>
      <Tab id={"dns"} title={t("setting.dns.title")}>
        <Dns close={close} />
      </Tab>
    </Tabs>
  );
});

export default Setting;
