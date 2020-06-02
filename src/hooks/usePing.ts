import { useCallback, useEffect, useRef, useState } from "react";
import { proxy } from "../reducers/proxyReducer";
import { checkServer } from "../utils/connectivity";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../reducers/rootReducer";

export type PingServer = {
  type: "shadowsocks" | "socks5";
  id: string;
  host: string;
  port: number;
};

export const usePing = (servers: PingServer[]) => {
  const dispatch = useDispatch();
  const [isPinging, setIsPing] = useState(false);
  const isConnected = useSelector<AppState, boolean>(
    (state) => state.proxy.isConnected
  );
  const isConnectedRef = useRef(false);
  const isUnmounting = useRef(false);
  useEffect(() => {
    return () => {
      isUnmounting.current = true;
    };
  }, []);
  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);
  const ping = useCallback(async () => {
    setIsPing(true);
    for (let i = 0; i < servers.length; i++) {
      if (isUnmounting.current || isConnectedRef.current) return;
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
