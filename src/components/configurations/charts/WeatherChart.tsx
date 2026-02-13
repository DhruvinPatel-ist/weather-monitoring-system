"use client";

import { useState, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { CustomizeChartSidebar } from "@/components/configurations/charts/CustomizeChartSidebar";
import { useTranslations } from "next-intl";
import { WidgetService } from "@/services/WidgetServices";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type WeatherChartHandle = {
  handleSave: () => Promise<void>;
  getCurrentState: () => { id: string; chartEnable: boolean };
};

type WeatherChartProps = {
  id: string;
  title: string;
  checked?: boolean;
};

function WeatherChartComponent(
  { id, title, checked }: WeatherChartProps,
  ref: React.Ref<WeatherChartHandle>
) {
  const t = useTranslations("Charts");
  const [enabled, setEnabled] = useState(checked ?? true);
  const [initialState] = useState(checked ?? true);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const queryClient = useQueryClient();
  const updateChartEnableMutation = useMutation({
    mutationFn: (chartEnable: boolean) =>
      WidgetService.updateWidgetConfig(id, { chartEnable }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["widgetConfig"] });
    },
    onError: () => {
      toast.error(t("updateFailed"));
    },
  });

  useImperativeHandle(ref, () => ({
    getCurrentState: () => ({ id, chartEnable: enabled }),
    handleSave: async () => {
      // Only update if the state has changed
      if (enabled !== initialState) {
        console.log(`Saving chart ${id} with enabled=${enabled}`);
        await updateChartEnableMutation.mutateAsync(enabled);
      }
      // Always return void to match the Promise<void> type
      return;
    },
  }));

  const handleToggle = (value: boolean) => {
    setEnabled(value);
    // No longer calling the mutation here - will be called on save button click
  };

  return (
    <div className="flex flex-col justify-center p-4 border rounded-lg bg-white">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium mb-1">{title}</h3>
        <Switch
          id={`${id}-chart-switch`}
          checked={enabled}
          onCheckedChange={handleToggle}
          className={cn(
            "data-[state=checked]:bg-blue3",
            "data-[state=unchecked]:bg-gray-200"
          )}
        />
      </div>

      <Button
        variant="outline"
        size="sm"
        className="text-xs text-blue3 mt-2 hover:text-[#007a85] hover:bg-transparent"
        onClick={() => setCustomizeOpen(true)}
      >
        {t("CustomizeChart")}
      </Button>
      <CustomizeChartSidebar
        id={id}
        title={title}
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
      />
    </div>
  );
}

export const WeatherChart = forwardRef(WeatherChartComponent);
