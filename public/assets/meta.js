/* Meta tag generator: live Google and share previews with pixel-width checks. */
(function(){
'use strict';
const {$,counter,setCode,toolPage}=RD;
const EXAMPLE={title:'Pure Silk Sarees Wholesale in Surat | Shree Textiles',desc:'Buy pure silk, Banarasi and Kanjivaram sarees direct from our Surat factory. Wholesale rates for dealers, retail orders shipped across India.',
  url:'https://shreetextiles.in/silk-sarees',site:'Shree Textiles',type:'website',img:'',locale:'en_IN',tw:'@shreetextiles'};
const cv=document.createElement('canvas').getContext('2d');
const px=(t,f)=>{cv.font=f;return cv.measureText(t).width};
function clip(t,max,f){ if(px(t,f)<=max) return t; let s=t; while(s.length&&px(s+' ...',f)>max) s=s.slice(0,-1); return s.trim()+' ...'; }
function meter(el,lab,w,max,lo){ el.style.width=Math.min(100,w/max*100)+'%'; el.className=w>max?'over':w<lo?'low':''; lab.textContent=Math.round(w)+' / '+max+' px'; lab.className='count '+(w>max?'over':w<lo?'low':'ok'); }
let mobile=false;
function meta(){
  const v=id=>$(id).value.trim();
  const t=v('mt-title'), d=v('mt-desc'), u=v('mt-url'), s=v('mt-site'), img=v('mt-img'), type=v('mt-type'), loc=v('mt-locale'), tw=v('mt-tw'), noidx=$('mt-noindex').checked;
  counter($('mt-title-c'),t.length,30,60); counter($('mt-desc-c'),d.length,70,160);
  let host='example.com', path=''; try{const x=new URL(u); host=x.hostname; path=x.pathname.split('/').filter(Boolean).join(' › ');}catch(e){}
  $('sp-name').textContent=s||host; $('sp-url').textContent='https://'+host+(path?' › '+path:'');
  $('sp-fav').textContent=(s||host||'?')[0].toUpperCase();
  const tf='20px Arial', df='14px Arial', tMax=mobile?500:600, dMax=mobile?680:920;
  $('sp-title').textContent=clip(t||'Page title',tMax,tf);
  $('sp-desc').textContent=clip(d||'Add a meta description to control this text.',dMax,df);
  meter($('sp-tm'),$('sp-tw'),px(t,tf),tMax,tMax*.47); meter($('sp-dm'),$('sp-dw'),px(d,df),dMax,dMax*.43);
  // share card
  $('sh-host').textContent=host; $('sh-title').textContent=t||'Page title'; $('sh-desc').textContent=d;
  const si=$('sh-img'); if(img){ si.style.backgroundImage=`url("${img.replace(/"/g,'%22')}")`; si.textContent=''; } else { si.style.backgroundImage=''; si.textContent='No share image yet'; }
  const a=x=>x.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  const L=['<meta charset="utf-8">','<meta name="viewport" content="width=device-width, initial-scale=1">'];
  if(t) L.push(`<title>${a(t)}</title>`);
  if(d) L.push(`<meta name="description" content="${a(d)}">`);
  L.push(`<meta name="robots" content="${noidx?'noindex, nofollow':'index, follow'}">`);
  if(u) L.push(`<link rel="canonical" href="${a(u)}">`);
  L.push('','<!-- Open Graph: WhatsApp, Facebook, LinkedIn -->',`<meta property="og:type" content="${type}">`);
  if(t) L.push(`<meta property="og:title" content="${a(t)}">`);
  if(d) L.push(`<meta property="og:description" content="${a(d)}">`);
  if(u) L.push(`<meta property="og:url" content="${a(u)}">`);
  if(img) L.push(`<meta property="og:image" content="${a(img)}">`,'<meta property="og:image:width" content="1200">','<meta property="og:image:height" content="630">');
  if(s) L.push(`<meta property="og:site_name" content="${a(s)}">`);
  if(loc) L.push(`<meta property="og:locale" content="${a(loc)}">`);
  L.push('','<!-- X (Twitter) -->','<meta name="twitter:card" content="summary_large_image">');
  if(tw) L.push(`<meta name="twitter:site" content="${a(tw)}">`);
  if(t) L.push(`<meta name="twitter:title" content="${a(t)}">`);
  if(d) L.push(`<meta name="twitter:description" content="${a(d)}">`);
  if(img) L.push(`<meta name="twitter:image" content="${a(img)}">`);
  setCode($('mt-out'),L.join('\n'),'html');
}
function fill(o){ $('mt-title').value=o.title||''; $('mt-desc').value=o.desc||''; $('mt-url').value=o.url||''; $('mt-site').value=o.site||''; $('mt-type').value=o.type||'website'; $('mt-img').value=o.img||''; $('mt-locale').value=o.locale||''; $('mt-tw').value=o.tw||''; $('mt-noindex').checked=false; meta(); }
['mt-title','mt-desc','mt-url','mt-site','mt-type','mt-img','mt-locale','mt-tw','mt-noindex'].forEach(id=>$(id).addEventListener('input',meta));
document.querySelector('.seg').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; mobile=b.dataset.dev==='mobile'; document.querySelectorAll('.seg button').forEach(x=>x.setAttribute('aria-pressed',x===b)); $('sp').classList.toggle('mobile',mobile); meta(); });
if(document.fonts&&document.fonts.ready) document.fonts.ready.then(meta);
toolPage({
  apply:s=>fill({title:s.title,desc:s.desc,url:s.canonical?new URL(s.canonical,s.url).href:s.url,site:s.name,type:s.scType==='Article'?'article':s.scType==='Product'?'product':'website',img:s.image,locale:'en_IN',tw:''}),
  reset:()=>fill(EXAMPLE)
});
})();
