"use client";

type LoadingScreenProps = {
  visible: boolean;
};

export default function LoadingScreen({ visible }: LoadingScreenProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex min-h-screen min-w-full flex-col items-center justify-center gap-8 bg-[var(--bg-main)] text-[var(--text-heading)]"
      style={{
        minHeight: "100dvh",
        width: "100vw",
        background: `linear-gradient(135deg, var(--glow-tr) 0%, var(--bg-main) 20%, var(--bg-main) 80%, var(--glow-bl) 100%)`,
      }}
      aria-hidden={!visible}
    >
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-4xl font-bold tracking-tight text-[var(--text-heading)] drop-shadow-lg">
          UCEY
        </h1>
        <p className="text-lg font-medium italic text-[var(--text-feature)]">
          Know your ground before you build
        </p>
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="flex gap-2" aria-label="Loading">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-[var(--accent)] animate-bounce"
              style={{
                animationDelay: `${i * 0.12}s`,
                animationDuration: "0.6s",
                boxShadow: "0 0 8px var(--glow-dot)",
              }}
            />
          ))}
        </div>
        <div className="h-1 w-48 overflow-hidden rounded-full bg-[var(--divider)]">
          <div
            className="h-full w-full origin-left rounded-full bg-[var(--accent)]"
            style={{ animation: "loading-bar 1.4s ease-in-out infinite" }}
          />
        </div>
      </div>

      <p className="text-sm text-[var(--text-description)]">
        Loading sites across major Canadian cities…
      </p>
    </div>
  );
}
