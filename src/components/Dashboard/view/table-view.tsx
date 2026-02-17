"use client";

import { useMemo, useCallback, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";
import { Station } from "./parameter-view";
import { useTableData } from "@/hooks/useMetrics";
import { useStationParameters } from "@/hooks/useParameters";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { ArrowUp, ArrowDown } from "lucide-react";

interface TableViewProps {
  stations: Station[];
  selectedStation: Station | null;
  timeframe: any;
  dateTimeRange?: string;
}

// Memoized format function to avoid recreation
const formatUTCString = (dateString: string): string => {
  const [datePart, timePartWithMsZ] = dateString.split("T");
  const [yyyy, mm, dd] = datePart.split("-");
  const [HH, MM, SSWithMs] = timePartWithMsZ.replace("Z", "").split(":");
  const SS = SSWithMs?.split(".")[0] ?? "00";
  return `${dd}-${mm}-${yyyy} ${HH}:${MM}:${SS}`;
};

export default function TableView({
  timeframe,
  selectedStation,
  dateTimeRange: propDateTimeRange,
}: TableViewProps) {
  const t = useTranslations("Dashboard");
  const [dateSortDirection, setDateSortDirection] = useState<"asc" | "desc">("desc");

  // Initialize dayjs plugins outside of component or use static initialization
  dayjs.extend(utc);
  dayjs.extend(timezone);

  // Fetch station parameters for the selected station
  const { data: stationParameters, isLoading: isParametersLoading } =
    useStationParameters(selectedStation?.id);

  // Memoize date range calculation
  const dateTimeRange = useMemo(() => {
    if (propDateTimeRange) {
      return propDateTimeRange;
    }
    const now = dayjs().tz("Asia/Dubai");

    switch (timeframe.value) {
      case "live":
        const oneDayAgo = now.subtract(1, "day");
        return `${oneDayAgo.format("YYYY-MM-DDTHH:mm:ss.000")}/${now.format(
          "YYYY-MM-DDTHH:mm:ss.000"
        )}`;

      case "lastDay":
        const yesterday = now.subtract(1, "day").format("YYYY-MM-DD");
        return `${yesterday}T00:00:00.000/${yesterday}T23:59:00.000`;

      case "lastWeek":
        const weekAgo = now.subtract(6, "day");
        return `${weekAgo.format("YYYY-MM-DDTHH:mm:ss.000")}/${now.format(
          "YYYY-MM-DDTHH:mm:ss.000"
        )}`;

      case "lastMonth":
        const monthAgo = now.subtract(1, "month");
        return `${monthAgo.format("YYYY-MM-DDTHH:mm:ss.000")}/${now.format(
          "YYYY-MM-DDTHH:mm:ss.000"
        )}`;

      case "lastYear":
        const yearAgo = now.subtract(1, "year");
        return `${yearAgo.format("YYYY-MM-DDTHH:mm:ss.000")}/${now.format(
          "YYYY-MM-DDTHH:mm:ss.000"
        )}`;

      default:
        return "";
    }
  }, [timeframe.value, propDateTimeRange]);

  const { data: tableData, isLoading } = useTableData(
    selectedStation?.id,
    timeframe.value,
    dateTimeRange
  );

  // Create a parameter mapping for easy lookup
  const parameterMap = useMemo(() => {
    if (!stationParameters) return new Map();

    const map = new Map();
    stationParameters.forEach((param) => {
      map.set(param.ParameterID, {
        name: param.ParameterName,
        unit: param.UnitName,
      });
    });
    return map;
  }, [stationParameters]);

  // Process raw table data
  const processedTableData = useMemo(() => {
    if (!tableData || !stationParameters?.length) return [];

    const dataArray = Array.isArray(tableData)
      ? tableData
      : tableData && typeof tableData === "object"
      ? [tableData]
      : [];

    // Group data by timestamp (CreatedAt)
    const groupedByTimestamp = dataArray.reduce((acc, item) => {
      const timestamp = item.CreatedAt || item.intervalStart;
      if (!acc[timestamp]) {
        acc[timestamp] = {
          CreatedAt: timestamp,
          stationName: selectedStation?.name || "N/A",
        };
      }

      // Get parameter name from map and use it as the key
      const parameter = parameterMap.get(item.ParameterID);
      if (parameter) {
        const safeKey = parameter.name.replace(/\s+/g, "");
        acc[timestamp][safeKey] = item.Parametervalue;
      }

      return acc;
    }, {});

    // Convert back to array and sort by date
    return Object.values(groupedByTimestamp).sort((a: any, b: any) => {
      const dateA = new Date(a.CreatedAt).getTime();
      const dateB = new Date(b.CreatedAt).getTime();
      return dateSortDirection === "desc" ? dateB - dateA : dateA - dateB;
    });
  }, [tableData, stationParameters, parameterMap, selectedStation?.name, dateSortDirection]);

  // Dynamic table headers based on parameters
  const tableHeaders = useMemo(() => {
    if (!stationParameters) return [];

    return stationParameters.map((param) => {
      const safeKey = param.ParameterName.replace(/\s+/g, "");
      return {
        key: safeKey,
        label: param.ParameterName,
        unit: param.UnitName ? ` (${param.UnitName})` : "",
        parameterId: param.ParameterID,
      };
    });
  }, [stationParameters]);

  // Memoize cell value formatter
  const formatCellValue = useCallback((value: any) => {
    if (value !== undefined && value !== null) {
      return typeof value === "number" ? value.toFixed(2) : value;
    }
    return "--";
  }, []);

  const handleDateSort = useCallback(() => {
    setDateSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
  }, []);

  // Memoize station name
  const stationName = selectedStation?.name || "N/A";

  const showTable =
    isLoading || isParametersLoading || processedTableData.length > 0;
  const isAllDataLoading = isLoading || isParametersLoading;

  return (
    <div className="rounded-md h-full p-4 bg-white1 mx-4">
      <div className="bg-gray-50 h-full">
        <div className="h-full flex flex-col">
          <div className="border border-gray-200 rounded-md overflow-hidden">
            {showTable ? (
              <div className="overflow-auto max-h-[calc(100vh-150px)] relative">
                <table className="min-w-full text-left w-full caption-bottom text-sm border-none">
                  <thead className="sticky top-0 bg-white border-b z-10 [&_tr]:border-none">
                    <tr>
                      <th
                        className="min-w-[150px] px-4 py-2 whitespace-nowrap font-semibold text-center cursor-pointer hover:bg-gray-100 select-none text-foreground h-10 align-middle"
                        onClick={handleDateSort}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {t("Date")}
                          <div className="flex flex-col">
                            <ArrowUp 
                              className={`h-3 w-3 ${
                                dateSortDirection === "asc" 
                                  ? "text-blue3 opacity-100" 
                                  : "text-gray-400 opacity-30"
                              }`} 
                            />
                            <ArrowDown 
                              className={`h-3 w-3 -mt-1 ${
                                dateSortDirection === "desc" 
                                  ? "text-blue3 opacity-100" 
                                  : "text-gray-400 opacity-30"
                              }`} 
                            />
                          </div>
                        </div>
                      </th>
                      <th className="min-w-[150px] px-4 py-2 whitespace-nowrap font-semibold text-center text-foreground h-10 align-middle">
                        {t("Station Name")}
                      </th>
                      {tableHeaders.map(({ key, label, unit }) => (
                        <th
                          key={key}
                          className="min-w-[150px] px-4 py-2 whitespace-nowrap text-center font-semibold capitalize text-foreground h-10 align-middle"
                        >
                          {label}
                          {unit}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="[&_tr:last-child]:border-none">
                    {isAllDataLoading &&
                      [...Array(6)].map((_, i) => (
                        <tr key={i} className="border-b hover:bg-muted/50 transition-colors">
                          <td
                            colSpan={tableHeaders.length + 2}
                            className="px-4 py-2 align-middle whitespace-nowrap"
                          >
                            <Skeleton className="h-4 w-full" />
                          </td>
                        </tr>
                      ))}

                    {!isAllDataLoading &&
                      processedTableData.map((row: any, index: number) => {
                        const formattedDate = formatUTCString(
                          row.CreatedAt || row.intervalStart
                        );

                        return (
                          <tr
                            key={`${
                              row.intervalStart || row.CreatedAt
                            }-${index}`}
                            className={
                              index % 2 === 0
                                ? "bg-white border-b hover:bg-muted/50 transition-colors"
                                : "bg-gray-50 border-b hover:bg-muted/50 transition-colors"
                            }
                          >
                            <td
                              className="min-w-[150px] px-4 py-2 whitespace-nowrap text-center align-middle"
                              dir="ltr"
                            >
                              {formattedDate}
                            </td>
                            <td className="min-w-[150px] px-4 py-2 whitespace-nowrap text-center align-middle">
                              {stationName}
                            </td>
                            {tableHeaders.map(({ key }) => (
                              <td
                                key={key}
                                className="min-w-[150px] px-4 py-2 whitespace-nowrap text-center align-middle"
                              >
                                {formatCellValue(row[key])}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 text-sm text-gray-700">
                {t("No data on selected")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
