declare module "react-gauge-chart" {
  import React from "react";

  interface GaugeChartProps {
    id?: string;
    nrOfLevels?: number;
    arcsLength?: number[];
    colors?: string[];
    percent: number;
    arcPadding?: number;
    cornerRadius?: number;
    needleColor?: string;
    needleBaseColor?: string;
    animate?: boolean;
    textColor?: string;
    formatTextValue?: (value: string) => string;
    style?: React.CSSProperties;
    className?: string;
  }

  const GaugeChart: React.FC<GaugeChartProps>;

  export default GaugeChart;
}
