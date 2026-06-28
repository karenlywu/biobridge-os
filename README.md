# BioBridge OS v4.0

Bidirectional low-code data transformation for life sciences — clean messy wet-lab exports, generate reproducible Python scripts, and maintain a full audit trail.

**Stack:** React 18 + TypeScript, Vite, Tailwind CSS, Zustand, PapaParse, SheetJS

## Quick start

```bash
npm install
npm run dev
```

Open the local URL (usually `http://localhost:5173`).

## Live demo

1. Load **⭐ Live demo (dirty handoff)** from the Demo Gallery on the upload screen.
2. Follow the step-by-step script in [`docs/LIVE_DEMO_SCRIPT.md`](docs/LIVE_DEMO_SCRIPT.md).

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
- `docs/` — Live demo presenter script

## License

Internal R&D demo — see repository owner for usage terms.
