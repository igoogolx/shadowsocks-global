import { useCallback, useEffect, useState } from "react";
import { ipcRenderer } from "electron";

export const useTrafficStatistics = () => {
  const [trafficStatistics, setTrafficStatistics] = useState({
    sentBytesPerSecond: 0,
    receivedBytesPerSecond: 0,
    usage: 0,
    time: 0,
  });

  const updateTrafficStatisticsListener = useCallback((event, traffic) => {
    if (traffic) {
      setTrafficStatistics(traffic);
    }
  }, []);

  useEffect(() => {
    ipcRenderer.on("updateTrafficStatistics", updateTrafficStatisticsListener);
    return () => {
      ipcRenderer.removeListener(
        "updateTrafficStatistics",
        updateTrafficStatisticsListener
      );
    };
  }, [updateTrafficStatisticsListener]);

  return trafficStatistics;
};
