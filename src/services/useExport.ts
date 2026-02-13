// src/services/LoggerService.ts
import api from "@/app/api/api";

export interface ExportRequestBody {
    siteId: number[];
    mode: string; 
    selectedAttributes?: number[];
    format: string;
    fromDateStr?: string;
    toDateStr?: string;
}

export interface ExportReportRequestBody {
    siteId: number[];
    fromDateStr?: string;
    toDateStr?: string;
    interval?: number;
    selectedAttributes?: number[];
    format: string;
}

export const ExportService = {
  getExport: async (body: ExportRequestBody) => {
    const response = await api.post("/export", body, {
      responseType: "blob",
    });
    return response;
  },
  getExportReport: async (body: ExportReportRequestBody) => {
    const response = await api.post("/exportreport", body, {
      responseType: "blob",
    });
    return response;
  },
};
