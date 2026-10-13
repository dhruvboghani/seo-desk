/* Website traffic checker (free).
   "Any website": free popularity signals from /api/popularity.
   "My website": real Search Console + Google Analytics data after Google sign-in.
   Until real data loads, each mode shows a sample report that is clearly labelled. */
(function(){
'use strict';
const {$,esc,api,store}=RD;
const SVGNS='http://www.w3.org/2000/svg', ACCENT='#2448f5';
const CAT=['#2a78d6','#eb6834','#1baf7a','#eda100','#e87ba4','#008300'], OTHER='#8a93a5';
const regionName=(()=>{ try{ const d=new Intl.DisplayNames(['en'],{type:'region'}); return c=>{ try{ return d.of(c.toUpperCase())||c.toUpperCase(); }catch(e){ return c.toUpperCase(); } }; }catch(e){ return c=>c.toUpperCase(); } })();
const flag=c=>/^[a-z]{2}$/.test(c||'')?String.fromCodePoint(...[...c.toUpperCase()].map(x=>0x1F1E6+x.charCodeAt(0)-65)):'🌐';
const A3={ind:'in',usa:'us',gbr:'gb',are:'ae',can:'ca',aus:'au',deu:'de',sgp:'sg',fra:'fr',bra:'br',idn:'id',pak:'pk',bgd:'bd',npl:'np',lka:'lk',nga:'ng',zaf:'za',ken:'ke',phl:'ph',mys:'my',sau:'sa',qat:'qa',kwt:'kw',omn:'om',bhr:'bh',nld:'nl',esp:'es',ita:'it',irl:'ie',nzl:'nz',jpn:'jp',kor:'kr',chn:'cn',hkg:'hk',twn:'tw',tha:'th',vnm:'vn',tur:'tr',egy:'eg',mex:'mx',arg:'ar',col:'co',che:'ch',swe:'se',nor:'no',dnk:'dk',fin:'fi',bel:'be',aut:'at',pol:'pl',prt:'pt',rus:'ru',ukr:'ua',isr:'il',grc:'gr',rou:'ro',cze:'cz',hun:'hu'};

/* ---------- formatting ---------- */
const compact=n=>{ if(n==null||isNaN(n)) return '–'; const a=Math.abs(n);
  if(a>=1e9) return (n/1e9).toFixed(a>=1e10?0:1).replace(/\.0$/,'')+'B'; if(a>=1e6) return (n/1e6).toFixed(a>=1e7?0:1).replace(/\.0$/,'')+'M';
  if(a>=1e3) return (n/1e3).toFixed(a>=1e4?0:1).replace(/\.0$/,'')+'K'; return String(Math.round(n)); };
const full=n=>n==null||isNaN(n)?'–':Math.round(n).toLocaleString('en-IN');
const pct=(x,d=1)=>x==null||isNaN(x)?'–':(x*100).toFixed(x*100<10&&x>0?d:0)+'%';
const dur=s=>{ if(s==null||isNaN(s)) return '–'; s=Math.round(s); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const mLabel=(ym,y)=>{ const [Y,M]=ym.split('-').map(Number); return MON[M-1]+(y?' '+String(Y).slice(2):''); };
const mLong=ym=>{ const [Y,M]=ym.split('-').map(Number); return MON[M-1]+' '+Y; };
const dLabel=d=>{ const [,M,D]=d.split('-').map(Number); return D+' '+MON[M-1]; };
const niceStep=x=>{ const p=Math.pow(10,Math.floor(Math.log10(x||1))), f=x/p; return (f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*p; };
const svg=(tag,attrs,parent)=>{ const e=document.createElementNS(SVGNS,tag); for(const k in attrs) e.setAttribute(k,attrs[k]); if(parent) parent.appendChild(e); return e; };
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- tooltip ---------- */
const tt=$('tt');
function showTip(html,x,y){ tt.innerHTML=html; tt.hidden=false; const r=tt.getBoundingClientRect(); let l=x+14,t=y-r.height-12; if(l+r.width>innerWidth-8) l=x-r.width-14; if(t<8) t=y+16; tt.style.left=l+'px'; tt.style.top=t+'px'; }
const hideTip=()=>{ tt.hidden=true; };

/* ---------- charts ---------- */
// pts: [{label, value}]; opts: invert (lower is better), fmt, xLabel, tip
function lineChart(el,pts,opts={}){
  el.innerHTML='';
  if(!pts.length){ el.innerHTML=`<p class="note">${opts.empty||'No data for this period.'}</p>`; return; }
  const fmt=opts.fmt||compact, xl=opts.xLabel||((p,i)=>mLabel(p.label,i===0||p.label.endsWith('-01')));
  const W=Math.max(260,el.clientWidth), H=opts.h||Math.round(Math.min(300,Math.max(200,W*0.42))), P={l:52,r:18,t:20,b:30};
  const vals=pts.map(p=>p.value);
  let lo=opts.invert?Math.min(...vals):0, hi=Math.max(...vals);
  if(opts.invert){ const pad=(hi-lo)*0.15||Math.max(1,hi*0.1); lo=Math.max(opts.min??0,lo-pad); hi=hi+pad; }
  const step=niceStep((hi-lo)/4||1); const top=Math.ceil(hi/step)*step, bot=opts.invert?Math.floor(lo/step)*step:0;
  const x=i=>P.l+(pts.length===1?(W-P.l-P.r)/2:i*(W-P.l-P.r)/(pts.length-1));
  const y=v=>{ const f=(v-bot)/((top-bot)||1); return opts.invert?P.t+(H-P.t-P.b)*f:P.t+(H-P.t-P.b)*(1-f); };
  const s=svg('svg',{viewBox:`0 0 ${W} ${H}`,width:W,height:H,class:'chart-svg'},el);
  const gid='g'+Math.random().toString(36).slice(2,7);
  const g=svg('linearGradient',{id:gid,x1:0,y1:0,x2:0,y2:1},svg('defs',{},s));
  svg('stop',{offset:'0%','stop-color':ACCENT,'stop-opacity':.16},g); svg('stop',{offset:'100%','stop-color':ACCENT,'stop-opacity':0},g);
  for(let v=bot;v<=top+1e-9;v+=step){ svg('line',{x1:P.l,x2:W-P.r,y1:y(v),y2:y(v),class:'grid'},s); svg('text',{x:P.l-8,y:y(v)+4,class:'ax','text-anchor':'end'},s).textContent=(opts.invert&&opts.prefix||'')+fmt(v); }
  const every=Math.ceil(pts.length/(W<480?4:W<720?6:12));
  pts.forEach((p,i)=>{ if(i%every&&i!==pts.length-1) return; if(i!==pts.length-1&&pts.length-1-i<every/2) return; svg('text',{x:x(i),y:H-8,class:'ax','text-anchor':'middle'},s).textContent=xl(p,i); });
  const line=pts.map((p,i)=>`${i?'L':'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join('');
  const base=opts.invert?y(top):y(0);
  svg('path',{d:`${line}L${x(pts.length-1)},${base}L${x(0)},${base}Z`,fill:`url(#${gid})`},s);
  const path=svg('path',{d:line,class:'ln',stroke:ACCENT},s);
  const len=path.getTotalLength?path.getTotalLength():0;
  if(len&&!reduce){ path.style.strokeDasharray=len; path.style.strokeDashoffset=len; requestAnimationFrame(()=>{ path.style.transition='stroke-dashoffset 1.2s cubic-bezier(.2,.7,.2,1)'; path.style.strokeDashoffset=0; }); }
  const li=pts.length-1;
  svg('circle',{cx:x(li),cy:y(pts[li].value),r:5,fill:ACCENT,stroke:'#fff','stroke-width':2},s);
  const ly=y(pts[li].value); svg('text',{x:x(li)-8,y:ly<P.t+16?ly+20:ly-12,class:'endlab','text-anchor':'end'},s).textContent=(opts.prefix||'')+fmt(pts[li].value);
  const cross=svg('line',{y1:P.t,y2:H-P.b,class:'cross'},s), dot=svg('circle',{r:5,fill:'#fff',stroke:ACCENT,'stroke-width':2.5,class:'hdot'},s);
  const hit=svg('rect',{x:P.l,y:0,width:W-P.l-P.r,height:H,fill:'transparent'},s);
  hit.addEventListener('pointermove',e=>{ const r=s.getBoundingClientRect(), mx=(e.clientX-r.left)*W/r.width;
    const i=Math.max(0,Math.min(li,Math.round((mx-P.l)/((W-P.l-P.r)/Math.max(1,li))))), p=pts[i];
    cross.setAttribute('x1',x(i)); cross.setAttribute('x2',x(i)); dot.setAttribute('cx',x(i)); dot.setAttribute('cy',y(p.value)); s.classList.add('hov');
    showTip(opts.tip?opts.tip(p,pts[i-1]):`<b>${mLong(p.label)}</b><span>${full(p.value)}</span>`,e.clientX,e.clientY); });
  hit.addEventListener('pointerleave',()=>{ s.classList.remove('hov'); hideTip(); });
}
function stackChart(el,months,series){
  el.innerHTML='';
  if(!months.length||!series.length){ el.innerHTML='<p class="note">No visits from AI assistants in this period.</p>'; return; }
  const W=Math.max(260,el.clientWidth), H=Math.round(Math.min(280,Math.max(200,W*0.45))), P={l:44,r:10,t:14,b:30};
  const totals=months.map((m,i)=>series.reduce((a,sr)=>a+(sr.values[i]||0),0)), max=Math.max(...totals,1);
  const step=niceStep(max/4), top=Math.ceil(max/step)*step, band=(W-P.l-P.r)/months.length, bw=Math.min(38,band*0.62), y=v=>P.t+(H-P.t-P.b)*(1-v/top);
  const s=svg('svg',{viewBox:`0 0 ${W} ${H}`,width:W,height:H,class:'chart-svg'},el);
  for(let v=0;v<=top+1e-9;v+=step){ svg('line',{x1:P.l,x2:W-P.r,y1:y(v),y2:y(v),class:'grid'},s); svg('text',{x:P.l-8,y:y(v)+4,class:'ax','text-anchor':'end'},s).textContent=compact(v); }
  const every=W<480?3:W<720?2:1;
  months.forEach((m,i)=>{
    const cx=P.l+band*i+band/2; let acc=0; const g=svg('g',{class:'col'},s);
    series.forEach(sr=>{ const v=sr.values[i]||0; if(!v) return; const y0=y(acc),y1=y(acc+v); acc+=v; const r=svg('rect',{x:cx-bw/2,y:y1,width:bw,height:Math.max(0,y0-y1),fill:sr.color,rx:2,stroke:'#fff','stroke-width':1.5,class:'seg'},g); r.style.setProperty('--i',i); });
    if(i%every===0||i===months.length-1) svg('text',{x:cx,y:H-8,class:'ax','text-anchor':'middle'},s).textContent=mLabel(m,i===0||m.endsWith('-01'));
    const hit=svg('rect',{x:P.l+band*i,y:P.t,width:band,height:H-P.t-P.b,fill:'transparent'},s);
    hit.addEventListener('pointermove',e=>{ g.classList.add('on'); showTip(`<b>${mLong(m)}</b>`+series.filter(sr=>sr.values[i]).sort((a,b)=>b.values[i]-a.values[i]).map(sr=>`<span><i style="background:${sr.color}"></i>${esc(sr.name)} <em>${full(sr.values[i])}</em></span>`).join('')+`<span class="tot">Total <em>${full(totals[i])}</em></span>`,e.clientX,e.clientY); });
    hit.addEventListener('pointerleave',()=>{ g.classList.remove('on'); hideTip(); });
  });
}
function bars(el,items,fmt,empty){
  if(!items.length){ el.innerHTML=`<p class="note">${empty||'No data.'}</p>`; return; }
  const max=Math.max(...items.map(x=>x.value||0))||1;
  el.innerHTML=`<div class="hbars">${items.map((x,i)=>`<div class="hb" style="--w:${((x.value||0)/max*100).toFixed(1)}%;--i:${i}" title="${esc(x.label)}: ${esc(fmt(x.value))}${x.sub?' · '+esc(x.sub):''}"><span class="hb-l">${x.icon?`<span class="hb-ico" aria-hidden="true">${x.icon}</span>`:''}${esc(x.label)}</span><span class="hb-t"><i></i></span><span class="hb-v">${esc(fmt(x.value))}${x.sub?`<small>${esc(x.sub)}</small>`:''}</span></div>`).join('')}</div>`;
}
const split=(parts)=>{ const t=parts.reduce((a,p)=>a+(p.value||0),0)||1;
  return `<div class="split">${parts.map((p,i)=>`<i style="flex:${(p.value||0)/t};background:${CAT[i]}"></i>`).join('')}</div><div class="split-l">${parts.map((p,i)=>`<span><i style="background:${CAT[i]}"></i>${esc(p.label)} <b>${pct((p.value||0)/t,0)}</b>${p.n!=null?` <em>${compact(p.n)}</em>`:''}</span>`).join('')}</div>`; };
const kpi=(label,val,sub,cls='')=>`<div class="kpi ${cls}"><span class="kpi-l">${label}</span><b>${val}</b>${sub?`<span class="kpi-s">${sub}</span>`:''}</div>`;
const note=(sec,fallback)=>`<p class="note">${esc(sec&&sec.error||fallback)}</p>`;

/* ================= Any website ================= */
let anyData=null, anySample=false;
function renderAny(r,sample){
  anyData=r; anySample=sample;
  $('any-title').textContent=r.domain; $('any-fav').textContent=(r.domain[0]||'?').toUpperCase();
  const used=[r.tranco?.ok&&'Tranco',r.cloudflare?.ok&&'Cloudflare Radar',r.crux?.ok&&'Chrome UX Report',r.opr?.ok&&'Open PageRank'].filter(Boolean);
  $('any-sub').textContent=sample?'Sample data':(used.length?'Free data from '+used.join(', '):'No free data found for this website');
  const tr=r.tranco, ranks=tr?.ok?tr.ranks:[], last=ranks[ranks.length-1], first=ranks[0];
  const delta=last&&first&&ranks.length>1?first.rank-last.rank:null;
  const cf=r.cloudflare, cx=r.crux, op=r.opr;
  const dl=cx?.ok?cx.devices.filter(d=>d.phone!=null||d.desktop!=null):[], dlast=dl[dl.length-1];
  const vit=cx?.ok?cx.vitals:null;
  const good=vit?[vit.lcp!=null&&vit.lcp<=2500,vit.inp!=null&&vit.inp<=200,vit.cls!=null&&vit.cls<=0.1]:[];
  const bucket=cf?.ok&&(cf.rank&&cf.rank<=100?'#'+cf.rank:cf.bucket?'Top '+compact(Number(cf.bucket)):null);
  $('any-kpis').innerHTML=[
    kpi('Popularity rank',last?'#'+full(last.rank):'–',last?(delta==null?'Tranco top sites':`<span class="${delta>=0?'up':'down'}">${delta>=0?'▲':'▼'} ${full(Math.abs(delta))}</span> in ${ranks.length} days`):(tr?.ok?'Not in the top 1 million':esc(tr?.error||'')),'kpi-main'),
    kpi('Popularity bracket',bucket||'–',cf?.ok?'Cloudflare Radar':(cf?.code==='not_configured'?'Not connected':'Not ranked')),
    kpi('Authority score',op?.ok&&op.score!=null?op.score.toFixed(1)+'<small>/10</small>':'–',op?.ok&&op.rank?'#'+full(op.rank)+' by links':(op?.code==='not_configured'?'Not connected':'Open PageRank')),
    kpi('Mobile visitors',dlast&&dlast.phone!=null?pct(dlast.phone,0):'–',cx?.ok?'of Chrome users':(cx?.code==='not_configured'?'Not connected':'Not enough Chrome data')),
    kpi('Core Web Vitals',vit?(good.filter(Boolean).length+'/3'):'–',vit?(good.every(Boolean)?'<span class="up">Passing</span>':'<span class="down">Needs work</span>'):'Chrome UX Report')
  ].join('');

  lineChart($('ch-rank'),ranks.map(x=>({label:x.date,value:x.rank})),{invert:true,min:1,prefix:'#',fmt:compact,xLabel:p=>dLabel(p.label),
    empty:tr?.ok?'This website is not in the Tranco top 1 million, so it has no popularity rank yet.':esc(tr?.error||'Rank data is not available.'),
    tip:(p,prev)=>`<b>${dLabel(p.label)}</b><span>Rank #${full(p.value)}</span>${prev?`<span class="${prev.value>=p.value?'up':'down'}">${prev.value>=p.value?'▲ up':'▼ down'} ${full(Math.abs(prev.value-p.value))}</span>`:''}`});

  if(cf?.ok&&cf.locations.length){
    $('any-geo').innerHTML=`<ol class="locs">${cf.locations.slice(0,8).map((l,i)=>`<li style="--i:${i}"><span>${flag(l.code)} ${esc(l.name||regionName(l.code))}</span><b>${l.rank!=null?'#'+full(l.rank):''}</b></li>`).join('')}</ol><p class="note small">Rank of this website among all websites visited from each country.</p>`;
  } else $('any-geo').innerHTML=cf?.ok?'<p class="note">Cloudflare does not list this website as popular in any country.</p>':note(cf,'Country data is not available.');
  $('any-cats').innerHTML=cf?.ok&&cf.categories.length?cf.categories.slice(0,6).map(c=>`<span class="pchip">${esc(c)}</span>`).join(''):'';

  if(cx?.ok&&dlast){
    $('any-dev').innerHTML=split([{label:'Mobile',value:dlast.phone},{label:'Desktop',value:dlast.desktop},{label:'Tablet',value:dlast.tablet}].filter(p=>p.value));
    lineChart($('ch-mobile'),dl.filter(d=>d.phone!=null).map(d=>({label:d.date,value:d.phone})),{h:150,fmt:v=>pct(v,0),xLabel:p=>dLabel(p.label),tip:p=>`<b>Week to ${dLabel(p.label)}</b><span>${pct(p.value)} mobile</span>`});
  } else { $('any-dev').innerHTML=note(cx,'Not enough Chrome users visit this website for Google to publish this data.'); $('ch-mobile').innerHTML=''; }

  if(vit){
    const tile=(name,v,unit,goodMax,poorMin,f)=>{ if(v==null) return `<div class="vital"><span>${name}</span><b>–</b><em>No data</em></div>`;
      const st=v<=goodMax?['good','Good','✓']:v<=poorMin?['mid','Needs work','!']:['bad','Poor','✕'];
      return `<div class="vital v-${st[0]}"><span>${name}</span><b>${f(v)}<small>${unit}</small></b><em><i aria-hidden="true">${st[2]}</i>${st[1]}</em></div>`; };
    $('any-vitals').innerHTML=tile('Largest Contentful Paint',vit.lcp,'s',2500,4000,v=>(v/1000).toFixed(1))+tile('Interaction to Next Paint',vit.inp,'ms',200,500,v=>Math.round(v))+tile('Cumulative Layout Shift',vit.cls,'',0.1,0.25,v=>Number(v).toFixed(2))+tile('Time to First Byte',vit.ttfb,'s',800,1800,v=>(v/1000).toFixed(1));
  } else $('any-vitals').innerHTML=note(cx,'Core Web Vitals are not available for this website.');
}

/* ================= My website ================= */
let mineData=null, mineSample=false;
function renderMine(r,sample){
  mineData=r; mineSample=sample;
  const name=(r.siteName||r.site||r.propertyName||'your website').replace(/^sc-domain:/,'').replace(/^https?:\/\//,'').replace(/\/$/,'');
  $('mine-title').textContent=name; $('mine-fav').textContent=(name[0]||'?').toUpperCase();
  $('mine-sub').textContent=sample?'Sample data':[r.property?'Google Analytics':null,r.site?'Search Console':null].filter(Boolean).join(' + ')+' · real data';
  // the current month is unfinished, so charts and KPIs use complete months only
  const thisYm=new Date().toISOString().slice(0,7), done=a=>a.filter(x=>(x.month||x.date)!==thisYm);
  const mo=r.monthly?.ok?done(r.monthly.rows):[], cur=mo[mo.length-1]||{}, prev=mo[mo.length-2]||{};
  const ch=prev.sessions?(cur.sessions-prev.sessions)/prev.sessions:null;
  const ai=r.ai?.ok?done(r.ai.rows):[], thisMonth=cur.month, aiNow=ai.filter(x=>x.date===thisMonth).reduce((a,x)=>a+x.visits,0);
  const kw=r.keywords?.ok?r.keywords.rows:[];
  const sm=r.searchMonthly?.ok?done(r.searchMonthly.rows):[];
  const c28=kw.reduce((a,k)=>a+k.clicks,0);
  $('mine-kpis').innerHTML=[
    kpi(cur.month?'Visits in '+mLabel(cur.month):'Visits last month',r.monthly?.ok?compact(cur.sessions):'–',ch==null?(r.monthly?.ok?'sessions':esc(r.monthly?.error||'Connect Analytics')):`<span class="${ch>=0?'up':'down'}">${ch>=0?'▲':'▼'} ${pct(Math.abs(ch))}</span> vs ${mLabel(prev.month)}`,'kpi-main'),
    kpi('Users',compact(cur.users),cur.newUsers!=null?compact(cur.newUsers)+' new':''),
    kpi('Avg. engagement',dur(cur.duration),'minutes : seconds'),
    kpi('Pages per visit',cur.pages==null?'–':Number(cur.pages).toFixed(2),''),
    kpi('Bounce rate',pct(cur.bounce,0),'did not engage'),
    kpi('AI visits',r.ai?.ok?compact(aiNow):'–',r.ai?.ok&&cur.sessions?pct(aiNow/cur.sessions,2)+' of visits':'from AI assistants')
  ].join('');

  lineChart($('ch-visits'),mo.map(x=>({label:x.month,value:x.sessions})),{empty:r.monthly?.ok?'No visits recorded yet.':esc(r.monthly?.error||'Choose a Google Analytics property to see visits.'),
    tip:(p,pv)=>{ const c=pv&&pv.value?(p.value-pv.value)/pv.value:null; return `<b>${mLong(p.label)}</b><span>${full(p.value)} sessions</span>${c==null?'':`<span class="${c>=0?'up':'down'}">${c>=0?'▲':'▼'} ${pct(Math.abs(c))} vs ${mLabel(pv.label)}</span>`}`; }});

  if(r.keywords?.ok||r.searchMonthly?.ok){
    const lastS=sm[sm.length-1]||{}, imp=kw.reduce((a,k)=>a+k.impressions,0);
    const avgPos=kw.length?kw.reduce((a,k)=>a+k.position*k.impressions,0)/(imp||1):lastS.position;
    const tile=(l,v,s)=>`<div class="rank"><span>${l}</span><b>${v}</b>${s?`<small>${s}</small>`:''}</div>`;
    $('mine-rank').innerHTML=tile('Avg. position',avgPos?avgPos.toFixed(1):'–','across top keywords')+tile('Clicks',compact(c28),'from Google')+tile('Impressions',compact(imp),'times shown')+tile('Click rate',imp?pct(c28/imp,1):'–','clicks ÷ impressions');
  } else $('mine-rank').innerHTML=note(r.keywords,'Choose a Search Console site to see Google rankings.');

  const dv=r.devices?.ok?r.devices.rows:[];
  if(dv.length){ const g=k=>dv.filter(d=>d.device===k).reduce((a,d)=>a+d.sessions,0); $('mine-dev').innerHTML=split([{label:'Mobile',value:g('mobile'),n:g('mobile')},{label:'Desktop',value:g('desktop'),n:g('desktop')},{label:'Tablet',value:g('tablet'),n:g('tablet')}].filter(p=>p.value)); }
  else $('mine-dev').innerHTML=note(r.devices,'Choose an Analytics property to see devices.');

  lineChart($('ch-clicks'),sm.map(x=>({label:x.month,value:x.clicks})),{h:190,empty:r.searchMonthly?.ok?'No clicks yet.':esc(r.searchMonthly?.error||'Choose a Search Console site.'),tip:p=>`<b>${mLong(p.label)}</b><span>${full(p.value)} clicks</span>`});
  lineChart($('ch-pos'),sm.filter(x=>x.position).map(x=>({label:x.month,value:x.position})),{h:190,invert:true,min:1,fmt:v=>Number.isInteger(+v)?String(v):Number(v).toFixed(1),empty:r.searchMonthly?.ok?'No ranking data yet.':esc(r.searchMonthly?.error||'Choose a Search Console site.'),tip:p=>`<b>${mLong(p.label)}</b><span>Average position ${Number(p.value).toFixed(1)}</span>`});

  const chn=r.channels?.ok?r.channels.rows:[], tot=chn.reduce((a,c)=>a+c.sessions,0)||1;
  bars($('mine-channels'),chn.map(c=>({label:c.channel,value:c.sessions/tot,sub:full(c.sessions)+' sessions'})),v=>pct(v),r.channels?.ok?'No sessions in the last 28 days.':esc(r.channels?.error||'Choose an Analytics property.'));
  const src=r.sources?.ok?r.sources.rows:[];
  $('mine-sources').innerHTML=src.length?`<ol class="srclist">${src.map(x=>`<li><span>${esc(x.source)}</span><em>${esc(x.medium)}</em><b>${full(x.sessions)}</b></li>`).join('')}</ol>`:'';

  let geo=r.countries?.ok?r.countries.rows.map(x=>({code:x.code,name:x.name,n:x.sessions})):[];
  let geoUnit='sessions';
  if(!geo.length&&r.searchCountries?.ok){ geo=r.searchCountries.rows.map(x=>({code:A3[x.code3]||'',name:A3[x.code3]?regionName(A3[x.code3]):x.code3.toUpperCase(),n:x.clicks})); geoUnit='clicks'; }
  const gt=geo.reduce((a,x)=>a+x.n,0)||1;
  bars($('mine-geo'),geo.slice(0,5).map(x=>({label:x.name||regionName(x.code),value:x.n/gt,icon:flag(x.code),sub:compact(x.n)+' '+geoUnit})),v=>pct(v),'Choose an Analytics property to see countries.');
  $('mine-geo-tbl').innerHTML=geo.slice(0,10).map(x=>`<tr><td>${flag(x.code)} ${esc(x.name||regionName(x.code))}</td><td class="num">${pct(x.n/gt)}</td><td class="num">${full(x.n)}</td></tr>`).join('');

  $('mine-kw').innerHTML=kw.length?kw.map(k=>`<tr><td class="k">${esc(k.keyword)}</td><td class="num">${full(k.clicks)}</td><td class="num">${full(k.impressions)}</td><td class="num">${pct(k.ctr,1)}</td><td class="num">${Number(k.position).toFixed(1)}</td></tr>`).join('')
    :`<tr><td colspan="5">${note(r.keywords,'Choose a Search Console site to see keywords.')}</td></tr>`;

  if(ai.length){
    const months=[...new Set(ai.map(x=>x.date))].sort(), tb={}; ai.forEach(x=>{ tb[x.source]=(tb[x.source]||0)+x.visits; });
    const order=Object.keys(tb).sort((a,b)=>tb[b]-tb[a]), main=order.slice(0,CAT.length), rest=order.slice(CAT.length);
    const series=main.map((n,i)=>({name:n,color:CAT[i],values:months.map(m=>ai.filter(x=>x.date===m&&x.source===n).reduce((a,x)=>a+x.visits,0))}));
    if(rest.length) series.push({name:'Other',color:OTHER,values:months.map(m=>ai.filter(x=>x.date===m&&rest.includes(x.source)).reduce((a,x)=>a+x.visits,0))});
    $('mine-ai-legend').innerHTML=series.map(sr=>`<span><i style="background:${sr.color}"></i>${esc(sr.name)}</span>`).join('');
    $('mine-ai-total').textContent=compact(series.reduce((a,sr)=>a+sr.values.reduce((x,y)=>x+y,0),0))+' AI visits in 12 months';
    stackChart($('ch-ai'),months,series);
    const li=months.length-1, lt=series.reduce((a,sr)=>a+(sr.values[li]||0),0)||1;
    $('mine-ai-tbl').innerHTML=series.map(sr=>`<tr><td><i class="sw" style="background:${sr.color}"></i>${esc(sr.name)}</td><td class="num">${full(sr.values[li])}</td><td class="num">${pct((sr.values[li]||0)/lt)}</td><td class="num">${full(sr.values.reduce((a,b)=>a+b,0))}</td></tr>`).join('');
  } else { $('mine-ai-legend').innerHTML=''; $('mine-ai-total').textContent=''; $('ch-ai').innerHTML=r.ai&&!r.ai.ok?note(r.ai):'<p class="note">No visits from AI assistants in the last 12 months.</p>'; $('mine-ai-tbl').innerHTML=''; }
  const ap=r.ai?.ok?r.ai.pages||[]:[];
  $('mine-aipages').innerHTML=ap.length?`<ol class="prompts">${ap.map(p=>`<li><p>${esc(p.page)}</p><div>${p.platforms.map(l=>`<span class="pchip">${esc(l)}</span>`).join('')}<em>${full(p.sessions)} visits</em></div></li>`).join('')}</ol>`:'<p class="note">No AI visitors in the last 90 days yet.</p>';
  $('mine-foot').textContent=sample?'Sample report: every number on this page is made up to show the layout.':'Real data from your Google Search Console and Google Analytics. Search Console data runs about 3 days behind.';
}

/* ---------- CSV (my website) ---------- */
$('mine-csv').addEventListener('click',()=>{
  const r=mineData; if(!r) return; const q=v=>`"${String(v??'').replace(/"/g,'""')}"`, L=[];
  L.push(['Rankdesk traffic report',$('mine-title').textContent,new Date().toISOString().slice(0,10)].map(q).join(','),'');
  if(r.monthly?.ok){ L.push('Month,Sessions,Users,New users,Avg engagement (s),Pages per visit,Bounce rate'); r.monthly.rows.forEach(x=>L.push([x.month,x.sessions,x.users,x.newUsers,x.duration,x.pages,x.bounce].map(q).join(','))); }
  if(r.searchMonthly?.ok){ L.push('','Month,Clicks,Impressions,Avg position'); r.searchMonthly.rows.forEach(x=>L.push([x.month,x.clicks,x.impressions,x.position].map(q).join(','))); }
  if(r.keywords?.ok){ L.push('','Keyword,Clicks,Impressions,CTR,Position'); r.keywords.rows.forEach(x=>L.push([x.keyword,x.clicks,x.impressions,x.ctr,x.position].map(q).join(','))); }
  if(r.channels?.ok){ L.push('','Channel,Sessions'); r.channels.rows.forEach(x=>L.push([x.channel,x.sessions].map(q).join(','))); }
  if(r.countries?.ok){ L.push('','Country,Sessions,Users'); r.countries.rows.forEach(x=>L.push([x.name,x.sessions,x.users].map(q).join(','))); }
  if(r.ai?.ok){ L.push('','Month,AI platform,Sessions'); r.ai.rows.forEach(x=>L.push([x.date,x.source,x.visits].map(q).join(','))); }
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([L.join('\n')],{type:'text/csv'}));
  a.download=`${$('mine-title').textContent.replace(/[^a-z0-9.-]+/gi,'-')}-traffic${mineSample?'-sample':''}.csv`; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();},500);
});

/* ---------- samples (made-up numbers, always labelled) ---------- */
const monthsBack=n=>{ const d=new Date(); d.setUTCDate(1); return Array.from({length:n},(_,i)=>{ const x=new Date(d); x.setUTCMonth(x.getUTCMonth()-(n-1-i)); return x.toISOString().slice(0,7); }); };
function sampleAny(){
  const days=Array.from({length:30},(_,i)=>new Date(Date.now()-(29-i)*864e5).toISOString().slice(0,10));
  return {domain:'example.com',
    tranco:{ok:true,ranks:days.map((d,i)=>({date:d,rank:Math.round(48200-i*310+Math.sin(i/2)*900)}))},
    cloudflare:{ok:true,rank:null,bucket:'50000',categories:['Technology','Business'],locations:[['in','India',8120],['ae','United Arab Emirates',21400],['gb','United Kingdom',36800],['us','United States',61200],['sg','Singapore',64300]].map(([code,name,rank])=>({code,name,rank}))},
    crux:{ok:true,devices:days.filter((_,i)=>i%4===0).map((d,i)=>({date:d,phone:.62+i*.008,desktop:.36-i*.008,tablet:.02})),vitals:{lcp:2100,inp:180,cls:0.06,ttfb:700}},
    opr:{ok:true,score:4.3,rank:812345}};
}
function sampleMine(){
  const m=monthsBack(12), base=[8.2,8.9,9.4,10.1,9.8,11.2,12.4,12.1,13.6,14.8,16.2,9.1].map(v=>Math.round(v*1000));
  return {siteName:'example.com',site:'sc-domain:example.com',property:'properties/0',
    monthly:{ok:true,rows:m.map((x,i)=>({month:x,sessions:base[i],users:Math.round(base[i]*.74),newUsers:Math.round(base[i]*.52),duration:96+i*3,bounce:.46-i*.004,pages:2.4+i*.03}))},
    searchMonthly:{ok:true,rows:m.map((x,i)=>({month:x,clicks:Math.round(base[i]*.55),impressions:base[i]*14,position:Math.max(6,18.4-i*.9)}))},
    keywords:{ok:true,rows:[['seo audit tool free',820,9400,8.7],['meta tag generator',610,7200,6.1],['schema generator',430,6100,9.8],['robots.txt generator',380,3900,4.2],['website traffic checker free',290,8800,14.6],['hashtag generator instagram',260,5200,11.3],['local seo checklist',190,2100,5.4],['what is canonical tag',160,4300,7.9]].map(([keyword,clicks,impressions,position])=>({keyword,clicks,impressions,ctr:clicks/impressions,position}))},
    channels:{ok:true,rows:[['Organic Search',8120],['Direct',3240],['Organic Social',1260],['Referral',820],['Unassigned',310],['Email',210]].map(([channel,sessions])=>({channel,sessions}))},
    sources:{ok:true,rows:[['google','organic',7480],['(direct)','(none)',3240],['instagram.com','referral',840],['bing','organic',520],['chatgpt.com','referral',410],['linkedin.com','referral',260]].map(([source,medium,sessions])=>({source,medium,sessions}))},
    countries:{ok:true,rows:[['in','India',9820],['us','United States',1640],['ae','United Arab Emirates',820],['gb','United Kingdom',610],['ca','Canada',420],['au','Australia',310],['sg','Singapore',240],['np','Nepal',180]].map(([code,name,sessions])=>({code,name,sessions,users:Math.round(sessions*.8)}))},
    devices:{ok:true,rows:[{device:'mobile',sessions:9420},{device:'desktop',sessions:4880},{device:'tablet',sessions:240}]},
    ai:{ok:true,rows:m.flatMap((x,i)=>[['ChatGPT',60+i*28],['Perplexity',18+i*9],['Gemini',12+i*7],['Copilot',8+i*3],['Claude',4+i*4]].map(([source,v])=>({date:x,source,visits:i===11?Math.round(v*.6):v}))),
      pages:[{page:'/seo-audit',sessions:640,platforms:['ChatGPT','Perplexity']},{page:'/blog/robots-txt-guide',sessions:310,platforms:['ChatGPT','Gemini']},{page:'/schema-generator',sessions:220,platforms:['ChatGPT','Claude']},{page:'/blog/title-tag-guide',sessions:140,platforms:['Perplexity']}]}};
}

/* ---------- modes ---------- */
let mode='any', status={sources:{},google:false,signedIn:false,email:''};
function setStatus(msg,err){ const el=$('tr-status'); el.hidden=!msg; el.innerHTML=msg||''; el.classList.toggle('err',!!err); }
function setMode(m,push){
  mode=m;
  $('tab-any').setAttribute('aria-selected',m==='any'); $('tab-mine').setAttribute('aria-selected',m==='mine');
  $('pane-any').hidden=m!=='any'; $('pane-mine').hidden=m!=='mine';
  $('rep-any').hidden=m!=='any'; $('rep-mine').hidden=m!=='mine';
  setStatus('');
  refreshBanner();
  if(m==='mine') renderConnect();
  if(push){ try{ const u=new URL(location.href); u.searchParams.set('mode',m); if(m==='mine') u.searchParams.delete('domain'); history.replaceState(null,'',u); }catch(e){} }
  requestAnimationFrame(()=>{ if(m==='any'&&anyData) renderAny(anyData,anySample); if(m==='mine'&&mineData) renderMine(mineData,mineSample); });
}
function refreshBanner(){
  const sample=mode==='any'?anySample:mineSample;
  $('tr-sample').hidden=!sample;
  $('tr-sample-why').textContent=mode==='any'?'Enter any website above to see its real popularity data.':
    (!status.google?'Real data appears here once Google sign-in is set up on this server.':!status.signedIn?'Sign in with Google to see your own website.':'Choose your site above and select Show report.');
}
['any','mine'].forEach(m=>$('tab-'+m).addEventListener('click',()=>setMode(m,true)));
document.addEventListener('click',e=>{ const b=e.target.closest('[data-goto]'); if(b){ setMode(b.dataset.goto,true); scrollTo({top:0,behavior:'smooth'}); } });
document.querySelector('.modes').addEventListener('keydown',e=>{ if(e.key==='ArrowRight'||e.key==='ArrowLeft'){ const n=mode==='any'?'mine':'any'; setMode(n,true); $('tab-'+n).focus(); } });

/* any website: run */
$('any-form').addEventListener('submit',async e=>{
  e.preventDefault();
  const domain=$('any-domain').value.trim().replace(/^[a-z]+:\/\//i,'').replace(/^www\./i,'').split(/[/?#]/)[0].toLowerCase();
  if(!domain||!/\./.test(domain)){ setStatus('Enter a website domain, for example example.com.',true); $('any-domain').focus(); return; }
  const btn=$('any-go'); btn.disabled=true; btn.innerHTML='<span class="spin"></span> Checking';
  setStatus(`<span class="spin"></span> Getting free data for ${esc(domain)}…`); $('rep-any').classList.add('loading');
  try{ const r=await api('/api/popularity?domain='+encodeURIComponent(domain)); renderAny(r,false); refreshBanner(); setStatus('');
    try{ const u=new URL(location.href); u.searchParams.set('mode','any'); u.searchParams.set('domain',r.domain); history.replaceState(null,'',u); }catch(err){} }
  catch(err){ setStatus(esc(err.message),true); }
  finally{ $('rep-any').classList.remove('loading'); btn.disabled=false; btn.textContent='Check website'; }
});

/* my website: connect panel */
let props=null;
async function renderConnect(){
  const box=$('mine-connect');
  if(!status.google){ box.innerHTML=`<div class="gbox"><div><b>Google sign-in is not set up yet.</b><p>The site owner needs to add Google OAuth keys to the server. Until then, this shows a sample report.</p></div></div>`; return; }
  if(!status.signedIn){ box.innerHTML=`<div class="gbox"><div><b>Connect your website with Google</b><p>Read-only access to Search Console and Google Analytics. Rankdesk can't change anything, and nothing is saved on our servers.</p></div><a class="btn gbtn" href="/auth/google"><svg viewBox="0 0 18 18" aria-hidden="true"><path d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5Z" fill="#4285F4"/><path d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3A9 9 0 0 0 9 18Z" fill="#34A853"/><path d="M3.9 10.7a5.4 5.4 0 0 1 0-3.4V5H.9a9 9 0 0 0 0 8l3-2.3Z" fill="#FBBC05"/><path d="M9 3.6c1.3 0 2.5.5 3.5 1.4l2.6-2.6A9 9 0 0 0 .9 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6Z" fill="#EA4335"/></svg>Sign in with Google</a></div>`; return; }
  box.innerHTML=`<div class="gbox"><div><b>Signed in${status.email?' as '+esc(status.email):''}</b><p id="g-loading"><span class="spin"></span> Loading your sites…</p></div><button type="button" class="linkbtn" id="g-out">Sign out</button></div>`;
  $('g-out').addEventListener('click',async()=>{ try{ await fetch('/auth/google/logout',{method:'POST'}); }catch(e){} status.signedIn=false; props=null; renderMine(sampleMine(),true); refreshBanner(); renderConnect(); });
  try{ props=props||await api('/api/own/properties'); }
  catch(err){ $('g-loading').innerHTML=esc(err.message); if(err.message&&/sign in/i.test(err.message)){ status.signedIn=false; renderConnect(); } return; }
  const sites=props.sites?.ok?props.sites.rows:[], ga=props.ga?.ok?props.ga.rows:[];
  const host=(store.get()||{}).host||'';
  const pickSite=sites.find(s=>host&&s.name.includes(host))||sites[0], pickGa=ga.find(p=>host&&p.name.toLowerCase().includes(host.split('.')[0]))||ga[0];
  $('g-loading').outerHTML=`<form class="gpick" id="g-form">
    <label>Search Console site<select id="g-site"><option value="">None</option>${sites.map(s=>`<option value="${esc(s.id)}"${s===pickSite?' selected':''}>${esc(s.name)}</option>`).join('')}</select></label>
    <label>Analytics property<select id="g-prop"><option value="">None</option>${ga.map(p=>`<option value="${esc(p.id)}"${p===pickGa?' selected':''}>${esc(p.name)} · ${esc(p.account)}</option>`).join('')}</select></label>
    <button class="btn" type="submit" id="g-go">Show report</button></form>
    ${!sites.length?`<p class="note small">${props.sites?.ok?'No Search Console sites found in this Google account.':esc(props.sites?.error||'')}</p>`:''}
    ${!ga.length?`<p class="note small">${props.ga?.ok?'No Google Analytics properties found in this Google account.':esc(props.ga?.error||'')}</p>`:''}`;
  $('g-form').addEventListener('submit',async e=>{
    e.preventDefault();
    const site=$('g-site').value, property=$('g-prop').value;
    if(!site&&!property){ setStatus('Choose a Search Console site or an Analytics property.',true); return; }
    const btn=$('g-go'); btn.disabled=true; btn.innerHTML='<span class="spin"></span> Loading';
    setStatus('<span class="spin"></span> Getting your data from Google…'); $('rep-mine').classList.add('loading');
    try{ const r=await api(`/api/own/report?site=${encodeURIComponent(site)}&property=${encodeURIComponent(property)}`);
      r.siteName=(sites.find(s=>s.id===site)||{}).name||(ga.find(p=>p.id===property)||{}).name||'';
      renderMine(r,false); refreshBanner(); setStatus(''); $('rep-mine').scrollIntoView({behavior:'smooth',block:'start'}); }
    catch(err){ setStatus(esc(err.message),true); }
    finally{ $('rep-mine').classList.remove('loading'); btn.disabled=false; btn.textContent='Show report'; }
  });
}

let rt; addEventListener('resize',()=>{ clearTimeout(rt); rt=setTimeout(()=>{ if(mode==='any'&&anyData) renderAny(anyData,anySample); if(mode==='mine'&&mineData) renderMine(mineData,mineSample); },200); });

(async function init(){
  const q=new URLSearchParams(location.search);
  renderAny(sampleAny(),true); renderMine(sampleMine(),true);
  try{ status=await api('/api/traffic/status'); }catch(e){}
  const saved=store.get(); if(saved&&saved.host) $('any-domain').value=saved.host;
  setMode(q.get('mode')==='mine'?'mine':'any',false);
  if(q.get('gerror')){ setStatus(esc(q.get('gerror')),true); try{ const u=new URL(location.href); u.searchParams.delete('gerror'); history.replaceState(null,'',u); }catch(e){} }
  if(q.get('domain')&&mode==='any'){ $('any-domain').value=q.get('domain'); $('any-form').requestSubmit(); }
})();
})();
