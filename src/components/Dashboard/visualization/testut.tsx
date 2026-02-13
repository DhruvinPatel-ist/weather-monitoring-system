"use client";

import { useEffect, useRef } from "react";

interface TestUtGaugeProps {
  value: number;
}

export default function TestUtGauge({ value }: TestUtGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = 180;
    canvas.height = 180;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw gauge
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 80;

    // Draw gauge background arc (semi-circle)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI, false);
    ctx.lineWidth = 20;
    ctx.strokeStyle = "#e4e4e4";
    ctx.stroke();

    // Create gradient for gauge
    const gradient = ctx.createLinearGradient(
      centerX - radius,
      centerY,
      centerX + radius,
      centerY
    );
    gradient.addColorStop(0, "#b6d8b4"); // Green
    gradient.addColorStop(0.5, "#fbd646"); // Yellow
    gradient.addColorStop(1, "#fc6559"); // Red

    // Calculate value percentage (assuming range 0-10)
    const percentage = Math.min(Math.max(value, 0), 10) / 10;

    // Draw value arc
    ctx.beginPath();
    ctx.arc(
      centerX,
      centerY,
      radius,
      Math.PI,
      Math.PI + percentage * Math.PI,
      false
    );
    ctx.lineWidth = 20;
    ctx.strokeStyle = gradient;
    ctx.stroke();

    // Draw tick marks and labels
    for (let i = 0; i <= 6; i++) {
      const angle = Math.PI + (i / 6) * Math.PI;
      const x1 = centerX + (radius - 10) * Math.cos(angle);
      const y1 = centerY + (radius - 10) * Math.sin(angle);
      const x2 = centerX + (radius + 10) * Math.cos(angle);
      const y2 = centerY + (radius + 10) * Math.sin(angle);

      // Draw tick
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#8a8a8a";
      ctx.stroke();

      // Draw label
      const labelX = centerX + (radius + 25) * Math.cos(angle);
      const labelY = centerY + (radius + 25) * Math.sin(angle);

      ctx.font = "12px Arial";
      ctx.fillStyle = "#8a8a8a";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${Math.round((i / 6) * 10)}`, labelX, labelY);
    }

    // Draw value
    ctx.font = "bold 24px Arial";
    ctx.fillStyle = "#fbd646";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(Number(value).toFixed(2), centerX, centerY + 6);
  }, [value]);

  return (
    <canvas ref={canvasRef} className="flex justify-cente w-[100px] mt-4" />
  );
}
