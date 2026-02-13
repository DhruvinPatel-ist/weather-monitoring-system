import type React from "react";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
// import { useLocationCard } from "@/hooks/useMetrics";
import { WidgetConfig } from "@/types/user";
import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";

interface LocationCardProps {
  location: string;
  value: number | string;
  unit: string;
  min: number;
  max: number;
  title: string;
  icon?: React.ReactNode;
  stationId: string;
  timeframe: any;
  widgetConfigs?: WidgetConfig[];
}

export default function LocationCard({
  location,
  value,
  unit,
  min,
  max,
  // title,
  icon,
}: // stationId,
// timeframe,
// widgetConfigs = [],
LocationCardProps) {
  const [isCustomScreen, setIsCustomScreen] = useState(false);
  const t = useTranslations("Dashboard");
  const sl = useTranslations("StationsList");
  const locale = useLocale();
  const isRTL = locale === "ar";

  useEffect(() => {
    const checkScreenSize = () => {
      const isTargetWidth = window.innerWidth === 1024;
      const isTargetHeight =
        window.innerHeight >= 640 && window.innerHeight <= 660;
      setIsCustomScreen(isTargetWidth && isTargetHeight);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Helper function to safely get translated location
  const getLocationText = (locationKey: string) => {
    // If the location is already translated text (contains Arabic/special characters), return as is
    if (
      /[\u0600-\u06FF]/.test(locationKey) ||
      locationKey === "Loading" ||
      locationKey === "جاري التحميل"
    ) {
      return locationKey;
    }

    try {
      // Try to get translation for the key
      const translated = sl(locationKey);
      return translated;
    } catch (error) {
      // If translation fails, return the original location string
      console.log(`Translation error for location key: ${locationKey}`, error);
      console.warn(`Translation not found for location key: ${locationKey}`);
      return locationKey;
    }
  };

  return (
    <Card className="h-full w-full bg-blue3 rounded-3xl text-white gap-0 overflow-hidden p-4">
      <div className="ml-2 flex flex-col">
        <h2
          className={`${isCustomScreen ? "text-base" : "text-lg"} font-medium`}
        >
          {t("Your Location")}
        </h2>
        <div className="flex items-center text-xs gap-1">
          <Image
            src="/assets/dashboard/Vector.svg"
            alt="location"
            width={16}
            height={16}
          />
          <span className="truncate">{getLocationText(location)}</span>
        </div>
      </div>
      <CardContent className="flex flex-col h-full w-full p-0">
        <div className="grid grid-cols-5 gap-2">
          <div className="col-span-3">
            <div className={`${isCustomScreen ? "mt-2" : "mt-10 sm:mt-4"}`}>
              {/* Updated value and unit display with RTL/LTR support */}
              <div
                className={`flex gap-1 ${isRTL ? "justify-end" : ""}`}
                dir="ltr"
              >
                <span
                  className={`${
                    isCustomScreen ? "text-3xl" : "text-4xl"
                  } font-bold leading-none`}
                >
                  {value}
                </span>
                <span
                  className={`${
                    isCustomScreen ? "text-xl" : "text-2xl"
                  } font-bold leading-none`}
                >
                  {unit}
                </span>
              </div>
            </div>
          </div>
          <div
            className={`col-span-2 w-1xs flex justify-center items-center ${
              isCustomScreen ? "scale-75" : "sm:scale-80 sm:items-start"
            }`}
          >
            {icon && (
              <div
                style={
                  isCustomScreen
                    ? { transform: "scale(0.6)", transformOrigin: "center" }
                    : {}
                }
              >
                {icon}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col h-full justify-end mt-auto">
          <div
            className={`flex justify-between gap-4 w-1xs ${
              isCustomScreen ? "mt-1" : ""
            }`}
          >
            <div
              className={`bg-blue3 gap-2 ${
                isCustomScreen ? "text-xs py-0.5" : "md:text-sm py-1"
              } w-full rounded-full px-2 border-2 border-white flex justify-center`}
            >
              <span className="" dir="ltr">
                {t(`Min:`)}
              </span>
              <span dir="ltr">
                {isRTL ? " " : ""}
                {min} {unit}
              </span>
            </div>
            <div
              className={`bg-blue3 gap-2 ${
                isCustomScreen ? "text-xs py-0.5" : "md:text-sm py-1"
              } w-full rounded-full px-2 border-2 border-white flex justify-center`}
            >
              <span className="" dir="ltr">
                {t(`Max:`)}
              </span>
              <span dir="ltr">
                {isRTL ? " " : ""}
                {max} {unit}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
