// hooks/useMetrics.ts
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  frcloggerService,
  MetricService,
  TableService,
} from "@/services/metricService";

export function useMetrics(
  siteId: string | undefined,
  timeframe: string,
  dateTimeRange: string
) {
  const lastKeyRef = useRef<string | null>(null);
  const query = useQuery({
    queryKey: ["metrics", siteId, timeframe],
    queryFn: async () => {
      if (!siteId) throw new Error("siteId is required");
      if (!dateTimeRange) return [];

      try {
        const data = await MetricService.getMetrics(
          siteId,
          timeframe,
          dateTimeRange
        );
        return data || []; // Return empty array if data is null
      } catch (error) {
        console.error("Error fetching metrics:", error);
        return []; // Return empty array on error
      }
    },
    enabled: false,
  });

  // Refetch exactly once whenever siteId / timeframe / dateTimeRange changes
  useEffect(() => {
    if (!siteId || !timeframe || !dateTimeRange) return;

    const currentKey = `${siteId}|${timeframe}|${dateTimeRange}`;
    if (lastKeyRef.current === currentKey) return;

    lastKeyRef.current = currentKey;
    query.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, timeframe, dateTimeRange]);

  return query;
}

export function useLocationCard(siteId: string | undefined, timeframe: string, dateTimeRange?: string) {
  return useQuery({
    queryKey: ["metricsTable", siteId, timeframe, dateTimeRange],
    queryFn: () => {
      if (!siteId) throw new Error("siteId is required");
      return frcloggerService.getMegetfrclogger(siteId, timeframe, dateTimeRange);
    },
    enabled: !!siteId && !!timeframe,
  });
}

export function useTableData(
  siteId: string | undefined,
  timeframe: string,
  dateTimeRange: string
) {
  return useQuery({
    queryKey: ["tableData", siteId, timeframe, dateTimeRange],
    queryFn: () => {
      if (!siteId) throw new Error("siteId is required");
      return TableService.getTableData(siteId, timeframe, dateTimeRange);
    },
    enabled: !!siteId && !!timeframe,
  });
}
