export function LinearProgressWidgetSVG({
  colors = [],
  className = "",
}: {
  colors?: string[];
  className?: string;
}) {
  const progressColor = colors[0] || "#6366F1"; // default: indigo
  const bgColor = colors[1] || "#E5E7EB"; // default: gray
  const value = 60; // Set progress (0–100)
  const barWidth = 300;
  const barHeight = 16;
  const progressWidth = (value / 100) * barWidth;

  return (
    <svg
      width={barWidth}
      height={40}
      viewBox={`0 0 ${barWidth} 40`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Optional label */}
      <text x="0" y="12" fontSize="12" fill="#4B5563">
        Progress
      </text>

      {/* Background bar */}
      <rect
        x="0"
        y="20"
        rx="8"
        ry="8"
        width={barWidth}
        height={barHeight}
        fill={bgColor}
      />

      {/* Foreground bar */}
      <rect
        x="0"
        y="20"
        rx="8"
        ry="8"
        width={progressWidth}
        height={barHeight}
        fill={progressColor}
      />

      {/* Value text */}
      <text x={barWidth} y="38" fontSize="10" fill="#6B7280" textAnchor="end">
        {value}%
      </text>
    </svg>
  );
}
