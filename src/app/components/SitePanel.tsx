"use client";

import type { SiteDetail, SiteReport } from "@/lib/types/site";
import SiteCard from "./SiteCard";
import CostChart from "./CostChart";
import ReportDisplay from "./ReportDisplay";
import AudioPlayer from "./AudioPlayer";

type SitePanelProps = {
  open: boolean;
  onClose: () => void;
  site: SiteDetail | null;
  loadingSite: boolean;
  report: SiteReport | null;
  loadingReport: boolean;
  reportError: string | null;
  onGenerateReport: () => void;
};

export default function SitePanel({
  open,
  onClose,
  site,
  loadingSite,
  report,
  loadingReport,
  reportError,
  onGenerateReport,
}: SitePanelProps) {
  const panelClass = open ? "site-panel open" : "site-panel";

  return (
    <aside className={panelClass}>
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-white/90 backdrop-blur">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-400">
            Site detail
          </p>
          <p className="text-[11px] text-slate-500">
            Scores, capacity, AI memo, and audio.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:border-slate-300 hover:bg-slate-50"
        >
          Close
        </button>
      </div>

      <div className="space-y-4 px-5 py-4 text-sm text-slate-900">
        {loadingSite && (
          <div className="space-y-3">
            <div className="skeleton w-40" />
            <div className="skeleton w-24" />
            <div className="space-y-1.5">
              <div className="skeleton w-full" />
              <div className="skeleton w-11/12" />
              <div className="skeleton w-4/5" />
            </div>
          </div>
        )}

        {!loadingSite && !site && (
          <p className="text-xs text-slate-500">
            Click a marker on the map to open a site. High-viability candidates pulse on
            the map.
          </p>
        )}

        {site && (
          <>
            <SiteCard site={site} />
            <CostChart estimates={site.estimates} />

            <div className="mt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onGenerateReport}
                disabled={loadingReport}
                className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingReport ? "Generating…" : "Generate report"}
              </button>
              <button
                type="button"
                className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 hover:border-zinc-500 hover:bg-zinc-900"
              >
                ⭐ Save to project
              </button>
            </div>

            <ReportDisplay report={report} loading={loadingReport} error={reportError} />

            <AudioPlayer audioUrl={report?.audioUrl ?? null} />
          </>
        )}
      </div>
    </aside>
  );
}

