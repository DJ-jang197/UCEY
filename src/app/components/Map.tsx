"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { SiteListItem } from "@/lib/types/site";

type Center = {
  lat: number;
  lng: number;
  name?: string;
};

type MapProps = {
  sites: SiteListItem[];
  loading: boolean;
  error: string | null;
  center: Center;
  selectedSiteId: string | null;
  onSiteSelect: (siteId: string) => void;
};

const CANADA_BOUNDS: [[number, number], [number, number]] = [
  [41, -141],
  [84, -52],
];

function getMarkerColor(siteType: string): string {
  const normalized = siteType.toLowerCase();
  if (normalized.includes("brown")) return "#ef4444"; // red
  if (normalized.includes("parking")) return "#eab308"; // yellow
  if (normalized.includes("rail")) return "#3b82f6"; // blue
  if (normalized.includes("mall")) return "#fb923c"; // orange
  return "#22c55e"; // default green
}

function getOpacity(viabilityScore: number | null): number {
  if (viabilityScore == null) return 0.5;
  const clamped = Math.max(0, Math.min(100, viabilityScore));
  return 0.4 + (clamped / 100) * 0.6;
}

function getMarkerLabel(siteType: string): string {
  const normalized = siteType.toLowerCase();
  if (normalized.includes("brown")) return "B";
  if (normalized.includes("parking")) return "P";
  if (normalized.includes("rail")) return "R";
  if (normalized.includes("mall")) return "M";
  return "S";
}

export default function Map({
  sites,
  loading,
  error,
  center,
  selectedSiteId,
  onSiteSelect,
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<import("leaflet").Marker[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!mapContainerRef.current || mapRef.current) return;

      const L = await import("leaflet");
      if (cancelled || !mapContainerRef.current || mapRef.current) return;

      leafletRef.current = L;
      const torontoCenter: [number, number] = [43.6532, -79.3832];
      const map = L.map(mapContainerRef.current, {
        center: torontoCenter,
        zoom: 6,
        minZoom: 4,
        maxZoom: 18,
        zoomControl: true,
        maxBounds: CANADA_BOUNDS,
        maxBoundsViscosity: 1,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        noWrap: true,
        bounds: CANADA_BOUNDS,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      mapRef.current = map;
    }

    initMap();

    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
      leafletRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.setView([center.lat, center.lng], center.name ? 11 : 4);
  }, [center]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    sites.forEach((site) => {
      const isSelected = selectedSiteId === site.id;
      const color = getMarkerColor(site.siteType);
      const opacity = getOpacity(site.viabilityScore ?? null);
      const label = getMarkerLabel(site.siteType);
      const size = isSelected ? 30 : 24;
      const anchor = isSelected ? 15 : 12;

      const marker = L.marker([site.lat, site.lng], {
        title: site.name,
        icon: L.divIcon({
          className: "map-sign-pin",
          html: `<span class="map-sign" style="background:${color};opacity:${opacity}">${label}</span>`,
          iconSize: [size, size],
          iconAnchor: [anchor, anchor],
          popupAnchor: [0, -anchor],
        }),
      }).addTo(map);

      marker.on("click", () => onSiteSelect(site.id));
      marker.bindTooltip(site.name, { direction: "top", offset: [0, -8] });

      if (isSelected) {
        marker.setZIndexOffset(1000);
      }

      markersRef.current.push(marker);
    });
  }, [sites, selectedSiteId, onSiteSelect]);

  return (
    <div className="map-container">
      <div ref={mapContainerRef} className="w-full h-full" />
      {loading && (
        <div className="absolute left-4 bottom-4 z-30 max-w-xs rounded-lg bg-black/80 p-3 text-xs text-zinc-200 backdrop-blur pointer-events-none">
          <div className="skeleton mb-2 w-24" />
          <div className="space-y-1.5">
            <div className="skeleton w-full" />
            <div className="skeleton w-5/6" />
            <div className="skeleton w-3/4" />
          </div>
        </div>
      )}
      {error && (
        <div className="absolute left-4 bottom-4 z-30 max-w-xs rounded-lg bg-red-900/80 p-3 text-xs text-red-100 backdrop-blur pointer-events-none">
          {error}
        </div>
      )}
    </div>
  );
}
