"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface GaugeProps {
  value: number;
  min: number;
  max: number;
  colors?: string[]; // [low, medium, high]
  paddingAngle?: number;
}

export default function WindSpeedGauge({
  value,
  min,
  max,
  colors = [],
}: GaugeProps) {
  const clampedValue = Math.min(Math.max(value, min), max);
  const normalizedValue = (clampedValue - min) / (max - min); // 0 to 1
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    setAnimatedValue(normalizedValue);
  }, [normalizedValue]);

  const segmentSteps = [1 / 3, 2 / 3, 1]; // 33%, 66%, 100%

  const createGaugeData = () => {
    const data = [];
    let previousStep = 0;

    for (let i = 0; i < segmentSteps.length; i++) {
      const stepValue = segmentSteps[i];

      if (animatedValue > previousStep) {
        const segmentValue = Math.min(animatedValue, stepValue) - previousStep;
        if (segmentValue > 0) {
          data.push({
            name: `filled-${i}`,
            value: segmentValue,
            color: colors[i] || colors[colors.length - 1],
            isFilled: true,
          });
        }
      }

      previousStep = stepValue;
    }

    // Add empty segment if not 100%
    if (animatedValue < 1) {
      data.push({
        name: "empty",
        value: 1 - animatedValue,
        color: "#e5e7eb", // Tailwind gray-200
        isFilled: false,
      });
    }

    return data;
  };

  const gaugeData = createGaugeData();

  return (
    <div className="w-48 h-20">
      <div className="w-36 h-16 mx-auto">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={gaugeData}
              cx="50%"
              cy="100%"
              startAngle={220}
              endAngle={-40}
              innerRadius={45}
              outerRadius={60}
              dataKey="value"
              isAnimationActive={true}
              animationDuration={500}
            >
              {gaugeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              {/* <Label
                value={clampedValue.toFixed(1)}
                position="center"
                className="text-sm font-bold text-black"
                dy={-15}
              /> */}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="w-36 h-16 mx-auto">
        <div className="flex justify-between mt-1">
          <div className="text-xs font-semibold text-black">
            {min.toFixed(1)}
          </div>
          <div className="text-xs font-semibold text-black">
            {max.toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  );
}
