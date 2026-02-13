import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  startTransition,
  useCallback,
} from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ChartContainer,
  Line,
  LineChart,
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "@/components/ui/chart";
import type { MetricType } from "@/components/Dashboard/view/parameter-view";
import { Tooltip as RechartsTooltip, Legend as RechartsLegend } from "recharts";
import { useLoggerReportMutation } from "@/hooks/useCharts";
import { Skeleton } from "../ui/skeleton";
import EnlargedChart from "../Enlarger/EnlargedChart";
import { Maximize2 } from "lucide-react";
import { Button } from "../ui/button";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { WidgetConfig } from "@/types/user";

/* -------------------- once-per-module setup -------------------- */
dayjs.extend(utc);
dayjs.extend(timezone);

// cached Intl formatters
const fmtHourMinute = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});
const fmtWeekdayShort = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  timeZone: "UTC",
});
const fmtDayMonth = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const fmtMonthShort = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
});

/* -------------------- in-memory cache (avoid re-fetch) -------------------- */
const chartCache = new Map<string, any[]>();
function makeKey(params: {
  stationId: string;
  attribute: string;
  mode: string;
  from: string;
  to: string;
}) {
  const { stationId, attribute, mode, from, to } = params;
  return `${stationId}|${attribute}|${mode}|${from}|${to}`;
}

/* -------------------- constants -------------------- */
const metricToAttributeMap: Record<MetricType, string> = {
  temperature: "AirTemperature",
  humidity: "Humidity",
  rain: "Rain",
  windSpeed: "WindSpeed",
  windDirection: "WindDirection",
  solarRadiation: "SRAD",
  barometricPressure: "BarometricPressure",
  sradCumulative: "SRADCumulative",
};

const colorConfig = {
  North: "#8884d8",
  "North East": "#ff7eb9",
  East: "#7eb6ff",
  "South East": "#ffa07e",
  South: "#7effb2",
  "South West": "#d884d8",
  West: "#a384ff",
  "North West": "#84d8d8",
};

const axisStyle = {
  fontSize: 14,
  fontFamily: "'Inter', sans-serif",
  color: "#667085",
};

interface ChartSectionProps {
  timeframe: any;
  stationId: string;
  metricType: MetricType;
  WidgetConfigs: WidgetConfig[];
  chartConfig?: {
    parameterID: number;
    attributeName: string;
    chartType: string;
    chartColor: string;
    chartInterval: any;
    id: string;
  };
  parentData?:
    | Array<{ time: string; value: number }>
    | Array<{ direction: string; value: number }>
    | Array<{
        SiteID: number;
        ParameterID: number;
        Parametervalue: number;
        CreatedAt: string;
      }>;
  preferParentData?: boolean;
  parameterID?: number;
}

export default function ChartSection({
  timeframe,
  stationId,
  metricType,
  chartConfig,
  parentData,
  preferParentData = false,
  parameterID,
}: ChartSectionProps) {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const loggerReportMutation = useLoggerReportMutation();
  const chartType = parseInt(chartConfig?.chartType ?? "0", 10);

  const chartColor = chartConfig?.chartColor
    ? `#${chartConfig.chartColor.replace(/^#/, "")}`
    : "#4F46E5";

  /* -------------------- date range (memoized) -------------------- */
  const { fromDateString, toDateString } = useMemo(() => {
    const now = dayjs().tz("Asia/Dubai");
    let from = "";
    let to = "";
    switch (timeframe?.value) {
      case "live": {
        const oneDayAgo = now.subtract(1, "day");
        from = oneDayAgo.format("YYYY-MM-DDTHH:mm:ss.000");
        to = now.format("YYYY-MM-DDTHH:mm:ss.000");
        break;
      }
      case "lastDay": {
        const y = now.subtract(1, "day").format("YYYY-MM-DD");
        from = `${y}T00:00:00.000`;
        to = `${y}T23:59:00.000`;
        break;
      }
      case "lastWeek": {
        const weekAgo = now.subtract(6, "day");
        from = weekAgo.format("YYYY-MM-DDTHH:mm:ss.000");
        to = now.format("YYYY-MM-DDTHH:mm:ss.000");
        break;
      }
      case "lastMonth": {
        const monthAgo = now.subtract(1, "month");
        from = monthAgo.format("YYYY-MM-DDTHH:mm:ss.000");
        to = now.format("YYYY-MM-DDTHH:mm:ss.000");
        break;
      }
      case "lastYear": {
        const yearAgo = now.subtract(1, "year");
        from = yearAgo.format("YYYY-MM-DDTHH:mm:ss.000");
        to = now.format("YYYY-MM-DDTHH:mm:ss.000");
        break;
      }
      default:
        from = "";
        to = "";
    }
    return { fromDateString: from, toDateString: to };
  }, [timeframe?.value]);

  /* -------------------- choose effective attribute -------------------- */
  const effectiveAttribute =
    chartConfig?.attributeName || metricToAttributeMap[metricType];

  /* -------------------- helpers -------------------- */
  const angleToDirection = useCallback((angle: number): string => {
    if (angle >= 337.5 || angle < 22.5) return "North";
    if (angle >= 22.5 && angle < 67.5) return "North East";
    if (angle >= 67.5 && angle < 112.5) return "East";
    if (angle >= 112.5 && angle < 157.5) return "South East";
    if (angle >= 157.5 && angle < 202.5) return "South";
    if (angle >= 202.5 && angle < 247.5) return "South West";
    if (angle >= 247.5 && angle < 292.5) return "West";
    if (angle >= 292.5 && angle < 337.5) return "North West";
    return "Unknown";
  }, []);

  const formatUTCString = useMemo(() => {
    return (tsOrString: number | string) => {
      const date =
        typeof tsOrString === "number"
          ? new Date(tsOrString)
          : new Date(tsOrString);
      switch (timeframe?.value) {
        case "live":
        case "lastDay":
          return fmtHourMinute.format(date);
        case "lastWeek":
          return fmtWeekdayShort.format(date);
        case "lastMonth":
          return fmtDayMonth.format(date);
        case "lastYear":
          return fmtMonthShort.format(date);
        default: {
          const dd = String(date.getUTCDate()).padStart(2, "0");
          const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
          const yyyy = date.getUTCFullYear();
          const hh = String(date.getUTCHours()).padStart(2, "0");
          const min = String(date.getUTCMinutes()).padStart(2, "0");
          return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
        }
      }
    };
  }, [timeframe?.value]);

  const formatFullDateString = useMemo(() => {
    return (tsOrString: number | string) => {
      const d =
        typeof tsOrString === "number"
          ? new Date(tsOrString)
          : new Date(tsOrString);
      const dd = String(d.getUTCDate()).padStart(2, "0");
      const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
      const yyyy = d.getUTCFullYear();
      const hh = String(d.getUTCHours()).padStart(2, "0");
      const min = String(d.getUTCMinutes()).padStart(2, "0");
      return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
    };
  }, []);

  /* -------------------- prefer parent data (no network) -------------------- */
  useEffect(() => {
    if (preferParentData && Array.isArray(parentData)) {
      let normalized: any[] = [];
      if (parentData.length) {
        if ("time" in (parentData[0] as any)) {
          normalized = (
            parentData as Array<{ time: string; value: number }>
          ).map((d) => ({
            ...d,
            ts: new Date(d.time).getTime(),
            value: Number(Number(d.value).toFixed(2)), // Format to 2 decimal places
          }));
        } else if ("CreatedAt" in (parentData[0] as any)) {
          normalized = (parentData as any[]).map((d) => ({
            time: d.CreatedAt,
            ts: new Date(d.CreatedAt).getTime(),
            value: Number.isFinite(Number(d.Parametervalue))
              ? Number(Number(d.Parametervalue).toFixed(2)) // Format to 2 decimal places
              : 0,
          }));
        } else {
          normalized = parentData as any[];
        }
      } else {
        normalized = parentData as any[];
      }
      // filter bad points
      normalized = normalized.filter(
        (d) =>
          d &&
          typeof d.ts === "number" &&
          Number.isFinite(d.ts) &&
          Number.isFinite(Number(d.value))
      );
      startTransition(() => {
        setChartData(normalized);
        setLoading(false);
      });
    }
  }, [preferParentData, parentData]);

  /* -------------------- fetch & parse (single effect, all points) -------------------- */
  const cacheKey = useMemo(
    () =>
      makeKey({
        stationId,
        attribute: effectiveAttribute,
        mode: timeframe?.value ?? "",
        from: fromDateString,
        to: toDateString,
      }),
    [
      stationId,
      effectiveAttribute,
      timeframe?.value,
      fromDateString,
      toDateString,
    ]
  );
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (preferParentData && Array.isArray(parentData)) return;

    if (lastKeyRef.current === cacheKey) return;
    lastKeyRef.current = cacheKey;

    const controller = new AbortController();
    const siteNum = parseInt(stationId, 10);
    if (!effectiveAttribute || Number.isNaN(siteNum) || !timeframe?.value)
      return;

    const run = async () => {
      setLoading(true);

      if (chartCache.has(cacheKey)) {
        const cached = chartCache.get(cacheKey)!;
        startTransition(() => {
          setChartData(cached);
          setLoading(false);
        });
        return;
      }

      try {
        const resp = await loggerReportMutation.mutateAsync(
          {
            siteId: [siteNum],
            mode: timeframe?.value ?? "",
            selectedAttributes: [chartConfig?.parameterID || parameterID],
            fromDateStr: fromDateString,
            toDateStr: toDateString,
          } as any,
          { signal: (controller as any).signal } as any
        );

        // windDirection radar (chartType "0")
        if (
          metricType === "windDirection" &&
          (chartConfig?.chartType ?? "0") === "0"
        ) {
          const directionCountMap: Record<string, number> = {
            North: 0,
            "North East": 0,
            East: 0,
            "South East": 0,
            South: 0,
            "South West": 0,
            West: 0,
            "North West": 0,
          };
          for (let i = 0; i < resp.length; i++) {
            const angle =
              resp[i].Parametervalue !== undefined
                ? Number(resp[i].Parametervalue)
                : Number(resp[i][effectiveAttribute]);
            if (!Number.isNaN(angle) && angle !== 0) {
              const dir = angleToDirection(angle);
              if (directionCountMap[dir] !== undefined)
                directionCountMap[dir]++;
            }
          }
          const compassOrder = [
            "North",
            "North East",
            "East",
            "South East",
            "South",
            "South West",
            "West",
            "North West",
          ];
          const transformed = compassOrder.map((direction) => ({
            direction,
            value: directionCountMap[direction] || 0,
          }));
          chartCache.set(cacheKey, transformed);
          startTransition(() => {
            setChartData(transformed);
            setLoading(false);
          });
          return;
        }

        // default timeseries: KEEP ALL POINTS and sanitize
        const parsed: { time: string; ts: number; value: number }[] = [];
        for (let i = 0; i < resp.length; i++) {
          const row = resp[i];
          const createdAt = row?.CreatedAt || row?.createdAt;
          if (!createdAt) continue;
          const ts = new Date(createdAt).getTime();
          const vRaw =
            row?.Parametervalue !== undefined
              ? row.Parametervalue
              : row?.[effectiveAttribute];
          const valNum = Number(vRaw);
          if (!Number.isFinite(ts) || !Number.isFinite(valNum)) continue; // drop bad points
          parsed.push({
            time: createdAt,
            ts,
            value: Number(valNum.toFixed(2)), // Format to 2 decimal places
          });
        }
        parsed.sort((a, b) => a.ts - b.ts);

        chartCache.set(cacheKey, parsed);
        startTransition(() => {
          setChartData(parsed);
          setLoading(false);
        });
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          console.error("Logger report fetch error:", e);
          startTransition(() => {
            setChartData([]);
            setLoading(false);
          });
        }
      }
    };

    run();
    return () => controller.abort();
  }, [
    cacheKey,
    preferParentData,
    parentData,
    stationId,
    timeframe?.value,
    fromDateString,
    toDateString,
    effectiveAttribute,
    metricType,
    chartConfig?.chartType,
    loggerReportMutation,
  ]);

  /* -------------------- derived memo values -------------------- */
  const isRadar =
    metricType === "windDirection" && (chartConfig?.chartType ?? "0") === "0";

  const numericValues = useMemo(
    () =>
      (chartData as any[])
        .map((d) => (typeof d?.value === "number" ? d.value : Number(d?.value)))
        .filter((v) => Number.isFinite(v)),
    [chartData]
  );

  const maxValue = !isRadar
    ? Math.max(...(numericValues.length ? numericValues : [1]))
    : 0;

  // never let yAxisMax be 0 to avoid flat/hidden bars
  const yAxisMax = !isRadar ? Math.max(1, Math.ceil(maxValue * 1.2)) : 0;

  const dataLen = (chartData as any[]).length;
  const animationsOn = dataLen <= 1000;

  // ⬇⬇ IMPORTANT: reduce chart top margin (legend already reserves height)
  // and allow tooltips to escape containers
  const chartMargins = { top: 8, right: 10, left: 20, bottom: 0 };
  const commonChartProps = { margin: chartMargins, height: 350 };

  // ---- FIX: mutable tuple for domain to satisfy Recharts types ----
  const DOMAIN_ALL: [
    number | "auto" | "dataMin" | "dataMax",
    number | "auto" | "dataMin" | "dataMax"
  ] = ["dataMin", "dataMax"];

  const commonXAxisProps = useMemo(
    () => ({
      dataKey: "ts",
      type: "number" as const,
      domain: DOMAIN_ALL,
      scale: "time" as const,
      tickFormatter: formatUTCString,
      tickCount: 8,
      minTickGap: 10,
      allowDecimals: false,
      height: 50,
      padding: { left: 10, right: 10 },
      tick: {
        fill: axisStyle.color,
        fontSize: axisStyle.fontSize,
        fontFamily: axisStyle.fontFamily,
      },
      interval: "preserveStartEnd" as const,
    }),
    [formatUTCString]
  );

  const commonYAxisProps = useMemo(
    () => ({
      domain: [0, yAxisMax] as [number, number],
      tickCount: 6,
      tick: {
        fill: axisStyle.color,
        textAnchor: "end" as const,
        fontSize: axisStyle.fontSize,
        fontFamily: axisStyle.fontFamily,
      },
      tickLine: false,
      axisLine: false,
      width: 56,
      padding: { top: 12, bottom: 12 },
      orientation: "left" as const,
      allowDecimals: true,
    }),
    [yAxisMax]
  );

  const tooltipStyle = {
    contentStyle: {
      borderRadius: 8,
      border: "1px solid #e5e7eb",
      background: "#fff",
      color: "#222",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      padding: "10px 14px",
      fontSize: "14px",
      direction: "ltr" as const,
      textAlign: "left" as const,
    } as React.CSSProperties,
    itemStyle: {
      color: "#222",
      fontWeight: 500,
      fontSize: "14px",
      direction: "ltr" as const,
    } as React.CSSProperties,
    // let tooltip escape chart bounds
    wrapperStyle: {
      pointerEvents: "auto" as React.CSSProperties["pointerEvents"],
      overflow: "visible",
    } as React.CSSProperties,
  };

  // Legend (single-source series label)
  const legendLabel = chartConfig?.attributeName || effectiveAttribute;

  // ⬇⬇ Small top margin for the legend; tighter overall spacing
  const LegendBlock = (
    <RechartsLegend
      verticalAlign="top"
      align="center"
      iconSize={10}
      wrapperStyle={{
        fontSize: 13,
        fontFamily: "Inter, sans-serif",
        marginTop: 4, // tiny breathing space from the very top
        lineHeight: "16px",
      }}
    />
  );

  /* -------------------- render charts -------------------- */
  const renderChart = () => {
    if (!chartType || chartType === 0) {
      switch (metricType) {
        case "temperature":
          return (
            <ChartContainer className="w-full h-full overflow-visible">
              <AreaChart data={chartData as any} {...commonChartProps}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#74A3FD" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#74A3FD" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis {...commonXAxisProps} />
                <YAxis {...commonYAxisProps} />
                <Area
                  name={legendLabel}
                  type="monotone"
                  dataKey="value"
                  stroke="#74A3FD"
                  fillOpacity={1}
                  fill="url(#colorValue)"
                  connectNulls={false}
                  isAnimationActive={animationsOn}
                  dot={false}
                />
                <RechartsTooltip
                  formatter={(v: any) =>
                    v != null
                      ? [`${Number(v).toFixed(2)}`, "Value"]
                      : ["No data", ""]
                  }
                  cursor={{ stroke: "#e5e7eb" }}
                  labelFormatter={formatFullDateString}
                  {...tooltipStyle}
                />
                {LegendBlock}
              </AreaChart>
            </ChartContainer>
          );

        case "humidity":
          return (
            <ChartContainer className="w-full h-full overflow-visible">
              <LineChart data={chartData as any} {...commonChartProps}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis {...commonXAxisProps} />
                <YAxis {...commonYAxisProps} tickFormatter={(v) => `${v}%`} />
                <Line
                  name={legendLabel}
                  type="monotone"
                  dataKey="value"
                  stroke="#eab308"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={animationsOn}
                  connectNulls={false}
                />
                <RechartsTooltip
                  formatter={(v: any) =>
                    v != null
                      ? [`${Number(v).toFixed(2)}%`, "Humidity"]
                      : ["No data", ""]
                  }
                  cursor={{ stroke: "#e5e7eb" }}
                  labelFormatter={formatFullDateString}
                  {...tooltipStyle}
                />
                {LegendBlock}
              </LineChart>
            </ChartContainer>
          );

        case "rain":
          return (
            <ChartContainer className="w-full h-full overflow-visible">
              <BarChart
                data={chartData as any}
                {...commonChartProps}
                barCategoryGap="2%"
                maxBarSize={3}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis {...commonXAxisProps} />
                <YAxis {...commonYAxisProps} />
                <Bar
                  name={legendLabel}
                  dataKey="value"
                  fill="#6271B9"
                  radius={[2, 2, 0, 0]}
                  barSize={4}
                  isAnimationActive={false}
                />
                <RechartsTooltip
                  formatter={(v: any) =>
                    v != null
                      ? [`${Number(v).toFixed(2)}`, "Rain"]
                      : ["No data", ""]
                  }
                  cursor={{ fill: "rgba(0,0,0,0.03)" }}
                  labelFormatter={formatFullDateString}
                  {...tooltipStyle}
                />
                {LegendBlock}
              </BarChart>
            </ChartContainer>
          );

        case "windSpeed":
          return (
            <ChartContainer className="w-full h-full overflow-visible">
              <LineChart data={chartData as any} {...commonChartProps}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis {...commonXAxisProps} />
                <YAxis {...commonYAxisProps} />
                <Line
                  name={legendLabel}
                  dataKey="value"
                  stroke="#4693F1"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={animationsOn}
                />
                <RechartsTooltip
                  formatter={(v: any) =>
                    v != null
                      ? [`${Number(v).toFixed(2)}`, "Wind Speed"]
                      : ["No data", ""]
                  }
                  cursor={{ stroke: "#e5e7eb" }}
                  labelFormatter={formatFullDateString}
                  {...tooltipStyle}
                />
                {LegendBlock}
              </LineChart>
            </ChartContainer>
          );

        case "windDirection": {
          const directionCountMap = {
            North: 0,
            "North East": 0,
            East: 0,
            "South East": 0,
            South: 0,
            "South West": 0,
            West: 0,
            "North West": 0,
          } as Record<string, number>;
          (chartData as any[]).forEach((entry) => {
            if (Number(entry.value) !== 0) {
              const dir = angleToDirection(Number(entry.value));
              if (directionCountMap[dir] != null) directionCountMap[dir]++;
            }
          });
          const compassOrder = [
            "North",
            "North East",
            "East",
            "South East",
            "South",
            "South West",
            "West",
            "North West",
          ];
          const radarChartData = compassOrder.map((direction) => ({
            direction,
            value: directionCountMap[direction] || 0,
            color: (colorConfig as any)[direction],
          }));
          return (
            <ChartContainer className="flex flex-col overflow-visible">
              <RadarChart
                cx="30%"
                cy="50%"
                outerRadius="80%"
                data={radarChartData}
                margin={{ top: 8, right: 40, bottom: 10, left: 30 }}
              >
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis
                  dataKey="direction"
                  tick={{ fill: "#6b7280", fontSize: 12, textAnchor: "middle" }}
                />
                <RechartsTooltip
                  formatter={(_, __, props) => {
                    const p: any = props?.payload || {};
                    return [`${p.direction}: ${p.value}`];
                  }}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    color: "#222",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    direction: "ltr",
                    textAlign: "left",
                  }}
                  itemStyle={{ color: "#222", fontWeight: 500 }}
                  wrapperStyle={{ pointerEvents: "auto", overflow: "visible" }}
                />
                <Radar
                  name="Wind Direction"
                  dataKey="value"
                  stroke="#4F46E5"
                  fill="#6366F1"
                  fillOpacity={0.4}
                />
                <RechartsLegend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="circle"
                  payload={Object.entries(colorConfig).map(([dir, color]) => ({
                    value: dir,
                    type: "circle",
                    id: dir,
                    color,
                  }))}
                  wrapperStyle={{
                    paddingLeft: "50px",
                    fontSize: "14px",
                    direction: "ltr",
                    marginTop: 4,
                  }}
                />
              </RadarChart>
            </ChartContainer>
          );
        }

        case "solarRadiation":
          return (
            <ChartContainer className="w-full h-full overflow-visible">
              <BarChart
                data={chartData as any}
                {...commonChartProps}
                barCategoryGap="2%"
                maxBarSize={3}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  opacity={0.2}
                />
                <XAxis {...commonXAxisProps} />
                <YAxis {...commonYAxisProps} unit="W/m²" />
                <Bar
                  name={legendLabel}
                  dataKey="value"
                  fill="#ff9d9d"
                  radius={[2, 2, 0, 0]}
                  barSize={4}
                  isAnimationActive={false}
                />
                <RechartsTooltip
                  formatter={(v: any) =>
                    v != null
                      ? [`${Number(v).toFixed(2)} W/m²`, "Solar Radiation"]
                      : ["No data", ""]
                  }
                  cursor={{ fill: "rgba(0,0,0,0.03)" }}
                  labelFormatter={formatFullDateString}
                  {...tooltipStyle}
                />
                {LegendBlock}
              </BarChart>
            </ChartContainer>
          );

        case "barometricPressure":
          return (
            <ChartContainer className="w-full h-full overflow-visible">
              <LineChart data={chartData as any} {...commonChartProps}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis {...commonXAxisProps} />
                <YAxis {...commonYAxisProps} domain={[1010, 1014]} />
                <ReferenceLine y={1013} stroke="red" strokeDasharray="3 3" />
                <Line
                  name={legendLabel}
                  type="monotone"
                  dataKey="value"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={animationsOn}
                  connectNulls={false}
                />
                <RechartsTooltip
                  formatter={(v: any) =>
                    v != null
                      ? [`${Number(v).toFixed(2)} hPa`, "Barometric Pressure"]
                      : ["No data", ""]
                  }
                  cursor={{ stroke: "#e5e7eb" }}
                  labelFormatter={formatFullDateString}
                  {...tooltipStyle}
                />
                {LegendBlock}
              </LineChart>
            </ChartContainer>
          );

        case "sradCumulative":
          return (
            <ChartContainer className="w-full h-full overflow-visible">
              <AreaChart data={chartData as any} {...commonChartProps}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis {...commonXAxisProps} />
                <YAxis {...commonYAxisProps} />
                <Area
                  name={legendLabel}
                  type="monotone"
                  dataKey="value"
                  stroke="#8b5cf6"
                  fillOpacity={1}
                  fill="url(#colorValue)"
                  connectNulls={false}
                  isAnimationActive={animationsOn}
                  dot={false}
                />
                <RechartsTooltip
                  formatter={(v: any) =>
                    v != null
                      ? [
                          `${Number(v).toFixed(2)} MJ/m²`,
                          "Cumulative Solar Radiation",
                        ]
                      : ["No data", ""]
                  }
                  cursor={{ stroke: "#e5e7eb" }}
                  labelFormatter={formatFullDateString}
                  {...tooltipStyle}
                />
                {LegendBlock}
              </AreaChart>
            </ChartContainer>
          );

        default:
          return (
            <ChartContainer className="w-full h-full overflow-visible">
              <LineChart data={chartData as any} {...commonChartProps}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis {...commonXAxisProps} />
                <YAxis {...commonYAxisProps} />
                <Line
                  name={legendLabel}
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={animationsOn}
                  connectNulls={false}
                />
                <RechartsTooltip
                  formatter={(v: any) =>
                    v != null
                      ? [`${Number(v).toFixed(2)}`, "Value"]
                      : ["No data", ""]
                  }
                  cursor={{ stroke: "#e5e7eb" }}
                  labelFormatter={formatFullDateString}
                  {...tooltipStyle}
                />
                {LegendBlock}
              </LineChart>
            </ChartContainer>
          );
      }
    } else {
      // Custom chart type overrides (1: step line, 2: dots, 3: area, 4: bars)
      switch (chartType) {
        case 1:
          return (
            <ChartContainer className="w-full h-full overflow-visible">
              <LineChart data={chartData as any} {...commonChartProps}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis {...commonXAxisProps} />
                <YAxis {...commonYAxisProps} />
                <Line
                  name={legendLabel}
                  type="step"
                  dataKey="value"
                  stroke={chartColor}
                  dot={false}
                  connectNulls={false}
                  isAnimationActive={animationsOn}
                />
                <RechartsTooltip
                  formatter={(v: any) =>
                    v != null
                      ? [`${Number(v).toFixed(2)}`, "Value"]
                      : ["No data", ""]
                  }
                  cursor={{ stroke: "#e5e7eb" }}
                  labelFormatter={formatFullDateString}
                  {...tooltipStyle}
                />
                {LegendBlock}
              </LineChart>
            </ChartContainer>
          );
        case 2:
          return (
            <ChartContainer className="w-full h-full overflow-visible">
              <LineChart data={chartData as any} {...commonChartProps}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis {...commonXAxisProps} />
                <YAxis {...commonYAxisProps} />
                <Line
                  name={legendLabel}
                  dataKey="value"
                  stroke={chartColor}
                  strokeWidth={1.5}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                  connectNulls={false}
                  isAnimationActive={animationsOn}
                />
                <RechartsTooltip
                  formatter={(v: any) =>
                    v != null
                      ? [`${Number(v).toFixed(2)}`, "Value"]
                      : ["No data", ""]
                  }
                  cursor={{ stroke: "#e5e7eb" }}
                  labelFormatter={formatFullDateString}
                  {...tooltipStyle}
                />
                {LegendBlock}
              </LineChart>
            </ChartContainer>
          );
        case 3:
          return (
            <ChartContainer className="w-full h-full overflow-visible">
              <AreaChart data={chartData as any} {...commonChartProps}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={chartColor}
                      stopOpacity={0.6}
                    />
                    <stop
                      offset="95%"
                      stopColor={chartColor}
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis {...commonXAxisProps} />
                <YAxis {...commonYAxisProps} />
                <Area
                  name={legendLabel}
                  type="monotone"
                  dataKey="value"
                  stroke={chartColor}
                  fill="url(#colorValue)"
                  connectNulls={false}
                  isAnimationActive={animationsOn}
                  dot={false}
                />
                <RechartsTooltip
                  formatter={(v: any) =>
                    v != null
                      ? [`${Number(v).toFixed(2)}`, "Value"]
                      : ["No data", ""]
                  }
                  cursor={{ stroke: "#e5e7eb" }}
                  labelFormatter={formatFullDateString}
                  {...tooltipStyle}
                />
                {LegendBlock}
              </AreaChart>
            </ChartContainer>
          );
        case 4:
          return (
            <ChartContainer className="w-full h-full overflow-visible">
              <BarChart
                data={chartData as any}
                {...commonChartProps}
                barCategoryGap="2%"
                maxBarSize={3}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis {...commonXAxisProps} />
                <YAxis {...commonYAxisProps} />
                <Bar
                  name={legendLabel}
                  dataKey="value"
                  fill={chartColor}
                  radius={[2, 2, 0, 0]}
                  barSize={4}
                  isAnimationActive={false}
                />
                <RechartsTooltip
                  formatter={(v: any) =>
                    v != null
                      ? [`${Number(v).toFixed(2)}`, "Value"]
                      : ["No data", ""]
                  }
                  cursor={{ fill: "rgba(0,0,0,0.03)" }}
                  labelFormatter={formatFullDateString}
                  {...tooltipStyle}
                />
                {LegendBlock}
              </BarChart>
            </ChartContainer>
          );
        default:
          return <div>Unsupported chart type.</div>;
      }
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Skeleton className="h-full w-full rounded-md" />
      </div>
    );
  }

  const noData =
    !chartData || (Array.isArray(chartData) && chartData.length === 0);

  return (
    <Card className="h-full w-full p-2 flex flex-col gap-0 overflow-visible relative">
      <Button
        onClick={() => setIsOpen(true)}
        className="text-gray-500 hover:text-black bg-transparent absolute top-2 right-2 z-10"
        variant="ghost"
        size="icon"
      >
        <Maximize2 className="w-4 h-4" />
      </Button>
      <CardContent className="p-0 h-full w-full flex flex-grow justify-center items-center overflow-visible">
        <div className="h-full w-full flex justify-center items-center overflow-visible">
          {noData ? (
            <div className="text-sm text-muted-foreground">No data</div>
          ) : (
            renderChart()
          )}
        </div>
      </CardContent>
      <EnlargedChart
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        data={chartData}
        color={chartColor}
        xaxisprops={commonXAxisProps as any}
        title={stationId}
        attributeName={effectiveAttribute}
      />
    </Card>
  );
}
