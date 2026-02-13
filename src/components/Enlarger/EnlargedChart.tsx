// EnlargedChart.tsx - Optimized for huge data (auto LTTB decimation + numeric axis)
// Keeps your public API & UI; ensures every point has `time` to satisfy DP.
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  LineChart,
  StepLineChart,
  DotChart,
  StackedLineChart,
  BarChart,
} from "@/components/Enlarger/charts";
import { Plus, Minus, ChevronDown, X, Settings } from "lucide-react";
import { useTranslations } from "@/hooks/useTranslations";
import { useLocale } from "next-intl";

/* -------------------- types -------------------- */
interface DP {
  time: string; // REQUIRED by your charts; we’ll ensure it
  fullTime?: string;
  value: number;
  ts?: number; // numeric timestamp for fast axes
}

interface Series {
  siteName: string;
  data: DP[];
}

interface LegendItem {
  label: string;
  color: string;
}

interface EnlargedChartProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  xaxisprops?: any;
  data?: DP[];
  color?: string;
  multiSeries?: Series[];
  locale?: string;
  stationName?: string;
  attributeName?: string;
  metricType?: string;
  label?: string;
  staticLegend?: LegendItem[];
}

type ChartType = "line" | "stepLine" | "dots" | "stackedLines" | "bars";

/* -------------------- RTL helpers -------------------- */
const RTL_LANGUAGES = [
  "ar",
  "he",
  "fa",
  "ur",
  "ps",
  "sd",
  "ku",
  "dv",
  "yi",
  "ji",
  "iw",
  "fa-af",
];
const isRTLLanguage = (lang: string): boolean => {
  if (!lang) return false;
  const code = lang.toLowerCase();
  const base = code.split("-")[0];
  return RTL_LANGUAGES.includes(base) || RTL_LANGUAGES.includes(code);
};

/* -------------------- color helpers -------------------- */
const generateChartColors = (count: number): string[] =>
  Array.from({ length: count }, (_, i) => `hsl(${(i * 67) % 360}, 70%, 50%)`);

/* -------------------- decimation constants -------------------- */
const DECIMATE_THRESHOLD = 3000; // start optimizing above this
const DEFAULT_MAX_POINTS = 2000; // target points post-decimation

/* -------------------- LTTB decimation (main-thread fallback) -------------------- */
function lttb<T extends { ts: number; value: number }>(
  data: T[],
  threshold: number
): T[] {
  const n = data.length;
  if (threshold >= n || threshold <= 0) return data.slice();

  const sampled: T[] = [];
  let sampledIndex = 0;

  const every = (n - 2) / (threshold - 2);

  let a = 0;
  let nextA = 0;

  sampled[sampledIndex++] = data[a];

  for (let i = 0; i < threshold - 2; i++) {
    const avgRangeStart = Math.floor((i + 1) * every) + 1;
    const avgRangeEnd = Math.floor((i + 2) * every) + 1;
    const avgRangeEndClamped = Math.min(avgRangeEnd, n);

    let avgTs = 0;
    let avgY = 0;
    const avgRangeLength = avgRangeEndClamped - avgRangeStart;
    for (let j = avgRangeStart; j < avgRangeEndClamped; j++) {
      avgTs += (data[j] as any).ts;
      avgY += (data[j] as any).value;
    }
    avgTs /= Math.max(avgRangeLength, 1);
    avgY /= Math.max(avgRangeLength, 1);

    const rangeOffs = Math.floor(i * every) + 1;
    const rangeTo = Math.floor((i + 1) * every) + 1;

    const pointRangeStart = rangeOffs;
    const pointRangeEnd = Math.min(rangeTo, n);

    let maxArea = -1;
    let maxAreaIndex = pointRangeStart;

    for (let j = pointRangeStart; j < pointRangeEnd; j++) {
      const area =
        Math.abs(
          ((data[a] as any).ts - avgTs) *
            ((data[j] as any).value - (data[a] as any).value) -
            ((data[a] as any).ts - (data[j] as any).ts) *
              (avgY - (data[a] as any).value)
        ) * 0.5;
      if (area > maxArea) {
        maxArea = area;
        maxAreaIndex = j;
      }
    }

    sampled[sampledIndex++] = data[maxAreaIndex];
    nextA = maxAreaIndex;
    a = nextA;
  }

  sampled[sampledIndex++] = data[n - 1];
  return sampled;
}

/* -------------------- Web Worker setup (off-main decimation) -------------------- */
const workerCode = `
self.onmessage = function(e) {
  try {
    const { type, payload } = e.data;
    function lttb(data, threshold) {
      const n = data.length;
      if (threshold >= n || threshold <= 0) return data.slice();
      const sampled = [];
      let sampledIndex = 0;
      const every = (n - 2) / (threshold - 2);
      let a = 0;
      let nextA = 0;
      sampled[sampledIndex++] = data[a];
      for (let i = 0; i < threshold - 2; i++) {
        const avgRangeStart = Math.floor((i + 1) * every) + 1;
        const avgRangeEnd = Math.floor((i + 2) * every) + 1;
        const avgRangeEndClamped = Math.min(avgRangeEnd, n);
        let avgTs = 0; let avgY = 0;
        const avgRangeLength = avgRangeEndClamped - avgRangeStart;
        for (let j = avgRangeStart; j < avgRangeEndClamped; j++) {
          avgTs += data[j].ts;
          avgY += data[j].value;
        }
        avgTs /= Math.max(avgRangeLength, 1);
        avgY /= Math.max(avgRangeLength, 1);
        const rangeOffs = Math.floor(i * every) + 1;
        const rangeTo = Math.floor((i + 1) * every) + 1;
        const pointRangeStart = rangeOffs;
        const pointRangeEnd = Math.min(rangeTo, n);
        let maxArea = -1;
        let maxAreaIndex = pointRangeStart;
        for (let j = pointRangeStart; j < pointRangeEnd; j++) {
          const area = Math.abs(
            (data[a].ts - avgTs) * (data[j].value - data[a].value) -
            (data[a].ts - data[j].ts) * (avgY - data[a].value)
          ) * 0.5;
          if (area > maxArea) {
            maxArea = area;
            maxAreaIndex = j;
          }
        }
        sampled[sampledIndex++] = data[maxAreaIndex];
        nextA = maxAreaIndex;
        a = nextA;
      }
      sampled[sampledIndex++] = data[n - 1];
      return sampled;
    }
    if (type === 'single') {
      const { series, threshold } = payload;
      const out = lttb(series, threshold);
      self.postMessage({ ok: true, type: 'single', data: out });
    } else if (type === 'multi') {
      const { multi, threshold } = payload;
      const out = multi.map(s => ({
        siteName: s.siteName,
        data: lttb(s.data, threshold)
      }));
      self.postMessage({ ok: true, type: 'multi', data: out });
    }
  } catch (err) {
    self.postMessage({ ok: false, error: String(err) });
  }
};
`;

function createWorker(): Worker | null {
  try {
    const blob = new Blob([workerCode], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    return new Worker(url);
  } catch {
    return null;
  }
}

/* -------------------- helpers to satisfy DP -------------------- */
const ensureTimeOnPoints = (arr: any[]): DP[] =>
  arr.map((p) => ({
    ...p,
    // if `time` missing, rebuild from `ts`
    time: p.time ?? new Date(p.ts).toISOString(),
  }));

const ensureTimeOnSeries = (multi: any[]): Series[] =>
  multi.map((s) => ({
    siteName: s.siteName,
    data: ensureTimeOnPoints(s.data),
  }));

/* -------------------- component -------------------- */
export default function EnlargedChart({
  isOpen,
  onClose,
  title,
  data,
  color,
  multiSeries,
  xaxisprops,
  locale,
  stationName,
  attributeName,
  metricType,
  staticLegend,
  label,
}: EnlargedChartProps) {
  const t = useTranslations();
  const currentLocale = useLocale();
  const isRTL = isRTLLanguage(locale || currentLocale);

  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [chartType, setChartType] = useState<ChartType>("line");

  // performance toggles (defaults)
  const [showMarker, setShowMarker] = useState(false);
  const [showDashes, setShowDashes] = useState(false);
  const [showTrackball, setShowTrackball] = useState(false);
  const [showDateTooltip, setShowDateTooltip] = useState(true);
  const [showValueTooltip, setShowValueTooltip] = useState(true);
  const [showLimits, setShowLimits] = useState(true);
  const [showAnimation, setShowAnimation] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(color);

  // huge-data optimization toggles
  const [autoOptimize, setAutoOptimize] = useState(true);
  const [maxPoints, setMaxPoints] = useState(DEFAULT_MAX_POINTS);

  const [isMobile, setIsMobile] = useState(false);

  // processed data fed to charts
  const [renderData, setRenderData] = useState<DP[] | undefined>(undefined);
  const [renderMulti, setRenderMulti] = useState<Series[] | undefined>(
    undefined
  );
  const [usingDecimation, setUsingDecimation] = useState(false);

  // worker
  const workerRef = useRef<Worker | null>(null);

  // Map numeric station id in title to friendly name in RTL/LTR.
  const siteData = [
    { id: "1", title: "ATP Site", titleAr: "موقع ATP" },
    { id: "2", title: "Aynu ul ghamur Site", titleAr: "موقع عين الغمور" },
    { id: "3", title: "Al Fqait", titleAr: "الفقيط" },
    { id: "4", title: "Al Wurayah", titleAr: "الوريعة" },
    { id: "5", title: "Al Qrayah Mountains", titleAr: "جبال القرية" },
    { id: "6", title: "Difayyin Site", titleAr: "موقع الدفين" },
    { id: "7", title: "Hail Mountain Site", titleAr: "موقع جبل حائل" },
    { id: "8", title: "Huwairah", titleAr: "الحويرة" },
    { id: "9", title: "Masafi", titleAr: "مسافي" },
    { id: "10", title: "Mohammed Bin Zayed", titleAr: "محمد بن زايد" },
  ];
  const site = siteData.find((s) => s.id === (title ?? ""));
  if (site) {
    title = isRTL ? site.titleAr : site.title;
  }

  // legend items
  const legendItems: LegendItem[] = useMemo(() => {
    if (staticLegend && staticLegend.length > 0) return staticLegend;
    if (multiSeries && multiSeries.length > 0) {
      const chartColors = generateChartColors(multiSeries.length);
      return multiSeries.map((s, idx) => ({
        label: s.siteName || `Series ${idx + 1}`,
        color: chartColors[idx],
      }));
    }
    if (data && data.length > 0) {
      return [
        { label: label || attributeName || "Data", color: color || "#4693f1" },
      ];
    }
    return [];
  }, [staticLegend, multiSeries, data, label, attributeName, color]);

  // screen size
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // reset defaults on open
  useEffect(() => {
    if (isOpen) {
      setChartType("line");
      setShowMarker(false);
      setShowDashes(false);
      setShowTrackball(false);
      setShowDateTooltip(true);
      setShowValueTooltip(true);
      setShowLimits(true);
      setShowAnimation(true);
      setShowLegend(true);
      setSelectedColor(color);
      setAutoOptimize(true);
      setMaxPoints(DEFAULT_MAX_POINTS);
      setUsingDecimation(false);
      if (isMobile) setIsOptionsOpen(false);
      else setIsOptionsOpen(true);
    }
  }, [isOpen, color, isMobile]);

  /* ---------- normalize to add numeric timestamp (ts) ---------- */
  const normalizedSingle: DP[] | undefined = useMemo(() => {
    if (!data) return undefined;
    return data
      .map((d) => ({
        ...d,
        ts: d.ts ?? new Date(d.time).getTime(),
      }))
      .sort((a, b) => a.ts! - b.ts!);
  }, [data]);

  const normalizedMulti: Series[] | undefined = useMemo(() => {
    if (!multiSeries) return undefined;
    return multiSeries.map((s) => ({
      siteName: s.siteName,
      data: s.data
        .map((d) => ({
          ...d,
          ts: d.ts ?? new Date(d.time).getTime(),
        }))
        .sort((a, b) => a.ts! - b.ts!),
    }));
  }, [multiSeries]);

  /* ---------- auto-decimate huge datasets off-main thread ---------- */
  useEffect(() => {
    if (!isOpen) return;

    const maybeDecimateSingle = async (series: DP[]) => {
      if (!autoOptimize || series.length <= DECIMATE_THRESHOLD) {
        setRenderData(series);
        setUsingDecimation(false);
        return;
      }

      if (!workerRef.current) workerRef.current = createWorker();
      const worker = workerRef.current;

      if (!worker) {
        // main-thread fallback
        const out = lttb(series as any, maxPoints);
        // ensure `time` exists
        const withTime = ensureTimeOnPoints(out);
        setRenderData(withTime);
        setUsingDecimation(true);
        return;
      }

      const handleMessage = (e: MessageEvent<any>) => {
        const payload = e.data || {};
        if (payload.ok && payload.type === "single") {
          // worker out may miss `time`; fix it
          const withTime = ensureTimeOnPoints(payload.data as any[]);
          setRenderData(withTime);
          setUsingDecimation(true);
        } else {
          setRenderData(series);
          setUsingDecimation(false);
        }
        worker.removeEventListener("message", handleMessage);
      };

      worker.addEventListener("message", handleMessage);
      worker.postMessage({
        type: "single",
        payload: { series, threshold: maxPoints },
      });
    };

    const maybeDecimateMulti = async (multi: Series[]) => {
      const biggest = Math.max(...multi.map((s) => s.data.length));
      if (!autoOptimize || biggest <= DECIMATE_THRESHOLD) {
        setRenderMulti(multi);
        setUsingDecimation(false);
        return;
      }

      if (!workerRef.current) workerRef.current = createWorker();
      const worker = workerRef.current;

      if (!worker) {
        const out = multi.map((s) => ({
          siteName: s.siteName,
          data: lttb(s.data as any, maxPoints),
        }));
        const withTime = ensureTimeOnSeries(out as any[]);
        setRenderMulti(withTime);
        setUsingDecimation(true);
        return;
      }

      const handleMessage = (e: MessageEvent<any>) => {
        const payload = e.data || {};
        if (payload.ok && payload.type === "multi") {
          const withTime = ensureTimeOnSeries(payload.data as any[]);
          setRenderMulti(withTime);
          setUsingDecimation(true);
        } else {
          setRenderMulti(multi);
          setUsingDecimation(false);
        }
        worker.removeEventListener("message", handleMessage);
      };

      worker.addEventListener("message", handleMessage);
      worker.postMessage({
        type: "multi",
        payload: { multi, threshold: maxPoints },
      });
    };

    if (normalizedMulti && normalizedMulti.length > 0) {
      setRenderData(undefined);
      maybeDecimateMulti(normalizedMulti);
    } else if (normalizedSingle) {
      setRenderMulti(undefined);
      maybeDecimateSingle(normalizedSingle);
    } else {
      setRenderData(undefined);
      setRenderMulti(undefined);
      setUsingDecimation(false);
    }
    // Keep worker alive across toggles to avoid re-init cost
  }, [isOpen, normalizedSingle, normalizedMulti, autoOptimize, maxPoints]);

  /* ---------- dynamic axis props (numeric ts for speed & ticks) ---------- */
  const DOMAIN_ALL: [
    number | "auto" | "dataMin" | "dataMax",
    number | "auto" | "dataMin" | "dataMax"
  ] = ["dataMin", "dataMax"];

  const xaxispropsOptimized = useMemo(() => {
    return {
      ...(xaxisprops || {}),
      dataKey: "ts",
      type: "number" as const,
      domain: DOMAIN_ALL,
      scale: "time" as const,
      tickCount: Math.max(
        6,
        Math.min(12, Math.floor((window?.innerWidth || 1200) / 120))
      ),
      minTickGap: 8,
      allowDecimals: false,
      interval: "preserveStartEnd" as const,
    };
  }, [xaxisprops]);

  /* ---------- chart type choices ---------- */
  // const chartTypes: { key: ChartType; label: string; shortLabel: string }[] = [
  //   {
  //     key: "line",
  //     label: t("chartTypes.line"),
  //     shortLabel: t("chartTypes.lineShort"),
  //   },
  //   {
  //     key: "stepLine",
  //     label: t("chartTypes.stepLine"),
  //     shortLabel: t("chartTypes.stepLineShort"),
  //   },
  //   {
  //     key: "dots",
  //     label: t("chartTypes.dots"),
  //     shortLabel: t("chartTypes.dotsShort"),
  //   },
  //   {
  //     key: "stackedLines",
  //     label: t("chartTypes.stackedLines"),
  //     shortLabel: t("chartTypes.stackedLinesShort"),
  //   },
  //   {
  //     key: "bars",
  //     label: t("chartTypes.bars"),
  //     shortLabel: t("chartTypes.barsShort"),
  //   },
  // ];

  /* ---------- render chart (pass optimized data + props) ---------- */
  const bigN = renderMulti?.[0]?.data?.length ?? renderData?.length ?? 0;
  const animationsOn = bigN <= 1500; // disable animation for huge sets
  const markersOn = showMarker && bigN <= 3000; // markers only for moderate sets

  const chartProps = useMemo(() => {
    return {
      data: renderData || [],
      series: renderMulti,
      label: title,
      color: selectedColor,
      showMarker: markersOn,
      showDashes,
      showTrackball,
      showDateTooltip,
      showValueTooltip,
      showLimits,
      showAnimation: animationsOn && showAnimation,
      showLegend,
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
      xaxisprops: xaxispropsOptimized,
      stationName,
      attributeName,
      metricType,
      staticLegend: legendItems,
    };
  }, [
    renderData,
    renderMulti,
    title,
    selectedColor,
    markersOn,
    showDashes,
    showTrackball,
    showDateTooltip,
    showValueTooltip,
    showLimits,
    animationsOn,
    showAnimation,
    showLegend,
    xaxispropsOptimized,
    stationName,
    attributeName,
    metricType,
    legendItems,
  ]);

  const renderChart = () => {
    switch (chartType) {
      case "stepLine":
        return <StepLineChart {...chartProps} />;
      case "dots":
        return <DotChart {...chartProps} />;
      case "stackedLines":
        return <StackedLineChart {...chartProps} />;
      case "bars":
        return <BarChart {...chartProps} />;
      default:
        return <LineChart {...chartProps} />;
    }
  };

  /* ---------- options panel ---------- */
  const renderOptionsPanel = () => (
    <div
      className={`p-2 sm:p-3 overflow-y-auto ${
        isMobile ? "h-[calc(100%-6rem)]" : "h-[calc(100%-3rem)]"
      }`}
    >
      <div className="space-y-3 sm:space-y-4">
        {/* Performance block */}
        <div
          className={`flex justify-between items-center gap-2 ${
            isRTL && !isMobile ? "flex-row-reverse" : ""
          }`}
        >
          <div className="flex flex-col">
            <Label className="text-xs text-gray-700">
              {t("options.optimizeLarge") || "Optimize large datasets"}
            </Label>
            <span className="text-[11px] text-gray-500">
              {usingDecimation
                ? t("options.optimizationOn") || "Decimation active"
                : t("options.optimizationOff") || "Showing all points"}
            </span>
          </div>
          <Switch
            checked={autoOptimize}
            onCheckedChange={setAutoOptimize}
            className="data-[state=checked]:bg-blue3 data-[state=unchecked]:bg-gray-400"
          />
        </div>

        {/* Max points control (only matters when Optimize is ON) */}
        <div
          className={`flex items-center justify-between gap-2 ${
            isRTL && !isMobile ? "flex-row-reverse" : ""
          }`}
        >
          <Label className="text-xs text-gray-500">
            {t("options.maxPoints") || "Max points (optimized)"}
          </Label>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setMaxPoints((m) => Math.max(500, m - 500))}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-xs w-12 text-center tabular-nums">
              {maxPoints}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setMaxPoints((m) => Math.min(20000, m + 500))}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Separator />

        {(
          [
            [t("options.marker"), showMarker, setShowMarker],
            [t("options.dashes"), showDashes, setShowDashes],
            [t("options.dateTooltip"), showDateTooltip, setShowDateTooltip],
            [t("options.animation"), showAnimation, setShowAnimation],
            [t("options.legend"), showLegend, setShowLegend],
          ] as [
            string,
            boolean,
            React.Dispatch<React.SetStateAction<boolean>>
          ][]
        ).map(([label, value, setter], idx) => (
          <div
            key={idx}
            className={`flex justify-between items-center gap-2 ${
              isRTL && !isMobile ? "flex-row-reverse" : ""
            }`}
          >
            <Label className="text-xs text-gray-500 flex-1 cursor-pointer">
              {label}
            </Label>
            <Switch
              checked={value}
              onCheckedChange={setter}
              className="data-[state=checked]:bg-blue3 data-[state=unchecked]:bg-gray-400 ring-offset-background focus-visible:ring-2 focus-visible:ring-blue3 flex-shrink-0"
            />
          </div>
        ))}

        <Separator />
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="w-full max-w-none bg-white p-0 overflow-hidden h-[100vh] sm:h-[95vh] sm:min-w-[95vw] sm:max-w-[95vw]"
        style={{
          minWidth: isMobile ? "100vw" : "95vw",
          maxWidth: isMobile ? "100vw" : "95vw",
          direction: isRTL ? "rtl" : "ltr",
        }}
      >
        <div className="flex flex-col h-full">
          <DialogHeader className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 border-b flex flex-row justify-between items-center min-h-[3rem] sm:min-h-[4rem]">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <DialogTitle
                className={`text-sm sm:text-base lg:text-lg font-semibold truncate ${
                  isRTL ? "mr-5" : ""
                }`}
              >
                {title}
              </DialogTitle>

              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={onClose}
                  aria-label={t("closeChart")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div
              className={`flex items-center justify-center flex-shrink-0 ${
                isMobile ? "mx-2" : "mx-4 lg:mx-8"
              }`}
            >
              <div className="flex border rounded-lg overflow-hidden">
                {[
                  {
                    key: "line",
                    label: t("chartTypes.line"),
                    shortLabel: t("chartTypes.lineShort"),
                  },
                  {
                    key: "stepLine",
                    label: t("chartTypes.stepLine"),
                    shortLabel: t("chartTypes.stepLineShort"),
                  },
                  {
                    key: "dots",
                    label: t("chartTypes.dots"),
                    shortLabel: t("chartTypes.dotsShort"),
                  },
                  {
                    key: "stackedLines",
                    label: t("chartTypes.stackedLines"),
                    shortLabel: t("chartTypes.stackedLinesShort"),
                  },
                  {
                    key: "bars",
                    label: t("chartTypes.bars"),
                    shortLabel: t("chartTypes.barsShort"),
                  },
                ].map(({ key, label, shortLabel }) => (
                  <Button
                    key={key}
                    variant={
                      chartType === (key as ChartType) ? "default" : "ghost"
                    }
                    className="rounded-none h-6 sm:h-8 px-1 sm:px-2 lg:px-3 text-xs sm:text-sm"
                    onClick={() => setChartType(key as ChartType)}
                    aria-pressed={chartType === key}
                    aria-label={t("selectChart", { type: label })}
                  >
                    {isMobile ? shortLabel : label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center flex-shrink-0">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsOptionsOpen(!isOptionsOpen)}
                  aria-label={t("toggleOptionsPanel")}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </div>
          </DialogHeader>

          <div
            className={`flex flex-1 overflow-hidden ${
              isMobile ? "flex-col" : "flex-row"
            }`}
          >
            {/* LEFT PANEL FOR RTL (Arabic) - Desktop Only */}
            {isRTL && !isMobile && (
              <div
                className={`bg-white z-10 transition-all duration-300 ease-in-out h-full border-r flex-shrink-0 ${
                  isOptionsOpen ? "w-[240px] lg:w-[280px]" : "w-[40px]"
                }`}
              >
                <div
                  className={`flex py-2 border-b ${
                    isOptionsOpen ? "justify-start pl-2" : "justify-center"
                  }`}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOptionsOpen(!isOptionsOpen)}
                    className="h-6 w-6"
                    aria-label={t("toggleOptionsPanel")}
                  >
                    {isOptionsOpen ? (
                      <Minus className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {isOptionsOpen && renderOptionsPanel()}
              </div>
            )}

            {/* CHART AREA */}
            <div
              className={`overflow-hidden relative flex-1 ${
                isMobile ? "p-2" : "p-4 lg:p-6"
              } ${isMobile && isOptionsOpen ? "h-[60vh] flex-shrink-0" : ""}`}
            >
              {renderChart()}
            </div>

            {/* RIGHT PANEL FOR LTR (Non-Arabic) - Desktop Only */}
            {!isRTL && !isMobile && (
              <div
                className={`bg-white z-10 transition-all duration-300 ease-in-out h-full border-l flex-shrink-0 ${
                  isOptionsOpen ? "w-[240px] lg:w-[280px]" : "w-[40px]"
                }`}
              >
                <div className="flex py-2 border-b justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOptionsOpen(!isOptionsOpen)}
                    className="h-6 w-6"
                    aria-label={t("toggleOptionsPanel")}
                  >
                    {isOptionsOpen ? (
                      <Minus className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {isOptionsOpen && renderOptionsPanel()}
              </div>
            )}

            {/* MOBILE BOTTOM PANEL */}
            {isMobile && (
              <div
                className={`bg-white z-10 transition-all duration-300 ease-in-out border-t flex-shrink-0 ${
                  isOptionsOpen
                    ? "h-[40vh] min-h-[280px]"
                    : "h-0 overflow-hidden"
                }`}
              >
                <div
                  className={`flex justify-center py-2 border-b bg-gray-50 ${
                    isOptionsOpen ? "block" : "hidden"
                  }`}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOptionsOpen(false)}
                    className="h-6 w-6"
                    aria-label={t("closeOptionsPanel")}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>

                {isOptionsOpen && renderOptionsPanel()}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
