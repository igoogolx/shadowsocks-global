import { rootReducer } from "../reducers/rootReducer";
import { configureStore } from "@reduxjs/toolkit";
import { initialSettingState } from "../reducers/settingReducer";
import { initialProxyState } from "../reducers/proxyReducer";

import Store from "electron-store";

const appConfig = new Store();

const isDev = process.env.NODE_ENV !== "production";

let localState = appConfig.get("state");
let preloadedState;
if (!localState || isDev) {
  localState = {
    setting: initialSettingState,
    proxy: initialProxyState,
  };
  appConfig.set("state", localState);
} else preloadedState = localState;

export const store = configureStore({
  reducer: rootReducer,
  devTools: isDev,
  preloadedState,
});

//Store app state in localStorage, once it is changed.
let currentValue: any;
function handleChange() {
  let previousValue = currentValue;
  currentValue = store.getState();
  if (previousValue !== currentValue) {
    appConfig.set("state", currentValue);
  }
}
store.subscribe(handleChange);
