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
  theme: "light" | "dark";
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
  theme,
}: SitePanelProps) {
  const panelClass = open ? "site-panel open" : "site-panel";
  const isDark = theme === "dark";

  return (
    <aside className={panelClass} data-theme={theme}>
      <div
        className={`flex items-center justify-between border-b px-5 py-4 backdrop-blur ${
          isDark ? "border-slate-600 bg-slate-800/80" : "border-slate-200 bg-white/90"
        }`}
      >
        <div>
          <p className={`panel-label ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
            Site detail
          </p>
          <p className={`mt-0.5 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Scores, capacity, AI memo, and audio.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
            isDark
              ? "border-slate-500 bg-slate-700/80 text-slate-200 hover:bg-slate-600"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          Close
        </button>
      </div>

      <div className={`panel-body space-y-4 px-5 py-4 ${isDark ? "text-slate-200" : "text-slate-900"}`}>
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
          <p className={`text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Click a marker on the map to open a site. High-viability candidates are highlighted.
          </p>
        )}

        {site && (
          <>
            <SiteCard site={site} theme={theme} />
            <CostChart estimates={site.estimates} theme={theme} />

            <div className="mt-3 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onGenerateReport}
                disabled={loadingReport}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingReport ? "Generating…" : "Generate report"}
              </button>
              <button
                type="button"
                className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                  isDark
                    ? "border-slate-500 text-slate-200 hover:bg-slate-700"
                    : "border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                ⭐ Save to project
              </button>
            </div>

            <ReportDisplay report={report} loading={loadingReport} error={reportError} theme={theme} />

            <AudioPlayer audioUrl={report?.audioUrl ?? null} theme={theme} />
          </>
        )}
      </div>
    </aside>
  );
}

