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
  theme = "light",
}: ReportDisplayProps) {
  const isDark = theme === "dark";

  if (loading) {
    return (
      <div
        className={`mt-4 space-y-2 rounded-xl border p-4 ${
          isDark ? "border-slate-600 bg-slate-800/60" : "border-slate-200 bg-slate-50/80"
        }`}
      >
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
      <div className="mt-4 rounded-xl border border-red-800 bg-red-950/70 p-4 text-sm text-red-100">
        {error}
      </div>
    );
  }

  if (!report) {
    return (
      <div
        className={`mt-4 rounded-xl border p-4 text-sm leading-relaxed ${
          isDark
            ? "border-slate-600 bg-slate-800/40 text-slate-300"
            : "border-slate-200 bg-slate-50/80 text-slate-600"
        }`}
      >
        No AI memo has been generated yet. Use the{" "}
        <span className="font-medium text-emerald-400">Generate report</span> button
        to request one once your teammate wires in Gemini.
      </div>
    );
  }

  return (
    <div
      className={`panel-card mt-4 rounded-xl border p-4 ${
        isDark ? "border-slate-600 bg-slate-800/60" : "border-slate-200 bg-slate-50/80"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="panel-heading">Planner memo</h3>
        <span className={`panel-label ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          {report.status === "ready" ? "Ready" : report.status}
        </span>
      </div>
      <p className="panel-value whitespace-pre-wrap leading-relaxed">
        {report.summary?.trim() || "N/A"}
      </p>
    </div>
  );
}

