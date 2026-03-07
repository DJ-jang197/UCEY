Data assets for backend and data workflows.

## Generated files

- `source_catalog.csv`
  Purpose: canonical list of source URLs provided by the project team.

- `contaminant_cost_reference_2026.csv`
  Purpose: contaminant cost table provided by Adhyan (2026 ranges).

- `city_disposal_rate_reference_2026.csv`
  Purpose: city disposal rate table provided by Adhyan.

## FCSI folder

- `fcsi/contamination_summary_source_dataAdhyan.csv`
  Source: imported from `origin/dataAdhyan`.

- `fcsi/fcsi_contamination_filtered.csv`
  Filter: provinces `ON/BC/QC`, cities `Toronto/Vancouver/Montreal`.
  Contains contamination records + mapped contaminant group + cost estimates.

- `fcsi/fcsi_sites_filtered.csv`
  Site-level aggregation of filtered contamination records.

- `fcsi/soil_score_input_template.csv`
  Template to populate `sand_score`, `clay_score`, `drainage_score`, `organic_score`.
  Formula:
  `score = (sand*0.30) + (clay*0.25) + (drainage*0.25) + (organic*0.20)`
  `final_percentage = score * 100`

- `fcsi/source_fetch_log.md`
  Notes on source accessibility from this environment.

- `fcsi/fcsi-rscf-eng.rtf`
  Official data dictionary from FCSI.

## Build command

Run to regenerate filtered CSVs and reference tables:

```bash
npm run data:build
```

## Optional XML parser

If you later obtain `fcsi-rscf.xml`, run:

```bash
python3 scripts/data/parse-fcsi-xml.py \
  --input data/raw/fcsi/fcsi-rscf.xml \
  --output data/raw/fcsi/contamination_summary_from_xml.csv
```

Then rerun:

```bash
npm run data:build
```
