//The code is used by main and renderer process.
//TODO: Remove shared code
import {
  ProxyState,
  Shadowsocks,
  Subscription,
} from "../../reducers/proxyReducer";

// Resolves with true iff a response can be received from a semi-randomly-chosen website through the
const KB = 1024;
const MB = 1024 * KB;
const GB = 1024 * MB;
export const convertFlowData = (data: number) => {
  function financial(x: number, fractionDigits = 2) {
    return Number(Number.parseFloat(x.toString()).toFixed(fractionDigits));
  }

  if (data < KB) return `${financial(data)} B`;
  if (data < MB) return `${financial(data / KB)} KB`;
  if (data < GB) return `${financial(data / MB)} MB`;
  else return `${financial(data / GB)} GB`;
};

export const SMART_DNS_ADDRESS = "127.0.0.1";
//Note: If no server has been selected, this function will return undefined.
export const getActivatedServer = (proxy: ProxyState) => {
  const activatedId = proxy.activeId;
  const shadowsocks = proxy.shadowsockses.find(
    (shadowsocks) => shadowsocks.id === activatedId
  );
  if (!shadowsocks) {
    const subscription = proxy.subscriptions.find((subscription) =>
      subscription.shadowsockses.some(
        (shadowsocks) => shadowsocks.id === activatedId
      )
    );
    return {
      type: "shadowsocks",
      ...((subscription as Subscription).shadowsockses.find(
        (shadowsocks) => shadowsocks.id === activatedId
      ) as Shadowsocks),
    };
  }
  return { type: "shadowsocks", ...shadowsocks };
};
