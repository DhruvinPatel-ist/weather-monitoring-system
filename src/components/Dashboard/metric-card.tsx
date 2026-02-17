"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { GaugeChart } from "./visualization/gauge-chart";
import { WindDirectionIcon } from "./visualization/wind-direction-icon";
import { RainIcon } from "./visualization/rain-icon";
import { BarometricGauge } from "./visualization/barometric-gauge";
import HumidityWidget from "./visualization/humidity-widget";
import WindSpeedGauge from "./visualization/wind-speed-gauge";
import TestUtGauge from "./visualization/testut";
import { useTranslations, useLocale, useMessages } from "next-intl";
import { SolarRadiationGauge } from "./visualization/SolarRadiationGauge";
import { WidgetConfig } from "@/types/user";
import { CustomWidget1 } from "./visualization/CustomWidget1";
import { CustomWidget2 } from "./visualization/CustomWidget2";
import { CustomWidget3 } from "./visualization/CustomWidget3";
import { CustomWidget4 } from "./visualization/CustomWidget4";
import { CustomWidget5 } from "./visualization/CustomWidget5";
import { useEffect, useState } from "react";
import CustomWidget6 from "./visualization/CustomWidget6";
import CustomWidget7 from "./visualization/CustomWidget7";

// Map for backwards compatibility, but we'll prefer parameterID for configuration lookups
const attributeMap: Record<string, string> = {
  temperature: "AirTemperature",
  humidity: "Humidity",
  rain: "Rain",
  windSpeed: "WindSpeed",
  windDirection: "WindDirection",
  solarRadiation: "SRAD",
  barometricPressure: "BarometricPressure",
  sradCumulative: "SRADCumulative",
  test: "Test",
};

export interface MetricCardProps {
  id: string;
  title: string;
  value: number | string;
  unit: string;
  color: string;
  gaugeValue: number;
  isSelected?: boolean;
  onClick?: () => void;
  widgetConfigs?: WidgetConfig[];
  selectedWidgetConfig?: WidgetConfig;
  setSelectedWidgetConfig?: (config: WidgetConfig) => void;
  parameterID?: number;
}

// Screen size types
type ScreenSizeType = "small" | "medium" | "normal";

export default function MetricCard({
  id,
  title,
  value,
  unit,
  gaugeValue,
  isSelected = false,
  onClick,
  widgetConfigs = [],
  parameterID,
}: MetricCardProps) {
  const t = useTranslations("Dashboard");
  const messages = useMessages() as Record<string, any>;
  const locale = useLocale();
  const isRTL = locale === "ar";
  const [screenSize, setScreenSize] = useState<ScreenSizeType>("normal");

  // === i18n: translate title if key exists in Dashboard; else show original ===
  const localizedTitle = (() => {
    const ns = messages?.Dashboard as Record<string, unknown> | undefined;
    const hasKey =
      ns &&
      Object.prototype.hasOwnProperty.call(ns, title) &&
      (ns as Record<string, any>)[title] != null &&
      String((ns as Record<string, any>)[title]).length > 0;
    return hasKey ? t(title) : title;
  })();

  // Check screen size and set appropriate state
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Small screen: 1024x650
      if (width === 1024 && height >= 640 && height <= 660) {
        setScreenSize("small");
      }
      // Medium screen: 1025x650 to 1289x650
      else if (
        width >= 1025 &&
        width <= 1289 &&
        height >= 640 &&
        height <= 660
      ) {
        setScreenSize("medium");
      }
      // Normal screen: everything else
      else {
        setScreenSize("normal");
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const attributeName = attributeMap[id] || id;

  // First try to find widget config by parameterID if available, then fall back to attributeName
  const widgetConfig =
    parameterID && widgetConfigs && widgetConfigs.length > 0
      ? widgetConfigs.find((config) => config?.ParameterID === parameterID)
      : widgetConfigs && widgetConfigs.length > 0
      ? widgetConfigs.find((config) => config?.attributeName === attributeName)
      : undefined;

  const widgetType = widgetConfig?.type ?? 0;
  const rawColors = widgetConfig?.colors;

  const colors = Array.isArray(rawColors)
    ? rawColors.map((color) =>
        typeof color === "string" && color.startsWith("#") ? color : `#${color}`
      )
    : ["#FC6559", "#009FAC", "#FB8F0B"];
  const min = widgetConfig?.minValue ?? 0;
  const max = widgetConfig?.maxValue ?? 100;

  // Get scale factor based on screen size
  const getScaleFactor = () => {
    switch (screenSize) {
      case "small":
        return "scale-50";
      case "medium":
        return "scale-75";
      default:
        return "scale-75";
    }
  };

  // Get height based on screen size
  const getHeight = () => {
    switch (screenSize) {
      case "small":
        return "h-[60px]";
      case "medium":
        return "h-[80px]";
      default:
        return "h-[75px]";
    }
  };

  // Common wrapper class for all widgets
  const widgetWrapperClass = cn(
    "flex items-center justify-center",
    screenSize !== "normal" && "w-full mx-auto origin-center",
    getHeight(),
    getScaleFactor()
  );

  return (
    <Card
      className={cn(
        "h-full w-full flex flex-col rounded-lg cursor-pointer transition-all duration-200 overflow-hidden",
        isSelected ? "ring-2 ring-blue3 shadow-md" : "",
        screenSize === "small" ? "p-2" : screenSize === "medium" ? "p-2" : "p-2"
      )}
      onClick={onClick}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <CardContent
        className={cn(
          "flex flex-col items-center w-full h-full origin-top",
          "scale-95 sm:scale-100 md:scale-[.98] lg:scale-100 xl:scale-100 2xl:scale-100",
          "min-h-[120px] sm:min-h-[130px] md:min-h-[140px] lg:min-h-[150px]"
        )}
      >
        <h3
          className={cn(
            "w-full text-center font-bold text-blue4 mb-1",
            "sm:text-xs md:text-xs lg:text-xs xl:text-xs"
          )}
        >
          {localizedTitle}
          {unit && (
           <> {"(" + unit + ")"}</>
          )}
        </h3>

        <div className="flex justify-center">
          {(() => {
            // Render different widgets based on type and ID
            if (widgetType === 0) {
              return (
                <div className={widgetWrapperClass}>
                  <GaugeChart
                      value={value === "-" ? 0 : gaugeValue}
                      colors={colors}
                    />
                </div>
              );
            }

            if (widgetType === 1) {
              return (
                <div className={widgetWrapperClass}>
                  <CustomWidget1
                    value={value === "-" ? 0 : gaugeValue}
                    colors={colors}
                  />
                </div>
              );
            }

            if (widgetType === 2) {
              return (
                <div className={widgetWrapperClass}>
                  <CustomWidget2
                    value={value === "-" ? 0 : gaugeValue}
                    min={min}
                    max={max}
                    colors={colors}
                  />
                </div>
              );
            }

            if (widgetType === 3) {
              return (
                <div className={widgetWrapperClass}>
                  <CustomWidget3 colors={colors} />
                </div>
              );
            }

            if (widgetType === 4) {
              return (
                <div className={widgetWrapperClass}>
                  <CustomWidget4
                    value={value === "-" ? 0 : gaugeValue}
                    colors={colors}
                    min={min}
                    max={max}
                  />
                </div>
              );
            }

            if (widgetType === 5) {
              return (
                <div className={widgetWrapperClass}>
                  <CustomWidget5
                    value={value === "-" ? 0 : gaugeValue}
                    colors={colors}
                  />
                </div>
              );
            }

            if (widgetType === 6) {
              return (
                <div className={widgetWrapperClass}>
                  <CustomWidget6
                    value={value === "-" ? 0 : gaugeValue}
                    colors={colors}
                  />
                </div>
              );
            }

            if (widgetType === 7) {
              return (
                <div className={widgetWrapperClass}>
                  <CustomWidget7
                    value={value === "-" ? 0 : gaugeValue}
                    colors={colors}
                  />
                </div>
              );
            }

            // Default widget based on ID
            switch (id) {
              case "temperature":
              case "srad":
                return (
                  <div className={widgetWrapperClass}>
                    <GaugeChart
                      value={value === "-" ? 0 : gaugeValue}
                      colors={colors}
                    />
                  </div>
                );

              case "windDirection":
                return (
                  <div className={widgetWrapperClass}>
                    <WindDirectionIcon colors={colors} />
                  </div>
                );

              case "humidity":
                return (
                  <div className={widgetWrapperClass}>
                    <HumidityWidget
                      value={value === "-" ? 0 : Number(value)}
                      colors={colors}
                    />
                  </div>
                );

              case "windSpeed":
                return (
                  <div className={widgetWrapperClass}>
                    <WindSpeedGauge
                      value={value === "-" ? 0 : Number(value)}
                      min={min}
                      max={max}
                      paddingAngle={0}
                      colors={colors}
                    />
                  </div>
                );

              case "rain":
                return (
                  <div className={widgetWrapperClass}>
                    <RainIcon />
                  </div>
                );

              case "barometricPressure":
                return (
                  <div className={widgetWrapperClass}>
                    <BarometricGauge
                      value={value === "-" ? 0 : Number(value)}
                    />
                  </div>
                );

              case "solarRadiation":
              case "sradCumulative":
                return (
                  <div className={widgetWrapperClass}>
                    <SolarRadiationGauge
                      value={value === "-" ? 0 : Number(value)}
                      locale={locale}
                    />
                  </div>
                );

              case "test":
                return (
                  <div className={widgetWrapperClass}>
                    <TestUtGauge value={Number(value)} />
                  </div>
                );

              default:
                return (
                  <div
                    className={cn(
                      "flex justify-center items-center",
                      screenSize === "small"
                        ? "h-6 text-[10px]"
                        : screenSize === "medium"
                        ? "h-8 text-[11px]"
                        : "h-12 text-sm"
                    )}
                  >
                    <div className="font-medium">
                      {value}
                      {unit && (
                        <span
                          className={
                            screenSize === "small"
                              ? "text-[7px] ml-0.5"
                              : screenSize === "medium"
                              ? "text-[8px] ml-0.5"
                              : "text-xs ml-1"
                          }
                        >
                          {unit}
                        </span>
                      )}
                    </div>
                  </div>
                );
            }
          })()}
        </div>

        <h4
          className={cn(
            "w-full text-center font-bold text-blue4",
            "sm:text-xs md:text-xs lg:text-xs xl:text-xs"
          )}
        >
          {value !== undefined ? value : "-"}
        </h4>
      </CardContent>
    </Card>
  );
}
