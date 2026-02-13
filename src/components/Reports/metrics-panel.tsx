/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { useTranslations, useMessages } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useLoggerReportByIntervalMutation } from "@/hooks/useCharts";
import { ParameterService } from "@/services/parameterService";
import { useReportPayloadStore } from "@/stores/reportPayload"; // ← ADD

interface Site {
  id: string;
  name: string;
}

type ParameterRow = {
  ParameterID: number;
  ParameterName: string;
  SiteID: string;
  SiteName: string;
  UnitID: number;
  UnitName: string;
  ParameterDriverID: number;
  ParameterDriverName: string;
};

interface MetricsPanelProps {
  isSingleChartEnabled: boolean;
  selectedSiteIds: string[];
  selectedSiteNames: string[];
  sites: Site[];
  isLoading?: boolean;
  handleSiteChange: (siteId: string) => void;
  selectedMetrics: Record<string, boolean>;
  toggleMetric: (metric: string) => void;
  isTopPanelOpen: boolean;
  setIsTopPanelOpen: (isOpen: boolean) => void;
  generatedData: any[];
  setGeneratedData: (data: any[]) => void;
  siteMetricsMap: any;
  setSiteMetricsMap: any;
  selectedTimeframe: any;
  startDate: any;
  endDate: any;
  onDateRangeChange: any;
  onDataReset?: () => void;
}

export default function MetricsPanel({
  selectedTimeframe,
  setGeneratedData,
  selectedSiteIds,
  selectedSiteNames,
  siteMetricsMap,
  setSiteMetricsMap,
  startDate,
  endDate,
  onDataReset,
}: MetricsPanelProps) {
  const isMobileOrTablet = useDeviceDetection();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [openPanels, setOpenPanels] = useState<Set<string>>(new Set());
  const [loadingParams, setLoadingParams] = useState(false);

  // Parameters grouped by SiteID
  const [paramsBySiteId, setParamsBySiteId] = useState<
    Record<string, ParameterRow[]>
  >({});
  // Canonical SiteID -> SiteName map from API
  const [siteIdToName, setSiteIdToName] = useState<Record<string, string>>({});

  const loggerMutation = useLoggerReportByIntervalMutation();

  const sl = useTranslations("StationsList");
  const commonT = useTranslations("Common");
  const messages = useMessages() as Record<string, any>;

  // === NEW: store setter to publish final payload ===
  const { setPayload } = useReportPayloadStore();

  // --- i18n helpers: translate station names only if key exists ---
  const hasKeyInStationsList = (key: string) => {
    const ns = messages?.StationsList as Record<string, any> | undefined;
    return (
      !!ns &&
      Object.prototype.hasOwnProperty.call(ns, key) &&
      ns[key] != null &&
      String(ns[key]).length > 0
    );
  };
  const translateStationName = (raw: string) =>
    hasKeyInStationsList(raw) ? sl(raw) : raw;
  // ---------------------------------------------------------------

  // Fetch parameters dynamically whenever the selected site IDs change
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!selectedSiteIds || selectedSiteIds.length === 0) {
        setParamsBySiteId({});
        setSiteIdToName({});
        return;
      }
      setLoadingParams(true);
      try {
        const paramLists = await Promise.all(
          selectedSiteIds.map((siteId) =>
            ParameterService.getStationParameters(siteId)
          )
        );
        const list: ParameterRow[] = paramLists.flat();

        if (cancelled) return;

        const bySite: Record<string, ParameterRow[]> = {};
        const idToName: Record<string, string> = {};

        for (const row of list) {
          const key = row.SiteID?.toString();
          if (!key) continue;
          if (!bySite[key]) bySite[key] = [];
          bySite[key].push(row);
          idToName[key] = row.SiteName || idToName[key] || key;
        }

        Object.keys(bySite).forEach((sid) => {
          bySite[sid].sort((a, b) =>
            a.ParameterName.localeCompare(b.ParameterName)
          );
        });

        setParamsBySiteId(bySite);
        setSiteIdToName(idToName);
      } catch (e) {
        console.error("Failed to load station parameters:", e);
        setParamsBySiteId({});
        setSiteIdToName({});
      } finally {
        if (!cancelled) setLoadingParams(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [selectedSiteIds]);

  const displaySiteName = (siteId: string, indexInSelection: number) => {
    const apiName = siteIdToName[siteId];
    const raw =
      apiName ||
      selectedSiteNames[indexInSelection] || // provided by parent/event
      siteId;
    return translateStationName(raw);
  };

  const toggleParam = (siteId: string, paramId: number) => {
    setSiteMetricsMap((prev: any) => ({
      ...prev,
      [siteId]: {
        ...prev[siteId],
        [paramId]: !prev[siteId]?.[paramId],
      },
    }));
  };

  const toggleAllForSite = (siteId: string) => {
    const params = paramsBySiteId[siteId] || [];
    const current = siteMetricsMap[siteId] || {};
    const allChecked = params.every((p) => current[p.ParameterID]);
    const next: Record<number, boolean> = {};
    for (const p of params) next[p.ParameterID] = !allChecked;
    setSiteMetricsMap((prev: any) => ({ ...prev, [siteId]: next }));
  };

  const resetAllMetrics = () => {
    setSiteMetricsMap({});
    setGeneratedData([]);
    onDataReset?.();
    setPayload(null); // also clear exported payload if any
  };

  useEffect(() => {
    if (selectedSiteNames.length === 0) resetAllMetrics();
  }, [selectedSiteNames.length]);

  useEffect(() => {
    if (selectedTimeframe || startDate || endDate) {
      setGeneratedData([]);
      setPayload(null); // timeframe/date changed → clear export payload
    }
  }, [selectedTimeframe, startDate, endDate, setGeneratedData, setPayload]);

  function formatDate(date: Date, isEndDate: boolean = false): string {
    if (!date) return "";
    const targetDate = new Date(date);
    if (isEndDate) {
      // For end date, set time to 23:59:08.000
      targetDate.setHours(23, 59, 8, 0);
    } else {
      // For start date, set time to 00:00:00.000
      targetDate.setHours(0, 0, 0, 0);
    }
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, "0");
    const day = String(targetDate.getDate()).padStart(2, "0");
    const hours = String(targetDate.getHours()).padStart(2, "0");
    const minutes = String(targetDate.getMinutes()).padStart(2, "0");
    const seconds = String(targetDate.getSeconds()).padStart(2, "0");
    const milliseconds = String(targetDate.getMilliseconds()).padStart(3, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  // Build and send payload using PARAMETER IDS ONLY
  const handleGenerateReport = () => {
    const selectedParamIds = new Set<number>();
    selectedSiteIds.forEach((siteId) => {
      const choices = siteMetricsMap[siteId];
      if (choices) {
        Object.entries(choices).forEach(([paramIdStr, isChecked]) => {
          if (isChecked) selectedParamIds.add(Number(paramIdStr));
        });
      }
    });

    const payload = {
      siteId: selectedSiteIds.map(Number),
      fromDateStr: formatDate(startDate, false),
      toDateStr: formatDate(endDate, true),
      interval: selectedTimeframe?.value || "1",
      selectedAttributes: Array.from(selectedParamIds).map(Number),
    };

    const apiPayload = {
      ...payload,
      interval: Number(selectedTimeframe?.value || 1),
    };

    setPayload(apiPayload);
    loggerMutation.mutate(apiPayload, {
      onSuccess: (data: any) => {
        // Format decimal values to 2 decimal places
        const formattedData = data.map((item: any) => ({
          ...item,
          Parametervalue: Number(item.Parametervalue.toFixed(2)),
        }));
        setGeneratedData(formattedData);
      },
      onError: (error) => console.error("Report generation failed:", error),
    });
  };

  // === Desktop View ===
  if (!isMobileOrTablet) {
    return (
      <div className="flex flex-col space-y-4 mb-3">
        <div className="w-60 min-h-[50px] max-h-[750px] overflow-y-auto rounded-md border bg-white p-2 space-y-4">
          {selectedSiteIds.map((siteId, idx) => {
            const siteName = displaySiteName(siteId, idx);
            const isOpen = openPanels.has(siteId);
            const selectedForSite = siteMetricsMap[siteId] || {};
            const params = paramsBySiteId[siteId] || [];
            const allChecked =
              params.length > 0 &&
              params.every((p) => selectedForSite[p.ParameterID]);

            return (
              <div key={siteId}>
                <div
                  className="flex justify-between items-center p-2 bg-white cursor-pointer border-b"
                  onClick={() => {
                    setOpenPanels((prev) => {
                      const ns = new Set(prev);
                      ns.has(siteId) ? ns.delete(siteId) : ns.add(siteId);
                      return ns;
                    });
                  }}
                >
                  <h3 className="text-sm font-medium truncate">{siteName}</h3>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-primary" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-primary" />
                  )}
                </div>

                {isOpen && (
                  <div className="p-3 space-y-3">
                    <div className="flex items-center space-x-2 border-b pb-2 mb-2">
                      <Checkbox
                        id={`${siteId}-selectAll`}
                        checked={allChecked}
                        onCheckedChange={() => toggleAllForSite(siteId)}
                        className={allChecked ? "bg-primary border-blue1" : ""}
                        disabled={loadingParams || params.length === 0}
                      />
                      <label
                        htmlFor={`${siteId}-selectAll`}
                        className="text-sm font-semibold"
                      >
                        {commonT("All")}
                      </label>
                    </div>

                    {loadingParams && params.length === 0 && (
                      <div className="text-xs text-gray-500">
                        {commonT("Loading")}…
                      </div>
                    )}

                    {params.map((p) => {
                      const label = p.UnitName
                        ? `${p.ParameterName} (${p.UnitName})`
                        : p.ParameterName;
                      return (
                        <div
                          key={p.ParameterID}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`${siteId}-${p.ParameterID}`}
                            checked={!!selectedForSite[p.ParameterID]}
                            onCheckedChange={() =>
                              toggleParam(siteId, p.ParameterID)
                            }
                            className={
                              selectedForSite[p.ParameterID]
                                ? "bg-primary border-blue1"
                                : ""
                            }
                          />
                          <label
                            htmlFor={`${siteId}-${p.ParameterID}`}
                            className="text-sm font-medium"
                          >
                            {label}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div>
          {selectedSiteIds.length > 0 && (
            <Button
              className="w-full bg-blue1 hover:bg-blue2 text-white"
              onClick={handleGenerateReport}
            >
              {commonT("Generate Report")}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // === Mobile View ===
  return (
    <div className="flex flex-col space-y-2 w-full">
      <div className="min-h-[40px] max-h-[580px] overflow-y-auto rounded-md bg-white border p-1 space-y-2 w-full">
        {selectedSiteIds.map((siteId, idx) => {
          const siteName = displaySiteName(siteId, idx);
          const selectedForSite = siteMetricsMap[siteId] || {};
          const params = paramsBySiteId[siteId] || [];
          const allChecked =
            params.length > 0 &&
            params.every((p) => selectedForSite[p.ParameterID]);

          return (
            <Drawer
              key={siteId}
              open={isDrawerOpen}
              onOpenChange={setIsDrawerOpen}
            >
              <DrawerTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => setIsDrawerOpen(true)}
                >
                  {siteName}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DrawerTrigger>

              <DrawerContent className="space-y-4">
                <DrawerHeader>
                  <DrawerTitle>{siteName}</DrawerTitle>
                </DrawerHeader>

                <div className="px-4 pb-4 space-y-3">
                  <div className="flex items-center space-x-2 border-b pb-2 mb-2">
                    <Checkbox
                      id={`${siteId}-selectAll`}
                      checked={allChecked}
                      onCheckedChange={() => toggleAllForSite(siteId)}
                      className={allChecked ? "bg-primary border-blue1" : ""}
                      disabled={loadingParams || params.length === 0}
                    />
                    <label
                      htmlFor={`${siteId}-selectAll`}
                      className="text-sm font-semibold"
                    >
                      {commonT("All")}
                    </label>
                  </div>

                  {loadingParams && params.length === 0 && (
                    <div className="text-xs text-gray-500">
                      {commonT("Loading")}…
                    </div>
                  )}

                  {params.map((p) => {
                    const label = p.UnitName
                      ? `${p.ParameterName} (${p.UnitName})`
                      : p.ParameterName;
                    return (
                      <div
                        key={p.ParameterID}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`${siteId}-${p.ParameterID}`}
                          checked={!!selectedForSite[p.ParameterID]}
                          onCheckedChange={() =>
                            toggleParam(siteId, p.ParameterID)
                          }
                          className={
                            selectedForSite[p.ParameterID]
                              ? "bg-primary border-blue1"
                              : ""
                          }
                        />
                        <label
                          htmlFor={`${siteId}-${p.ParameterID}`}
                          className="text-sm font-medium"
                        >
                          {label}
                        </label>
                      </div>
                    );
                  })}

                  <Button
                    className="w-full bg-blue1 hover:bg-blue2 text-white mt-4"
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    {commonT("Done")}
                  </Button>
                </div>
              </DrawerContent>
            </Drawer>
          );
        })}

        {selectedSiteIds.length > 0 && (
          <Button
            className="w-full bg-blue1 hover:bg-blue2 text-white"
            onClick={handleGenerateReport}
          >
            {commonT("Generate Report")}
          </Button>
        )}
      </div>
    </div>
  );
}
