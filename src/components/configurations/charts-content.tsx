"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import {
  WeatherChart,
  WeatherChartHandle,
} from "@/components/configurations/charts/WeatherChart";
import { useWidgetConfig } from "@/hooks/useConfig";
import { useTranslations, useMessages } from "next-intl";
import { toast } from "sonner";

export const ChartsContent = forwardRef(function ChartsContent(_, ref) {
  const tCharts = useTranslations("Charts");
  const tWidgets = useTranslations("Widgets");
  const messages = useMessages() as Record<string, any>;
  const { data: widgets, isLoading } = useWidgetConfig();

  // Mutable refs for each chart
  const chartRefs = useRef<
    Record<string, React.MutableRefObject<WeatherChartHandle | null>>
  >({});

  // Initialize refs for any new widgets
  widgets?.forEach((widget) => {
    if (!chartRefs.current[widget.id]) {
      chartRefs.current[widget.id] = { current: null };
    }
  });

  // Translate only if the key exists in Widgets namespace; else return original
  const translateOrOriginal = (key: string) => {
    const ns = messages?.Widgets as Record<string, unknown> | undefined;
    const hasKey =
      ns &&
      Object.prototype.hasOwnProperty.call(ns, key) &&
      (ns as Record<string, any>)[key] != null &&
      String((ns as Record<string, any>)[key]).length > 0;

    return hasKey ? tWidgets(key) : key;
    // If you want to support per-item custom titles later, you can pass a fallback parameter to this function.
  };

  useImperativeHandle(ref, () => ({
    handleSave: async () => {
      const savePromises = Object.values(chartRefs.current).map((r) =>
        r.current ? r.current.handleSave() : Promise.resolve()
      );
      try {
        await Promise.all(savePromises);
        toast.success(tCharts("updatedSuccessfully"));
      } catch (error) {
        console.error("Error saving charts:", error);
        toast.error(tCharts("saveFailed"));
      }
    },
  }));

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue3"></div>
        <span className="ml-4">{tCharts("Loading")}</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-6 max-h=[calc(100vh-300px)] overflow-auto">
      {widgets?.map((widget) => (
        <WeatherChart
          key={widget.id}
          id={widget.id}
          title={translateOrOriginal(widget.attributeName)}
          checked={widget.chartEnable}
          ref={chartRefs.current[widget.id]}
        />
      ))}
    </div>
  );
});
