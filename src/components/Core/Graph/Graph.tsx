import React, { useEffect } from "react";
import { ChartConfiguration } from "chart.js";
import { useChartjs } from "../../../hooks";
type ChartProps = {
  configuration: ChartConfiguration;
};
const Graph = (props: ChartProps) => {
  const { configuration } = props;

  const [chartRef, chart] = useChartjs(configuration);

  useEffect(() => {
    if (chart) {
      chart.config = configuration;
      //https://www.chartjs.org/docs/latest/developers/updates.html#preventing-animations
      chart.update({ duration: 0 });
    }
  }, [chart, configuration]);

  return <canvas id="graph" ref={chartRef} />;
};

const GraphMemo = React.memo(Graph);

export { GraphMemo as Graph };
