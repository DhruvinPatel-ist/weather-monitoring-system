// charts.tsx - Fixed tooltip and color consistency issues
"use client";

import React from "react";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface LegendItem {
  label: string;
  color: string;
}

interface ChartProps {
  data?: { time: string; fullTime?: string; value: number }[];
  series?: {
    siteName: string;
    data: { time: string; fullTime?: string; value: number }[];
  }[];
  label?: string;
  color?: string;
  showMarker?: boolean;
  showDashes?: boolean;
  showTrackball?: boolean;
  showDateTooltip?: boolean;
  showValueTooltip?: boolean;
  showLimits?: boolean;
  showAnimation?: boolean;
  showLegend?: boolean;
  margin?: { top: number; right: number; bottom: number; left: number };
  xaxisprops?: any;
  staticLegend?: LegendItem[];
}

function formatUTCString(dateString: string): string {
  const [datePart, timePartWithMsZ] = dateString.split("T");
  const [yyyy, mm, dd] = datePart.split("-");
  const [HH, MM] = timePartWithMsZ.replace("Z", "").split(":");
  return `${dd}-${mm}-${yyyy} ${HH}:${MM}`;
}

function processChartData(
  data?: { time: string; fullTime?: string; value: number }[],
  series?: {
    siteName: string;
    data: { time: string; fullTime?: string; value: number }[];
  }[]
) {
  if (series) {
    const categories =
      series[0]?.data.map((d) => d.fullTime || formatUTCString(d.time)) || [];
    const seriesData = series.map((s) => ({
      name: s.siteName, // FIXED: Use siteName for proper tooltip display
      data: s.data.map((d) => d.value),
    }));
    return { categories, series: seriesData };
  }
  const categories =
    data?.map((d) => d.fullTime || formatUTCString(d.time)) || [];
  const seriesData = [{ name: "Value", data: data?.map((d) => d.value) || [] }];
  return { categories, series: seriesData };
}

function calculateLimits(
  data?: { time: string; fullTime?: string; value: number }[],
  series?: {
    siteName: string;
    data: { time: string; fullTime?: string; value: number }[];
  }[]
) {
  let allValues: number[] = [];
  if (series) {
    allValues = series.flatMap((s) => s.data.map((d) => d.value));
  } else {
    allValues = data?.map((d) => d.value) || [];
  }
  return { min: Math.min(...allValues), max: Math.max(...allValues) };
}

import { ApexOptions } from "apexcharts";

type ApexChartType =
  | "line"
  | "area"
  | "scatter"
  | "bar"
  | "pie"
  | "donut"
  | "radialBar"
  | "bubble"
  | "heatmap"
  | "candlestick"
  | "boxPlot"
  | "radar"
  | "polarArea"
  | "rangeBar"
  | "rangeArea"
  | "treemap";

function getBaseOptions(
  props: ChartProps,
  chartType: ApexChartType = "line",
  steplineCurve: boolean = false
): ApexOptions {
  const {
    showMarker,
    showDashes,
    showDateTooltip,
    showValueTooltip,
    showLimits,
    showAnimation,
    color = "#4693f1",
    data,
    series: multiSeries,
  } = props;

  const { min, max } = calculateLimits(data, multiSeries);

  // FIXED: Consistent color generation for both chart and legend
  const chartColors = multiSeries
    ? multiSeries.map((_, i) => `hsl(${(i * 67) % 360}, 70%, 50%)`)
    : [color];

  return {
    chart: {
      type: chartType,
      animations: { enabled: showAnimation },
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
      zoom: {
        enabled: true,
        type: chartType === "bar" ? "x" : "xy",
        autoScaleYaxis: chartType === "bar" ? true : false,
      },
    },
    colors: chartColors,
    stroke: {
      width: 2,
      dashArray: showDashes ? 5 : 0,
      curve: steplineCurve ? "stepline" : "smooth",
    },
    markers: {
      size: showMarker ? 4 : 0,
      hover: { size: 6 },
    },
    grid: { show: true, strokeDashArray: showDashes ? 3 : 0 },
    xaxis: {
      type: "category",
      labels: { rotate: -45, style: { fontSize: "10px" } },
      tooltip: { enabled: showDateTooltip },
      ...props.xaxisprops,
    },
    yaxis: {
      labels: { style: { fontSize: "10px" } },
      min: showLimits ? min * 0.9 : undefined,
      max: showLimits ? max * 1.1 : undefined,
    },
    tooltip: {
      enabled: showDateTooltip || showValueTooltip,
      shared: true,
      intersect: false,
      x: { show: showDateTooltip },
      // FIXED: Custom tooltip for better multiseries display
      custom: multiSeries
        ? function ({ series, dataPointIndex, w }) {
            let html = '<div class="custom-tooltip">';

            // Add timestamp
            const categories = w.globals.categoryLabels || w.globals.labels;
            if (categories && categories[dataPointIndex]) {
              html += `<div class="tooltip-title">${categories[dataPointIndex]}</div>`;
            }

            // Add all series data
            series.forEach((seriesData: number[], index: number) => {
              const seriesName = w.globals.seriesNames[index];
              const value = seriesData[dataPointIndex];
              const color = w.globals.colors[index];

              html += `
            <div class="tooltip-series">
              <span class="tooltip-marker" style="background-color: ${color}"></span>
              <span class="tooltip-label">${seriesName}: </span>
              <span class="tooltip-value">${value}</span>
            </div>
          `;
            });

            html += "</div>";
            return html;
          }
        : undefined,
    },
    legend: {
      show: false, // Use static legend instead
    },
    dataLabels: {
      enabled: false,
      enabledOnSeries: [0],
      style: {
        fontSize: "10px",
        colors: ["#000"],
      },
      background: {
        enabled: true,
        foreColor: "#fff",
        borderRadius: 2,
        padding: 2,
      },
    },
  };
}

function StaticLegend({
  legend,
}: {
  legend: { label: string; color: string }[];
}) {
  return (
    <div
      className="flex gap-2 justify-center items-center bg-transparent mb-2"
      aria-label="Chart legend"
    >
      {legend.map(({ label, color }) => (
        <div
          key={label}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              backgroundColor: color,
              borderRadius: 3,
              border: "1px solid #ccc",
            }}
          />
          <span style={{ fontSize: 12 }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

export function LineChart(props: ChartProps) {
  const { data, series: multiSeries, staticLegend, showLegend } = props;
  const processedData = processChartData(data, multiSeries);

  const options = {
    ...getBaseOptions(props, "line"),
    xaxis: {
      ...getBaseOptions(props, "line").xaxis,
      categories: processedData.categories,
    },
  };

  return (
    <div className="w-full h-full">
      {showLegend && staticLegend && <StaticLegend legend={staticLegend} />}
      <div
        style={{
          height: showLegend && staticLegend ? "calc(100% - 40px)" : "100%",
        }}
      >
        <Chart
          options={options}
          series={processedData.series}
          type="line"
          height="100%"
          width="100%"
        />
      </div>
    </div>
  );
}

export function StepLineChart(props: ChartProps) {
  const { data, series: multiSeries, staticLegend, showLegend } = props;
  const processedData = processChartData(data, multiSeries);

  const options = {
    ...getBaseOptions(props, "line", true),
    xaxis: {
      ...getBaseOptions(props, "line").xaxis,
      categories: processedData.categories,
    },
  };

  return (
    <div className="w-full h-full">
      {showLegend && staticLegend && <StaticLegend legend={staticLegend} />}
      <div
        style={{
          height: showLegend && staticLegend ? "calc(100% - 40px)" : "100%",
        }}
      >
        <Chart
          options={options}
          series={processedData.series}
          type="line"
          height="100%"
          width="100%"
        />
      </div>
    </div>
  );
}

export function DotChart(props: ChartProps) {
  const { data, series: multiSeries, staticLegend, showLegend } = props;
  const processedData = processChartData(data, multiSeries);

  const options = {
    ...getBaseOptions(props, "scatter"),
    stroke: { width: 0 },
    markers: { size: 6, hover: { size: 8 } },
    xaxis: {
      ...getBaseOptions(props, "scatter").xaxis,
      categories: processedData.categories,
    },
  };

  return (
    <div className="w-full h-full">
      {showLegend && staticLegend && <StaticLegend legend={staticLegend} />}
      <div
        style={{
          height: showLegend && staticLegend ? "calc(100% - 40px)" : "100%",
        }}
      >
        <Chart
          options={options}
          series={processedData.series}
          type="scatter"
          height="100%"
          width="100%"
        />
      </div>
    </div>
  );
}

export function StackedLineChart(props: ChartProps) {
  const { data, series: multiSeries, staticLegend, showLegend } = props;
  const processedData = processChartData(data, multiSeries);

  const options = {
    ...getBaseOptions(props, "area"),
    fill: { type: "gradient", gradient: { opacityFrom: 0.6, opacityTo: 0.1 } },
    stroke: { ...getBaseOptions(props, "area").stroke, width: 1 },
    xaxis: {
      ...getBaseOptions(props, "area").xaxis,
      categories: processedData.categories,
    },
  };

  return (
    <div className="w-full h-full">
      {showLegend && staticLegend && <StaticLegend legend={staticLegend} />}
      <div
        style={{
          height: showLegend && staticLegend ? "calc(100% - 40px)" : "100%",
        }}
      >
        <Chart
          options={options}
          series={processedData.series}
          type="area"
          height="100%"
          width="100%"
        />
      </div>
    </div>
  );
}

export function BarChart(props: ChartProps) {
  const { data, series: multiSeries, staticLegend, showLegend } = props;
  const processedData = processChartData(data, multiSeries);

  const options = {
    ...getBaseOptions(props, "bar"),
    plotOptions: {
      bar: {
        borderRadius: 2,
        columnWidth: "60%",
      },
    },
    xaxis: {
      ...getBaseOptions(props, "bar").xaxis,
      categories: processedData.categories,
      tickPlacement: "on", // CRITICAL: Required for zoom to work on bar charts
    },
    // Explicitly ensure zoom is enabled for bar charts
    chart: {
      ...getBaseOptions(props, "bar").chart,
      zoom: {
        enabled: true,
        type: "x" as const, // Restrict zoom to x-axis for bar charts
        autoScaleYaxis: true, // Auto-scale Y axis when zooming
      },
    },
    // Add grid padding to prevent bars from being cropped when zoomed
    grid: {
      ...getBaseOptions(props, "bar").grid,
      padding: {
        left: 20,
        right: 20,
      },
    },
  };

  return (
    <div className="w-full h-full">
      {showLegend && staticLegend && <StaticLegend legend={staticLegend} />}
      <div
        style={{
          height: showLegend && staticLegend ? "calc(100% - 40px)" : "100%",
        }}
      >
        <Chart
          options={options}
          series={processedData.series}
          type="bar"
          height="100%"
          width="100%"
        />
      </div>
    </div>
  );
}

// Backward compatibility export
export function MultiLineChart(props: ChartProps) {
  return LineChart(props);
}
