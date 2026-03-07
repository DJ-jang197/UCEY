"use client";

export type LandTypeFilter = "all" | "brownfield" | "parking" | "rail" | "mall";

export type FiltersState = {
  city: string;
  landType: LandTypeFilter;
  minViability: number;
  minArea: number;
};

type FilterBarProps = {
  filters: FiltersState;
  onChange: (next: FiltersState) => void;
  theme?: "light" | "dark";
};

export default function FilterBar({ filters, onChange, theme = "light" }: FilterBarProps) {
  const handleChange =
    <K extends keyof FiltersState>(key: K) =>
    (value: FiltersState[K]) => {
      onChange({ ...filters, [key]: value });
    };

  const isDark = theme === "dark";

  return (
    <div
      className={`pointer-events-auto flex flex-wrap items-center gap-3 rounded-xl px-4 py-3 text-sm shadow-lg border backdrop-blur transition-colors duration-300 ease-out ${
        isDark
          ? "bg-slate-800/50 border-slate-600/60 text-slate-200"
          : "bg-white/60 border-slate-200/70 text-slate-900"
      }`}
    >
      <div className="flex flex-col gap-1">
        <span className={`text-xs uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          City
        </span>
        <input
          value={filters.city}
          onChange={(e) => handleChange("city")(e.target.value)}
          placeholder="Filter by city"
          className={`h-9 w-40 rounded-md border px-2.5 text-sm outline-none focus:border-emerald-400 ${
            isDark
              ? "border-slate-500 bg-slate-700/80 text-slate-100"
              : "border-slate-200 bg-white/90 text-slate-900"
          }`}
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className={`text-xs uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Land type
        </span>
        <select
          value={filters.landType}
          onChange={(e) => handleChange("landType")(e.target.value as LandTypeFilter)}
          className={`h-9 rounded-md border px-2.5 text-sm outline-none focus:border-emerald-400 ${
            isDark
              ? "border-slate-500 bg-slate-700/80 text-slate-100"
              : "border-slate-200 bg-white/90 text-slate-900"
          }`}
        >
          <option value="all">All</option>
          <option value="brownfield">Brownfield</option>
          <option value="parking">Parking lot</option>
          <option value="rail">Rail corridor</option>
          <option value="mall">Dead mall</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <span className={`text-xs uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Min. viability
        </span>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={filters.minViability}
            onChange={(e) => handleChange("minViability")(Number(e.target.value))}
            className="h-1 w-32 cursor-pointer accent-emerald-400"
          />
          <span className={`w-10 text-right text-xs tabular-nums ${isDark ? "text-slate-300" : "text-slate-700"}`}>
            {filters.minViability}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className={`text-xs uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Min. site size (m²)
        </span>
        <input
          type="number"
          min={0}
          step={1000}
          value={filters.minArea}
          onChange={(e) => handleChange("minArea")(Number(e.target.value) || 0)}
          className={`h-9 w-28 rounded-md border px-2.5 text-sm outline-none focus:border-emerald-400 ${
            isDark
              ? "border-slate-500 bg-slate-700/80 text-slate-100"
              : "border-slate-200 bg-white/90 text-slate-900"
          }`}
        />
      </div>
    </div>
  );
}

