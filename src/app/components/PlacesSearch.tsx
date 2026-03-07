"use client";

import { useEffect, useRef } from "react";

type Center = {
  lat: number;
  lng: number;
  name?: string;
};

type PlacesSearchProps = {
  onPlaceSelect: (place: Center) => void;
};

declare global {
  interface Window {
    google?: typeof google;
  }
}

const ALLOWED_CITIES = ["montreal", "toronto", "vancouver"];

export default function PlacesSearch({ onPlaceSelect }: PlacesSearchProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    let autocomplete: google.maps.places.Autocomplete | null = null;

    function initAutocomplete() {
      if (!window.google?.maps?.places) return;
      autocomplete = new window.google.maps.places.Autocomplete(input!, {
        types: ["(cities)"],
        componentRestrictions: { country: "ca" },
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete?.getPlace();
        if (!place || !place.geometry || !place.geometry.location) return;

        const localityComponent = place.address_components?.find(
          (component: google.maps.GeocoderAddressComponent) =>
            component.types.includes("locality"),
        );
        const rawName = localityComponent?.long_name ?? place.name ?? "";
        const normalized = rawName
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();

        if (!ALLOWED_CITIES.includes(normalized)) {
          window.alert(
            "For this demo, only Montreal, Toronto, and Vancouver are supported.",
          );
          return;
        }

        const { lat, lng } = place.geometry.location;
        onPlaceSelect({
          lat: lat(),
          lng: lng(),
          name: rawName || undefined,
        });
      });
    }

    const timeout = setTimeout(initAutocomplete, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [onPlaceSelect]);

  return (
    <input
      ref={inputRef}
      placeholder="Search a Canadian city…"
      className="places-search"
    />
  );
}
