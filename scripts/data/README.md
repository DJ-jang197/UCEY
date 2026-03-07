# Data Scripts

- `build-data-assets.ts`
  Builds filtered CSV assets in `data/raw/` from `data/raw/fcsi/contamination_summary_source_dataAdhyan.csv`.

- `parse-fcsi-xml.py`
  Parses raw `fcsi-rscf.xml` into contamination summary CSV with city/province filters.

- `backboard-analysis.py`
  Optional Backboard analysis helper for the filtered contamination CSV.
  Requires `BACKBOARD_API_KEY` in environment.
