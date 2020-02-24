import { combineReducers } from "redux";
import { settingReducer, SettingState } from "./settingReducer";
import { proxyReducer, ProxyState } from "./proxyReducer";

export type AppState = {
  setting: SettingState;
  proxy: ProxyState;
};

export const rootReducer = combineReducers({
  setting: settingReducer,
  proxy: proxyReducer
});
