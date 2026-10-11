/* Robots.txt and XML sitemap generator. */
(function(){
'use strict';
const {$,setCode,toolPage}=RD;
const EXAMPLE={domain:'https://shreetextiles.in',paths:['/','/silk-sarees','/banarasi-sarees','/wholesale','/about','/contact'],block:['/admin','/cart','/checkout']};
const AI_BOTS=['GPTBot','ChatGPT-User','Google-Extended','CCBot','anthropic-ai','ClaudeBot','PerplexityBot','Bytespider'];
function robots(){
  let d=$('rb-domain').value.trim().replace(/\/+$/,''); if(d&&!/^https?:\/\//i.test(d)) d='https://'+d;
  const norm=p=>p.startsWith('/')?p:'/'+p;
  const lines=id=>[...new Set($(id).value.split('\n').map(s=>s.trim()).filter(Boolean).map(norm))];
  const paths=lines('rb-paths'), block=lines('rb-block');
  const freq=$('rb-freq').value, today=new Date().toISOString().slice(0,10);
  const r=['User-agent: *',...(block.length?block.map(b=>'Disallow: '+b):['Disallow:'])];
  if($('rb-ai').value==='block') AI_BOTS.forEach(b=>r.push('','User-agent: '+b,'Disallow: /'));
  r.push('','Sitemap: '+(d||'https://yourdomain.com')+'/sitemap.xml');
  setCode($('rb-robots'),r.join('\n'),'text');
  $('rb-robots-c').textContent=block.length+' blocked '+(block.length===1?'path':'paths');
  const x=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const sm=['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...paths.map(p=>`  <url>\n    <loc>${x((d||'https://yourdomain.com')+p)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${freq}</changefreq>\n  </url>`),'</urlset>'].join('\n');
  setCode($('rb-sitemap'),sm,'html');
  $('rb-sitemap-c').textContent=paths.length+(paths.length===1?' page':' pages');
}
['rb-domain','rb-paths','rb-block','rb-freq','rb-ai'].forEach(id=>$(id).addEventListener('input',robots));
function fill(o){ $('rb-domain').value=o.domain||''; $('rb-paths').value=(o.paths||[]).join('\n'); $('rb-block').value=(o.block||[]).join('\n'); robots(); }
toolPage({
  needsRobots:true,
  apply:s=>fill({domain:s.origin,paths:(s.robotsPaths&&s.robotsPaths.length)?s.robotsPaths:s.paths,block:s.disallow||[]}),
  reset:()=>fill(EXAMPLE)
});
})();
