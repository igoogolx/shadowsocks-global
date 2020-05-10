import React, { useMemo } from "react";
import { ChartConfiguration } from "chart.js";
import { Graph } from "../Core";
import { convertFlowData } from "../../share";

type SpeedGraphProps = {
  statistics: { download: number; upload: number; time: number }[];
};

export const SpeedGraph = (props: SpeedGraphProps) => {
  const { statistics } = props;
  const chartConfiguration = useMemo<ChartConfiguration>(
    () => ({
      type: "line",
      data: {
        labels: statistics.map((statistic) => statistic.time.toString()),
        datasets: [
          {
            label: "Download",
            borderColor: "#280AB2",
            borderWidth: 1,
            data: statistics.map((statistic) => statistic.download),
            fill: false,
            pointRadius: 0,
          },
          {
            label: "Upload",
            borderColor: "#fe8b56",
            borderWidth: 1,
            data: statistics.map((statistic) => statistic.upload),
            fill: false,
            pointRadius: 0,
          },
        ],
      },
      options: {
        animation: {},
        tooltips: { enabled: false },
        maintainAspectRatio: false,
        scales: {
          xAxes: [
            {
              gridLines: {
                display: false,
              },
              ticks: {
                display: false,
              },
            },
          ],
          yAxes: [
            {
              gridLines: {
                drawBorder: false,
              },
              ticks: {
                callback(value: number) {
                  return convertFlowData(value);
                },
                autoSkip: true,
                maxTicksLimit: 6,
              },
            },
          ],
        },
      },
    }),
    [statistics]
  );

  return <Graph configuration={chartConfiguration} />;
};
