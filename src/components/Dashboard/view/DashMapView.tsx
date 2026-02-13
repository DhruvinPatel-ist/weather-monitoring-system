"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { Station } from "@/components/Dashboard/view/parameter-view";
import {
  getCustomIcon,
  getNameTagIcon,
  iconIdMap,
  IconName,
} from "@/icons/mapIcons";
import type { DivIcon } from "leaflet";

// Lazy-loaded Leaflet components
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

interface MapComponentDashProps {
  stations: Station[];
  onSelectStation: (station: Station) => void;
  generalSettings: {
    site_id: string;
    color: string;
    icon_type: number;
    scale_data?: number;
    direction?: number;
    pin_style?: string;
    display_name?: string | null;
  }[];
}

export default function MapComponentDash({
  stations,
  onSelectStation,
  generalSettings,
}: MapComponentDashProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [icons, setIcons] = useState<Record<string, DivIcon>>({});

  const mapCenter = useMemo<[number, number]>(() => {
    if (stations.length === 0) return [25.4111, 56.2482]; // Default center
    const validStations = stations.filter((s) => s.latitude && s.longitude);
    const avgLat =
      validStations.reduce((sum, s) => sum + s.latitude, 0) /
      validStations.length;
    const avgLng =
      validStations.reduce((sum, s) => sum + s.longitude, 0) /
      validStations.length;
    return [avgLat || 25.4111, avgLng || 56.2482];
  }, [stations]);

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
        const setting = generalSettings.find(
          (s) => String(s.site_id) === String(station.id)
        );
        const iconType = setting?.icon_type ?? 6;
        const rawColor = setting?.color ?? "0b80fb";
        const color = rawColor.startsWith("#") ? rawColor : `#${rawColor}`;
        const scale = setting?.scale_data ?? 24;
        const pinStyle = (setting?.pin_style || "pin").toLowerCase();

        const iconName: IconName =
          iconType >= 1 && iconType <= iconIdMap.length
            ? iconIdMap[iconType - 1]
            : "MapPin";

        const displayName =
          pinStyle === "name" && setting?.display_name
            ? setting.display_name
            : station.name;

        const icon =
          pinStyle === "name"
            ? await getNameTagIcon(displayName, color)
            : await getCustomIcon(iconName, color, scale);

        iconMap[station.id] = icon;
      }

      setIcons(iconMap);
      setIsMounted(true);
    };

    loadIcons();
  }, [stations, generalSettings]);

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
        center={mapCenter}
        zoom={8}
        style={{ height: "100%", width: "100%", minHeight: "400px" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {stations.map((station) => {
          const icon = icons[station.id];
          const setting = generalSettings.find(
            (s) => String(s.site_id) === String(station.id)
          );
          const pinStyle = (setting?.pin_style || "pin").toLowerCase();
          const displayName =
            pinStyle === "name" && setting?.display_name
              ? setting.display_name
              : station.name;

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
                  <strong>{displayName}</strong>
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
}
