import type { SiteDetail } from "@/lib/types/site";

type SiteCardProps = {
  site: SiteDetail;
};

function getBadgeClass(viability: number | null): string {
  if (viability == null) return "badge-low";
  if (viability >= 75) return "badge-high";
  if (viability >= 50) return "badge-medium";
  return "badge-low";
}

export default function SiteCard({ site }: SiteCardProps) {
  const viability = site.viabilityScore ?? null;
  const soilScore = site.scores.soil;
  const infraScore = site.scores.infrastructure;

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-900 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{site.name}</h2>
          <p className="text-xs text-slate-500">
            {[site.city, site.province].filter(Boolean).join(", ")}
          </p>
        </div>
        <div className="text-right">
          <div className={getBadgeClass(viability)}>
            {viability != null ? `Viability ${viability.toFixed(0)}` : "No score"}
          </div>
          <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">
            {site.siteType}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-500">
            Soil
          </p>
          <p className="mt-0.5 text-sm text-slate-900">
            {soilScore != null ? soilScore.toFixed(0) : "—"}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-500">
            Infrastructure
          </p>
          <p className="mt-0.5 text-sm text-slate-900">
            {infraScore != null ? infraScore.toFixed(0) : "—"}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-500">
            Area (m²)
          </p>
          <p className="mt-0.5 text-sm text-slate-900">
            {site.areaM2 != null ? site.areaM2.toLocaleString("en-CA") : "—"}
          </p>
        </div>
      </div>

      {site.formerUse && (
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-500">
            Former use
          </p>
          <p className="mt-0.5 text-xs text-slate-700">{site.formerUse}</p>
        </div>
      )}
    </div>
  );
}

