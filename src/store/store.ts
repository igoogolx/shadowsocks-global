import { rootReducer, AppState } from "../reducers/rootReducer";
import { configureStore } from "@reduxjs/toolkit";
import { initialSettingState } from "../reducers/settingReducer";
import { initialProxyState } from "../reducers/proxyReducer";

const isDev = process.env.NODE_ENV !== "production";

let localState = window.localStorage.getItem("state");
let preloadedState;
if (!localState || isDev) {
  localState = JSON.stringify({
    setting: initialSettingState,
    proxy: initialProxyState
  });
  window.localStorage.setItem("state", localState);
} else preloadedState = JSON.parse(localState) as AppState;

export const store = configureStore({
  reducer: rootReducer,
  devTools: isDev,
  preloadedState
});

//Store app state in localStorage, once it is changed.
if (!isDev) {
  let currentValue: any;
  function handleChange() {
    let previousValue = currentValue;
    currentValue = store.getState();
    console.log(currentValue);
    if (previousValue !== currentValue) {
      window.localStorage.setItem("state", JSON.stringify(currentValue));
    }
  }
  store.subscribe(handleChange);
}
