"use client";

import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import {
  useGeneralSettings,
  useUpdateGeneralSettings,
} from "@/hooks/useGeneralSettings";
import { useStations } from "@/hooks/useDashboard";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { iconIdMap, iconComponentMap, IconName } from "@/icons/mapIcons";
import { ChromePicker } from "react-color";
import MapViewComponent from "./map-view";
import { Station } from "../Dashboard/view/parameter-view";
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations, useLocale, useMessages } from "next-intl";

const GeneralContent = forwardRef((_props, ref) => {
  const isMobileOrTablet = useDeviceDetection();
  const { data: stations = [], isLoading: isStationsLoading } = useStations();

  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const selectedSiteId = selectedStation?.id ?? null;

  const { data: generalSettings, isLoading: isSettingsLoading } =
    useGeneralSettings(selectedSiteId);
  const { mutate: updateSettings } = useUpdateGeneralSettings();

  const [selectedColor, setSelectedColor] = useState("#0b80fb");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pinStyle, setPinStyle] = useState<"pin" | "name">("pin");
  const [selectedIcon, setSelectedIcon] = useState<IconName>("LocationPin");
  const [stationName, setStationName] = useState("");
  const [scaleData, setScaleData] = useState(50);
  const [direction, setDirection] = useState(0);

  const t = useTranslations("GeneralContent");
  const sl = useTranslations("StationsList");
  const messages = useMessages() as Record<string, any>;
  const locale = useLocale();
  const isRTL = locale === "ar";

  const iconOptions = iconIdMap.map((id) => ({
    id,
    icon: React.createElement(iconComponentMap[id], {
      color: selectedColor,
    }),
  }));

  // ---- i18n fallback helper (StationsList) ----
  const hasKeyInStationsList = (key: string) => {
    const ns = messages?.StationsList as Record<string, any> | undefined;
    return (
      !!ns &&
      Object.prototype.hasOwnProperty.call(ns, key) &&
      ns[key] != null &&
      String(ns[key]).length > 0
    );
  };
  const translateStationName = (name: string) => {
    if (!name) return "Unknown Station";
    if (name === "Weather Station") return "Weather Station"; // keep your hardcoded fallback
    return hasKeyInStationsList(name) ? sl(name) : name;
  };
  // ---------------------------------------------

  useEffect(() => {
    if (stations.length > 0 && !selectedStation) {
      setSelectedStation(stations[0]);
    }
  }, [stations, selectedStation]);

  useEffect(() => {
    if (!generalSettings) return;

    setSelectedColor(`#${generalSettings.color}`);
    setPinStyle(generalSettings.pin_style === "Name" ? "name" : "pin");
    setSelectedIcon(iconIdMap[generalSettings.icon_type - 1] ?? "LocationPin");
    setScaleData(generalSettings.scale_data ?? 50);
    setDirection(generalSettings.direction ?? 0);
    setStationName(generalSettings.display_name ?? ""); // ✅ Load display name
  }, [generalSettings]);

  const handleSave = () => {
    if (!generalSettings || !selectedSiteId) return;

    updateSettings({
      id: generalSettings.id,
      payload: {
        site_id: selectedSiteId,
        color: selectedColor.replace("#", ""),
        pin_style: pinStyle === "pin" ? "Pin" : "Name",
        icon_type: iconIdMap.findIndex((i) => i === selectedIcon) + 1 || 1,
        scale_data: scaleData,
        direction: direction,
        display_name: pinStyle === "name" ? stationName : null, // ✅ Save it
      },
    });
  };

  useImperativeHandle(ref, () => ({ handleSave }));

  return (
    <div
      className={`${
        isMobileOrTablet
          ? "flex flex-col-reverse overflow-auto"
          : "flex flex-row"
      } gap-8 h-full min-h-[500px]`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {isStationsLoading ? (
        <div className="flex flex-col gap-6 w-full">
          <Skeleton className="w-full h-10" />
          <Skeleton className="w-full h-12" />
          <Skeleton className="w-full h-12" />
          <Skeleton className="w-full h-24" />
          <Skeleton className="w-full h-6" />
          <Skeleton className="w-full h-[300px] rounded-xl" />
        </div>
      ) : (
        <>
          {/* Form Section */}
          <div className="space-y-4 w-full">
            {/* Site Selection */}
            <div className="space-y-2">
              <Label>{t("site")}</Label>
              <Select
                value={selectedStation?.id ?? ""}
                onValueChange={(value) => {
                  const station = stations.find((s) => s.id === value);
                  if (station) setSelectedStation(station);
                }}
              >
                <SelectTrigger className="w-full text-black">
                  <SelectValue placeholder={t("selectSite")} />
                </SelectTrigger>
                <SelectContent>
                  {stations.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {translateStationName(s.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isSettingsLoading ? (
              <>
                <Skeleton className="w-full h-12" />
                <Skeleton className="w-full h-12" />
                <Skeleton className="w-full h-24" />
                <Skeleton className="w-full h-6" />
              </>
            ) : (
              <>
                {/* Color Picker */}
                <div className="space-y-2 relative">
                  <Label>{t("color")}</Label>
                  <div className="flex items-center justify-between border-2 p-2 rounded-md">
                    <div
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: selectedColor }}
                    />
                    <Button
                      variant="link"
                      onClick={() => setShowColorPicker(true)}
                    >
                      {t("change")}
                    </Button>
                  </div>
                  {showColorPicker && (
                    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                      <div className="bg-white p-4 rounded-lg">
                        <ChromePicker
                          color={selectedColor}
                          onChange={(color) => setSelectedColor(color.hex)}
                        />
                        <div className="text-right pt-2">
                          <Button onClick={() => setShowColorPicker(false)}>
                            {t("done")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pin Style */}
                <div className="space-y-2">
                  <Label>{t("pinStyle")}</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <Input
                        type="radio"
                        checked={pinStyle === "pin"}
                        onChange={() => setPinStyle("pin")}
                      />
                      {t("pin")}
                    </label>
                    <label className="flex items-center gap-2">
                      <Input
                        type="radio"
                        checked={pinStyle === "name"}
                        onChange={() => setPinStyle("name")}
                      />
                      {t("name")}
                    </label>
                  </div>
                </div>

                {/* Icon or Display Name */}
                {pinStyle === "pin" ? (
                  <div className="space-y-2">
                    <Label>{t("chooseIcon")}</Label>
                    <div className="flex flex-wrap gap-4">
                      {iconOptions.map((item) => (
                        <div
                          key={item.id}
                          className={`cursor-pointer p-2 rounded-md border-2 ${
                            selectedIcon === item.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-300"
                          }`}
                          onClick={() => setSelectedIcon(item.id)}
                        >
                          {item.icon}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>{t("displayName")}</Label>
                    <Input
                      placeholder={t("stationLabel")}
                      value={stationName}
                      onChange={(e) => setStationName(e.target.value)}
                    />
                  </div>
                )}

                {/* Scale */}
                <div className="space-y-2">
                  <Label>{t("ScaleData")}</Label>
                  <Slider
                    value={[scaleData]}
                    max={100}
                    step={1}
                    onValueChange={([val]) => setScaleData(val)}
                  />
                  <div className="text-right text-sm">{scaleData}</div>
                </div>

                {/* Direction */}
                {/* <div className="space-y-2">
                  <Label>{t("northDirection")}</Label>
                  <div className="flex items-center justify-between">
                    <Input value={`${direction}°`} readOnly />
                    <Button
                      variant="link"
                      onClick={() => setDirection((prev) => (prev + 45) % 360)}
                    >
                      {t("rotate")}
                    </Button>
                  </div>
                </div> */}
              </>
            )}
          </div>

          {/* Map Section */}
          <div
            className={`${
              isMobileOrTablet ? "h-[200px]" : "h-full"
            } w-full border-2 rounded-xl`}
          >
            <MapViewComponent
              stations={selectedStation ? [selectedStation] : []}
              onSelectStation={(s) => setSelectedStation(s)}
              iconType={iconIdMap.indexOf(selectedIcon) + 1}
              color={selectedColor.replace("#", "")}
              pinStyle={pinStyle}
              displayName={stationName}
              scaleData={scaleData}
            />
          </div>
        </>
      )}
    </div>
  );
});

GeneralContent.displayName = "GeneralContent";
export { GeneralContent };
