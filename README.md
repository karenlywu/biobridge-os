# BioBridge OS : QBI Hackathon 2026 Project
# Author: Karen Wu

Bidirectional low-code data transformation for life sciences — clean messy wet-lab exports, generate reproducible Python scripts, and maintain a full audit trail.

**Stack:** React 18 + TypeScript, Vite, Tailwind CSS, Zustand, PapaParse, SheetJS

## Quick start

```bash
npm install
npm run dev
```

Open the local URL (usually `http://localhost:5173`).

## Demo details

1. User set as Dr. Elena
2. Pre-loaded "raw datasets" that need to be cleaned, so just select one.
3. Protocols/schemas built as user Marcus

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Oxlint |

## Project structure

- `src/types/` — Core data model
- `src/store/` — Zustand state
- `src/lib/` — Parsing, detection, codegen, suggestions
- `src/components/` — UI modules
- `src/data/sampleDatasets/` — Bundled demo CSV/TSV/XLSX files
- `docs/` — Local-only docs (gitignored)

## License

Internal R&D demo — see repository owner for usage terms.
