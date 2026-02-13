// src/services/LoggerService.ts
import api from "@/app/api/api";
import { retryWithBackoff } from "@/utils/retryWithBackoff";
import { toast } from "sonner";

export interface ReportRequestBody {
  siteId: number[];
  // mode: string;
  selectedAttributes: number[];
  fromDateStr?: string;
  toDateStr?: string;
}

export const LoggerService = {
  getLoggerReport: async (body: ReportRequestBody) => {
    try {
      const response = await retryWithBackoff(() =>
        api.post("/reportfrclogger", body)
      );
      return response.data; // expected to be an array of report entries
    } catch (error) {
      console.error("Failed to fetch logger report after retries:", error);
      toast.error("Failed to fetch the report. Please try again later.");
      throw error;
    }
  },
};

export const LoggerServiceByInterval = {
  getLoggerReport: async (body: ReportRequestBody) => {
    const response = await api.post("/charthourlytime", body);
    return response.data; // expected to be an array of report entries
  },
};
