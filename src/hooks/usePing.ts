import { useCallback, useEffect, useRef, useState } from "react";
import { proxy } from "../reducers/proxyReducer";
import { checkServer } from "../utils/connectivity";
import { useDispatch } from "react-redux";

export type PingServer = {
  type: "shadowsocks" | "socks5";
  id: string;
  host: string;
  port: number;
};

export const usePing = (servers: PingServer[]) => {
  const dispatch = useDispatch();
  const [isPinging, setIsPing] = useState(false);
  const isUnmounting = useRef(false);
  useEffect(() => {
    return () => {
      isUnmounting.current = true;
    };
  }, []);
  const ping = useCallback(async () => {
    setIsPing(true);
    for (let i = 0; i < servers.length; i++) {
      if (isUnmounting.current) return;
      const { host, port, id, type } = servers[i];
      try {
        dispatch(
          proxy.actions.update({
            type,
            id,
            config: { pingTime: "pinging" },
          })
        );
        const pingTime = await checkServer({
          address: host,
          port,
          attempts: 1,
          timeout: 2000,
        });
        dispatch(
          proxy.actions.update({
            type,
            id,
            config: { pingTime },
          })
        );
      } catch (e) {
        dispatch(
          proxy.actions.update({
            type,
            id,
            config: { pingTime: "timeout" },
          })
        );
      }
    }
    setIsPing(false);
  }, [dispatch, servers]);

  return { isPinging, ping };
};
