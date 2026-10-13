/* Website traffic checker: fetches a Similarweb report through /api/traffic and draws it.
   Until a real report loads, the page shows a clearly labelled sample report. */
(function(){
'use strict';
const {$,esc,api,store}=RD;
const SVGNS='http://www.w3.org/2000/svg';
const ACCENT='#2448f5';
// categorical order for AI platforms (validated set); platforms past six fold into "Other"
const CAT=['#2a78d6','#eb6834','#1baf7a','#eda100','#e87ba4','#008300'], OTHER='#8a93a5';
const regionName=(()=>{ try{ const d=new Intl.DisplayNames(['en'],{type:'region'}); return c=>{ try{ return c==='ww'?'Worldwide':d.of(c.toUpperCase())||c.toUpperCase(); }catch(e){ return c.toUpperCase(); } }; }catch(e){ return c=>c.toUpperCase(); } })();
const flag=c=>/^[a-z]{2}$/.test(c)&&c!=='ww'?String.fromCodePoint(...[...c.toUpperCase()].map(x=>0x1F1E6+x.charCodeAt(0)-65)):'🌐';

/* ---------- number formatting ---------- */
const compact=n=>{ if(n==null||isNaN(n)) return '–'; const a=Math.abs(n);
  if(a>=1e9) return (n/1e9).toFixed(a>=1e10?0:1).replace(/\.0$/,'')+'B';
  if(a>=1e6) return (n/1e6).toFixed(a>=1e7?0:1).replace(/\.0$/,'')+'M';
  if(a>=1e3) return (n/1e3).toFixed(a>=1e4?0:1).replace(/\.0$/,'')+'K';
  return String(Math.round(n)); };
const full=n=>n==null||isNaN(n)?'–':Math.round(n).toLocaleString('en-IN');
const pct=(x,d=1)=>x==null||isNaN(x)?'–':(x*100).toFixed(x*100<10&&x>0?d:0)+'%';
const dur=s=>{ if(s==null||isNaN(s)) return '–'; s=Math.round(s); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const mLabel=(ym,withYear)=>{ const [y,m]=ym.split('-').map(Number); return MONTHS[m-1]+(withYear?' '+String(y).slice(2):''); };
const mLong=ym=>{ const [y,m]=ym.split('-').map(Number); return MONTHS[m-1]+' '+y; };
const niceStep=x=>{ const p=Math.pow(10,Math.floor(Math.log10(x||1))), f=x/p; return (f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*p; };
const svg=(tag,attrs,parent)=>{ const e=document.createElementNS(SVGNS,tag); for(const k in attrs) e.setAttribute(k,attrs[k]); if(parent) parent.appendChild(e); return e; };

/* ---------- tooltip ---------- */
const tt=$('tt');
function showTip(html,x,y){ tt.innerHTML=html; tt.hidden=false; const r=tt.getBoundingClientRect(); let left=x+14, top=y-r.height-12; if(left+r.width>innerWidth-8) left=x-r.width-14; if(top<8) top=y+16; tt.style.left=left+'px'; tt.style.top=top+'px'; }
function hideTip(){ tt.hidden=true; }

/* ---------- charts ---------- */
function lineChart(el,pts){
  el.innerHTML=''; if(!pts.length){ el.innerHTML='<p class="note">No visit data for this period.</p>'; return; }
  const W=Math.max(280,el.clientWidth), H=Math.round(Math.min(300,Math.max(220,W*0.42))), P={l:48,r:18,t:18,b:30};
  const max=Math.max(...pts.map(p=>p.value||0)); const step=niceStep(max/4)||1; const top=Math.ceil(max/step)*step||1;
  const x=i=>P.l+(pts.length===1?(W-P.l-P.r)/2:i*(W-P.l-P.r)/(pts.length-1)), y=v=>P.t+(H-P.t-P.b)*(1-(v||0)/top);
  const s=svg('svg',{viewBox:`0 0 ${W} ${H}`,width:W,height:H,class:'chart-svg'},el);
  const defs=svg('defs',{},s); const g=svg('linearGradient',{id:'vfill',x1:0,y1:0,x2:0,y2:1},defs);
  svg('stop',{offset:'0%','stop-color':ACCENT,'stop-opacity':.18},g); svg('stop',{offset:'100%','stop-color':ACCENT,'stop-opacity':0},g);
  for(let v=0;v<=top+1e-9;v+=step){ svg('line',{x1:P.l,x2:W-P.r,y1:y(v),y2:y(v),class:'grid'},s); const t=svg('text',{x:P.l-8,y:y(v)+4,class:'ax','text-anchor':'end'},s); t.textContent=compact(v); }
  const every=W<480?3:W<720?2:1;
  pts.forEach((p,i)=>{ if(i%every&&i!==pts.length-1) return; const t=svg('text',{x:x(i),y:H-8,class:'ax','text-anchor':'middle'},s); t.textContent=mLabel(p.label,i===0||p.label.endsWith('-01')); });
  const line=pts.map((p,i)=>`${i?'L':'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join('');
  svg('path',{d:`${line}L${x(pts.length-1)},${y(0)}L${x(0)},${y(0)}Z`,fill:'url(#vfill)'},s);
  const path=svg('path',{d:line,class:'ln',stroke:ACCENT},s);
  const len=path.getTotalLength?path.getTotalLength():0; if(len&&!matchMedia('(prefers-reduced-motion: reduce)').matches){ path.style.strokeDasharray=len; path.style.strokeDashoffset=len; requestAnimationFrame(()=>{ path.style.transition='stroke-dashoffset 1.2s cubic-bezier(.2,.7,.2,1)'; path.style.strokeDashoffset=0; }); }
  const li=pts.length-1; svg('circle',{cx:x(li),cy:y(pts[li].value),r:5,fill:ACCENT,stroke:'#fff','stroke-width':2},s);
  const lab=svg('text',{x:x(li)-8,y:y(pts[li].value)-12,class:'endlab','text-anchor':'end'},s); lab.textContent=compact(pts[li].value);
  const cross=svg('line',{y1:P.t,y2:H-P.b,class:'cross'},s), dot=svg('circle',{r:5,fill:'#fff',stroke:ACCENT,'stroke-width':2.5,class:'hdot'},s);
  const hit=svg('rect',{x:P.l,y:0,width:W-P.l-P.r,height:H,fill:'transparent'},s);
  const move=e=>{ const r=s.getBoundingClientRect(), mx=(e.clientX-r.left)*W/r.width; const i=Math.max(0,Math.min(li,Math.round((mx-P.l)/((W-P.l-P.r)/Math.max(1,li))))); const p=pts[i];
    cross.setAttribute('x1',x(i)); cross.setAttribute('x2',x(i)); dot.setAttribute('cx',x(i)); dot.setAttribute('cy',y(p.value)); s.classList.add('hov');
    const prev=pts[i-1]; const ch=prev&&prev.value?(p.value-prev.value)/prev.value:null;
    showTip(`<b>${mLong(p.label)}</b><span>${full(p.value)} visits</span>${ch==null?'':`<span class="${ch>=0?'up':'down'}">${ch>=0?'▲':'▼'} ${pct(Math.abs(ch))} vs ${mLabel(prev.label)}</span>`}`,e.clientX,e.clientY); };
  hit.addEventListener('pointermove',move); hit.addEventListener('pointerleave',()=>{ s.classList.remove('hov'); hideTip(); });
}

function stackChart(el,months,series){
  el.innerHTML=''; if(!months.length||!series.length){ el.innerHTML='<p class="note">No AI chatbot traffic recorded for this website and period.</p>'; return; }
  const W=Math.max(280,el.clientWidth), H=Math.round(Math.min(280,Math.max(210,W*0.45))), P={l:44,r:10,t:14,b:30};
  const totals=months.map((m,i)=>series.reduce((a,sr)=>a+(sr.values[i]||0),0)); const max=Math.max(...totals);
  const step=niceStep(max/4)||1, top=Math.ceil(max/step)*step||1;
  const band=(W-P.l-P.r)/months.length, bw=Math.min(38,band*0.62), y=v=>P.t+(H-P.t-P.b)*(1-v/top);
  const s=svg('svg',{viewBox:`0 0 ${W} ${H}`,width:W,height:H,class:'chart-svg'},el);
  for(let v=0;v<=top+1e-9;v+=step){ svg('line',{x1:P.l,x2:W-P.r,y1:y(v),y2:y(v),class:'grid'},s); const t=svg('text',{x:P.l-8,y:y(v)+4,class:'ax','text-anchor':'end'},s); t.textContent=compact(v); }
  const every=W<480?3:W<720?2:1;
  months.forEach((m,i)=>{
    const cx=P.l+band*i+band/2; let acc=0; const g=svg('g',{class:'col'},s);
    series.forEach((sr,k)=>{ const v=sr.values[i]||0; if(!v) return; const y0=y(acc), y1=y(acc+v); acc+=v;
      const r=svg('rect',{x:cx-bw/2,y:y1,width:bw,height:Math.max(0,y0-y1),fill:sr.color,rx:2,stroke:'#fff','stroke-width':1.5,class:'seg'},g); r.style.setProperty('--i',i); });
    if(i%every===0||i===months.length-1){ const t=svg('text',{x:cx,y:H-8,class:'ax','text-anchor':'middle'},s); t.textContent=mLabel(m,i===0||m.endsWith('-01')); }
    const hit=svg('rect',{x:P.l+band*i,y:P.t,width:band,height:H-P.t-P.b,fill:'transparent'},s);
    hit.addEventListener('pointermove',e=>{ g.classList.add('on'); showTip(`<b>${mLong(m)}</b>`+series.filter(sr=>sr.values[i]).sort((a,b)=>b.values[i]-a.values[i]).map(sr=>`<span><i style="background:${sr.color}"></i>${esc(sr.name)} <em>${full(sr.values[i])}</em></span>`).join('')+`<span class="tot">Total <em>${full(totals[i])}</em></span>`,e.clientX,e.clientY); });
    hit.addEventListener('pointerleave',()=>{ g.classList.remove('on'); hideTip(); });
  });
}

function bars(el,items,fmt,opts={}){
  if(!items.length){ el.innerHTML=`<p class="note">${opts.empty||'No data for this website.'}</p>`; return; }
  const max=Math.max(...items.map(x=>x.value||0))||1;
  el.innerHTML=`<div class="hbars">${items.map((x,i)=>`<div class="hb" style="--w:${((x.value||0)/max*100).toFixed(1)}%;--i:${i}" title="${esc(x.label)}: ${esc(fmt(x.value))}${x.sub?' · '+esc(x.sub):''}">
    <span class="hb-l">${x.icon?`<span class="hb-ico" aria-hidden="true">${x.icon}</span>`:''}${esc(x.label)}</span><span class="hb-t"><i></i></span><span class="hb-v">${esc(fmt(x.value))}${x.sub?`<small>${esc(x.sub)}</small>`:''}</span></div>`).join('')}</div>`;
}

/* ---------- report rendering ---------- */
let current=null;
function sectionError(sec,what){
  if(!sec||sec.ok) return '';
  const msg=/no data|not found|404|insufficient/i.test(sec.error||'')?`Similarweb has no ${what} data for this website.`:esc(sec.error||'This section could not be loaded.');
  return `<p class="note">${msg}</p>`;
}
function render(r,{sample=false}={}){
  current=r;
  $('tr-sample').hidden=!sample;
  $('tr-report').classList.toggle('is-sample',sample);
  $('tr-report').classList.remove('loading');
  $('tr-title').textContent=r.domain; $('tr-fav').textContent=(r.domain[0]||'?').toUpperCase();
  $('tr-sub').textContent=`${regionName(r.country)} · ${mLong(r.month)} · ${sample?'sample data':'Similarweb estimates'+(r.cached?' (cached)':'')}`;
  $('tr-csv').disabled=false;

  // KPIs
  const eng=r.engagement||[], last=eng[eng.length-1]||{}, prev=eng[eng.length-2]||{};
  const ch=prev.visits?(last.visits-prev.visits)/prev.visits:null;
  const aiRows=(r.ai&&r.ai.ok&&r.ai.rows)||[]; const aiLast=aiRows.filter(x=>x.date===r.month).reduce((a,x)=>a+x.visits,0);
  const k=(label,val,sub,cls='')=>`<div class="kpi ${cls}"><span class="kpi-l">${label}</span><b>${val}</b>${sub?`<span class="kpi-s">${sub}</span>`:''}</div>`;
  $('tr-kpis').innerHTML=[
    k('Monthly visits',compact(last.visits),ch==null?mLong(r.month):`<span class="${ch>=0?'up':'down'}">${ch>=0?'▲':'▼'} ${pct(Math.abs(ch))}</span> vs ${mLabel(prev.date)}`,'kpi-main'),
    k('Unique visitors',compact(last.unique),last.unique&&last.visits?(last.visits/last.unique).toFixed(1)+' visits each':''),
    k('Avg. visit',dur(last.duration),'minutes : seconds'),
    k('Pages per visit',last.pages==null?'–':Number(last.pages).toFixed(2),''),
    k('Bounce rate',pct(last.bounce,0),'left after one page'),
    k('AI visits',aiRows.length?compact(aiLast):'–',aiRows.length&&last.visits?pct(aiLast/last.visits,2)+' of all visits':'from AI chatbots')
  ].join('');

  // visits over time
  const pts=eng.filter(x=>x.visits!=null).map(x=>({label:x.date,value:x.visits}));
  $('tr-visits-range').textContent=pts.length?`${mLong(pts[0].label)} – ${mLong(pts[pts.length-1].label)}`:'';
  lineChart($('ch-visits'),pts);

  // ranks
  const rk=r.rank;
  if(rk&&rk.ok){
    const tile=(l,v,s)=>`<div class="rank"><span>${l}</span><b>${v==null?'–':'#'+full(v)}</b>${s?`<small>${esc(s)}</small>`:''}</div>`;
    const cat=(rk.category||'').replace(/_/g,' ').replace(/\//g,' › ');
    $('tr-rank').innerHTML=tile('Global rank',rk.global,'all websites')+(r.country!=='ww'?tile(regionName(r.country)+' rank',rk.country,'in this country'):'')+tile('Category rank',rk.categoryRank,cat);
  } else $('tr-rank').innerHTML=sectionError(rk,'ranking');

  // devices
  const dv=r.devices;
  if(dv&&dv.ok&&(dv.desktop||dv.mobile)){
    const t=(dv.desktop||0)+(dv.mobile||0), d=(dv.desktop||0)/t, m=1-d;
    $('tr-dev-month').textContent=mLong(r.month);
    $('tr-devices').innerHTML=`<div class="split"><i style="flex:${d};background:${CAT[0]}"></i><i style="flex:${m};background:${CAT[1]}"></i></div>
      <div class="split-l"><span><i style="background:${CAT[0]}"></i>Desktop <b>${pct(d,0)}</b> <em>${compact(dv.desktop)}</em></span><span><i style="background:${CAT[1]}"></i>Mobile <b>${pct(m,0)}</b> <em>${compact(dv.mobile)}</em></span></div>`;
  } else $('tr-devices').innerHTML=sectionError(dv,'device');

  // channels
  const chn=r.channels;
  if(chn&&chn.ok){
    const by={}; chn.rows.forEach(x=>{ by[x.channel]=(by[x.channel]||0)+x.share; });
    bars($('tr-channels'),Object.entries(by).sort((a,b)=>b[1]-a[1]).map(([label,value])=>({label,value})),v=>pct(v),{empty:'No traffic source data for this website.'});
    const top=chn.rows.slice().sort((a,b)=>b.share-a.share).slice(0,8);
    $('tr-sources').innerHTML=top.length?`<ol class="srclist">${top.map(x=>`<li><span>${esc(x.source||'Direct')}</span><em>${esc(x.channel)}</em><b>${pct(x.share)}</b></li>`).join('')}</ol>`:'';
  } else { $('tr-channels').innerHTML=sectionError(chn,'traffic source'); $('tr-sources').innerHTML=''; }

  // geography
  const geo=r.geo;
  if(geo&&geo.ok){
    const rows=geo.rows.slice().sort((a,b)=>(b.share||0)-(a.share||0));
    bars($('tr-geo'),rows.slice(0,5).map(x=>({label:x.name||regionName(x.country),value:x.share,icon:flag(x.country),sub:x.visits!=null?compact(x.visits)+' visits':''})),v=>pct(v),{empty:'No country data for this website.'});
    $('tr-geo-tbl').innerHTML=rows.slice(0,10).map(x=>`<tr><td>${flag(x.country)} ${esc(x.name||regionName(x.country))}</td><td class="num">${pct(x.share)}</td><td class="num">${full(x.visits)}</td></tr>`).join('');
  } else { $('tr-geo').innerHTML=sectionError(geo,'country'); $('tr-geo-tbl').innerHTML=''; }

  // keywords
  const kw=r.keywords;
  if(kw&&kw.ok&&kw.rows.length){
    const maxS=Math.max(...kw.rows.map(x=>x.share||0))||1;
    $('tr-kw-count').textContent=`Top ${Math.min(kw.rows.length,50)} by clicks · ${mLong(r.month)}`;
    $('tr-kw').innerHTML=kw.rows.slice(0,50).map(x=>{ let path=''; try{ path=x.url?new URL(/^https?:/.test(x.url)?x.url:'https://'+x.url).pathname:''; }catch(e){ path=x.url; }
      return `<tr><td class="k">${esc(x.keyword)}</td><td class="num">${x.position==null?'–':Number(x.position).toFixed(x.position<10?1:0)}</td><td class="num">${compact(x.clicks)}</td>
      <td><span class="sharebar"><i style="width:${((x.share||0)/maxS*100).toFixed(1)}%"></i></span><span class="sharev">${pct(x.share,2)}</span></td>
      <td>${x.intent?`<span class="intent i-${esc(intentClass(x.intent))}">${esc(x.intent)}</span>`:'–'}</td><td class="url">${x.url?`<a href="${esc(/^https?:/.test(x.url)?x.url:'https://'+x.url)}" target="_blank" rel="noopener">${esc(path||'/')}</a>`:'–'}</td></tr>`; }).join('');
  } else { $('tr-kw-count').textContent=''; $('tr-kw').innerHTML=`<tr><td colspan="6">${kw&&!kw.ok?sectionError(kw,'keyword'):'<p class="note">No keyword data for this website and country.</p>'}</td></tr>`; }

  // AI traffic
  const ai=r.ai;
  if(ai&&ai.ok&&ai.rows.length){
    const months=[...new Set(ai.rows.map(x=>x.date))].sort();
    const totalBy={}; ai.rows.forEach(x=>{ totalBy[x.source]=(totalBy[x.source]||0)+x.visits; });
    const order=Object.keys(totalBy).sort((a,b)=>totalBy[b]-totalBy[a]);
    const main=order.slice(0,CAT.length), rest=order.slice(CAT.length);
    const series=main.map((name,i)=>({name,color:CAT[i],values:months.map(m=>ai.rows.filter(x=>x.date===m&&x.source===name).reduce((a,x)=>a+x.visits,0))}));
    if(rest.length) series.push({name:'Other',color:OTHER,values:months.map(m=>ai.rows.filter(x=>x.date===m&&rest.includes(x.source)).reduce((a,x)=>a+x.visits,0))});
    $('tr-ai-legend').innerHTML=series.map(sr=>`<span><i style="background:${sr.color}"></i>${esc(sr.name)}</span>`).join('');
    $('tr-ai-total').textContent=`${compact(series.reduce((a,sr)=>a+sr.values.reduce((x,y)=>x+y,0),0))} AI visits in 12 months`;
    stackChart($('ch-ai'),months,series);
    const lastIdx=months.length-1, lastTot=series.reduce((a,sr)=>a+(sr.values[lastIdx]||0),0)||1;
    $('tr-ai-tbl').innerHTML=series.map(sr=>`<tr><td><i class="sw" style="background:${sr.color}"></i>${esc(sr.name)}</td><td class="num">${full(sr.values[lastIdx])}</td><td class="num">${pct((sr.values[lastIdx]||0)/lastTot)}</td><td class="num">${full(sr.values.reduce((a,b)=>a+b,0))}</td></tr>`).join('');
  } else { $('tr-ai-legend').innerHTML=''; $('tr-ai-total').textContent=''; $('ch-ai').innerHTML=ai&&!ai.ok?sectionError(ai,'AI traffic'):'<p class="note">No AI chatbot traffic recorded for this website and period.</p>'; $('tr-ai-tbl').innerHTML=''; }

  // prompts
  const pr=r.prompts;
  if(pr&&pr.ok){
    $('tr-prompts').innerHTML=pr.rows.length?`<ol class="prompts">${pr.rows.map(x=>`<li><p>“${esc(x.prompt)}”</p><div>${(x.llms||[]).map(l=>`<span class="pchip">${esc(l)}</span>`).join('')}${x.cited?'<span class="pill pass">Cited</span>':'<span class="pill src">Mentioned</span>'}<em>${x.count} ${x.count===1?'answer':'answers'}</em></div></li>`).join('')}</ol>`
      :`<p class="note">None of the ${full(pr.total)} prompts tracked in your Similarweb campaign mentioned or cited this website in the last 30 days.</p>`;
  } else if(pr&&pr.code==='no_campaign'){
    $('tr-prompts').innerHTML=`<div class="empty-mini"><b>Prompt tracking is not connected.</b><p>Similarweb reports prompts from a Gen AI tracking campaign. Create a campaign in Similarweb, then add its ID as <code>SIMILARWEB_PROMPT_CAMPAIGN_ID</code> on the server.</p></div>`;
  } else $('tr-prompts').innerHTML=sectionError(pr,'prompt');

  $('tr-foot').textContent=sample?'Sample report: every number on this page is made up to show the layout.':`Similarweb estimates${r.dataType?' ('+r.dataType+')':''} for ${mLong(r.month)}${r.lastUpdated?', data updated '+r.lastUpdated:''}. Compare websites and trends rather than reading them as exact counts.`;
}
const intentClass=i=>/transac/i.test(i)?'Transactional':/commerc/i.test(i)?'Commercial':'Informational';

/* ---------- CSV export ---------- */
$('tr-csv').addEventListener('click',()=>{
  const r=current; if(!r) return;
  const q=v=>`"${String(v??'').replace(/"/g,'""')}"`, L=[];
  L.push(['Rankdesk traffic report',r.domain,regionName(r.country),mLong(r.month)].map(q).join(','),'');
  L.push('Month,Visits,Unique visitors,Avg visit (s),Pages per visit,Bounce rate'); (r.engagement||[]).forEach(x=>L.push([x.date,x.visits,x.unique,x.duration,x.pages,x.bounce].map(q).join(',')));
  if(r.channels?.ok){ L.push('','Source,Channel,Share'); r.channels.rows.forEach(x=>L.push([x.source,x.channel,x.share].map(q).join(','))); }
  if(r.geo?.ok){ L.push('','Country,Share,Visits'); r.geo.rows.forEach(x=>L.push([x.name||regionName(x.country),x.share,x.visits].map(q).join(','))); }
  if(r.keywords?.ok){ L.push('','Keyword,Position,Clicks,Traffic share,Intent,Top URL'); r.keywords.rows.forEach(x=>L.push([x.keyword,x.position,x.clicks,x.share,x.intent,x.url].map(q).join(','))); }
  if(r.ai?.ok){ L.push('','Month,AI platform,Visits,Share'); r.ai.rows.forEach(x=>L.push([x.date,x.source,x.visits,x.share].map(q).join(','))); }
  const blob=new Blob([L.join('\n')],{type:'text/csv'}); const a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download=`${r.domain}-traffic-${r.month}${$('tr-report').classList.contains('is-sample')?'-sample':''}.csv`; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();},500);
});

/* ---------- sample report (made-up numbers, always labelled) ---------- */
function sample(){
  const d=new Date(); d.setUTCDate(1); const ym=n=>{ const x=new Date(d); x.setUTCMonth(x.getUTCMonth()-n); return x.toISOString().slice(0,7); };
  const months=Array.from({length:12},(_,i)=>ym(12-i));
  const base=[182,175,190,204,198,221,236,229,248,262,281,297].map(v=>v*1000);
  return {domain:'example.com',country:'ww',month:months[11],
    engagement:months.map((m,i)=>({date:m,visits:base[i],unique:base[i]*0.58,duration:142+i*2,pages:2.8+i*0.03,bounce:0.52-i*0.004})),
    devices:{ok:true,desktop:118000,mobile:179000},
    rank:{ok:true,global:84213,country:null,category:'Computers_Electronics_and_Technology/Programming_and_Developer_Software',categoryRank:1204},
    channels:{ok:true,rows:[{source:'google.com',channel:'Search - Organic',share:.46},{source:'',channel:'Direct',share:.27},{source:'bing.com',channel:'Search - Organic',share:.04},{source:'instagram.com',channel:'Social - Organic',share:.06},{source:'youtube.com',channel:'Social - Organic',share:.03},{source:'chatgpt.com',channel:'Gen AI',share:.035},{source:'perplexity.ai',channel:'Gen AI',share:.01},{source:'news.example.org',channel:'Referrals',share:.05},{source:'google.com',channel:'Search - Paid',share:.025},{source:'gmail.com',channel:'Email',share:.02}]},
    geo:{ok:true,rows:[['in',.41],['us',.17],['gb',.07],['ae',.05],['ca',.04],['au',.035],['de',.03],['sg',.025],['pk',.02],['bd',.018]].map(([c,s])=>({country:c,name:'',share:s,visits:Math.round(297000*s)}))},
    keywords:{ok:true,rows:[['seo audit tool','Commercial',3.2,8400,.061],['free seo checker','Commercial',4.1,6100,.044],['meta tag generator','Transactional',2.4,5200,.038],['schema markup generator','Transactional',5.8,3900,.028],['robots txt generator','Transactional',3.6,3100,.022],['what is canonical tag','Informational',6.2,2400,.017],['instagram hashtag generator','Transactional',8.9,2100,.015],['website traffic checker','Commercial',11.4,1800,.013],['keyword ideas free','Commercial',9.1,1500,.011],['local seo checklist','Informational',4.7,1300,.009]].map(([keyword,intent,position,clicks,share])=>({keyword,intent,position,clicks,share,url:'https://example.com/'+keyword.split(' ').slice(0,2).join('-')}))},
    ai:{ok:true,rows:months.flatMap((m,i)=>[['ChatGPT',900+i*260],['Gemini',220+i*70],['Perplexity',180+i*55],['Copilot',120+i*20],['Claude',60+i*28]].map(([source,v])=>({date:m,source,visits:v,share:null})))},
    prompts:{ok:true,total:420,rows:[{prompt:'What is the best free SEO audit tool for small businesses?',llms:['ChatGPT','Perplexity'],count:9,cited:true},{prompt:'How do I generate schema markup for my shop?',llms:['ChatGPT'],count:6,cited:true},{prompt:'Free tools to check website traffic of competitors',llms:['Gemini','ChatGPT'],count:4,cited:false}]}};
}

/* ---------- loading a real report ---------- */
let status={configured:false,prompts:false};
function setStatus(msg,err){ const el=$('tr-status'); el.hidden=!msg; el.innerHTML=msg||''; el.classList.toggle('err',!!err); }
async function run(domain,country){
  if(!status.configured){
    setStatus('Traffic data is not switched on yet. The site owner needs to add a Similarweb API key.',true);
    $('tr-sample-why').textContent='Real traffic data will appear here once a Similarweb API key is added.';
    return;
  }
  const btn=$('tr-go'); btn.disabled=true; btn.innerHTML='<span class="spin"></span> Checking';
  setStatus(`<span class="spin"></span> Getting traffic data for ${esc(domain)}. This can take up to 20 seconds.`);
  $('tr-report').classList.add('loading');
  try{
    const r=await api(`/api/traffic?domain=${encodeURIComponent(domain)}&country=${encodeURIComponent(country)}`);
    render(r); setStatus('');
    try{ history.replaceState(null,'',`?domain=${encodeURIComponent(r.domain)}&country=${country}`); }catch(e){}
    $('tr-report').scrollIntoView({behavior:'smooth',block:'start'});
  }catch(err){ setStatus(esc(err.message),true); $('tr-report').classList.remove('loading'); }
  finally{ btn.disabled=false; btn.textContent='Check traffic'; }
}
$('tr-form').addEventListener('submit',e=>{
  e.preventDefault();
  const domain=$('tr-domain').value.trim().replace(/^[a-z]+:\/\//i,'').replace(/^www\./i,'').split(/[/?#]/)[0];
  if(!domain||!/\./.test(domain)){ setStatus('Enter a website domain, for example example.com.',true); $('tr-domain').focus(); return; }
  run(domain.toLowerCase(),$('tr-country').value);
});
let rt; addEventListener('resize',()=>{ clearTimeout(rt); rt=setTimeout(()=>{ if(current) render(current,{sample:$('tr-report').classList.contains('is-sample')}); },200); });

(async function init(){
  render(sample(),{sample:true});
  try{ status=await api('/api/traffic/status'); }catch(e){}
  const q=new URLSearchParams(location.search);
  if(q.get('country')&&$('tr-country').querySelector(`option[value="${q.get('country')}"]`)) $('tr-country').value=q.get('country');
  const saved=store.get();
  if(q.get('domain')){ $('tr-domain').value=q.get('domain'); run(q.get('domain'),$('tr-country').value); }
  else if(saved&&saved.host) $('tr-domain').value=saved.host;
  if(!status.configured) $('tr-sample-why').textContent='Real traffic data will appear here once a Similarweb API key is added.';
})();
})();
