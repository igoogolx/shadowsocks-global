import { createAction, createReducer } from "@reduxjs/toolkit";
import uuid from "uuid/v4";

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
  socks5s: []
};

export const startVpn = createAction("startVpn");
export const stopVpn = createAction("stopVpn");

export const setIsProcessing = createAction(
  "setIsProcessing",
  (isProcessing: boolean) => ({ payload: { isProcessing } })
);

export const setActiveId = createAction("setActiveId", (id: string) => ({
  payload: { id }
}));

export const addProxy = createAction(
  "addProxy",
  (
    proxy:
      | { type: "shadowsocks"; config: Omit<Shadowsocks, "id"> }
      | { type: "subscription"; config: Omit<Subscription, "id"> }
      | { type: "socks5"; config: Omit<Socks5, "id"> }
  ) => ({
    payload: { config: { id: uuid(), ...proxy.config }, type: proxy.type }
  })
);

export const updateProxy = createAction(
  "updateProxy",
  (
    proxy:
      | { type: "shadowsocks"; config: Shadowsocks }
      | { type: "subscription"; config: Subscription }
      | { type: "socks5"; config: Socks5 }
  ) => ({
    payload: proxy
  })
);

export const deleteProxy = createAction(
  "deleteProxy",
  (proxy: { type: "shadowsocks" | "subscription" | "socks5"; id: string }) => ({
    payload: proxy
  })
);

export const proxyReducer = createReducer(initialProxyState, {
  [setIsProcessing.type]: (state, action) => ({
    ...state,
    isProcessing: action.payload.isProcessing
  }),
  [startVpn.type]: state => ({ ...state, isStarted: true }),
  [stopVpn.type]: state => ({ ...state, isStarted: false }),
  [setActiveId.type]: (state, action) => ({
    ...state,
    activeId: action.payload.id
  }),
  [addProxy.type]: (state, action) => {
    const { type, config } = action.payload;
    switch (type) {
      case "shadowsocks":
        return {
          ...state,
          shadowsockses: [...state.shadowsockses, config]
        };
      case "subscription":
        return {
          ...state,
          subscriptions: [...state.subscriptions, config]
        };
      default:
        return {
          ...state,
          socks5s: [...state.socks5s, config]
        };
    }
  },
  [updateProxy.type]: (state, action) => {
    const { type, config } = action.payload;
    const update = (proxies: { id: string }[], index?: number) => {
      const updatedIndex =
        index || proxies.findIndex(proxy => proxy.id === config.id);
      return [
        ...proxies.slice(0, updatedIndex),
        config,
        ...proxies.slice(updatedIndex + 1)
      ];
    };
    switch (type) {
      case "shadowsocks": {
        const shadowsocksIndex = state.shadowsockses.findIndex(
          proxy => proxy.id === config.id
        );
        if (shadowsocksIndex === -1) {
          const updatedSubscriptionIndex = state.subscriptions.findIndex(
            subscription =>
              subscription.shadowsockses.some(
                shadowsocks => shadowsocks.id === config.id
              )
          );
          const updatingSubscription =
            state.subscriptions[updatedSubscriptionIndex];
          const updatedSubscription = {
            ...updatingSubscription,
            shadowsockses: update(updatingSubscription.shadowsockses)
          };
          return {
            ...state,
            subscriptions: [
              ...state.subscriptions.slice(0, updatedSubscriptionIndex),
              updatedSubscription,
              ...state.subscriptions.slice(updatedSubscriptionIndex + 1)
            ]
          };
        }
        return {
          ...state,
          shadowsockses: update(state.shadowsockses, shadowsocksIndex)
        };
      }

      case "subscription":
        return {
          ...state,
          subscriptions: update(state.subscriptions)
        };
      default:
        return {
          ...state,
          socks5s: update(state.socks5s)
        };
    }
  },
  [deleteProxy.type]: (state, action) => {
    const { type, id } = action.payload;
    switch (type) {
      case "shadowsocks": {
        const shadowsocksIndex = state.shadowsockses.findIndex(
          shadowsocks => shadowsocks.id === id
        );
        console.log(shadowsocksIndex);
        if (shadowsocksIndex === -1) {
          const deletedSubscriptionIndex = state.subscriptions.findIndex(
            subscription =>
              subscription.shadowsockses.some(
                shadowsocks => shadowsocks.id === id
              )
          );
          const deletingSubscription =
            state.subscriptions[deletedSubscriptionIndex];
          const deletedSubscription = {
            ...deletingSubscription,
            shadowsockses: deletingSubscription.shadowsockses.filter(
              shadowsocks => shadowsocks.id !== id
            )
          };
          return {
            ...state,
            subscriptions: [
              ...state.subscriptions.slice(0, deletedSubscriptionIndex),
              deletedSubscription,
              ...state.subscriptions.slice(deletedSubscriptionIndex + 1)
            ]
          };
        }
        return {
          ...state,
          shadowsockses: state.shadowsockses.filter(
            shadowsocks => shadowsocks.id !== id
          )
        };
      }
      case "subscription": {
        return {
          ...state,
          subscriptions: state.subscriptions.filter(
            subscription => subscription.id !== id
          )
        };
      }
      default: {
        return {
          ...state,
          socks5s: state.socks5s.filter(socks5 => socks5.id !== id)
        };
      }
    }
  }
});
