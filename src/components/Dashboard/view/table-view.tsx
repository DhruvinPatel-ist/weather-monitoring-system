"use client";

import { useMemo, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";
import { Station } from "./parameter-view";
import { useTableData } from "@/hooks/useMetrics";
import { useStationParameters } from "@/hooks/useParameters";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

interface TableViewProps {
  stations: Station[];
  selectedStation: Station | null;
  timeframe: any;
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
}: TableViewProps) {
  const t = useTranslations("Dashboard");

  // Initialize dayjs plugins outside of component or use static initialization
  dayjs.extend(utc);
  dayjs.extend(timezone);

  // Fetch station parameters for the selected station
  const { data: stationParameters, isLoading: isParametersLoading } =
    useStationParameters(selectedStation?.id);

  // Memoize date range calculation
  const dateTimeRange = useMemo(() => {
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
  }, [timeframe.value]);

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
      return dateB - dateA; // descending order: latest first
    });
  }, [tableData, stationParameters, parameterMap, selectedStation?.name]);

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
              <div className="overflow-auto max-h-[calc(100vh-150px)]">
                <Table className="min-w-full text-left">
                  <TableHeader className="sticky top-0 bg-white border-b z-10">
                    <TableRow>
                      <TableHead className="min-w-[150px] px-4 py-2 whitespace-nowrap font-semibold text-center">
                        {t("Date")}
                      </TableHead>
                      <TableHead className="min-w-[150px] px-4 py-2 whitespace-nowrap font-semibold text-center">
                        {t("Station Name")}
                      </TableHead>
                      {tableHeaders.map(({ key, label, unit }) => (
                        <TableHead
                          key={key}
                          className="min-w-[150px] px-4 py-2 whitespace-nowrap text-center font-semibold capitalize"
                        >
                          {label}
                          {unit}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {isAllDataLoading &&
                      [...Array(6)].map((_, i) => (
                        <TableRow key={i} className="border-b">
                          <TableCell
                            colSpan={tableHeaders.length + 2}
                            className="px-4 py-2"
                          >
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        </TableRow>
                      ))}

                    {!isAllDataLoading &&
                      processedTableData.map((row: any, index: number) => {
                        const formattedDate = formatUTCString(
                          row.CreatedAt || row.intervalStart
                        );

                        return (
                          <TableRow
                            key={`${
                              row.intervalStart || row.CreatedAt
                            }-${index}`}
                            className={
                              index % 2 === 0
                                ? "bg-white border-b"
                                : "bg-gray-50 border-b"
                            }
                          >
                            <TableCell
                              className="min-w-[150px] px-4 py-2 whitespace-nowrap text-center"
                              dir="ltr"
                            >
                              {formattedDate}
                            </TableCell>
                            <TableCell className="min-w-[150px] px-4 py-2 whitespace-nowrap text-center">
                              {stationName}
                            </TableCell>
                            {tableHeaders.map(({ key }) => (
                              <TableCell
                                key={key}
                                className="min-w-[150px] px-4 py-2 whitespace-nowrap text-center"
                              >
                                {formatCellValue(row[key])}
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
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
