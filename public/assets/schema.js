/* Schema generator: JSON-LD for five common page types, filled from a website or an example. */
(function(){
'use strict';
const {$,esc,setCode,toolPage}=RD;
const SC={
  LocalBusiness:[['name','Business name','Shree Textiles'],['url','Website','https://shreetextiles.in'],['telephone','Phone','+91-98765-43210'],['image','Photo or logo URL','https://shreetextiles.in/logo.png'],['street','Street address','Plot 12, Ring Road Textile Market'],['city','City','Surat'],['region','State','Gujarat'],['postal','PIN code','395002'],['country','Country code','IN'],['hours','Opening hours','Mo-Sa 10:00-19:00','Days and times, e.g. Mo-Sa 10:00-19:00'],['priceRange','Price range','₹₹'],['lat','Latitude','21.1950'],['lng','Longitude','72.8406'],['sameAs','Social profile URLs','https://instagram.com/shreetextiles\nhttps://facebook.com/shreetextiles','One per line','ta']],
  Organization:[['name','Organization name','Shree Textiles'],['url','Website','https://shreetextiles.in'],['logo','Logo URL','https://shreetextiles.in/logo.png'],['telephone','Phone','+91-98765-43210'],['email','Email','sales@shreetextiles.in'],['sameAs','Social profile URLs','https://instagram.com/shreetextiles','One per line','ta']],
  Product:[['name','Product name','Red Banarasi Silk Saree'],['image','Image URL','https://shreetextiles.in/img/banarasi-red.jpg'],['description','Description','Handwoven pure silk Banarasi saree with gold zari border and blouse piece.','','ta'],['brand','Brand','Shree Textiles'],['sku','SKU','BNR-RED-014'],['price','Price','8499'],['currency','Currency','INR'],['availability','Availability','InStock','InStock, OutOfStock or PreOrder'],['rating','Average rating','4.7','Leave blank if there are no real reviews'],['reviews','Number of reviews','38']],
  FAQPage:[['faq','Questions and answers','Do you sell wholesale? | Yes. Dealers get factory rates on orders of 10 sarees or more.\nDo you ship outside Gujarat? | We ship across India in 3–6 working days.','One per line: question | answer','ta']],
  Article:[['headline','Headline','How to Spot a Pure Silk Saree'],['image','Image URL','https://shreetextiles.in/blog/pure-silk.jpg'],['author','Author name','Meera Patel'],['date','Date published','2026-10-01','YYYY-MM-DD'],['publisher','Publisher','Shree Textiles'],['plogo','Publisher logo URL','https://shreetextiles.in/logo.png']]
};
let type='LocalBusiness', data=null; // data: values from a website, null = examples
function scFields(){
  const t=type;
  $('sc-fields').innerHTML=SC[t].map(([k,l,v0,hint,kind])=>{const v=data?(data[t]?.[k]??''):v0; return `<label class="field">${esc(l)}${hint?` <span class="hint">${esc(hint)}</span>`:''}${kind==='ta'?`<textarea id="sc-${t}-${k}" rows="5">${esc(v)}</textarea>`:`<input id="sc-${t}-${k}" value="${esc(v)}">`}</label>`;}).join('');
  $('sc-fields').querySelectorAll('input,textarea').forEach(el=>el.addEventListener('input',scOut));
  document.querySelectorAll('#sc-types button').forEach(b=>b.setAttribute('aria-checked',b.dataset.t===t));
  scOut();
}
function scOut(){
  const t=type, g=k=>($(`sc-${t}-${k}`)?.value||'').trim();
  const lines=k=>g(k).split('\n').map(s=>s.trim()).filter(Boolean);
  let o={'@context':'https://schema.org','@type':t};
  const set=(obj,k,v)=>{if(v!==''&&v!=null&&!(Array.isArray(v)&&!v.length)&&!(typeof v==='object'&&!Array.isArray(v)&&!Object.keys(v).length)) obj[k]=v};
  if(t==='LocalBusiness'){
    ['name','url','telephone','image','priceRange'].forEach(k=>set(o,k,g(k)));
    const ad={'@type':'PostalAddress'}; set(ad,'streetAddress',g('street')); set(ad,'addressLocality',g('city')); set(ad,'addressRegion',g('region')); set(ad,'postalCode',g('postal')); set(ad,'addressCountry',g('country'));
    if(Object.keys(ad).length>1) o.address=ad;
    if(g('lat')&&g('lng')) o.geo={'@type':'GeoCoordinates',latitude:+g('lat'),longitude:+g('lng')};
    set(o,'openingHours',g('hours')); set(o,'sameAs',lines('sameAs'));
  } else if(t==='Organization'){
    ['name','url','logo','telephone','email'].forEach(k=>set(o,k,g(k))); set(o,'sameAs',lines('sameAs'));
  } else if(t==='Product'){
    ['name','image','description','sku'].forEach(k=>set(o,k,g(k)));
    if(g('brand')) o.brand={'@type':'Brand',name:g('brand')};
    if(g('price')){ o.offers={'@type':'Offer',price:g('price'),priceCurrency:g('currency')||'INR',availability:'https://schema.org/'+(g('availability')||'InStock')}; if(g('url')) o.offers.url=g('url'); }
    if(g('rating')&&g('reviews')) o.aggregateRating={'@type':'AggregateRating',ratingValue:g('rating'),reviewCount:g('reviews')};
  } else if(t==='FAQPage'){
    o.mainEntity=lines('faq').map(l=>{const [q,...a]=l.split('|');return {'@type':'Question',name:q.trim(),acceptedAnswer:{'@type':'Answer',text:a.join('|').trim()}}}).filter(x=>x.name&&x.acceptedAnswer.text);
  } else {
    set(o,'headline',g('headline')); set(o,'image',g('image')); set(o,'datePublished',g('date'));
    if(g('author')) o.author={'@type':'Person',name:g('author')};
    if(g('publisher')){ o.publisher={'@type':'Organization',name:g('publisher')}; if(g('plogo')) o.publisher.logo={'@type':'ImageObject',url:g('plogo')}; }
  }
  setCode($('sc-out'),'<script type="application/ld+json">\n'+JSON.stringify(o,null,2)+'\n<\/script>','json');
  const f=SC[t].filter(([k])=>g(k)).length; $('sc-filled').textContent=f+' of '+SC[t].length+' filled';
}
$('sc-types').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; type=b.dataset.t; scFields(); });
$('sc-types').addEventListener('keydown',e=>{ if(!/Arrow(Left|Right|Up|Down)/.test(e.key)) return; const bs=[...document.querySelectorAll('#sc-types button')]; let i=bs.findIndex(b=>b.dataset.t===type)+(/Right|Down/.test(e.key)?1:-1); i=(i+bs.length)%bs.length; type=bs[i].dataset.t; scFields(); bs[i].focus(); e.preventDefault(); });
toolPage({ apply:s=>{ data=s.sc; type=s.scType||'Organization'; scFields(); }, reset:()=>{ data=null; type='LocalBusiness'; scFields(); } });
})();
