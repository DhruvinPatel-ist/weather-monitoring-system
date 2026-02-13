"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { Station } from "@/components/Dashboard/view/parameter-view";
import { iconIdMap, getCustomIcon, getNameTagIcon } from "@/icons/mapIcons";
import type { DivIcon } from "leaflet";

const Map = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

interface MapViewComponentProps {
  stations: Station[];
  onSelectStation: (station: Station) => void;
  iconType?: number;
  color?: string;
  pinStyle?: "pin" | "name";
  displayName?: string;
  scaleData?: number;
}

const MapViewComponent = ({
  stations,
  onSelectStation,
  iconType = 1,
  color = "0b80fb",
  pinStyle = "pin",
  displayName = "",
  scaleData = 50,
}: MapViewComponentProps) => {
  const position = [25.594, 56.2626] as [number, number];
  const [isMounted, setIsMounted] = useState(false);
  const [icons, setIcons] = useState<Record<string, DivIcon>>({});

  useEffect(() => {
    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
      });
    });

    const loadIcons = async () => {
      const iconMap: Record<string, DivIcon> = {};

      for (const station of stations) {
        const rawColor = color;
        const processedColor = rawColor.startsWith("#")
          ? rawColor
          : `#${rawColor}`;
        const scale = scaleData;

        const iconName =
          iconType >= 1 && iconType <= iconIdMap.length
            ? iconIdMap[iconType - 1]
            : "LocationPin";

        const stationDisplayName =
          pinStyle === "name" && displayName ? displayName : station.name;

        const icon =
          pinStyle === "name"
            ? await getNameTagIcon(stationDisplayName, processedColor)
            : await getCustomIcon(iconName, processedColor, scale);

        iconMap[station.id] = icon;
      }

      setIcons(iconMap);
      setIsMounted(true);
    };

    loadIcons();
  }, [stations, iconType, color, pinStyle, displayName, scaleData]);

  if (!isMounted) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        Loading map...
      </div>
    );
  }

  return (
    <div className="h-full w-full rounded-xl overflow-hidden">
      <Map
        center={position}
        zoom={10}
        style={{ height: "100%", width: "100%", minHeight: "400px" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {stations.map((station) => {
          const icon = icons[station.id];
          const stationDisplayName =
            pinStyle === "name" && displayName ? displayName : station.name;

          if (!icon) return null;

          return (
            <Marker
              key={station.id}
              position={[station.latitude, station.longitude]}
              icon={icon}
              eventHandlers={{ click: () => onSelectStation(station) }}
            >
              <Popup>
                <div className="text-sm">
                  <strong>{stationDisplayName}</strong>
                  <br />
                  Status: {station.status}
                  <br />
                  Last Updated: {station.lastUpdated}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </Map>
    </div>
  );
};

export default MapViewComponent;
