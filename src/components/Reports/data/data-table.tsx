/* eslint-disable */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { ParameterService, Parameter } from "@/services/parameterService";
import { ArrowUp, ArrowDown } from "lucide-react";

// New interfaces for the dynamic data structure
interface GeneratedDataItem {
  SiteID: number;
  ParameterID: number;
  Parametervalue: number;
  CreatedAt: string;
}

interface ProcessedTableRow {
  siteId: number;
  siteName: string;
  createdAt: string;
  parameters: Record<number, { name: string; value: number; unit: string }>;
}

interface TableColumn {
  key: string;
  label: string;
  width: string;
  parameterId?: number;
}

export default function SiteDataTable({
  generatedData,
  siteMetricsMap,
  selectedMetrics,
}: {
  generatedData: GeneratedDataItem[];
  siteMetricsMap?: Record<string, Record<string, boolean>>;
  selectedMetrics?: Record<string, boolean>;
}) {
  const [selectedSites, setSelectedSites] = useState<Record<string, boolean>>(
    {}
  );
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [processedData, setProcessedData] = useState<ProcessedTableRow[]>([]);
  const [timestampSortDirection, setTimestampSortDirection] = useState<
    "asc" | "desc"
  >("desc");

  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Translation hooks
  const t = useTranslations("Dashboard");
  const commonT = useTranslations("Common");
  const reportsT = useTranslations("Reports");

  // Fetch parameter metadata
  useEffect(() => {
    const fetchParameters = async () => {
      try {
        setLoading(true);
        const params = await ParameterService.getAllParameter();
        setParameters(params);
        console.log("Parameters fetched for table:", params);
      } catch (error) {
        console.error("Error fetching parameters for table:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchParameters();
  }, []);

  // Process generated data into table rows
  useEffect(() => {
    if (!generatedData.length || !parameters.length) {
      setProcessedData([]);
      return;
    }

    console.log("Processing table data:", { generatedData, parameters });

    // Create parameter lookup map
    const parameterMap = new Map<number, Parameter>();
    parameters.forEach((param) => {
      parameterMap.set(param.ParameterID, param);
    });

    // Group data by timestamp and site
    const groupedData = new Map<string, Map<number, GeneratedDataItem[]>>();

    generatedData.forEach((item) => {
      const timeKey = item.CreatedAt;
      if (!groupedData.has(timeKey)) {
        groupedData.set(timeKey, new Map());
      }

      const timeGroup = groupedData.get(timeKey)!;
      if (!timeGroup.has(item.SiteID)) {
        timeGroup.set(item.SiteID, []);
      }

      timeGroup.get(item.SiteID)!.push(item);
    });

    // Convert to table rows
    const rows: ProcessedTableRow[] = [];

    groupedData.forEach((siteData, timestamp) => {
      siteData.forEach((items, siteId) => {
        // Get site name from first parameter found for this site
        const firstItem = items[0];
        const firstParam = parameterMap.get(firstItem.ParameterID);
        const siteName = firstParam?.SiteName || `Site ${siteId}`;

        // Collect all parameters for this timestamp and site
        const parameters: Record<
          number,
          { name: string; value: number; unit: string }
        > = {};

        items.forEach((item) => {
          const param = parameterMap.get(item.ParameterID);
          if (param) {
            parameters[item.ParameterID] = {
              name: param.ParameterName,
              value: item.Parametervalue,
              unit: param.UnitName,
            };
          }
        });

        rows.push({
          siteId,
          siteName,
          createdAt: timestamp,
          parameters,
        });
      });
    });

    // Sort by timestamp (most recent first)
    rows.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    console.log("Processed table rows:", rows);
    setProcessedData(rows);
  }, [generatedData, parameters]);

  // Get unique sites from processed data
  const sites = useMemo(() => {
    const siteMap = new Map<number, string>();
    processedData.forEach((row) => {
      siteMap.set(row.siteId, row.siteName);
    });
    return Array.from(siteMap.entries()).map(([id, name]) => ({
      id: id.toString(),
      name,
    }));
  }, [processedData]);

  // Get unique parameters that appear in the data
  const availableParameters = useMemo(() => {
    const paramSet = new Set<number>();
    processedData.forEach((row) => {
      Object.keys(row.parameters).forEach((paramId) => {
        paramSet.add(parseInt(paramId));
      });
    });
    return Array.from(paramSet)
      .map((paramId) => {
        const param = parameters.find((p) => p.ParameterID === paramId);
        return {
          id: paramId,
          name: param?.ParameterName || `Parameter ${paramId}`,
          unit: param?.UnitName || "",
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [processedData, parameters]);

  // Initialize selected sites
  useEffect(() => {
    if (sites.length > 0) {
      const siteInit: Record<string, boolean> = {};
      sites.forEach((s) => (siteInit[s.id] = true));
      setSelectedSites(siteInit);
    }
  }, [sites]);

  // Filter data based on selected sites
  const filteredData = useMemo(() => {
    const selectedCount = Object.values(selectedSites).filter(Boolean).length;
    return selectedCount === 0
      ? processedData
      : processedData.filter((row) => selectedSites[row.siteId.toString()]);
  }, [processedData, selectedSites]);

  // Get parameters that should be visible based on site metrics selection
  const visibleParameters = useMemo(() => {
    if (!siteMetricsMap || Object.keys(siteMetricsMap).length === 0) {
      // If no filtering, show all available parameters
      return availableParameters;
    }

    const visibleParamIds = new Set<number>();

    // Check which parameters are selected for each site
    Object.entries(siteMetricsMap).forEach(([siteIdStr, siteMetrics]) => {
      Object.entries(siteMetrics).forEach(([paramIdStr, isSelected]) => {
        if (isSelected) {
          visibleParamIds.add(parseInt(paramIdStr));
        }
      });
    });

    return availableParameters.filter((param) => visibleParamIds.has(param.id));
  }, [availableParameters, siteMetricsMap]);

  // Filter data to only show rows that have data for selected parameters
  const finalFilteredData = useMemo(() => {
    if (!siteMetricsMap || Object.keys(siteMetricsMap).length === 0) {
      return filteredData;
    }

    return filteredData.filter((row) => {
      const siteMetrics = siteMetricsMap[row.siteId];
      if (!siteMetrics) return false;

      // Check if this row has any selected parameters
      const hasSelectedParameters = Object.entries(siteMetrics).some(
        ([paramIdStr, isSelected]) => {
          if (!isSelected) return false;
          const paramId = parseInt(paramIdStr);
          return row.parameters[paramId] !== undefined;
        }
      );

      return hasSelectedParameters;
    });
  }, [filteredData, siteMetricsMap]);

 const sortedData = useMemo(() => {
    const data = [...finalFilteredData];
    data.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timestampSortDirection === "desc" ? timeB - timeA : timeA - timeB;
    });
    return data;
  }, [finalFilteredData, timestampSortDirection]);
  // Define the columns to display
  const tableColumns = useMemo((): TableColumn[] => {
    const fixedColumns: TableColumn[] = [
      { key: "timestamp", label: "Timestamp", width: "w-[180px]" },
      { key: "siteName", label: "Station Name", width: "w-[200px]" },
    ];

    const parameterColumns: TableColumn[] = visibleParameters.map((param) => ({
      key: `param_${param.id}`,
      label: `${param.name} (${param.unit})`,
      width: "w-[180px]",
      parameterId: param.id,
    }));

    return [...fixedColumns, ...parameterColumns];
  }, [visibleParameters]);

  // Sync scrolling between header and body
  useEffect(() => {
    const header = headerRef.current;
    const body = bodyRef.current;
    if (!header || !body) return;

    const syncFromBody = (e: Event) => {
      const target = e.target as HTMLElement;
      if (header.scrollLeft !== target.scrollLeft) {
        header.scrollLeft = target.scrollLeft;
      }
    };

    const syncFromHeader = (e: Event) => {
      const target = e.target as HTMLElement;
      if (body.scrollLeft !== target.scrollLeft) {
        body.scrollLeft = target.scrollLeft;
      }
    };

    // Add event listeners with proper typing
    body.addEventListener("scroll", syncFromBody, { passive: true });
    header.addEventListener("scroll", syncFromHeader, { passive: true });

    return () => {
      body.removeEventListener("scroll", syncFromBody);
      header.removeEventListener("scroll", syncFromHeader);
    };
  }, [finalFilteredData.length]); // Re-run when data changes

  const columnWidths: Record<string, string> = {
    timestamp: "w-[180px]",
    siteName: "w-[200px]",
    default: "w-[180px]",
  };

  const toggleTimestampSort = () => {
    setTimestampSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  // Helper function to safely translate site names
  const getTranslatedSiteName = (siteName: string) => {
    return siteName;
  };

  // Function to format UTC string without timezone conversion
  function formatUTCString(dateString: string): string {
    const [datePart, timePartWithMsZ] = dateString.split("T");
    const [yyyy, mm, dd] = datePart.split("-");
    const [HH, MM, SSWithMs] = timePartWithMsZ.replace("Z", "").split(":");
    const SS = SSWithMs?.split(".")[0] ?? "00";
    return `${dd}-${mm}-${yyyy} ${HH}:${MM}:${SS}`;
  }

  // Format cell values
  function formatCellValue(value: any, columnKey: string): string {
    if (value === null || value === undefined) {
      return "-";
    }

    if (columnKey === "timestamp") {
      try {
        return formatUTCString(value);
      } catch (error) {
        console.log("Error formatting date:", error);
        return String(value);
      }
    }

    if (columnKey === "siteName") {
      return getTranslatedSiteName(String(value));
    }

    if (typeof value === "number") {
      return value.toFixed(2);
    }

    return String(value);
  }

  // Check if a specific parameter should be shown for a specific row
  const shouldShowParameterForRow = (
    row: ProcessedTableRow,
    parameterId: number
  ) => {
    if (!siteMetricsMap || Object.keys(siteMetricsMap).length === 0) {
      return true;
    }

    const siteMetrics = siteMetricsMap[row.siteId];
    if (!siteMetrics) return false;

    return siteMetrics[parameterId] === true;
  };

  // Get cell value for a specific column
  const getCellValue = (row: ProcessedTableRow, column: any) => {
    switch (column.key) {
      case "timestamp":
        return row.createdAt;
      case "siteName":
        return row.siteName;
      default:
        if (column.key.startsWith("param_")) {
          const paramData = row.parameters[column.parameterId];
          return paramData ? paramData.value : null;
        }
        return null;
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground py-10 text-base font-medium">
          {t("Loading")}...
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="h-full overflow-hidden w-full max-w-full px-2">
        {/* Header */}
        {sortedData.length > 0 && (
          <div
            ref={headerRef}
            className="overflow-x-auto overflow-y-hidden hide-scrollbar border-b"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div style={{ minWidth: `${tableColumns.length * 180}px` }}>
              <table className="table-fixed w-full border-separate border-spacing-0">
                <thead className="bg-white">
                  <tr>
                    {tableColumns.map((column) => {
                      const isTimestamp = column.key === "timestamp";
                      return (
                        <th
                          key={column.key}
                          className={cn(
                            "text-center px-4 py-3 text-sm font-semibold text-gray-700 border-b",
                            isTimestamp ? "cursor-pointer select-none" : ""
                          )}
                          style={{ width: "180px", minWidth: "180px" }}
                          onClick={isTimestamp ? toggleTimestampSort : undefined}
                        >
                          {isTimestamp ? (
                            <div className="flex items-center justify-center gap-2">
                              <span>{column.label}</span>
                              <span className="flex flex-col">
                                <ArrowUp
                                  className={cn(
                                    "h-3 w-3 -mb-0.5",
                                    timestampSortDirection === "asc"
                                      ? "text-blue3 opacity-100"
                                      : "text-gray-400 opacity-40"
                                  )}
                                />
                                <ArrowDown
                                  className={cn(
                                    "h-3 w-3 -mt-0.5",
                                    timestampSortDirection === "desc"
                                      ? "text-blue3 opacity-100"
                                      : "text-gray-400 opacity-40"
                                  )}
                                />
                              </span>
                            </div>
                          ) : (
                            column.label
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
              </table>
            </div>
          </div>
        )}

        {/* Body */}
        <div
          ref={bodyRef}
          className="w-full max-w-full h-full overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-300"
        >
          <div style={{ minWidth: `${tableColumns.length * 180}px` }}>
            <table className="table-fixed w-full border-separate border-spacing-0">
              <tbody>
                {sortedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={tableColumns.length}
                      className="text-center py-6 text-gray-500"
                    >
                      {reportsT("No Data Available")}
                    </td>
                  </tr>
                ) : (
                  sortedData.map((row, i) => (
                    <tr key={i} className="even:bg-gray-50">
                      {tableColumns.map((column) => {
                        const cellValue = getCellValue(row, column);
                        const shouldShow =
                          column.key.startsWith("param_") && column.parameterId
                            ? shouldShowParameterForRow(row, column.parameterId)
                            : true;

                        return (
                          <td
                            key={column.key}
                            className={cn(
                              "px-6 py-3 text-sm border-b text-center whitespace-nowrap",
                              typeof cellValue === "number" && shouldShow
                                ? "font-light text-gray-800"
                                : shouldShow
                                ? "text-gray-600"
                                : "text-gray-300"
                            )}
                            style={{ width: "180px", minWidth: "180px" }}
                          >
                            {shouldShow
                              ? formatCellValue(cellValue, column.key)
                              : "-"}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
