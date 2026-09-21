let DATA=null;
const S=[
 {id:"timeline",label:"Timeline"},{id:"pipeline",label:"Pipeline"},{id:"kpi",label:"KPI Tracker"},{id:"series",label:"Series & Funnel"},{id:"campaign",label:"Campaigns"},{id:"os",label:"Weekly OS"},{id:"ideas",label:"Ideas"},{id:"rebrand",label:"Rebrand"} 
];
function fmt(n){ if(n==null||n==="")return "—"; if(typeof n==="number") return n.toLocaleString("id-ID"); return String(n)}
function pct(a,b){ if(!b) return 0; return Math.round(a/b*100)}
function badge(t,c){ return `<span class="badge ${c||''}">${t}</span>`}
function faseDot(f){ if(!f) return ""; const k=f.toLowerCase(); let cls="repos"; if(k.includes("double")) cls="double"; if(k.includes("series")) cls="series"; return `<span class="dot ${cls}"></span>`}
function faseBadge(f){ const c=f==="Repositioning"?"fase-Repositioning":f==="Double Down"?"fase-Double":f==="Series Engine"?"fase-Series":""; return badge(f,c)}
async function load(){
  try{ const r=await fetch("data.json",{cache:"no-store"}); if(!r.ok) throw 0; DATA=await r.json(); }
  catch(e){ if(window.__DATA__) DATA=window.__DATA__; else { const b=document.getElementById("banner"); b.style.display="block"; b.textContent="data.json gagal load (buka via file:// kena CORS). Jalankan: py -m http.server 8000 --directory dashboard lalu buka http://localhost:8000"; return; } }
  renderAll();
}
function renderAll(){
  document.getElementById("meta").textContent=`Extract ${DATA.meta.extracted_at.slice(0,16).replace("T"," ")} • ${DATA.meta.youtube_file} + ${DATA.meta.revenue_file}`;
  document.getElementById("footer").innerHTML=`Re-extract: <code>py scripts/extract.py</code> • baseline ${DATA.meta.baseline_date} • ${DATA.youtube.pipeline.length} pipeline • ${DATA.youtube.ideas.length} ideas • ${DATA.revenue.campaigns.length} campaigns`;
  renderTabs(); renderKpis(); renderTimeline(); renderPipeline(); renderKpi(); renderSeries(); renderCampaign(); renderOS(); renderIdeas(); renderRebrand();
  handleHash();
}
function renderTabs(){
  const h=location.hash.replace("#","")||"timeline";
  document.getElementById("tabs").innerHTML=S.map(s=>`<button class="tab ${h===s.id?'active':''}" data-go="${s.id}">${s.label}</button>`).join("");
  document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{location.hash=b.dataset.go});
  window.addEventListener("hashchange", handleHash);
}
function handleHash(){
  const h=(location.hash.replace("#","")||"timeline");
  document.querySelectorAll("section").forEach(s=>s.classList.remove("active"));
  const el=document.getElementById("s-"+h); if(el) el.classList.add("active");
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active", b.dataset.go===h));
}
function renderKpis(){
  const b=DATA.youtube.baseline, a=DATA.revenue.assumptions;
  const whPct=pct(b.wh,b.target_wh), subsPct=pct(b.subs,b.target_subs);
  const cards=[
    {label:"Subscriber",val:fmt(b.subs),tgt:`/ ${fmt(b.target_subs)} • ${subsPct}%`,pct:subsPct},
    {label:"Watch Hours (qualified)",val:fmt(b.wh),tgt:`/ ${fmt(b.target_wh)} • ${whPct}%`,pct:whPct},
    {label:"Shorts Views 90d",val:fmt(b.shorts_views),tgt:`/ ${fmt(b.target_shorts)}`,pct:pct(b.shorts_views,b.target_shorts)},
    {label:"Revenue run-rate",val:`Rp ${fmt(a.target_net_per_day)}/hari`,tgt:`AOV ${fmt(a.weighted_aov)} • need ${fmt(a.tx_per_day)}/hari • ${fmt(a.commission*100)}% affiliate`,pct:null},
  ];
  document.getElementById("kpis").innerHTML=cards.map(c=>`<div class="card kpi"><label>${c.label}</label><div class="val">${c.val}</div><div class="tgt">${c.tgt}</div>${c.pct!=null?`<progress max="100" value="${Math.min(c.pct,100)}"></progress>`:``}</div>`).join("");
  // strategy + cadence under
}
function renderTimeline(){
  const yt=DATA.youtube.roadmap, rv=DATA.revenue.roadmap;
  const rvMap=new Map(rv.map(r=>[String(r.week),r]));
  let html=`<h2 class="section-title">90-Day Timeline — YouTube ⟷ Revenue</h2><p class="section-desc">Dual track per minggu, sinkron tanggal. Fase: Repositioning → Double Down → Series Engine</p>`;
  html+=`<div class="table-wrap"><table><thead><tr><th>W</th><th>Tanggal</th><th>Fase</th><th>YouTube Focus</th><th>Revenue Focus</th><th>Net Target</th></tr></thead><tbody>`;
  yt.forEach(r=>{
    const v=rvMap.get(String(r.week))||{};
    html+=`<tr><td><b>W${fmt(r.week)}</b></td><td style="white-space:nowrap">${r.start} → ${r.end}</td><td>${faseDot(r.fase)}${faseBadge(r.fase)}</td><td><b>${r.focus}</b><div class="sub">${r.long1} • ${r.live}</div></td><td><b>${v.focus||"—"}</b><div class="sub">${v.campaign||""}</div></td><td style="white-space:nowrap">${v.net_target?`Rp ${fmt(v.net_target)}`:fmt(r.target_wh)+" WH"}</td></tr>`;
  });
  html+=`</tbody></table></div>`;
  document.getElementById("s-timeline").innerHTML=html;
}
let pipeState={q:"",format:"",pillar:"",priority:"",week:""};
function renderPipeline(){
  const all=DATA.youtube.pipeline;
  const fmts=[...new Set(all.map(r=>r.format))], pillars=[...new Set(all.map(r=>r.pillar))], pris=[...new Set(all.map(r=>r.priority))], weeks=[...new Set(all.map(r=>String(r.week)))].sort((a,b)=>+a-+b);
  let html=`<h2 class="section-title">Content Pipeline — ${all.length} video</h2><p class="section-desc">Filter + search. Klik row untuk lihat hook lengkap.</p>`;
  html+=`<div class="filters"><input id="pq" placeholder="Search title / hook / thumb" style="min-width:220px"><select id="pfmt"><option value="">Format</option>${fmts.map(v=>`<option>${v}</option>`).join("")}</select><select id="ppil"><option value="">Pillar</option>${pillars.map(v=>`<option>${v}</option>`).join("")}</select><select id="ppri"><option value="">Priority</option>${pris.map(v=>`<option>${v}</option>`).join("")}</select><select id="pweek"><option value="">Week</option>${weeks.map(v=>`<option value="${v}">W${v}</option>`).join("")}</select></div>`;
  html+=`<div class="table-wrap"><table><thead><tr><th>ID</th><th>Tgl</th><th>Judul</th><th class="hide-m">Thumb</th><th class="hide-m">Hook</th><th>CTA</th></tr></thead><tbody id="ptbody"></tbody></table></div><div id="pdetail" class="callout" style="display:none"></div>`;
  document.getElementById("s-pipeline").innerHTML=html;
  const apply=()=>{
    const q=pipeState.q.toLowerCase(), f=pipeState.format, pl=pipeState.pillar, pr=pipeState.priority, w=pipeState.week;
    let rows=all.filter(r=>{
      if(f && r.format!==f) return false;
      if(pl && r.pillar!==pl) return false;
      if(pr && r.priority!==pr) return false;
      if(w && String(r.week)!==w) return false;
      if(q && !(`${r.title} ${r.hook} ${r.thumbnail} ${r.next_cta}`.toLowerCase().includes(q))) return false;
      return true;
    });
    document.getElementById("ptbody").innerHTML=rows.map(r=>`<tr data-id="${r.id}" style="cursor:pointer"><td>${badge(r.id)} ${badge(r.format)} ${badge(r.priority,r.priority==="P0"?"p0":"p1")}</td><td style="white-space:nowrap">${r.publish_date} <span class="sub">W${fmt(r.week)} ${r.pillar}</span></td><td><div class="truncate" title="${r.title}">${r.title}</div></td><td class="hide-m">${r.thumbnail}</td><td class="hide-m"><div class="truncate" title="${r.hook}">${r.hook}</div></td><td>${r.next_cta}</td></tr>`).join("") || `<tr><td colspan="6" style="text-align:center;color:var(--muted)">Tidak ada hasil</td></tr>`;
    document.querySelectorAll("#ptbody tr[data-id]").forEach(tr=>tr.onclick=()=>{
      const r=all.find(x=>x.id===tr.dataset.id); const d=document.getElementById("pdetail");
      d.style.display="block"; d.innerHTML=`<b>${r.id} — ${r.title}</b> <span class="sub">${r.format} • ${r.pillar} • ${r.priority} • ${r.publish_date}</span><div style="margin-top:6px"><b>Thumb:</b> ${r.thumbnail} • <b>Hook:</b> ${r.hook}</div><div><b>Next CTA:</b> ${r.next_cta}</div><div class="sub">${r.notes||""} ${r.url?`<a href="${r.url}" target="_blank">link</a>`:""}</div>`;
    });
  };
  document.getElementById("pq").oninput=e=>{pipeState.q=e.target.value; apply()};
  document.getElementById("pfmt").onchange=e=>{pipeState.format=e.target.value; apply()};
  document.getElementById("ppil").onchange=e=>{pipeState.pillar=e.target.value; apply()};
  document.getElementById("ppri").onchange=e=>{pipeState.priority=e.target.value; apply()};
  document.getElementById("pweek").onchange=e=>{pipeState.week=e.target.value; apply()};
  apply();
}
let kpiMode="youtube";
function renderKpi(){
  let html=`<h2 class="section-title">KPI Tracker</h2><div class="kpi-tabs"><button id="kY" class="active">YouTube</button><button id="kR">Revenue</button></div>`;
  html+=`<div id="kpiY"><div class="chart-box"><canvas id="cY" height="120"></canvas></div><div id="kpiYtbl"></div></div>`;
  html+=`<div id="kpiR" style="display:none"><div class="chart-box"><canvas id="cR" height="120"></canvas></div><div id="kpiRtbl"></div></div>`;
  document.getElementById("s-kpi").innerHTML=html;
  document.getElementById("kY").onclick=()=>switchKpi("youtube");
  document.getElementById("kR").onclick=()=>switchKpi("revenue");
  drawKpi();
}
function switchKpi(m){ kpiMode=m; document.getElementById("kY").classList.toggle("active",m==="youtube"); document.getElementById("kR").classList.toggle("active",m==="revenue"); document.getElementById("kpiY").style.display=m==="youtube"?"block":"none"; document.getElementById("kpiR").style.display=m==="revenue"?"block":"none"; }
function drawKpi(){
  const ytK=DATA.youtube.kpi, rvK=DATA.revenue.kpi, ytR=DATA.youtube.roadmap, rvR=DATA.revenue.roadmap;
  // youtube chart: target WH per week vs actual (null)
  const labels=ytR.map(r=>`W${fmt(r.week)}`), targetWH=ytR.map(r=>r.target_wh||0);
  const ytbl=`<div class="table-wrap"><table><thead><tr><th>W</th><th>Start</th><th>WH Target</th><th>Status</th></tr></thead><tbody>${ytR.map(r=>`<tr><td>W${fmt(r.week)}</td><td>${r.start}</td><td>${fmt(r.target_wh)}</td><td>${badge(r.status)}</td></tr>`).join("")}</tbody></table></div>`;
  document.getElementById("kpiYtbl").innerHTML=ytbl;
  const rvLabels=rvR.map(r=>`W${fmt(r.week)}`), netT=rvR.map(r=>r.net_target||0), grossT=rvR.map(r=>r.gross_target||0);
  const rtbl=`<div class="table-wrap"><table><thead><tr><th>W</th><th>Fase</th><th>Net Target</th><th>Gross Target</th><th>Status</th></tr></thead><tbody>${rvR.map(r=>`<tr><td>W${fmt(r.week)}</td><td>${r.fase}</td><td>Rp ${fmt(r.net_target)}</td><td>Rp ${fmt(r.gross_target)}</td><td>${badge(r.status)}</td></tr>`).join("")}</tbody></table></div>`;
  document.getElementById("kpiRtbl").innerHTML=rtbl;
  if(window.Chart){
    try{
      new Chart(document.getElementById("cY"),{type:"bar",data:{labels,datasets:[{label:"WH target / minggu",data:targetWH,backgroundColor:"#f59e0b"}]},options:{responsive:true,plugins:{legend:{display:false}}}});
      new Chart(document.getElementById("cR"),{type:"line",data:{labels:rvLabels,datasets:[{label:"Net target",data:netT,borderColor:"#0ea5e9",tension:.3},{label:"Gross target",data:grossT,borderColor:"#f59e0b",tension:.3}]},options:{responsive:true}});
    }catch(e){ console.warn(e)}
  }
}
function renderSeries(){
  const cls=DATA.youtube.series.filter(c=>c.entry||c.next1), rules=DATA.youtube.funnel_rules;
  let html=`<h2 class="section-title">Series & Funnel — ${cls.length} cluster</h2>`;
  html+=`<div class="grid5">${cls.map(c=>`<div class="card"><b>${c.name}</b> <span class="sub">— ${c.role}</span><div class="chain"><span>▶ ${c.entry||"—"}</span> ${c.next1?`<span>→ ${c.next1}</span>`:""} ${c.next2?`<span>→ ${c.next2}</span>`:""} ${c.next3?`<span>→ ${c.next3}</span>`:""}</div><div class="sub">CTA: ${c.playlist_cta||"—"} • Bridge: ${c.bridge||"—"} • KPI: ${c.kpi||"—"}</div></div>`).join("")}</div>`;
  if(rules.length) html+=`<div style="margin-top:12px">${rules.map(r=>`<div class="callout"><b>${r.type}:</b> ${r.rule}</div>`).join("")}</div>`;
  document.getElementById("s-series").innerHTML=html;
}
function renderCampaign(){
  const camps=DATA.revenue.campaigns, segs=DATA.revenue.segments, sum=DATA.revenue.segment_summary, base=DATA.revenue.segment_baseline;
  let html=`<h2 class="section-title">Campaigns & Segments</h2><p class="section-desc">Hero: ModulAjar/BuatSoal • Unique buyer ${fmt(sum["Unique buyer (estimasi)"]||296)} • Warm pool ${fmt(sum["Warm pool cross-sell"]||272)}</p>`;
  html+=`<div class="table-wrap"><table><thead><tr><th>ID</th><th>W</th><th>Campaign</th><th>Offer</th><th>Harga</th><th>Channel</th><th>KPI</th></tr></thead><tbody>${camps.map(c=>`<tr><td>${badge(c.id)}</td><td>W${fmt(c.week)}</td><td>${c.campaign}</td><td>${c.offer}</td><td>${c.price?`Rp ${fmt(c.price)}`:"—"}</td><td>${badge(c.channel)}</td><td>${c.kpi}</td></tr>`).join("")}</tbody></table></div>`;
  html+=`<h3 style="margin:14px 0 6px">Customer Segments — fastest revenue pool</h3><div class="table-wrap"><table><thead><tr><th>Segment</th><th>Count</th><th>Campaign</th><th>Offer</th><th>Price</th><th>Conv</th><th>Sales</th><th>Gross</th></tr></thead><tbody>${segs.map(s=>`<tr><td>${s.segment}</td><td>${fmt(s.count)}</td><td>${s.campaign}</td><td>${s.offer}</td><td>${s.price?`Rp ${fmt(s.price)}`:"—"}</td><td>${s.target_conv!=null?(s.target_conv*100).toFixed(0)+"%":"—"}</td><td>${fmt(s.target_sales)}</td><td>${s.gross_potential?`Rp ${fmt(Math.round(s.gross_potential))}`:"—"}</td></tr>`).join("")}</tbody></table></div>`;
  document.getElementById("s-campaign").innerHTML=html;
}
function renderOS(){
  const os=DATA.revenue.os, noOverlap=DATA.revenue.no_overlap, align=DATA.revenue.alignment;
  let html=`<h2 class="section-title">Weekly Operating System — tanpa tumpang tindih</h2><p class="section-desc">YouTube LOCKED Selasa/Jumat/Minggu. Revenue Senin/Kamis + repurpose Rabu/Sabtu. 1 asset → multi-channel.</p>`;
  html+=`<div style="display:grid;gap:8px">${os.map(d=>`<div class="swim"><div class="day">${d.day}<div style="font-weight:400;font-size:11px;color:var(--muted)">${d.owner} • ${d.load}</div></div><div class="body"><b>YT:</b> ${d.youtube_plan} <br><b>Revenue:</b> ${d.revenue_action}<br><span class="sub">Repurpose: ${d.repurpose} • Rule: ${d.hard_rule}</span> ${/locked/i.test(d.owner+d.youtube_plan+d.hard_rule)?badge("LOCKED","locked"): /repurpose|shared/i.test(d.owner)?badge("REPURPOSE","active"):badge("ACTIVE","active")}</div></div>`).join("")}</div>`;
  if(noOverlap.length) html+=`<div style="margin-top:12px">${noOverlap.map((r,i)=>`<div class="callout"><b>${i+1}.</b> ${r}</div>`).join("")}</div>`;
  if(align.length) html+=`<div class="table-wrap" style="margin-top:12px"><table><thead><tr><th>Workstream</th><th>Owner</th><th>Cadence</th><th>Jangan</th><th>Status</th></tr></thead><tbody>${align.map(a=>`<tr><td>${a.workstream}</td><td>${a.owner}</td><td>${a.cadence}</td><td>${a.dont}</td><td>${badge(a.status, /locked/i.test(a.status)?"locked":"active")}</td></tr>`).join("")}</tbody></table></div>`;
  document.getElementById("s-os").innerHTML=html;
}
let ideaState={q:"",pillar:"",decision:"",sort:"score",dir:"desc"};
function renderIdeas(){
  const all=DATA.youtube.ideas;
  let html=`<h2 class="section-title">Idea Bank — ${all.length} ideas</h2>`;
  const pillars=[...new Set(all.map(r=>r.pillar))], decisions=[...new Set(all.map(r=>r.decision))];
  html+=`<div class="filters"><input id="iq" placeholder="Search title / keyword / idea" style="min-width:220px"><select id="ipil"><option value="">Pillar</option>${pillars.map(v=>`<option>${v}</option>`).join("")}</select><select id="idec"><option value="">Decision</option>${decisions.map(v=>`<option>${v}</option>`).join("")}</select><select id="isort"><option value="score">Score</option><option value="pillar">Pillar</option><option value="title">Title</option></select><button id="idir" class="tab" style="padding:6px 10px">↓</button></div>`;
  html+=`<div class="table-wrap"><table><thead><tr><th data-sort="title">Title</th><th data-sort="pillar">Pillar</th><th data-sort="score">Score</th><th>Thumb</th><th>Keyword</th><th>Series</th></tr></thead><tbody id="itbody"></tbody></table></div>`;
  document.getElementById("s-ideas").innerHTML=html;
  const apply=()=>{
    let rows=all.filter(r=>{
      if(ideaState.pillar && r.pillar!==ideaState.pillar) return false;
      if(ideaState.decision && r.decision!==ideaState.decision) return false;
      if(ideaState.q && !(`${r.title} ${r.idea} ${r.keyword} ${r.thumbnail}`.toLowerCase().includes(ideaState.q.toLowerCase()))) return false;
      return true;
    });
    rows.sort((a,b)=>{
      const k=ideaState.sort; let av=a[k]||"", bv=b[k]||"";
      if(k==="score"){ av=a.score||0; bv=b.score||0; return ideaState.dir==="desc"?bv-av:av-bv; }
      return ideaState.dir==="desc"? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
    });
    document.getElementById("itbody").innerHTML=rows.map(r=>`<tr><td><div class="truncate" title="${r.title}">${r.title}</div><div class="sub">${r.idea}</div></td><td>${badge(r.pillar)}</td><td>${r.score==10?`<span class="badge" style="background:#fef3c7;border-color:#fde68a">★ ${r.score}</span>`:badge(String(r.score))}</td><td>${r.thumbnail}</td><td class="sub">${r.keyword}</td><td>${r.series_fit}</td></tr>`).join("")||`<tr><td colspan="6" style="text-align:center;color:var(--muted)">Tidak ada hasil</td></tr>`;
  };
  document.getElementById("iq").oninput=e=>{ideaState.q=e.target.value; apply()};
  document.getElementById("ipil").onchange=e=>{ideaState.pillar=e.target.value; apply()};
  document.getElementById("idec").onchange=e=>{ideaState.decision=e.target.value; apply()};
  document.getElementById("isort").onchange=e=>{ideaState.sort=e.target.value; apply()};
  document.getElementById("idir").onclick=e=>{ideaState.dir=ideaState.dir==="desc"?"asc":"desc"; e.target.textContent=ideaState.dir==="desc"?"↓":"↑"; apply()};
  document.querySelectorAll("#s-ideas th[data-sort]").forEach(th=>th.onclick=()=>{ ideaState.sort=th.dataset.sort; ideaState.dir=ideaState.dir==="desc"?"asc":"desc"; apply()});
  apply();
}
function renderRebrand(){
  const all=DATA.youtube.rebrand;
  const key="rebrand:v1"; let checked={}; try{ checked=JSON.parse(localStorage.getItem(key)||"{}")}catch{}
  const doneCount=()=>all.filter(r=>checked[r.area]).length;
  let html=`<h2 class="section-title">Rebrand Checklist</h2><div class="ring"><svg width="80" height="80" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" stroke-width="8"/><circle id="ring" cx="50" cy="50" r="40" fill="none" stroke="var(--accent)" stroke-width="8" stroke-dasharray="251" stroke-dashoffset="251" transform="rotate(-90 50 50)"/></svg><div><div id="ringText" style="font-size:22px;font-weight:700">0/0</div><div class="sub">centang tersimpan di browser</div></div></div>`;
  html+=`<div class="table-wrap" style="margin-top:10px"><table><thead><tr><th>✓</th><th>Area</th><th>Action</th><th>Priority</th><th>Deadline</th><th>Status</th></tr></thead><tbody id="rbody"></tbody></table></div>`;
  document.getElementById("s-rebrand").innerHTML=html;
  const draw=()=>{
    const d=doneCount(), tot=all.length, pct=tot?d/tot:0;
    document.getElementById("ringText").textContent=`${d}/${tot}`;
    const c=document.getElementById("ring"); if(c) c.setAttribute("stroke-dashoffset", String(251*(1-pct)));
    document.getElementById("rbody").innerHTML=all.map(r=>`<tr><td><input type="checkbox" data-area="${r.area}" ${checked[r.area]?"checked":""}></td><td>${r.area}</td><td>${r.action}</td><td>${badge(r.priority, r.priority==="P0"?"p0":r.priority==="P1"?"p1":"")}</td><td>${r.deadline||"—"}</td><td>${badge(r.status, /done/i.test(r.status)?"active":"")}</td></tr>`).join("");
    document.querySelectorAll("#rbody input").forEach(cb=>cb.onchange=e=>{
      const a=e.target.dataset.area; checked[a]=e.target.checked; if(!checked[a]) delete checked[a];
      localStorage.setItem(key, JSON.stringify(checked)); draw();
    });
  };
  draw();
}
load();
