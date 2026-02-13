export function DotsChartIcon({
  color = "",
  className = "",
}: {
  color?: string;
  className?: string;
}) {
  return (
    <svg
      width="108"
      height="46"
      viewBox="0 0 108 46"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="3" cy="43" r="3" fill={color} />
      <circle cx="20" cy="37" r="3" fill={color} />
      <circle cx="42" cy="30" r="3" fill={color} />
      <circle cx="64" cy="37" r="3" fill={color} />
      <circle cx="83" cy="23" r="3" fill={color} />
      <circle cx="105" cy="3" r="3" fill={color} />
    </svg>
  );
}
