"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Clock, Maximize2, Minimize2 } from "lucide-react";
import type {
  MetricType,
  Station,
} from "@/components/Dashboard/view/parameter-view";
import { useTranslations, useLocale, useMessages } from "next-intl";
import { useAllGeneralSettings } from "@/hooks/useGeneralSettings";
import MapComponentDash from "@/components/Dashboard/view/DashMapView";
import { useMetrics } from "@/hooks/useMetrics";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

interface StationsListProps {
  stations: Station[];
  isChartLoading: boolean;
  onSelectStation: (station: Station) => void;
  selectedStation: Station | null;
  setSelectedStation: (station: Station) => void;
}

export default function StationsList({
  selectedStation,
  setSelectedStation,
  stations,
  onSelectStation,
}: StationsListProps) {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const t = useTranslations("StationsList");
  const tMetrics = useTranslations("Metrics");
  const tDashboard = useTranslations("Dashboard");
  const tWidgets = useTranslations("Widgets");
  const messages = useMessages() as Record<string, any>;

  // --- i18n fallback helpers ---
  const hasKeyInNs = (nsName: string, key: string) => {
    const ns = messages?.[nsName] as Record<string, any> | undefined;
    return (
      !!ns &&
      Object.prototype.hasOwnProperty.call(ns, key) &&
      ns[key] != null &&
      String(ns[key]).length > 0
    );
  };

  const translateOrOriginal = (
    nsName: "StationsList" | "Metrics" | "Dashboard" | "Widgets",
    key: string
  ) => {
    switch (nsName) {
      case "StationsList":
        return hasKeyInNs("StationsList", key) ? t(key) : key;
      case "Metrics":
        return hasKeyInNs("Metrics", key) ? tMetrics(key) : key;
      case "Dashboard":
        return hasKeyInNs("Dashboard", key) ? tDashboard(key) : key;
      case "Widgets":
        return hasKeyInNs("Widgets", key) ? tWidgets(key) : key;
    }
  };

  // Attempts across multiple namespaces for dynamic metric titles
  const translateMetricTitle = (key: string) => {
    if (hasKeyInNs("Metrics", key)) return tMetrics(key);
    if (hasKeyInNs("Dashboard", key)) return tDashboard(key);
    if (hasKeyInNs("Widgets", key)) return tWidgets(key);
    return key; // fallback to original
  };
  // --- end i18n helpers ---

  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [isMapEnlarged, setIsMapEnlarged] = useState(false);
  const { data: generalSettings = [] } = useAllGeneralSettings();

  useEffect(() => {
    if (stations.length > 0 && !selectedStation) {
      setSelectedStation(stations[0]);
    }
  }, [stations, selectedStation, setSelectedStation]);

  const handleStationSelect = (station: Station) => {
    onSelectStation(station);
    setSelectedStation(station);
  };

  function formatUTCString(dateString: string): string {
    if (!dateString) return "Null";
    const [datePart, timePartWithMsZ] = dateString.split("T");
    const [yyyy, mm, dd] = datePart.split("-");
    const [HH, MM, SSWithMs] = timePartWithMsZ.replace("Z", "").split(":");
    const SS = SSWithMs?.split(".")[0] ?? "00";
    return `${dd}-${mm}-${yyyy} ${HH}:${MM}:${SS}`;
  }

  const toggleMapSize = () => {
    setIsMapEnlarged(!isMapEnlarged);
  };

  // Escape key handler to minimize map
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isMapEnlarged) {
        setIsMapEnlarged(false);
      }
    };

    if (isMapEnlarged) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isMapEnlarged]);



  const now = dayjs().tz("Asia/Dubai");
  const oneDayAgo = now.subtract(1, "day");

  const dateTimeRange = `${oneDayAgo.format(
    "YYYY-MM-DD[T]HH:mm:ss.SSS"
  )}/${now.format("YYYY-MM-DD[T]HH:mm:ss.SSS")}`;

  // Fetch metrics for the selected station - this will be used in enlarged map
  const { data: metrics = [] } = useMetrics(
    selectedStation?.id,
    "live",
    dateTimeRange
  ) as unknown as {
    data: {
      id: MetricType;
      title: string;
      value: string | number;
      unit: string;
      color: string;
      gaugeValue: number;
      min: number;
      max: number;
    }[];
    isLoading: boolean;
  };
  
  useEffect(() => {
  console.log("Metrics:", metrics);
}, [metrics]);
  return (
    <>
      <Card
        className="h-full w-full flex flex-col gap-0 pt-3"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <CardHeader className="px-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <span>{t("listOfStations")}</span>
            <div className="flex items-center">
              <span className="text-xs font-normal px-1">{t("list")}</span>
              <Switch
                className="mx-1"
                checked={viewMode === "map"}
                onCheckedChange={(checked) =>
                  setViewMode(checked ? "map" : "list")
                }
                dir={isRTL ? "rtl" : "ltr"}
              />
              <span className="text-xs font-normal px-1">{t("map")}</span>
              {viewMode === "map" && (
                <button
                  onClick={toggleMapSize}
                  className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
                  title={isMapEnlarged ? "Minimize Map" : "Enlarge Map"}
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-1 h-[calc(100%-5px)] flex flex-col">
          {viewMode === "list" ? (
            <div className="flex flex-col h-full w-full">
              <div className="grid grid-cols-2 bg-gray-100 rounded-t-md px-4 py-2 font-medium text-sm h-[36px]">
                <div>{t("stations")}</div>
                <div>{t("status")}</div>
              </div>
              <div className="overflow-y-auto h-[calc(100%-40px)] hide-scrollbar">
                {stations.map((station, index) => {
                  const now = new Date();
                  const sixtyMinutesAgo = new Date(
                    now.getTime() - 60 * 60 * 1000
                  );
                  let lastUpdatedTime = station.lastUpdated
                    ? new Date(station.lastUpdated)
                    : null;
                  if (lastUpdatedTime) {
                    lastUpdatedTime = new Date(
                      lastUpdatedTime.getTime() - 4 * 60 * 60 * 1000
                    );
                  }
                  const isOnline =
                    station.status === "Active" &&
                    lastUpdatedTime !== null &&
                    lastUpdatedTime > sixtyMinutesAgo;

                  // i18n: translate station name if present in StationsList; else show original
                  const stationName = station.name
                    ? station.name === "Weather Station"
                      ? "Weather Station"
                      : translateOrOriginal("StationsList", station.name)
                    : "Unknown Station";

                  return (
                    <div
                      key={index}
                      onClick={() => handleStationSelect(station)}
                      className={`cursor-pointer grid grid-cols-2 px-4 py-3 transition-colors ${
                        selectedStation?.id === station.id
                          ? "bg-blue-400/70 border-blue3"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="text-sm font-medium">{stationName}</div>
                      <div>
                        <div className="flex items-center">
                          {station.ftp_status === "Inactive" ? (
                            <>
                              <div
                                className={`h-2.5 w-2.5 rounded-full ${
                                  isRTL ? "ml-2" : "mr-2"
                                } bg-orange-400`}
                              ></div>
                              <span className="capitalize text-sm text-orange-600">
                                {translateOrOriginal(
                                  "StationsList",
                                  "Inactive"
                                )}
                              </span>
                            </>
                          ) : (
                            <>
                              <div
                                className={`h-2.5 w-2.5 rounded-full ${
                                  isRTL ? "ml-2" : "mr-2"
                                } ${isOnline ? "bg-green-500" : "bg-red-500"}`}
                              ></div>
                              <span
                                className={`capitalize text-sm ${
                                  isOnline ? "text-green-700" : "text-red-700"
                                }`}
                              >
                                {isOnline
                                  ? translateOrOriginal(
                                      "StationsList",
                                      "online"
                                    )
                                  : translateOrOriginal(
                                      "StationsList",
                                      "offline"
                                    )}
                              </span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center text-xs text-gray-700 mt-1.5">
                          <Clock
                            className={`h-3 w-3 ${isRTL ? "ml-1.5" : "mr-1.5"}`}
                          />
                          {station.lastUpdated
                            ? formatUTCString(station.lastUpdated)
                            : "Null"}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {stations.length === 0 && (
                  <div className="flex items-center justify-center h-full p-4 text-gray-500 text-sm">
                    {t("noStationsAvailable")}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Normal map only view, no metrics panel
            <div className="flex-1 h-full bg-gray-50 rounded-lg overflow-hidden">
              <MapComponentDash
                stations={stations}
                onSelectStation={handleStationSelect}
                generalSettings={generalSettings}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enlarged Map Modal with metrics panel */}
      {isMapEnlarged && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 max-w-full max-h-screen overflow-hidden">
          <div className="bg-white rounded-lg w-full h-full max-w-7xl max-h-[95vh] flex flex-col md:flex-row overflow-hidden">
            {/* Map Section */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex items-center justify-between p-4 border-b bg-white">
                <h2 className="text-lg font-semibold">{t("mapView")}</h2>
                <button
                  onClick={toggleMapSize}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                  title="Minimize Map"
                >
                  <Minimize2 className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 p-4 min-h-0">
                <div className="h-full bg-gray-50 rounded-lg overflow-hidden">
                  <MapComponentDash
                    stations={stations}
                    onSelectStation={handleStationSelect}
                    generalSettings={generalSettings}
                  />
                </div>
              </div>
            </div>

            {/* Metrics Panel - Simple List Style */}
            {selectedStation && metrics && metrics.length > 0 && (
              <div className="w-80 bg-white border-l p-4 overflow-y-auto">
                <h3 className="font-semibold text-base mb-1">
                  {selectedStation.name}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Last read:{" "}
                  {selectedStation.lastUpdated
                    ? formatUTCString(selectedStation.lastUpdated)
                    : dayjs().tz("Asia/Dubai").format("MMM DD YYYY, HH:mm")}
                </p>

                <div className="space-y-2">
                  {metrics.map((metric) => (
                    <div
                      key={metric.id}
                      className="flex items-center justify-between py-1"
                    >
                      <div className="flex items-center">
                        <span
                          className="inline-block rounded-full w-3 h-3 flex-shrink-0 mr-2"
                          style={{ backgroundColor: metric.color }}
                        />
                        <span className="text-sm text-gray-700">
                          {translateMetricTitle(metric.title)}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {metric.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
