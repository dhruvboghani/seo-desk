/* SEO audit page: fetch the URL through the server, run the checks, render the report,
   and save the site's details so every tool page opens pre-filled. */
(function(){
'use strict';
const {$,esc,ICON,api,normUrl,store,extractSite}=RD;
const kb=b=>b>1048576?(b/1048576).toFixed(1)+' MB':Math.round(b/1024)+' KB';

function audit(html,ctx={}){
  const doc=new DOMParser().parseFromString(html,'text/html');
  const c=[]; const add=(status,label,detail,fix)=>c.push({status,label,detail,fix});
  const meta=n=>doc.querySelector(`meta[name="${n}" i]`)?.getAttribute('content')?.trim();
  const prop=p=>doc.querySelector(`meta[property="${p}" i]`)?.getAttribute('content')?.trim();

  const title=doc.querySelector('title')?.textContent.trim()||'';
  if(!title) add('fail','Title tag','No <title> found.','Add a unique title of 30–60 characters with the main keyword near the start.');
  else if(title.length<30) add('warn','Title tag',`"${title}" is ${title.length} characters, which is short.`,'Use 30–60 characters and include the main keyword and brand.');
  else if(title.length>60) add('warn','Title tag',`${title.length} characters. Google will likely cut it off.`,'Trim to 60 characters or fewer.');
  else add('pass','Title tag',`"${title}" (${title.length} characters)`);

  const desc=meta('description')||'';
  if(!desc) add('fail','Meta description','Missing.','Add 140–160 characters that summarise the page and invite the click.');
  else if(desc.length<70) add('warn','Meta description',`${desc.length} characters, which is short.`,'Aim for 140–160 characters.');
  else if(desc.length>160) add('warn','Meta description',`${desc.length} characters. Google will cut it off.`,'Trim to 160 characters or fewer.');
  else add('pass','Meta description',`${desc.length} characters`);

  const h1s=[...doc.querySelectorAll('h1')];
  if(!h1s.length) add('fail','H1 heading','No H1 on the page.','Add one H1 that states the page topic with the main keyword.');
  else if(h1s.length>1) add('warn','H1 heading',`${h1s.length} H1 tags found.`,'Keep one H1 and change the others to H2.');
  else add('pass','H1 heading',`"${h1s[0].textContent.trim()}"`);

  const hs=[...doc.querySelectorAll('h1,h2,h3,h4,h5,h6')];
  let skip=null, prev=0;
  hs.forEach(hd=>{const l=+hd.tagName[1]; if(prev&&l>prev+1&&!skip) skip=`H${prev} jumps to H${l} at "${hd.textContent.trim().slice(0,40)}"`; prev=l;});
  if(!hs.length) add('warn','Heading structure','No headings found.','Break the content up with H2 and H3 headings.');
  else if(skip) add('warn','Heading structure',skip+'.','Go down one level at a time (H1, then H2, then H3).');
  else add('pass','Heading structure',`${hs.length} headings in a logical order`);

  const imgs=[...doc.querySelectorAll('img')];
  const noAlt=imgs.filter(i=>!i.hasAttribute('alt'));
  if(!imgs.length) add('info','Image alt text','No images on the page.');
  else if(noAlt.length) add(noAlt.length/imgs.length>.5?'fail':'warn','Image alt text',`${noAlt.length} of ${imgs.length} images have no alt text: ${noAlt.slice(0,3).map(i=>i.getAttribute('src')).join(', ')}`,'Describe each image in a short phrase. Use alt="" only for decorative images.');
  else add('pass','Image alt text',`All ${imgs.length} images have alt text`);

  const canon=doc.querySelector('link[rel="canonical" i]')?.getAttribute('href');
  canon?add('pass','Canonical URL',canon):add('warn','Canonical URL','Missing.','Add <link rel="canonical" href="full page URL"> to prevent duplicate-content issues.');

  meta('viewport')?add('pass','Mobile viewport',meta('viewport')):add('fail','Mobile viewport','Missing. The page may not be treated as mobile-friendly.','Add <meta name="viewport" content="width=device-width, initial-scale=1">.');

  const lang=doc.documentElement.getAttribute('lang');
  lang?add('pass','Language',`lang="${lang}"`):add('warn','Language','No lang attribute on <html>.','Add lang="en" (or the page language) to the html tag.');

  const robots=meta('robots')||'';
  const xr=(ctx.headers&&ctx.headers['x-robots-tag'])||'';
  if(/noindex/i.test(robots)) add('fail','Indexing','robots meta says noindex. Google will not show this page.','Remove noindex if the page should rank.');
  else if(/noindex/i.test(xr)) add('fail','Indexing','The X-Robots-Tag server header says noindex. Google will not show this page.','Remove noindex from the server or CDN headers.');
  else add('pass','Indexing',robots?`robots: ${robots}`:'Indexable (no robots restriction)');

  const ogMiss=['og:title','og:description','og:image','og:url'].filter(p=>!prop(p));
  ogMiss.length?add(ogMiss.length>=3?'fail':'warn','Open Graph tags',`Missing: ${ogMiss.join(', ')}`,'These control the link preview on WhatsApp, Facebook and LinkedIn.'):add('pass','Open Graph tags','Title, description, image and URL are set');

  meta('twitter:card')?add('pass','Twitter card',meta('twitter:card')):add('warn','Twitter card','Missing.','Add <meta name="twitter:card" content="summary_large_image">.');

  const lds=[...doc.querySelectorAll('script[type="application/ld+json" i]')];
  if(!lds.length) add('warn','Structured data','No JSON-LD schema found.','Add LocalBusiness or Organization schema so Google understands who you are.');
  else{
    const types=[]; let bad=0;
    lds.forEach(s=>{try{const j=JSON.parse(s.textContent);(Array.isArray(j)?j:j['@graph']||[j]).forEach(o=>o['@type']&&types.push(o['@type']))}catch(e){bad++}});
    bad?add('fail','Structured data',`${bad} JSON-LD block(s) contain invalid JSON.`,'Fix the syntax and check with the Rich Results Test.'):add('pass','Structured data',`Types: ${types.join(', ')||'unknown'}`);
  }

  doc.querySelector('meta[charset]')||meta('Content-Type')?add('pass','Character set','Declared'):add('warn','Character set','Missing.','Add <meta charset="utf-8"> as the first tag in <head>.');

  doc.querySelector('link[rel~="icon" i]')?add('pass','Favicon','Present'):add('warn','Favicon','Missing.','Add a favicon. Google shows it next to the result on mobile.');

  const body=doc.body?doc.body.cloneNode(true):null;
  body&&body.querySelectorAll('script,style,noscript').forEach(n=>n.remove());
  const words=body?(body.textContent.match(/\S+/g)||[]).length:0;
  words<300?add('warn','Content length',`About ${words} words of visible text.`,'Pages that rank usually have 300+ words that answer the searcher\'s question.'):add('pass','Content length',`About ${words} words`);

  const links=[...doc.querySelectorAll('a[href]')];
  let baseHost=null; try{baseHost=new URL(ctx.url).hostname.replace(/^www\./,'')}catch(e){}
  const ext=links.filter(a=>{const h=a.getAttribute('href'); if(!/^https?:\/\//i.test(h)) return false; if(!baseHost) return true; try{return new URL(h).hostname.replace(/^www\./,'')!==baseHost}catch(e){return true}}).length;
  const empty=links.filter(a=>!a.textContent.trim()&&!a.querySelector('img[alt]')&&!a.getAttribute('aria-label')).length;
  empty?add('warn','Links',`${links.length} links (${links.length-ext} internal, ${ext} external). ${empty} have no readable text.`,'Give every link descriptive anchor text.'):add(links.length?'pass':'warn','Links',`${links.length} links (${links.length-ext} internal, ${ext} external)`,links.length?'':'Link to related pages on the site.');

  return {checks:c,headings:hs.map(x=>({l:+x.tagName[1],t:x.textContent.trim()}))};
}


function serverChecks(f){
  const c=[]; const add=(status,label,detail,fix)=>c.push({status,label,detail,fix});
  f.status===200?add('pass','HTTP status','200 OK'):add(f.status>=400?'fail':'warn','HTTP status',`The page returned ${f.status}.`,f.status>=400?'Google cannot index a page that returns an error.':'Return 200 for pages that should rank.');
  /^https:/.test(f.finalUrl)?add('pass','HTTPS','Secure connection'):add('fail','HTTPS','The page loads over plain http.','Install an SSL certificate and 301-redirect http to https.');
  if(!f.redirects.length) add('pass','Redirects','None');
  else{
    const chain=[...f.redirects.map(r=>`${r.status} ${r.url}`),f.finalUrl].join(' → ');
    const temp=f.redirects.some(r=>r.status===302||r.status===307);
    f.redirects.length>1?add('warn','Redirects',`${f.redirects.length} hops: ${chain}`,'Point links straight to the final URL. Each hop slows crawling.'):
      temp?add('warn','Redirects',chain,'Use a 301 (permanent) redirect so ranking signals pass to the new URL.'):add('pass','Redirects',chain);
  }
  f.timeMs<800?add('pass','Server response',`${f.timeMs} ms`):add(f.timeMs<2000?'warn':'fail','Server response',`${f.timeMs} ms to load the HTML.`,'Aim for under 800 ms. Check hosting, caching and server-side code.');
  f.bytes<500*1024?add('pass','HTML size',kb(f.bytes)):add('warn','HTML size',kb(f.bytes)+(f.truncated?' (cut off at 5 MB)':''),'Large HTML slows the first load. Move inline data and scripts to files.');
  const enc=f.headers['content-encoding'];
  enc?add('pass','Compression',enc):add('warn','Compression','The HTML is not compressed.','Turn on gzip or Brotli on the server or CDN.');
  return c;
}
function robotsChecks(r,url){
  const c=[]; const add=(status,label,detail,fix)=>c.push({status,label,detail,fix});
  if(r.robots.found) r.blocked?add('fail','robots.txt',`This page is blocked by "${r.rule}".`,'Remove or narrow that rule so Google can crawl the page.'):add('pass','robots.txt',r.rule?`Found. Matching rule: ${r.rule}`:'Found. This page is allowed.');
  else add('warn','robots.txt',r.robots.status?`Not found (status ${r.robots.status}).`:'Could not be loaded.','Add a robots.txt file with a Sitemap line.');
  const ok=r.sitemaps.filter(s=>s.valid);
  if(!ok.length) add('warn','XML sitemap',`No valid sitemap at ${r.sitemaps.map(s=>s.url).join(', ')}.`,'Create a sitemap.xml and submit it in Search Console.');
  else ok.forEach(s=>add('pass','XML sitemap',`${s.url}: ${s.isIndex?s.urls+' child sitemaps':s.urls+' URLs'}${!s.isIndex?(s.listsPage?'. Lists this page.':'. This page is not listed.'):''}`));
  return c;
}
function gaugeCls(v){return v==null?'':v>=90?'g-good':v>=50?'g-mid':'g-bad'}
function renderPsi(p){
  const s=p.scores, g=(v,l)=>`<div class="gauge ${gaugeCls(v)}"><b>${v??'–'}</b><span>${l}</span></div>`;
  const cat=x=>x>=0.9?'good':x>=0.5?'mid':'bad';
  const fieldCat={FAST:'good',AVERAGE:'mid',SLOW:'bad'};
  const labNames={fcp:'First Contentful Paint',lcp:'Largest Contentful Paint',tbt:'Total Blocking Time',cls:'Cumulative Layout Shift',si:'Speed Index'};
  const fieldFmt={LCP:v=>(v/1000).toFixed(1)+' s',INP:v=>v+' ms',CLS:v=>v.toFixed(2)};
  let h=`<div class="gauges">${g(s.performance,'Performance')}${g(s.seo,'SEO')}${g(s.accessibility,'Accessibility')}${g(s.bestPractices,'Best practices')}</div>`;
  const fk=Object.keys(p.field);
  h+=`<div class="minihead">Real users, last 28 days</div>`;
  h+=fk.length?`<dl class="kv">${fk.map(k=>`<dt>${k}</dt><dd class="${fieldCat[p.field[k].category]||''}">${fieldFmt[k](p.field[k].percentile)}</dd>`).join('')}</dl>`:`<p class="note">Not enough real-user traffic for Chrome field data. Lab results below still apply.</p>`;
  h+=`<div class="minihead">Lab test (${p.strategy})</div><dl class="kv">${Object.entries(p.lab).map(([k,v])=>`<dt>${labNames[k]}</dt><dd class="${v.score!=null?cat(v.score):''}">${esc(v.value||'–')}</dd>`).join('')}</dl>`;
  if(p.opportunities.length) h+=`<div class="minihead">Biggest speed fixes</div><ol class="opps">${p.opportunities.map(o=>`<li>${esc(o.title)}${o.savings?` <span>${esc(o.savings)}</span>`:''}</li>`).join('')}</ol>`;
  return h;
}

/* ---------- rendering ---------- */
const FIX_LINKS={'Title tag':'/meta-tag-generator','Meta description':'/meta-tag-generator','Canonical URL':'/meta-tag-generator','Open Graph tags':'/meta-tag-generator','Twitter card':'/meta-tag-generator',
  'Structured data':'/schema-generator','robots.txt':'/robots-txt-sitemap-generator','XML sitemap':'/robots-txt-sitemap-generator'};
const FIX_NAMES={'/meta-tag-generator':'meta tag generator','/schema-generator':'schema generator','/robots-txt-sitemap-generator':'robots.txt and sitemap generator'};
const ORDER={fail:0,warn:1,info:2,pass:3};
const LBL={pass:'Pass',warn:'Improve',fail:'Fix',info:'Info'};
let onpage=[], server=[], filter='all', lastScore=0;

function row(x,i){
  const href=FIX_LINKS[x.label];
  const fix=x.fix?`<div class="fx">${ICON.wrench}<span>${esc(x.fix)}${href&&x.status!=='pass'?` <a href="${href}">Open the ${FIX_NAMES[href]}</a>`:''}</span></div>`:'';
  return `<li class="anim" style="--i:${i}" data-s="${x.status}"><span class="tagx ${x.status}">${LBL[x.status]}</span><div><b>${esc(x.label)}</b><div class="d">${esc(x.detail)}</div>${fix}</div></li>`;
}
function renderChecks(){
  const sort=l=>[...l].sort((a,b)=>ORDER[a.status]-ORDER[b.status]);
  const keep=x=>filter==='all'||x.status===filter;
  const groups=[['On the page',sort(onpage).filter(keep)],['Server & crawling',sort(server).filter(keep)]];
  let i=0;
  const h=groups.filter(g=>g[1].length).map(([name,l])=>`<div class="group-h">${name}</div><ul class="checks">${l.map(x=>row(x,i++)).join('')}</ul>`).join('');
  $('au-checks').innerHTML=h||'<p class="note">Nothing in this group. Choose another filter.</p>';
  const all=[...onpage,...server].filter(x=>x.status!=='info'), n={pass:0,warn:0,fail:0}; all.forEach(x=>n[x.status]++);
  document.querySelectorAll('.filters button').forEach(b=>{ const f=b.dataset.f; b.textContent={all:'All',fail:'Fix',warn:'Improve',pass:'Passed'}[f]+(f==='all'?` ${all.length}`:` ${n[f]}`); });
}
function paintScore(){
  const scored=[...onpage,...server].filter(x=>x.status!=='info');
  if(!scored.length) return;
  const n={pass:0,warn:0,fail:0}; scored.forEach(x=>n[x.status]++);
  const score=Math.round((n.pass+n.warn*.5)/scored.length*100);
  const C=2*Math.PI*55, arc=$('au-arc'), num=$('au-score');
  arc.style.stroke=score>=80?'var(--good)':score>=55?'var(--warn)':'var(--bad)';
  requestAnimationFrame(()=>arc.setAttribute('stroke-dasharray',`${(C*score/100).toFixed(1)} ${C.toFixed(1)}`));
  const from=lastScore, t0=performance.now(); lastScore=score;
  const step=t=>{ const k=Math.min(1,(t-t0)/1200), e=1-Math.pow(1-k,3); num.textContent=Math.round(from+(score-from)*e); if(k<1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
  $('au-verdict').textContent=score>=80?'Strong page':score>=55?'Good, with fixes to make':'Needs work';
  $('au-tally').innerHTML=`<span class="pill fail">${n.fail} to fix</span><span class="pill warn">${n.warn} to improve</span><span class="pill pass">${n.pass} passed</span>`;
}
function renderOutline(hs){
  $('au-outline').innerHTML=hs.length?hs.map(x=>`<li style="padding-left:${(x.l-1)*16}px"><span>H${x.l}</span>${esc(x.t)}</li>`).join(''):'<li>No headings found</li>';
}
document.querySelector('.filters').addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b) return;
  filter=b.dataset.f; document.querySelectorAll('.filters button').forEach(x=>x.setAttribute('aria-pressed',x===b)); renderChecks();
});

/* ---------- loading steps ---------- */
const STEPS=['Downloading the page','Checking titles, headings, images and tags','Reading robots.txt and the sitemap','Running Google PageSpeed (20–60 seconds)'];
function steps(state){ // state: array of 'wait' | 'run' | 'done' | 'fail'
  $('au-steps').innerHTML=STEPS.map((t,i)=>{
    const s=state[i]; const tag=s==='done'?'<span class="tagx pass">Done</span>':s==='fail'?'<span class="tagx fail">Failed</span>':s==='run'?'<span class="tagx info"><span class="spin" style="width:10px;height:10px;border-width:1.5px"></span></span>':'<span class="tagx info">Next</span>';
    return `<li><span>${tag}</span><div><b style="font-weight:${s==='run'?600:500}">${t}</b></div></li>`;
  }).join('');
}
const show=id=>['au-empty','au-loading','au-results'].forEach(x=>$(x).hidden=x!==id);
function error(msg){ const e=$('au-error'); e.hidden=!msg; e.textContent=msg||''; }

/* ---------- run ---------- */
let busy=false;
async function run(rawUrl){
  if(busy) return;
  const url=normUrl(rawUrl);
  if(!url){ error('Enter a page address, for example yourwebsite.com.'); $('au-url').focus(); return; }
  busy=true; error(''); onpage=[]; server=[]; lastScore=0; filter='all';
  document.querySelectorAll('.filters button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.f==='all'));
  const go=$('au-go'), label=go.innerHTML; go.disabled=true; go.innerHTML='<span class="spin"></span> Auditing';
  $('au-loading-url').textContent=url.replace(/^https?:\/\//,'');
  const st=['run','wait','wait','wait']; steps(st); show('au-loading');
  try{
    const f=await api('/api/fetch?url='+encodeURIComponent(url));
    st[0]='done'; st[1]='run'; steps(st);
    const r=audit(f.html,{url:f.finalUrl,headers:f.headers});
    onpage=r.checks; server=serverChecks(f);
    st[1]='done'; steps(st);
    const site=extractSite(f.finalUrl,f.html); store.set(site);
    $('au-fixhost').textContent='filled with '+site.host;
    $('au-sub').textContent=f.finalUrl;
    try{ history.replaceState(null,'','?url='+encodeURIComponent(f.finalUrl)); }catch(e){}
    show('au-results'); renderChecks(); renderOutline(r.headings); paintScore();
    $('au-results').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
    const dev=$('au-strategy').value; $('au-psi-dev').textContent=dev;
    $('au-psi').innerHTML='<div class="stack"><div class="gauges">'+'<div class="gauge"><div class="skel" style="height:28px;margin:0 auto 6px;width:50%"></div><span>&nbsp;</span></div>'.repeat(4)+'</div><p class="note"><span class="spin"></span> Running Google PageSpeed. This takes 20–60 seconds.</p></div>';
    const rp=api('/api/robots?url='+encodeURIComponent(f.finalUrl)).then(rb=>{
      server=server.concat(robotsChecks(rb,f.finalUrl)); store.merge({robotsPaths:rb.paths||[],disallow:rb.disallow||[]});
      renderChecks(); paintScore();
    }).catch(err=>{ server.push({status:'info',label:'robots.txt & sitemap',detail:err.message}); renderChecks(); });
    const pp=api(`/api/pagespeed?url=${encodeURIComponent(f.finalUrl)}&strategy=${dev}`).then(p=>{ $('au-psi').innerHTML=renderPsi(p); })
      .catch(err=>{ $('au-psi').innerHTML=`<p class="note err">${esc(err.message)}</p>`; });
    await Promise.all([rp,pp]);
  }catch(err){
    st[st.indexOf('run')]='fail'; steps(st); error(err.message); show('au-empty');
  }finally{ busy=false; go.disabled=false; go.innerHTML=label; }
}

$('au-form').addEventListener('submit',e=>{ e.preventDefault(); run($('au-url').value); });
$('au-try').addEventListener('click',()=>{ $('au-url').value=location.origin+'/'; run(location.origin+'/'); });
$('au-paste-open').addEventListener('click',()=>{ $('au-paste').open=true; $('au-html').focus(); });
$('au-run').addEventListener('click',()=>{
  const html=$('au-html').value.trim(); if(!html){ error('Paste the page HTML first.'); return; }
  error(''); lastScore=0; filter='all';
  const r=audit(html,{}); onpage=r.checks;
  server=[{status:'info',label:'Server checks',detail:'These need a live URL. Pasted HTML only gets the on-page checks.'}];
  $('au-sub').textContent='Pasted HTML'; $('au-fixhost').textContent='';
  show('au-results'); renderChecks(); renderOutline(r.headings); paintScore();
  $('au-psi-dev').textContent=''; $('au-psi').innerHTML='<p class="note">PageSpeed needs a live URL.</p>';
  try{ const d=new DOMParser().parseFromString(html,'text/html'); const u=d.querySelector('link[rel="canonical" i]')?.getAttribute('href')||d.querySelector('meta[property="og:url" i]')?.getAttribute('content'); if(u){ store.set(extractSite(new URL(u).href,html)); } }catch(e){}
  $('au-results').scrollIntoView({behavior:'smooth',block:'start'});
});
$('au-share').addEventListener('click',e=>{
  e.preventDefault(); const b=e.currentTarget, t=b.textContent;
  const done=()=>{ b.textContent='Link copied'; setTimeout(()=>b.textContent=t,1600); };
  try{ navigator.clipboard.writeText(location.href).then(done,()=>{ b.textContent=location.href; }); }catch(err){ b.textContent=location.href; }
});

const q=new URLSearchParams(location.search).get('url');
if(q){ $('au-url').value=q; run(q); }
})();
