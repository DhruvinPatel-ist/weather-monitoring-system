export function BarChartIcon({
  color = "",
  className = "",
}: {
  color?: string;
  className?: string;
}) {
  return (
    <svg
      width="105"
      height="53"
      viewBox="0 0 105 53"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect y="35" width="23" height="18" fill={color} />
      <rect x="27" y="25" width="23" height="28" fill={color} />
      <rect x="54" y="17" width="23" height="36" fill={color} />
      <rect x="82" width="23" height="53" fill={color} />
    </svg>
  );
}
