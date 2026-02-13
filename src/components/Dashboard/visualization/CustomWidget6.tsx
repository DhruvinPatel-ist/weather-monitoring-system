"use client";

import React from "react";

interface LinearProgressWidgetProps {
  value: number; // 0–100
  colors?: string[]; // [progressColor, backgroundColor]
  label?: string;
}

export default function CustomWidget6({
  value,
  colors = [],
  label,
}: LinearProgressWidgetProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const progressColor = colors[0] || "#6366F1"; // default: indigo
  const bgColor = colors[1] || "#E5E7EB"; // default: gray

  return (
    <div className="w-full h-[70px] flex flex-col justify-center max-w-xs">
      {label && <div className="mb-1 text-sm text-gray-600">{label}</div>}
      <div
        className="w-[100px] h-4 rounded-full"
        style={{ backgroundColor: bgColor }}
      >
        <div
          className="h-4 max-w-[100px] rounded-full transition-all duration-300 ease-in-out"
          style={{
            width: `${clampedValue}%`,
            backgroundColor: progressColor,
          }}
        ></div>
      </div>
      {/* <div className="text-center text-xs text-gray-500 mt-1">
        {clampedValue}
      </div> */}
    </div>
  );
}
