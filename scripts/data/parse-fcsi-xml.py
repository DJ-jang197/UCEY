#!/usr/bin/env python3
"""
Parse Federal Contaminated Sites XML and produce a contamination summary CSV.

Usage:
  python3 scripts/data/parse-fcsi-xml.py \
    --input data/raw/fcsi/fcsi-rscf.xml \
    --output data/raw/fcsi/contamination_summary_from_xml.csv
"""

import argparse
import csv
import xml.etree.ElementTree as ET
from collections import defaultdict


def normalize_city(value: str) -> str:
    normalized = value.strip().lower()
    if normalized in ("montreal", "montréal"):
        return "Montreal"
    if normalized == "toronto":
        return "Toronto"
    if normalized == "vancouver":
        return "Vancouver"
    return value.strip()


def normalize_province(value: str) -> str:
    normalized = value.strip().lower()
    if normalized in ("on", "ontario"):
        return "Ontario"
    if normalized in ("bc", "british columbia", "colombie-britannique"):
        return "British Columbia"
    if normalized in ("qc", "quebec", "québec"):
        return "Quebec"
    return value.strip()


def safe_text(parent, child_tag):
    child = parent.find(child_tag) if parent is not None else None
    return child.text.strip() if child is not None and child.text else ""


def safe_text_en(parent, child_tag):
    child = parent.find(child_tag) if parent is not None else None
    if child is None:
        return ""
    en = child.find("EN")
    if en is not None and en.text:
        return en.text.strip()
    return child.text.strip() if child.text else ""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Path to fcsi-rscf.xml")
    parser.add_argument(
        "--output",
        default="data/raw/fcsi/contamination_summary_from_xml.csv",
        help="Output CSV path",
    )
    parser.add_argument(
        "--cities",
        default="Toronto,Vancouver,Montreal",
        help="Comma-separated city filter",
    )
    parser.add_argument(
        "--provinces",
        default="Ontario,British Columbia,Quebec",
        help="Comma-separated province filter",
    )
    args = parser.parse_args()

    allowed_cities = set(city.strip().lower() for city in args.cities.split(","))
    allowed_provinces = set(prov.strip().lower() for prov in args.provinces.split(","))

    counts = defaultdict(int)

    context = ET.iterparse(args.input, events=("end",))
    for _, elem in context:
        if elem.tag != "Site":
            continue

        site_name = safe_text_en(elem, "Name") or "Unknown"
        location = elem.find("Location")
        province = normalize_province(safe_text(location, "Province")) or "Unknown"
        city = normalize_city(safe_text(location, "Municipality")) or "Unknown"
        latitude = safe_text(location, "Latitude") or "Unknown"
        longitude = safe_text(location, "Longitude") or "Unknown"

        if province.lower() not in allowed_provinces or city.lower() not in allowed_cities:
            elem.clear()
            continue

        contamination_details = elem.find("ContaminationDetails")
        if contamination_details is not None:
            for media in contamination_details.findall("ContaminatedMedia"):
                medium_name = safe_text_en(media, "Medium") or "Unknown"
                contamination_name = safe_text_en(media, "Contamination") or "Unknown"
                key = (
                    province,
                    city,
                    site_name,
                    latitude,
                    longitude,
                    medium_name,
                    contamination_name,
                )
                counts[key] += 1

        elem.clear()

    with open(args.output, "w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(
            [
                "Province",
                "Municipality",
                "Site_Name",
                "Latitude",
                "Longitude",
                "Medium",
                "Contamination_Type",
                "Site_Count",
            ]
        )
        for key, count in sorted(counts.items()):
            writer.writerow([*key, count])

    print(f"Wrote {len(counts)} rows to {args.output}")


if __name__ == "__main__":
    main()
