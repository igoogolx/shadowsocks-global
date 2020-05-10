import { useCallback, useEffect, useState } from "react";
import { ipcRenderer } from "electron";

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
    ipcRenderer.on("updateFlow", updateFlowListener);
    return () => {
      ipcRenderer.removeListener("updateFlow", updateFlowListener);
    };
  }, [updateFlowListener]);

  return flow;
};
