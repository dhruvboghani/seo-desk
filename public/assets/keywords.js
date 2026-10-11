/* Keyword ideas: expands seed keywords into local, commercial, buying and question searches. */
(function(){
'use strict';
const {$,esc,toolPage}=RD;
const EXAMPLE={seeds:'silk saree\nbanarasi saree',type:'products',cities:'Surat, Ahmedabad, Mumbai'};
const T={
  products:{local:[s=>s+' near me',s=>s+' shop near me'],city:[(s,c)=>s+' in '+c,(s,c)=>s+' shop in '+c,(s,c)=>c+' '+s+' manufacturer'],
    com:['best X','latest X','top X','X designs','X brands'],tx:['buy X online','X price','X wholesale','X manufacturer','X online shopping'],
    info:['what is X','how to choose X','how to identify original X','which X is best','how to care for X']},
  services:{local:[s=>s+' near me',s=>s+' services near me'],city:[(s,c)=>s+' in '+c,(s,c)=>s+' services in '+c,(s,c)=>'best '+s+' in '+c],
    com:['best X','top X company','X reviews','affordable X','X packages'],tx:['X price','X cost','hire X','X quote','book X'],
    info:['what is X','how much does X cost','how to choose X','X benefits','X checklist']},
  tool:{local:[],city:[(s,c)=>s+' '+c],
    com:['best X','free X','X online','X alternatives','X app'],tx:['free X online','X tool','X api','X software','X pricing'],
    info:['what is X','how to use X','how does X work','is X accurate','X explained']}
};
const LABEL={Local:'Local',Commercial:'Commercial',Transactional:'Buying',Informational:'Question'};
function keywords(){
  const seeds=$('kw-seed').value.split('\n').map(s=>s.trim().toLowerCase()).filter(Boolean);
  const cities=$('kw-city').value.split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
  const on=id=>$(id).checked, rows=[], seen=new Set();
  const add=(k,i)=>{k=k.replace(/\s+/g,' ').trim(); if(k&&!seen.has(k)){seen.add(k);rows.push([k,i]);}};
  const t=T[$('kw-type').value]||T.products, fill=(tpl,s)=>tpl.replace('X',s);
  seeds.forEach(s=>{
    if(on('kw-g-local')){ t.local.forEach(f=>add(f(s),'Local')); cities.forEach(c=>t.city.forEach(f=>add(f(s,c),'Local'))); }
    if(on('kw-g-com')) t.com.forEach(x=>add(fill(x,s),'Commercial'));
    if(on('kw-g-tx')) t.tx.forEach(x=>add(fill(x,s),'Transactional'));
    if(on('kw-g-info')) t.info.forEach(x=>add(fill(x,s),'Informational'));
  });
  $('kw-body').innerHTML=rows.length?rows.map(([k,i],n)=>`<tr style="--i:${Math.min(n,20)}"><td class="k">${esc(k)}</td><td><span class="intent i-${i}">${LABEL[i]}</span></td><td><a class="linkbtn" href="https://trends.google.com/trends/explore?geo=IN&q=${encodeURIComponent(k)}" target="_blank" rel="noopener">Trends</a></td></tr>`).join('')
    :'<tr><td colspan="3">Add a seed keyword to see ideas.</td></tr>';
  $('kw-plain').textContent=rows.map(r=>r[0]).join('\n');
  const n={}; rows.forEach(r=>n[r[1]]=(n[r[1]]||0)+1);
  $('kw-tally').innerHTML=`<span class="pill pass">${rows.length} ideas</span>`+Object.entries(n).map(([k,c])=>`<span class="intent i-${k}">${c} ${LABEL[k].toLowerCase()}</span>`).join('');
}
['kw-seed','kw-type','kw-city','kw-g-local','kw-g-com','kw-g-tx','kw-g-info'].forEach(id=>$(id).addEventListener('input',keywords));
function fill(o){ $('kw-seed').value=o.seeds||''; $('kw-type').value=o.type||'products'; $('kw-city').value=o.cities||''; keywords(); }
toolPage({
  apply:s=>fill({seeds:(s.seeds||[]).join('\n'),type:s.kwType,cities:s.city||''}),
  reset:()=>fill(EXAMPLE)
});
})();
