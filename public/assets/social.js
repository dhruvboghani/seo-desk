/* Hashtag generator: balanced hashtag set, Instagram name and bio, YouTube tags. */
(function(){
'use strict';
const {$,esc,counter,toolPage}=RD;
const EXAMPLE={brand:'Shree Textiles',niche:'silk saree, banarasi saree, wedding saree, saree wholesale',city:'Surat',country:'India',offer:'Factory-direct pure silk sarees',cta:'DM for wholesale price list'};
const slug=s=>s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s]/g,'').replace(/\s+/g,'');
const cap=s=>s.replace(/\b\w/g,c=>c.toUpperCase());
let off=new Set();
function social(){
  const v=id=>$(id).value.trim();
  const brand=v('so-brand'), city=v('so-city'), country=v('so-country'), offer=v('so-offer'), cta=v('so-cta'), N=+v('so-n');
  const niche=v('so-niche').split(',').map(s=>s.trim()).filter(Boolean);
  const cs=slug(city), ct=slug(country);
  const uniq=a=>[...new Set(a.filter(x=>x&&x.length>1))];
  const words=uniq(niche.flatMap(n=>n.split(/\s+/)).map(slug)).filter(w=>w.length>3);
  const main=words.slice(-1)[0]||'';
  const groups=[
    ['Niche','what people search for',uniq(niche.map(slug))],
    ['Local','where you are',uniq(cs?[...niche.slice(0,3).map(n=>slug(n)+cs), main?cs+main:'', ct&&niche[0]?slug(niche[0])+ct:'', cs+'shopping']:(ct&&niche[0]?[slug(niche[0])+ct]:[]))],
    ['Branded','yours only',uniq([slug(brand), cs?slug(brand)+cs:''])],
    ['Community','broader audience',uniq(words.slice(0,2).flatMap(w=>[w+'lovers',w+'collection'])).concat(ct?['madein'+ct]:[])]
  ];
  const seen=new Set(); groups.forEach(g=>{g[2]=g[2].filter(t=>!seen.has(t)&&seen.add(t));});
  $('so-groups').innerHTML=groups.filter(g=>g[2].length).map(([g,hint,tags])=>`<div class="grp"><h3>${g} <span>· ${hint}</span></h3><div class="chips">${tags.map(t=>`<button type="button" class="chip${off.has(t)?'':' on'}" data-tag="${esc(t)}" aria-pressed="${!off.has(t)}">#${esc(t)}</button>`).join('')}</div></div>`).join('');
  const pools=groups.map(g=>g[2].filter(t=>!off.has(t)));
  const pick=[]; let i=0;
  while(pick.length<N&&pools.some(p=>p.length)){ const p=pools[i%pools.length]; if(p.length) pick.push(p.shift()); i++; }
  $('so-tags').textContent=pick.map(t=>'#'+t).join(' ')||'Select at least one hashtag';
  const name=[brand,[cap(niche[0]||''),city].filter(Boolean).join(' ')].filter(Boolean).join(' | ');
  $('so-name').textContent=name; $('so-name-prev').textContent=name||'Your name';
  const nc=$('so-name-c'); nc.textContent=name.length+' / 64'; nc.className='count '+(name.length>64?'over':'ok');
  const bio=[offer, city&&country?`📍 ${city}, ${country}`:city, cta?`👉 ${cta}`:''].filter(Boolean).join('\n');
  $('so-bio').textContent=bio; $('so-bio-prev').textContent=bio; counter($('so-bio-c'),[...bio].length,40,150);
  $('so-av').textContent=(brand||'?')[0].toUpperCase();
  const yt=uniq([...niche, ...(city?niche.slice(0,3).map(n=>n+' '+city.toLowerCase()):[]), brand.toLowerCase(), ...niche.slice(0,2).map(n=>n+' online'), ...niche.slice(0,2).map(n=>'best '+n)]);
  const out=[]; yt.forEach(t=>{ if([...out,t].join(',').length<=500) out.push(t); });
  const ys=out.join(','); $('so-yt').textContent=ys;
  const yc=$('so-yt-c'); yc.textContent=ys.length+' / 500'; yc.className='count ok';
}
$('so-groups').addEventListener('click',e=>{const b=e.target.closest('[data-tag]'); if(!b) return; const t=b.dataset.tag; off.has(t)?off.delete(t):off.add(t); social(); const nb=document.querySelector(`[data-tag="${CSS.escape(t)}"]`); nb&&nb.focus();});
['so-brand','so-niche','so-city','so-country','so-offer','so-cta','so-n'].forEach(id=>$(id).addEventListener('input',social));
function fill(o){ off=new Set(); $('so-brand').value=o.brand||''; $('so-niche').value=o.niche||''; $('so-city').value=o.city||''; $('so-country').value=o.country||''; $('so-offer').value=o.offer||''; $('so-cta').value=o.cta||''; social(); }
toolPage({
  apply:s=>{ const first=(s.desc||'').split(/(?<=[.!?])\s/)[0].replace(/\.$/,''); fill({brand:s.name,niche:(s.seeds||[]).join(', '),city:s.city,country:s.country,offer:first.length>80?first.slice(0,77).replace(/\s+\S*$/,'')+'…':first,cta:'Visit '+s.host}); },
  reset:()=>fill(EXAMPLE)
});
})();
