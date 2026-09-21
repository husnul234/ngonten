# MAP — YouTube + Revenue Dashboard — Pak Husnul

## 1. Source Inventory

| File | Sheets | Rows | Role |
|------|--------|------|------|
| `YouTube Growth Plan — Pak Husnul — 90 Hari.xlsx` | 7 | ~240 | Growth engine |
| `Roadmap 500K Bersih per Hari — Pak Husnul — 90 Hari.xlsx` | 9 | ~350 | Revenue engine |

### YouTube Growth Plan — sheet detail
- **Dashboard** (26 rows): baseline 17 Agu 2026, target 90 hari, strategi 40/40/20, weekly cadence
- **90-Day Roadmap** (13 weeks): Week, Fase, Fokus, Long#1/#2, LIVE, Shorts, Target WH, Review, Status
- **Content Pipeline** (39 + header): ID, Week, Format, Date, Pillar, Title, Thumbnail, Hook, Next Video CTA, Priority, Status, metrics (Views/WH/CTR/AVD/Shorts)
- **KPI Tracker** (14 rows): Week, Subs, WH cumul, Views, Returning, CTR, AVD, retention, Pub counts, Best Video
- **Series & Funnel** (5 clusters + 4 rules): cluster → entry/next chain → playlist CTA → business bridge → KPI
- **Idea Bank** (~100 rows): Pillar, Intent, Title, Keyword, Series/Business fit, Score 0-10, Decision
- **Rebrand Checklist** (15 rows): Area, Action, Priority, Deadline, Status, Catatan

### Roadmap 500K — sheet detail
- **Dashboard**: asumsi ekonomi (AOV 169K, fixed 741K, komisi 40%, mix 40/40/20), target fase 350K→425K→500K/hari, gross mingguan
- **90-Day Revenue Roadmap** (13 weeks): Fase, Fokus Revenue, Primary Campaign, Audience, Key/Affiliate/WA Action, YouTube koordinasi, Net/Gross target
- **Weekly Operating System**: Senin–Minggu owner, YouTube vs Revenue vs Repurpose, 4 no-overlap rules
- **Customer Segments**: baseline 296 buyer (MA 200, BS 120, overlap 24), 5 segment + campaign + conv target
- **Campaign Planner** (12 campaigns C01–C12): Audience, Offer, Price, Objective, Angle, CTA, Channel, KPI
- **Affiliate Engine**: summary target 5→12→20 active, template 15 rows per affiliate
- **KPI Tracker** (13 weeks): Net/Gross target vs actual, affiliate gross/commission, transactions, AOV, new/returning, WA leads
- **Post & Cuan Integration**: field transaksi wajib (10 field), widget dashboard (8 widget)
- **YouTube Alignment**: 8 workstreams, 4 shared rules, LOCKED vs ACTIVE status

## 2. Relationships (why 2 files)
```
YouTube Growth Plan (source asset) ──1 asset → multi-channel──> Revenue Roadmap (monetize)
        │ Selasa/Jumat/Minggu LOCKED              │ Senin/Kamis + repurpose Rabu/Sabtu
        └────────── Post & Cuan = source of truth harian ──────┘
                          ↓ weekly roll-up
                   KPI Tracker (both workbooks)
```
- Revenue file reuse: tidak buat video baru, hanya tentukan CTA/destination/kit affiliate
- Single source: Post & Cuan daily → roll-up mingguan ke kedua KPI Tracker

## 3. Target Structure (dashboard repo)
```
NGONTEN/
├── YouTube Growth Plan — ... .xlsx   # source, read-only
├── Roadmap 500K — ... .xlsx          # source, read-only
├── map.md                            # this file
├── prd.md                            # requirements
├── dashboard/
│   ├── index.html                    # single-page dashboard, no build
│   ├── data.json                     # extracted + normalized from xlsx (generated)
│   ├── app.js                        # vanilla JS, Chart.js via CDN
│   └── style.css                     # minimal, reuse native CSS
└── scripts/
    └── extract.py                    # py openpyxl → data.json (one-off + re-run)
```

## 4. Data Model (normalized)
```json
{
  "meta": { "baseline_date": "2026-08-17", "extracted_at": "..." },
  "youtube": {
    "baseline": { "subs": 770, "wh": 266, "shorts_views": 286, "targets": {...} },
    "roadmap": [{ "week":1, "fase":"Repositioning", "focus":"...", "long1":"...", "live":"...", "target_wh":25 }],
    "pipeline": [{ "id":"W01-A", "week":1, "format":"Long-form", "date":"2026-08-18", "pillar":"Discovery", "title":"...", "status":"Planned" }],
    "kpi": [{ "week":0, "subs":770, "wh_cumul":266 }],
    "series": [{ "name":"Deploy Web", "role":"Discovery magnet", "chain":["..."], "bridge":"..." }],
    "ideas": [{ "title":"...", "pillar":"Discovery", "score":9, "decision":"Keep" }],
    "rebrand": [{ "area":"Positioning", "action":"...", "priority":"P0", "status":"To Do" }]
  },
  "revenue": {
    "assumptions": { "aov":169000, "fixed":741667, "commission":0.4, "mix":{...}, "targets":{ "f1":350000 } },
    "roadmap": [{ "week":1, "focus":"Reset & tracking", "campaign":"Post & Cuan reset", "net_target":2450000 }],
    "segments": [{ "segment":"ModulAjar only", "count":176, "campaign":"Cross-sell #1", "price":149000 }],
    "campaigns": [{ "id":"C01", "week":1, "offer":"—", "price":0, "channel":"Internal" }],
    "kpi": [{ "week":1, "net_target":2450000, "gross_target":2914506 }],
    "operating_system": [{ "day":"Senin", "owner":"Revenue", "rule":"Jangan bikin video..." }]
  }
}
```

## 5. Dashboard IA (sections → source)
1. **Header KPI** — youtube.baseline + revenue.assumptions (subs/WH progress, 500K/day run-rate)
2. **90-Day Timeline** — youtube.roadmap ⟷ revenue.roadmap (dual track, week sync)
3. **Content Pipeline** — filterable table (Format/Pillar/Status/Week) + hook/thumbnail preview
4. **KPI Tracker** — 2 tabs: YouTube (WH/subs/CTR/AVD) vs Revenue (net/gross/transactions/AOV)
5. **Series & Funnel** — cluster chain visualization + business bridge
6. **Campaigns & Segments** — campaign planner + segment pool + gross potential
7. **Weekly OS** — Senin–Minggu swimlane (YouTube LOCKED / Revenue ACTIVE / Repurpose)
8. **Idea Bank + Rebrand** — sortable idea table + rebrand checklist progress

## 6. Tech Choices (lazy ladder)
- No framework: vanilla JS + CSS, Chart.js CDN (1 dep for charts, else native)
- No build step: single index.html opens via file:// or simple http.server
- Extract: Python openpyxl (already installed) → data.json, re-runnable
- Charts: Chart.js UMD via CDN, fallback to tables if offline
- State: URL hash for tab/filter, localStorage for checklist ticks

## 7. Risks & Notes
- xlsx has merged cells + conditional formatting → extract via `data_only=True`, skip styling
- Char encoding (— • →) → output utf-8
- Post & Cuan = external source, dashboard read-only roll-up, no daily input here
- Re-run extract after editing xlsx; dashboard auto-loads new data.json
