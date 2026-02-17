"use client";

import { useState, useEffect } from "react";
import ReportsHeader from "@/components/Reports/reports-header";
import MainLayout from "@/components/layout/MainLayout";
import ReportsDashboard from "@/components/Reports/reports-dashboard";
import { useStations } from "@/hooks/useDashboard";

export type Station = {
  longitude: number;
  latitude: number;
  id: string;
  name: string;
  status: "Active" | "Inactive";
  lastUpdated: string;
  onSelectStation: (station: Station) => void;
};

export default function DashboardPage() {
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
  const [selectedSiteNames, setSelectedSiteNames] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [isSingleChartEnabled, setIsSingleChartEnabled] = useState(false);
  const [generatedData, setGeneratedData] = useState<any[]>([]);
  // Add state for start and end dates
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 1); // Default to 1 day ago (Live Data)
    return date;
  });
  const [endDate, setEndDate] = useState<Date>(new Date());

  const [selectedTimeframe, setSelectedTimeframe] = useState<{
    label: string;
    value: string;
  } | null>(null);

  const { data: stationsData = [] } = useStations();
  const stations = stationsData.map((station) => ({
    ...station,
    lastUpdated: station.lastUpdated ?? "",
    onSelectStation: () => {},
  }));

  // Handle date range changes
  const handleDateRangeChange = (start: Date, end: Date) => {
    console.log("Date range changed in page:", start, end);
    setStartDate(start);
    setEndDate(end);
  };

  useEffect(() => {
    const handleSiteSelected = (event: CustomEvent) => {
      setSelectedSiteIds(event.detail.siteIds);
      setSelectedSiteNames(event.detail.siteNames);
    };

    const handleDateSelected = (event: CustomEvent) => {
      setSelectedDate(event.detail.date);
    };

    window.addEventListener(
      "siteSelected",
      handleSiteSelected as EventListener
    );
    window.addEventListener(
      "dateSelected",
      handleDateSelected as EventListener
    );

    return () => {
      window.removeEventListener(
        "siteSelected",
        handleSiteSelected as EventListener
      );
      window.removeEventListener(
        "dateSelected",
        handleDateSelected as EventListener
      );
    };
  }, []);

  return (
    <MainLayout>
      <div className="flex flex-col w-full h-full">
        <ReportsHeader
          selectedTimeframe={selectedTimeframe}
          setSelectedTimeframe={setSelectedTimeframe}
          stations={stations}
          isEnabled={isSingleChartEnabled}
          onToggle={setIsSingleChartEnabled}
          startDate={startDate}
          endDate={endDate}
          onDateRangeChange={handleDateRangeChange}
          generatedData={generatedData}
        />
        <div className="flex flex-col h-full lg:flex-row mt-3">
          <ReportsDashboard
            selectedTimeframe={selectedTimeframe}
            setSelectedTimeframe={setSelectedTimeframe}
            selectedSiteIds={selectedSiteIds}
            selectedSiteNames={selectedSiteNames}
            selectedDate={selectedDate}
            isSingleChartEnabled={isSingleChartEnabled}
            onClearSite={() => {
              // Clear selected sites
              setSelectedSiteIds([]);
              setSelectedSiteNames([]);
              // Reset generated data
              setGeneratedData([]);
              // Clear timeframe to ensure EmptyState shows
              setSelectedTimeframe(null);

              // Dispatch custom event to notify header component
              const siteSelectedEvent = new CustomEvent("siteSelected", {
                detail: {
                  siteIds: [],
                  siteNames: [],
                },
              });
              window.dispatchEvent(siteSelectedEvent);
              window.dispatchEvent(new CustomEvent("siteCleared"));
              const metricSelectedEvent = new CustomEvent("metricSelected", {
                detail: {
                  metricKeys: [],
                },
              });
              window.dispatchEvent(metricSelectedEvent);
            }}
            onClearDate={() => setSelectedDate("")}
            generatedData={generatedData}
            setGeneratedData={setGeneratedData}
            startDate={startDate}
            endDate={endDate}
          />
        </div>
      </div>
    </MainLayout>
  );
}
