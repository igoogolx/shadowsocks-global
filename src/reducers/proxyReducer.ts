import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuid } from "uuid";

export type Shadowsocks = {
  id: string;
  host: string;
  port: number;

  method: string;
  password: string;
  name?: string;

  plugin?: string;
  plugin_opts?: string;

  regionCode?: string;

  delay?: number;
};

export type Subscription = {
  id: string;
  name: string;
  url: string;
  shadowsockses: Shadowsocks[];
};

export type Socks5 = {
  id: string;
  regionCode?: string;
  host: string;
  port: number;
  name?: string;

  delay?: number;
};

export type ProxyState = {
  isStarted: boolean;
  //Starting or Stopping
  isProcessing: boolean;
  activeId: string;
  shadowsockses: Shadowsocks[];
  subscriptions: Subscription[];
  socks5s: Socks5[];
};

export const initialProxyState: ProxyState = {
  isStarted: false,
  isProcessing: false,
  activeId: "",
  shadowsockses: [],
  subscriptions: [],
  socks5s: [],
};

export const proxy = createSlice({
  name: "proxy",
  initialState: initialProxyState,
  reducers: {
    startVpn: (state) => {
      state.isStarted = true;
    },
    stopVpn: (state) => {
      state.isStarted = false;
    },
    setIsProcessing: (state, action: PayloadAction<boolean>) => {
      state.isProcessing = action.payload;
    },
    setActiveId: (state, action: PayloadAction<string>) => {
      state.activeId = action.payload;
    },
    add: {
      reducer: (state, action: any) => {
        const { type, config } = action.payload;
        switch (type) {
          case "shadowsocks":
            state.shadowsockses.push(config);
            break;
          case "subscription":
            state.subscriptions.push(config);
            break;
          //Socks5
          default:
            state.socks5s.push(config);
        }
      },
      prepare: (
        proxy:
          | { type: "shadowsocks"; config: Omit<Shadowsocks, "id"> }
          | { type: "subscription"; config: Omit<Subscription, "id"> }
          | { type: "socks5"; config: Omit<Socks5, "id"> }
      ) => ({
        payload: { ...proxy, config: { id: uuid(), ...proxy.config } },
      }),
    },
    update: (
      state,
      action: PayloadAction<
        | { type: "shadowsocks"; id: string; config: Partial<Shadowsocks> }
        | { type: "subscription"; id: string; config: Partial<Subscription> }
        | { type: "socks5"; id: string; config: Partial<Socks5> }
      >
    ) => {
      const { type, id, config } = action.payload;
      switch (type) {
        case "shadowsocks":
          {
            const shadowsocksIndex = state.shadowsockses.findIndex(
              (proxy) => proxy.id === id
            );
            if (shadowsocksIndex === -1) {
              state.subscriptions.some((subscription, subscriptionIndex) =>
                subscription.shadowsockses.some(
                  (shadowsocks, subShadowsocksIndex) => {
                    if (shadowsocks.id === id) {
                      state.subscriptions[subscriptionIndex].shadowsockses[
                        subShadowsocksIndex
                      ] = {
                        ...state.subscriptions[subscriptionIndex].shadowsockses[
                          subShadowsocksIndex
                        ],
                        ...config,
                      };
                      return true;
                    }
                    return false;
                  }
                )
              );
            } else
              state.shadowsockses[shadowsocksIndex] = {
                ...state.shadowsockses[shadowsocksIndex],
                ...config,
              };
          }
          break;
        case "subscription":
          {
            const index = state.subscriptions.findIndex(
              (subscription) => subscription.id === id
            );
            if (
              state.subscriptions[index].shadowsockses.some(
                (shadowsocks) => shadowsocks.id === state.activeId
              )
            )
              //Reset activated id
              state.activeId = "";
            state.subscriptions[index] = {
              ...state.subscriptions[index],
              ...config,
            };
          }
          break;
        //Socks5
        default: {
          const index = state.socks5s.findIndex((socks5) => socks5.id === id);
          state.socks5s[index] = { ...state.socks5s[index], ...config };
        }
      }
    },
    delete: (
      state,
      action: PayloadAction<{
        type: "shadowsocks" | "subscription" | "socks5";
        id: string;
      }>
    ) => {
      const { type, id } = action.payload;
      switch (type) {
        case "shadowsocks":
          //Delete all
          if (id === "") {
            const isActivated = state.shadowsockses.some(
              (shadowsocks) => (shadowsocks.id = state.activeId)
            );
            if (isActivated) state.activeId = "";
            state.shadowsockses = [];
          } else {
            //Reset activated id
            if (state.activeId === id) state.activeId = "";
            const shadowsocksIndex = state.shadowsockses.findIndex(
              (shadowsocks) => shadowsocks.id === id
            );
            if (shadowsocksIndex === -1) {
              state.subscriptions.some((subscription, subscriptionIndex) =>
                subscription.shadowsockses.some(
                  (shadowsocks, subShadowsocksIndex) => {
                    if (shadowsocks.id === id) {
                      state.subscriptions[
                        subscriptionIndex
                      ].shadowsockses.splice(subShadowsocksIndex, 1);
                      return true;
                    }
                    return false;
                  }
                )
              );
            } else state.shadowsockses.splice(shadowsocksIndex, 1);
          }
          break;
        case "subscription":
          {
            const index = state.subscriptions.findIndex(
              (subscription) => subscription.id === id
            );
            if (
              state.subscriptions[index].shadowsockses.some(
                (shadowsocks) => shadowsocks.id === state.activeId
              )
            )
              //Reset activated id
              state.activeId = "";
            state.subscriptions.splice(index, 1);
          }
          break;
        //Socks5
        default: {
          //Delete all
          if (id === "") {
            const isActivated = state.socks5s.some(
              (socks5) => socks5.id === state.activeId
            );
            if (isActivated) state.activeId = "";
            state.socks5s = [];
          }

          //Reset activated id
          if (state.activeId === id) state.activeId = "";
          state.socks5s = state.socks5s.filter((socks5) => socks5.id !== id);
        }
      }
    },
  },
});
