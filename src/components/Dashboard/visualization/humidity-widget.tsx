"use client";

import { useState, useEffect } from "react";

interface HumidityWidgetProps {
  value: number;
  min?: number;
  max?: number;
  colors?: string[]; // colors[0] will be used for the bar
}

export default function HumidityWidget({
  value,
  min = 0,
  max = 100,
  colors = [],
}: HumidityWidgetProps) {
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    const calculatedPercentage = ((value - min) / (max - min)) * 100;
    setPercentage(Math.min(Math.max(calculatedPercentage, 0), 100));
  }, [value, min, max]);

  const barColor = colors[0] || "#60A5FA"; // fallback to blue-400 if no color is passed

  return (
    <div className="relative w-30 h-8 mt-5 bg-gray-300 rounded-2xl shadow-2xs overflow-hidden">
      <div
        className="absolute left-0 h-full transition-all duration-300 rounded-r-2xl"
        style={{
          width: `${percentage}%`,
          backgroundColor: barColor,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-medium text-sm z-10 ml-8">
            {value.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
