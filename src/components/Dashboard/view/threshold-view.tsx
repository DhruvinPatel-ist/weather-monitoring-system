"use client";

import { useRef, useEffect, useMemo, useCallback, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAlerts } from "@/hooks/useAlerts";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { ArrowUp, ArrowDown } from "lucide-react";

dayjs.extend(utc);
dayjs.extend(timezone);

// Static column configuration
const COLUMN_WIDTHS = [
  { key: "date", width: "w-[120px]" },
  { key: "stationName", width: "w-[180px]" },
  { key: "parameter", width: "w-[140px]" },
  { key: "thresholdName", width: "w-[280px]" },
  { key: "interval", width: "w-[100px]" },
  { key: "thresholdValue", width: "w-[120px]" },
  { key: "timestamp", width: "w-[120px]" },
];

const SKELETON_ROWS = Array.from({ length: 10 }, (_, i) => i);
const SKELETON_CELLS = Array.from({ length: 7 }, (_, i) => i);

interface Station {
  id: string;
  title: string;
}

interface AlertItem {
  id: string;
  site_id: string;
  attribute_id: string;
  threshold_value: number;
  priority: string;
  CreatedAt: string;
  updatedAt: string;
  threshold_name: string;
  interval: string;
  attributeName: string;
  siteName: string;
  SiteID?: string;
  ParameterID?: string;
  ID?: string;
  AlertID?: number;
}

type DisplayRow = {
  id: string;
  date: string;
  stationName: string;
  parameter: string;
  thresholdName: string;
  interval: string;
  thresholdValue: number;
  timestamp: string;
};

interface ThresholdViewProps {
  timeframe: any;
  stations: Station[];
  dateTimeRange?: string;
}

export default function ThresholdView({
  timeframe,
  stations,
  dateTimeRange: propDateTimeRange,
}: ThresholdViewProps) {
  const t = useTranslations("Admin");
  const commonT = useTranslations("Common");
  const dashboardT = useTranslations("Dashboard");
  const [dateSortDirection, setDateSortDirection] = useState<"asc" | "desc">(
    "desc"
  );
  const toggleDateSort = () => {
    setDateSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  // Memoize date range calculation
  const dateTimeRange = useMemo(() => {
    if (propDateTimeRange) {
      return propDateTimeRange;
    }
    const now = dayjs().tz("Asia/Dubai");

    switch (timeframe) {
      case "live":
        return `${now
          .subtract(1, "day")
          .format("YYYY-MM-DDTHH:mm:ss.000")}/${now.format(
          "YYYY-MM-DDTHH:mm:ss.000"
        )}`;
      case "lastDay":
        const yest = now.subtract(1, "day").format("YYYY-MM-DD");
        return `${yest}T00:00:00.000/${yest}T23:59:00.000`;
      case "lastWeek":
        return `${now
          .subtract(6, "day")
          .format("YYYY-MM-DDTHH:mm:ss.000")}/${now.format(
          "YYYY-MM-DDTHH:mm:ss.000"
        )}`;
      case "lastMonth":
        return `${now
          .subtract(1, "month")
          .format("YYYY-MM-DDTHH:mm:ss.000")}/${now.format(
          "YYYY-MM-DDTHH:mm:ss.000"
        )}`;
      case "lastYear":
        return `${now
          .subtract(1, "year")
          .format("YYYY-MM-DDTHH:mm:ss.000")}/${now.format(
          "YYYY-MM-DDTHH:mm:ss.000"
        )}`;
      default:
        return "";
    }
  }, [timeframe, propDateTimeRange]);

  const { data: rawData = [], isLoading } = useAlerts(timeframe, dateTimeRange);

  // Normalize data to handle different field naming conventions
  const data = useMemo(() => {
    if (!Array.isArray(rawData) || rawData.length === 0) return [];

    return rawData.map((item) => ({
      id: item.id || item.ID || String(Math.random()),
      site_id: item.site_id || item.SiteID || "",
      attribute_id: item.attribute_id || item.ParameterID || "",
      threshold_value: item.threshold_value,
      priority: item.priority,
      CreatedAt: item.CreatedAt,
      threshold_name: item.threshold_name,
      interval: String(item.interval),
      attributeName: item.attributeName,
      siteName: item.siteName,
    }));
  }, [rawData]);

  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Optimize scroll sync with useCallback
  const syncScroll = useCallback(() => {
    if (headerRef.current && bodyRef.current) {
      headerRef.current.scrollLeft = bodyRef.current.scrollLeft;
    }
  }, []);

  const syncBack = useCallback(() => {
    if (headerRef.current && bodyRef.current) {
      bodyRef.current.scrollLeft = headerRef.current.scrollLeft;
    }
  }, []);

  useEffect(() => {
    const header = headerRef.current;
    const body = bodyRef.current;
    if (!header || !body) return;

    body.addEventListener("scroll", syncScroll);
    header.addEventListener("scroll", syncBack);
    return () => {
      body.removeEventListener("scroll", syncScroll);
      header.removeEventListener("scroll", syncBack);
    };
  }, [syncScroll, syncBack]);

  // Memoize format functions
  const formatDate = useCallback(
    (iso: string) =>
      new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    []
  );

  const formatTime = useCallback(
    (iso: string) => dayjs.utc(iso).format("HH:mm:ss"),
    []
  );

  // Memoize station lookup map
  const stationMap = useMemo(() => {
    const map = new Map<string, string>();
    stations.forEach((station) => {
      map.set(station.id, station.title);
    });
    return map;
  }, [stations]);

  const getStationName = useCallback(
    (site_id: string): string => {
      return stationMap.get(site_id) || `${t("Station")} ${site_id}`;
    },
    [stationMap, t]
  );

  // Optimize display data processing
  const displayData: DisplayRow[] = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];

    return (data as AlertItem[])
      .slice()
      .sort((a, b) => {
        const aTime = dayjs(a.CreatedAt).valueOf();
        const bTime = dayjs(b.CreatedAt).valueOf();
        return dateSortDirection === "desc" ? bTime - aTime : aTime - bTime;
      })
      .map((item) => ({
        id: item.id || item.ID || "",
        date: formatDate(item.CreatedAt),
        stationName:
          item.siteName || getStationName(item.site_id || item.SiteID || ""),
        parameter:
          item.attributeName ||
          `${t("Parameter")} ${item.attribute_id || item.ParameterID || ""}`,
        thresholdName: item.threshold_name,
        thresholdValue: item.threshold_value,
        interval: item.interval,
        timestamp: formatTime(item.CreatedAt),
      }));
  }, [data, formatDate, getStationName, formatTime, t, dateSortDirection]);

  // Memoize table headers
  const tableHeaders = useMemo(
    () => [
      { key: "date", label: commonT("Created at") },
      { key: "stationName", label: t("Station Name") },
      { key: "parameter", label: t("Parameter") },
      { key: "thresholdName", label: t("Threshold Name") },
      { key: "interval", label: t("Interval") },
      { key: "thresholdValue", label: t("Threshold Value") },
      { key: "timestamp", label: t("Timestamp") },
    ],
    [commonT, t]
  );

  return (
    <div className="rounded-md bg-transparent p-2 h-full">
      <div className="h-full bg-white1 flex flex-col rounded-md p-2">
        <div className="overflow-hidden">
          <div
            ref={headerRef}
            className="max-h-[calc(100vh-150px)] hide-scrollbar"
            style={{ overflowY: "hidden" }}
          >
            <div className="min-w-[1060px] hide-scrollbar">
              <Table className="table-fixed w-full">
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    {tableHeaders.map((header, index) => {
                      const isDateCol = header.key === "date";
                      return (
                        <TableHead
                          key={header.key}
                          className={`${COLUMN_WIDTHS[index].width} font-semibold text-center ${
                            isDateCol ? "cursor-pointer select-none" : ""
                          }`}
                          onClick={isDateCol ? toggleDateSort : undefined}
                        >
                          {isDateCol ? (
                            <div className="flex items-center justify-center gap-2">
                              <span>{header.label}</span>
                              <span className="flex flex-col">
                                <ArrowUp
                                  className={`h-3 w-3 -mb-0.5 ${
                                    dateSortDirection === "asc"
                                      ? "text-blue3 opacity-100"
                                      : "text-gray-400 opacity-40"
                                  }`}
                                />
                                <ArrowDown
                                  className={`h-3 w-3 -mt-0.5 ${
                                    dateSortDirection === "desc"
                                      ? "text-blue3 opacity-100"
                                      : "text-gray-400 opacity-40"
                                  }`}
                                />
                              </span>
                            </div>
                          ) : (
                            header.label
                          )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
              </Table>
            </div>
          </div>

          <div ref={bodyRef} className="overflow-auto h-[calc(100%-40px)]">
            <div className="min-w-[1060px]">
              <Table className="table-fixed w-full">
                <TableBody>
                  {isLoading ? (
                    SKELETON_ROWS.map((i) => (
                      <TableRow key={i}>
                        {SKELETON_CELLS.map((j) => (
                          <TableCell
                            key={j}
                            className="w-[120px] py-4 text-center"
                          >
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : displayData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-6 text-gray-500"
                      >
                        {dashboardT("No data on selected")}
                        {/* <strong>{timeframe}</strong>. */}
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayData.map((row) => (
                      <TableRow key={row.id} className="border-b">
                        <TableCell className="w-[120px] py-4 text-center">
                          {row.date}
                        </TableCell>
                        <TableCell className="w-[180px] py-4 text-center">
                          {row.stationName}
                        </TableCell>
                        <TableCell className="w-[140px] py-4 text-center">
                          {row.parameter}
                        </TableCell>
                        <TableCell className="w-[280px] py-4 text-center">
                          {row.thresholdName}
                        </TableCell>
                        <TableCell className="w-[100px] py-4 text-center">
                          {row.interval}
                        </TableCell>
                        <TableCell className="w-[120px] py-4 text-center">
                          {row.thresholdValue}
                        </TableCell>
                        <TableCell className="w-[120px] py-4 text-center">
                          {row.timestamp}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
