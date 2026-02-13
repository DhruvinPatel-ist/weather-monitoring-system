"use client";

import React from "react";

interface CustomWidget4Props {
  value: number;
  size?: number;
  colors?: string[]; // [start, mid, end]
  min?: number;
  max?: number;
}

export function CustomWidget4({
  value,
  size = 85,
  colors = [],
  min,
  max,
}: CustomWidget4Props) {
  // Calculate percentage based on min/max range
  const safeMin = min ?? 0;
  const safeMax = max ?? 100;
  const clampedValue = Math.max(safeMin, Math.min(safeMax, value));
  const percentage = ((clampedValue - safeMin) / (safeMax - safeMin)) * 100;

  const radius = 50;
  const strokeWidth = 8;
  const center = 60;
  const circumference = 2 * Math.PI * radius;

  // Calculate arc properties for 270-degree arc (3/4 circle)
  const totalArcLength = circumference * 0.75;
  const progressArcLength = (percentage / 100) * totalArcLength;
  const strokeOffset = totalArcLength - progressArcLength;

  // Merge with fallback colors
  const mergedColors = [
    colors[0] || "#FF5722",
    colors[1] || "#E57373",
    colors[2] || "#E0E0E0",
  ];

  // Background track color
  const backgroundTrackColor = colors[2] || "#E0E0E0";

  // Generate unique ID for this widget instance
  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox="0 0 120 120">
        {/* Gradient definition - moved to top */}
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={mergedColors[0]} />
            <stop offset="50%" stopColor={mergedColors[1]} />
            <stop offset="100%" stopColor={mergedColors[2]} />
          </linearGradient>
        </defs>

        <g transform="rotate(135 60 60)">
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={backgroundTrackColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={totalArcLength}
            strokeDashoffset={0}
            strokeLinecap="round"
            opacity={0.3}
          />

          {/* Progress arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={totalArcLength}
            strokeDashoffset={strokeOffset}
            style={{
              transition: "stroke-dashoffset 0.3s ease-in-out",
            }}
          />
        </g>
      </svg>

      {/* Center Value Text - shows actual value */}
      <div className="absolute text-sm font-semibold text-gray-800">
        {clampedValue.toFixed(1)}
      </div>
    </div>
  );
}
