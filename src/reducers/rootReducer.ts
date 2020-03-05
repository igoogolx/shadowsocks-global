import { combineReducers } from "redux";
import { proxy } from "./proxyReducer";
import { setting } from "./settingReducer";

export type AppState = ReturnType<typeof rootReducer>;

export const rootReducer = combineReducers({
  setting: setting.reducer,
  proxy: proxy.reducer
});
