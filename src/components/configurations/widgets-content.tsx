"use client";

import React, { forwardRef, useImperativeHandle, useRef } from "react";
import {
  WeatherWidget,
  WeatherWidgetHandle,
} from "@/components/configurations/widgets/weather-widget";
import { useWidgetConfig } from "@/hooks/useConfig";
import { useTranslations, useMessages } from "next-intl";
import { toast } from "sonner";

export const WidgetsContent = forwardRef(function WidgetsContent(_, ref) {
  const t = useTranslations("Widgets");
  const messages = useMessages() as Record<string, any>; // current-locale messages
  const { data: widgets, isLoading } = useWidgetConfig();

  // Mutable refs for child widgets
  const widgetRefs = useRef<
    Record<string, React.MutableRefObject<WeatherWidgetHandle | null>>
  >({});

  // Initialize refs for any new widgets
  widgets?.forEach((widget) => {
    if (!widgetRefs.current[widget.id]) {
      widgetRefs.current[widget.id] = { current: null };
    }
  });

  // Helper: translate if key exists; otherwise return original text
  const translateOrOriginal = (key: string) => {
    const ns = messages?.Widgets as Record<string, unknown> | undefined;
    const hasKey =
      ns &&
      Object.prototype.hasOwnProperty.call(ns, key) &&
      // guard against empty-string values
      (ns as Record<string, any>)[key] != null &&
      String((ns as Record<string, any>)[key]).length > 0;

    return hasKey ? t(key) : key;
  };

  useImperativeHandle(ref, () => ({
    handleSave: async () => {
      const savePromises = Object.values(widgetRefs.current).map((widgetRef) =>
        widgetRef.current ? widgetRef.current.handleSave() : Promise.resolve()
      );
      try {
        await Promise.all(savePromises);
        toast.success(t("updatedSuccessfully"));
      } catch (error) {
        console.error("Error saving widgets:", error);
        toast.error(t("saveFailed"));
      }
    },
  }));

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue3"></div>
        <span className="ml-4">{t("Loading")}</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-6 max-h-[calc(100vh-300px)] overflow-y-auto">
      {widgets?.map((widget) => (
        <WeatherWidget
          key={widget.id}
          id={widget.id}
          title={translateOrOriginal(widget.attributeName)}
          checked={widget.enable}
          ref={widgetRefs.current[widget.id]}
        />
      ))}
    </div>
  );
});
