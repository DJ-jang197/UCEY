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
