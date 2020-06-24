import React, { useState } from "react";
import { Tabs } from "../Core";
import { Tab } from "../Core/Tabs/Tabs";
import { Dns } from "./Dns";
import { General } from "./General";
import styles from "./setting.module.css";
import { useTranslation } from "react-i18next";

const Setting = () => {
  const [currentSetting, setCurrentSetting] = useState("general");
  const { t } = useTranslation();
  return (
    <Tabs
      activeId={currentSetting}
      onSelected={setCurrentSetting}
      className={styles.body}
    >
      <Tab id={"general"} title={t("setting.general.title")}>
        <General />
      </Tab>
      <Tab id={"dns"} title={t("setting.dns.title")}>
        <Dns />
      </Tab>
    </Tabs>
  );
};

export default Setting;
