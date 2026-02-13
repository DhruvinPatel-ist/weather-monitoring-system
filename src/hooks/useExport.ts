// src/hooks/useLoggerReport.ts
import { useMutation } from "@tanstack/react-query";
import {
  ExportService,
  ExportRequestBody,
  ExportReportRequestBody,
} from "@/services/useExport";

export function useLoggerExportMutation() {
  return useMutation({
    mutationFn: (body: ExportRequestBody) => ExportService.getExport(body),
  });
}
export function useLoggerExportReportMutation() {
  return useMutation({
    mutationFn: (body: ExportReportRequestBody) =>
      ExportService.getExportReport(body),
  });
}
