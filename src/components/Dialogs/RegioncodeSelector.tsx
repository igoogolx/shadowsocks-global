import { FieldSelector, Option } from "../Core/Selector/Selector";
import styles from "./dialogs.module.css";
import React, { useRef } from "react";
import regions from "../../utils/en.json";

export const RegionCodeSelector = () => {
  const regionOptions = useRef([
    { value: "Auto" },
    ...Object.entries(regions.countries).map(region => ({
      iconType: "flag",
      iconName: region[0],
      value: region[0]
    }))
  ]);
  return (
    <FieldSelector
      name={"regionCode"}
      label={"Region"}
      className={styles.selector}
      options={regionOptions.current as Option[]}
      isVirtualizedList={true}
    />
  );
};
