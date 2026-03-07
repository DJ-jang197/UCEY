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
};

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const handleChange =
    <K extends keyof FiltersState>(key: K) =>
    (value: FiltersState[K]) => {
      onChange({ ...filters, [key]: value });
    };

  return (
    <div className="pointer-events-auto flex flex-wrap items-center gap-3 rounded-xl bg-white/90 px-4 py-3 text-xs text-slate-900 shadow-lg border border-slate-200 backdrop-blur">
      <div className="flex flex-col gap-1">
        <span className="text-[11px] uppercase tracking-wide text-slate-500">
          City
        </span>
        <input
          value={filters.city}
          onChange={(e) => handleChange("city")(e.target.value)}
          placeholder="Filter by city"
          className="h-8 w-40 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-900 outline-none focus:border-emerald-400"
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[11px] uppercase tracking-wide text-slate-500">
          Land type
        </span>
        <select
          value={filters.landType}
          onChange={(e) => handleChange("landType")(e.target.value as LandTypeFilter)}
          className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-900 outline-none focus:border-emerald-400"
        >
          <option value="all">All</option>
          <option value="brownfield">Brownfield</option>
          <option value="parking">Parking lot</option>
          <option value="rail">Rail corridor</option>
          <option value="mall">Dead mall</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[11px] uppercase tracking-wide text-slate-500">
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
          <span className="w-10 text-right text-[11px] tabular-nums text-slate-700">
            {filters.minViability}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[11px] uppercase tracking-wide text-slate-500">
          Min. site size (m²)
        </span>
        <input
          type="number"
          min={0}
          step={1000}
          value={filters.minArea}
          onChange={(e) => handleChange("minArea")(Number(e.target.value) || 0)}
          className="h-8 w-28 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-900 outline-none focus:border-emerald-400"
        />
      </div>
    </div>
  );
}

