/* eslint-disable */
"use client";

import React, { useMemo, useState, useCallback } from "react";
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
  // New props for bulk data handling
  maxDataPoints?: number;
  enableDataSampling?: boolean;
  enableVirtualization?: boolean;
  samplingStrategy?: string;
  showDataInfo?: boolean;
}

// Data sampling strategies
enum SamplingStrategy {
  LTTB = "lttb", // Largest Triangle Three Buckets
  AVERAGE = "average",
  MIN_MAX = "minmax",
  FIRST_LAST = "firstlast",
}

// Largest Triangle Three Buckets algorithm for data downsampling
function lttbSampling(
  data: { time: string; value: number }[],
  threshold: number
) {
  if (data.length <= threshold) return data;

  const sampled = [];
  const bucketSize = (data.length - 2) / (threshold - 2);

  sampled.push(data[0]); // Always keep first point

  let a = 0;
  for (let i = 0; i < threshold - 2; i++) {
    const avgRangeStart = Math.floor((i + 1) * bucketSize) + 1;
    const avgRangeEnd = Math.min(
      Math.floor((i + 2) * bucketSize) + 1,
      data.length
    );

    // Calculate average point in next bucket
    let avgTime = 0,
      avgValue = 0;
    let avgRangeLength = avgRangeEnd - avgRangeStart;

    for (let j = avgRangeStart; j < avgRangeEnd; j++) {
      avgTime += new Date(data[j].time).getTime();
      avgValue += data[j].value;
    }
    avgTime /= avgRangeLength;
    avgValue /= avgRangeLength;

    // Get range for current bucket
    const rangeOffs = Math.floor(i * bucketSize) + 1;
    const rangeTo = Math.floor((i + 1) * bucketSize) + 1;

    // Point A (last selected point)
    const pointATime = new Date(data[a].time).getTime();
    const pointAValue = data[a].value;

    let maxArea = -1;
    let maxAreaPoint = rangeOffs;

    for (let j = rangeOffs; j < rangeTo; j++) {
      const pointBTime = new Date(data[j].time).getTime();
      const pointBValue = data[j].value;

      // Calculate triangle area
      const area =
        Math.abs(
          (pointATime - avgTime) * (pointBValue - pointAValue) -
            (pointATime - pointBTime) * (avgValue - pointAValue)
        ) * 0.5;

      if (area > maxArea) {
        maxArea = area;
        maxAreaPoint = j;
      }
    }

    sampled.push(data[maxAreaPoint]);
    a = maxAreaPoint;
  }

  sampled.push(data[data.length - 1]); // Always keep last point
  return sampled;
}

// Average-based downsampling
function averageSampling(
  data: { time: string; value: number }[],
  threshold: number
) {
  if (data.length <= threshold) return data;

  const bucketSize = Math.ceil(data.length / threshold);
  const sampled = [];

  for (let i = 0; i < data.length; i += bucketSize) {
    const bucket = data.slice(i, i + bucketSize);
    const avgValue =
      bucket.reduce((sum, point) => sum + point.value, 0) / bucket.length;
    const midIndex = Math.floor(bucket.length / 2);

    sampled.push({
      time: bucket[midIndex].time,
      value: avgValue,
    });
  }

  return sampled;
}

// Min-Max downsampling (preserves peaks and valleys)
function minMaxSampling(
  data: { time: string; value: number }[],
  threshold: number
) {
  if (data.length <= threshold) return data;

  const bucketSize = Math.ceil(data.length / (threshold / 2));
  const sampled = [];

  for (let i = 0; i < data.length; i += bucketSize) {
    const bucket = data.slice(i, i + bucketSize);

    let min = bucket[0];
    let max = bucket[0];

    bucket.forEach((point) => {
      if (point.value < min.value) min = point;
      if (point.value > max.value) max = point;
    });

    // Add min first, then max (maintains temporal order roughly)
    if (new Date(min.time).getTime() < new Date(max.time).getTime()) {
      sampled.push(min, max);
    } else {
      sampled.push(max, min);
    }
  }

  return sampled.slice(0, threshold);
}

// Hook for data processing with caching
function useProcessedData(
  data?: { time: string; fullTime?: string; value: number }[],
  series?: {
    siteName: string;
    data: { time: string; fullTime?: string; value: number }[];
  }[],
  maxDataPoints: number = 1000,
  enableSampling: boolean = true,
  samplingStrategy: string = "lttb"
) {
  return useMemo(() => {
    const processData = (
      rawData: { time: string; fullTime?: string; value: number }[]
    ) => {
      if (!enableSampling || rawData.length <= maxDataPoints) {
        return rawData;
      }

      // Convert to simple format for sampling
      const simpleData = rawData.map((d) => ({ time: d.time, value: d.value }));

      let sampledData;
      switch (samplingStrategy) {
        case "lttb":
          sampledData = lttbSampling(simpleData, maxDataPoints);
          break;
        case "average":
          sampledData = averageSampling(simpleData, maxDataPoints);
          break;
        case "minmax":
          sampledData = minMaxSampling(simpleData, maxDataPoints);
          break;
        default:
          sampledData = simpleData.slice(0, maxDataPoints);
      }

      // Convert back to original format
      return sampledData.map((d) => ({
        time: d.time,
        fullTime: formatUTCString(d.time),
        value: d.value,
      }));
    };

    if (series) {
      const processedSeries = series.map((s) => ({
        siteName: s.siteName,
        data: processData(s.data),
      }));

      const categories =
        processedSeries[0]?.data.map(
          (d) => d.fullTime || formatUTCString(d.time)
        ) || [];
      const seriesData = processedSeries.map((s) => ({
        name: s.siteName,
        data: s.data.map((d) => d.value),
      }));

      return {
        categories,
        series: seriesData,
        originalLength: series[0]?.data.length || 0,
      };
    }

    const processedData = data ? processData(data) : [];
    const categories = processedData.map(
      (d) => d.fullTime || formatUTCString(d.time)
    );
    const seriesData = [
      { name: "Value", data: processedData.map((d) => d.value) },
    ];

    return {
      categories,
      series: seriesData,
      originalLength: data?.length || 0,
    };
  }, [data, series, maxDataPoints, enableSampling, samplingStrategy]);
}

function formatUTCString(dateString: string): string {
  const [datePart, timePartWithMsZ] = dateString.split("T");
  const [yyyy, mm, dd] = datePart.split("-");
  const [HH, MM] = timePartWithMsZ.replace("Z", "").split(":");
  return `${dd}-${mm}-${yyyy} ${HH}:${MM}`;
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

function getOptimizedOptions(
  props: ChartProps,
  chartType: ApexChartType = "line",
  steplineCurve: boolean = false,
  dataLength: number = 0
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
    maxDataPoints = 1000,
  } = props;

  const { min, max } = calculateLimits(data, multiSeries);

  const chartColors = multiSeries
    ? multiSeries.map((_, i) => `hsl(${(i * 67) % 360}, 70%, 50%)`)
    : [color];

  // Disable animations and markers for large datasets
  const isLargeDataset = dataLength > maxDataPoints;

  return {
    chart: {
      type: chartType,
      animations: { enabled: showAnimation && !isLargeDataset },
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
      // Optimize for performance
      redrawOnParentResize: false,
      redrawOnWindowResize: true,
    },
    colors: chartColors,
    stroke: {
      width: isLargeDataset ? 1 : 2, // Thinner lines for large datasets
      dashArray: showDashes ? 5 : 0,
      curve: steplineCurve
        ? "stepline"
        : isLargeDataset
        ? "straight"
        : "smooth",
    },
    markers: {
      size: showMarker && !isLargeDataset ? 4 : 0, // Disable markers for large datasets
      hover: { size: 6 },
    },
    grid: {
      show: true,
      strokeDashArray: showDashes ? 3 : 0,
      // Reduce grid density for large datasets
      xaxis: {
        lines: {
          show: !isLargeDataset,
        },
      },
    },
    xaxis: {
      type: "category",
      labels: {
        rotate: -45,
        style: { fontSize: "10px" },
        // Show fewer labels for large datasets
        maxHeight: isLargeDataset ? 60 : undefined,
      },
      tooltip: { enabled: showDateTooltip },
      // Optimize tick amount for performance
      tickAmount: isLargeDataset
        ? Math.min(10, Math.floor(dataLength / 100))
        : undefined,
      ...props.xaxisprops,
    },
    yaxis: {
      labels: { style: { fontSize: "10px" } },
      min: showLimits ? min * 0.9 : undefined,
      max: showLimits ? max * 1.1 : undefined,
    },
    tooltip: {
      enabled: showDateTooltip || showValueTooltip,
      shared: !isLargeDataset, // Disable shared tooltip for large datasets
      intersect: isLargeDataset,
      x: { show: showDateTooltip },
      // Simplified tooltip for large datasets
      custom:
        multiSeries && !isLargeDataset
          ? function ({ series, dataPointIndex, w }) {
              let html = '<div class="custom-tooltip">';
              const categories = w.globals.categoryLabels || w.globals.labels;
              if (categories && categories[dataPointIndex]) {
                html += `<div class="tooltip-title">${categories[dataPointIndex]}</div>`;
              }
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
      show: false,
    },
    dataLabels: {
      enabled: false, // Always disabled for performance
    },
    // Performance optimizations
    plotOptions: {
      line: {
        isSlopeChart: false,
      },
      area: {
        fillTo: "origin",
      },
    },
    // Reduce memory usage
    noData: {
      text: "Loading...",
      align: "center",
      verticalAlign: "middle",
      offsetX: 0,
      offsetY: 0,
      style: {
        color: undefined,
        fontSize: "14px",
        fontFamily: undefined,
      },
    },
  };
}

// Data info component
function DataInfo({
  originalLength,
  processedLength,
}: {
  originalLength: number;
  processedLength: number;
}) {
  if (originalLength === processedLength) return null;

  return (
    <div className="text-xs text-gray-500 mb-2 text-center">
      Showing {processedLength.toLocaleString()} of{" "}
      {originalLength.toLocaleString()} data points (Data has been optimized for
      performance)
    </div>
  );
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

// Optimized chart components
export function LineChart(props: ChartProps) {
  const {
    staticLegend,
    showLegend,
    maxDataPoints = 1000,
    enableDataSampling = true,
    samplingStrategy = "lttb",
    showDataInfo = true,
  } = props;
  const { categories, series, originalLength } = useProcessedData(
    props.data,
    props.series,
    maxDataPoints,
    enableDataSampling,
    samplingStrategy
  );

  const options = {
    ...getOptimizedOptions(props, "line", false, originalLength),
    xaxis: {
      ...getOptimizedOptions(props, "line").xaxis,
      categories: categories,
    },
  };

  return (
    <div className="w-full h-full">
      {showDataInfo && (
        <DataInfo
          originalLength={originalLength}
          processedLength={categories.length}
        />
      )}
      {showLegend && staticLegend && <StaticLegend legend={staticLegend} />}
      <div
        style={{
          height:
            showLegend && staticLegend
              ? "calc(100% - 60px)"
              : "calc(100% - 20px)",
        }}
      >
        <Chart
          options={options}
          series={series}
          type="line"
          height="100%"
          width="100%"
        />
      </div>
    </div>
  );
}

export function StepLineChart(props: ChartProps) {
  const {
    staticLegend,
    showLegend,
    maxDataPoints = 1000,
    enableDataSampling = true,
    samplingStrategy = "lttb",
    showDataInfo = true,
  } = props;
  const { categories, series, originalLength } = useProcessedData(
    props.data,
    props.series,
    maxDataPoints,
    enableDataSampling,
    samplingStrategy
  );

  const options = {
    ...getOptimizedOptions(props, "line", true, originalLength),
    xaxis: {
      ...getOptimizedOptions(props, "line", true).xaxis,
      categories: categories,
    },
  };

  return (
    <div className="w-full h-full">
      {showDataInfo && (
        <DataInfo
          originalLength={originalLength}
          processedLength={categories.length}
        />
      )}
      {showLegend && staticLegend && <StaticLegend legend={staticLegend} />}
      <div
        style={{
          height:
            showLegend && staticLegend
              ? "calc(100% - 60px)"
              : "calc(100% - 20px)",
        }}
      >
        <Chart
          options={options}
          series={series}
          type="line"
          height="100%"
          width="100%"
        />
      </div>
    </div>
  );
}

export function DotChart(props: ChartProps) {
  const {
    staticLegend,
    showLegend,
    maxDataPoints = 500,
    enableDataSampling = true,
    samplingStrategy = "lttb",
    showDataInfo = true,
  } = props; // Lower default for scatter
  const { categories, series, originalLength } = useProcessedData(
    props.data,
    props.series,
    maxDataPoints,
    enableDataSampling,
    samplingStrategy
  );

  const options = {
    ...getOptimizedOptions(props, "scatter", false, originalLength),
    stroke: { width: 0 },
    markers: {
      size: originalLength > maxDataPoints ? 3 : 6,
      hover: { size: originalLength > maxDataPoints ? 5 : 8 },
    },
    xaxis: {
      ...getOptimizedOptions(props, "scatter").xaxis,
      categories: categories,
    },
  };

  return (
    <div className="w-full h-full">
      {showDataInfo && (
        <DataInfo
          originalLength={originalLength}
          processedLength={categories.length}
        />
      )}
      {showLegend && staticLegend && <StaticLegend legend={staticLegend} />}
      <div
        style={{
          height:
            showLegend && staticLegend
              ? "calc(100% - 60px)"
              : "calc(100% - 20px)",
        }}
      >
        <Chart
          options={options}
          series={series}
          type="scatter"
          height="100%"
          width="100%"
        />
      </div>
    </div>
  );
}

export function StackedLineChart(props: ChartProps) {
  const {
    staticLegend,
    showLegend,
    maxDataPoints = 1000,
    enableDataSampling = true,
    samplingStrategy = "lttb",
    showDataInfo = true,
  } = props;
  const { categories, series, originalLength } = useProcessedData(
    props.data,
    props.series,
    maxDataPoints,
    enableDataSampling,
    samplingStrategy
  );

  const options = {
    ...getOptimizedOptions(props, "area", false, originalLength),
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: originalLength > maxDataPoints ? 0.4 : 0.6,
        opacityTo: 0.1,
      },
    },
    stroke: {
      ...getOptimizedOptions(props, "area").stroke,
      width: originalLength > maxDataPoints ? 0.5 : 1,
    },
    xaxis: {
      ...getOptimizedOptions(props, "area").xaxis,
      categories: categories,
    },
  };

  return (
    <div className="w-full h-full">
      {showDataInfo && (
        <DataInfo
          originalLength={originalLength}
          processedLength={categories.length}
        />
      )}
      {showLegend && staticLegend && <StaticLegend legend={staticLegend} />}
      <div
        style={{
          height:
            showLegend && staticLegend
              ? "calc(100% - 60px)"
              : "calc(100% - 20px)",
        }}
      >
        <Chart
          options={options}
          series={series}
          type="area"
          height="100%"
          width="100%"
        />
      </div>
    </div>
  );
}

export function BarChart(props: ChartProps) {
  const {
    staticLegend,
    showLegend,
    maxDataPoints = 500,
    enableDataSampling = true,
    samplingStrategy = "lttb",
    showDataInfo = true,
  } = props; // Lower default for bars
  const { categories, series, originalLength } = useProcessedData(
    props.data,
    props.series,
    maxDataPoints,
    enableDataSampling,
    samplingStrategy
  );

  const options = {
    ...getOptimizedOptions(props, "bar", false, originalLength),
    plotOptions: {
      bar: {
        borderRadius: 2,
        columnWidth: originalLength > maxDataPoints ? "80%" : "60%", // Thinner bars for large datasets
      },
    },
    xaxis: {
      ...getOptimizedOptions(props, "bar").xaxis,
      categories: categories,
      tickPlacement: "on" as const,
    },
    chart: {
      ...getOptimizedOptions(props, "bar").chart,
      zoom: {
        enabled: true,
        type: "x" as const,
        autoScaleYaxis: true,
      },
    },
    grid: {
      ...getOptimizedOptions(props, "bar").grid,
      padding: {
        left: 20,
        right: 20,
      },
    },
  };

  return (
    <div className="w-full h-full">
      {showDataInfo && (
        <DataInfo
          originalLength={originalLength}
          processedLength={categories.length}
        />
      )}
      {showLegend && staticLegend && <StaticLegend legend={staticLegend} />}
      <div
        style={{
          height:
            showLegend && staticLegend
              ? "calc(100% - 60px)"
              : "calc(100% - 20px)",
        }}
      >
        <Chart
          options={options}
          series={series}
          type="bar"
          height="100%"
          width="100%"
        />
      </div>
    </div>
  );
}

// Backward compatibility
export function MultiLineChart(props: ChartProps) {
  return LineChart(props);
}
