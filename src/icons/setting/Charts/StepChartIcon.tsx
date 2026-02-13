export function StepChartIcon({
  color = "",
  className = "",
}: {
  color?: string;
  className?: string;
}) {
  return (
    <svg
      width="110"
      height="48"
      viewBox="0 0 110 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M0 47H20.9421V39.3655H42.6412V31.2538H65.8542V39.3655H86.544V23.3807H109V0"
        stroke={color}
        strokeWidth="2"
      />
    </svg>
  );
}
