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

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const handleChange =
    <K extends keyof FiltersState>(key: K) =>
    (value: FiltersState[K]) => {
      onChange({ ...filters, [key]: value });
    };

  const inputClass =
    "h-9 rounded-md border border-[var(--border-input)] bg-[var(--bg-input)] px-2.5 text-sm text-[var(--text-heading)] outline-none placeholder:text-[var(--text-placeholder)] focus:border-[var(--accent)] focus:shadow-[0_0_0_2px_var(--glow-focus)]";

  return (
    <div className="pointer-events-auto flex flex-wrap items-center gap-3 rounded-xl border border-[var(--divider)] bg-[var(--bg-input)] px-4 py-3 text-sm text-[var(--text-feature)] shadow-lg backdrop-blur transition-colors duration-300 ease-out">
      <div className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-[var(--text-label)]">Land type</span>
        <select
          value={filters.landType}
          onChange={(e) => handleChange("landType")(e.target.value as LandTypeFilter)}
          className={inputClass}
        >
          <option value="all">All</option>
          <option value="brownfield">Brownfield</option>
          <option value="parking">Parking lot</option>
          <option value="rail">Rail corridor</option>
          <option value="mall">Dead mall</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-[var(--text-label)]">Min. viability</span>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={filters.minViability}
            onChange={(e) => handleChange("minViability")(Number(e.target.value))}
            className="h-1 w-32 cursor-pointer [accent-color:var(--accent)]"
          />
          <span className="w-10 text-right text-xs tabular-nums text-[var(--text-feature)]">
            {filters.minViability}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-[var(--text-label)]">Min. site size (m²)</span>
        <input
          type="number"
          min={0}
          step={1000}
          value={filters.minArea}
          onChange={(e) => handleChange("minArea")(Number(e.target.value) || 0)}
          className={`w-28 ${inputClass}`}
        />
      </div>
    </div>
  );
}

