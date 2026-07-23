import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {GUIDES} from './guide-config.mjs';

const root=path.resolve(import.meta.dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const exists=file=>fs.existsSync(path.join(root,file));
const fail=message=>{throw new Error(message)};
const data=vm.runInNewContext(`${read('data.js')};({CITIES,CITY_EVENTS})`);
const content=vm.runInNewContext(`${read('city-content.js')};CITY_CONTENT`);
const sitemap=read('sitemap.xml');

if(data.CITIES.length!==43) fail(`Expected 43 cities, found ${data.CITIES.length}`);
if(GUIDES.length!==24) fail(`Expected 24 guides, found ${GUIDES.length}`);

for(const city of data.CITIES){
  const page=`${city.slug}/index.html`;
  const optimized=city.image.replace(/\.(?:jpe?g|png)$/i,'.webp');
  const shareImage=`assets/share/${city.slug}.jpg`;
  if(!exists(page)) fail(`Missing page: ${page}`);
  if(!exists(optimized)) fail(`Missing optimized city image: ${optimized}`);
  if(!exists(shareImage)) fail(`Missing social sharing image: ${shareImage}`);
  if(!content[city.slug]) fail(`Missing city content: ${city.slug}`);
  const html=read(page);
  const canonical=`https://grupystudenckie.pl/${city.slug}/`;
  if(!html.includes(`data-city-slug="${city.slug}"`)) fail(`Missing city slug in ${page}`);
  if(!html.includes(`href="${canonical}"`)) fail(`Wrong canonical in ${page}`);
  if(!html.includes('<main id="cityPage"><section class="city-hero"')) fail(`Missing pre-rendered city content in ${page}`);
  if(!html.includes('class="city-seo city-faq-section"')) fail(`Missing city FAQ in ${page}`);
  if(!html.includes('class="related-cities"')) fail(`Missing related cities in ${page}`);
  if((html.match(/class="related-cities-grid"/g)||[]).length!==1) fail(`Invalid related city grid in ${page}`);
  if(!html.includes('data-city-schema')) fail(`Missing structured data in ${page}`);
  if(!html.includes(`property="og:image" content="https://grupystudenckie.pl/assets/share/${city.slug}.jpg"`)) fail(`Wrong sharing image in ${page}`);
  if(!html.includes('property="og:image:width" content="1200"')||!html.includes('property="og:image:height" content="630"')) fail(`Wrong sharing dimensions in ${page}`);
  if(html.includes('/poradniki.html#')) fail(`Legacy guide anchor remains in ${page}`);
  if(!html.includes('/poradniki/')) fail(`Missing guide link in ${page}`);
  if(!html.includes('class="skip-link"')) fail(`Missing skip link in ${page}`);
  if(!sitemap.includes(`<loc>${canonical}</loc>`)) fail(`Missing sitemap URL: ${canonical}`);
  for(const event of data.CITY_EVENTS[city.slug]||[]){
    const image=(Array.isArray(event)?event[1]:event.image)?.replace(/\.(?:jpe?g|png)$/i,'.webp');
    if(!image||!exists(image)) fail(`Missing optimized event image: ${image||city.slug}`);
  }
}

for(const guide of GUIDES){
  const page=`poradniki/${guide.slug}/index.html`;
  const image=`assets/share/guides/${guide.slug}.jpg`;
  const canonical=`https://grupystudenckie.pl/poradniki/${guide.slug}/`;
  if(!exists(page)) fail(`Missing guide: ${page}`);
  if(!exists(image)) fail(`Missing guide social image: ${image}`);
  const html=read(page);
  if(!html.includes(`<link rel="canonical" href="${canonical}">`)) fail(`Wrong guide canonical: ${guide.slug}`);
  if(!html.includes(`<meta property="og:image" content="https://grupystudenckie.pl/${image}">`)) fail(`Wrong guide social image: ${guide.slug}`);
  if((html.match(/<h1[ >]/g)||[]).length!==1) fail(`Guide must have exactly one H1: ${guide.slug}`);
  if(!html.includes('"@type":"Article"')||!html.includes('"@type":"FAQPage"')) fail(`Missing guide schema: ${guide.slug}`);
  if(!html.includes('class="guide-related-section"')||!html.includes('class="guide-city-links"')) fail(`Missing guide internal links: ${guide.slug}`);
  if(!html.includes('class="skip-link"')) fail(`Missing guide skip link: ${guide.slug}`);
  if(!sitemap.includes(`<loc>${canonical}</loc>`)) fail(`Missing guide sitemap URL: ${canonical}`);
}

const home=read('index.html');
if(!home.includes('assets/share/home.jpg')||!home.includes('og:image:width')||!home.includes('id="main-content"')) fail('Homepage social metadata or accessibility marker is missing');
if(!home.includes('grupy-tematyczne.html')||!home.includes('href="/en/"')||!home.includes('hreflang="en"')) fail('Homepage thematic groups or language navigation is missing');
const hub=read('poradniki.html');
if(!hub.includes('assets/share/guides.jpg')||!hub.includes('"@type":"CollectionPage"')) fail('Guide hub metadata is incomplete');
if(!hub.includes('class="theme-guide-promo"')||!hub.includes('grupy-tematyczne.html')) fail('Guide hub thematic promotion is missing');

const groups=read('grupy-tematyczne.html');
if((groups.match(/class="theme-group-card"/g)||[]).length!==8) fail('Thematic group page must contain 8 group cards');
if(!groups.includes('assets/share/groups.jpg')||!groups.includes('"@type":"CollectionPage"')||!groups.includes('"@type":"FAQPage"')) fail('Thematic group metadata or schema is incomplete');
if(!groups.includes('data-group-topic=')) fail('Thematic group analytics hooks are missing');
for(const image of ['biznes','szkolenia','ai','moda','gaming','praca-zdalna','zdrowie','wyjazdy']){
  if(!exists(`assets/groups/${image}.webp`)) fail(`Missing thematic group image: ${image}`);
}

const english=read('en/index.html');
if(!english.includes('<html lang="en">')||!english.includes('hreflang="pl"')||!english.includes('href="#communities"')) fail('English starter page is incomplete');
if((english.match(/class="en-city-card"/g)||[]).length!==43) fail('English starter page must contain 43 city links');
if((english.match(/class="en-theme-card"/g)||[]).length!==8) fail('English starter page must contain 8 thematic groups');
if(!sitemap.includes('<loc>https://grupystudenckie.pl/en/</loc>')||!sitemap.includes('<loc>https://grupystudenckie.pl/grupy-tematyczne.html</loc>')) fail('English or thematic page is missing from sitemap');
if(sitemap.includes('city.html?miasto=')||sitemap.includes('poradniki.html#')) fail('Legacy URLs remain in sitemap');
if((sitemap.match(/<url>/g)||[]).length!==71) fail('Sitemap must contain 71 URLs');

console.log('OK: 43 cities, 24 guides, 8 thematic groups, English starter and 71 sitemap URLs verified.');
