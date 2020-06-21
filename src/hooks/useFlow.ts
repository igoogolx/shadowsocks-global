import { useCallback, useEffect, useState } from "react";
import { subscribeFlow, unsubscribeFlow } from "../utils/ipc";

export const useFlow = () => {
  const [flow, setFlow] = useState({
    downloadBytesPerSecond: 0,
    uploadBytesPerSecond: 0,
    totalUsage: 0,
    time: 0,
  });

  const updateFlowListener = useCallback((event, flow) => {
    if (flow) {
      setFlow(flow);
    }
  }, []);

  useEffect(() => {
    subscribeFlow(updateFlowListener);
    return () => {
      unsubscribeFlow(updateFlowListener);
    };
  }, [updateFlowListener]);

  return flow;
};
