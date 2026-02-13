export function StackedChartIcon({
  color = "",
  className = "",
}: {
  color?: string;
  className?: string;
}) {
  return (
    <svg
      width="111"
      height="71"
      viewBox="0 0 111 71"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M44.3465 32.4158L1 48V71H111V1.5L89 26L66.6535 40.3316L44.3465 32.4158Z"
        fill={color}
        fillOpacity="0.1"
      />
      <path
        d="M1 48L44.3465 32.4158L66.6535 40.3316L89.214 24.5L110 1"
        stroke={color}
        strokeWidth="2"
      />
    </svg>
  );
}
