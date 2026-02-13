// hooks/useMetrics.ts
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
  return useQuery({
    queryKey: ["metrics", siteId, timeframe],
    queryFn: async () => {
      if (!siteId) throw new Error("siteId is required");
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
    enabled: !!siteId && !!timeframe,
  });
}

export function useLocationCard(siteId: string | undefined, timeframe: string) {
  return useQuery({
    queryKey: ["metricsTable", siteId, timeframe],
    queryFn: () => {
      if (!siteId) throw new Error("siteId is required");
      return frcloggerService.getMegetfrclogger(siteId, timeframe);
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
