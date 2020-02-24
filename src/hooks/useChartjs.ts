import React, { useEffect, useRef } from "react";
import Chart, { ChartConfiguration } from "chart.js";

export const useChartjs = (
  initialConfiguration: ChartConfiguration
): [React.RefObject<HTMLCanvasElement>, Chart | undefined] => {
  const chartRef = useRef<HTMLCanvasElement>(null);

  const chart = useRef<Chart>();

  useEffect(() => {
    if (chartRef.current && !chart.current) {
      const ctx = chartRef.current;
      if (ctx) {
        chart.current = new Chart(ctx, initialConfiguration);
      }
    }
  }, [initialConfiguration]);

  return [chartRef, chart.current];
};
