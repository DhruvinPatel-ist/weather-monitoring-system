"use client";

import React from "react";

interface CustomWidget2Props {
  value: number;
  min: number;
  max: number;
  colors?: string[]; // Optional: one or more colors
}

export function CustomWidget2({
  value,
  min,
  max,
  colors = [],
}: CustomWidget2Props) {
  const defaultColors = ["#00ACC1", "#26C6DA", "#4DD0E1", "#B2EBF2"];

  const clampedValue = Math.max(min, Math.min(value, max));
  const percentage = ((clampedValue - min) / (max - min)) * 100;

  const levels = [25, 50, 75, 100];
  const filledLevels = levels.map((level) => percentage >= level);

  const barHeight = 18.86;
  const barWidth = 27.74;
  const startY = 79.21;

  const baseColor = colors.length > 0 ? colors[0] : null;

  return (
    <svg
      width="83"
      height="83"
      viewBox="0 0 83 83"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {levels.map((_, index) => {
        const y = startY - index * barHeight;
        const opacity = filledLevels[index] ? 1 : 0.15;
        const fillColor = baseColor || defaultColors[index];

        return (
          <rect
            key={index}
            x="56.3359"
            y={y}
            width={barWidth}
            height={barHeight}
            transform={`rotate(180 56.3359 ${y})`}
            fill={fillColor}
            fillOpacity={opacity}
          />
        );
      })}
    </svg>
  );
}
