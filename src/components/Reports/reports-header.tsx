"use client";

import { useEffect, useRef, useState } from "react";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { Switch } from "../ui/switch";
import { DateRangePicker } from "../PopoverDatePicker";
import { Station } from "@/app/[locale]/Report/page";
import { useTranslations, useMessages } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { ChevronDown } from "lucide-react";
import DownloadReportComponent from "./download-report";

interface Site {
  id: string;
  name: string;
}

interface ReportsHeaderProps {
  stations: Station[];
  isEnabled: boolean;
  onToggle: (val: boolean) => void;
  onSelectStation?: (station: Station) => void;
  siteMetricsMap?: void;
  setSiteMetricsMap?: void;
  selectedTimeframe: { label: string; value: string } | null;
  setSelectedTimeframe: (val: { label: string; value: string }) => void;
  startDate?: Date;
  endDate?: Date;
  onDateRangeChange?: (start: Date, end: Date) => void;
  generatedData?: any[];
  onDataReset?: () => void;
  resetTrigger?: number; // New prop to trigger reset from parent
}

export default function ReportsHeader({
  stations,
  isEnabled,
  onToggle,
  selectedTimeframe,
  setSelectedTimeframe,
  startDate,
  endDate,
  onDateRangeChange,
  onDataReset,
  resetTrigger = 0,
}: ReportsHeaderProps) {
  const isMobileOrTablet = useDeviceDetection();
  const [date] = useState<Date>(new Date());
  const [, setFormattedDate] = useState("");
  const t = useTranslations("Dashboard");
  const sl = useTranslations("StationsList");
  const r = useTranslations("Reports");
  const messages = useMessages() as Record<string, any>;

  // --- i18n fallback for station names ---
  const hasKeyInStationsList = (key: string) => {
    const ns = messages?.StationsList as Record<string, any> | undefined;
    return (
      !!ns &&
      Object.prototype.hasOwnProperty.call(ns, key) &&
      ns[key] != null &&
      String(ns[key]).length > 0
    );
  };
  const translateStationName = (name?: string) => {
    if (!name) return "Unknown Station";
    return hasKeyInStationsList(name) ? sl(name) : name;
  };
  // ---------------------------------------

  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (stations.length > 0) {
      const mapped = stations.map((station) => ({
        id: station.id,
        name: station.name,
      }));
      setSites(mapped);
    }
  }, [stations]);

  useEffect(() => {
    if (resetTrigger > 0) {
      setSelectedSites([]);
      setIsDropdownOpen(false);
    }
  }, [resetTrigger]);

  useEffect(() => {
    const handleSiteSelected = (event: CustomEvent) => {
      const { siteIds } = event.detail;
      setSelectedSites(siteIds || []);
    };
    window.addEventListener(
      "siteSelected",
      handleSiteSelected as EventListener
    );
    return () => {
      window.removeEventListener(
        "siteSelected",
        handleSiteSelected as EventListener
      );
    };
  }, []);

  useEffect(() => {
    const handleSiteCleared = () => {
      setSelectedSites([]);
      setIsDropdownOpen(false);
    };
    window.addEventListener("siteCleared", handleSiteCleared);
    return () => {
      window.removeEventListener("siteCleared", handleSiteCleared);
    };
  }, []);

  const timeframeOptions = [
    { label: t("15m"), value: "15" },
    { label: t("1h"), value: "60" },
    { label: t("24h"), value: "1440" },
    { label: t("Monthly"), value: "43200" },
    { label: t("Yearly"), value: "525600" },
  ];

  const formatSelectedDate = (selectedDate: Date) => {
    const day = selectedDate.getDate().toString().padStart(2, "0");
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = monthNames[selectedDate.getMonth()];
    const year = selectedDate.getFullYear();
    return `${day} ${month} ${year}`;
  };

  useEffect(() => {
    setFormattedDate(formatSelectedDate(date));
  }, [date]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSiteChange = (siteId: string, checked: boolean) => {
    const updatedSites = checked
      ? [...selectedSites, siteId]
      : selectedSites.filter((id) => id !== siteId);
    setSelectedSites(updatedSites);

    if (onDataReset) onDataReset();

    const selectedNames = updatedSites.map((id) => {
      const site = sites.find((s) => s.id === id);
      return site?.name || id;
    });

    const siteSelectedEvent = new CustomEvent("siteSelected", {
      detail: {
        siteIds: updatedSites,
        siteNames: selectedNames, // raw names (kept as-is for internal usage)
      },
    });
    window.dispatchEvent(siteSelectedEvent);
  };

  const handleTimeframeChange = (option: { label: string; value: string }) => {
    setSelectedTimeframe(option);
    if (onDataReset) onDataReset();
  };

  const handleDateRangeChange = (start: Date, end: Date) => {
    if (onDateRangeChange) onDateRangeChange(start, end);
    if (onDataReset) onDataReset();
  };

  const getDropdownLabel = () => {
    if (sites.length === 0) return r("loadingSites");
    if (selectedSites.length === 0) return r("selectSites");
    const names = selectedSites
      .map((id) => sites.find((s) => s.id === id)?.name)
      .filter((name): name is string => typeof name === "string")
      .map((name) => translateStationName(name));
    return names.length > 1
      ? `${names[0]} +${names.length - 1} ${r("moreSites")}`
      : names[0];
  };

  if (isMobileOrTablet) {
    return (
      <div className="">
        <div className="flex items-center justify-end">
          <DownloadReportComponent />
        </div>
        <div className="">
          <h2 className="mb-3 text-lg font-bold">{r("Reports")}</h2>
          <div className="grid grid-cols-2 gap-2 w-full">
            <div className="flex items-center justify-between px-4 py-2 rounded-full w-fit">
              <span className="text-sm text-[#3b3b58] font-medium mr-4">
                {r("Single Chart")}
              </span>
              <Switch
                checked={isEnabled}
                onCheckedChange={onToggle}
                className="data-[state=checked]:bg-[#009fac] data-[state=unchecked]:bg-gray-300"
              />
            </div>
            <div className="">
              <div className="relative" ref={dropdownRef}>
                <Button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-[170px] bg-white px-4 py-2 border border-gray-300 rounded-md text-left text-black truncate"
                >
                  {getDropdownLabel()}
                </Button>

                {isDropdownOpen && (
                  <div className="absolute z-10 bg-white border border-gray-300 rounded-md shadow-md mt-2 w-[220px] max-h-60 overflow-y-auto hide-scrollbar">
                    {sites.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500">
                        {r("loadingSites")}
                      </div>
                    ) : (
                      sites.map((site) => (
                        <label
                          key={site.id}
                          className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSites.includes(site.id)}
                            onChange={(e) =>
                              handleSiteChange(site.id, e.target.checked)
                            }
                            className="mx-2"
                          />
                          {translateStationName(site.name)}
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-white px-4 py-2">
                    {selectedTimeframe?.label ?? r("selectTimeframe")}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  {timeframeOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => handleTimeframeChange(option)}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onDateRangeChange={handleDateRangeChange}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:px-4">
      <h2 className="text-2xl font-bold tracking-tight">{r("Reports")}</h2>
      <div className="flex flex-wrap gap-4 sm:items-center">
        <div className="flex items-center justify-between bg-white px-4 py-2.5 gap-2 rounded-md w-fit">
          <span className="text-sm text-black font-medium mr-4" dir="auto">
            {r("Single Chart")}
          </span>
          <Switch
            checked={isEnabled}
            onCheckedChange={onToggle}
            className="data-[state=checked]:bg-blue3 data-[state=unchecked]:bg-gray-300"
          />
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-[220px] bg-white px-4 py-2 border border-gray-300 rounded-md text-left truncate"
          >
            {getDropdownLabel()}
          </button>

          {isDropdownOpen && (
            <div className="absolute z-10 bg-white border border-gray-300 rounded-md shadow-md mt-2 w-[220px] max-h-60 overflow-y-auto hide-scrollbar">
              {sites.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">
                  {r("loadingSites")}
                </div>
              ) : (
                sites.map((site) => (
                  <label
                    key={site.id}
                    className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSites.includes(site.id)}
                      onChange={(e) =>
                        handleSiteChange(site.id, e.target.checked)
                      }
                      className="mx-2"
                    />
                    {translateStationName(site.name)}
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="bg-white px-4 py-2">
              {selectedTimeframe?.label ?? r("selectTimeframe")}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            {timeframeOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handleTimeframeChange(option)}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onDateRangeChange={handleDateRangeChange}
        />

        <DownloadReportComponent />
      </div>
    </div>
  );
}
