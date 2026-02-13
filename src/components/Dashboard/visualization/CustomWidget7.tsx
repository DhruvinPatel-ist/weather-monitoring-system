"use client";

import React from "react";

interface CompassGaugeWidgetProps {
  value: number; // 0–360 degrees
  colors?: string[]; // [arrowColor]
}

export default function CustomWidget7({
  value,
  colors = [],
}: CompassGaugeWidgetProps) {
  const clampedValue = ((value % 360) + 360) % 360; // Ensure 0-360 range
  const arrowColor = colors[0] || "#000000"; // default: black

  // Generate tick marks
  const generateTicks = () => {
    const ticks = [];
    for (let i = 0; i < 12; i++) {
      const angle = i * 30;
      const radian = (angle * Math.PI) / 180;
      const tickLength = 6;
      const radius = 32; // Adjusted for cleaner spacing

      // Calculate tick positions
      const x1 = 40 + (radius - tickLength) * Math.cos(radian);
      const y1 = 40 + (radius - tickLength) * Math.sin(radian);
      const x2 = 40 + radius * Math.cos(radian);
      const y2 = 40 + radius * Math.sin(radian);

      ticks.push(
        <line
          key={`tick-${i}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#6B7280"
          strokeWidth="1"
        />
      );
    }
    return ticks;
  };

  // Generate minor ticks
  const generateMinorTicks = () => {
    const minorTicks = [];
    for (let i = 0; i < 24; i++) {
      const angle = i * 15;
      if (angle % 30 !== 0) {
        // Skip major tick positions
        const radian = (angle * Math.PI) / 180;
        const tickLength = 3;
        const radius = 32;

        const x1 = 40 + (radius - tickLength) * Math.cos(radian);
        const y1 = 40 + (radius - tickLength) * Math.sin(radian);
        const x2 = 40 + radius * Math.cos(radian);
        const y2 = 40 + radius * Math.sin(radian);

        minorTicks.push(
          <line
            key={`minor-tick-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#9CA3AF"
            strokeWidth="0.5"
          />
        );
      }
    }
    return minorTicks;
  };

  // Generate degree labels
  const generateDegreeLabels = () => {
    const labels = [];
    for (let i = 0; i < 12; i++) {
      const angle = i * 30;
      const displayAngle = (angle + 90) % 360; // Adjust for compass orientation
      const radian = (angle * Math.PI) / 180;
      const radius = 20; // Position for degree labels

      const x = 40 + radius * Math.cos(radian);
      const y = 40 + radius * Math.sin(radian);

      labels.push(
        <text
          key={`degree-${i}`}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#6B7280"
          fontSize="5"
        >
          {displayAngle}
        </text>
      );
    }
    return labels;
  };

  // Cardinal directions positioned outside the ticks
  const cardinalDirections = [
    { label: "N", x: 40, y: 5 },
    { label: "E", x: 75, y: 40 },
    { label: "S", x: 40, y: 75 },
    { label: "W", x: 5, y: 42 },
  ];

  // Calculate arrow position based on value
  const arrowAngle = (clampedValue - 90) * (Math.PI / 180); // Convert to radians, adjust for 0° = North
  const arrowRadius = 25;
  const arrowX = 40 + arrowRadius * Math.cos(arrowAngle);
  const arrowY = 40 + arrowRadius * Math.sin(arrowAngle);

  // Calculate arrow direction (pointing outward from center)
  const arrowRotation = clampedValue;

  return (
    <div className="w-20 h-20 relative">
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        className="absolute inset-0"
      >
        {/* Outer circle */}
        {/* <circle
          cx="40"
          cy="40"
          r="32"
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="0"
        /> */}

        {/* Minor ticks */}
        {generateMinorTicks()}

        {/* Major ticks */}
        {generateTicks()}

        {/* Degree labels */}
        {generateDegreeLabels()}

        {/* Cardinal directions - positioned outside ticks */}
        {cardinalDirections.map((dir) => (
          <text
            key={dir.label}
            x={dir.x}
            y={dir.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#000000"
            fontSize="10"
            fontWeight="bold"
          >
            {dir.label}
          </text>
        ))}

        {/* Center dot */}
        {/* <circle cx="40" cy="40" r="2" fill={arrowColor} /> */}
        {/* Value display in bottom center */}
        <text
          x="40"
          y="40"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={arrowColor}
          fontSize="8"
          fontWeight="500"
        >
          {Math.round(clampedValue)}°
        </text>

        {/* Arrow pointing outward on the circle */}
        <g
          transform={`translate(${arrowX}, ${arrowY}) rotate(${arrowRotation})`}
        >
          <polygon
            points="0,-4 3,2 0,1 -3,2"
            fill={arrowColor}
            stroke={arrowColor}
            strokeWidth="0.5"
          />
        </g>
      </svg>
    </div>
  );
}
