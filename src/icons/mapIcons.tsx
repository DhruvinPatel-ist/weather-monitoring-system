import { renderToStaticMarkup } from "react-dom/server";
import type { DivIcon } from "leaflet";

// Define all icon types
export type IconName =
  | "LocationPin"
  | "TargetPin"
  | "SignalPin"
  | "RoundPin"
  | "DropPin"
  | "MapPin";

// Define all custom SVG components
export const customIcons: Record<IconName, React.FC<{ color?: string }>> = {
  LocationPin: ({ color = "#ff4444" }) => (
    <svg
      width="24"
      height="32"
      viewBox="0 0 32 42"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 0C7.163 0 0 7.163 0 16C0 24.837 16 42 16 42S32 24.837 32 16C32 7.163 24.837 0 16 0ZM16 22C12.686 22 10 19.314 10 16C10 12.686 12.686 10 16 10C19.314 10 22 12.686 22 16C22 19.314 19.314 22 16 22Z"
        fill={color}
      />
    </svg>
  ),
  TargetPin: ({ color = "#ff4444" }) => (
    <svg
      width="24"
      height="32"
      viewBox="0 0 32 42"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 0C7.163 0 0 7.163 0 16C0 24.837 16 42 16 42S32 24.837 32 16C32 7.163 24.837 0 16 0Z"
        fill={color}
      />
      <circle cx="16" cy="16" r="8" fill="white" />
      <path d="M16 10V22M10 16H22" stroke={color} strokeWidth="2" />
      <circle cx="16" cy="16" r="2" fill={color} />
    </svg>
  ),
  SignalPin: ({ color = "#ff4444" }) => (
    <svg
      width="24"
      height="32"
      viewBox="0 0 32 42"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 0C7.163 0 0 7.163 0 16C0 24.837 16 42 16 42S32 24.837 32 16C32 7.163 24.837 0 16 0Z"
        fill={color}
      />
      <circle cx="16" cy="16" r="6" fill="white" />
      <circle cx="16" cy="16" r="3" fill={color} />
    </svg>
  ),
  RoundPin: ({ color = "#ff4444" }) => (
    <svg
      width="24"
      height="32"
      viewBox="0 0 32 42"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="16" cy="16" r="16" fill={color} />
      <rect x="14" y="16" width="4" height="26" fill={color} />
      <circle cx="16" cy="16" r="6" fill="white" />
    </svg>
  ),
  DropPin: ({ color = "#ff4444" }) => (
    <svg
      width="24"
      height="32"
      viewBox="0 0 32 42"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 0C7.163 0 0 7.163 0 16C0 20.419 1.791 24.354 4.686 27.301L16 42L27.314 27.301C30.209 24.354 32 20.419 32 16C32 7.163 24.837 0 16 0Z"
        fill={color}
      />
      <circle cx="16" cy="16" r="8" fill="white" />
    </svg>
  ),
  MapPin: ({ color = "#ff4444" }) => (
    <svg
      width="24"
      height="32"
      viewBox="0 0 32 42"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 0C9.372 0 4 5.372 4 12C4 20 16 42 16 42S28 20 28 12C28 5.372 22.628 0 16 0ZM16 18C13.791 18 12 16.209 12 14C12 11.791 13.791 10 16 10C18.209 10 20 11.791 20 14C20 16.209 18.209 18 16 18Z"
        fill={color}
      />
    </svg>
  ),
};

// Map icon index to icon name
export const iconIdMap: IconName[] = [
  "LocationPin",
  "TargetPin",
  "SignalPin",
  "RoundPin",
  "DropPin",
  "MapPin",
];

// Optional external use map
export const iconComponentMap: Record<
  IconName,
  React.FC<{ color?: string }>
> = customIcons;

// Name tag icon
export const NameTag = ({
  name,
  color = "#ff4444",
}: {
  name: string;
  color?: string;
}) => (
  <div style={{ position: "relative", minWidth: "60px" }}>
    <div
      style={{
        backgroundColor: color,
        color: "white",
        padding: "2px 6px",
        borderRadius: "4px",
        fontSize: "10px",
        fontWeight: 600,
        textAlign: "center",
        marginBottom: "6px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }}
    >
      {name}
      <div
        style={{
          position: "absolute",
          bottom: "-6px",
          left: "50%",
          marginLeft: "-6px",
          width: "0",
          height: "0",
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderTop: `6px solid ${color}`,
        }}
      ></div>
    </div>
  </div>
);

// ✅ Safe: dynamically imports leaflet and returns DivIcon
export async function getCustomIcon(
  iconName: IconName,
  color: string,
  scale: number = 24,
  direction: number = 0
): Promise<DivIcon> {
  const { divIcon } = await import("leaflet");
  const IconComponent = iconComponentMap[iconName];
  const safeColor = color.startsWith("#") ? color : `#${color}`;
  const transform = `scale(${scale / 24}) rotate(${direction}deg)`;

  const svgHtml = renderToStaticMarkup(
    <div
      style={{
        transform,
        transformOrigin: "center center",
        width: "24px",
        height: "32px",
      }}
    >
      <IconComponent color={safeColor} />
    </div>
  );

  return divIcon({
    html: svgHtml,
    className: "",
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -32],
  });
}

export async function getNameTagIcon(
  name: string,
  color: string
): Promise<DivIcon> {
  const { divIcon } = await import("leaflet");
  const safeColor = color.startsWith("#") ? color : `#${color}`;
  const html = renderToStaticMarkup(<NameTag name={name} color={safeColor} />);
  return divIcon({
    html,
    className: "",
    iconSize: [60, 24],
    iconAnchor: [30, 0],
    popupAnchor: [0, 0],
  });
}
