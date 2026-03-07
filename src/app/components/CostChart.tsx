"use client";

import type { SiteEstimate } from "@/lib/types/site";

type CostChartProps = {
  estimates: SiteEstimate;
  theme?: "light" | "dark";
};

function formatCost(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M CAD`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K CAD`;
  return `$${n.toLocaleString("en-CA")} CAD`;
}

export default function CostChart({ estimates, theme = "light" }: CostChartProps) {
  const isDark = theme === "dark";
  const costPerTonneMin = estimates.costPerTonneMin ?? null;
  const costPerTonneMax = estimates.costPerTonneMax ?? null;
  const costPerTonneAvg = estimates.costPerTonneAvg ?? null;
  const costPerTonneStr =
    costPerTonneMin != null && costPerTonneMax != null
      ? `$${costPerTonneMin}–${costPerTonneMax} CAD/tonne`
      : costPerTonneAvg != null
        ? `~$${costPerTonneAvg} CAD/tonne`
        : null;

  const hasAny =
    estimates.remediationCost != null ||
    estimates.units != null ||
    estimates.timelineMonths != null ||
    costPerTonneStr != null;

  const rows: { label: string; value: string | null }[] = [
    {
      label: "Remediation cost",
      value:
        estimates.remediationCost != null
          ? formatCost(estimates.remediationCost)
          : null,
    },
    {
      label: "Est. cost per tonne",
      value: costPerTonneStr,
    },
    {
      label: "Housing units (est.)",
      value: estimates.units != null ? String(estimates.units) : null,
    },
    {
      label: "Timeline",
      value:
        estimates.timelineMonths != null
          ? `${estimates.timelineMonths} months`
          : null,
    },
  ];

  return (
    <div
      className={`panel-card mt-4 rounded-xl border p-4 ${
        isDark ? "border-slate-600 bg-slate-800/60" : "border-slate-200 bg-slate-50/80"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="panel-heading">Cost & capacity</h3>
        <span className={`panel-label ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Estimates
        </span>
      </div>
      {hasAny ? (
        <dl className="space-y-2.5">
          {rows.map(({ label, value }) => (
            <div
              key={label}
              className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 ${
                isDark ? "bg-slate-900/50" : "bg-white/80"
              }`}
            >
              <dt className={`panel-label shrink-0 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {label}
              </dt>
              <dd className="panel-value text-right font-medium tabular-nums">
                {value ?? "N/A"}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="space-y-2">
          <div className="skeleton w-36" />
          <div className="space-y-1.5">
            <div className="skeleton w-full" />
            <div className="skeleton w-5/6" />
          </div>
        </div>
      )}
    </div>
  );
}

