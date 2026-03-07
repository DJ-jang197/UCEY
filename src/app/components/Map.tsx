"use client";

import { useEffect, useRef } from "react";
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

declare global {
  interface Window {
    google?: typeof google;
  }
}

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

const CANADA_BOUNDS: google.maps.LatLngBoundsLiteral = {
  north: 84,
  south: 41,
  west: -141,
  east: -52,
};

export default function Map({
  sites,
  loading,
  error,
  center,
  selectedSiteId,
  onSiteSelect,
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    let cancelled = false;

    function initMap() {
      if (cancelled) return;
      if (!mapContainerRef.current || mapRef.current || !window.google?.maps) return;

      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: { lat: center.lat, lng: center.lng },
        zoom: 4,
        disableDefaultUI: false,
        mapTypeControl: false,
        restriction: {
          latLngBounds: CANADA_BOUNDS,
          strictBounds: true,
        },
        minZoom: 3,
        maxZoom: 18,
      });

      mapRef.current = map;
    }

    if (window.google?.maps) {
      initMap();
    } else {
      const interval = window.setInterval(() => {
        if (window.google?.maps) {
          window.clearInterval(interval);
          initMap();
        }
      }, 400);

      return () => {
        cancelled = true;
        window.clearInterval(interval);
      };
    }

    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.panTo({ lat: center.lat, lng: center.lng });
    map.setZoom(center.name ? 11 : 3.4);
  }, [center]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    sites.forEach((site) => {
      const isSelected = selectedSiteId === site.id;
      const color = getMarkerColor(site.siteType);
      const opacity = getOpacity(site.viabilityScore ?? null);

      const marker = new window.google!.maps.Marker({
        position: { lat: site.lat, lng: site.lng },
        map,
        title: site.name,
        icon: {
          path: window.google!.maps.SymbolPath.CIRCLE,
          scale: isSelected ? 6 : 4,
          fillColor: color,
          fillOpacity: opacity,
          strokeColor: "#000000",
          strokeOpacity: 0.6,
          strokeWeight: 1,
        },
      });

      marker.addListener("click", () => {
        onSiteSelect(site.id);
      });

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

