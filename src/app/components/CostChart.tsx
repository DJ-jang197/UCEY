"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SiteEstimate } from "@/lib/types/site";

type CostChartProps = {
  estimates: SiteEstimate;
};

export default function CostChart({ estimates }: CostChartProps) {
  const data = [
    {
      label: "Remediation",
      value: estimates.remediationCost ?? 0,
    },
    {
      label: "Units",
      value: estimates.units ?? 0,
    },
    {
      label: "Timeline (months)",
      value: estimates.timelineMonths ?? 0,
    },
  ];

  const hasAny =
    estimates.remediationCost != null ||
    estimates.units != null ||
    estimates.timelineMonths != null;

  return (
    <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-zinc-50">
          Cost & capacity snapshot
        </h3>
        <span className="text-[11px] text-zinc-400">
          Supplied by backend estimates
        </span>
      </div>
      {hasAny ? (
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  background: "#020617",
                  border: "1px solid #3f3f46",
                  borderRadius: 8,
                  fontSize: 11,
                }}
              />
              <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
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

