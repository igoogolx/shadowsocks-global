import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DNS_SMART_TYPE } from "../constants";

const DEFAULT_LOCAL_PORT = 1081;

export const BUILD_IN_RULE = "Global";
const GOOGLE_DNS = "8.8.8.8";
const DNS_POD = "119.29.29.29";

type CustomizedDns = {
  isProxy: boolean;
  preferredServer: string;
  alternateServer: string;
};

type SmartDnsField = {
  isProxy: boolean;
  server: string;
};

export type DnsSettingState = {
  type: "smart" | "customized";
  smart: {
    defaultWebsite: SmartDnsField;
    nativeWebsite: SmartDnsField;
  };
  customized: CustomizedDns;
};

export type RuleState = {
  current: string;
  dirPath: string;
  additionRoutes: { ip: string; isProxy: boolean }[];
};

export type GeneralState = {
  shadowsocksLocalPort: number;
  isProxyUdp: boolean;
  isUpdateSubscriptionsOnOpen: boolean;
  isRunAtSystemStartup: boolean;
  isHideWhenWindowIsClosed: boolean;
};

export type SettingState = {
  general: GeneralState;
  dns: DnsSettingState;
  rule: RuleState;
};

//Note: The state will be initialed in configureStore by preloadedState.
export const initialSettingState: SettingState = {
  general: {
    shadowsocksLocalPort: DEFAULT_LOCAL_PORT,
    isProxyUdp: true,
    isUpdateSubscriptionsOnOpen: false,
    isRunAtSystemStartup: false,
    isHideWhenWindowIsClosed: true,
  },
  dns: {
    type: DNS_SMART_TYPE,
    smart: {
      defaultWebsite: {
        isProxy: true,
        server: GOOGLE_DNS,
      },
      nativeWebsite: { isProxy: false, server: DNS_POD },
    },
    customized: {
      isProxy: true,
      preferredServer: "",
      alternateServer: "",
    },
  },
  rule: {
    current: BUILD_IN_RULE,
    dirPath: "",
    additionRoutes: [],
  },
};

export const setting = createSlice({
  name: "setting",
  initialState: initialSettingState,
  reducers: {
    setGeneral: (state, action: PayloadAction<GeneralState>) => {
      state.general = action.payload;
    },

    setSmartDns: (
      state,
      action: PayloadAction<{
        defaultWebsite: SmartDnsField;
        nativeWebsite: SmartDnsField;
      }>
    ) => {
      state.dns.type = "smart";
      state.dns.smart = action.payload;
    },
    setCustomizedDns: (state, action: PayloadAction<CustomizedDns>) => {
      state.dns.type = "customized";
      state.dns.customized = action.payload;
    },
    setCurrentRule: (state, action: PayloadAction<string>) => {
      state.rule.current = action.payload;
    },
    setCustomizedRulesDirPath: (state, action: PayloadAction<string>) => {
      state.rule.dirPath = action.payload;
    },
    addAdditionRoute: (
      state,
      action: PayloadAction<{ ip: string; isProxy: boolean }>
    ) => {
      state.rule.additionRoutes = [action.payload];
    },
  },
});
