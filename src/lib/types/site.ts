export type ReportStatus = "pending" | "ready" | "failed";

export type SiteScore = {
  viability: number | null;
  soil: number | null;
  infrastructure: number | null;
};

export type SiteEstimate = {
  units: number | null;
  remediationCost: number | null;
  timelineMonths: number | null;
  /** FCSI: est. cost per tonne CAD (min/max/avg) */
  costPerTonneMin?: number | null;
  costPerTonneMax?: number | null;
  costPerTonneAvg?: number | null;
};

export type SiteListItem = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  siteType: string;
  city: string | null;
  province: string | null;
  viabilityScore: number | null;
  activityStatus?: string | null;
  formerUse?: string | null;
  /** FCSI: contamination groups/types summary */
  contaminationStatus?: string | null;
  /** FCSI: est. cost per tonne CAD */
  costPerTonneMin?: number | null;
  costPerTonneMax?: number | null;
  costPerTonneAvg?: number | null;
  /** FCSI-derived: estimated area (m²) from contamination record count */
  estimatedAreaM2?: number | null;
  /** FCSI-derived: total remediation cost (CAD) from tonnes × cost/tonne */
  estimatedRemediationCost?: number | null;
  /** FCSI-derived: housing units from estimated area */
  estimatedUnits?: number | null;
  /** FCSI-derived: remediation timeline (months) */
  estimatedTimelineMonths?: number | null;
  /** FCSI-derived: soil score 0–100 from contamination complexity */
  estimatedSoilScore?: number | null;
  /** FCSI-derived: infrastructure score 0–100 (urban proxy) */
  estimatedInfraScore?: number | null;
};

export type SiteDetail = SiteListItem & {
  contaminationStatus: string | null;
  formerUse: string | null;
  areaM2: number | null;
  scores: SiteScore;
  estimates: SiteEstimate;
};

export type SiteReport = {
  siteId: string;
  status: ReportStatus;
  summary: string;
  audioUrl: string | null;
  imageUrls: string[];
  rawJson: Record<string, unknown> | null;
};

export type SiteMedia = {
  id: string;
  siteId: string;
  mediaType: "image" | "audio" | "render" | "ar";
  provider: string;
  url: string;
  publicId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string | null;
};

export type UserProject = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  siteIds: string[];
  createdAt: string;
  updatedAt: string;
};
