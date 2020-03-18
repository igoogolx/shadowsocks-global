import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DNS_OPTIONS, DNS_SMART_TYPE } from "../constants";

const DEFAULT_LOCAL_PORT = 1081;

export const BUILD_IN_RULE = "Global";

type CustomizedDns = {
  isProxy: boolean;
  preferredServer: string;
  alternateServer: string;
};

type SmartDnsField = {
  isProxy: boolean;
  dns: { name: string; preferredServer: string; alternateServer: string };
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
};

export type SettingState = {
  general: GeneralState;
  dns: DnsSettingState;
  rule: RuleState;
};

//Note: The state will be initialed in configureStore by preloadedState.
export const initialSettingState: SettingState = {
  general: { shadowsocksLocalPort: DEFAULT_LOCAL_PORT, isProxyUdp: true },
  dns: {
    type: DNS_SMART_TYPE,
    smart: {
      defaultWebsite: {
        isProxy: true,
        dns: DNS_OPTIONS[0]
      },
      nativeWebsite: { isProxy: false, dns: DNS_OPTIONS[1] }
    },
    customized: {
      isProxy: true,
      preferredServer: "",
      alternateServer: ""
    }
  },
  rule: {
    current: BUILD_IN_RULE,
    dirPath: "",
    additionRoutes: []
  }
};

export const setting = createSlice({
  name: "setting",
  initialState: initialSettingState,
  reducers: {
    setIsProxyUdp: (state, action: PayloadAction<boolean>) => {
      state.general.isProxyUdp = action.payload;
    },
    setShadowsocksLocalPort: (state, action: PayloadAction<number>) => {
      state.general.shadowsocksLocalPort = action.payload;
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
    }
  }
});
