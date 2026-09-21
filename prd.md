# PRD — Unified Dashboard: YouTube Growth + Revenue 500K — Pak Husnul

## 1. Ringkasan
Satukan 2 workbook Excel (YouTube Growth Plan 90 Hari + Roadmap 500K Bersih/Hari) jadi 1 dashboard HTML offline-first, read-only, tanpa build step. Sumber tetap Excel; dashboard hanya visualisasi + tracking. Post & Cuan tetap source of truth harian.

## 2. Masalah
- 2 file terpisah, 16 sheet, ~600 rows — sulit lihat hubungan YouTube ↔ revenue per minggu
- Tracking KPI ganda (YouTube WH/subs vs Revenue net/gross) tidak sinkron visual
- Weekly cadence bentrok jika tidak ada swimlane yang jelas (LOCKED vs ACTIVE)
- Idea Bank 100 row & Content Pipeline 39 video butuh filter, bukan scroll Excel

## 3. Tujuan
- 1 halaman lihat: progress 90 hari (17 Agu–15 Nov 2026) dual-track YouTube + Revenue
- KPI header langsung jawab: "sudah sejauh mana ke 1000 subs / 4000 WH / 500K/hari?"
- Filter pipeline & idea bank tanpa buka Excel
- Checklist rebrand & OS mingguan bisa dicentang (localStorage)
- Re-extract 1 klik kalau Excel diupdate

## 4. Non-Tujuan (v1 tidak ada)
- Edit Excel dari dashboard (read-only)
- Input transaksi harian (tetap Post & Cuan)
- Login / backend / database / auth
- Tambah kalender YouTube dari sisi revenue (dilarang oleh spec)
- Notifikasi / email / WA automation

## 5. Pengguna
- **Pak Husnul** (primary): cek progress mingguan, pilih next video/campaign
- **Operator/Editor** (secondary): filter pipeline, cek hook/thumbnail, rebrand checklist
- **Affiliate admin** (future): lihat affiliate engine — v1 hanya tampil, bukan kelola

## 6. User Stories
- US1: Sebagai Pak Husnul, saya lihat header KPI (subs 770→1000, WH 266→4000, net run-rate 0→500K) dengan progress bar dalam 5 detik.
- US2: Saya scroll timeline 13 minggu dan lihat per minggu: fokus YouTube vs fokus Revenue berdampingan, sinkron tanggal.
- US3: Saya filter Content Pipeline by Format/Pillar/Status/Week untuk pilih video next.
- US4: Saya switch tab KPI Tracker: YouTube (WH/CTR/AVD) vs Revenue (net/gross/AOV/transactions).
- US5: Saya lihat Series & Funnel chain (entry → next chain → playlist CTA → business bridge).
- US6: Saya lihat Campaign Planner + Customer Segments + gross potential per segment.
- US7: Saya lihat Weekly OS swimlane Senin–Minggu, jelas mana LOCKED (YouTube) vs Repurpose.
- US8: Saya filter/sort Idea Bank by score/pillar/decision dan search keyword.
- US9: Saya centang Rebrand Checklist, state tersimpan lokal.
- US10: Saya re-run `scripts/extract.py` setelah edit Excel dan refresh dashboard tanpa ubah kode.

## 7. Requirements — Functional

### F1 Header KPI
- Dari `youtube.baseline` + `revenue.assumptions`
- Tampilkan: Subs, WH, Shorts views (progress %), Net target fase, Gross mingguan, Transaksi/hari needed (3.45), AOV 169K
- Hitung derived: subs progress 77%, WH 6.65%, gap to 500K/day
- ponytail: hitung live dari data.json; jika Post & Cuan API ada, ganti source nanti

### F2 90-Day Timeline (dual track)
- 13 rows, kolom: Week | Tanggal | Fase | YouTube Focus + Long#1/Live | Revenue Focus + Campaign | Net Target
- Color by fase: Repositioning / Double Down / Series Engine
- Indikator status Planned vs Done

### F3 Content Pipeline
- Table 39 rows, filter: Format (Long/Live/Shorts), Pillar, Priority P0/P1, Status, Week
- Kolom tampil: ID, Date, Title, Thumbnail text, Hook (truncate + expand), Next Video CTA
- Search by title/keyword
- Klik row → detail panel (hook full + notes)

### F4 KPI Tracker (2 tabs)
- Tab YouTube: line chart WH cumul + subs, bar WH mingguan, table CTR/AVD/retention (Chart.js)
- Tab Revenue: line net vs gross target, bar transactions, table AOV/new customers/WA leads
- Data awal kosong (Planned), chart handle empty → tampil target line saja
- ponytail: input actual via edit data.json manual; future: form inline simpan localStorage

### F5 Series & Funnel
- 5 cluster cards, each: chain visual (entry → next1 → next2 → next3) + bridge + KPI utama
- 4 funnel rules sebagai callout

### F6 Campaigns & Segments
- Campaign table 12 rows (ID, Week, Offer, Price, Channel, KPI, Status)
- Segment table 5 rows + gross potential (hitung price * conv * count)
- Ringkasan: unique buyer 296, warm pool 272, Pro→Max pool 100

### F7 Weekly Operating System
- Swimlane 7 hari: Owner, YouTube Plan, Revenue Action, Repurpose Rule, Hard Rule
- Badge LOCKED / ACTIVE / Repurpose

### F8 Idea Bank
- Table ~100 rows, sortable by Score, filter Pillar/Intent/Decision, search title/keyword
- Highlight Score 10

### F9 Rebrand Checklist
- 15 rows, checkbox, Priority badge, Deadline, Status
- Persist ke localStorage `rebrand:v1`
- Progress ring: x/15 done

### F10 Data Layer
- `scripts/extract.py`: baca 2 xlsx via openpyxl `data_only=True`, output `dashboard/data.json` utf-8
- `dashboard/data.json` = single source untuk app.js, no fetch ke xlsx runtime
- Re-runnable idempotent, skip styling/merged cells, log warnings ke console

## 8. Requirements — Non-Functional
- NFR1: Buka via `file://` atau `py -m http.server` tanpa npm/build
- NFR2: 1 dependency runtime: Chart.js UMD via CDN (fallback table jika offline)
- NFR3: Load < 500ms di laptop biasa, data.json < 200KB
- NFR4: Offline: semua aset lokal kecuali Chart.js CDN (graceful degrade)
- NFR5: Responsive: desktop table, mobile card/list (CSS grid, no framework)
- NFR6: Aksesibilitas: tabel pakai <th> + scope, kontras AA, keyboard filter

## 9. Data Contract
- Input: 2 xlsx path hardcoded di extract.py (relative ke NGONTEN/)
- Output: dashboard/data.json sesuai schema di map.md §4
- Validasi: jika sheet hilang → warning + empty array, dashboard tetap render
- Encoding: utf-8, tanggal ISO 8601 (YYYY-MM-DD)

## 10. UI Spec (v1)
- Layout: header KPI (4 cards) → timeline → tabs (Pipeline | KPI | Series | Campaigns | OS | Ideas | Rebrand)
- Style: vanilla CSS, system font, max-width 1200px, sticky header + tab nav
- Charts: Chart.js line/bar, colors muted (slate + amber accent), no heavy theming
- State: tab via URL hash (#pipeline), filter via query param in-memory, checklist via localStorage

## 11. Acceptance Criteria
- AC1: `py scripts/extract.py` sukses generate data.json tanpa error openpyxl warning selain known extension
- AC2: Buka dashboard/index.html tampil 8 section sesuai map.md §5, data match Excel (spot check 3 rows per sheet)
- AC3: Filter pipeline & idea bank bekerja tanpa reload
- AC4: Chart render dengan data kosong (hanya target line) tanpa JS error
- AC5: Checklist rebrand persist setelah reload
- AC6: File:// open tidak butuh server (kecuali fetch data.json → butuh http.server, dokumentasikan)
- AC7: Lighthouse-ish: no console error, no 404 asset lokal

## 12. Milestone (lazy — 1 phase)
- **M1 Extract**: scripts/extract.py + data.json (verifikasi dump)
- **M2 Dashboard**: index.html + style.css + app.js (8 sections, filter, chart)
- **M3 Polish**: responsive, empty-state, localStorage, README cara re-run
- Estimasi: 1 sesi, < 5 file baru, < 800 LOC total

## 13. Risiko & Mitigasi
- R1 Excel pakai merged cell → mitigasi: iter_rows values_only, skip None, log
- R2 file:// fetch block CORS → mitigasi: instruksi `py -m http.server 8000` di README, atau inline data.js fallback
- R3 Chart.js CDN offline → mitigasi: fallback render table, no hard fail
- R4 User edit Excel struktur berubah → mitigasi: extract.py pakai header-name matching, bukan index kolom

## 14. Future (tidak di v1)
- Inline edit actual KPI + export CSV → ponytail: tambah form + localStorage + download
- Post & Cuan API sync → ponytail: ganti extract.py source
- Affiliate CRM mini → ponytail: tambah sheet Affiliate Engine input
- PWA install + weekly reminder → ponytail: tambah manifest + service worker

## 15. Open Questions (jawab sebelum build)
- Q1: Mau Chart.js CDN atau Chart tanpa CDN (canvas native)? Default: CDN.
- Q2: data.json commit ke repo atau gitignore? Default: commit (source of truth render).
- Q3: Bahasa dashboard ID full atau mix EN? Default: ID (ikuti Excel).
