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

  return (
    <aside className={panelClass} data-theme={theme}>
      <div className="flex items-center justify-between border-b border-[var(--divider)] bg-[var(--bg-main)] px-5 py-4 backdrop-blur">
        <div>
          <p className="panel-label text-[var(--accent)]">Site detail</p>
          <p className="mt-0.5 text-sm text-[var(--text-description)]">
            Scores, capacity, AI memo, and audio.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-[var(--border-button)] bg-[var(--bg-input)] px-3 py-1.5 text-sm font-medium text-[var(--text-feature)] transition-colors hover:border-[var(--accent)]"
        >
          Close
        </button>
      </div>

      <div className="panel-body space-y-4 px-5 py-4">
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
          <p className="text-sm leading-relaxed text-[var(--text-description)]">
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
                className="btn-legible rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--bg-main)] hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingReport ? "Generating…" : "Generate report"}
              </button>
              <button
                type="button"
                className="rounded-lg border border-[var(--border-button)] bg-[var(--bg-input)] px-4 py-2 text-sm font-medium text-[var(--text-feature)] hover:border-[var(--accent)]"
              >
                ⭐ Save to project
              </button>
            </div>

            <ReportDisplay report={report} loading={loadingReport} error={reportError} theme={theme} />

            <AudioPlayer
              audioUrl={report?.audioUrl ?? null}
              summaryText={report?.summary ?? null}
              theme={theme}
            />
          </>
        )}
      </div>
    </aside>
  );
}

