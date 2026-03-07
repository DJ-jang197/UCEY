"use client";

type LoadingScreenProps = {
  visible: boolean;
};

export default function LoadingScreen({ visible }: LoadingScreenProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-gradient-to-br from-slate-900 via-emerald-950/30 to-slate-900 text-white"
      aria-hidden={!visible}
    >
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-lg">
          ReZone
        </h1>
        <p className="text-lg text-emerald-200/90">
          Planning homes on underused land
        </p>
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="flex gap-2" aria-label="Loading">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce"
              style={{
                animationDelay: `${i * 0.12}s`,
                animationDuration: "0.6s",
              }}
            />
          ))}
        </div>
        <div className="h-1 w-48 overflow-hidden rounded-full bg-slate-700/60">
          <div
            className="h-full w-full origin-left rounded-full bg-emerald-500"
            style={{ animation: "loading-bar 1.4s ease-in-out infinite" }}
          />
        </div>
      </div>

      <p className="text-sm text-slate-400">
        Loading sites from Vancouver to Halifax…
      </p>
    </div>
  );
}
