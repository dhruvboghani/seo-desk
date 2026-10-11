/* Blog: search and filter on the index; reading progress, active contents link and share links on guides. */
(function(){
'use strict';
const $=id=>document.getElementById(id);

/* ---------- index: live search ---------- */
const q=$('bsearch'), grid=$('pgrid');
if(q&&grid){
  const cards=[...grid.querySelectorAll('.pcard')], feature=document.querySelector('.feature'), empty=$('bempty');
  const fq=feature?feature.textContent.toLowerCase():'';
  q.addEventListener('input',()=>{
    const words=q.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    let shown=0;
    cards.forEach(c=>{ const ok=words.every(w=>c.dataset.q.includes(w)); c.hidden=!ok; if(ok){ shown++; c.classList.add('in'); } });
    if(feature){ const ok=words.every(w=>fq.includes(w)); feature.hidden=!ok; if(ok) shown++; }
    empty.hidden=shown>0;
  });
}

/* ---------- guide: reading progress ---------- */
const bar=$('readbar'), article=document.querySelector('.post-main');
if(bar&&article){
  let raf=0;
  const update=()=>{ raf=0; const r=article.getBoundingClientRect(); const total=r.height-innerHeight*0.6; const p=Math.min(1,Math.max(0,-r.top/(total>0?total:1))); bar.style.transform=`scaleX(${p})`; };
  addEventListener('scroll',()=>{ if(!raf) raf=requestAnimationFrame(update); },{passive:true}); update();
}

/* ---------- guide: highlight the section being read ---------- */
const toc=document.querySelector('.toc');
if(toc&&'IntersectionObserver' in window){
  const links=[...toc.querySelectorAll('a')], map=new Map(links.map(a=>[a.getAttribute('href').slice(1),a]));
  const heads=[...document.querySelectorAll('.article h2[id]')];
  let current=null;
  const set=id=>{ if(id===current) return; current=id; links.forEach(a=>a.classList.toggle('on',a===map.get(id))); };
  const io=new IntersectionObserver(()=>{
    let id=heads[0]&&heads[0].id;
    heads.forEach(h=>{ if(h.getBoundingClientRect().top<innerHeight*0.35) id=h.id; });
    set(id);
  },{rootMargin:'0px 0px -60% 0px',threshold:[0,1]});
  heads.forEach(h=>io.observe(h));
  addEventListener('scroll',()=>{ let id=heads[0]&&heads[0].id; heads.forEach(h=>{ if(h.getBoundingClientRect().top<innerHeight*0.35) id=h.id; }); set(id); },{passive:true});
}

/* ---------- guide: share links ---------- */
const url=location.origin+location.pathname, title=(document.querySelector('.post-title')||{}).textContent||document.title;
const enc=encodeURIComponent;
document.querySelectorAll('[data-share]').forEach(a=>{
  const k=a.dataset.share;
  a.href=k==='wa'?`https://wa.me/?text=${enc(title+' '+url)}`:k==='li'?`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`:`https://x.com/intent/post?text=${enc(title)}&url=${enc(url)}`;
});
document.querySelectorAll('[data-copylink]').forEach(b=>b.addEventListener('click',()=>{
  const done=()=>{ b.textContent='Link copied'; setTimeout(()=>b.textContent='Copy link',1600); };
  try{ navigator.clipboard.writeText(url).then(done,()=>{ b.textContent=url; }); }catch(e){ b.textContent=url; }
}));
})();
