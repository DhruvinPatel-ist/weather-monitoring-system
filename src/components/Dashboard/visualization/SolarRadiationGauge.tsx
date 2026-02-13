"use client";
import React, { useEffect, useRef, useState } from "react";

interface SolarRadiationGaugeProps {
  value: number; // expected between 0 to 1000
  locale?: string; // optional locale, e.g., "en", "ar"
}

export function SolarRadiationGauge({
  value,
  locale = "en",
}: SolarRadiationGaugeProps) {
  const min = 0;
  const max = 1000;
  const safeValue = Math.max(min, Math.min(max, value));
  const isRTL = locale === "ar"; // or any other RTL language code
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(170);

  // Monitor container width and update component size accordingly
  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      if (containerRef.current) {
        // Get the parent element's width (the metric card content)
        const parentWidth =
          containerRef.current.parentElement?.clientWidth || 170;
        // Calculate appropriate width based on parent container
        // Use 85% of parent width but cap between 100px and 170px
        const newWidth = Math.min(Math.max(parentWidth * 0.85, 100), 170);
        setContainerWidth(newWidth);
      }
    };

    // Initial measurement
    updateWidth();

    // Set up resize observer to respond to container size changes
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Clean up
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      resizeObserver.disconnect();
    };
  }, []);

  // Calculate sizes proportionally based on container width
  const barWidth = containerWidth;
  const pointerX = isRTL
    ? barWidth - (safeValue / 1000) * barWidth
    : (safeValue / 1000) * barWidth;

  // Scale font and element sizes proportionally to container width
  const scaleFactor = containerWidth / 170; // 170px is our reference "full size"
  const fontSize = Math.max(7, Math.round(10 * scaleFactor));
  const tickFontSize = Math.max(6, Math.round(9 * scaleFactor));
  // const pointerTop = Math.round(-14 * scaleFactor);
  const barHeight = Math.max(10, Math.round(16 * scaleFactor));
  const triangleSize = Math.max(6, Math.round(8 * scaleFactor));
  const tickHeight = Math.max(2, Math.round(3 * scaleFactor));

  const ticks = Array.from({ length: 6 }, (_, i) => i * 200);

  return (
    <div
      ref={containerRef}
      className="w-full mx-auto py-2 relative mt-5 flex justify-center"
    >
      <div className="relative" style={{ width: `${barWidth}px` }}>
        {/* Pointer */}
        <div
          className="absolute z-10 flex flex-col items-center"
          style={{
            left: `${pointerX}px`,
            top: `-20px`,
            transform: "translateX(-50%)",
          }}
        >
          <span
            className="font-semibold text-red-600 mb-0.5"
            style={{ fontSize: `${fontSize}px` }}
          >
            {safeValue.toFixed(1)}
          </span>
          <div
            className="w-0 h-0 border-l-transparent border-r-transparent border-t-red-600"
            style={{
              borderLeftWidth: `${triangleSize}px`,
              borderRightWidth: `${triangleSize}px`,
              borderTopWidth: `${triangleSize + 2}px`,
            }}
          />
        </div>

        {/* Gradient Bar */}
        <div
          className="bg-gradient-to-r from-green-400 via-yellow-300 to-red-500 shadow-inner"
          style={{
            height: `${barHeight}px`,
            width: `${barWidth}px`,
          }}
        />

        {/* Tick Marks & Labels */}
        <div
          className="relative flex justify-between mt-1 px-[1px]"
          style={{ width: `${barWidth}px` }}
        >
          {ticks.map((tick) => (
            <div key={tick} className="flex flex-col items-center w-[1px]">
              <div
                className="border-l border-gray-400"
                style={{ height: `${tickHeight}px` }}
              ></div>
              <span
                className="text-gray-500 mt-[1px]"
                style={{ fontSize: `${tickFontSize}px` }}
              >
                {tick}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
