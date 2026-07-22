import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(import.meta.dirname,'..');
const dataSource=fs.readFileSync(path.join(root,'data.js'),'utf8');
const {CITIES}=vm.runInNewContext(`${dataSource};({CITIES})`);
const baseTemplate=fs.readFileSync(path.join(root,'city.html'),'utf8');
const escapeHtml=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const rootify=html=>html
  .replaceAll('href="styles.css"','href="/styles.css"')
  .replaceAll('href="city-compact.css"','href="/city-compact.css"')
  .replaceAll('href="assets/favicon.svg"','href="/assets/favicon.svg"')
  .replaceAll('href="index.html#miasta"','href="/#miasta"')
  .replaceAll('href="index.html#jak-wybrac"','href="/#jak-wybrac"')
  .replaceAll('href="index.html"','href="/"')
  .replaceAll('href="poradniki.html"','href="/poradniki.html"')
  .replaceAll('src="data.js"','src="/data.js"')
  .replaceAll('src="city-content.js"','src="/city-content.js"')
  .replaceAll('src="city.js"','src="/city.js"')
  .replaceAll('src="analytics.js"','src="/analytics.js"');

for(const city of CITIES){
  const title=`${city.name} — grupy studenckie, uczelnie i wydarzenia | Studenci Polska`;
  const description=`${city.name} dla studentów: grupy studenckie i uczelniane, wydarzenia, atrakcje oraz praktyczny przewodnik po mieście.`;
  const canonical=`https://grupystudenckie.pl/${city.slug}/`;
  const image=`https://grupystudenckie.pl/${city.image.replace(/\.(?:jpe?g|png)$/i,'.webp')}`;
  let html=rootify(baseTemplate)
    .replace('<title>Miasto akademickie | Studenci Polska</title>',`<title>${escapeHtml(title)}</title>`)
    .replace('<meta name="description" content="Grupy studenckie, uczelnie i wydarzenia w polskich miastach akademickich.">',`<meta name="description" content="${escapeHtml(description)}">`)
    .replace('<meta name="twitter:card" content="summary_large_image">',`<link rel="canonical" href="${canonical}"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${image}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(title)}"><meta name="twitter:description" content="${escapeHtml(description)}"><meta name="twitter:image" content="${image}">`)
    .replace('<body class="detail">',`<body class="detail" data-city-slug="${city.slug}">`);
  const dir=path.join(root,city.slug);
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'index.html'),html);
}

const today=new Date().toISOString().slice(0,10);
const entries=[
  ['https://grupystudenckie.pl/','1.0'],
  ['https://grupystudenckie.pl/poradniki.html','0.8'],
  ...CITIES.map(city=>[`https://grupystudenckie.pl/${city.slug}/`,'0.8'])
];
const sitemap=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map(([url,priority])=>`  <url><loc>${url}</loc><lastmod>${today}</lastmod><priority>${priority}</priority></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(root,'sitemap.xml'),sitemap);
console.log(`Generated ${CITIES.length} city pages and sitemap.xml`);
