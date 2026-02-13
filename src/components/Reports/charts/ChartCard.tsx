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
}

export default function ChartCard({
  label,
  data,
  color,
  multiSeries,
}: ChartCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Card className="relative h-[250px] p-2 shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-semibold">{label}</div>
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
            <MultiLineChart series={multiSeries} />
          ) : (
            <LineChart
              data={data || []}
              label={label}
              color={color || "#4693f1"}
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
        label={label}
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
