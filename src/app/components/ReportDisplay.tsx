import type { SiteReport } from "@/lib/types/site";

type ReportDisplayProps = {
  report: SiteReport | null;
  loading: boolean;
  error: string | null;
};

export default function ReportDisplay({
  report,
  loading,
  error,
}: ReportDisplayProps) {
  if (loading) {
    return (
      <div className="mt-4 space-y-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
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
      <div className="mt-4 rounded-xl border border-red-900 bg-red-950/70 p-4 text-xs text-red-100">
        {error}
      </div>
    );
  }

  if (!report) {
    return (
      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 text-xs text-zinc-300">
        No AI memo has been generated yet. Use the{" "}
        <span className="font-medium text-emerald-400">Generate report</span> button
        to request one once your teammate wires in Gemini.
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-zinc-50">Planner memo</h3>
        <span className="text-[11px] uppercase tracking-wide text-zinc-500">
          {report.status === "ready" ? "Ready" : report.status}
        </span>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-100">
        {report.summary}
      </p>
    </div>
  );
}

