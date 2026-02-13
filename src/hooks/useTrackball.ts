import { useRef, useState } from "react";

export function useTrackball<T = any>() {
  const chartRef = useRef<HTMLDivElement>(null);
  const [trackballPosition, setTrackballPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [hoveredData, setHoveredData] = useState<T | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTrackballPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setTrackballPosition(null);
    setHoveredData(null);
  };

  return {
    chartRef,
    trackballPosition,
    hoveredData,
    setHoveredData,
    handleMouseMove,
    handleMouseLeave,
  };
}
