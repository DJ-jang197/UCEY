import type { SiteDetail } from "@/lib/types/site";

type SiteCardProps = {
  site: SiteDetail;
  theme?: "light" | "dark";
};

/** Display label for site type (e.g. "Brownfield" not "brownfield"). */
function formatSiteType(siteType: string | null | undefined): string {
  if (!siteType?.trim()) return "N/A";
  const t = siteType.trim().toLowerCase();
  if (t === "brownfield") return "Brownfield";
  return siteType.trim();
}

function getBadgeClass(viability: number | null): string {
  if (viability == null) return "badge-low";
  if (viability >= 75) return "badge-high";
  if (viability >= 50) return "badge-medium";
  return "badge-low";
}

function formatActivityStatus(activityStatus: string | null | undefined) {
  if (!activityStatus) return null;
  if (activityStatus === "active") return "Active site";
  if (activityStatus === "inactive") return "Inactive site";
  return activityStatus.replace(/_/g, " ");
}

export default function SiteCard({ site }: SiteCardProps) {
  const viability = site.viabilityScore ?? null;
  const soilScore = site.scores.soil;
  const infraScore = site.scores.infrastructure;
  const activityLabel = formatActivityStatus(site.activityStatus);

  return (
    <div className="panel-card space-y-3 rounded-xl border p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="panel-heading">{site.name}</h2>
          <p className="panel-label mt-0.5">
            {[site.city, site.province].filter(Boolean).join(", ") || "N/A"}
          </p>
        </div>
        <div className="text-right">
          <div className={getBadgeClass(viability)}>
            {viability != null ? `Viability ${viability.toFixed(0)}` : "N/A"}
          </div>
          <p className="panel-label mt-1">
            {formatSiteType(site.siteType)}
          </p>
          {activityLabel && (
            <p className="panel-label mt-1">
              {activityLabel}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="panel-label">Soil</p>
          <p className="panel-value mt-0.5">{soilScore != null ? soilScore.toFixed(0) : "N/A"}</p>
        </div>
        <div>
          <p className="panel-label">Infrastructure</p>
          <p className="panel-value mt-0.5">{infraScore != null ? infraScore.toFixed(0) : "N/A"}</p>
        </div>
        <div>
          <p className="panel-label">Area (m²)</p>
          <p className="panel-value mt-0.5">
            {site.areaM2 != null ? site.areaM2.toLocaleString("en-CA") : "N/A"}
          </p>
        </div>
      </div>

      {site.formerUse && (
        <div>
          <p className="panel-label">Former use</p>
          <p className="panel-value mt-0.5 text-sm">
            {site.formerUse}
          </p>
        </div>
      )}
      {site.contaminationStatus && (
        <div>
          <p className="panel-label">Contamination</p>
          <p className="panel-value mt-0.5 text-sm line-clamp-2">
            {site.contaminationStatus}
          </p>
        </div>
      )}
    </div>
  );
}
