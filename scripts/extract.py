import openpyxl, json, pathlib, datetime, re

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "dashboard" / "data.json"

def to_iso(v):
    if v is None or v == "":
        return None
    if isinstance(v, (datetime.datetime, datetime.date)):
        return v.date().isoformat() if isinstance(v, datetime.datetime) else v.isoformat()
    s = str(v).strip()
    if not s:
        return None
    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%Y-%m-%d %H:%M:%S", "%Y/%m/%d"):
        try:
            return datetime.datetime.strptime(s, fmt).date().isoformat()
        except: pass
    if re.match(r"^\d{4}-\d{2}-\d{2}", s):
        return s[:10]
    return s

def to_num(v):
    if v is None or v == "":
        return None
    if isinstance(v, (int, float)):
        return v
    s = str(v).strip().replace(",", "")
    try:
        n = float(s)
        return int(n) if n.is_integer() else n
    except: return None

def clean(v):
    if v is None: return ""
    if isinstance(v, (datetime.datetime, datetime.date)): return to_iso(v)
    return str(v).strip()

def norm(s): return str(s).strip().lower() if s else ""

def find_value(ws, label_sub):
    label_sub = label_sub.lower()
    for r in range(1, ws.max_row+1):
        a = ws.cell(r,1).value
        if a and label_sub in str(a).lower():
            return ws.cell(r,2).value
    return None

def parse_table(ws, header_row):
    headers = []
    for c in range(1, ws.max_column+1):
        v = ws.cell(header_row, c).value
        headers.append(norm(v) if v else f"col_{c}")
    rows=[]
    for r in range(header_row+1, ws.max_row+1):
        vals = [ws.cell(r,c).value for c in range(1, ws.max_column+1)]
        if all(v is None or str(v).strip()=="" for v in vals):
            continue
        d={}
        for i,h in enumerate(headers):
            d[h]=vals[i]
        rows.append(d)
    return headers, rows

def extract_youtube(wb):
    out={}
    ws = wb["Dashboard"] if "Dashboard" in wb.sheetnames else wb.active
    out["baseline"]={
        "subs": to_num(find_value(ws,"subscriber")) or 770,
        "wh": to_num(find_value(ws,"qualified watch hours")) or 266,
        "shorts_views": to_num(find_value(ws,"shorts views")) or 286,
        "target_subs": to_num(ws.cell(5,3).value) or 1000,
        "target_wh": to_num(ws.cell(6,3).value) or 4000,
        "target_shorts": to_num(ws.cell(7,3).value) or 10000000,
    }
    # 90-day kpi
    out["kpi_90"]={}
    for label in ["long-form published","live published","shorts published","watch hours / bulan"]:
        out["kpi_90"][label]= to_num(find_value(ws,label))
    # strategy + cadence
    strat=[]
    cad=[]
    for r in range(1, ws.max_row+1):
        a=ws.cell(r,1).value
        if not a: continue
        s=str(a).strip()
        if re.match(r"^[1-5]\.", s): strat.append(s)
        if s in ("Selasa","Jumat","Minggu","Rabu + Sabtu"):
            b=ws.cell(r,2).value
            cad.append({"day":s,"desc":clean(b)})
    out["strategy"]=strat
    out["cadence"]=cad

    # 90-Day Roadmap
    if "90-Day Roadmap" in wb.sheetnames:
        ws2=wb["90-Day Roadmap"]
        _,rows=parse_table(ws2,1)
        roadmap=[]
        for r in rows:
            roadmap.append({
                "week": to_num(r.get("week")),
                "start": to_iso(r.get("mulai")),
                "end": to_iso(r.get("selesai")),
                "fase": clean(r.get("fase")),
                "focus": clean(r.get("fokus mingguan")),
                "long1": clean(r.get("long-form #1")),
                "long2": clean(r.get("long-form #2")),
                "live": clean(r.get("live")),
                "shorts": to_num(r.get("shorts")),
                "target_wh": to_num(r.get("target watch hours")),
                "review": clean(r.get("review mingguan")),
                "status": clean(r.get("status")),
            })
        out["roadmap"]=roadmap
    else: out["roadmap"]=[]

    # Content Pipeline
    if "Content Pipeline" in wb.sheetnames:
        ws3=wb["Content Pipeline"]
        _,rows=parse_table(ws3,1)
        pipe=[]
        for r in rows:
            pipe.append({
                "id": clean(r.get("id")),
                "week": to_num(r.get("week")),
                "format": clean(r.get("format")),
                "publish_date": to_iso(r.get("publish date")),
                "pillar": clean(r.get("pillar")),
                "title": clean(r.get("working title")),
                "thumbnail": clean(r.get("thumbnail text")),
                "hook": clean(r.get("hook 0–15s")),
                "next_cta": clean(r.get("next video / cta")),
                "priority": clean(r.get("priority")),
                "status": clean(r.get("status")),
                "views": to_num(r.get("views")),
                "wh": to_num(r.get("watch hours")),
                "ctr": clean(r.get("ctr")),
                "avd": clean(r.get("avd min")),
                "shorts_extracted": to_num(r.get("shorts extracted")),
                "notes": clean(r.get("notes / learning")),
                "url": clean(r.get("url")),
            })
        out["pipeline"]=pipe
    else: out["pipeline"]=[]

    # KPI Tracker
    if "KPI Tracker" in wb.sheetnames:
        ws4=wb["KPI Tracker"]
        _,rows=parse_table(ws4,1)
        kpi=[]
        for r in rows:
            kpi.append({
                "week": clean(r.get("week")),
                "week_start": to_iso(r.get("week start")),
                "subs": to_num(r.get("subscribers")),
                "d_subs": to_num(r.get("δ subs") or r.get("δ subs")),
                "wh_cumul": to_num(r.get("qualified wh (cumulative)")),
                "d_wh": to_num(r.get("δ wh")),
                "views": to_num(r.get("views")),
                "returning": to_num(r.get("returning viewers")),
                "long_views": to_num(r.get("long-form views")),
                "wh_week": to_num(r.get("wh mingguan")),
                "ctr": clean(r.get("ctr avg")),
                "avd": clean(r.get("avd (min)")),
                "retention": clean(r.get("30s retention")),
                "long_pub": to_num(r.get("long-form pub")),
                "live_pub": to_num(r.get("live pub")),
                "shorts_pub": to_num(r.get("shorts pub")),
                "best_video": clean(r.get("best video")),
                "action": clean(r.get("action next week")),
            })
        out["kpi"]=kpi
    else: out["kpi"]=[]

    # Series & Funnel
    if "Series & Funnel" in wb.sheetnames:
        ws5=wb["Series & Funnel"]
        _,rows=parse_table(ws5,1)
        clusters=[]
        rules=[]
        skip = {"discovery video","series video","live","produk"}
        for r in rows:
            name = clean(r.get("series / cluster"))
            role = clean(r.get("role"))
            if name and role and name.lower() not in skip:
                clusters.append({
                    "name": name,
                    "role": role,
                    "entry": clean(r.get("entry video")),
                    "next1": clean(r.get("next #1")),
                    "next2": clean(r.get("next #2")),
                    "next3": clean(r.get("next #3")),
                    "playlist_cta": clean(r.get("playlist cta")),
                    "bridge": clean(r.get("business bridge")),
                    "kpi": clean(r.get("kpi utama")),
                })
        # funnel rules below (scan raw)
        for r in range(1, ws5.max_row+1):
            a=ws5.cell(r,1).value; b=ws5.cell(r,2).value
            if a and b and str(a).strip().lower() in ("discovery video","series video","live","produk"):
                rules.append({"type":clean(a),"rule":clean(b)})
        out["series"]=clusters
        out["funnel_rules"]=rules
    else: out["series"]=[]; out["funnel_rules"]=[]

    # Idea Bank
    if "Idea Bank" in wb.sheetnames:
        ws6=wb["Idea Bank"]
        _,rows=parse_table(ws6,1)
        ideas=[]
        for r in rows:
            ideas.append({
                "idea": clean(r.get("idea")),
                "pillar": clean(r.get("pillar")),
                "intent": clean(r.get("intent")),
                "title": clean(r.get("potential title")),
                "thumbnail": clean(r.get("thumbnail")),
                "keyword": clean(r.get("search keyword")),
                "series_fit": clean(r.get("series fit")),
                "business_fit": clean(r.get("business fit")),
                "score": to_num(r.get("score /10")),
                "decision": clean(r.get("decision")),
                "notes": clean(r.get("notes")),
            })
        out["ideas"]=ideas
    else: out["ideas"]=[]

    # Rebrand Checklist
    if "Rebrand Checklist" in wb.sheetnames:
        ws7=wb["Rebrand Checklist"]
        _,rows=parse_table(ws7,1)
        rb=[]
        for r in rows:
            rb.append({
                "area": clean(r.get("area")),
                "action": clean(r.get("action")),
                "priority": clean(r.get("priority")),
                "deadline": to_iso(r.get("deadline")),
                "status": clean(r.get("status")),
                "catatan": clean(r.get("catatan")),
            })
        out["rebrand"]=rb
    else: out["rebrand"]=[]
    return out

def extract_revenue(wb):
    out={}
    # Dashboard assumptions
    if "Dashboard" in wb.sheetnames:
        ws=wb["Dashboard"]
        out["assumptions"]={
            "target_net_per_day": to_num(find_value(ws,"target bersih / hari")) or 500000,
            "days_per_month": to_num(find_value(ws,"hari / bulan")) or 30,
            "ai_cost": to_num(find_value(ws,"langganan ai")),
            "domain_cost": to_num(find_value(ws,"domain / produk / tahun")),
            "commission": to_num(find_value(ws,"komisi affiliate")) or 0.4,
            "affiliate_gross_share": to_num(find_value(ws,"asumsi porsi gross")),
            "weighted_aov": to_num(find_value(ws,"weighted aov")) or 169000,
            "target_net_per_month": to_num(find_value(ws,"target bersih / bulan")),
            "fixed_cost": to_num(find_value(ws,"fixed cost / bulan")),
            "target_gross_per_month": to_num(find_value(ws,"target gross / bulan")),
            "target_gross_per_week": to_num(find_value(ws,"target gross / minggu")),
            "tx_per_month": to_num(find_value(ws,"kebutuhan transaksi / bulan")),
            "tx_per_day": to_num(find_value(ws,"kebutuhan transaksi / hari")),
            "tx_per_week": to_num(find_value(ws,"kebutuhan transaksi / minggu")),
        }
        # hero products (scan cols D-G)
        heroes=[]
        for r in range(1, ws.max_row+1):
            prod=ws.cell(r,5).value
            price=ws.cell(r,6).value if ws.cell(r,6).value else ws.cell(r,5+1).value
            # hero table is at D5:G8
            d=ws.cell(r,4).value; e=ws.cell(r,5).value; f=ws.cell(r,6).value; g=ws.cell(r,7).value
            if r>=5 and r<=8 and d and e:
                # row 5-8 has product info? check header row 4: Produk Harga Mix Weighted
                pass
        hero_table=[]
        for r in range(6,9):
            prod=ws.cell(r,4).value; price=ws.cell(r,5).value; mix=ws.cell(r,6).value; weighted=ws.cell(r,7).value
            if prod and norm(prod) not in ("produk","total / aov"):
                hero_table.append({"product":clean(prod),"price":to_num(price),"mix":to_num(mix),"weighted":to_num(weighted)})
        out["heroes"]=hero_table
        phases=[]
        for r in range(13,17):
            fase=ws.cell(r,4).value; hari=ws.cell(r,5).value; netd=ws.cell(r,6).value; net30=ws.cell(r,7).value; grossw=ws.cell(r,8).value
            if fase and str(fase).strip() and "fase" in str(fase).lower() and norm(fase)!="fase":
                phases.append({"fase":clean(fase),"hari":clean(hari),"net_per_day":to_num(netd),"net30":to_num(net30),"gross_week":to_num(grossw)})
        out["phases"]=phases
        # aturan strategis
        rules=[]
        for r in range(1, ws.max_row+1):
            a=ws.cell(r,4).value; b=ws.cell(r,5).value
            if a and str(a).strip().isdigit() and b:
                rules.append(clean(b))
        out["aturan"]=rules
    else: out["assumptions"]={}; out["heroes"]=[]; out["phases"]=[]

    # 90-Day Revenue Roadmap
    if "90-Day Revenue Roadmap" in wb.sheetnames:
        ws=wb["90-Day Revenue Roadmap"]
        _,rows=parse_table(ws,4)
        out["roadmap"]=[{
            "week": to_num(r.get("week")),
            "start": to_iso(r.get("mulai")),
            "end": to_iso(r.get("selesai")),
            "fase": clean(r.get("fase")),
            "focus": clean(r.get("fokus revenue")),
            "campaign": clean(r.get("primary campaign")),
            "audience": clean(r.get("audience utama")),
            "key_action": clean(r.get("key revenue action")),
            "affiliate_action": clean(r.get("affiliate action")),
            "wa_action": clean(r.get("wa / lead action")),
            "youtube_coord": clean(r.get("koordinasi youtube (no overlap)")),
            "net_target": to_num(r.get("net target / minggu")),
            "gross_target": to_num(r.get("gross target / minggu")),
            "status": clean(r.get("status")),
        } for r in rows]
    else: out["roadmap"]=[]

    # Weekly OS
    if "Weekly Operating System" in wb.sheetnames:
        ws=wb["Weekly Operating System"]
        _,rows=parse_table(ws,4)
        out["os"]=[{
            "day": clean(r.get("hari")),
            "owner": clean(r.get("owner utama")),
            "youtube_plan": clean(r.get("youtube plan")),
            "revenue_action": clean(r.get("revenue action")),
            "repurpose": clean(r.get("repurpose rule")),
            "load": clean(r.get("beban tambahan")),
            "hard_rule": clean(r.get("hard rule")),
        } for r in rows if clean(r.get("hari"))]
        # no-overlap rules
        nor=[]
        for r in range(1, ws.max_row+1):
            a=ws.cell(r,1).value; b=ws.cell(r,2).value
            if a and str(a).strip().isdigit() and b:
                nor.append(clean(b))
        out["no_overlap"]=nor
    else: out["os"]=[]; out["no_overlap"]=[]

    # Customer Segments
    if "Customer Segments" in wb.sheetnames:
        ws=wb["Customer Segments"]
        # baseline
        baseline={}
        for r in range(5,13):
            k=ws.cell(r,1).value; v=ws.cell(r,2).value
            if k and v is not None and str(k).strip():
                baseline[clean(k)]=to_num(v) if to_num(v) is not None else clean(v)
        # summary ringkasan col E-F
        summary={}
        for r in range(5,13):
            k=ws.cell(r,4).value; v=ws.cell(r,5).value
            if k and v is not None:
                summary[clean(k)]=to_num(v) if to_num(v) is not None else clean(v)
        out["segment_baseline"]=baseline
        out["segment_summary"]=summary
        _,rows=parse_table(ws,15)
        segs=[]
        for r in rows:
            if not clean(r.get("segment")): continue
            segs.append({
                "segment": clean(r.get("segment")),
                "count": to_num(r.get("est. count")),
                "campaign": clean(r.get("campaign")),
                "offer": clean(r.get("offer")),
                "price": to_num(r.get("incremental price")),
                "target_conv": to_num(r.get("target conv")),
                "target_sales": to_num(r.get("target sales")),
                "gross_potential": to_num(r.get("gross potential")),
                "week": to_num(r.get("week")),
                "angle": clean(r.get("message angle")),
            })
        out["segments"]=segs
    else: out["segments"]=[]

    # Campaign Planner
    if "Campaign Planner" in wb.sheetnames:
        ws=wb["Campaign Planner"]
        _,rows=parse_table(ws,4)
        out["campaigns"]=[{
            "id": clean(r.get("id")),
            "week": to_num(r.get("week")),
            "campaign": clean(r.get("campaign")),
            "audience": clean(r.get("audience")),
            "offer": clean(r.get("primary offer")),
            "price": to_num(r.get("price")),
            "objective": clean(r.get("objective")),
            "angle": clean(r.get("angle utama")),
            "cta": clean(r.get("cta / destination")),
            "channel": clean(r.get("primary channel")),
            "kpi": clean(r.get("success kpi")),
            "status": clean(r.get("status")),
        } for r in rows if clean(r.get("id"))]
    else: out["campaigns"]=[]

    # Affiliate Engine
    if "Affiliate Engine" in wb.sheetnames:
        ws=wb["Affiliate Engine"]
        summary={}
        for r in range(5,11):
            k=ws.cell(r,1).value; v=ws.cell(r,2).value
            if k and v is not None:
                summary[clean(k)]=to_num(v) if to_num(v) is not None else clean(v)
        out["affiliate_summary"]=summary
        # affiliates table header 14
        _,rows=parse_table(ws,14)
        affs=[{"affiliate":clean(r.get("affiliate")),"status":clean(r.get("status")),"hero":clean(r.get("hero product")),"sales":to_num(r.get("sales count")),"gross":to_num(r.get("gross sales")),"commission":to_num(r.get("commission")),"net":to_num(r.get("net revenue"))} for r in rows if r]
        # filter empty where all zero? keep as is but limit to those with hero
        out["affiliates"]=affs
    else: out["affiliate_summary"]={}; out["affiliates"]=[]

    # KPI Tracker revenue
    if "KPI Tracker" in wb.sheetnames:
        ws=wb["KPI Tracker"]
        _,rows=parse_table(ws,4)
        out["kpi"]=[{
            "week": to_num(r.get("week")),
            "start": to_iso(r.get("mulai")),
            "end": to_iso(r.get("selesai")),
            "fase": clean(r.get("fase")),
            "net_target": to_num(r.get("net target")),
            "gross_target": to_num(r.get("gross target")),
            "gross_actual": to_num(r.get("gross actual")),
            "affiliate_gross": to_num(r.get("affiliate gross")),
            "commission": to_num(r.get("affiliate commission")),
            "net_actual": to_num(r.get("net actual")),
            "transactions": to_num(r.get("transactions")),
            "aov": to_num(r.get("aov")),
            "new_customers": to_num(r.get("new customers")),
            "returning": to_num(r.get("returning customers")),
            "wa_leads": to_num(r.get("new wa leads")),
            "active_affiliates": to_num(r.get("active affiliates")),
            "status": clean(r.get("status")),
        } for r in rows]
    else: out["kpi"]=[]

    # Post & Cuan + Alignment (store raw tables)
    for name,key in [("Post & Cuan Integration","post_cuan"),("YouTube Alignment","alignment")]:
        if name in wb.sheetnames:
            ws=wb[name]
            # store first table headers
            try:
                h1,rows1=parse_table(ws,5)
                out[key+"_fields"]=rows1 if rows1 else []
            except: out[key+"_fields"]=[]
        else: out[key+"_fields"]=[]

    if "YouTube Alignment" in wb.sheetnames:
        ws=wb["YouTube Alignment"]
        _,rows=parse_table(ws,4)
        out["alignment"]=[{
            "workstream": clean(r.get("workstream")),
            "owner": clean(r.get("owner / source of truth")),
            "cadence": clean(r.get("cadence dari yt plan")),
            "used_for": clean(r.get("dipakai revenue plan untuk")),
            "dont": clean(r.get("jangan dilakukan")),
            "status": clean(r.get("status")),
        } for r in rows if clean(r.get("workstream"))]
    else: out["alignment"]=[]

    return out

def main():
    files=list(ROOT.glob("*.xlsx"))
    yt_file=next((f for f in files if "youtube" in f.name.lower()), None)
    rev_file=next((f for f in files if "500k" in f.name.lower() or "roadmap" in f.name.lower() and f!=yt_file), None)
    if not yt_file or not rev_file:
        # fallback by sort
        if len(files)>=2:
            files=sorted(files, key=lambda p: p.name)
            yt_file, rev_file = files[0], files[1]
        else:
            raise SystemExit(f"Need 2 xlsx in {ROOT}, found {files}")
    print(f"[extract] Youtube: {yt_file.name}")
    print(f"[extract] Revenue: {rev_file.name}")
    wb1=openpyxl.load_workbook(str(yt_file), data_only=True)
    wb2=openpyxl.load_workbook(str(rev_file), data_only=True)
    data={
        "meta":{
            "extracted_at": datetime.datetime.now().isoformat(),
            "baseline_date": "2026-08-17",
            "youtube_file": yt_file.name,
            "revenue_file": rev_file.name,
        },
        "youtube": extract_youtube(wb1),
        "revenue": extract_revenue(wb2),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT,"w",encoding="utf-8") as f:
        json.dump(data,f,ensure_ascii=False,indent=2)
    print(f"[extract] wrote {OUT} ({OUT.stat().st_size} bytes)")
    print(f"[extract] youtube: roadmap {len(data['youtube'].get('roadmap',[]))} weeks, pipeline {len(data['youtube'].get('pipeline',[]))}, ideas {len(data['youtube'].get('ideas',[]))}")
    print(f"[extract] revenue: roadmap {len(data['revenue'].get('roadmap',[]))} weeks, campaigns {len(data['revenue'].get('campaigns',[]))}, segments {len(data['revenue'].get('segments',[]))}")

if __name__=="__main__":
    main()
