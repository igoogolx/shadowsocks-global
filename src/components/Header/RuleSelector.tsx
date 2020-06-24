import React, { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./header.module.css";
import { notifier, Selector } from "../Core";
import { setting } from "../../reducers/settingReducer";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../../reducers/rootReducer";
import { getBuildInRules } from "../../utils/ipc";
import { useTranslation } from "react-i18next";

export const RuleSelector = React.memo(() => {
  const isConnected = useSelector<AppState, boolean>(
    (state) => state.proxy.isConnected
  );
  const isProcessing = useSelector<AppState, boolean>(
    (state) => state.proxy.isProcessing
  );
  const currentRule = useSelector<AppState, string>(
    (state) => state.setting.rule.current
  );
  const [rules, setRules] = useState<string[]>([]);
  const [isLoadingRules, setIsLoadingRules] = useState(false);

  const dispatch = useDispatch();
  const changeCurrentRule = useCallback(
    (rule: string) => dispatch(setting.actions.setCurrentRule(rule)),
    [dispatch]
  );
  const rulesOptions = useMemo(
    () => [
      ...rules.map((rule) => ({
        value: rule,
      })),
    ],
    [rules]
  );
  const customizedRulesDirPath = useSelector<AppState, string>(
    (state) => state.setting.rule.dirPath
  );
  useEffect(() => {
    const loadRulePath = async () => {
      setIsLoadingRules(true);
      let rules: string[] = [];
      try {
        const buildInRules = (await getBuildInRules()) as string[];
        rules = [...rules, ...buildInRules];
      } catch (e) {
        notifier.error("Fail to load rules");
      }
      setRules(rules);
    };
    loadRulePath().then(() => {
      setIsLoadingRules(false);
    });
  }, [customizedRulesDirPath]);

  const { t } = useTranslation();
  return (
    <Selector
      options={rulesOptions}
      label={t("header.rule")}
      value={currentRule}
      onChange={changeCurrentRule}
      className={styles.selector}
      disabled={isLoadingRules || isConnected || isProcessing}
      isVirtualizedList={rulesOptions.length > 4}
    />
  );
});
