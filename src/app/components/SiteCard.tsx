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

export default function SiteCard({ site, theme = "light" }: SiteCardProps) {
  const viability = site.viabilityScore ?? null;
  const soilScore = site.scores.soil;
  const infraScore = site.scores.infrastructure;
  const isDark = theme === "dark";

  return (
    <div
      className={`panel-card space-y-3 rounded-xl border p-4 shadow-sm ${
        isDark ? "border-slate-600 bg-slate-800/60" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="panel-heading">{site.name}</h2>
          <p className={`panel-label mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {[site.city, site.province].filter(Boolean).join(", ") || "N/A"}
          </p>
        </div>
        <div className="text-right">
          <div className={getBadgeClass(viability)}>
            {viability != null ? `Viability ${viability.toFixed(0)}` : "N/A"}
          </div>
          <p className={`panel-label mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {formatSiteType(site.siteType)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className={`panel-label ${isDark ? "text-slate-400" : "text-slate-500"}`}>Soil</p>
          <p className="panel-value mt-0.5">{soilScore != null ? soilScore.toFixed(0) : "N/A"}</p>
        </div>
        <div>
          <p className={`panel-label ${isDark ? "text-slate-400" : "text-slate-500"}`}>Infrastructure</p>
          <p className="panel-value mt-0.5">{infraScore != null ? infraScore.toFixed(0) : "N/A"}</p>
        </div>
        <div>
          <p className={`panel-label ${isDark ? "text-slate-400" : "text-slate-500"}`}>Area (m²)</p>
          <p className="panel-value mt-0.5">
            {site.areaM2 != null ? site.areaM2.toLocaleString("en-CA") : "N/A"}
          </p>
        </div>
      </div>

      {site.formerUse && (
        <div>
          <p className={`panel-label ${isDark ? "text-slate-400" : "text-slate-500"}`}>Former use</p>
          <p className={`panel-value mt-0.5 text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>
            {site.formerUse}
          </p>
        </div>
      )}
      {site.contaminationStatus && (
        <div>
          <p className={`panel-label ${isDark ? "text-slate-400" : "text-slate-500"}`}>Contamination</p>
          <p className={`panel-value mt-0.5 text-sm line-clamp-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
            {site.contaminationStatus}
          </p>
        </div>
      )}
    </div>
  );
}

