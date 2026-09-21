# DESIGN — Unified Dashboard: YouTube Growth + Revenue 500K — Pak Husnul

## 1. Prinsip
- **Lazy first**: HTML+CSS+vanilla JS, 0 build step, 0 npm, 1 CDN dep (Chart.js)
- **Read-only**: Excel = source, `data.json` = derived, dashboard = view
- **Offline-first**: semua lokal kecuali Chart.js (fallback table jika gagal)
- **1 page, 8 section, hash-nav**: tanpa router, tanpa framework
- `ponytail:` scale path → ganti `data.json` dengan API Post & Cuan; tambah form inline edit

## 2. Arsitektur

```
[xlsx #1] ──┐
             ├─► scripts/extract.py (openpyxl, data_only) ──► dashboard/data.json ──► dashboard/index.html
[xlsx #2] ──┘                                                    │  app.js + style.css
                                                                 └─► Chart.js CDN (UMD, optional)
Post & Cuan (external, tidak disentuh v1) ── manual roll-up mingguan ──► edit xlsx ──► re-extract
```

- Extract idempotent, header-name matching (bukan index kolom), skip merged/styling
- Dashboard fetch `data.json` via `fetch()` → butuh `py -m http.server` (file:// block CORS). Fallback: inline `<script>window.__DATA__` jika fetch gagal

## 3. Struktur File

```
NGONTEN/
├── YouTube Growth Plan — Pak Husnul — 90 Hari.xlsx
├── Roadmap 500K Bersih per Hari — Pak Husnul — 90 Hari.xlsx
├── map.md | prd.md | DESIGN.md
├── scripts/
│   └── extract.py          ~180 LOC, stdlib + openpyxl
└── dashboard/
    ├── index.html          ~250 LOC, semantic HTML
    ├── style.css           ~350 LOC, custom props, grid, no framework
    ├── app.js              ~400 LOC, vanilla, hash router, filter, Chart.js glue
    └── data.json           generated, <200KB, utf-8, ISO dates
```

## 4. Data Flow & Contract

### 4.1 Extract
- Input: 2 path hardcoded relatif `../*.xlsx` (cari glob `*.xlsx` jika rename)
- Per sheet: `iter_rows(values_only=True)` → dict via header row (lower+trim match)
- Tanggal → ISO `YYYY-MM-DD`, angka → float/int, kosong → null/"" 
- Validasi: sheet hilang → `[]` + `console.warn`, tidak throw
- Output: `dashboard/data.json` schema map.md §4 (meta + youtube.* + revenue.*)

### 4.2 Runtime
- `app.js` `fetch('data.json')` → `renderAll(data)`
- Jika fetch fail (file://): coba `window.__DATA__` (user bisa inline copy data.json)
- Semua render pure function `data → DOM`, no mutation source

## 5. Layout (IA → Wireframe)

```
┌─ Sticky Header ─────────────────────────────────────────┐
│ [Pak Husnul — 90 Hari]  Baseline 17 Agu 2026 — 15 Nov   │
│ [4 KPI cards: Subs | WH | Shorts | 500K/day run-rate]   │
│ progress bar + gap                                      │
├─ Tab Nav (hash) ────────────────────────────────────────┤
│ [Timeline] [Pipeline] [KPI] [Series] [Campaign] [OS] [Ideas] [Rebrand] │
├─ Section: Timeline ─────────────────────────────────────┤
│ 13-row dual track table: Week | Tgl | Fase | YouTube Focus | Revenue Focus | Net Target │
│ color dot fase, status badge                            │
├─ Pipeline ──────────────────────────────────────────────┤
│ [filters: Format Pillar Priority Week | search]          │
│ table: ID Date Title Thumb Hook CTA + expand detail     │
├─ KPI Tracker ───────────────────────────────────────────┤
│ [tab: YouTube | Revenue]                                │
│ YouTube: line WH cumul+subs + bar WH/minggu + table CTR/AVD │
│ Revenue: line net vs gross + bar transactions + table AOV │
│ empty → hanya garis target, no error                    │
├─ Series & Funnel ───────────────────────────────────────┤
│ 5 cards: chain entry → next chain (arrow) + bridge + KPI│
│ 4 funnel rules callout                                  │
├─ Campaigns & Segments ──────────────────────────────────┤
│ campaign table 12 + segment table 5 + summary 296 buyer │
├─ Weekly OS ─────────────────────────────────────────────┤
│ 7-row swimlane + badges LOCKED/ACTIVE/Repurpose         │
├─ Ideas ─────────────────────────────────────────────────┤
│ filters + sortable table ~100 rows, score 10 highlight  │
├─ Rebrand ───────────────────────────────────────────────┤
│ checklist 15 + progress ring x/15, localStorage         │
└─────────────────────────────────────────────────────────┘
Footer: "Re-extract: py scripts/extract.py" + extracted_at
```

- Desktop: table; Mobile (<720px): card stack via CSS grid, tab nav scroll horizontal
- Max-width 1200px, centered, system font

## 6. Visual Design

### 6.1 Tokens (CSS custom props)
```css
--bg: #f8fafc; --card: #ffffff; --text: #0f172a; --muted: #64748b;
--border: #e2e8f0; --accent: #f59e0b; --accent-2: #0ea5e9;
--fase-repos: #fef3c7; --fase-double: #dbeafe; --fase-series: #dcfce7;
--radius: 12px; --shadow: 0 1px 3px rgba(0,0,0,.08);
--font: ui-sans-system, -apple-system, Segoe UI, Roboto, sans-serif;
```

### 6.2 Components
- **KPI card**: label + value besar + target kecil + progress bar (native `<progress>`)
- **Badge**: `fase`, `priority P0/P1`, `status Planned/Done`, `LOCKED/ACTIVE` — pill, 11px
- **Table**: `<table>` semantic, `<th scope="col">`, zebra, sticky head, horizontal scroll
- **Filter bar**: `<select>` + `<input type="search">` native, no custom dropdown
- **Chart**: Chart.js line (tension 0.3, fill false) + bar, colors `--accent`/`--accent-2`/slate, legend bottom
- **Progress ring**: SVG circle (r=40) untuk rebrand x/15

### 6.3 States
- Empty: dashed card "Belum ada actual — target line tampil"
- Loading: skeleton 3 bar
- Error: `data.json` gagal → banner "Jalankan py -m http.server 8000 di folder dashboard"
- Offline Chart.js: hide canvas, show table fallback

## 7. Interaction

| Aksi | Handler | Persist |
|------|---------|---------|
| Switch tab | `hashchange` → show section, hide lain | URL hash |
| Filter pipeline/ideas | `input`/`change` → `Array.filter` re-render tbody | in-memory |
| Sort ideas | click `<th>` → `sort()` toggle asc/desc | in-memory |
| Search | debounce 150ms, case-insensitive includes | in-memory |
| Expand row | click row → toggle detail `<tr>` | — |
| Checklist rebrand | `change` checkbox → save | `localStorage rebrand:v1` |
| Chart tab YouTube/Revenue | click → toggle canvas | hash `#kpi-youtube` |

- Keyboard: Tab → filter/select/checkbox, Enter → expand, Esc → close detail
- No modal, no drag, no pagination (scroll)

## 8. App.js Modules (vanilla, IIFE)

```js
// app.js outline ~400 LOC
const Store = { data:null, filters:{pipeline:{}, ideas:{}} }
async function load() // fetch data.json → fallback window.__DATA__
function renderAll(d) // call 8 renderers
function renderHeader(d), renderTimeline(d), renderPipeline(d), renderKPI(d),
       renderSeries(d), renderCampaigns(d), renderOS(d), renderIdeas(d), renderRebrand(d)
function bindEvents() // hash, filter, sort, checklist
function initCharts(d) // Chart.js if window.Chart else fallback table
```

- No bundler, no import map, 1 script tag
- Chart glue: `if (!window.Chart) return renderTableFallback()`

## 9. Extract.py Design

```py
# scripts/extract.py outline ~180 LOC
import openpyxl, json, pathlib, datetime
XLSX = list(pathlib.Path("..").glob("*.xlsx"))  # auto-find 2 files
def header_map(ws): # row1 → {norm_name: col_idx}
def rows_as_dicts(ws, header_row=1): # yield dict per row
def to_iso(v): # datetime/str → YYYY-MM-DD
def extract_youtube(wb): # 7 sheets → dict
def extract_revenue(wb): # 9 sheets → dict
def main(): wb1,wb2 = load → build payload → json.dump utf-8 → print summary
```

- Header matching: `k.lower().strip().replace(" ","_")` contains check
- Skipped: merged cells, styles, conditional formatting, unknown extension warning
- Log: `print(f"[extract] Youtube roadmap: {len} weeks")`

## 10. Non-Functional

- Perf: data.json <200KB, 1 fetch, 0 blocking font, Chart.js async via `defer`
- A11y: `<th scope>`, label+input, contrast AA (slate 900 on slate 50), focus ring
- Responsive: 1 breakpoint 720px, grid 1→2→4 untuk KPI cards
- Browser: evergreen (Chrome/Edge/Firefox), no IE

## 11. Acceptance (trace PRD AC)
- AC1 extract.py → data.json tanpa throw
- AC2 8 section render + spot check 3 rows/sheet
- AC3 filter tanpa reload
- AC4 chart empty → target line only, no JS error
- AC5 checklist persist reload
- AC6 file:// banner + http.server works
- AC7 0 console error, 0 404 lokal

## 12. Risiko & Mitigasi
- CORS file:// → banner + instruksi `py -m http.server 8000` + optional inline data.js
- CDN offline → table fallback, no blank
- Excel struktur geser → header-name matching + warn, bukan index
- 100-row table lag → render tbody only, no virtual scroll needed (<200 rows)

## 13. Build & Run

```bash
py scripts/extract.py              # generate dashboard/data.json
py -m http.server 8000 --directory dashboard
# buka http://localhost:8000
# edit xlsx → re-run extract → refresh
```

## 14. Yang Sengaja Tidak Dibuat (v1)
- Edit/write Excel, login, backend, DB, npm, framework, pagination, PWA, API sync
- ponytail: tambah `dashboard/data.local.json` + form inline jika butuh input actual tanpa Excel
