import type { SiteDetail, SiteReport } from "@/lib/types/site";

const now = new Date().toISOString();

/** Helper to build a demo site with full detail. */
function site(
  id: string,
  name: string,
  city: string,
  province: string,
  lat: number,
  lng: number,
  siteType: string,
  formerUse: string,
  viability: number,
  areaM2: number,
  contamination: string = "low",
): SiteDetail {
  return {
    id,
    name,
    lat,
    lng,
    siteType,
    city,
    province,
    viabilityScore: viability,
    contaminationStatus: contamination,
    formerUse,
    areaM2,
    scores: { viability, soil: Math.max(50, viability - 8), infrastructure: Math.min(95, viability + 10) },
    estimates: {
      units: Math.round(areaM2 / 100),
      remediationCost: areaM2 * 80,
      timelineMonths: 12 + Math.round(areaM2 / 5000),
    },
  };
}

export const demoSites: SiteDetail[] = [
  // ——— Montreal ———
  site("565f3462-0a9a-4be9-a2d2-98373f17243f", "Montreal Golf Course Fringe", "Montreal", "QC", 45.5017, -73.5673, "golf_course", "recreation", 63, 31000),
  site("a001-mtl-brown", "Montreal Lachine Brownfield", "Montreal", "QC", 45.4312, -73.6598, "brownfield", "industrial", 72, 18500, "moderate"),
  site("a002-mtl-parking", "Montreal Downtown Surface Parking", "Montreal", "QC", 45.5088, -73.5542, "parking_lot", "parking", 76, 9200),
  site("a003-mtl-rail", "Montreal CN Rail Corridor Parcel", "Montreal", "QC", 45.4921, -73.5692, "rail_corridor", "rail", 71, 14200),
  site("a004-mtl-mall", "Montreal Sainte-Catherine Dead Mall", "Montreal", "QC", 45.5042, -73.5678, "dead_mall", "commercial", 68, 16500),
  // ——— Ottawa ———
  site("b001-ott-brown", "Ottawa Lebreton Brownfield", "Ottawa", "ON", 45.4215, -75.7167, "brownfield", "industrial", 78, 22000, "moderate"),
  site("b002-ott-parking", "Ottawa Core Parking Lot", "Ottawa", "ON", 45.4208, -75.6902, "parking_lot", "parking", 74, 11000),
  site("b003-ott-rail", "Ottawa Transitway / Rail Corridor", "Ottawa", "ON", 45.4152, -75.7021, "rail_corridor", "rail", 73, 15800),
  site("b004-ott-mall", "Ottawa St. Laurent Mall Redevelopment", "Ottawa", "ON", 45.4289, -75.6312, "dead_mall", "commercial", 70, 19200),
  // ——— Toronto ———
  site("77099de7-fc5a-4a53-b252-116f6fee4c20", "Hamilton Foundry Brownfield", "Hamilton", "ON", 43.2557, -79.8711, "brownfield", "industrial", 78, 24000, "moderate"),
  site("ec2ede52-56a4-44b4-beca-138369eea06d", "Toronto Rail Yard Edge Parcel", "Toronto", "ON", 43.6532, -79.3832, "rail_corridor", "rail", 74, 17500),
  site("c001-tor-brown", "Toronto Port Lands Brownfield", "Toronto", "ON", 43.6342, -79.3478, "brownfield", "industrial", 75, 28000, "moderate"),
  site("c002-tor-parking", "Toronto Downtown Surface Parking", "Toronto", "ON", 43.6481, -79.3802, "parking_lot", "parking", 77, 10500),
  site("c003-tor-mall", "Toronto Scarborough Dead Mall", "Toronto", "ON", 43.7736, -79.2554, "dead_mall", "commercial", 69, 17800),
  // ——— Vancouver ———
  site("21010ced-709f-467f-a61f-c15939561344", "Vancouver Dead Mall Lot", "Vancouver", "BC", 49.2827, -123.1207, "dead_mall", "commercial", 69, 19800),
  site("d001-van-brown", "Vancouver False Creek Brownfield", "Vancouver", "BC", 49.2689, -123.1145, "brownfield", "industrial", 76, 16500, "low"),
  site("d002-van-parking", "Vancouver Downtown Parking Lot", "Vancouver", "BC", 49.2812, -123.1198, "parking_lot", "parking", 75, 8800),
  site("d003-van-rail", "Vancouver Arbutus Corridor Parcel", "Vancouver", "BC", 49.2634, -123.1389, "rail_corridor", "rail", 72, 12500),
];

// Legacy Calgary parking entry removed so all 4 cities have consistent coverage; add back if needed:
// site("8f084436-257d-4e45-9cda-4846947a90bb", "Calgary Surface Parking Block", "Calgary", "AB", 51.0447, -114.0719, "parking_lot", "parking", 72, 13200),

export const demoReports: SiteReport[] = [
  {
    siteId: demoSites[0].id,
    status: "ready",
    summary:
      "High-priority infill candidate with moderate remediation effort and strong transit upside.",
    audioUrl: null,
    imageUrls: [],
    rawJson: { generatedAt: now, provider: "gemini-2.0-flash" },
  },
  {
    siteId: demoSites[1].id,
    status: "ready",
    summary:
      "Transit-rich corridor site suited for mid-rise mixed use once rail buffer constraints are addressed.",
    audioUrl: null,
    imageUrls: [],
    rawJson: { generatedAt: now, provider: "gemini-2.0-flash" },
  },
];
