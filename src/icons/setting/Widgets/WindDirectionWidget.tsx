export function WindDirectionWidgetIcon({
  value = 69.6,
  className = "",
  arrowColor = "green",
  textColor = "#4CAF50",
}: {
  value?: number;
  className?: string;
  arrowColor?: string;
  textColor?: string;
}) {
  const angle = value % 360;
  const arrowLength = 35;
  const cx = 50;
  const cy = 50;
  const radians = (angle - 90) * (Math.PI / 180);
  const x = cx + arrowLength * Math.cos(radians);
  const y = cy + arrowLength * Math.sin(radians);

  return (
    <svg
      width="100"
      height="100"
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Compass circle */}
      <circle
        cx="50"
        cy="50"
        r="45"
        stroke="#999"
        strokeWidth="2"
        fill="none"
      />

      {/* Degree ticks */}
      {[...Array(36)].map((_, i) => {
        const tickAngle = (i * 10 - 90) * (Math.PI / 180);
        const x1 = 50 + 43 * Math.cos(tickAngle);
        const y1 = 50 + 43 * Math.sin(tickAngle);
        const x2 = 50 + 45 * Math.cos(tickAngle);
        const y2 = 50 + 45 * Math.sin(tickAngle);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#555"
            strokeWidth={i % 3 === 0 ? 2 : 1}
          />
        );
      })}

      {/* Labels */}
      {[
        { label: "N", angle: 0 },
        { label: "E", angle: 90 },
        { label: "S", angle: 180 },
        { label: "W", angle: 270 },
      ].map(({ label, angle }, i) => {
        const rad = (angle - 90) * (Math.PI / 180);
        const x = 50 + 38 * Math.cos(rad);
        const y = 50 + 38 * Math.sin(rad) + 4;
        return (
          <text
            key={i}
            x={x}
            y={y}
            fontSize="8"
            fill="#333"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {label}
          </text>
        );
      })}

      {/* Arrow */}
      <line
        x1={50}
        y1={50}
        x2={x}
        y2={y}
        stroke={arrowColor}
        strokeWidth="3"
        markerEnd="url(#arrowhead)"
      />

      <defs>
        <marker
          id="arrowhead"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 6 3, 0 6" fill={arrowColor} />
        </marker>
      </defs>

      {/* Degree value */}
      <text
        x="50"
        y="60"
        fontSize="12"
        fontWeight="bold"
        fill={textColor}
        textAnchor="middle"
      >
        {value.toFixed(2)}°
      </text>
    </svg>
  );
}
