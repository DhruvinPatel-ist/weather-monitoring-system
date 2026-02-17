"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { LineChart, MultiLineChart } from "@/components/Reports/charts";
import { Maximize2 } from "lucide-react";
import EnlargedChart from "@/components/Enlarger/EnlargedChart";

interface ChartCardProps {
  label: string;
  data?: { time: string; fullTime?: string; value: number }[];
  color?: string;
  multiSeries?: {
    siteName: string;
    data: { time: string; fullTime?: string; value: number }[];
  }[];
  stationName?: string;
  hideTooltip?: boolean;
}

export default function ChartCard({
  label,
  data,
  color,
  multiSeries,
  stationName,
  hideTooltip,
}: ChartCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const multiSeriesLegend =
    multiSeries?.map((series, index) => ({
      label: series.siteName,
      color: `hsl(${(index * 67) % 360}, 70%, 50%)`,
    })) ?? [];

  return (
    <>
      <Card className="relative h-[250px] p-2 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="text-sm font-semibold truncate">{label}</div>
            {stationName && (
              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[11px] text-gray-700 truncate max-w-[140px]">
                {stationName}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="text-gray-500 hover:text-black"
            aria-label="Enlarge Chart"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
        <div className="h-[200px]">
          {multiSeries ? (
            <MultiLineChart series={multiSeries} hideTooltip={hideTooltip} />
          ) : (
            <LineChart
              data={data || []}
              label={label}
              color={color || "#4693f1"}
              hideTooltip={hideTooltip}
            />
          )}
        </div>
      </Card>
      <EnlargedChart
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={label}
        data={data}
        color={color}
        multiSeries={multiSeries}
        staticLegend={multiSeriesLegend}
        label={label}
        stationName={stationName}
      />
      {/* Modal for fullscreen chart */}
      {/* <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="w-full max-w-none h-[95vh] bg-white p-6 overflow-auto"
          style={{ minWidth: "95vw", maxWidth: "95vw" }}
        >
          <div className="flex justify-between items-center mb-4">
            <DialogTitle className="text-lg font-semibold">{label}</DialogTitle>
          </div>
          <div className="w-full h-[80vh]">
            {multiSeries ? (
              <MultiLineChart series={multiSeries} />
            ) : (
              <LineChart
                data={data || []}
                label={label}
                color={color || "#4693f1"}
              />
            )}
          </div>
        </DialogContent>
      </Dialog> */}
    </>
  );
}
