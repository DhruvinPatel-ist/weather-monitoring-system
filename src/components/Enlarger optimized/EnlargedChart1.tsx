// EnlargedChart.tsx - Fixed RTL panel positioning and toggle
"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import { Plus, Minus, ChevronDown, X, Settings, Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useTranslations } from "@/hooks/useTranslations";
import { useLocale } from "next-intl";

interface EnlargedChartProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  xaxisprops?: any;
  data?: { time: string; fullTime?: string; value: number }[];
  color?: string;
  multiSeries?: {
    siteName: string;
    data: { time: string; fullTime?: string; value: number }[];
  }[];
  locale?: string;
  stationName?: string;
  attributeName?: string;
  metricType?: string;
  label?: string;
  staticLegend?: { label: string; color: string }[];
}

type ChartType = "line" | "stepLine" | "dots" | "stackedLines" | "bars";

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
  const langCode = lang.toLowerCase().split("-")[0];
  return (
    RTL_LANGUAGES.includes(langCode) ||
    RTL_LANGUAGES.includes(lang.toLowerCase())
  );
};

// Generate colors that match the chart colors exactly
const generateChartColors = (count: number): string[] => {
  return Array.from(
    { length: count },
    (_, i) => `hsl(${(i * 67) % 360}, 70%, 50%)`
  );
};

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

  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [chartType, setChartType] = useState<ChartType>("line");
  const [showMarker, setShowMarker] = useState(false);
  const [showDashes, setShowDashes] = useState(false);
  const [showTrackball, setShowTrackball] = useState(false);
  const [showDateTooltip, setShowDateTooltip] = useState(true);
  const [showValueTooltip, setShowValueTooltip] = useState(true);
  const [showLimits, setShowLimits] = useState(true);
  const [showAnimation, setShowAnimation] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [selectedColor, setSelectedColor] = useState(color);
  const [isMobile, setIsMobile] = useState(false);

  // Bulk data handling states
  const [enableDataSampling, setEnableDataSampling] = useState(true);
  const [maxDataPoints, setMaxDataPoints] = useState([1000]);
  const [samplingStrategy, setSamplingStrategy] = useState("lttb");
  const [showDataInfo, setShowDataInfo] = useState(true);
  // Calculate total data points
  const totalDataPoints = useMemo(() => {
    if (multiSeries) {
      return Math.max(...multiSeries.map((s) => s.data.length));
    }
    return data?.length || 0;
  }, [data, multiSeries]);

  // Auto-enable sampling for large datasets
  useEffect(() => {
    if (totalDataPoints > 2000) {
      setEnableDataSampling(true);
      setShowDataInfo(true);
      // Adjust max points based on data size
      if (totalDataPoints > 50000) {
        setMaxDataPoints([500]);
      } else if (totalDataPoints > 10000) {
        setMaxDataPoints([1000]);
      }
    }
  }, [totalDataPoints]);

  const siteData = [
    {
      id: "1",
      title: "ATP Site",
      titleAr: "موقع ATP",
    },
    {
      id: "2",
      title: "Aynu ul ghamur Site",
      titleAr: "موقع عين الغمور",
    },
    {
      id: "3",
      title: "Al Fqait",
      titleAr: "الفقيط",
    },
    {
      id: "4",
      title: "Al Wurayah",
      titleAr: "الوريعة",
    },
    {
      id: "5",
      title: "Al Qrayah Mountains",
      titleAr: "جبال القرية",
    },
    {
      id: "6",
      title: "Difayyin Site",
      titleAr: "موقع الدفين",
    },
    {
      id: "7",
      title: "Hail Mountain Site",
      titleAr: "موقع جبل حائل",
    },
    {
      id: "8",
      title: "Huwairah",
      titleAr: "الحويرة",
    },
    {
      id: "9",
      title: "Masafi",
      titleAr: "مسافي",
    },
    {
      id: "10",
      title: "Mohammed Bin Zayed",
      titleAr: "محمد بن زايد",
    },
  ];

  const isRTL = isRTLLanguage(locale || currentLocale);

  const site = siteData.find((site) => site.id === title);
  if (site) {
    // Return Arabic title if RTL, otherwise English title
    title = isRTL ? site.titleAr : site.title;
  } else if (title !== undefined && title >= "1" && title <= "12") {
    title = t(`defaultChartTitle${title}`);
  }
  // Generate legend items with matching colors
  const getLegendFromData = (): { label: string; color: string }[] => {
    if (multiSeries && multiSeries.length > 0) {
      const chartColors = generateChartColors(multiSeries.length);
      return multiSeries.map((series, index) => ({
        label: series.siteName || `Series ${index + 1}`,
        color: chartColors[index],
      }));
    } else if (data && data.length > 0) {
      return [
        {
          label: label || attributeName || "Data",
          color: color || "#4693f1",
        },
      ];
    } else {
      return [];
    }
  };

  const legendItems =
    staticLegend && staticLegend.length > 0
      ? staticLegend
      : getLegendFromData();

  useEffect(() => {
    const checkScreenSize = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

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
      if (isMobile) setIsOptionsOpen(false);
      else setIsOptionsOpen(true);
    }
  }, [isOpen, color, isMobile]);

  const chartTypes: { key: ChartType; label: string; shortLabel: string }[] = [
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
  ];

  const renderChart = () => {
    const chartProps = {
      data: data || [],
      series: multiSeries,
      label: title,
      color: selectedColor,
      showMarker,
      showDashes,
      showTrackball,
      showDateTooltip,
      showValueTooltip,
      showLimits,
      showAnimation,
      showLegend,
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
      xaxisprops,
      stationName,
      attributeName,
      metricType,
      staticLegend: legendItems,
      // Bulk data props
      maxDataPoints: maxDataPoints[0],
      enableDataSampling,
      samplingStrategy,
      showDataInfo,
    };

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

  const samplingStrategies = [
    {
      value: "lttb",
      label: "LTTB (Recommended)",
      description: "Preserves shape and trends",
    },
    { value: "average", label: "Average", description: "Smooths data" },
    {
      value: "minmax",
      label: "Min-Max",
      description: "Preserves peaks and valleys",
    },
    {
      value: "firstlast",
      label: "Simple",
      description: "Takes every nth point",
    },
  ];

  const renderDataOptimizationSection = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Info className="w-4 h-4 text-blue-500" />
        <Label className="text-sm font-medium text-gray-700">
          Data Optimization
        </Label>
      </div>

      <div className="bg-blue-50 p-3 rounded-md">
        <div className="text-xs text-gray-600 mb-2">
          Total data points:{" "}
          <span className="font-semibold">
            {totalDataPoints.toLocaleString()}
          </span>
        </div>
        {totalDataPoints > 1000 && (
          <div className="text-xs text-amber-600">
            ⚠️ Large dataset detected. Consider enabling data sampling for
            better performance.
          </div>
        )}
      </div>

      <div
        className={`flex justify-between items-center gap-2 ${
          isRTL && !isMobile ? "flex-row-reverse" : ""
        }`}
      >
        <Label className="text-xs text-gray-500 flex-1 cursor-pointer">
          Enable Data Sampling
        </Label>
        <Switch
          checked={enableDataSampling}
          onCheckedChange={setEnableDataSampling}
          className="data-[state=checked]:bg-blue3 data-[state=unchecked]:bg-gray-400 flex-shrink-0"
        />
      </div>

      {enableDataSampling && (
        <>
          <div className="space-y-2">
            <Label className="text-xs text-gray-500">
              Max Data Points: {maxDataPoints[0].toLocaleString()}
            </Label>
            <Slider
              value={maxDataPoints}
              onValueChange={setMaxDataPoints}
              max={Math.min(5000, totalDataPoints)}
              min={100}
              step={100}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>100</span>
              <span>{Math.min(5000, totalDataPoints).toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-gray-500">Sampling Strategy</Label>
            <Select
              value={samplingStrategy}
              onValueChange={setSamplingStrategy}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {samplingStrategies.map((strategy) => (
                  <SelectItem key={strategy.value} value={strategy.value}>
                    <div>
                      <div className="font-medium">{strategy.label}</div>
                      <div className="text-xs text-gray-500">
                        {strategy.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <div
        className={`flex justify-between items-center gap-2 ${
          isRTL && !isMobile ? "flex-row-reverse" : ""
        }`}
      >
        <Label className="text-xs text-gray-500 flex-1 cursor-pointer">
          Show Data Info
        </Label>
        <Switch
          checked={showDataInfo}
          onCheckedChange={setShowDataInfo}
          className="data-[state=checked]:bg-blue3 data-[state=unchecked]:bg-gray-400 flex-shrink-0"
        />
      </div>
    </div>
  );

  // Render options panel content
  const renderOptionsPanel = () => (
    <div
      className={`p-2 sm:p-3 overflow-y-auto ${
        isMobile ? "h-[calc(100%-6rem)]" : "h-[calc(100%-3rem)]"
      }`}
    >
      <div className="space-y-3 sm:space-y-4">
        {/* Performance Section */}
        {totalDataPoints > 500 && (
          <>
            {renderDataOptimizationSection()}
            <Separator />
          </>
        )}

        {/* Chart Options */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">
            Chart Options
          </Label>
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
          ).map(([label, value, setter], idx) => {
            // Disable certain options for large datasets
            const isDisabled =
              totalDataPoints > 10000 &&
              (setter === setShowMarker || setter === setShowAnimation);

            return (
              <div
                key={idx}
                className={`flex justify-between items-center gap-2 ${
                  isRTL && !isMobile ? "flex-row-reverse" : ""
                } ${isDisabled ? "opacity-50" : ""}`}
              >
                <Label className="text-xs text-gray-500 flex-1 cursor-pointer">
                  {label}
                  {isDisabled && (
                    <span className="text-xs text-amber-500 ml-1">
                      (Disabled for performance)
                    </span>
                  )}
                </Label>
                <Switch
                  checked={value && !isDisabled}
                  onCheckedChange={isDisabled ? undefined : setter}
                  disabled={isDisabled}
                  className="data-[state=checked]:bg-blue3 data-[state=unchecked]:bg-gray-400 ring-offset-background focus-visible:ring-2 focus-visible:ring-blue3 flex-shrink-0"
                />
              </div>
            );
          })}
        </div>

        {/* Performance Tips */}
        {totalDataPoints > 5000 && (
          <>
            <Separator />
            <div className="bg-yellow-50 p-3 rounded-md">
              <div className="text-xs font-medium text-yellow-800 mb-1">
                Performance Tips
              </div>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• Enable data sampling to reduce rendering time</li>
                <li>
                  • Use line charts for better performance with large datasets
                </li>
                <li>
                  • Disable markers and animations for smoother interaction
                </li>
                <li>
                  • Consider using min-max sampling to preserve important peaks
                </li>
              </ul>
            </div>
          </>
        )}
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
                {chartTypes.map(({ key, label, shortLabel }) => (
                  <Button
                    key={key}
                    variant={chartType === key ? "default" : "ghost"}
                    className="rounded-none h-6 sm:h-8 px-1 sm:px-2 lg:px-3 text-xs sm:text-sm"
                    onClick={() => setChartType(key)}
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
                className={`
                  bg-white z-10 transition-all duration-300 ease-in-out h-full border-r flex-shrink-0
                  ${isOptionsOpen ? "w-[280px] lg:w-[320px]" : "w-[40px]"}
                `}
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
              className={`
                overflow-hidden relative flex-1
                ${isMobile ? "p-2" : "p-4 lg:p-6"}
                ${isMobile && isOptionsOpen ? "h-[60vh] flex-shrink-0" : ""}
                ${!isMobile && totalDataPoints > 1000 ? "h-[80vh]" : ""}
              `}
            >
              {renderChart()}
            </div>

            {/* RIGHT PANEL FOR LTR (Non-Arabic) - Desktop Only */}
            {!isRTL && !isMobile && (
              <div
                className={`
                  bg-white z-10 transition-all duration-300 ease-in-out h-full border-l flex-shrink-0
                  ${isOptionsOpen ? "w-[240px] lg:w-[280px]" : "w-[40px]"}
                `}
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
                className={`
                  bg-white z-10 transition-all duration-300 ease-in-out border-t flex-shrink-0
                  ${
                    isOptionsOpen
                      ? "h-[40vh] min-h-[280px]"
                      : "h-0 overflow-hidden"
                  }
                `}
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
