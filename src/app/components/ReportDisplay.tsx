import type { SiteReport } from "@/lib/types/site";

type ReportDisplayProps = {
  report: SiteReport | null;
  loading: boolean;
  error: string | null;
  theme?: "light" | "dark";
};

export default function ReportDisplay({
  report,
  loading,
  error,
}: ReportDisplayProps) {
  if (loading) {
    return (
      <div className="panel-card mt-4 space-y-2 rounded-xl border p-4">
        <div className="skeleton w-28" />
        <div className="space-y-1.5">
          <div className="skeleton w-full" />
          <div className="skeleton w-11/12" />
          <div className="skeleton w-4/5" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rezone-error mt-4 rounded-xl p-4 text-sm">
        {error}
      </div>
    );
  }

  if (!report) {
    return (
      <div className="panel-card mt-4 rounded-xl border p-4 text-sm leading-relaxed text-[var(--text-description)]">
        No AI memo has been generated yet. Use the{" "}
        <span className="font-medium text-[var(--accent)]">Generate report</span> button
        to request one.
      </div>
    );
  }

  return (
    <div className="panel-card mt-4 rounded-xl border p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="panel-heading">Planner memo</h3>
        <span className="panel-label">
          {report.status === "ready" ? "Ready" : report.status}
        </span>
      </div>
      <p className="panel-value whitespace-pre-wrap leading-relaxed">
        {report.summary?.trim() || "N/A"}
      </p>
    </div>
  );
}

