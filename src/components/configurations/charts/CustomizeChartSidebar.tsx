"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { WidgetService } from "@/services/WidgetServices";
import { WidgetConfig } from "@/types/user";
import { ChromePicker } from "react-color";
import { useTranslations } from "next-intl";

import { StackedChartIcon } from "@/icons/setting/Charts/StackedChartIcon";
import { BarChartIcon } from "@/icons/setting/Charts/BarChartIcon";
import { LineChartIcon } from "@/icons/setting/Charts/LineChartIcon";
import { StepChartIcon } from "@/icons/setting/Charts/StepChartIcon";
import { DotsChartIcon } from "@/icons/setting/Charts/DotsChartIcon";

const chartTypes = [
  { label: "Default", value: 0, icon: LineChartIcon },
  { label: "Step Line", value: 1, icon: StepChartIcon },
  { label: "Dots", value: 2, icon: DotsChartIcon },
  { label: "Stacked Lines", value: 3, icon: StackedChartIcon },
  { label: "Bars", value: 4, icon: BarChartIcon },
];

export function CustomizeChartSidebar({
  id,
  title,
  open,
  onOpenChange,
}: {
  id: string;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Charts");
  // const locale = useLocale();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<WidgetConfig> | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pickerColor, setPickerColor] = useState("#2196f3");

  const { data } = useQuery({
    queryKey: ["widgetConfigById", id],
    queryFn: () => WidgetService.getWidgetConfigbyId(id),
    enabled: open,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<WidgetConfig>) =>
      WidgetService.updateWidgetConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["widgetConfig"] });
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (data) {
      setFormData(data);
      setPickerColor(`#${data.chartColor ?? "2196f3"}`);
    }
  }, [data]);

  const handleChange = (key: keyof WidgetConfig, value: any) => {
    setFormData((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!formData) return;
    const { chartEnable, chartType, chartColor, chartInterval, insights } =
      formData;

    await updateMutation.mutateAsync({
      chartEnable,
      chartType,
      chartColor,
      chartInterval,
      insights,
    });
  };

  // const handleAddInsight = () => {
  //   if (!formData) return;
  //   const newInsight = prompt("Enter new insight:");
  //   if (newInsight) {
  //     const updated = [...(formData.insights ?? []), newInsight];
  //     handleChange("insights", updated);
  //   }
  // };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[350px] sm:w-[400px] p-4">
        <div className="flex flex-col h-full">
          <div className="mb-4">
            <SheetTitle className="text-lg font-semibold">
              {t("customization")}
            </SheetTitle>
          </div>

          <h3 className="text-base font-medium mb-4">{title}</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              {t("interval")}
            </label>
            <input
              type="number"
              placeholder={t("enterIntervalValue")}
              className="w-full border rounded px-3 py-2"
              value={formData?.chartInterval ?? ""}
              onChange={(e) =>
                handleChange("chartInterval", Number(e.target.value))
              }
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              {t("type")}
            </label>
            <div className="grid grid-cols-3 gap-3">
              {chartTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <label
                    key={type.value}
                    className={cn(
                      "border rounded-lg p-2 flex flex-col items-center justify-center cursor-pointer transition-all",
                      formData?.chartType === type.value
                        ? "border-blue-500 ring-2 ring-blue-100"
                        : "border-gray-300"
                    )}
                  >
                    <input
                      type="radio"
                      name="chartType"
                      className="hidden"
                      checked={formData?.chartType === type.value}
                      onChange={() => handleChange("chartType", type.value)}
                    />
                    <div className="w-14 h-14 mb-1">
                      <IconComponent
                        color={
                          formData?.chartType === type.value
                            ? `#${formData?.chartColor ?? "0B80FB"}`
                            : "#B0B0B0" // or any default color for unselected icons
                        }
                        className="w-full h-full"
                      />
                    </div>
                    <span className="text-xs text-center">
                      {t(`chartTypes.${type.value}`, {
                        defaultValue: type.label,
                      })}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium my-2">
              {t("color")}
            </label>
            <div className="flex justify-between gap-3 border-2 rounded-md">
              <div
                className="w-7 h-7 m-2 rounded-md"
                style={{
                  backgroundColor: `#${formData?.chartColor ?? "2196f3"}`,
                }}
              />
              <Button
                variant="ghost"
                onClick={() => setShowColorPicker(true)}
                className="text-sm m-1"
              >
                {t("change")}
              </Button>
            </div>

            {showColorPicker && (
              <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
                <div className="bg-white p-4 rounded-md shadow-lg">
                  <ChromePicker
                    color={pickerColor}
                    onChange={(color) => setPickerColor(color.hex)}
                  />
                  <div className="flex justify-end mt-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowColorPicker(false)}
                    >
                      {t("cancel")}
                    </Button>
                    <Button
                      onClick={() => {
                        handleChange(
                          "chartColor",
                          pickerColor.replace("#", "")
                        );
                        setShowColorPicker(false);
                      }}
                    >
                      {t("apply")}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-auto">
            <Button
              onClick={handleSave}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 rounded"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
