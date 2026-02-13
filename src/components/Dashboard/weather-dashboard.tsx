"use client";

import { useState, useEffect, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import ParameterView from "@/components/Dashboard/view/parameter-view";
import TableView from "@/components/Dashboard/view/table-view";
import ThresholdView from "@/components/Dashboard/view/threshold-view";
import DownloadReportComponent from "./download-export";
import { Table } from "@/icons/dashboard/Table";
import { Widget } from "@/icons/dashboard/Widget";
import { Alert } from "@/icons/dashboard/Alert";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useMessages } from "next-intl";
import {
  MetricType,
  Station,
} from "@/components/Dashboard/view/parameter-view";
import { useMetrics } from "@/hooks/useMetrics";
import { useStations } from "@/hooks/useDashboard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

export default function Dashboard() {
  const t = useTranslations("Dashboard");
  const sl = useTranslations("StationsList");
  const messages = useMessages() as Record<string, any>;

  const locale = useLocale();
  const isRTL = locale === "ar";
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [activeView, setActiveView] = useState<
    "parameter" | "table" | "threshold"
  >("parameter");

  // === i18n fallback helpers for station names ===
  const hasKeyInStationsList = (key: string) => {
    const ns = messages?.StationsList as Record<string, any> | undefined;
    return (
      !!ns &&
      Object.prototype.hasOwnProperty.call(ns, key) &&
      ns[key] != null &&
      String(ns[key]).length > 0
    );
  };
  const translateStationName = (name: string) => {
    if (!name) return "Unknown Station";
    // keep any special-case fallback you need
    if (name === "Weather Station") return "Weather Station";
    return hasKeyInStationsList(name) ? sl(name) : name;
  };
  // ===============================================

  const timeframeOptions = [
    { label: t("Live Data"), value: "live" },
    { label: t("Last Day"), value: "lastDay" },
    { label: t("Last week"), value: "lastWeek" },
    { label: t("Last month"), value: "lastMonth" },
    { label: t("Last year"), value: "lastYear" },
  ];

  const [selectedTimeframe, setSelectedTimeframe] = useState(
    timeframeOptions[0]
  );

  const { data: stationsData = [], isLoading: isStationsLoading } =
    useStations();
  const stations = stationsData.map((station) => ({
    ...station,
    title: station.name || "",
  }));

  // Extend dayjs with plugins
  dayjs.extend(utc);
  dayjs.extend(timezone);

  const now = dayjs().tz("Asia/Dubai");
  let dateTimeRange: string;

  switch (selectedTimeframe.value) {
    case "live": {
      const oneDayAgo = now.subtract(1, "day");
      dateTimeRange = `${oneDayAgo.format(
        "YYYY-MM-DDTHH:mm:ss.000"
      )}/${now.format("YYYY-MM-DDTHH:mm:ss.000")}`;
      break;
    }
    case "lastDay": {
      const yesterday = now.subtract(1, "day").format("YYYY-MM-DD");
      dateTimeRange = `${yesterday}T00:00:00.000/${yesterday}T23:59:00.000`;
      break;
    }
    case "lastWeek": {
      const weekAgo = now.subtract(6, "day");
      dateTimeRange = `${weekAgo.format(
        "YYYY-MM-DDTHH:mm:ss.000"
      )}/${now.format("YYYY-MM-DDTHH:mm:ss.000")}`;
      break;
    }
    case "lastMonth": {
      const monthAgo = now.subtract(1, "month");
      dateTimeRange = `${monthAgo.format(
        "YYYY-MM-DDTHH:mm:ss.000"
      )}/${now.format("YYYY-MM-DDTHH:mm:ss.000")}`;
      break;
    }
    case "lastYear": {
      const yearAgo = now.subtract(1, "year");
      dateTimeRange = `${yearAgo.format(
        "YYYY-MM-DDTHH:mm:ss.000"
      )}/${now.format("YYYY-MM-DDTHH:mm:ss.000")}`;
      break;
    }
    default:
      dateTimeRange = "";
  }

  const { data: metrics = [], isLoading: isMetricsLoading } = useMetrics(
    selectedStation?.id,
    selectedTimeframe.value,
    dateTimeRange
  ) as unknown as {
    data: {
      id: MetricType;
      title: string;
      value: string | number;
      unit: string;
      icon: ReactNode;
      color: string;
      gaugeValue: number;
      min: number;
      max: number;
      ParameterID?: number;
    }[];
    isLoading: boolean;
  };

  const title = {
    parameter: t("Dashboard"),
    table: t("Dashboard"),
    threshold: t("Alerts"),
  };

  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

  useEffect(() => {
    if (stations.length > 0 && !selectedStation) {
      setSelectedStation(stations[0]);
    }
  }, [stations]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const checkDeviceType = () => {
      setIsMobileOrTablet(window.innerWidth < 770);
    };
    checkDeviceType();
    window.addEventListener("resize", checkDeviceType);
    return () => window.removeEventListener("resize", checkDeviceType);
  }, []);

  if (isStationsLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div
        className={cn(
          "px-2 mt-2 mb-2 flex justify-end items-center gap-2",
          isMobileOrTablet && "flex-col items-start gap-4"
        )}
      >
        <div className="w-full px-2 mt-2">
          <h2 className="text-xl font-bold">{title[activeView]}</h2>
        </div>

        <div
          className={cn(
            "inline-flex items-center rounded-lg bg-transparent shadow-sm",
            isMobileOrTablet && "w-1/3 justify-between items-center"
          )}
          dir={isRTL ? "rtl" : "ltr"}
        >
          <Button
            variant="ghost"
            className={cn(
              isRTL
                ? "border-l-2 rounded-l-none border-[#e6e6e6] bg-white px-4 hover:bg-[#f5f8fa]"
                : "border-r-2 rounded-r-none border-[#e6e6e6] bg-white px-4 hover:bg-[#f5f8fa]",
              activeView === "parameter" && "bg-[#f5f8fa]",
              isMobileOrTablet && "w-full justify-start"
            )}
            onClick={() => setActiveView("parameter")}
            title={t("Dashboard")}
          >
            <Widget
              className={`${isMobileOrTablet ? "!h-6 !w-6" : "!h-7 !w-7"}`}
              color={activeView === "parameter" ? "#009daa" : "#8D969C"}
            />
            {isMobileOrTablet && (
              <span className={isRTL ? "mr-2" : "ml-2"}>{t("Dashboard")}</span>
            )}
          </Button>
          <Button
            variant="ghost"
            className={cn(
              isRTL
                ? "border-l-2 rounded-none border-[#e6e6e6] bg-white px-4 hover:bg-[#f5f8fa]"
                : "border-r-2 rounded-none border-[#e6e6e6] bg-white px-4 hover:bg-[#f5f8fa]",
              activeView === "table" && "bg-[#f5f8fa]",
              isMobileOrTablet && "w-full justify-start"
            )}
            onClick={() => setActiveView("table")}
            title={t("Table View")}
          >
            <Table
              className={`${isMobileOrTablet ? "!h-6 !w-6" : "!h-7 !w-7"}`}
              color={activeView === "table" ? "#009daa" : "#8D969C"}
            />
            {isMobileOrTablet && (
              <span className={isRTL ? "mr-2" : "ml-2"}>{t("Table View")}</span>
            )}
          </Button>
          <Button
            variant="ghost"
            className={cn(
              isRTL
                ? "bg-white px-4 hover:bg-[#f5f8fa] rounded-r-none"
                : "bg-white px-4 hover:bg-[#f5f8fa] rounded-l-none",
              activeView === "threshold" && "bg-[#f5f8fa]",
              isMobileOrTablet && "w-full justify-start"
            )}
            onClick={() => setActiveView("threshold")}
            title={t("Alerts")} // Tooltip text when hovered
          >
            <Alert
              className={`${isMobileOrTablet ? "!h-6 !w-6" : "!h-7 !w-7"}`}
              color={activeView === "threshold" ? "#009daa" : "#8D969C"}
            />
            {isMobileOrTablet && (
              <span className={isRTL ? "mr-2" : "ml-2"}>{t("Alerts")}</span>
            )}
          </Button>
        </div>

        <div
          className={cn(
            "flex items-center gap-4",
            isMobileOrTablet ? "w-full justify-start gap-2" : "gap-2"
          )}
        >
          <div
            className={cn(
              "flex flex-row",
              isMobileOrTablet ? "justify-between gap-2 w-full" : "gap-2"
            )}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={
                    isMobileOrTablet ? "bg-white w-[100px]" : "bg-white"
                  }
                >
                  {selectedTimeframe.label} <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                {timeframeOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setSelectedTimeframe(option)}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {activeView == "table" && (
              <div className="space-x-2">
                <Select
                  value={selectedStation?.id ?? ""}
                  onValueChange={(value) => {
                    const station = stations.find((s) => s.id === value);
                    if (station) setSelectedStation(station);
                  }}
                >
                  <SelectTrigger className="w-full text-black bg-white">
                    <SelectValue placeholder={"selectSite"} />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {translateStationName(s.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {activeView !== "threshold" && (
              <DownloadReportComponent
                timeframe={selectedTimeframe}
                selectedStation={selectedStation}
                className={`${isMobileOrTablet ? "full" : "w-full"}`}
              />
            )}
          </div>
        </div>
      </div>
      <div
        className={cn(
          "flex flex-col",
          isMobileOrTablet
            ? "max-h-[calc(100%-60px)] overflow-y-auto hide-scrollbar"
            : "overflow-y-auto h-[calc(100%-55px)] hide-scrollbar"
        )}
      >
        <div
          className={cn(
            "flex-grow md:h-[calc(100%-100px)]",
            isMobileOrTablet ? "" : ""
          )}
        >
          {activeView === "parameter" && (
            <ParameterView
              stations={stations}
              timeframe={selectedTimeframe}
              metrics={metrics}
              selectedStation={selectedStation}
              setSelectedStation={setSelectedStation}
              isMetricsLoading={isMetricsLoading}
            />
          )}

          {activeView === "table" && (
            <TableView
              selectedStation={selectedStation}
              timeframe={selectedTimeframe}
              stations={stations}
            />
          )}
          {activeView === "threshold" && (
            <ThresholdView
              timeframe={selectedTimeframe.value}
              stations={stations}
            />
          )}
        </div>
      </div>
    </div>
  );
}
