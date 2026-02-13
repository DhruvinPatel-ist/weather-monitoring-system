// src/hooks/useLoggerReport.ts
import { useMutation } from "@tanstack/react-query";
import {
  LoggerService,
  LoggerServiceByInterval,
  ReportRequestBody,
} from "@/services/useChart";

export function useLoggerReportMutation() {
  return useMutation({
    mutationFn: (body: ReportRequestBody) =>
      LoggerService.getLoggerReport(body),
  });
}

export function useLoggerReportByIntervalMutation() {
  return useMutation({
    mutationFn: (body: ReportRequestBody) =>
      LoggerServiceByInterval.getLoggerReport(body),
  });
}
