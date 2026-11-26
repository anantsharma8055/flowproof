const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const IC={
grid:'<rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/><rect x="14" y="14" width="7" height="7" rx="1.6"/>',
server:'<rect x="3" y="4" width="18" height="6.5" rx="2"/><rect x="3" y="13.5" width="18" height="6.5" rx="2"/><path d="M7 7.25h.01M7 16.75h.01"/>',
tool:'<path d="M14.7 6.3a4 4 0 0 0-5 5L4 17l3 3 5.7-5.7a4 4 0 0 0 5-5l-2.4 2.4-2.6-.6-.6-2.6z"/>',
flow:'<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="12" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8.2 7.2l7.6 3.6M8.2 16.8l7.6-3.6"/>',
flask:'<path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3"/><path d="M7.5 15h9"/>',
chart:'<path d="M4 20V4M4 20h16"/><path d="M8 15l4-4 3 3 5-6"/>',
diff:'<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M6 8.5v5a3 3 0 0 0 3 3h6.5M13 13.5l2.5 2.5-2.5 2.5"/>',
book:'<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
gear:'<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8"/>',
bell:'<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 21h4"/>',
search:'<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
plus:'<path d="M12 5v14M5 12h14"/>',play:'<path d="M7 4.5v15l12-7.5z"/>',check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',x:'<path d="M6 6l12 12M18 6L6 18"/>',
chev:'<path d="M9 6l6 6-6 6"/>',chevd:'<path d="M6 9l6 6 6-6"/>',
refresh:'<path d="M20 11a8 8 0 0 0-14.5-4M4 4v4h4M4 13a8 8 0 0 0 14.5 4M20 20v-4h-4"/>',
power:'<path d="M12 3v9M6.3 6.8a8 8 0 1 0 11.4 0"/>',
copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
alert:'<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
save:'<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>',
bolt:'<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/>',menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',pulse:'<path d="M3 12h4l2.5-6 4 12 2.5-6H21"/>',
hold:'<rect x="6" y="11" width="12" height="9" rx="2"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/>',
};
const ic=(n,c="")=>`<svg class="ic ${c}" viewBox="0 0 24 24" aria-hidden="true">${IC[n]||""}</svg>`;

const S={servers:[],runs:[],scen:[],cfg:{},diff:null,snap:"",loaded:false,
  range:"all",srvOpen:{},disc:{},tool:"",tf:{q:"",server:"",method:"",perm:"",status:""},rf:{q:"",status:"",range:"all"},
  wf:null,wfNodeSel:null,wfServers:null,wfRun:null,cmp:"all",an:{range:"all",wf:"",server:""},notifOpen:false,trace:{id:null,step:0},
  drafts:[],prompts:{}};
try{S.drafts=JSON.parse(localStorage.getItem("fp_drafts")||"[]");S.prompts=JSON.parse(localStorage.getItem("fp_prompts")||"{}")}catch{}
const save=()=>{try{localStorage.setItem("fp_drafts",JSON.stringify(S.drafts));localStorage.setItem("fp_prompts",JSON.stringify(S.prompts))}catch{}};
/* Static mode (docs/): the same dashboard reading recorded JSON instead of the live API. */
const STATIC=!!window.FP_STATIC, REC={"/api/servers":"servers","/api/runs":"runs","/api/scenarios":"scenarios","/api/config":"config"};
async function j(u,o){
  if(STATIC){
    if(o&&o.method==="POST")throw new Error("This is a recorded demo. Clone the repo to run workflows live");
    const k=u.split("?")[0],f=REC[k]||(k.startsWith("/api/diff/")?"diff":null);
    if(!f)throw new Error("not recorded");
    const r=await fetch("data/"+f+".json");if(!r.ok)throw new Error(r.status+" "+r.statusText);return r.json()}
  const r=await fetch(u,o);if(!r.ok)throw new Error(r.status+" "+r.statusText);return r.json()}

const now=()=>Math.floor(Date.now()/1000);
function ago(t){const d=now()-t;if(d<60)return"just now";if(d<3600)return Math.floor(d/60)+"m ago";if(d<86400)return Math.floor(d/3600)+"h ago";return Math.floor(d/86400)+"d ago"}
const when=t=>new Date(t*1000).toLocaleString([],{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});
const fmtMs=ms=>ms==null?"-":ms>=1000?(ms/1000).toFixed(1)+"s":ms+"ms";
const pct=(a,b)=>b?Math.round(1000*a/b)/10:0;
function toast(msg,kind="ok"){const el=document.createElement("div");el.className="toast "+kind;el.innerHTML=`${ic(kind==="err"?"alert":kind==="info"?"bolt":"check")}<div>${esc(msg)}</div>`;$("#toasts").append(el);setTimeout(()=>{el.style.opacity=0;el.style.transition="opacity .3s";setTimeout(()=>el.remove(),300)},4200)}
function jsonView(v){let s;try{s=JSON.stringify(typeof v==="string"?JSON.parse(v):v,null,2)}catch{return esc(typeof v==="string"?v:JSON.stringify(v))}
  return esc(s).replace(/(&quot;(?:[^&\\]|\\.|&(?!quot;))*&quot;)(\s*:)?|\b(true|false|null)\b|(-?\d+\.?\d*)/g,(m,str,colon,bool,num)=>str?(colon?`<span class="k">${str}</span>${colon}`:`<span class="s">${str}</span>`):bool?`<span class="b">${m}</span>`:`<span class="n">${m}</span>`)}
const md=t=>esc(t).replace(/^#{1,4}\s*(.+)$/gm,'<b>$1</b>').replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/(^|[\s(])\*([^*\n]+)\*/g,'$1<i>$2</i>').replace(/^\s*[*-]\s+/gm,'• ');
const term=(title,v)=>`<div><div class="term-h"><i></i><i></i><i></i><span>${esc(title)}</span></div><pre class="json">${jsonView(v)}</pre></div>`;
const callOk=t=>!(String(t.result||"").startsWith("ERROR")||/"error"\s*:/.test(String(t.result||"")));
const stOf=t=>t.held?"hold":callOk(t)?"ok":"err";
const badge=(k,txt)=>`<span class="badge ${k}"><i></i>${esc(txt)}</span>`;
const allTools=()=>S.servers.flatMap(s=>s.tools.map(t=>({...t,server:s.name})));
const rangeSecs={"24h":86400,"7d":604800,"30d":2592000,all:1e12};
const inRange=(at,r)=>now()-at<=rangeSecs[r];
const baseName=t=>String(t).split("__").pop();
function lastUse(server,tool){const r=S.runs.find(r=>r.trace.some(t=>t.server===server&&baseName(t.tool)===tool));return r?r.at:null}
const wfList=()=>[...S.scen.map(s=>({id:s.id,name:s.id,prompt:S.prompts[s.id]??s.question,status:"Published",scen:true,servers:s.must_use_servers?.length?s.must_use_servers:S.servers.map(x=>x.name),writes:s.writes})),
  ...S.drafts.map(d=>({...d,status:"Draft",scen:false}))];
const latestTraceFor=id=>S.runs.find(r=>r.scenario===id);

function batches(range="all",wf=""){
  const m=new Map();S.runs.filter(r=>inRange(r.at,range)&&(!wf||r.scenario===wf)).forEach(r=>{const b=m.get(r.at)||{at:r.at,p:0,f:0};r.passed?b.p++:b.f++;m.set(r.at,b)});
  return [...m.values()].sort((a,b)=>a.at-b.at)}
function callStats(range="all",wf="",server=""){
  const o={};S.runs.filter(r=>inRange(r.at,range)&&(!wf||r.scenario===wf)).forEach(r=>r.trace.forEach(t=>{if(server&&t.server!==server)return;const k=baseName(t.tool);const x=o[k]=o[k]||{n:0,ok:0,ms:[],server:t.server};x.n++;if(callOk(t))x.ok++;if(t.ms!=null)x.ms.push(t.ms)}));return o}
function srvStats(name){let n=0,ok=0;S.runs.forEach(r=>r.trace.forEach(t=>{if(t.server===name){n++;if(callOk(t))ok++}}));return{n,ok,rate:n?pct(ok,n):null}}
function activity(){
  const a=[];
  S.servers.forEach(s=>a.push({at:s.checked_at,k:"ok",i:"server",t:`${s.name} MCP server connected`,d:`${s.tools.length} tools exposed · ${s.ping_ms}ms round trip`}));
  S.runs.slice(0,40).forEach(r=>a.push({at:r.at,k:r.passed?"ok":"err",i:r.passed?"check":"alert",t:r.passed?`Workflow ${r.scenario} completed`:`Regression test failed: ${r.scenario}`,d:r.passed?`${r.trace.length} tool calls`:Object.entries(r.verdict||{}).filter(([k,v])=>v&&v.ok===false).map(([k,v])=>k+": "+v.detail).join(" · ").slice(0,110)}));
  if(S.diff){S.diff.added.forEach(t=>a.push({at:S.diff._at,k:"acc",i:"plus",t:`New API endpoint discovered: ${baseName(t)}`,d:`since snapshot ${S.snap}`}));
    S.diff.changed.forEach(t=>a.push({at:S.diff._at,k:"amb",i:"diff",t:`Tool schema changed: ${baseName(t)}`,d:`since snapshot ${S.snap}`}))}
  return a.sort((x,y)=>y.at-x.at)}
function latestBoard(){const m={};[...S.runs].reverse().forEach(r=>{m[r.scenario]=r});return Object.values(m)}
function issues(){const crit=latestBoard().filter(r=>!r.passed&&S.scen.some(s=>s.id===r.scenario)).length;const warn=S.diff?Object.keys(S.diff.lint).length:0;return{crit,warn}}

const CH={};
function lineChart(id,labels,series,{h=220,fmt=v=>v,max}={}){
  const W=640,H=h,L=40,R=12,T=12,B=26,n=labels.length;
  if(!n)return`<div class="empty"><div class="ico">${ic("chart")}</div><div><b>No data in this range</b></div></div>`;
  const top=max||Math.max(1,...series.flatMap(s=>s.v));const x=i=>n===1?(L+W-R)/2:L+i*(W-L-R)/(n-1),y=v=>T+(H-T-B)*(1-v/top);
  const grid=[0,.25,.5,.75,1].map(g=>`<line x1="${L}" x2="${W-R}" y1="${y(top*g)}" y2="${y(top*g)}" stroke="#2a2c24"/><text x="${L-8}" y="${y(top*g)+4}" text-anchor="end">${fmt(Math.round(top*g*10)/10)}</text>`).join("");
  const step=Math.ceil(n/6);const xl=labels.map((l,i)=>i%step===0?`<text x="${x(i)}" y="${H-6}" text-anchor="middle">${esc(l)}</text>`:"").join("");
  const lines=series.map(s=>`<path d="${s.v.map((v,i)=>(i?"L":"M")+x(i).toFixed(1)+" "+y(v).toFixed(1)).join(" ")}" fill="none" stroke="${s.c}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>${s.v.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="3" fill="#1d1f19" stroke="${s.c}" stroke-width="1.8"/>`).join("")}`).join("");
  CH[id]={labels,series,x:[...Array(n)].map((_,i)=>x(i)),W,fmt};
  return`<div class="chart" id="${id}"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Line chart">${grid}${xl}<line class="guide" y1="${T}" y2="${H-B}" stroke="#4a4d40" stroke-dasharray="3 3" opacity="0"/>${lines}</svg><div class="tip"></div></div>`}
document.addEventListener("mousemove",e=>{const c=e.target.closest&&e.target.closest(".chart");if(!c||!CH[c.id])return;const d=CH[c.id],svg=c.querySelector("svg"),r=svg.getBoundingClientRect(),px=(e.clientX-r.left)/r.width*d.W;let bi=0;d.x.forEach((v,i)=>{if(Math.abs(v-px)<Math.abs(d.x[bi]-px))bi=i});
  const g=c.querySelector(".guide");g.setAttribute("x1",d.x[bi]);g.setAttribute("x2",d.x[bi]);g.setAttribute("opacity",1);
  const tip=c.querySelector(".tip");tip.innerHTML=`<div class="mut" style="margin-bottom:4px">${esc(d.labels[bi])}</div>`+d.series.map(s=>`<div><i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${s.c};margin-right:7px"></i>${esc(s.n)}: <b>${d.fmt(s.v[bi])}</b></div>`).join("");
  tip.style.opacity=1;const left=d.x[bi]/d.W*r.width;tip.style.left=Math.max(0,Math.min(left+12,r.width-tip.offsetWidth-4))+"px";tip.style.top="8px"});
document.addEventListener("mouseout",e=>{const c=e.target.closest&&e.target.closest(".chart");if(c&&!c.contains(e.relatedTarget)){c.querySelector(".tip").style.opacity=0;c.querySelector(".guide").setAttribute("opacity",0)}});
const bars=(rows,color="var(--acc)",fmt=v=>v)=>rows.length?rows.map(r=>`<div class="bar-row"><span class="mono" title="${esc(r.l)}" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.l)}</span><div class="track"><b style="width:${r.p}%;background:${r.c||color}"></b></div><span class="mono mut" style="text-align:right">${fmt(r.v)}</span></div>`).join(""):`<div class="empty"><div class="ico">${ic("chart")}</div><div><b>No data yet</b></div></div>`;

const NAV=[["overview","Overview","grid"],["servers","MCP Servers","server"],["tools","Tool Registry","tool"],["studio","Workflow Studio","flow"],["runs","Test Runs","flask"],["analytics","Analytics","chart"],["changes","Change Detection","diff"]];
function route(){const h=location.hash.replace(/^#\//,"")||"overview";const [p,...rest]=h.split("/");return p==="runs"&&rest.length?{page:"trace",id:decodeURIComponent(rest.join("/"))}:{page:p}}
function renderNav(){const r=route().page==="trace"?"runs":route().page;
  $("#nav").innerHTML=`<div class="nav-label">MAIN</div>`+NAV.map(([k,l,i])=>`<a href="#/${k}" class="${r===k?"on":""}">${ic(i)}<span>${l}</span>${k==="servers"&&S.loaded?`<span class="count">${S.servers.length}</span>`:k==="runs"&&S.loaded?`<span class="count">${S.runs.length}</span>`:""}</a>`).join("");
  $("#nav2").innerHTML=`<div class="nav-label">BOTTOM</div><a href="https://github.com/anantsharma8055/flowproof#readme" target="_blank" rel="noopener">${ic("book")}<span>Documentation</span></a><a href="#/settings" class="${r==="settings"?"on":""}">${ic("gear")}<span>Settings</span></a>`}
function header(title,sub,extra=""){
  return`<div class="top"><button class="iconbtn menu-btn" data-act="menu" aria-label="Open menu">${ic("menu")}</button><div class="grow"><h1>${title}</h1><p>${sub}</p></div>${extra}</div>`}
function topControls(){
  const ev=activity().slice(0,6);
  return`<select aria-label="Project"><option>IT Operations</option></select><select aria-label="Environment"><option>Development</option><option disabled>Staging (not configured)</option></select>
  <select aria-label="Date range" data-act="range">${[["all","All time"],["24h","Last 24 hours"],["7d","Last 7 days"],["30d","Last 30 days"]].map(([v,l])=>`<option value="${v}" ${S.range===v?"selected":""}>${l}</option>`).join("")}</select>
  <div class="rel"><button class="iconbtn" data-act="notif" aria-label="Notifications">${ic("bell")}${ev.length?'<span class="dot"></span>':""}</button>${S.notifOpen?`<div class="pop"><div style="padding:12px 14px;border-bottom:1px solid var(--line);font-weight:600">Notifications</div>${ev.map(a=>`<div class="it"><span class="ico" style="width:28px;height:28px;color:var(--${a.k==="err"?"err":a.k==="amb"?"amb":a.k==="acc"?"acc":"ok"})">${ic(a.i,"sm")}</span><div><div style="font-size:13px">${esc(a.t)}</div><div class="sm2">${ago(a.at)}</div></div></div>`).join("")||'<div class="empty">All caught up</div>'}</div>`:""}</div>
  <button class="btn pri" data-act="newwf">${ic("plus","sm")} New Workflow</button>`}

function skeleton(){return`<div class="page"><div class="grid g4">${[1,2,3,4].map(()=>'<div class="sk" style="height:112px"></div>').join("")}</div><div class="sk" style="height:200px"></div><div class="sk" style="height:300px"></div></div>`}

function vOverview(){
  const rr=S.runs.filter(r=>inRange(r.at,S.range)), pass=rr.filter(r=>r.passed).length, rate=pct(pass,rr.length);
  const half=Math.floor(rr.length/2), recent=rr.slice(0,half), older=rr.slice(half), tr=recent.length&&older.length?pct(recent.filter(r=>r.passed).length,recent.length)-pct(older.filter(r=>r.passed).length,older.length):0;
  const is=issues(), wfs=wfList(), online=S.servers.filter(s=>!S.disc[s.name]).length;
  const kpi=(href,ico,label,val,sub)=>`<a class="card kpi" href="#/${href}" style="text-decoration:none;color:inherit"><div class="top-row"><span>${label}</span><span class="ico">${ic(ico)}</span></div><div class="v">${val}</div><div class="s">${sub}</div></a>`;
  const b=batches(S.range);
  return header("Overview","Monitor your AI workflows and MCP infrastructure.",topControls())+`<div class="page">
  <div class="grid g4">
    ${kpi("servers","server","MCP Servers",`${online} / ${S.servers.length}`,online===S.servers.length?badge("ok","All connected"):badge("amb",`${S.servers.length-online} disconnected`))}
    ${kpi("studio","flow","Total Workflows",wfs.length,`<span>${wfs.filter(w=>w.status==="Published").length} published and ${S.drafts.length} drafts</span>`)}
    ${kpi("runs","pulse","Workflow Success Rate",rr.length?rate+"%":"-",rr.length?`<span class="trend ${tr>=0?"ok":"err"}">${tr>=0?"▲":"▼"} ${Math.abs(Math.round(tr))} pts</span><span>vs earlier · ${rr.length} runs</span>`:"No runs in range")}
    ${kpi("changes","alert","Issues Detected",is.crit+is.warn,`<span>${is.crit} critical, ${is.warn} warning</span>`)}
  </div>
  <div><div class="card-h" style="margin-bottom:10px"><h3>MCP infrastructure</h3><a class="lnk" href="#/servers">Manage servers</a></div>
    <div class="grid g2">${S.servers.map(s=>srvCard(s)).join("")}</div></div>
  <div class="grid g-main">
    <div class="card"><div class="card-h"><div><h3>Workflow performance</h3><div class="sub">Passed and failed runs, grouped by test batch</div></div><div class="legend"><span><i style="background:var(--ok)"></i>Passed</span><span><i style="background:var(--err)"></i>Failed</span></div></div>
      ${lineChart("c-over",b.map(x=>when(x.at)),[{n:"Passed",c:"#70b77e",v:b.map(x=>x.p)},{n:"Failed",c:"#e16b63",v:b.map(x=>x.f)}])}</div>
    <div class="card"><div class="card-h"><h3>Recent executions</h3><a class="lnk" href="#/runs">All runs</a></div>
      ${S.runs.slice(0,6).map(r=>`<a href="#/runs/${encodeURIComponent(r.id)}" style="display:grid;grid-template-columns:1fr auto;gap:4px 10px;padding:10px 0;border-bottom:1px solid var(--line);text-decoration:none;color:inherit"><span class="name">${esc(r.scenario)}</span>${badge(r.passed?"ok":"err",r.passed?"Passed":"Failed")}<span class="sm2">${ago(r.at)} · ${fmtMs(r.ms)}</span><span class="sm2" style="text-align:right">${r.trace.length} tools</span></a>`).join("")||`<div class="empty"><div class="ico">${ic("flask")}</div><div><b>No executions yet</b></div></div>`}</div>
  </div>
  <div class="card"><div class="card-h"><h3>Recent activity</h3></div><div class="feed">${activity().slice(0,8).map(a=>`<div class="it"><span class="ico ${a.k}">${ic(a.i,"sm")}</span><div><div>${esc(a.t)}</div><div class="sm2">${esc(a.d)}</div></div><span class="sm2">${ago(a.at)}</span></div>`).join("")}</div></div>
  </div>`}

function srvCard(s,full=false){
  const off=S.disc[s.name], st=srvStats(s.name), open=S.srvOpen[s.name];
  const w=s.tools.filter(t=>t.write).length;
  const lastCall=S.runs.flatMap(r=>r.trace.map(t=>({...t,at:t.at||r.at}))).filter(t=>t.server===s.name&&callOk(t)).sort((a,b)=>b.at-a.at)[0];
  return`<div class="card srv ${off?"disc":""}"><div class="head"><span class="ico">${ic("server")}</span><div><h3>${esc(s.name)} MCP</h3><div class="sm2 mono">${esc(s.url)}</div></div><span style="margin-left:auto">${off?badge("err","Disconnected"):badge("ok","Connected")}</span></div>
  <div class="stats"><div><small>Tools</small><b>${s.tools.length}</b></div><div><small>Latency (live ping)</small><b>${off?"-":s.ping_ms+"ms"}</b></div><div><small>Call success</small><b>${st.rate==null?"-":st.rate+"%"}</b></div><div><small>Last checked</small><b>${ago(s.checked_at)}</b></div></div>
  <div class="actions"><button class="btn sm" data-act="viewtools" data-s="${esc(s.name)}">${ic("tool","sm")} View Tools</button><button class="btn sm" data-act="health" data-s="${esc(s.name)}">${ic("pulse","sm")} Health Check</button>
  ${full?`<button class="btn sm" data-act="toggle" data-s="${esc(s.name)}">${ic(open?"chevd":"chev","sm")} ${open?"Hide":"Show"} details</button><button class="btn sm" data-act="refresh">${ic("refresh","sm")} Refresh</button>${off?`<button class="btn sm pri" data-act="reconnect" data-s="${esc(s.name)}">${ic("power","sm")} Reconnect</button>`:`<button class="btn sm danger" data-act="disconnect" data-s="${esc(s.name)}">${ic("power","sm")} Disconnect</button>`}`:""}</div>
  ${full&&open?`<div class="expand"><dl class="kv"><dt>Server URL</dt><dd class="mono">${esc(s.url)}</dd><dt>Connection status</dt><dd>${off?"Disconnected (this session)":"Connected over MCP stdio"}</dd><dt>Permissions</dt><dd>${s.tools.length-w} read · ${w} write (write tools are held for approval)</dd><dt>Last sync</dt><dd>${when(s.checked_at)}</dd><dt>Last successful request</dt><dd>${lastCall?`<span class="mono">${esc(baseName(lastCall.tool))}</span> · ${ago(lastCall.at)}`:"None recorded"}</dd></dl>
  <div><h3 style="margin-bottom:10px">Available tools</h3>${s.tools.map(t=>`<details class="toolrow"><summary><span class="method ${t.method}">${t.method}</span><span class="mono">${esc(t.name)}</span><span class="sm2" style="margin-left:auto">${t.write?"Write":"Read"}</span></summary><div class="body"><div class="mut">${esc(t.description)}</div><div class="sm2">Input schema</div>${term("input_schema.json",t.schema)}</div></details>`).join("")}</div></div>`:""}
  </div>`}

function vServers(){
  return header("MCP Servers","Synapse-generated servers your agents can call.",`<button class="btn" data-act="refresh">${ic("refresh","sm")} Refresh all</button><button class="btn pri" data-act="connect">${ic("plus","sm")} Connect New Server</button>`)+`<div class="page">
  ${S.servers.length?S.servers.map(s=>srvCard(s,true)).join(""):`<div class="card"><div class="empty"><div class="ico">${ic("server")}</div><div><b>No MCP servers connected</b></div><div>Build one with Synapse, add it to servers.json, then refresh.</div><button class="btn pri" data-act="connect">${ic("plus","sm")} Connect New Server</button></div></div>`}</div>`}

function filteredTools(){const f=S.tf;return allTools().filter(t=>(!f.q||(t.name+t.description+t.endpoint).toLowerCase().includes(f.q.toLowerCase()))&&(!f.server||t.server===f.server)&&(!f.method||t.method===f.method)&&(!f.perm||(f.perm==="write")===t.write)&&(f.status!=="deprecated"))}
function toolsTable(){const ts=filteredTools();
  if(!ts.length)return`<div class="empty"><div class="ico">${ic("search")}</div><div><b>${S.tf.status==="deprecated"?"No deprecated tools":"No tools match these filters"}</b></div><button class="btn sm" data-act="clearf">Clear filters</button></div>`;
  return`<div class="scroll"><table class="tbl"><thead><tr><th>Tool</th><th>Server</th><th>Method</th><th>Endpoint</th><th>Permission</th><th>Last used</th><th>Status</th></tr></thead><tbody>${ts.map(t=>`<tr class="click ${S.tool===t.id?"sel":""}" data-act="tool" data-id="${esc(t.id)}"><td><div class="name mono">${esc(t.name)}</div><div class="sm2" style="max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(t.description)}</div></td><td>${esc(t.server)}</td><td><span class="method ${t.method}">${t.method}</span></td><td class="mono mut">${esc(t.endpoint||"-")}</td><td>${t.write?badge("amb","Write"):badge("mu","Read")}</td><td class="mut">${(()=>{const u=lastUse(t.server,t.name);return u?ago(u):"Never"})()}</td><td>${badge("ok","Active")}</td></tr>`).join("")}</tbody></table></div>`}
function vTools(){const f=S.tf,sel=(k,opts,l)=>`<select data-f="${k}" aria-label="${l}"><option value="">${l}</option>${opts.map(([v,t])=>`<option value="${v}" ${f[k]===v?"selected":""}>${t}</option>`).join("")}</select>`;
  return header("Tool Registry","Every tool your agents can discover, with its real schema.",`<button class="btn" data-act="refresh">${ic("refresh","sm")} Refresh</button>`)+`<div class="page"><div class="card"><div class="filters" style="margin-bottom:14px"><div class="search">${ic("search","sm")}<input id="tq" placeholder="Search tools, descriptions, endpoints" value="${esc(f.q)}" aria-label="Search tools"></div>
  ${sel("server",S.servers.map(s=>[s.name,s.name]),"All servers")}${sel("method",[["GET","GET"],["POST","POST"]],"All methods")}${sel("perm",[["read","Read"],["write","Write"]],"Read / Write")}${sel("status",[["active","Active"],["deprecated","Deprecated"]],"Active / Deprecated")}</div>
  <div id="toolsTable">${toolsTable()}</div></div></div>`}
function toolDrawer(){const t=allTools().find(x=>x.id===S.tool);if(!t)return"";
  const hist=S.runs.flatMap(r=>r.trace.filter(c=>c.server===t.server&&baseName(c.tool)===t.name).map(c=>({...c,at:c.at||r.at,rid:r.id}))).slice(0,12);
  return`<div class="scrim" data-act="closed"></div><div class="drawer" role="dialog" aria-label="Tool details"><div class="dh"><div><h2>${esc(t.name)}</h2><div class="sm2" style="margin-top:6px;display:flex;gap:8px;align-items:center"><span class="method ${t.method}">${t.method}</span><span class="mono">${esc(t.endpoint||"-")}</span></div></div><button class="iconbtn" data-act="closed" aria-label="Close">${ic("x")}</button></div>
  <div class="db"><div class="mut">${esc(t.description)}</div><div class="chips">${badge("mu",t.server)}${t.write?badge("amb","Write · approval required"):badge("mu","Read")}${badge("ok","Active")}</div>
  <div><div class="sm2" style="margin-bottom:8px">Input schema</div>${term("input_schema.json",t.schema)}</div>
  <div><div class="sm2" style="margin-bottom:8px">Execution history</div>${hist.length?`<table class="tbl"><thead><tr><th>When</th><th>Arguments</th><th>Latency</th><th></th></tr></thead><tbody>${hist.map(h=>`<tr class="click" data-nav="#/runs/${encodeURIComponent(h.rid)}"><td class="mut">${ago(h.at)}</td><td class="mono" style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(JSON.stringify(h.args))}</td><td class="mono">${fmtMs(h.ms)}</td><td>${badge(stOf(h)==="ok"?"ok":stOf(h)==="hold"?"amb":"err",stOf(h)==="ok"?"OK":stOf(h)==="hold"?"Held":"Error")}</td></tr>`).join("")}</tbody></table>`:`<div class="empty" style="padding:24px"><div>This tool hasn't been called yet.</div></div>`}</div></div></div>`}

function plannedSteps(w){
  const r=latestTraceFor(w.id); const tr=r?(r.trace||[]):[];
  const steps=[];tr.forEach(t=>{if(t.server==="?")return;const k=t.server+"/"+baseName(t.tool);const last=steps[steps.length-1];if(!last||last.k!==k)steps.push({k,tool:baseName(t.tool),server:t.server,write:t.is_write,args:t.args,held:t.held,calls:1,ms:t.ms,ok:callOk(t)});else last.calls++});
  if(!steps.length&&w.scen){const sc=S.scen.find(s=>s.id===w.id);(sc?.expect_tools||[]).forEach(e=>{const t=allTools().find(x=>x.name.includes(e));if(t)steps.push({k:t.server+"/"+t.name,tool:t.name,server:t.server,write:t.write,args:{},calls:0})})}
  return steps}
function vStudio(){
  const wfs=wfList(); if(!S.wf||!wfs.find(w=>w.id===S.wf))S.wf=wfs[0]?.id; const w=wfs.find(x=>x.id===S.wf);
  if(!w)return header("Workflow Studio","Design and test agent workflows.",`<button class="btn pri" data-act="newwf">${ic("plus","sm")} New Workflow</button>`)+`<div class="page"><div class="card"><div class="empty"><div class="ico">${ic("flow")}</div><div><b>No workflows yet</b></div><button class="btn pri" data-act="newwf">Create one</button></div></div></div>`;
  const steps=plannedSteps(w), run=S.wfRun&&S.wfRun.id===w.id?S.wfRun:null, sel=S.wfNodeSel;
  const sts=i=>run?(run.status[i]||"idle"):"idle";
  const cls=s=>({idle:"",run:"run",ok:"ok",err:"err",hold:"hold"}[s]||"");
  const node=(i,t)=>`<button class="node ${sel===i?"sel":""}" data-act="node" data-i="${i}"><div class="nt"><span class="ico">${ic(t.write?"hold":"tool","sm")}</span><span class="sm2">${t.write?"Write step":"Tool step"}</span></div><div class="nn">${esc(t.tool)}</div><div class="sm2" style="margin-top:4px">${esc(t.server)} MCP</div><div class="ns"><span><span class="st ${cls(sts(i))}"></span> ${({idle:"Not run",run:"Running",ok:"Success",err:"Failed",hold:"Held"})[sts(i)]||"Not run"}</span><span title="Configuration">${ic("gear","sm")}</span></div></button>`;
  const fixed=(label,ico,state)=>`<div class="node" style="width:130px"><div class="nt"><span class="ico">${ic(ico,"sm")}</span><span class="sm2">${label}</span></div><div class="ns" style="margin-top:6px"><span><span class="st ${state}"></span> ${state==="ok"?"Done":state==="run"?"Running":state==="err"?"Failed":"Ready"}</span></div></div>`;
  const endS=run&&run.final?(run.final.passed===false?"err":"ok"):run&&run.running?"run":"";
  const flow=[fixed("Start","play",run&&run.started?"ok":""),...steps.map((s,i)=>node(i,s)),fixed("Validate response","check",endS)];
  const html=flow.map((n,i)=>(i?`<div class="conn ${run&&(i===1||sts(i-2)==="ok"||sts(i-2)==="hold")?"live":""}"></div>`:"")+n).join("");
  const selStep=sel!=null?steps[sel]:null, selTool=selStep&&allTools().find(t=>t.server===selStep.server&&t.name===selStep.tool);
  return header("Workflow Studio","Describe a workflow, pick servers, and test how reliably the agent completes it.",`<button class="btn" data-act="newwf">${ic("plus","sm")} New</button>`)+`<div class="page">
  <div class="card" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><select data-act="pickwf" aria-label="Workflow" style="min-width:220px;font-weight:500">${wfs.map(x=>`<option value="${esc(x.id)}" ${x.id===w.id?"selected":""}>${esc(x.name)}</option>`).join("")}</select>${badge(w.status==="Published"?"ok":"amb",w.status)}<span class="sm2">${steps.length} steps · ${(S.wfServers||w.servers).length} servers</span><span style="margin-left:auto" class="actions"><button class="btn" data-act="savewf">${ic("save","sm")} Save</button><button class="btn pri" data-act="runwf" ${run&&run.running?"disabled":""}>${run&&run.running?'<span class="spin"></span> Running':ic("play","sm")+" Run Test"}</button></span></div>
  <div class="studio"><div style="display:grid;gap:16px;min-width:0">
    <div class="card"><div class="field"><label for="wfp">Workflow prompt (natural language)</label><textarea id="wfp" rows="3">${esc(S.prompts[w.id]??w.prompt)}</textarea></div>
    <div style="margin-top:14px"><div class="sm2" style="margin-bottom:8px">MCP servers available to the agent</div><div class="chips">${S.servers.map(s=>{const on=(S.wfServers||w.servers).includes(s.name);return`<button class="chip ${on?"on":""}" data-act="srvchip" data-s="${esc(s.name)}" aria-pressed="${on}">${on?ic("check","sm"):""}${esc(s.name)}</button>`}).join("")}</div></div></div>
    <div class="canvas" aria-label="Workflow canvas">${steps.length?`<div class="flow">${html}</div>`:`<div class="empty"><div class="ico">${ic("flow")}</div><div><b>No steps yet</b></div><div>Run a test and FlowProof will draw the tool calls the agent actually made.</div></div>`}</div>
    ${run&&run.final?reportCard(run):""}
  </div>
  <div class="card" style="position:sticky;top:16px"><h3>${selStep?"Step configuration":"Configuration"}</h3>${selStep?`<div style="display:grid;gap:14px;margin-top:14px">
    <div><div class="sm2">Tool</div><div class="mono">${esc(selStep.tool)}</div></div><div><div class="sm2">Server</div>${esc(selStep.server)} MCP</div>
    ${selTool?`<div><div class="sm2">Description</div><div class="mut">${esc(selTool.description)}</div></div>`:""}
    <div><div class="sm2" style="margin-bottom:6px">Arguments used</div><pre class="json" style="max-height:140px">${jsonView(selStep.args||{})}</pre></div>
    <label class="chip" style="justify-content:space-between"><span>Require approval</span><input type="checkbox" ${selStep.write?"checked disabled":""} aria-label="Require approval"></label>
    <div class="field"><label for="to">Timeout (seconds)</label><input id="to" type="number" value="30"></div><div class="field"><label for="rt">Retries</label><select id="rt"><option>0</option><option selected>1</option><option>2</option></select></div>
    <div class="sm2">Timeout and retry apply to this editor only; the runner uses its own defaults.</div></div>`:`<div class="empty" style="padding:30px 10px"><div class="ico">${ic("gear")}</div><div>Select a step on the canvas to configure it.</div></div>`}</div></div></div>`}
function reportCard(run){const f=run.final;const v=f.verdict;
  return`<div class="card report"><div class="card-h" style="margin:0"><div><h3>Test report</h3><div class="sub">${f.error?"Run failed":v?"Graded against ground truth":"Free-form workflow: no expected result defined, so this run is not graded."}</div></div>${f.error?badge("err","Error"):v?badge(f.passed?"ok":"err",f.passed?"Passed":"Failed"):badge("mu","Ungraded")}</div>
  ${f.error?`<div class="err">${esc(f.error)}</div>`:""}
  ${v?["answer","trajectory","safety"].filter(k=>v[k]).map(k=>`<div class="vrow"><span class="${v[k].ok?"ok":"err"}">${ic(v[k].ok?"check":"x","sm")}</span><b>${{answer:"Answer",trajectory:"Tools used",safety:"Safety"}[k]}</b><span class="mut">${esc(v[k].detail)}</span></div>`).join(""):""}
  <div><div class="sm2" style="margin-bottom:6px">Agent answer</div><div style="white-space:pre-wrap;max-width:76ch">${md(f.answer||"(no answer)")}</div></div>
  ${f.rid?`<a class="lnk" href="#/runs/${encodeURIComponent(f.rid)}">Open full execution trace</a>`:""}</div>`}

async function runWorkflow(){
  const w=wfList().find(x=>x.id===S.wf); const prompt=($("#wfp")||{}).value||w.prompt; S.prompts[w.id]=prompt; save();
  const before=plannedSteps(w).length;
  S.wfRun={id:w.id,running:true,started:true,status:{},final:null}; if(before)S.wfRun.status[0]="run"; render();
  try{
    const sc=S.scen.find(s=>s.id===w.id);
    const r=sc&&prompt===sc.question?await j(`/api/run/${w.id}`,{method:"POST"}):await j(`/api/ask?question=${encodeURIComponent(prompt)}`,{method:"POST"});
    const real={id:`live-${now()}-${w.id}`,scenario:w.id,at:now(),passed:r.verdict?!!r.verdict.passed:!r.error,verdict:r.verdict||{},trace:r.trace||[],answer:r.answer||"",error:r.error||"",servers:[...new Set((r.trace||[]).filter(t=>t.server!=="?").map(t=>t.server))],ms:(r.trace||[]).reduce((a,t)=>a+(t.ms||0),0)||null};
    S.runs.unshift(real); const ns=plannedSteps(w);S.wfRun.status={};
    for(let i=0;i<ns.length;i++){S.wfRun.status[i]="run";render();await new Promise(r=>setTimeout(r,380));S.wfRun.status[i]=ns[i].held?"hold":ns[i].ok===false?"err":"ok"}
    S.wfRun.running=false;S.wfRun.final={passed:real.passed,verdict:r.verdict,answer:r.answer,error:r.error,rid:real.id};
    toast(r.error?"Run finished with an error":real.passed?`${w.name} passed`:`${w.name} failed`,real.passed&&!r.error?"ok":"err");
  }catch(e){S.wfRun.running=false;S.wfRun.final={error:e.message,passed:false};toast("Run failed: "+e.message,"err")}
  render()}

function filteredRuns(){const f=S.rf;return S.runs.filter(r=>(!f.q||(r.scenario+r.id).toLowerCase().includes(f.q.toLowerCase()))&&(!f.status||(f.status==="passed")===r.passed)&&inRange(r.at,f.range))}
function runsTable(){const rs=filteredRuns();if(!rs.length)return`<div class="empty"><div class="ico">${ic("flask")}</div><div><b>No test runs match</b></div><button class="btn sm" data-act="clearr">Clear filters</button></div>`;
  return`<div class="scroll"><table class="tbl"><thead><tr><th>Test ID</th><th>Workflow</th><th>Servers</th><th>Status</th><th>Duration</th><th>Timestamp</th><th></th></tr></thead><tbody>${rs.slice(0,60).map(r=>`<tr class="click" data-nav="#/runs/${encodeURIComponent(r.id)}"><td class="mono">${esc(r.id.length>26?r.id.slice(0,24)+"…":r.id)}</td><td class="name">${esc(r.scenario)}</td><td>${r.servers.map(s=>`<span class="badge mu" style="margin-right:4px">${esc(s)}</span>`).join("")||'<span class="mut">-</span>'}</td><td>${badge(r.passed?"ok":"err",r.passed?"Passed":"Failed")}</td><td class="mono">${fmtMs(r.ms)}</td><td class="mut">${when(r.at)}</td><td><span class="lnk">View Trace</span></td></tr>`).join("")}</tbody></table></div>`}
function vRuns(){const rs=S.runs.filter(r=>inRange(r.at,S.rf.range)),p=rs.filter(r=>r.passed).length,ms=rs.map(r=>r.ms).filter(Boolean),avg=ms.length?Math.round(ms.reduce((a,b)=>a+b,0)/ms.length):null;
  const k=(l,v,c="")=>`<div class="card"><div class="mut">${l}</div><div style="font:600 24px/1.1 var(--sans);margin-top:10px" class="${c}">${v}</div></div>`;
  return header("Test Runs","Every agent run, graded against ground truth.",`<button class="btn pri" data-act="goto" data-to="#/studio">${ic("play","sm")} Run a workflow</button>`)+`<div class="page"><div class="grid g4">${k("Total test runs",rs.length)}${k("Passed",p,"ok")}${k("Failed",rs.length-p,rs.length-p?"err":"")}${k("Average execution time",fmtMs(avg))}</div>
  <div class="card"><div class="filters" style="margin-bottom:14px"><div class="search">${ic("search","sm")}<input id="rq" placeholder="Search by workflow or test id" value="${esc(S.rf.q)}" aria-label="Search runs"></div>
  <select data-rf="status" aria-label="Status"><option value="">All statuses</option><option value="passed" ${S.rf.status==="passed"?"selected":""}>Passed</option><option value="failed" ${S.rf.status==="failed"?"selected":""}>Failed</option></select>
  <select data-rf="range" aria-label="Date">${[["all","All time"],["24h","Last 24 hours"],["7d","Last 7 days"],["30d","Last 30 days"]].map(([v,l])=>`<option value="${v}" ${S.rf.range===v?"selected":""}>${l}</option>`).join("")}</select></div><div id="runsTable">${runsTable()}</div></div></div>`}

function vTrace(id){const r=S.runs.find(x=>x.id===id);
  if(!r)return header("Execution trace","")+`<div class="page"><div class="card"><div class="empty"><div class="ico">${ic("alert")}</div><div><b>Run not found</b></div><a class="lnk" href="#/runs">Back to test runs</a></div></div></div>`;
  if(S.trace.id!==id)S.trace={id,step:0};
  const steps=[{kind:"start"},...r.trace.map((t,i)=>({kind:"call",t,i})),{kind:"end"}], si=Math.min(S.trace.step,steps.length-1), cur=steps[si];
  const rail=(s,i)=>{const last=i===steps.length-1;const k=s.kind==="call"?stOf(s.t):s.kind==="end"?(r.passed?"ok":"err"):"ok";const ico=s.kind==="start"?"play":s.kind==="end"?(r.passed?"check":"x"):k==="hold"?"hold":k==="ok"?"check":"x";
    const title=s.kind==="start"?"Agent Started":s.kind==="end"?"Response Validation":baseName(s.t.tool);
    const sub=s.kind==="start"?esc(r.scenario):s.kind==="end"?(r.passed?"All expected conditions passed.":"One or more conditions failed."):`${esc(s.t.server)} MCP · ${s.t.ms!=null&&!s.t.held?fmtMs(s.t.ms)+" · ":""}${k==="ok"?"Success":k==="hold"?"Held for approval":"Error"}`;
    return`<button class="step ${i===si?"sel":""}" data-act="step" data-i="${i}"><div class="rail"><b class="${k}">${ic(ico,"sm")}</b>${last?"":"<u></u>"}</div><div class="sb"><div class="${s.kind==="call"?"mono":""}" style="font-weight:500">${esc(title)}</div><div class="sm2">${sub}</div></div></button>`};
  let det="";
  if(cur.kind==="call"){const t=cur.t,k=stOf(t);det=`<div class="card" style="display:grid;gap:16px"><div class="card-h" style="margin:0"><div><h3 class="mono">${esc(baseName(t.tool))}</h3><div class="sub">Step ${si} of ${r.trace.length}</div></div>${badge(k==="ok"?"ok":k==="hold"?"amb":"err",k==="ok"?"Success":k==="hold"?"Held":"Error")}</div>
    <dl class="kv"><dt>Server</dt><dd>${esc(t.server)} MCP</dd><dt>Latency</dt><dd class="mono">${t.held?"not executed":fmtMs(t.ms)}</dd><dt>Timestamp</dt><dd>${when(t.at||r.at)}</dd><dt>Type</dt><dd>${t.is_write?"Write":"Read"}</dd></dl>
    ${term("arguments.json",t.args)}${term(k==="err"?"error":"response.json",t.result)}${t.held?`<div class="amb">This write was held by the approval gate and never executed.</div>`:""}</div>`}
  else if(cur.kind==="start")det=`<div class="card" style="display:grid;gap:14px"><h3>Agent started</h3><div><div class="sm2">Task</div><div>${esc((S.scen.find(s=>s.id===r.scenario)||{}).question||r.scenario)}</div></div><dl class="kv"><dt>Servers</dt><dd>${esc(r.servers.join(", ")||"-")}</dd><dt>Started</dt><dd>${when(r.at)}</dd><dt>Tool calls</dt><dd>${r.trace.length}</dd></dl></div>`;
  else{const v=r.verdict||{};det=`<div class="card" style="display:grid;gap:14px"><div class="card-h" style="margin:0"><h3>Response validation</h3>${badge(r.passed?"ok":"err",r.passed?"Passed":"Failed")}</div>${["answer","trajectory","safety"].filter(k=>v[k]).map(k=>`<div class="vrow"><span class="${v[k].ok?"ok":"err"}">${ic(v[k].ok?"check":"x","sm")}</span><b>${{answer:"Answer",trajectory:"Tools used",safety:"Safety"}[k]}</b><span class="mut">${esc(v[k].detail)}</span></div>`).join("")||'<div class="mut">This free-form run has no expectations to validate.</div>'}<div><div class="sm2" style="margin-bottom:6px">Agent answer</div><div style="white-space:pre-wrap">${md(r.answer||"(no answer)")}</div></div>${r.error?`<div class="err">${esc(r.error)}</div>`:""}</div>`}
  return header(`<div class="crumb"><a href="#/runs">Test Runs</a>${ic("chev","sm")}<span style="color:var(--tx)">${esc(r.scenario)}</span></div>`,`${esc(r.id)} · ${when(r.at)}`,`${badge(r.passed?"ok":"err",r.passed?"Passed":"Failed")}<button class="btn" data-act="goto" data-to="#/studio" data-wf="${esc(r.scenario)}">${ic("flow","sm")} Open in Studio</button>`)+`<div class="page"><div class="trace"><div class="card"><h3 style="margin-bottom:16px">Execution timeline</h3><div class="tl">${steps.map(rail).join("")}</div></div><div style="position:sticky;top:16px">${det}</div></div></div>`}

function vAnalytics(){const a=S.an,b=batches(a.range,a.wf),cs=callStats(a.range,a.wf,a.server),rs=S.runs.filter(r=>inRange(r.at,a.range)&&(!a.wf||r.scenario===a.wf));
  const usage=Object.entries(cs).sort((x,y)=>y[1].n-x[1].n).slice(0,8),maxU=usage[0]?usage[0][1].n:1;
  const lat=Object.entries(cs).filter(([k,v])=>v.ms.length).map(([k,v])=>({l:k,v:Math.round(v.ms.reduce((x,y)=>x+y,0)/v.ms.length)})).sort((x,y)=>y.v-x.v).slice(0,8),maxL=lat[0]?lat[0].v:1;
  const fails={answer:0,trajectory:0,safety:0};rs.forEach(r=>["answer","trajectory","safety"].forEach(k=>{if(r.verdict&&r.verdict[k]&&r.verdict[k].ok===false)fails[k]++}));const ft=fails.answer+fails.trajectory+fails.safety;
  const sr=S.servers.filter(s=>!a.server||s.name===a.server).map(s=>({s:s.name,...srvStats(s.name)}));
  const seg=[["all","All time"],["24h","24 hours"],["7d","7 days"],["30d","30 days"]].map(([v,l])=>`<button class="${a.range===v?"on":""}" data-an="range" data-v="${v}">${l}</button>`).join("");
  return header("Analytics","Reliability and performance measured from real agent runs.",`<div class="seg">${seg}</div>`)+`<div class="page">
  <div class="filters"><select data-anf="wf" aria-label="Workflow"><option value="">All workflows</option>${S.scen.map(s=>`<option ${a.wf===s.id?"selected":""}>${esc(s.id)}</option>`).join("")}</select><select data-anf="server" aria-label="Server"><option value="">All servers</option>${S.servers.map(s=>`<option ${a.server===s.name?"selected":""}>${esc(s.name)}</option>`).join("")}</select><span class="sm2">${rs.length} runs · ${Object.values(cs).reduce((x,y)=>x+y.n,0)} tool calls</span></div>
  <div class="card"><div class="card-h"><div><h3>Workflow success rate</h3><div class="sub">Share of runs passing, per test batch</div></div></div>${lineChart("c-an",b.map(x=>when(x.at)),[{n:"Success rate",c:"#a3c66b",v:b.map(x=>pct(x.p,x.p+x.f))}],{max:100,fmt:v=>v+"%"})}</div>
  <div class="grid g2"><div class="card"><div class="card-h"><div><h3>Execution latency</h3><div class="sub">Average per tool call</div></div></div>${lat.length?bars(lat.map(x=>({l:x.l,v:x.v,p:100*x.v/maxL,c:"var(--amb)"})),"var(--amb)",fmtMs):`<div class="empty"><div class="ico">${ic("clock")}</div><div><b>No latency recorded yet</b></div><div>Latency is captured on new runs. Run a workflow in Studio to populate this.</div></div>`}</div>
  <div class="card"><div class="card-h"><div><h3>Tool usage frequency</h3><div class="sub">Calls per tool</div></div></div>${bars(usage.map(([k,v])=>({l:k,v:v.n,p:100*v.n/maxU})))}</div>
  <div class="card"><div class="card-h"><div><h3>Failure distribution</h3><div class="sub">Which check failed, across runs</div></div></div>${ft?bars([["answer","Wrong answer"],["trajectory","Wrong tools"],["safety","Safety"]].map(([k,l])=>({l,v:fails[k],p:100*fails[k]/ft,c:"var(--err)"}))):`<div class="empty"><div class="ico">${ic("check")}</div><div><b>No failures in this range</b></div></div>`}</div>
  <div class="card"><div class="card-h"><div><h3>MCP server reliability</h3><div class="sub">Successful tool calls per server</div></div></div>${bars(sr.filter(x=>x.rate!=null).map(x=>({l:x.s,v:x.rate,p:x.rate,c:x.rate>=95?"var(--ok)":"var(--amb)"})),"var(--ok)",v=>v+"%")}</div></div></div>`}

function cmpRows(){const d=S.diff;if(!d)return[];const rows=[];
  allTools().forEach(t=>{const st=d.added.includes(t.id)?"added":d.changed.includes(t.id)?"changed":d.reworded.includes(t.id)?"reworded":"same";rows.push({t,st})});
  d.removed.forEach(id=>rows.push({t:{id,name:baseName(id),server:id.split("__")[0],method:"-",endpoint:"",write:false},st:"removed"}));return rows}
function vChanges(){const d=S.diff,rows=cmpRows();
  const lab={added:["ok","Added"],changed:["amb","Schema modified"],reworded:["mu","Reworded"],removed:["err","Removed"],same:["mu","Unchanged"]};
  const show=rows.filter(r=>S.cmp==="all"||r.st!=="same");
  const breaking=d?d.removed.length+d.became_write.length:0;
  return header("Change Detection","Compare the tool contract before and after a rebuild.",`<select data-act="snap" aria-label="Previous snapshot">${(S.cfg.snapshots||[]).map(x=>`<option ${x===S.snap?"selected":""}>${esc(x)}</option>`).join("")}</select><button class="btn" data-act="refresh">${ic("refresh","sm")} Refresh</button><button class="btn pri" data-act="regress">${ic("play","sm")} Run Regression Tests</button>`)+(!d?`<div class="page">${skeleton()}</div>`:`<div class="page">
  <div class="grid g-main"><div class="card"><div class="card-h"><div><h3>Comparison</h3><div class="sub">Previous: <span class="mono">${esc(S.snap)}</span> → Current: <span class="mono">live servers</span></div></div><div class="seg"><button class="${S.cmp==="all"?"on":""}" data-cmp="all">All tools</button><button class="${S.cmp==="changes"?"on":""}" data-cmp="changes">Changes only</button><button class="${S.cmp==="lint"?"on":""}" data-cmp="lint">Lint</button></div></div>
  ${S.cmp==="lint"?(Object.keys(d.lint).length?`<table class="tbl"><thead><tr><th>Tool</th><th>Finding</th></tr></thead><tbody>${Object.entries(d.lint).map(([k,m])=>`<tr><td class="mono">${esc(k)}</td><td class="amb">${m.map(esc).join(", ")}</td></tr>`).join("")}</tbody></table><div class="sm2" style="margin-top:12px">The description promises parameters that the tool's input schema does not declare, so an agent cannot pass them.</div>`:`<div class="empty"><div class="ico">${ic("check")}</div><div><b>Every tool schema matches its description</b></div></div>`):
  show.length?`<div class="scroll"><table class="tbl"><thead><tr><th>Method</th><th>Endpoint</th><th>Tool</th><th>Change</th></tr></thead><tbody>${show.map(({t,st})=>`<tr class="diffrow ${st}"><td><span class="method ${t.method}">${t.method}</span></td><td class="mono">${esc(t.endpoint||"-")}</td><td class="mono mut">${esc(t.server+" · "+t.name)}</td><td>${badge(lab[st][0],lab[st][1])}</td></tr>`).join("")}</tbody></table></div>`:`<div class="empty"><div class="ico">${ic("check")}</div><div><b>No changes since ${esc(S.snap)}</b></div><div>Add or change an endpoint, rebuild with synapse build --discover, then refresh.</div></div>`}</div>
  <div class="card"><h3 style="margin-bottom:6px">Workflow impact analysis</h3><div class="sub" style="margin-bottom:12px">What this rebuild means for your tests</div>
    <div class="stat-line"><span>Affected workflows</span><b>${d.affected.length}</b></div>${d.affected.length?`<div class="chips" style="padding:10px 0">${d.affected.map(a=>`<span class="badge amb">${esc(a)}</span>`).join("")}</div>`:""}
    <div class="stat-line"><span>Tests requiring reruns</span><b>${d.affected.length}</b></div>
    <div class="stat-line"><span>Permission changes</span><b class="${d.became_write.length?"err":""}">${d.became_write.length}</b></div>
    <div class="stat-line"><span>Breaking changes</span><b class="${breaking?"err":""}">${breaking}</b></div>
    <div class="stat-line"><span>Reworded only (no rerun)</span><b>${d.reworded.length}</b></div></div></div></div>`)}

function vSettings(){const c=S.cfg;
  return header("Settings","Where FlowProof reads its configuration.","")+`<div class="page"><div class="grid g2">
  <div class="card"><h3 style="margin-bottom:14px">Agent model</h3><dl class="kv"><dt>Model</dt><dd class="mono">${esc(c.model)}</dd><dt>Fallbacks</dt><dd class="mono">${esc((c.fallbacks||[]).join(", ")||"-")}</dd><dt>Provider host</dt><dd class="mono">${esc(c.llm_host)}</dd></dl><div class="sm2" style="margin-top:12px">Set FLOWPROOF_MODEL and FLOWPROOF_FALLBACKS in .env. API keys are never shown here.</div></div>
  <div class="card"><h3 style="margin-bottom:14px">MCP servers</h3><dl class="kv"><dt>Config file</dt><dd class="mono">${esc(c.servers_file)}</dd><dt>Synapse API key</dt><dd>${c.has_synapse_key?badge("ok","Configured"):badge("amb","Not set")}</dd><dt>Servers</dt><dd>${S.servers.length}</dd></dl></div>
  <div class="card"><h3 style="margin-bottom:6px">Contract snapshots</h3><div class="sub" style="margin-bottom:14px">Save the current tool contract so a later rebuild can be diffed against it.</div><div style="display:flex;gap:10px"><input id="snapname" value="baseline" aria-label="Snapshot label"><button class="btn pri" data-act="savesnap">${ic("save","sm")} Save snapshot</button></div><div class="chips" style="margin-top:14px">${(c.snapshots||[]).map(x=>`<span class="badge mu">${esc(x)}</span>`).join("")}</div></div>
  <div class="card"><h3 style="margin-bottom:14px">Safety</h3><div class="stat-line"><span>Write tools require approval</span>${badge("ok","Always on")}</div><div class="stat-line"><span>Approval is enforced</span><span class="mut">in the runner, not the prompt</span></div><div class="stat-line"><span>Drafts saved in this browser</span><b>${S.drafts.length}</b></div></div></div></div>`}

function modal(html){$("#layer").innerHTML=`<div class="scrim" data-act="closed"></div>${html}`;const f=$("#layer input,#layer textarea");f&&f.focus()}
function closeLayer(){$("#layer").innerHTML="";S.tool=""}
function newWfModal(){modal(`<div class="modal" role="dialog" aria-label="New workflow"><h2>New workflow</h2><div class="field"><label for="nwn">Name</label><input id="nwn" placeholder="e.g. expiring-warranties"></div><div class="field"><label for="nwp">What should the agent do?</label><textarea id="nwp" rows="3" placeholder="Find unresolved high-priority support tickets for critical assets and check their warranty status."></textarea></div><div><div class="sm2" style="margin-bottom:8px">MCP servers</div><div class="chips">${S.servers.map(s=>`<label class="chip on"><input type="checkbox" checked value="${esc(s.name)}" class="nws"> ${esc(s.name)}</label>`).join("")}</div></div><div style="display:flex;justify-content:flex-end;gap:10px"><button class="btn" data-act="closed">Cancel</button><button class="btn pri" data-act="createwf">Create draft</button></div></div>`)}
function connectModal(){const snip=`"my-server": {"command": "npx", "args": ["-y", "@2ndbrainlabs-ai/synapse-mcp"], "env": {"SYNAPSE_SERVER_ID": "<server id>", "SYNAPSE_API_KEY": "\${SYNAPSE_API_KEY}", "ENDPOINT_BASE_URL": "http://localhost:9000"}}`;
  modal(`<div class="modal" role="dialog" aria-label="Connect server"><h2>Connect a new server</h2><p class="mut" style="margin:0">FlowProof reads servers from <span class="mono">${esc(S.cfg.servers_file||"servers.json")}</span>. Build a server with Synapse, add an entry, then refresh.</p><pre class="json" style="white-space:pre-wrap;word-break:break-all">synapse build --discover --auto --all-endpoints --smart-names \\\n  --base-url http://localhost:9000 --server-name my-server</pre><pre class="json" style="white-space:pre-wrap;word-break:break-all" id="snip">${esc(snip)}</pre><div style="display:flex;justify-content:flex-end;gap:10px"><button class="btn" data-act="copysnip">${ic("copy","sm")} Copy entry</button><button class="btn pri" data-act="closed">Done</button></div></div>`)}

document.addEventListener("click",async e=>{
  const nav=e.target.closest("[data-nav]");if(nav){location.hash=nav.dataset.nav;return}
  const cmp=e.target.closest("[data-cmp]");if(cmp){S.cmp=cmp.dataset.cmp;render();return}
  const an=e.target.closest("[data-an]");if(an){S.an[an.dataset.an]=an.dataset.v;render();return}
  if(S.notifOpen&&!e.target.closest(".rel")){S.notifOpen=false;render()}
  const a=e.target.closest("[data-act]");if(!a)return;const act=a.dataset.act;
  if(["range","pickwf","snap"].includes(act))return;
  switch(act){
    case"menu":$("#side").classList.toggle("open");break;
    case"notif":S.notifOpen=!S.notifOpen;render();break;
    case"closed":closeLayer();render();break;
    case"newwf":newWfModal();break;
    case"createwf":{const n=$("#nwn").value.trim()||"untitled-workflow",p=$("#nwp").value.trim();if(!p){toast("Describe what the agent should do first","err");return}
      const id="draft-"+n.toLowerCase().replace(/[^a-z0-9]+/g,"-");S.drafts.push({id,name:n,prompt:p,servers:$$(".nws:checked").map(x=>x.value)});save();S.wf=id;S.wfServers=null;closeLayer();location.hash="#/studio";toast(`Draft "${n}" created`);render();break}
    case"connect":connectModal();break;
    case"copysnip":try{await navigator.clipboard.writeText($("#snip").textContent);toast("Copied")}catch{toast("Select and copy manually","info")}break;
    case"viewtools":S.tf={q:"",server:a.dataset.s,method:"",perm:"",status:""};location.hash="#/tools";break;
    case"toggle":S.srvOpen[a.dataset.s]=!S.srvOpen[a.dataset.s];render();break;
    case"health":{a.disabled=true;a.innerHTML='<span class="spin"></span> Checking';try{await load(true);const s=S.servers.find(x=>x.name===a.dataset.s);toast(`${s.name}: healthy · ${s.ping_ms}ms · ${s.tools.length} tools`)}catch(err){toast("Health check failed: "+err.message,"err")}render();break}
    case"refresh":try{await load(true);toast("Connections refreshed")}catch(err){toast("Refresh failed: "+err.message,"err")}render();break;
    case"disconnect":S.disc[a.dataset.s]=true;toast(`${a.dataset.s} disconnected for this session`,"info");render();break;
    case"reconnect":delete S.disc[a.dataset.s];toast(`${a.dataset.s} reconnected`);render();break;
    case"tool":S.tool=a.dataset.id;$("#layer").innerHTML=toolDrawer();$$("#toolsTable tr").forEach(r=>r.classList.toggle("sel",r.dataset.id===S.tool));break;
    case"clearf":S.tf={q:"",server:"",method:"",perm:"",status:""};render();break;
    case"clearr":S.rf={q:"",status:"",range:"all"};render();break;
    case"goto":if(a.dataset.wf){S.wf=a.dataset.wf;S.wfServers=null;S.wfNodeSel=null}location.hash=a.dataset.to;break;
    case"node":S.wfNodeSel=+a.dataset.i;render();break;
    case"srvchip":{const w=wfList().find(x=>x.id===S.wf);const cur=S.wfServers||[...w.servers];const i=cur.indexOf(a.dataset.s);i>=0?cur.splice(i,1):cur.push(a.dataset.s);S.wfServers=cur;render();break}
    case"savewf":{const p=$("#wfp").value;S.prompts[S.wf]=p;const d=S.drafts.find(x=>x.id===S.wf);if(d)d.prompt=p;save();toast("Workflow saved in this browser");break}
    case"runwf":runWorkflow();break;
    case"step":S.trace.step=+a.dataset.i;render();break;
    case"savesnap":{const n=$("#snapname").value.trim();if(!n)return;try{await j(`/api/snapshot/${encodeURIComponent(n)}`,{method:"POST"});S.cfg=await j("/api/config");toast(`Snapshot "${n}" saved`);render()}catch(err){toast("Snapshot failed: "+err.message,"err")}break}
    case"regress":{const aff=S.diff?S.diff.affected:[];if(!aff.length){toast("No scenarios are affected by this change. Nothing to rerun.","info");break}
      a.disabled=true;a.innerHTML='<span class="spin"></span> Running';let ok=0;for(const id of aff){try{const r=await j(`/api/run/${id}`,{method:"POST"});const run={id:`live-${now()}-${id}`,scenario:id,at:now(),passed:!!r.verdict.passed,verdict:r.verdict,trace:r.trace,answer:r.answer,error:r.error||"",servers:[...new Set(r.trace.filter(t=>t.server!=="?").map(t=>t.server))],ms:r.trace.reduce((x,t)=>x+(t.ms||0),0)||null};S.runs.unshift(run);if(run.passed)ok++;toast(`${id}: ${run.passed?"passed":"failed"}`,run.passed?"ok":"err")}catch(err){toast(`${id}: ${err.message}`,"err")}}
      toast(`Regression finished: ${ok}/${aff.length} passed`,ok===aff.length?"ok":"err");render();break}
  }});
document.addEventListener("change",async e=>{const t=e.target;
  if(t.dataset.act==="range"){S.range=t.value;render()}
  else if(t.dataset.act==="pickwf"){S.wf=t.value;S.wfNodeSel=null;S.wfServers=null;render()}
  else if(t.dataset.act==="snap"){S.snap=t.value;S.diff=null;render();await loadDiff();render()}
  else if(t.dataset.f){S.tf[t.dataset.f]=t.value;$("#toolsTable").innerHTML=toolsTable()}
  else if(t.dataset.rf){S.rf[t.dataset.rf]=t.value;if(t.dataset.rf==="range")render();else $("#runsTable").innerHTML=runsTable()}
  else if(t.dataset.anf){S.an[t.dataset.anf]=t.value;render()}});
document.addEventListener("input",e=>{if(e.target.id==="tq"){S.tf.q=e.target.value;$("#toolsTable").innerHTML=toolsTable()}if(e.target.id==="rq"){S.rf.q=e.target.value;$("#runsTable").innerHTML=runsTable()}});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeLayer();S.notifOpen=false;render()}});
window.addEventListener("hashchange",()=>{$("#side").classList.remove("open");window.scrollTo(0,0);render()});

const VIEWS={overview:vOverview,servers:vServers,tools:vTools,studio:vStudio,runs:vRuns,trace:vTrace,analytics:vAnalytics,changes:vChanges,settings:vSettings};
const TITLES={overview:"Overview",servers:"MCP Servers",tools:"Tool Registry",studio:"Workflow Studio",runs:"Test Runs",trace:"Execution Trace",analytics:"Analytics",changes:"Change Detection",settings:"Settings"};
function render(){
  renderNav();const r=route(),v=$("#view");
  if(!S.loaded){v.innerHTML=header("&nbsp;","&nbsp;")+skeleton();return}
  const st=window.scrollY;
  v.innerHTML=(VIEWS[r.page]||vOverview)(r.id);
  document.title=(TITLES[r.page]||"FlowProof")+" · FlowProof";
  if(S.tool&&r.page==="tools")$("#layer").innerHTML=toolDrawer();
  window.scrollTo(0,st)}
async function loadDiff(){const labels=S.cfg.snapshots||[];const label=S.snap||(labels.includes("hosted_baseline")?"hosted_baseline":labels[0]);if(!label)return;S.snap=label;try{S.diff=await j(`/api/diff/${encodeURIComponent(label)}`);S.diff._at=now()}catch{S.diff=null}}
async function load(soft){
  const [servers,runs,scen,cfg,diff]=await Promise.all([j("/api/servers"+(soft?"?fresh=true":"")),j("/api/runs"),j("/api/scenarios"),j("/api/config"),j("/api/diff/"+encodeURIComponent(S.snap||"hosted_baseline")).catch(()=>null)]);
  S.servers=servers;S.scen=scen;S.cfg=cfg;const live=soft?S.runs.filter(r=>r.id.startsWith("live-")):[];S.runs=[...live,...runs];
  if(diff&&(!S.snap||S.diff===null)){S.snap=S.snap||"hosted_baseline";S.diff=diff;S.diff._at=now()}else await loadDiff();S.loaded=true}
render();
load().then(render).catch(e=>{S.loaded=false;$("#view").innerHTML=header("Can't reach the FlowProof API","")+`<div class="page"><div class="card"><div class="empty"><div class="ico">${ic("alert")}</div><div><b>${esc(e.message)}</b></div><div>Start it with: uv run uvicorn backend.api:app --port 8000</div></div></div></div>`});
