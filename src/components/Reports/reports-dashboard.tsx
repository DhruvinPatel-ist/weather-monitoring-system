/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X } from "lucide-react";
import MetricsPanel from "./metrics-panel";
import ChartsPanel from "./charts-panel";
import EmptyState from "./empty-state";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { useTranslations } from "next-intl";
import SiteDataTable from "./data/data-table";
import Alerts from "@/components/Reports/Alerts/ReportAlerts";

interface ReportsDashboardProps {
    selectedSiteIds: string[];
    selectedSiteNames: string[];
    selectedDate: string;
    isSingleChartEnabled: boolean;
    onClearSite: () => void;
    onClearDate: () => void;
    generatedData: any[];
    setGeneratedData: (data: any[]) => void;
    selectedTimeframe: { label: string; value: string } | null;
    setSelectedTimeframe: (option: { label: string; value: string }) => void;
    startDate: Date;
    endDate: Date;
}

export default function ReportsDashboard({
                                             selectedTimeframe,
                                             // setSelectedTimeframe,
                                             generatedData,
                                             setGeneratedData,
                                             selectedSiteIds,
                                             selectedSiteNames,
                                             selectedDate,
                                             isSingleChartEnabled,
                                             onClearSite,
                                             onClearDate,
                                             startDate,
                                             endDate,
                                         }: ReportsDashboardProps) {
    const t = useTranslations();
    const isMobileOrTablet = useDeviceDetection();
    const [isTopPanelOpen, setIsTopPanelOpen] = useState(true);
    const [hasSelectedMetrics, setHasSelectedMetrics] = useState(false);
    const [siteMetricsMap, setSiteMetricsMap] = useState<
        Record<string, Record<string, boolean>>
    >({});
    const [, setResetTrigger] = useState(0);

    const defaultMetrics = {
        latitude: false,
        longitude: false,
        gpsFix: false,
        windSpeed: false,
        windDirection: false,
        airTemperature: false,
        humidity: false,
        rain: false,
        srad: false,
        sradCumulative: false,
        biometricPressure: false,
    };

    const handleSiteChange = (siteId: string) => {
        // console.log("Site changed to:", siteId);
    };

    // Enhanced clear date handler that resets all data
    const handleClearDate = () => {
        // Clear generated data
        setGeneratedData([]);
        // Reset site metrics map
        setSiteMetricsMap({});
        // Reset has selected metrics
        setHasSelectedMetrics(false);
        // Trigger reset in header component
        setResetTrigger((prev) => prev + 1);
        // Dispatch event to clear sites in header
        window.dispatchEvent(new CustomEvent("siteCleared"));
        // Call the original clear date function
        onClearDate();
    };

    // Enhanced clear site handler that resets all data
    const handleClearSite = () => {
        // Clear generated data
        setGeneratedData([]);
        // Reset site metrics map
        setSiteMetricsMap({});
        // Reset has selected metrics
        setHasSelectedMetrics(false);
        // Call the original clear site function
        onClearSite();
    };

    useEffect(() => {
        const anySelected = Object.values(siteMetricsMap).some((metrics) =>
            Object.values(metrics).some((value) => value)
        );
        setHasSelectedMetrics(anySelected);
    }, [siteMetricsMap]);

    const hasDateAndSite = Boolean(selectedDate && selectedSiteIds.length > 0);
    const hasTimeframe = Boolean(selectedTimeframe);

    useEffect(() => {
        // console.log("📊 generatedData updated:");
    }, [generatedData]);

    // Helper function to translate site names
    const getTranslatedSiteNames = (siteNames: string[]) => {
        return siteNames.join(", ");
    };

    if (!hasDateAndSite && !hasTimeframe && startDate && endDate) {
        return (
            <div className="flex items-center justify-center w-full h-[calc(100vh-110px)]">
                <EmptyState />
            </div>
        );
    }

    if (isMobileOrTablet) {
        return (
            <div className="flex flex-col w-full h-[calc(100%-150px)] overflow-hidden">
                {/* Metrics Panel */}
                <div className="w-full">
                    <MetricsPanel
                        selectedTimeframe={selectedTimeframe}
                        selectedSiteIds={selectedSiteIds}
                        selectedSiteNames={selectedSiteNames}
                        isTopPanelOpen={isTopPanelOpen}
                        setIsTopPanelOpen={setIsTopPanelOpen}
                        handleSiteChange={handleSiteChange}
                        isSingleChartEnabled={isSingleChartEnabled}
                        sites={[]}
                        generatedData={generatedData}
                        setGeneratedData={setGeneratedData}
                        siteMetricsMap={siteMetricsMap}
                        setSiteMetricsMap={setSiteMetricsMap}
                        selectedMetrics={defaultMetrics}
                        toggleMetric={() => {}}
                        startDate={startDate}
                        endDate={endDate}
                        onDateRangeChange={() => {}}
                    />
                </div>

                {/* Tabs Section */}
                <div className="flex-1 overflow-y-auto px-2 pb-4">
                    <Tabs defaultValue="charts" className="w-full">
                        {/* Tab Triggers */}
                        <div className="flex justify-center items-center w-full">
                            <TabsList className="bg-transparent gap-2 w-full flex justify-between px-1">
                                <TabsTrigger
                                    value="charts"
                                    className="w-full text-xs rounded-sm border border-gray-300 data-[state=active]:bg-blue1 data-[state=active]:text-white"
                                >
                                    {t("Navigation.Charts")}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="data"
                                    className="w-full text-xs rounded-sm border border-gray-300 data-[state=active]:bg-blue1 data-[state=active]:text-white"
                                >
                                    {t("Navigation.Data")}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="alerts"
                                    className="w-full text-xs rounded-sm border border-gray-300 data-[state=active]:bg-blue1 data-[state=active]:text-white"
                                >
                                    {t("Navigation.Alerts")}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Tab Contents */}
                        <TabsContent value="charts" className="pt-4 flex-1 min-h-0 overflow-hidden">
                            {hasSelectedMetrics ? (
                                <ChartsPanel
                                    selectedMetrics={defaultMetrics}
                                    selectedTimeframe={selectedTimeframe}
                                    isSingleChartEnabled={isSingleChartEnabled}
                                    generatedData={generatedData}
                                    siteMetricsMap={siteMetricsMap}
                                />
                            ) : (
                                <div className="bg-white p-6 rounded-md text-center text-sm text-gray-500">
                                    {t(
                                        "Reports.Please select at least one metric to display charts"
                                    )}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="data" className="pt-4 overflow-x-auto">
                            <SiteDataTable generatedData={generatedData} />
                        </TabsContent>

                        <TabsContent value="alerts" className="pt-4">
                            <Alerts
                                startDate={startDate}
                                endDate={endDate}
                                selectedSiteIds={selectedSiteIds}
                                selectedTimeframe={selectedTimeframe}
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-4 w-full h-[calc(100vh-120px)] px-4">
            <MetricsPanel
                selectedTimeframe={selectedTimeframe}
                selectedSiteIds={selectedSiteIds}
                selectedSiteNames={selectedSiteNames}
                isTopPanelOpen={isTopPanelOpen}
                setIsTopPanelOpen={setIsTopPanelOpen}
                handleSiteChange={handleSiteChange}
                isSingleChartEnabled={isSingleChartEnabled}
                sites={[]}
                generatedData={generatedData}
                setGeneratedData={setGeneratedData}
                siteMetricsMap={siteMetricsMap}
                setSiteMetricsMap={setSiteMetricsMap}
                selectedMetrics={defaultMetrics}
                toggleMetric={() => {}}
                startDate={startDate}
                endDate={endDate}
                onDateRangeChange={() => {}}
            />

            <div className="flex-1 min-w-0 flex flex-col">
                <Tabs defaultValue="charts" className="mb-4 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <TabsList className="bg-transparent gap-4">
                            <TabsTrigger
                                value="charts"
                                className="data-[state=active]:bg-blue1 data-[state=active]:text-white border border-gray-300 rounded-sm text-xs"
                            >
                                {t("Navigation.Charts")}
                            </TabsTrigger>
                            <TabsTrigger
                                value="data"
                                className="data-[state=active]:bg-blue1 data-[state=active]:text-white border border-gray-300 rounded-sm text-xs"
                            >
                                {t("Navigation.Data")}
                            </TabsTrigger>
                            <TabsTrigger
                                value="alerts"
                                className="data-[state=active]:bg-blue1 data-[state=active]:text-white border border-gray-300 rounded-sm text-xs"
                            >
                                {t("Navigation.Alerts")}
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex items-center gap-2">
                            {selectedSiteNames.length > 0 && (
                                <div className="flex items-center px-3 py-1 bg-white rounded-md shadow-sm">
                                    <h3 className="font-medium text-blue1 mr-2">
                                        {getTranslatedSiteNames(selectedSiteNames)}
                                    </h3>
                                    <button
                                        onClick={handleClearSite}
                                        className="text-gray-500 hover:text-gray-700"
                                        aria-label="Clear site selection"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}

                            {selectedDate && (
                                <div className="flex items-center px-3 py-1 bg-white rounded-md shadow-sm">
                                    <span className="text-gray-600 mr-2">{selectedDate}</span>
                                    <button
                                        onClick={handleClearDate}
                                        className="text-gray-500 hover:text-gray-700"
                                        aria-label="Clear date selection"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <TabsContent value="charts" className="flex-1 min-h-0 overflow-hidden">
                        {hasSelectedMetrics ? (
                            <ChartsPanel
                                selectedMetrics={defaultMetrics}
                                selectedTimeframe={selectedTimeframe}
                                isSingleChartEnabled={isSingleChartEnabled}
                                generatedData={generatedData}
                                siteMetricsMap={siteMetricsMap}
                            />
                        ) : (
                            <div className="bg-white p-6 rounded-md text-center">
                                <p className="text-gray-500">
                                    {t(
                                        "Reports.Please select at least one metric to display charts"
                                    )}
                                </p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="data" className="overflow-x-auto h-full">
                        <SiteDataTable
                            generatedData={generatedData}
                            siteMetricsMap={siteMetricsMap}
                            selectedMetrics={defaultMetrics}
                        />
                    </TabsContent>

                    <TabsContent value="alerts">
                        <Alerts
                            startDate={startDate}
                            endDate={endDate}
                            selectedSiteIds={selectedSiteIds}
                            selectedTimeframe={selectedTimeframe}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
