import { FieldSelector, Option } from "../Core/Selector/Selector";
import styles from "./dialogs.module.css";
import React, { useRef } from "react";
import regions from "../../utils/en.json";
import { useTranslation } from "react-i18next";

export const RegionCodeSelector = () => {
  const regionOptions = useRef([
    { value: "Auto" },
    ...Object.entries(regions.countries).map((region) => ({
      iconType: "flag",
      iconName: region[0],
      value: region[0],
    })),
  ]);
  const { t } = useTranslation();
  return (
    <FieldSelector
      name={"regionCode"}
      label={t("form.region")}
      className={styles.selector}
      options={regionOptions.current as Option[]}
      isVirtualizedList={true}
    />
  );
};
