import React, { useState } from "react";
import { Tabs } from "../Core";
import { Tab } from "../Core/Tabs/Tabs";
import { Dns } from "./Dns";
import { Rule } from "./Rule";
import { General } from "./General";
import styles from "./setting.module.css";

const Setting = () => {
  const [currentSetting, setCurrentSetting] = useState("general");
  return (
    <Tabs
      activeId={currentSetting}
      onSelected={setCurrentSetting}
      className={styles.body}
    >
      <Tab id={"general"} title={"General"}>
        <General />
      </Tab>
      <Tab id={"dns"} title={"Dns"}>
        <Dns />
      </Tab>
      <Tab id={"rule"} title={"Rule"}>
        <Rule />
      </Tab>
    </Tabs>
  );
};

export default Setting;
