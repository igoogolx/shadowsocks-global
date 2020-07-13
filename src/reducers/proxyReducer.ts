import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { nanoid } from "@reduxjs/toolkit";

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

  pingTime?: number | "pinging" | "timeout";
};

export type Subscription = {
  id: string;
  name: string;
  url: string;
  shadowsockses: Shadowsocks[];
};

export type ProxyState = {
  isConnected: boolean;
  //Connecting or  Disconnecting
  isProcessing: boolean;
  activeId: string;
  shadowsockses: Shadowsocks[];
  subscriptions: Subscription[];
  selectedIds: string[];
  isSelecting: boolean;
};

export const initialProxyState: ProxyState = {
  isConnected: false,
  isProcessing: false,
  activeId: "",
  shadowsockses: [],
  subscriptions: [],
  selectedIds: [],
  isSelecting: false,
};

export const proxy = createSlice({
  name: "proxy",
  initialState: initialProxyState,
  reducers: {
    select: (state, action: PayloadAction<string>) => {
      state.selectedIds.push(action.payload);
    },
    selectAll: (state) => {
      const ids = state.shadowsockses.map((shadowsocks) => shadowsocks.id);
      state.subscriptions.forEach((subscription) => {
        subscription.shadowsockses.forEach((shadowsocks) => {
          ids.push(shadowsocks.id);
        });
      });
      state.selectedIds = ids;
    },
    unSelect: (state, action: PayloadAction<string>) => {
      const index = state.selectedIds.indexOf(action.payload);
      if (index === -1) return;
      state.selectedIds.splice(index, 1);
    },
    resetSelectedIds: (state) => {
      state.selectedIds = [];
    },
    setIsSelecting: (state, action: PayloadAction<boolean>) => {
      state.isSelecting = action.payload;
    },
    setIsConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
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
        }
      },
      prepare: (
        proxy:
          | { type: "shadowsocks"; config: Omit<Shadowsocks, "id"> }
          | { type: "subscription"; config: Omit<Subscription, "id"> }
      ) => ({
        payload: { ...proxy, config: { id: nanoid(), ...proxy.config } },
      }),
    },
    sortByPingTime: (
      state,
      action: PayloadAction<
        | { type: "shadowsockses"; id?: undefined }
        | { type: "subscription"; id: string }
      >
    ) => {
      const { type } = action.payload;
      const compareFunction = (
        a: Pick<Shadowsocks, "pingTime">,
        b: Pick<Shadowsocks, "pingTime">
      ) => {
        if (typeof a.pingTime !== "number") return 1;
        if (typeof b.pingTime !== "number") return -1;
        if (a.pingTime > b.pingTime) return 1;
        if (a.pingTime < b.pingTime) return -1;
        return 0;
      };
      switch (type) {
        case "shadowsockses":
          state.shadowsockses.sort(compareFunction);
          break;
        case "subscription":
          const id = action.payload.id;
          const index = state.subscriptions.findIndex((subscription) => {
            if (id) return subscription.id === id;
            return false;
          });
          if (index !== -1)
            state.subscriptions[index].shadowsockses.sort(compareFunction);
      }
    },
    update: (
      state,
      action: PayloadAction<
        | { type: "shadowsocks"; id: string; config: Partial<Shadowsocks> }
        | { type: "subscription"; id: string; config: Partial<Subscription> }
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
      }
    },
    delete: (
      state,
      action: PayloadAction<{
        type: "shadowsocks";
        ids: string[];
      }>
    ) => {
      const { type, ids } = action.payload;
      if (type === "shadowsocks") {
        ids.forEach((id) => {
          deleteOneShadowsocks(state, id);
        });
      }
    },
    deleteAll: (
      state,
      action: PayloadAction<{
        type: "shadowsocks";
      }>
    ) => {
      const { type } = action.payload;
      if (type === "shadowsocks") {
        state.shadowsockses = [];
      }
    },
    deleteOne: (
      state,
      action: PayloadAction<{
        type: "shadowsocks" | "subscription";
        id: string;
      }>
    ) => {
      const { type, id } = action.payload;
      switch (type) {
        case "shadowsocks":
          deleteOneShadowsocks(state, id);
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
      }
    },
  },
});

const deleteOneShadowsocks = (state: ProxyState, id: string) => {
  //Reset activated id
  if (state.activeId === id) state.activeId = "";
  const shadowsocksIndex = state.shadowsockses.findIndex(
    (shadowsocks) => shadowsocks.id === id
  );
  if (shadowsocksIndex === -1) {
    state.subscriptions.some((subscription, subscriptionIndex) =>
      subscription.shadowsockses.some((shadowsocks, subShadowsocksIndex) => {
        if (shadowsocks.id === id) {
          state.subscriptions[subscriptionIndex].shadowsockses.splice(
            subShadowsocksIndex,
            1
          );
          return true;
        }
        return false;
      })
    );
  } else state.shadowsockses.splice(shadowsocksIndex, 1);
};
