export function PercentageIcon({
  colors = [],
  className = "",
}: {
  colors?: string[];
  className?: string;
}) {
  const baseColor = colors[0] || "#009FAC";

  return (
    <svg
      width="83"
      height="83"
      viewBox="0 0 83 83"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        x="56.3359"
        y="79.2139"
        width="27.7423"
        height="18.8648"
        transform="rotate(180 56.3359 79.2139)"
        fill={baseColor}
        fillOpacity="1"
      />
      <rect
        x="56.3359"
        y="60.3486"
        width="27.7423"
        height="18.8648"
        transform="rotate(180 56.3359 60.3486)"
        fill={baseColor}
        fillOpacity="0.8"
      />
      <rect
        x="56.3359"
        y="41.4844"
        width="27.7423"
        height="18.8648"
        transform="rotate(180 56.3359 41.4844)"
        fill={baseColor}
        fillOpacity="0.6"
      />
      <rect
        x="56.3359"
        y="22.6191"
        width="27.7423"
        height="18.8648"
        transform="rotate(180 56.3359 22.6191)"
        fill={baseColor}
        fillOpacity="0.3"
      />
    </svg>
  );
}
