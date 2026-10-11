/* Rankdesk shared script: header, motion, copy buttons, ads, site data store and the
   "fill from a website" bar used by every tool page. Exposes window.RD. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ICON={
  check:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  arrow:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  wrench:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.5 2.5a3 3 0 0 0-2.9 3.8L3 10.9a1.4 1.4 0 0 0 2 2l4.6-4.6a3 3 0 0 0 3.8-2.9l-1.7 1.7-1.8-.5-.5-1.8 1.7-1.7a3 3 0 0 0-.6-.1Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
  copy:'<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="5" width="8.5" height="8.5" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3 10.5V4a1.5 1.5 0 0 1 1.5-1.5H11" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
};

/* ---------- header ---------- */
const hdr=document.querySelector('.hdr');
const onScroll=()=>hdr&&hdr.classList.toggle('scrolled',scrollY>8);
addEventListener('scroll',onScroll,{passive:true}); onScroll();
const menuBtn=document.querySelector('.menu-btn'), nav=$('site-nav');
if(menuBtn&&nav){
  const set=open=>{menuBtn.setAttribute('aria-expanded',open);menuBtn.setAttribute('aria-label',open?'Close menu':'Open menu');nav.classList.toggle('open',open);};
  menuBtn.addEventListener('click',()=>set(menuBtn.getAttribute('aria-expanded')!=='true'));
  addEventListener('keydown',e=>{if(e.key==='Escape')set(false)});
  nav.addEventListener('click',e=>{if(e.target.closest('a'))set(false)});
}

/* ---------- Tools menu (desktop): opens on hover or click, closes on Escape or outside click ---------- */
const dd=document.querySelector('.nav-dd'), ddBtn=dd&&dd.querySelector('.nav-dd-btn');
if(dd&&ddBtn){
  const desktop=()=>matchMedia('(min-width:1021px)').matches;
  let t;
  const setDd=open=>{dd.classList.toggle('open',open);ddBtn.setAttribute('aria-expanded',open);};
  ddBtn.addEventListener('click',()=>setDd(!dd.classList.contains('open')));
  dd.addEventListener('mouseenter',()=>{if(desktop()){clearTimeout(t);setDd(true)}});
  dd.addEventListener('mouseleave',()=>{if(desktop()){t=setTimeout(()=>setDd(false),160)}});
  document.addEventListener('click',e=>{if(!dd.contains(e.target))setDd(false)});
  addEventListener('keydown',e=>{if(e.key==='Escape'&&dd.classList.contains('open')){setDd(false);ddBtn.focus()}});
  dd.addEventListener('focusout',e=>{if(!dd.contains(e.relatedTarget))setDd(false)});
}

/* ---------- reveal on scroll ---------- */
const reveals=document.querySelectorAll('.reveal');
if('IntersectionObserver' in window){
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{rootMargin:'0px 0px -8% 0px',threshold:.08});
  reveals.forEach(el=>io.observe(el));
  // safety net for fast scrolling or jumps: anything already above the fold is shown
  let rq=0;
  const sweep=()=>{ rq=0; document.querySelectorAll('.reveal:not(.in)').forEach(el=>{ if(el.getBoundingClientRect().top<innerHeight){ el.classList.add('in'); io.unobserve(el); } }); };
  addEventListener('scroll',()=>{ if(!rq) rq=requestAnimationFrame(sweep); },{passive:true});
  addEventListener('load',sweep);
} else reveals.forEach(el=>el.classList.add('in'));

/* ---------- copy buttons: <button data-copy="elementId"> ---------- */
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-copy]'); if(!b) return;
  const el=$(b.dataset.copy); if(!el) return;
  const txt=el.dataset.raw??el.textContent, label=b.innerHTML;
  const ok=()=>{b.innerHTML=ICON.check+' Copied';b.classList.add('done');setTimeout(()=>{b.innerHTML=label;b.classList.remove('done')},1500)};
  const fallback=()=>{const r=document.createRange();r.selectNodeContents(el);const s=getSelection();s.removeAllRanges();s.addRange(r);b.textContent='Press Ctrl+C';setTimeout(()=>{b.innerHTML=label},2000)};
  try{navigator.clipboard.writeText(txt).then(ok,fallback)}catch(err){fallback()}
});

/* ---------- ads: fill each visible slot once, never refresh ---------- */
function fillAds(){
  document.querySelectorAll('ins.adsbygoogle:not([data-filled])').forEach(ins=>{
    if(!ins.offsetWidth) return;
    ins.setAttribute('data-filled','1');
    try{(window.adsbygoogle=window.adsbygoogle||[]).push({})}catch(e){}
  });
}
if(document.readyState==='complete') fillAds(); else addEventListener('load',fillAds);
addEventListener('resize',()=>{clearTimeout(fillAds.t);fillAds.t=setTimeout(fillAds,400)});

/* ---------- helpers ---------- */
function counter(el,len,lo,hi){ if(!el) return; el.textContent=len+' / '+hi; el.className='count '+(len>hi?'over':len<lo?'low':'ok'); }
async function api(path){
  const res=await fetch(path); let j;
  try{j=await res.json()}catch(e){throw new Error('The server sent an unexpected response. Try again in a moment.')}
  if(!res.ok) throw new Error(j.error||'Request failed.');
  return j;
}
function normUrl(v){ v=String(v||'').trim(); if(!v) return ''; if(!/^[a-z][a-z0-9+.-]*:\/\//i.test(v)) v='https://'+v; return v; }
// light syntax colouring for generated code blocks
function highlight(code,lang){
  const e=esc(code);
  if(lang==='json') return e.replace(/(&quot;(?:[^&]|&(?!quot;))*?&quot;)(\s*:)?/g,(m,s,c)=>c?`<span class="tok-key">${s}</span>${c}`:`<span class="tok-str">${s}</span>`);
  if(lang==='html') return e.replace(/(&lt;!--[\s\S]*?--&gt;)/g,'<span class="tok-com">$1</span>')
    .replace(/(&lt;\/?)([a-zA-Z0-9:-]+)/g,'$1<span class="tok-tag">$2</span>')
    .replace(/\s([a-zA-Z:-]+)=(&quot;.*?&quot;)/g,' <span class="tok-attr">$1</span>=<span class="tok-str">$2</span>');
  return e;
}
function setCode(el,code,lang){ if(!el) return; el.dataset.raw=code; el.innerHTML=highlight(code,lang); }

/* ---------- site data from the last audited or filled website ---------- */
const KEY='rd-site-v2';
const store={
  get(){try{const s=JSON.parse(localStorage.getItem(KEY)||'null'); return s&&s.host?s:null}catch(e){return null}},
  set(s){try{localStorage.setItem(KEY,JSON.stringify({...s,savedAt:Date.now()}))}catch(e){}},
  merge(p){const s=store.get(); if(s) store.set({...s,...p});},
  clear(){try{localStorage.removeItem(KEY)}catch(e){}}
};

const STOP=new Set('a an and the or of for to in on at by with from your you our we is are be it this that as how what why when best top free online new get use using all more most into about vs via per its it’s & - – — | : · home page official site website welcome'.split(' '));
function jsonLdItems(d){
  const out=[];
  const walk=o=>{ if(!o||typeof o!=='object') return; if(Array.isArray(o)) return o.forEach(walk); if(o['@graph']) walk(o['@graph']); if(o['@type']) out.push(o); };
  d.querySelectorAll('script[type="application/ld+json" i]').forEach(sc=>{try{walk(JSON.parse(sc.textContent))}catch(e){}});
  return out;
}
const typeOf=o=>[].concat(o['@type']).map(String);
const str=v=>v==null?'':Array.isArray(v)?str(v[0]):typeof v==='object'?(v.name||v.url||v['@id']||''):String(v).trim();
function extractSite(url,html,robotsInfo){
  const d=new DOMParser().parseFromString(html,'text/html');
  let U; try{U=new URL(url)}catch(e){U=new URL('https://example.com/')}
  const abs=h=>{try{return h?new URL(h,U).href:''}catch(e){return ''}};
  const meta=n=>d.querySelector(`meta[name="${n}" i]`)?.getAttribute('content')?.trim()||'';
  const prop=n=>d.querySelector(`meta[property="${n}" i]`)?.getAttribute('content')?.trim()||'';
  const items=jsonLdItems(d);
  const find=re=>items.find(o=>typeOf(o).some(t=>re.test(t)));
  const biz=items.find(o=>o.address&&typeOf(o).some(t=>!/^(WebSite|WebPage|Product|Offer|Article|BlogPosting|NewsArticle|BreadcrumbList|FAQPage|Question|Answer|ImageObject|PostalAddress|Person)$/.test(t)));
  const org=biz||find(/^(Organization|Corporation|LocalBusiness|Store|OnlineStore|NGO|EducationalOrganization)$/);
  const prod=find(/^(Product|ProductGroup|SoftwareApplication|WebApplication)$/);
  const art=find(/^(Article|BlogPosting|NewsArticle|TechArticle)$/);
  const faqLd=find(/^FAQPage$/);
  const title=d.querySelector('title')?.textContent.trim()||'';
  const h1=d.querySelector('h1')?.textContent.replace(/\s+/g,' ').trim()||'';
  const desc=meta('description')||prop('og:description');
  const host=U.hostname.replace(/^www\./,'');
  const core=host.split('.')[0];
  const flat=x=>x.toLowerCase().replace(/[^a-z0-9]/g,'');
  // brand name
  let name=prop('og:site_name')||str(org?.name)||str(find(/^WebSite$/)?.name);
  if(!name){
    const parts=title.split(/\s+[|–—:·-]\s+/).map(x=>x.trim()).filter(Boolean);
    name=parts.find(x=>flat(x)===flat(core)||flat(core).includes(flat(x))&&flat(x).length>3)||(parts.length>1?parts[parts.length-1]:'')||core.charAt(0).toUpperCase()+core.slice(1);
  }
  // contact + social profiles
  const links=[...d.querySelectorAll('a[href]')].map(a=>a.getAttribute('href'));
  const tel=str(org?.telephone)||(links.find(h=>/^tel:/i.test(h))||'').replace(/^tel:/i,'').trim();
  const email=str(org?.email).replace(/^mailto:/i,'')||(links.find(h=>/^mailto:/i.test(h))||'').replace(/^mailto:/i,'').split('?')[0];
  const socialRe=/^https?:\/\/(www\.)?(instagram\.com|facebook\.com|fb\.com|x\.com|twitter\.com|linkedin\.com|youtube\.com|pinterest\.[a-z.]+|threads\.net|tiktok\.com|github\.com)\/[^?#]+/i;
  const sameAs=[...new Set([].concat(org?.sameAs||[]).map(String).concat(links.map(abs).filter(h=>socialRe.test(h)&&!/\/(sharer|share|intent|dialog)/i.test(h))).map(h=>h.replace(/\/$/,'')))].slice(0,8);
  const ad=(org&&typeof org.address==='object'&&!Array.isArray(org.address))?org.address:(Array.isArray(org?.address)?org.address[0]:{});
  const country=str(ad?.addressCountry);
  const geo=org?.geo||{};
  const logo=abs(str(org?.logo))||abs(d.querySelector('link[rel="apple-touch-icon" i]')?.getAttribute('href'))||abs(d.querySelector('link[rel~="icon" i]')?.getAttribute('href'));
  const image=abs(prop('og:image'))||abs(str(org?.image))||logo;
  const hours=[].concat(org?.openingHours||[]).join(', ');
  // FAQ: from schema, else headings that are questions
  let faq=[];
  if(faqLd) faq=[].concat(faqLd.mainEntity||[]).map(q=>[str(q.name),str(q.acceptedAnswer?.text)]);
  if(!faq.length){
    d.querySelectorAll('h2,h3,h4,summary,dt,button').forEach(el=>{
      const q=el.textContent.replace(/\s+/g,' ').trim(); if(!/\?$/.test(q)||q.length>160||faq.length>=8) return;
      let a='';
      if(el.tagName==='SUMMARY') a=[...el.parentElement.childNodes].filter(n=>n!==el).map(n=>n.textContent).join(' ');
      else { let n=el.nextElementSibling; while(n&&!a&&!/^H[1-6]$/.test(n.tagName)){a=n.textContent; n=n.nextElementSibling;} }
      a=a.replace(/\s+/g,' ').trim(); if(a) faq.push([q,a]);
    });
  }
  faq=faq.filter(([q,a])=>q&&a).map(([q,a])=>q.replace(/\|/g,'/')+' | '+a.replace(/<[^>]+>/g,'').replace(/\|/g,'/').slice(0,300));
  // keyword seeds: frequent 2–3 word phrases from title, headings and description
  const brandFlat=[flat(name),flat(core)].filter(x=>x.length>3);
  const isBrand=k=>{const f=flat(k); return brandFlat.some(b=>b.includes(f)||f.includes(b));};
  const sources=[[title,3],[h1,3],[[...d.querySelectorAll('h2')].map(x=>x.textContent).join(' . '),2],[[...d.querySelectorAll('h3')].map(x=>x.textContent).join(' . '),1],[desc,1],[meta('keywords').replace(/,/g,' . '),2]];
  const score=new Map();
  sources.forEach(([txt,w])=>{
    (txt||'').toLowerCase().split(/[.,;:!?|()\[\]"“”–—\/&+]+|\s-\s/).forEach(chunk=>{
      const words=chunk.split(/\s+/).map(x=>x.replace(/^[^a-z0-9ऀ-࿿]+|[^a-z0-9ऀ-࿿+#]+$/g,'')).filter(Boolean);
      for(let n=2;n<=3;n++) for(let i=0;i+n<=words.length;i++){
        const g=words.slice(i,i+n);
        if(g.some(x=>STOP.has(x)||/^\d+$/.test(x))) continue;
        const k=g.join(' '); if(isBrand(k)) continue; score.set(k,(score.get(k)||0)+w*(n===2?1:1.2));
      }
    });
  });
  const seeds=[];
  [...score.entries()].sort((a,b)=>b[1]-a[1]).forEach(([k])=>{ if(seeds.length<3&&!seeds.some(x=>x.includes(k)||k.includes(x))) seeds.push(k); });
  if(!seeds.length){ const w=(title+' '+h1).toLowerCase().split(/\W+/).filter(x=>x.length>3&&!STOP.has(x)&&!isBrand(x)); seeds.push(...[...new Set(w)].slice(0,3)); }
  // what kind of site is it
  const toolRe=/\b(tool|tools|checker|lookup|look up|finder|generator|calculator|converter|tester|analy[sz]er|validator|online|app|software|api)\b/i;
  const kwType=prod&&typeOf(prod).some(t=>/Software|WebApplication/.test(t))||toolRe.test(title+' '+h1)?'tool':(prod||prop('og:type')==='product'||/shop|store|buy|price|wholesale|manufactur/i.test(title+' '+desc))?'products':'services';
  // schema type to show first
  const scType=biz&&ad?.streetAddress?'LocalBusiness':prod&&typeOf(prod).includes('Product')||prop('og:type')==='product'?'Product':art||prop('og:type')==='article'?'Article':(faq.length&&U.pathname!=='/')?'FAQPage':'Organization';
  const pr=prod?.offers?(Array.isArray(prod.offers)?prod.offers[0]:prod.offers):{};
  const rating=prod?.aggregateRating||{};
  const sc={
    LocalBusiness:{name,url:U.origin,telephone:tel,image,street:str(ad?.streetAddress),city:str(ad?.addressLocality),region:str(ad?.addressRegion),postal:str(ad?.postalCode),country,hours,priceRange:str(org?.priceRange),lat:str(geo.latitude),lng:str(geo.longitude),sameAs:sameAs.join('\n')},
    Organization:{name,url:U.origin,logo,telephone:tel,email,sameAs:sameAs.join('\n')},
    Product:{name:str(prod?.name)||h1||title,image:abs(str(prod?.image))||image,description:str(prod?.description)||desc,brand:str(prod?.brand)||name,sku:str(prod?.sku),
      price:str(pr.price)||prop('product:price:amount'),currency:str(pr.priceCurrency)||prop('product:price:currency')||'INR',availability:str(pr.availability).replace(/^https?:\/\/schema\.org\//,''),rating:str(rating.ratingValue),reviews:str(rating.reviewCount||rating.ratingCount)},
    FAQPage:{faq:faq.join('\n')},
    Article:{headline:str(art?.headline)||h1||title,image:abs(str(art?.image))||image,author:str(art?.author)||meta('author'),date:(str(art?.datePublished)||prop('article:published_time')).slice(0,10),publisher:name,plogo:logo}
  };
  // site pages for the sitemap tab
  const internal=[...new Set(links.map(abs).filter(h=>{try{const x=new URL(h);return x.hostname.replace(/^www\./,'')===host&&!/\.(jpg|jpeg|png|gif|webp|svg|pdf|zip|css|js)$/i.test(x.pathname)}catch(e){return false}}).map(h=>new URL(h).pathname))];
  return {host,origin:U.origin,url:U.href,title,desc,name,image,city:str(ad?.addressLocality),country:country.length===2?({IN:'India',US:'USA',GB:'UK',AE:'UAE',CA:'Canada',AU:'Australia'}[country.toUpperCase()]||country):country,
    seeds,kwType,scType,sc,paths:internal.length?['/',...internal.filter(x=>x!=='/')].slice(0,30):['/'],canonical:d.querySelector('link[rel="canonical" i]')?.getAttribute('href')};
}

/* ---------- "Fill from a website" bar on tool pages ----------
   RD.toolPage({ apply(site), reset(), needsRobots }) wires the bar:
   uses saved site data on load, fetches a new URL on submit, and resets to the example. */
function toolPage(opts){
  const bar=document.querySelector('[data-srcbar]'); if(!bar) return;
  const form=bar.querySelector('form'), input=bar.querySelector('input'), btn=bar.querySelector('button[type="submit"]'), state=bar.querySelector('.state');
  const showSite=s=>{ state.className='state'; state.innerHTML=`<span class="pill src">${ICON.check} Using data from <b>${esc(s.host)}</b></span><button type="button" class="linkbtn" data-reset>Show the example instead</button>`; input.value=s.url||s.origin; };
  const showExample=()=>{ state.className='state'; state.innerHTML='<span class="pill ex">Example data</span><span>Enter your website above to fill every field from it.</span>'; };
  state.addEventListener('click',e=>{ if(e.target.closest('[data-reset]')){ store.clear(); input.value=''; opts.reset(); showExample(); } });
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const url=normUrl(input.value); if(!url){ state.className='state err'; state.textContent='Enter a website address, for example yoursite.com.'; input.focus(); return; }
    btn.disabled=true; const label=btn.innerHTML; btn.innerHTML='<span class="spin"></span> Reading';
    state.className='state'; state.innerHTML='<span class="spin"></span> Reading '+esc(url.replace(/^https?:\/\//,''))+'…';
    try{
      const f=await api('/api/fetch?url='+encodeURIComponent(url));
      let site=extractSite(f.finalUrl,f.html);
      if(opts.needsRobots){ try{ const r=await api('/api/robots?url='+encodeURIComponent(f.finalUrl)); site={...site,robotsPaths:r.paths||[],disallow:r.disallow||[]}; }catch(err){} }
      store.set(site); opts.apply(site); showSite(site);
    }catch(err){ state.className='state err'; state.textContent=err.message; }
    finally{ btn.disabled=false; btn.innerHTML=label; }
  });
  const saved=store.get();
  if(saved){ opts.apply(saved); showSite(saved); } else { opts.reset(); showExample(); }
}

window.RD={$,esc,ICON,counter,api,normUrl,highlight,setCode,store,extractSite,jsonLdItems,toolPage,fillAds};
})();
