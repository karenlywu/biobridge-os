# BioBridge OS : QBI Hackathon 2026 Project
# Author: Karen Wu
BioBridge OS is a low-code data transformation platform purpose-built for the handoff of experiment data between wet-lab biologists and computational biologists. 
Safe space for wet-lab biologists to clean their messy exports with the built-in data rules their computational biologists have preset alongside an audit trail of who made what changes.

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

[Presentation Link](https://docs.google.com/presentation/d/1jPHlQJI7IIVcwO9qgl62BIoEkvmfkPd1g6i0JoyfREk/edit?usp=sharing)
[Proposal Link](https://docs.google.com/document/d/17S-wXvqItBxQKyTyLj03-HK4y1gndYG2bQ83QWtjwuc/edit?tab=t.0#heading=h.5wl0lvz9mtn3)

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
