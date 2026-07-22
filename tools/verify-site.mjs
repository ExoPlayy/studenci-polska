import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const fail = (message) => {
  throw new Error(message);
};

const data = vm.runInNewContext(`${read('data.js')}; ({ CITIES, CITY_EVENTS })`);
const content = vm.runInNewContext(`${read('city-content.js')}; CITY_CONTENT`);
const sitemap = read('sitemap.xml');

if (data.CITIES.length !== 43) fail(`Expected 43 cities, found ${data.CITIES.length}`);

for (const city of data.CITIES) {
  const page = `${city.slug}/index.html`;
  const image = city.image.replace(/\.(?:jpe?g|png)$/i, '.webp');
  if (!exists(page)) fail(`Missing page: ${page}`);
  if (!exists(image)) fail(`Missing optimized city image: ${image}`);
  if (!content[city.slug]) fail(`Missing city content: ${city.slug}`);

  const html = read(page);
  const canonical = `https://grupystudenckie.pl/${city.slug}/`;
  if (!html.includes(`data-city-slug="${city.slug}"`)) fail(`Missing city slug in ${page}`);
  if (!html.includes(`href="${canonical}"`)) fail(`Wrong canonical in ${page}`);
  if (!sitemap.includes(`<loc>${canonical}</loc>`)) fail(`Missing sitemap URL: ${canonical}`);

  for (const event of data.CITY_EVENTS[city.slug] || []) {
    const sourceImage = Array.isArray(event) ? event[1] : event.image;
    if (!sourceImage) fail(`Missing event image reference for: ${city.slug}`);
    const eventImage = sourceImage.replace(/\.(?:jpe?g|png)$/i, '.webp');
    if (!exists(eventImage)) fail(`Missing optimized event image: ${eventImage}`);
  }
}

if (sitemap.includes('city.html?miasto=')) fail('Legacy city URLs remain in sitemap.xml');
if ((sitemap.match(/<loc>https:\/\/grupystudenckie\.pl\/[a-z0-9-]+\/<\/loc>/g) || []).length !== 43) {
  fail('Sitemap does not contain exactly 43 clean city URLs');
}

console.log('OK: 43 city pages, clean canonicals, sitemap entries and optimized images verified.');
