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

export default function MapView(props: MapProps) {
  const {
    sites = [],
    loading = false,
    error = null,
    center,
    selectedSiteId = null,
    onSiteSelect = () => {},
  } = props ?? {};
  if (!center) return null;
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<import("leaflet").Marker[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!mapContainerRef.current || mapRef.current) return;
      const L = await import("leaflet");
      if (cancelled || !mapContainerRef.current || mapRef.current) return;

      const torontoCenter: [number, number] = [43.6532, -79.3832];
      const map = L.map(mapContainerRef.current, {
        center: torontoCenter,
        zoom: 6,
        minZoom: 4,
        maxZoom: 18,
        zoomControl: true,
        maxBounds: CANADA_BOUNDS,
        maxBoundsViscosity: 1,
        preferCanvas: true,
        markerZoomAnimation: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png", {
        maxZoom: 19,
        maxNativeZoom: 16,
        noWrap: true,
        bounds: CANADA_BOUNDS,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        updateWhenZooming: false,
        keepBuffer: 8,
      }).addTo(map);

      function updateDragging() {
        const atMinZoom = map.getZoom() === map.getMinZoom();
        if (atMinZoom) map.dragging.disable();
        else map.dragging.enable();
      }
      map.on("zoomend", updateDragging);
      updateDragging();

      mapRef.current = map;
    }

    initMap();

    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.setView([center.lat, center.lng], center.name ? 11 : 4);
  }, [center]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    void import("leaflet").then((L) => {
      if (!mapRef.current) return;
      const m = mapRef.current;
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
        }).addTo(m);

        marker.on("click", () => onSiteSelect(site.id));
        marker.bindTooltip(site.name, { direction: "top", offset: [0, -8] });

        if (isSelected) {
          marker.setZIndexOffset(1000);
        }

        markersRef.current.push(marker);
      });
    });
  }, [sites, selectedSiteId, onSiteSelect]);

  return (
    <div className="map-container">
      <div ref={mapContainerRef} className="w-full h-full bg-[var(--bg-main)]" />
      {loading && (
        <div className="absolute left-4 bottom-4 z-30 max-w-xs rounded-lg border border-[var(--divider)] bg-[var(--bg-input)] p-3 text-xs text-[var(--text-feature)] backdrop-blur pointer-events-none">
          <div className="skeleton mb-2 w-24" />
          <div className="space-y-1.5">
            <div className="skeleton w-full" />
            <div className="skeleton w-5/6" />
            <div className="skeleton w-3/4" />
          </div>
        </div>
      )}
      {error && (
        <div className="rezone-error absolute left-4 bottom-4 z-30 max-w-xs rounded-lg p-3 text-xs backdrop-blur pointer-events-none">
          {error}
        </div>
      )}
    </div>
  );
}
