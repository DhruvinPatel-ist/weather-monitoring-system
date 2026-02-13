"use client";

import React, { useState, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { CustomizeSidebar } from "@/components/configurations/widgets/CustomizeSidebar";
import { useTranslations } from "next-intl";
import { WidgetService } from "@/services/WidgetServices";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type WeatherWidgetHandle = {
  handleSave: () => Promise<void>;
  getCurrentState: () => { id: string; enable: boolean };
};

type WeatherWidgetProps = {
  id: string;
  title: string;
  checked?: boolean;
};

function WeatherWidgetComponent(
  { id, title, checked }: WeatherWidgetProps,
  ref: React.Ref<WeatherWidgetHandle>
) {
  const t = useTranslations("Widgets");
  const [enabled, setEnabled] = useState(checked ?? true);
  const [initialState] = useState(checked ?? true);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const queryClient = useQueryClient();
  const updateEnableMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      WidgetService.updateWidgetConfig(id, { enable: enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["widgetConfig"] });
    },
    onError: () => {
      toast.error(t("updateFailed"));
    },
  });

  useImperativeHandle(ref, () => ({
    getCurrentState: () => ({ id, enable: enabled }),
    handleSave: async () => {
      // Only update if the state has changed
      if (enabled !== initialState) {
        console.log(`Saving widget ${id} with enabled=${enabled}`);
        // Fix the return type by ensuring it returns void
        await updateEnableMutation.mutateAsync(enabled);
      }
      // Always return void to match the Promise<void> type
      return;
    },
  }));

  const handleToggle = (value: boolean) => {
    setEnabled(value);
  };

  return (
    <div className="flex flex-col justify-center p-4 border rounded-lg bg-white">
      <div className="flex items-center justify-between">
        <h3 className="text-sm text-start font-medium mb-1">{title}</h3>
        <Switch
          id={`${id}-switch`}
          checked={enabled}
          onCheckedChange={handleToggle}
          className={cn(
            "data-[state=checked]:bg-blue3",
            "data-[state=unchecked]:bg-gray-200",
            "data-[state=checked]:border-blue3",
            "data-[state=unchecked]:border-gray-200"
          )}
        />
      </div>

      <Button
        variant="outline"
        size="sm"
        className="text-xs text-blue3 mt-2 hover:text-[#007a85] hover:bg-transparent"
        onClick={() => setCustomizeOpen(true)}
      >
        {t("Customize")}
      </Button>

      <CustomizeSidebar
        id={id}
        title={title}
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
      />
    </div>
  );
}

export const WeatherWidget = forwardRef(WeatherWidgetComponent);
