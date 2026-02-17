"use client";

import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import ChartCard from "@/components/Reports/charts/ChartCard";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations, useMessages } from "next-intl";
import { ParameterService, Parameter } from "@/services/parameterService";

interface GeneratedDataItem {
  SiteID: number;
  ParameterID: number;
  Parametervalue: number;
  CreatedAt: string;
}

interface ChartsPanelProps {
  generatedData: GeneratedDataItem[];
  siteMetricsMap: Record<string, Record<string, boolean>>;
  isSingleChartEnabled: boolean;
  selectedTimeframe: any;
  selectedMetrics: Record<string, boolean>;
}

interface ChartDataPoint {
  value: number;
  time: string;
  fullTime: string;
}

interface SiteParameterData {
  siteName: string;
  siteId: number;
  parameterName: string;
  parameterId: number;
  unitName: string;
  data: ChartDataPoint[];
}
// Function to format UTC string without timezone conversion
function formatUTCString(dateString: string): string {
  const [datePart, timePartWithMsZ] = dateString.split("T");
  const [yyyy, mm, dd] = datePart.split("-");
  const [HH, MM] = timePartWithMsZ.replace("Z", "").split(":");
  return `${dd}-${mm}-${yyyy} ${HH}:${MM}`;
}

// Process generated data with parameter metadata
function processGeneratedData(
  data: GeneratedDataItem[],
  parameters: Parameter[]
): SiteParameterData[] {
  console.log("Starting data processing:", {
    dataLength: data.length,
    parametersLength: parameters.length,
  });

  // Create lookup maps for quick access
  const parameterMap = new Map<number, Parameter>();
  parameters.forEach((param) => {
    parameterMap.set(param.ParameterID, param);
    console.log(
      `Added parameter ${param.ParameterID}: ${param.ParameterName} for site ${param.SiteName}`
    );
  });

  // Group data by site and parameter
  const groupedData = new Map<string, Map<number, GeneratedDataItem[]>>();

  data.forEach((item) => {
    const siteKey = item.SiteID.toString();
    if (!groupedData.has(siteKey)) {
      groupedData.set(siteKey, new Map());
    }

    const siteData = groupedData.get(siteKey)!;
    if (!siteData.has(item.ParameterID)) {
      siteData.set(item.ParameterID, []);
    }

    siteData.get(item.ParameterID)!.push(item);
  });

  console.log("Grouped data by site and parameter:", groupedData);

  // Convert to SiteParameterData array
  const result: SiteParameterData[] = [];

  groupedData.forEach((parameterData, siteId) => {
    console.log(`Processing site ${siteId}`);
    parameterData.forEach((dataPoints, parameterId) => {
      const parameter = parameterMap.get(parameterId);
      if (!parameter) {
        console.warn(`No parameter found for ID ${parameterId}, skipping`);
        return;
      }

      console.log(
        `Processing parameter ${parameterId}: ${parameter.ParameterName} with ${dataPoints.length} data points`
      );

      // Sort data points by time
      const sortedData = [...dataPoints].sort(
        (a, b) =>
          new Date(a.CreatedAt).getTime() - new Date(b.CreatedAt).getTime()
      );


      // Determine if data spans multiple days
      const uniqueDates = new Set(sortedData.map((pt) => pt.CreatedAt.split("T")[0]));
      const isMultiDay = uniqueDates.size > 1;

      // Transform to chart data format
      const chartData: ChartDataPoint[] = sortedData.map((point) => {
        const formattedTime = formatUTCString(point.CreatedAt);
        const [datePart, timePart] = formattedTime.split(" ");
        let tickLabel = timePart;
        if (isMultiDay) {
          // Show date and time, e.g., "26-08 07:15"
          tickLabel = `${datePart.slice(0,5)} ${timePart}`; // dd-mm HH:MM
        }
        return {
          value: point.Parametervalue,
          time: tickLabel,
          fullTime: formattedTime,
        };
      });

      const processedItem: SiteParameterData = {
        siteName: parameter.SiteName,
        siteId: parseInt(siteId),
        parameterName: parameter.ParameterName,
        parameterId: parameterId,
        unitName: parameter.UnitName,
        data: chartData,
      };

      console.log(`Created processed item:`, processedItem);
      result.push(processedItem);
    });
  });

  console.log("Final processed result:", result);
  return result;
}
export default function ChartsPanel({
  isSingleChartEnabled,
  generatedData,
  siteMetricsMap,
  // selectedTimeframe,
  selectedMetrics,
}: ChartsPanelProps) {
  const isMobileOrTablet = useDeviceDetection();
  console.log("generatedData:", generatedData);

  const [loading, setLoading] = useState(false);
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [processedData, setProcessedData] = useState<SiteParameterData[]>([]);

  // Translation hooks
  const t = useTranslations("Dashboard");
  // const commonT = useTranslations("Common");
  const reportsT = useTranslations("Reports");
  const sl = useTranslations("StationsList");
  const messages = useMessages() as Record<string, any>;

  // Fetch parameters metadata
  useEffect(() => {
    const fetchParameters = async () => {
      try {
        setLoading(true);
        const parameterData = await ParameterService.getAllParameter();
        setParameters(parameterData);
      } catch (error) {
        console.error("Error fetching parameters:", error);
        toast.error("Failed to load parameters");
      } finally {
        setLoading(false);
      }
    };

    fetchParameters();
  }, []);

  // Process data when parameters or generatedData changes
  useEffect(() => {
    if (parameters.length > 0 && generatedData.length > 0) {
      console.log("Parameters fetched:", parameters);
      console.log("Processing data with parameters and generatedData");
      const processed = processGeneratedData(generatedData, parameters);
      console.log("Processed data:", processed);
      setProcessedData(processed);
    } else {
      console.log("Waiting for data:", {
        parametersLength: parameters.length,
        generatedDataLength: generatedData.length,
      });
    }
  }, [parameters, generatedData]);

  useEffect(() => {
    if (isSingleChartEnabled) {
      const toastId = toast.loading(t("Loading"));
      setLoading(true);

      // simulate brief async delay
      const timer = setTimeout(() => {
        setLoading(false);
        toast.dismiss(toastId);
      }, 800); // adjust delay as needed

      return () => clearTimeout(timer);
    }
  }, [processedData, siteMetricsMap, isSingleChartEnabled, t]);

  // Helper function to safely translate site names
  const getTranslatedSiteName = (siteName: string) => {
    const hasKeyInStationsList = (key: string) => {
      const ns = messages?.StationsList as Record<string, any> | undefined;
      return (
        !!ns &&
        Object.prototype.hasOwnProperty.call(ns, key) &&
        ns[key] != null &&
        String(ns[key]).length > 0
      );
    };
    if (!siteName) return "Unknown Station";
    return hasKeyInStationsList(siteName) ? sl(siteName) : siteName;
  };

  // Get unique site and parameter combinations for filtering
  const getUniqueParameterNames = () => {
    const parameterNames = new Set<string>();
    processedData.forEach((item) => {
      parameterNames.add(item.parameterName);
    });
    return Array.from(parameterNames);
  };

  const getUniqueSiteNames = () => {
    const siteNames = new Set<string>();
    processedData.forEach((item) => {
      siteNames.add(item.siteName);
    });
    return Array.from(siteNames);
  };

  // Filter data based on selected metrics (if applicable)
  const getFilteredData = () => {
    console.log("getFilteredData called with:", {
      processedDataLength: processedData.length,
      selectedMetrics,
      siteMetricsMap,
      hasSelectedMetrics:
        selectedMetrics &&
        Object.values(selectedMetrics).some((val) => val === true),
      siteMetricsMapKeys: siteMetricsMap ? Object.keys(siteMetricsMap) : [],
    });

    if (!processedData.length) {
      console.log("No processed data, returning empty array");
      return [];
    }

    // If we have specific selected metrics, filter by them
    if (
      selectedMetrics &&
      Object.values(selectedMetrics).some((val) => val === true)
    ) {
      const selectedParameterNames = Object.keys(selectedMetrics).filter(
        (key) => selectedMetrics[key]
      );
      console.log("Filtering by selectedMetrics:", selectedParameterNames);
      const filtered = processedData.filter((item) =>
        selectedParameterNames.some((paramName) =>
          item.parameterName.toLowerCase().includes(paramName.toLowerCase())
        )
      );
      console.log("Filtered by selectedMetrics result:", filtered);
      return filtered;
    }

    // If we have siteMetricsMap, use it for filtering
    if (siteMetricsMap && Object.keys(siteMetricsMap).length > 0) {
      console.log("Filtering by siteMetricsMap");
      const filtered = processedData.filter((item) => {
        // Use siteId as the key, not siteName
        const siteMetrics = siteMetricsMap[item.siteId];
        if (!siteMetrics) {
          console.log(
            `No metrics found for site ID: ${item.siteId} (${item.siteName})`
          );
          return false;
        }

        const result = Object.entries(siteMetrics).some(
          ([parameterIdStr, isSelected]) => {
            if (!isSelected) return false;
            const parameterId = parseInt(parameterIdStr);
            const matches = item.parameterId === parameterId;
            console.log(
              `Checking parameter ID ${item.parameterId} (${item.parameterName}) against ${parameterId}: ${matches}`
            );
            return matches;
          }
        );
        console.log(
          `Site ${item.siteName} (ID: ${item.siteId}), parameter ${item.parameterName} (ID: ${item.parameterId}): included = ${result}`
        );
        return result;
      });
      console.log("Filtered by siteMetricsMap result:", filtered);
      return filtered;
    }

    // Return all data if no filtering criteria
    console.log(
      "No filtering criteria, returning all processed data:",
      processedData
    );
    return processedData;
  };

  const filteredData = getFilteredData();
  console.log("Final filteredData for rendering:", {
    length: filteredData.length,
    data: filteredData,
  });

  // Log rendering conditions
  console.log("Rendering conditions:", {
    loading,
    hasFilteredData: filteredData.length > 0,
    isSingleChartEnabled,
    renderCharts: !loading && filteredData.length > 0,
  });
  const siteLegend =
    isSingleChartEnabled && filteredData.length > 0
      ? getUniqueSiteNames().map((siteName, index) => ({
          label: getTranslatedSiteName(siteName),
          color: `hsl(${(index * 67) % 360}, 70%, 50%)`,
        }))
      : [];

  return (
    <div className="h-full overflow-y-auto pr-2">
      <div className="space-y-6 pb-8">
        {loading && (
          <div className="text-center text-muted-foreground py-10 text-base font-medium">
            {t("Loading")}...
          </div>
        )}

        {!loading && filteredData.length === 0 && (
          <div className="text-center text-muted-foreground py-10 text-base font-medium">
            {reportsT("No Data Available")}
          </div>
        )}

        {!loading && filteredData.length > 0 && (
          <>
            {isSingleChartEnabled ? (
              // Single chart mode - shared legend below tabs, charts per parameter
              <>
                {siteLegend.length > 0 && (
                  <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-gray-600">
                    {siteLegend.map((item) => (
                      <div key={item.label} className="flex items-center gap-1">
                        <span
                          className="inline-block w-3 h-3 rounded-sm border border-gray-300"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="truncate max-w-[160px]">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div
                  className={`grid gap-6 ${
                    isMobileOrTablet ? "grid-cols-1" : "grid-cols-2"
                  }`}
                >
                  {getUniqueParameterNames().map((parameterName) => {
                    const parameterData = filteredData.filter(
                      (item) => item.parameterName === parameterName
                    );
                    if (parameterData.length === 0) return null;

                    // Create multi-series data for this parameter
                    const multiSeries = parameterData.map((item) => ({
                      siteName: getTranslatedSiteName(item.siteName),
                      data: item.data,
                    }));

                    return (
                      <ChartCard
                        key={parameterName}
                        label={`${parameterName} (${
                          parameterData[0]?.unitName || ""
                        })`}
                        color="#4693f1"
                        multiSeries={multiSeries}
                      />
                    );
                  })}
                </div>
              </>
            ) : (
              // Multiple chart mode - group by site
              getUniqueSiteNames().map((siteName) => {
                const siteData = filteredData.filter(
                  (item) => item.siteName === siteName
                );
                if (siteData.length === 0) return null;

                const translatedSiteName = getTranslatedSiteName(siteName);

                return (
                  <div key={siteName}>
                    <h2 className="text-lg font-bold mb-2">
                      {translatedSiteName}
                    </h2>
                    <div
                      className={`grid gap-6 ${
                        isMobileOrTablet ? "grid-cols-1" : "grid-cols-2"
                      }`}
                    >
                      {siteData.map((item) => (
                        <ChartCard
                          key={`${siteName}-${item.parameterId}`}
                          label={`${item.parameterName} (${item.unitName})`}
                          color="#4693f1"
                          data={item.data}
                          stationName={translatedSiteName}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
}
