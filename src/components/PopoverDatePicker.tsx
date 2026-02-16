"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/CustomCalendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslations } from "@/hooks/useTranslations";

const predefinedRanges = [
  { label: "Last 7 days", days: 7, key: "last7Days" },
  { label: "Last 14 days", days: 14, key: "last14Days" },
  { label: "Last 30 days", days: 30, key: "last30Days" },
  { label: "Last 3 months", days: 90, key: "last3Months" },
  { label: "Last 12 months", days: 365, key: "last12Months" },
];

interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onDateRangeChange?: (start: Date, end: Date) => void;
  className?: string;
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DateRangePicker({
  startDate = new Date(),
  endDate = new Date(),
  onDateRangeChange,
  className,
  disabled = false,
  onOpenChange,
}: DateRangePickerProps) {
  const t = useTranslations();
  const [selectedStartDate, setSelectedStartDate] =
    React.useState<Date>(startDate);
  const [selectedEndDate, setSelectedEndDate] = React.useState<Date>(endDate);
  const [tempStart, setTempStart] = React.useState<Date>(startDate);
  const [tempEnd, setTempEnd] = React.useState<Date>(endDate);
  const [open, setOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"start" | "end">("start");
  const [screenSize, setScreenSize] = React.useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isLargeScreen: false,
  });

  React.useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      // const height = window.innerHeight;
      setScreenSize({
        isMobile: width < 640, // < sm
        isTablet: width >= 640 && width < 1024, // sm to lg
        isDesktop: width >= 1024 && width < 1440, // lg to xl
        isLargeScreen: width >= 1440, // xl+
      });
    };

    updateScreenSize();
    window.addEventListener("resize", updateScreenSize);
    return () => window.removeEventListener("resize", updateScreenSize);
  }, []);

  // Close popover when disabled becomes true
  React.useEffect(() => {
    if (disabled && open) {
      setOpen(false);
    }
  }, [disabled, open]);

  // Notify parent when open state changes
  React.useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  // Handle open state changes
  const handleOpenChange = (isOpen: boolean) => {
    if (!disabled) {
      setOpen(isOpen);
    }
  };

  const { isMobile, isTablet } = screenSize;

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    if (isMobile) {
      return `${day}/${month.toString().padStart(2, "0")}/${year
        .toString()
        .slice(-2)}`;
    } else if (isTablet) {
      const monthName = date.toLocaleString("default", { month: "short" });
      return `${day} ${monthName.slice(0, 3)} ${year.toString().slice(-2)}`;
    }
    const monthName = date.toLocaleString("default", { month: "short" });
    return `${day} ${monthName} ${year}`;
  };

  const applySelection = () => {
    setSelectedStartDate(tempStart);
    setSelectedEndDate(tempEnd);
    onDateRangeChange?.(tempStart, tempEnd);
    setOpen(false);
  };

  const handlePredefinedSelect = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days + 1);
    setTempStart(start);
    setTempEnd(end);
    // Auto apply for mobile quick selections
    if (isMobile) {
      setTimeout(() => {
        setSelectedStartDate(start);
        setSelectedEndDate(end);
        onDateRangeChange?.(start, end);
        setOpen(false);
      }, 100);
    }
  };

  const getTranslatedRangeLabel = (key: string) => {
    const translations: { [key: string]: string } = {
      last7Days: t("DateRangePicker.last7Days") || "Last 7 days",
      last14Days: t("DateRangePicker.last14Days") || "Last 14 days",
      last30Days: t("DateRangePicker.last30Days") || "Last 30 days",
      last3Months: t("DateRangePicker.last3Months") || "Last 3 months",
      last12Months: t("DateRangePicker.last12Months") || "Last 12 months",
    };
    return translations[key] || key;
  };

  const getMobileRangeLabel = (key: string) => {
    const mobileLabels: { [key: string]: string } = {
      last7Days: "7d",
      last14Days: "14d",
      last30Days: "30d",
      last3Months: "3m",
      last12Months: "12m",
    };
    return mobileLabels[key] || getTranslatedRangeLabel(key);
  };

  const getTabletRangeLabel = (key: string) => {
    const tabletLabels: { [key: string]: string } = {
      last7Days: "7 days",
      last14Days: "14 days",
      last30Days: "30 days",
      last3Months: "3 months",
      last12Months: "12 months",
    };
    return tabletLabels[key] || getTranslatedRangeLabel(key);
  };

  // Mobile-first design
  if (isMobile) {
    return (
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            dir="ltr"
            disabled={disabled}
            className={cn(
              "flex items-center justify-between gap-1 px-2 py-1 text-xs h-7 max-w-[180px] min-w-[120px]",
              className
            )}
          >
            <span className="truncate text-left text-[10px]">
              {`${formatDate(selectedStartDate)} - ${formatDate(
                selectedEndDate
              )}`}
            </span>
            <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[calc(100vw-8px)] max-w-[calc(100vw-8px)] p-1 mx-1 shadow-xl bg-white rounded-md border max-h-[calc(100vh-150px)] overflow-hidden flex flex-col"
          align="center"
          side="bottom"
          sideOffset={2}
          avoidCollisions={true}
        >
          {/* Quick Select First on Mobile */}
          <div className="mb-2 flex-shrink-0">
            <p className="font-medium text-xs mb-1.5 px-1">Quick Select</p>
            <div className="grid grid-cols-3 gap-0.5">
              {predefinedRanges.map((range) => (
                <button
                  key={range.key}
                  onClick={() => handlePredefinedSelect(range.days)}
                  className="text-center hover:bg-gray-100 rounded text-[9px] p-1 leading-tight font-medium border border-gray-200 min-h-[24px] flex items-center justify-center"
                >
                  {getMobileRangeLabel(range.key)}
                </button>
              ))}
              <button
                onClick={() => {
                  const today = new Date();
                  setTempStart(today);
                  setTempEnd(today);
                  setTimeout(() => {
                    setSelectedStartDate(today);
                    setSelectedEndDate(today);
                    onDateRangeChange?.(today, today);
                    setOpen(false);
                  }, 100);
                }}
                className="text-center hover:bg-gray-100 rounded text-[9px] p-1 leading-tight font-medium border border-gray-200 min-h-[24px] flex items-center justify-center"
              >
                Today
              </button>
            </div>
          </div>

          {/* Tab Navigation for Calendar */}
          <div className="border-t pt-2 flex-1 flex flex-col min-h-0">
            <div className="flex mb-2 bg-gray-100 rounded p-0.5 flex-shrink-0">
              <button
                onClick={() => setActiveTab("start")}
                className={cn(
                  "flex-1 text-xs py-1 px-2 rounded transition-colors",
                  activeTab === "start"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600"
                )}
              >
                Start: {formatDate(tempStart)}
              </button>
              <button
                onClick={() => setActiveTab("end")}
                className={cn(
                  "flex-1 text-xs py-1 px-2 rounded transition-colors",
                  activeTab === "end"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600"
                )}
              >
                End: {formatDate(tempEnd)}
              </button>
            </div>

            {/* Single Calendar View - Scrollable */}
            <div className="flex justify-center mb-2 flex-1 overflow-y-auto min-h-0">
              <div className="bg-gray-50/30 border rounded p-0.5 scale-[0.85] origin-center">
                <Calendar
                  selected={activeTab === "start" ? tempStart : tempEnd}
                  startDate={tempStart}
                  endDate={tempEnd}
                  disableFuture={true}
                  month={
                    activeTab === "start"
                      ? tempStart.getMonth()
                      : tempEnd.getMonth()
                  }
                  year={
                    activeTab === "start"
                      ? tempStart.getFullYear()
                      : tempEnd.getFullYear()
                  }
                  onSelect={(date: Date) => {
                    const today = new Date();
                    if (activeTab === "start") {
                      if (date > tempEnd || date > today) {
                        toast.warning(
                          "Start date cannot be after end date or in the future."
                        );
                        return;
                      }
                      setTempStart(date);
                      setActiveTab("end"); // Auto switch to end date
                    } else {
                      if (date < tempStart || date > today) {
                        toast.warning(
                          "End date cannot be before start date or in the future."
                        );
                        return;
                      }
                      setTempEnd(date);
                    }
                  }}
                />
              </div>
            </div>

            {/* Action Buttons - Always at bottom */}
            <div className="flex gap-1 border-t pt-1.5 mt-auto bg-white flex-shrink-0">
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                className="flex-1 text-xs h-7 px-2"
              >
                Cancel
              </Button>
              <Button
                className="bg-blue3 hover:bg-blue3 flex-1 text-xs h-7 px-2"
                onClick={applySelection}
              >
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Tablet Layout - Completely redesigned for better fit
  if (isTablet) {
    return (
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            dir="ltr"
            disabled={disabled}
            className={cn(
              "flex items-center justify-between gap-2 px-2.5 py-1.5 text-sm h-8 max-w-[280px] min-w-[200px]",
              className
            )}
          >
            <span className="truncate text-left">
              {`${formatDate(selectedStartDate)} - ${formatDate(
                selectedEndDate
              )}`}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[calc(100vw-16px)] max-w-[580px] p-3 mx-2 shadow-xl bg-white rounded-lg border max-h-[calc(100vh-120px)] overflow-hidden flex flex-col"
          align="center"
          side="bottom"
          sideOffset={4}
          avoidCollisions={true}
        >
          {/* Quick Select at Top for Tablet */}
          <div className="mb-3 flex-shrink-0">
            <p className="font-medium text-sm mb-2">Quick Select</p>
            <div className="grid grid-cols-3 gap-1.5">
              {predefinedRanges.map((range) => (
                <button
                  key={range.key}
                  onClick={() => handlePredefinedSelect(range.days)}
                  className="text-center hover:bg-gray-100 rounded text-xs p-2 leading-tight font-medium border border-gray-200 min-h-[32px] flex items-center justify-center transition-colors"
                >
                  {getTabletRangeLabel(range.key)}
                </button>
              ))}
              <button
                onClick={() => {
                  const today = new Date();
                  setTempStart(today);
                  setTempEnd(today);
                }}
                className="text-center hover:bg-gray-100 rounded text-xs p-2 leading-tight font-medium border border-gray-200 min-h-[32px] flex items-center justify-center transition-colors"
              >
                Today
              </button>
            </div>
          </div>

          {/* Calendar Section */}
          <div className="border-t pt-3 flex-1 flex flex-col min-h-0">
            <div className="grid grid-cols-1 gap-3 flex-1 overflow-y-auto">
              {/* Start Date */}
              <div className="space-y-2">
                <p className="font-medium text-sm">Start Date</p>
                <div className="flex justify-center items-center rounded-md border overflow-hidden bg-gray-50/30 p-1.5">
                  <Calendar
                    selected={tempStart}
                    startDate={tempStart}
                    endDate={tempEnd}
                    disableFuture={true}
                    month={
                      tempStart.getMonth() - 1 < 0
                        ? 11
                        : tempStart.getMonth() - 1
                    }
                    year={
                      tempStart.getMonth() - 1 < 0
                        ? tempStart.getFullYear() - 1
                        : tempStart.getFullYear()
                    }
                    onSelect={(date: Date) => {
                      const today = new Date();
                      if (date > tempEnd || date > today) {
                        toast.warning(
                          "Start date cannot be after end date or in the future."
                        );
                        return;
                      }
                      setTempStart(date);
                    }}
                  />
                </div>
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <p className="font-medium text-sm">End Date</p>
                <div className="flex justify-center items-center rounded-md border overflow-hidden bg-gray-50/30 p-1.5">
                  <Calendar
                    selected={tempEnd}
                    startDate={tempStart}
                    endDate={tempEnd}
                    disableFuture={true}
                    month={tempEnd.getMonth()}
                    year={tempEnd.getFullYear()}
                    onSelect={(date: Date) => {
                      const today = new Date();
                      if (date < tempStart || date > today) {
                        toast.warning(
                          "End date cannot be before start date or in the future."
                        );
                        return;
                      }
                      setTempEnd(date);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons - Always visible at bottom */}
            <div className="flex gap-2 mt-4 pt-3 border-t bg-white flex-shrink-0">
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                className="flex-1 text-sm h-9 px-3"
              >
                Cancel
              </Button>
              <Button
                className="bg-blue3 hover:bg-blue3 flex-1 text-sm h-9 px-3"
                onClick={applySelection}
              >
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Desktop Layout (side-by-side calendars)
  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          dir="ltr"
          disabled={disabled}
          className={cn(
            "flex items-center justify-between gap-2 px-3 py-2 text-sm w-full sm:w-auto min-w-0 h-9",
            className
          )}
        >
          <span className="truncate text-left">
            {`${formatDate(selectedStartDate)} - ${formatDate(
              selectedEndDate
            )}`}
          </span>
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[700px] max-w-[700px] p-4 shadow-xl bg-white rounded-lg border"
        align="start"
        side="bottom"
        sideOffset={4}
        avoidCollisions={true}
      >
        <div className="flex flex-row gap-4">
          {/* Calendar Section */}
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="space-y-2">
                <p className="font-medium text-sm">Start Date</p>
                <div className="flex justify-center items-center rounded-md border overflow-hidden bg-gray-50/30 p-1.5">
                  <Calendar
                    selected={tempStart}
                    startDate={tempStart}
                    endDate={tempEnd}
                    disableFuture={true}
                    month={
                      tempStart.getMonth() - 1 < 0
                        ? 11
                        : tempStart.getMonth() - 1
                    }
                    year={
                      tempStart.getMonth() - 1 < 0
                        ? tempStart.getFullYear() - 1
                        : tempStart.getFullYear()
                    }
                    onSelect={(date: Date) => {
                      const today = new Date();
                      if (date > tempEnd || date > today) {
                        toast.warning(
                          "Start date cannot be after end date or in the future."
                        );
                        return;
                      }
                      setTempStart(date);
                    }}
                  />
                </div>
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <p className="font-medium text-sm">End Date</p>
                <div className="flex justify-center items-center rounded-md border overflow-hidden bg-gray-50/30 p-1.5">
                  <Calendar
                    selected={tempEnd}
                    startDate={tempStart}
                    endDate={tempEnd}
                    disableFuture={true}
                    month={tempEnd.getMonth()}
                    year={tempEnd.getFullYear()}
                    onSelect={(date: Date) => {
                      const today = new Date();
                      if (date < tempStart || date > today) {
                        toast.warning(
                          "End date cannot be before start date or in the future."
                        );
                        return;
                      }
                      setTempEnd(date);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col text-gray-600 w-40">
            <div className="flex-1">
              <div className="grid grid-cols-1 gap-1">
                {predefinedRanges.map((range) => (
                  <button
                    key={range.key}
                    onClick={() => handlePredefinedSelect(range.days)}
                    className="text-left hover:bg-gray-100 rounded transition-colors font-medium text-sm p-2 mb-0.5"
                  >
                    {getTranslatedRangeLabel(range.key)}
                  </button>
                ))}
                <button
                  onClick={() => {
                    const today = new Date();
                    setTempStart(today);
                    setTempEnd(today);
                  }}
                  className="text-left hover:bg-gray-100 rounded transition-colors font-medium text-sm p-2 mb-0.5"
                >
                  Today
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-3 pt-2 border-t">
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                className="text-sm h-8 flex-none"
              >
                Cancel
              </Button>
              <Button
                className="bg-blue3 hover:bg-blue3 text-sm h-8 flex-none"
                onClick={applySelection}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
