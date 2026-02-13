"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
// import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { WidgetService } from "@/services/WidgetServices";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { WidgetConfig } from "@/types/user";
import { ChromePicker } from "react-color";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { DefaultWidgetIcon } from "@/icons/setting/Widgets/DefaultWidgetIcon";
import { DirectionIcon } from "@/icons/setting/Widgets/DirectionIcon";
import { DistanceTrackerIcon } from "@/icons/setting/Widgets/DistanceTrackerIcon";
import { PercentageIcon } from "@/icons/setting/Widgets/PercentageIcon";
import { TemperatureIcon } from "@/icons/setting/Widgets/TemperatureIcon";
import { ThermometerIcon } from "@/icons/setting/Widgets/ThermometerIcon";
import { WindDirectionWidgetIcon } from "@/icons/setting/Widgets/WindDirectionWidget";
import { LinearProgressWidgetSVG } from "@/icons/setting/Widgets/LinearProgressWidgetSVG";

const widgetTypes = [
  { label: "Default Widget", value: 0, icon: DefaultWidgetIcon },
  { label: "Temperature", value: 1, icon: TemperatureIcon },
  { label: "Percentage", value: 2, icon: PercentageIcon },
  { label: "Direction", value: 3, icon: DirectionIcon },
  { label: "Distance Tracker", value: 4, icon: DistanceTrackerIcon },
  { label: "Thermometer", value: 5, icon: ThermometerIcon },
  { label: "Polygon", value: 6, icon: LinearProgressWidgetSVG },
  { label: "WindGauge", value: 7, icon: WindDirectionWidgetIcon },
];

const maxColorLimitByType: Record<number, number> = {
  0: 3,
  1: 3,
  2: 1,
  3: 1,
  4: 3,
  5: 3,
  6: 2,
  7: 1,
};

export function CustomizeSidebar({
  id,
  open,
  onOpenChange,
}: {
  id: string;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Widgets");
  // const locale = useLocale();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<WidgetConfig> | null>(null);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pickerColor, setPickerColor] = useState("#009fac");

  const widgetColor = Array.isArray(formData?.colors)
    ? formData.colors.map((c) =>
        typeof c === "string" && c.startsWith("#") ? c : `#${c}`
      )
    : [];

  const { data: widgetData, isLoading } = useQuery({
    queryKey: ["widgetConfigById", id],
    queryFn: () => WidgetService.getWidgetConfigbyId(id),
    enabled: open,
  });

  const updateMutation = useMutation({
    mutationFn: (updatedData: Partial<WidgetConfig>) =>
      WidgetService.updateWidgetConfig(id, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["widgetConfig"] });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Update failed", error);
    },
  });

  useEffect(() => {
    if (!widgetData) return;

    setFormData(widgetData);

    let parsedColors: string[] = [];

    try {
      const rawColors = widgetData.colors;

      // Try parsing only if it's a string
      if (typeof rawColors === "string") {
        const maybeParsed = JSON.parse(rawColors);
        parsedColors = Array.isArray(maybeParsed) ? maybeParsed : [];
      } else if (Array.isArray(rawColors)) {
        parsedColors = rawColors;
      }
    } catch (e) {
      console.error("Failed to parse widget colors", e);
      parsedColors = [];
    }

    // Remove '#' if already present and normalize casing
    const cleanedColors = parsedColors
      .map((c) =>
        typeof c === "string" ? c.replace("#", "").toLowerCase() : ""
      )
      .filter(Boolean);

    setAvailableColors([...new Set(cleanedColors)]);
  }, [widgetData]);

  const handleSave = async () => {
    if (!formData) return;
    const colorCount = formData.colors?.length || 0;
    const type = formData.type ?? -1;
    const maxAllowed = maxColorLimitByType[type];

    if (maxAllowed !== undefined && colorCount !== maxAllowed) {
      toast.error(
        `${t("selectedWidgetRequires")} ${maxAllowed} ${
          maxAllowed > 1 ? t("colors") : t("color")
        }.`
      );
      return;
    }

    const cleanedData: Partial<WidgetConfig> = {
      ...formData,
      colors: formData.colors?.map((c) => c.toLowerCase()) ?? [],
    };

    try {
      await updateMutation.mutateAsync(cleanedData);
    } catch (error) {
      console.error("Save failed", error);
    }
  };

  const handleChange = (key: keyof WidgetConfig, value: any) => {
    if (formData) setFormData({ ...formData, [key]: value });
  };

  const handleAddColor = (color: string) => {
    const cleanColor = color.replace("#", "").toLowerCase();
    if (!availableColors.includes(cleanColor)) {
      setAvailableColors((prev) => [...prev, cleanColor]);
    }
    const selected = formData?.colors || [];
    if (!selected.includes(cleanColor)) {
      handleChange("colors", [...selected, cleanColor]);
    }
  };

  const handleDeleteColor = (color: string) => {
    const cleanColor = color.toLowerCase();
    setAvailableColors((prev) => prev.filter((c) => c !== cleanColor));
    if (formData?.colors?.includes(cleanColor)) {
      handleChange(
        "colors",
        formData.colors.filter((c) => c !== cleanColor)
      );
    }
  };

  const toggleSelectedColor = (color: string) => {
    const cleanColor = color.toLowerCase();
    if (!formData) return;
    const selected = formData.colors || [];
    const type = formData.type ?? -1;
    const maxAllowed = maxColorLimitByType[type];

    if (selected.includes(cleanColor)) {
      handleChange(
        "colors",
        selected.filter((c) => c !== cleanColor)
      );
    } else {
      if (selected.length >= maxAllowed) {
        toast.warning(
          `${t("youCanSelectOnly")} ${maxAllowed} ${
            maxAllowed > 1 ? t("colors") : t("color")
          } ${t("forThisWidget")}.`
        );
        return;
      }
      handleChange("colors", [...selected, cleanColor]);
    }
  };

  // const getCurrentWidgetIcon = () => {
  //   if (formData?.type === undefined) return null;
  //   const IconComponent = widgetTypes.find(
  //     (w) => w.value === formData.type
  //   )?.icon;
  //   if (!IconComponent) return null;
  //   return <IconComponent colors={widgetColor} className="w-16 h-16 mx-auto" />;
  // };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[350px] sm:w-[400px] p-0">
        <div className="flex flex-col h-full">
          <div className="border-b p-4 flex justify-between items-center">
            <SheetTitle className="font-medium">
              {t("customization")}
            </SheetTitle>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-6">
            {isLoading ? (
              <div>{t("loading")}</div>
            ) : formData ? (
              <>
                <div>
                  <label className="block text-sm mb-1">{t("title")}</label>
                  <input
                    type="text"
                    placeholder={t("enterTitleName")}
                    value={formData.title || ""}
                    onChange={(e) => handleChange("title", e.target.value)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                {/* <div className="flex justify-between items-center">
                  <label className="block text-sm">{t("gradient")}</label>
                  <Switch
                    checked={formData.enableGradient ?? false}
                    onCheckedChange={(val) =>
                      handleChange("enableGradient", val)
                    }
                  />
                </div> */}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm mb-1">
                      {t("minValue")}
                    </label>
                    <input
                      type="number"
                      value={formData.minValue ?? ""}
                      onChange={(e) =>
                        handleChange("minValue", Number(e.target.value))
                      }
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">
                      {t("maxValue")}
                    </label>
                    <input
                      type="number"
                      value={formData.maxValue ?? ""}
                      onChange={(e) =>
                        handleChange("maxValue", Number(e.target.value))
                      }
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-1">{t("type")}</label>
                  <div className="grid grid-cols-3 gap-3">
                    {widgetTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <label
                          key={type.value}
                          className={cn(
                            "p-2 border rounded-md flex flex-col items-center cursor-pointer",
                            formData.type === type.value
                              ? "border-blue3"
                              : "border-gray-300"
                          )}
                          onClick={() => handleChange("type", type.value)}
                        >
                          <Icon
                            colors={
                              formData.type === type.value ? widgetColor : []
                            }
                            className="w-10 h-10"
                          />
                          <span className="text-[10px] text-center">
                            {t(`widgetTypes.${type.value}`, {
                              defaultValue: type.label,
                            })}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-1">{t("colors")}</label>
                  <div className="flex gap-2 items-center flex-wrap">
                    {availableColors.map((color, index) => (
                      <div key={index} className="relative">
                        <button
                          onClick={() => toggleSelectedColor(color)}
                          className={cn(
                            "w-8 h-8 rounded-md border-2",
                            formData.colors?.includes(color.toLowerCase())
                              ? "border-blue3"
                              : "border-gray-300"
                          )}
                          style={{ backgroundColor: `#${color}` }}
                        />
                        <button
                          className="absolute -top-1 -right-1 bg-white text-red-500 border border-gray-300 rounded-full w-4 h-4 text-xs flex items-center justify-center shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteColor(color);
                          }}
                          title={t("deleteColor")}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setShowColorPicker(true)}
                      className="w-8 h-8 rounded-md border flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {showColorPicker && (
                    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
                      <div className="bg-white p-4 rounded-md">
                        <ChromePicker
                          color={pickerColor}
                          onChange={(color) => setPickerColor(color.hex)}
                        />
                        <div className="flex justify-end mt-2">
                          <Button
                            onClick={() => {
                              handleAddColor(pickerColor);
                              setShowColorPicker(false);
                            }}
                          >
                            {t("done")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div>{t("noDataAvailable")}</div>
            )}
          </div>
          <div className="p-2 border-t">
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending || isLoading}
              className="w-full py-2 bg-blue1 text-white rounded-md font-medium"
            >
              {updateMutation.isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
