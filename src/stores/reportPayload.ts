/* eslint-disable */
import { create } from "zustand";

export type LoggerReportPayload = {
  siteId: number[];
  fromDateStr: string; // "YYYY-MM-DD"
  toDateStr: string; // "YYYY-MM-DD"
  interval?: number; // e.g., "lastDay" | "lastWeek" | etc.
  selectedAttributes: number[];
};

type ReportState = {
  payload: LoggerReportPayload | null;
  setPayload: (p: LoggerReportPayload | null) => void;
};

export const useReportPayloadStore = create<ReportState>((set) => ({
  payload: null,
  setPayload: (p) => set({ payload: p }),
}));
