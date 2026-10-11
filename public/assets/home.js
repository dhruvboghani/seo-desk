/* Home: the search result that climbs to #1 once its fixes land, and the mini score dial. */
(function(){
'use strict';
const list=document.getElementById('demo-list'); if(!list) return;
const status=document.getElementById('demo-status');
const fixes=[...document.querySelectorAll('.fix')];
const ROW=76;
const rows=[
  {id:'a',host:'silkbazaar.in',t:'Silk Sarees Online – Buy Pure Silk Sarees at Best Price',w:[62,24]},
  {id:'b',host:'weavehouse.com',t:'Surat Saree Wholesale Market Guide 2026',w:[48,30]},
  {id:'c',host:'ethnicloom.in',t:'Banarasi & Kanjivaram Silk Sarees | Ethnic Loom',w:[55,20]},
  {id:'d',host:'sareemandi.com',t:'Pure Silk Saree Collection – Free Shipping',w:[40,34]},
  {id:'you',host:'yourwebsite.com',t:'Pure Silk Sarees, Direct from Our Surat Factory',w:[58,26]}
];
const el={};
rows.forEach(r=>{
  const d=document.createElement('div');
  d.className='serp-row'+(r.id==='you'?' you':'');
  d.innerHTML=`<span class="pos">#5</span><div style="min-width:0"><div class="site"><span class="fav"></span>${r.host}</div><div class="t">${r.t}</div><div class="lines"><i style="width:${r.w[0]}%"></i><i style="width:${r.w[1]}%"></i></div></div>`;
  list.appendChild(d); el[r.id]=d;
});
const place=order=>order.forEach((id,i)=>{ el[id].style.transform=`translateY(${i*ROW}px)`; el[id].querySelector('.pos').textContent='#'+(i+1); });
const before=['a','b','c','d','you'], after=['you','a','b','c','d'];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait=ms=>new Promise(r=>setTimeout(r,ms));

if(reduce){ place(after); el.you.classList.add('lit'); fixes.forEach(f=>f.classList.add('on')); status.textContent='After fixes'; }
else{
  place(before);
  (async function loop(){
    while(true){
      await wait(1400);
      for(const f of fixes){ f.classList.add('on'); await wait(650); }
      status.textContent='After fixes';
      // climb one position at a time so the movement reads as ranking up
      for(let p=3;p>=0;p--){ const o=before.filter(x=>x!=='you'); o.splice(p,0,'you'); place(o); await wait(420); }
      el.you.classList.add('lit');
      await wait(3600);
      fixes.forEach(f=>f.classList.remove('on')); el.you.classList.remove('lit');
      status.textContent='Before fixes'; place(before);
      await wait(900);
    }
  })();
}

/* mini dial on the audit card counts up when it scrolls into view */
const arc=document.querySelector('.mini-arc'), num=document.querySelector('.mini-dial .num');
if(arc&&num){
  const target=+num.dataset.count, C=2*Math.PI*50;
  const run=()=>{
    if(reduce){ arc.setAttribute('stroke-dasharray',`${C*target/100} ${C}`); return; }
    const t0=performance.now();
    const step=t=>{ const k=Math.min(1,(t-t0)/1400), e=1-Math.pow(1-k,3); num.textContent=Math.round(target*e); arc.setAttribute('stroke-dasharray',`${C*target/100*e} ${C}`); if(k<1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  if('IntersectionObserver' in window){ const io=new IntersectionObserver(es=>{ if(es[0].isIntersecting){ run(); io.disconnect(); } },{threshold:.4}); io.observe(arc.closest('.card')); } else run();
}
})();
