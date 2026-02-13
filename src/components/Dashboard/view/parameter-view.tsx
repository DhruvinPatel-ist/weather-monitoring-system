/* eslint-disable */
"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  startTransition,
} from "react";
import dynamic from "next/dynamic";
import LocationCard from "@/components/Dashboard/location-card";
import MetricCard from "@/components/Dashboard/metric-card";
const ChartSection = dynamic(
  () => import("@/components/Dashboard/chart-section"),
  { ssr: false }
);
import StationsList from "@/components/Dashboard/stations-list";
import { useTranslations, useLocale } from "next-intl";
import { WidgetService } from "@/services/WidgetServices";
import { WidgetConfig } from "@/types/user";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------- Types ---------- */
export type MetricType =
  | "temperature"
  | "humidity"
  | "rain"
  | "windSpeed"
  | "windDirection"
  | "solarRadiation"
  | "barometricPressure"
  | "sradCumulative";

export type Station = {
  longitude: number;
  latitude: number;
  id: string;
  name: string;
  status: "Active" | "Inactive";
  lastUpdated: string | null;
  ftp_status: "Active" | "Inactive";
};

type DynamicMetric = {
  id: MetricType | string;
  title: string;
  value: number | string;
  unit: string;
  icon: React.ReactNode;
  color: string;
  gaugeValue: number;
  min: number;
  max: number;
  ParameterID: number;
  widgetConfig: WidgetConfig;
};

interface ParameterViewProps {
  timeframe: any;
  selectedStation: Station | null;
  setSelectedStation: (station: Station) => void;
  stations: Station[];
  isMetricsLoading: boolean;
  metrics: {
    id: MetricType;
    title: string;
    value: number | string;
    unit: string;
    icon: React.ReactNode;
    color: string;
    gaugeValue: number;
    min: number;
    max: number;
    ParameterID?: number;
  }[];
}

/* ---------- Constants ---------- */
// Reverse map: attribute name → metricType id (used when metric lookup fails)
const attributeToMetricId: Record<string, MetricType> = {
  AirTemperature: "temperature",
  Humidity: "humidity",
  Rain: "rain",
  WindSpeed: "windSpeed",
  WindDirection: "windDirection",
  SRAD: "solarRadiation",
  BarometricPressure: "barometricPressure",
  SRADCumulative: "sradCumulative",
};

const PREFETCH_INTERSECTION = 0.35;
const PREFETCH_NEIGHBORS = 1;
const STEP_DELAY_MS = 120;
const METRICS_PER_SLOT = 8;

/* ---------- Component ---------- */
export default function ParameterView({
  isMetricsLoading,
  stations,
  timeframe,
  metrics,
  selectedStation,
  setSelectedStation,
}: ParameterViewProps) {
  const t = useTranslations("Dashboard");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const [selectedParameterID, setSelectedParameterID] = useState<number | null>(
    null
  );
  const lastSelectedRef = useRef<number | null>(null);
  useEffect(() => {
    lastSelectedRef.current = selectedParameterID;
  }, [selectedParameterID]);

  const [widgetConfigs, setWidgetConfigs] = useState<WidgetConfig[]>([]);
  const [isWidgetConfigsLoading, setIsWidgetConfigsLoading] = useState(true);

  const [currentSlot, setCurrentSlot] = useState(0);

  // Touch/swipe state (mobile)
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  /* ----- Fetch widget config for station ----- */
  useEffect(() => {
    if (!selectedStation?.id) return;
    let alive = true;

    (async () => {
      try {
        setIsWidgetConfigsLoading(true);
        const response = await WidgetService.getAllWidgetsConfig(
          selectedStation.id
        );
        if (!alive) return;

        setWidgetConfigs(response);

        const firstEnabled = response.find((cfg) => cfg.enable);
        setSelectedParameterID(firstEnabled ? firstEnabled.ParameterID : null);

        // Always reset to first page on station change
        setCurrentSlot(0);
      } catch (err) {
        console.error("Failed to fetch widget configs:", err);
      } finally {
        if (alive) setIsWidgetConfigsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [selectedStation?.id]);

  /* ----- Visible metrics driven by widget config ----- */
  const visibleMetrics: DynamicMetric[] = useMemo(() => {
    if (!widgetConfigs?.length) {
      // fallback: use raw metrics (if configs haven't loaded yet)
      return metrics.map((m) => ({
        ...m,
        ParameterID: m.ParameterID ?? 0,
        widgetConfig: {} as WidgetConfig,
      }));
    }

    return widgetConfigs
      .filter((cfg) => cfg.enable)
      .map((cfg) => {
        const metric = metrics.find((m) => m.ParameterID === cfg.ParameterID);
        return {
          id: metric?.id ?? attributeToMetricId[cfg.attributeName.replace(/\s/g, "")] ?? cfg.attributeName.replace(/\s/g, ""),
          title: metric?.title ?? cfg.title ?? cfg.attributeName,
          value: metric?.value ?? cfg.value,
          unit: metric?.unit ?? "",
          color: metric?.color ?? "",
          gaugeValue: metric?.gaugeValue ?? 0,
          min: metric?.min ?? cfg.minValue,
          max: metric?.max ?? cfg.maxValue,
          ParameterID: cfg.ParameterID,
          widgetConfig: cfg,
          icon: metric?.icon ?? null,
        };
      });
  }, [metrics, widgetConfigs]);

  const totalSlots = Math.ceil(visibleMetrics.length / METRICS_PER_SLOT);

  const currentSlotMetrics = useMemo(() => {
    const startIndex = currentSlot * METRICS_PER_SLOT;
    const endIndex = startIndex + METRICS_PER_SLOT;
    return visibleMetrics.slice(startIndex, endIndex);
  }, [visibleMetrics, currentSlot]);

  const canGoPrevious = currentSlot > 0;
  const canGoNext = currentSlot < totalSlots - 1;

  // Ensure selection stays within current slot (no ping-pong).
  useEffect(() => {
    if (!currentSlotMetrics.length) return;

    const idsInSlot = new Set(currentSlotMetrics.map((m) => m.ParameterID));
    if (!selectedParameterID || !idsInSlot.has(selectedParameterID)) {
      setSelectedParameterID(currentSlotMetrics[0].ParameterID);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlotMetrics.length]);

  const goToPreviousSlot = useCallback(() => {
    if (!canGoPrevious) return;
    const target = currentSlot - 1;
    setCurrentSlot(target);
    const startIndex = target * METRICS_PER_SLOT;
    const firstMetric = visibleMetrics[startIndex];
    if (firstMetric) setSelectedParameterID(firstMetric.ParameterID);
  }, [canGoPrevious, currentSlot, visibleMetrics]);

  const goToNextSlot = useCallback(() => {
    if (!canGoNext) return;
    const target = currentSlot + 1;
    setCurrentSlot(target);
    const startIndex = target * METRICS_PER_SLOT;
    const firstMetric = visibleMetrics[startIndex];
    if (firstMetric) setSelectedParameterID(firstMetric.ParameterID);
  }, [canGoNext, currentSlot, visibleMetrics]);

  // Reset to first slot when station or metric list shape changes
  useEffect(() => {
    setCurrentSlot(0);
  }, [selectedStation?.id, visibleMetrics.length]);

  // Selection helpers
  const selectedMetricData = useMemo(() => {
    return (
      visibleMetrics.find((m) => m.ParameterID === selectedParameterID) || {
        value: "-",
        unit: "",
        min: 0,
        max: 0,
        title: "",
        icon: null,
        color: "",
        gaugeValue: 0,
        id: "",
        ParameterID: 0,
        widgetConfig: {} as WidgetConfig,
      }
    );
  }, [visibleMetrics, selectedParameterID]);

  const selectedWidgetConfig = useMemo(() => {
    return widgetConfigs.find((cfg) => cfg.ParameterID === selectedParameterID);
  }, [widgetConfigs, selectedParameterID]);

  /* ----- Chart configs by ParameterID ----- */
  const chartConfigsByParameterID = useMemo(() => {
    const map = new Map<number, any>();
    visibleMetrics.forEach((m) => {
      map.set(m.ParameterID, {
        ParameterID: m.widgetConfig.ParameterID,
        attributeName: m.widgetConfig.attributeName,
        chartColor: m.widgetConfig.chartColor,
        chartType: String(m.widgetConfig.chartType),
        chartInterval: m.widgetConfig.chartInterval,
        id: m.widgetConfig.id,
        chartEnable: m.widgetConfig.chartEnable,
      });
    });
    return map;
  }, [visibleMetrics]);

  // Always use 8-card grid layout for desktop
  const gridClasses = "grid-cols-4 grid-rows-2";

  /* ----- Charts: progressive mount scheduler ----- */
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRowRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Build the full ordered list once (stable unless visibleMetrics changes)
  const allParameterIDs = useMemo(
    () => visibleMetrics.map((m) => m.ParameterID),
    [visibleMetrics]
  );

  // Observe **only the current slot** to stop selection ping-pong
  const observerParameterIDs = useMemo(
    () => currentSlotMetrics.map((m) => m.ParameterID),
    [currentSlotMetrics]
  );

  const [renderedUpTo, setRenderedUpTo] = useState<number>(0);
  const [targetUpTo, setTargetUpTo] = useState<number>(0);
  const renderedUpToRef = useRef(renderedUpTo);
  const targetUpToRef = useRef(targetUpTo);
  useEffect(() => {
    renderedUpToRef.current = renderedUpTo;
  }, [renderedUpTo]);
  useEffect(() => {
    targetUpToRef.current = targetUpTo;
  }, [targetUpTo]);

  // When slot changes, prime scheduler to end of this slot only
  useEffect(() => {
    const startIndex = currentSlot * METRICS_PER_SLOT;
    const endIndex = Math.min(
      startIndex + METRICS_PER_SLOT - 1,
      allParameterIDs.length - 1
    );
    setRenderedUpTo((prev) => Math.min(prev, endIndex));
    setTargetUpTo(endIndex);
  }, [currentSlot, allParameterIDs.length]);

  // Ensure refs exist
  useEffect(() => {
    allParameterIDs.forEach((id) => {
      if (!chartRowRefs.current[id]) chartRowRefs.current[id] = null;
    });
  }, [allParameterIDs]);

  // IntersectionObserver for selection + prefetch within current slot
  useEffect(() => {
    if (isMetricsLoading || isWidgetConfigsLoading) return;
    const root = chartContainerRef.current;
    if (!root) return;

    const idsInSlot = new Set(observerParameterIDs);
    const indexById = new Map<number, number>();
    allParameterIDs.forEach((id, i) => indexById.set(id, i));

    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (mostVisible?.target) {
          const id = Number(
            (mostVisible.target as HTMLElement).dataset.metricId
          );
          // Only update selection if this chart is **in current slot** and actually changed
          if (id && id !== lastSelectedRef.current && idsInSlot.has(id)) {
            startTransition(() => setSelectedParameterID(id));
          }
        }

        // Prefetch ahead (still only within observed nodes)
        let maxSuggested = targetUpToRef.current;
        for (const e of entries) {
          const id = Number((e.target as HTMLElement).dataset.metricId);
          if (!id) continue;
          const idx = indexById.get(id);
          if (idx == null) continue;
          if (e.intersectionRatio >= PREFETCH_INTERSECTION) {
            maxSuggested = Math.max(
              maxSuggested,
              Math.min(idx + PREFETCH_NEIGHBORS, allParameterIDs.length - 1)
            );
          }
        }
        if (maxSuggested > targetUpToRef.current) {
          setTargetUpTo(maxSuggested);
        }
      },
      { root, threshold: [0.2, PREFETCH_INTERSECTION, 0.5, 0.8] }
    );

    observerParameterIDs.forEach((id) => {
      const el = chartRowRefs.current[id];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [
    observerParameterIDs,
    allParameterIDs.length,
    isMetricsLoading,
    isWidgetConfigsLoading,
  ]);

  // Progressive mount scheduler (no runaway loops)
  useEffect(() => {
    if (isMetricsLoading || isWidgetConfigsLoading) return;
    let cancelled = false;

    const stepOnce = () => {
      if (cancelled) return;
      const r = renderedUpToRef.current;
      const t = targetUpToRef.current;
      if (r >= t) return;

      setRenderedUpTo(r + 1);
      renderedUpToRef.current = r + 1;

      if (renderedUpToRef.current < targetUpToRef.current) scheduleNext();
    };

    const scheduleNext = () => {
      const anyWin = window as any;
      if (anyWin && typeof anyWin.requestIdleCallback === "function") {
        anyWin.requestIdleCallback(stepOnce, { timeout: STEP_DELAY_MS * 2 });
      } else {
        setTimeout(stepOnce, STEP_DELAY_MS);
      }
    };

    if (renderedUpToRef.current < targetUpToRef.current) scheduleNext();
    return () => {
      cancelled = true;
    };
  }, [targetUpTo, isMetricsLoading, isWidgetConfigsLoading]);

  const handleMetricClick = useCallback(
    (ParameterID: number) => {
      setSelectedParameterID(ParameterID);

      const metricIndex = visibleMetrics.findIndex(
        (m) => m.ParameterID === ParameterID
      );
      if (metricIndex >= 0) {
        const targetSlot = Math.floor(metricIndex / METRICS_PER_SLOT);
        if (targetSlot !== currentSlot) setCurrentSlot(targetSlot);
      }

      const idx = allParameterIDs.indexOf(ParameterID);
      if (idx >= 0) {
        const desired = Math.min(
          idx + PREFETCH_NEIGHBORS,
          allParameterIDs.length - 1
        );
        if (desired > targetUpToRef.current) setTargetUpTo(desired);
      }

      const node = chartRowRefs.current[ParameterID];
      const container = chartContainerRef.current;
      if (node && container)
        node.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [visibleMetrics, currentSlot, allParameterIDs]
  );

  const shouldShowMetricSkeleton = isMetricsLoading || isWidgetConfigsLoading;

  /* ---------- Render ---------- */
  return (
    <div
      className="flex flex-col h-full gap-2 sm:gap-3 sm:px-2 md:gap-2 md:px-4 lg:gap-3 xl:gap-2 2xl:gap-2 overflow-auto lg:overflow-hidden hide-scrollbar"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Top row */}
      <div className="flex flex-col md:flex-col lg:flex-row justify-between pt-1 gap-4 lg:gap-2 h-[420px] md:h-[420px] lg:h-[260px] xl:h-[280px] 2xl:h-[300px]">
        {/* Location Card */}
        <div className="h-[210px] lg:h-full w-full lg:min-w-[280px] lg:w-1/3 xl:min-w-[320px] pr-0 lg:pr-3">
          {shouldShowMetricSkeleton ? (
            <Skeleton className="w-full h-full rounded-xl" />
          ) : (
            <LocationCard
              widgetConfigs={widgetConfigs}
              timeframe={timeframe}
              stationId={selectedStation?.id || ""}
              location={selectedStation?.name || t("Loading")}
              value={selectedMetricData.value}
              unit={selectedMetricData.unit}
              min={selectedMetricData.min}
              max={selectedMetricData.max}
              title={selectedMetricData.title || t("Humidity")}
              icon={selectedMetricData.icon}
            />
          )}
        </div>

        {/* Prev */}
        <div className="flex items-center">
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "rounded-full transition-all duration-200",
              !canGoPrevious || shouldShowMetricSkeleton
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-blue-50"
            )}
            onClick={goToPreviousSlot}
            disabled={!canGoPrevious || shouldShowMetricSkeleton}
            title={`Previous (${currentSlot} of ${totalSlots})`}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Metric cards */}
        <div className="w-full h-auto lg:h-full pl-1">
          {/* Mobile */}
          <div
            className="flex lg:hidden overflow-x-auto snap-x snap-mandatory gap-2 hide-scrollbar"
            onTouchStart={(e) => {
              setTouchEnd(null);
              setTouchStart(e.targetTouches[0].clientX);
            }}
            onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
            onTouchEnd={() => {
              if (!touchStart || !touchEnd) return;
              const dist = touchStart - touchEnd;
              if (dist > 50 && canGoNext) goToNextSlot();
              if (dist < -50 && canGoPrevious) goToPreviousSlot();
            }}
          >
            <div className="flex gap-3 min-w-min">
              {shouldShowMetricSkeleton
                ? Array.from({ length: 5 }).map((_, idx) => (
                    <Skeleton
                      key={idx}
                      className="min-w-[120px] h-[140px] rounded-lg"
                    />
                  ))
                : currentSlotMetrics.map((metric) => (
                    <div
                      key={metric.ParameterID}
                      className="w-[calc(100%-5px)] min-w-[120px] snap-start p-2"
                    >
                      <MetricCard
                        id={metric.id}
                        title={metric.title}
                        value={metric.value}
                        unit={metric.unit}
                        color={metric.color}
                        gaugeValue={metric.gaugeValue}
                        isSelected={selectedParameterID === metric.ParameterID}
                        onClick={() => handleMetricClick(metric.ParameterID)}
                        widgetConfigs={widgetConfigs}
                        selectedWidgetConfig={selectedWidgetConfig}
                        parameterID={metric.ParameterID}
                      />
                    </div>
                  ))}
            </div>

            {totalSlots > 1 && !shouldShowMetricSkeleton && (
              <div className="flex items-center justify-center min-w-[60px] px-2">
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  {currentSlot + 1}/{totalSlots}
                </div>
              </div>
            )}
          </div>

          {/* Desktop */}
          <div
            className={`hidden lg:grid ${shouldShowMetricSkeleton ? "grid-cols-4 grid-rows-2" : gridClasses} gap-4 w-full h-full pr-1`}
          >
            {shouldShowMetricSkeleton
              ? Array.from({ length: 8 }).map((_, idx) => (
                  <Skeleton
                    key={idx}
                    className="h-full w-full rounded-lg min-h-[140px]"
                  />
                ))
              : Array.from({ length: METRICS_PER_SLOT }).map((_, idx) => {
                  const metric = currentSlotMetrics[idx];
                  if (metric) {
                    return (
                      <MetricCard
                        key={metric.ParameterID}
                        id={metric.id}
                        title={metric.title}
                        value={metric.value}
                        unit={metric.unit}
                        color={metric.color}
                        gaugeValue={metric.gaugeValue}
                        isSelected={selectedParameterID === metric.ParameterID}
                        onClick={() => handleMetricClick(metric.ParameterID)}
                        widgetConfigs={widgetConfigs}
                        selectedWidgetConfig={selectedWidgetConfig}
                        parameterID={metric.ParameterID}
                      />
                    );
                  } else {
                    return <div key={`empty-${idx}`} className="h-full w-full" />;
                  }
                })}
          </div>

          {totalSlots > 1 && !shouldShowMetricSkeleton && (
            <div className="hidden lg:flex items-center justify-center mt-2">
              <div className="text-xs text-gray-500">
                {currentSlot + 1} of {totalSlots}
              </div>
            </div>
          )}
        </div>

        {/* Next */}
        <div className="flex items-center">
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "rounded-full transition-all duration-200",
              !canGoNext || shouldShowMetricSkeleton
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-blue-50"
            )}
            onClick={goToNextSlot}
            disabled={!canGoNext || shouldShowMetricSkeleton}
            title={`Next (${currentSlot + 2} of ${totalSlots})`}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Charts + Stations */}
      <div
        className="flex flex-col lg:flex-row justify-between gap-2 lg:gap-4 mt-3 md:mt-0 lg:h-[calc(100%-250px)] xl:h-[calc(100%-295px)] 2xl:h-[calc(100%-310px)] max-h-[480px]"
        dir="ltr"
      >
        {/* Charts */}
        <div className="w-full lg:w-3/4 h-[300px] lg:h-full min-h-0" dir="ltr">
          {shouldShowMetricSkeleton ? (
            <Skeleton className="w-full h-full rounded-xl" />
          ) : (
            <div
              ref={chartContainerRef}
              className="w-full h-full overflow-y-auto rounded-xl hide-scrollbar pr-1"
            >
              <div className="flex flex-col gap-3">
                {visibleMetrics.map((metric, idx) => {
                  const shouldRender = idx <= renderedUpTo;
                  const chartConfig = chartConfigsByParameterID.get(
                    metric.ParameterID
                  );
                    const canRenderChart =
                      !!selectedStation?.id &&
                      !!chartConfig &&
                      chartConfig.chartEnable === true;

                  if (!canRenderChart) return null;
                  return (
                    <div
                      key={`${metric.ParameterID}-${
                        selectedStation?.id ?? "none"
                      }`}
                      data-metric-id={metric.ParameterID}
                      ref={(el) => {
                        chartRowRefs.current[metric.ParameterID] = el;
                      }}
                      className="h-[320px] lg:h-[360px] w-full rounded-xl border bg-white overflow-visible"
                    >
                      <div className="h-full w-full">
                        {shouldRender ? (
                          <ChartSection
                            timeframe={timeframe}
                            metricType={metric.id as MetricType}
                            WidgetConfigs={widgetConfigs}
                            chartConfig={chartConfig}
                            stationId={selectedStation?.id || ""}
                            parameterID={metric.ParameterID}
                          />
                        ) : (
                          <Skeleton className="w-full h-full rounded-xl" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Station list */}
        <div className="w-full lg:w-2/7 h-[300px] lg:h-full min-h-0 mt-3 lg:mt-0">
          <div className="h-full w-full rounded-xl overflow-hidden">
            <StationsList
              selectedStation={selectedStation}
              setSelectedStation={setSelectedStation}
              stations={stations}
              onSelectStation={setSelectedStation}
              isChartLoading={isMetricsLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
