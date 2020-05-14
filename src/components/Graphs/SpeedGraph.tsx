import React, { useEffect } from "react";
import { convertFlowData } from "../../share";
import { useChartjs } from "../../hooks";

const configuration = {
  type: "line",
  data: {
    datasets: [
      {
        label: "Download",
        borderColor: "#280AB2",
        borderWidth: 1,
        fill: false,
        pointRadius: 0,
      },
      {
        label: "Upload",
        borderColor: "#fe8b56",
        borderWidth: 1,
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
};

type SpeedGraphProps = {
  data: { download: number; upload: number; time: number }[];
};

export const SpeedGraph = (props: SpeedGraphProps) => {
  const { data } = props;

  const [chartRef, chart] = useChartjs(configuration);
  useEffect(() => {
    if (chart) {
      chart.data.labels = data.map((flow) => flow.time.toString());
      if (chart.data.datasets) {
        chart.data.datasets[0].data = data.map((flow) => flow.download);
        chart.data.datasets[1].data = data.map((flow) => flow.upload);
      }
      //https://www.chartjs.org/docs/latest/developers/updates.html#preventing-animations
      chart.update({ duration: 0 });
    }
  }, [chart, data]);

  return <canvas id="speed-graph" ref={chartRef} />;
};
