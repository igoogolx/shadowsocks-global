import { Shadowsocks, Subscription } from "../../reducers/proxyReducer";
import { store } from "../../store/store";
//Note: If no server has been selected, this function will return undefined.
export const getActivatedServer = () => {
  const proxy = store.getState().proxy;
  const activatedId = proxy.activeId;
  const socks5 = proxy.socks5s.find(sock5s => sock5s.id === activatedId);
  if (!socks5) {
    const shadowsocks = proxy.shadowsockses.find(
      shadowsocks => shadowsocks.id === activatedId
    );
    if (!shadowsocks) {
      const subscription = proxy.subscriptions.find(subscription =>
        subscription.shadowsockses.some(
          shadowsocks => shadowsocks.id === activatedId
        )
      );
      return {
        type: "shadowsocks",
        ...((subscription as Subscription).shadowsockses.find(
          shadowsocks => shadowsocks.id === activatedId
        ) as Shadowsocks)
      };
    }
    return { type: "shadowsocks", ...shadowsocks };
  }
  return { type: "socks5", ...socks5 };
};
