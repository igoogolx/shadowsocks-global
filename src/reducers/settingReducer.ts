import { createAction, createReducer } from "@reduxjs/toolkit";
import { DNS_SMART_TYPE } from "../constants";

const DEFAULT_LOCAL_PORT = 1081;

export const BUILD_IN_RULE = "Global";

type CustomizedDns = {
  isProxy: boolean;
  preferredServer: string;
  alternateServer: string;
};

type SmartDnsField = {
  isProxy: boolean;
  name: string;
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
};

export type SettingState = {
  general: GeneralState;
  dns: DnsSettingState;
  rule: RuleState;
};

//Note: The state will be initialed in configureStore by preloadedState.
export const initialSettingState: SettingState = {
  general: { shadowsocksLocalPort: DEFAULT_LOCAL_PORT },
  dns: {
    type: DNS_SMART_TYPE,
    smart: {
      defaultWebsite: {
        isProxy: true,
        name: "Google dns"
      },
      nativeWebsite: { isProxy: false, name: "DNSPod" }
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

export const setSmartDns = createAction(
  "setSmartDns",
  (defaultWebsite: SmartDnsField, nativeWebsite: SmartDnsField) => ({
    payload: {
      defaultWebsite,
      nativeWebsite
    }
  })
);
export const setCustomizedDns = createAction(
  "setCustomized",
  (dns: CustomizedDns) => ({
    payload: {
      dns
    }
  })
);

export const setCustomizedRulesDirPath = createAction(
  "setCustomizedRulesDirPath",
  (dirPath: string) => ({
    payload: { dirPath }
  })
);

export const setShadowsocksLocalPort = createAction(
  "setShadowsocksLocalPort",
  (localPort: number) => ({
    payload: { localPort }
  })
);

export const setCurrentRule = createAction(
  "setCurrentRule",
  (rule: string) => ({
    payload: { rule }
  })
);

export const addAdditionRoute = createAction(
  "addAdditionRoute",
  (route: { ip: string; isProxy: boolean }) => ({
    payload: { route }
  })
);

export const settingReducer = createReducer(initialSettingState, {
  [setShadowsocksLocalPort.type]: (state, action) => ({
    ...state,
    general: { shadowsocksLocalPort: action.payload.localPort }
  }),
  [setSmartDns.type]: (state, action) => ({
    ...state,
    dns: {
      ...state.dns,
      type: "smart",
      smart: action.payload
    }
  }),
  [setCustomizedDns.type]: (state, action) => ({
    ...state,
    dns: {
      ...state.dns,
      type: "customized",
      customized: action.payload.dns
    }
  }),

  [setCurrentRule.type]: (state, action) => {
    return { ...state, rule: { ...state.rule, current: action.payload.rule } };
  },
  [setCustomizedRulesDirPath.type]: (state, action) => ({
    ...state,
    rule: {
      ...state.rule,
      dirPath: action.payload.dirPath
    }
  }),
  [addAdditionRoute.type]: (state, action) => ({
    ...state,
    //TODO:Full-featured addition routes management
    rule: { ...state.rule, additionRoutes: [action.payload.route] }
  })
});
