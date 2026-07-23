import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {GUIDES,GUIDE_BY_ANCHOR} from './guide-config.mjs';

const root=path.resolve(import.meta.dirname,'..');
const content=JSON.parse(fs.readFileSync(path.join(root,'tools/guide-content.json'),'utf8'));
const {CITIES}=vm.runInNewContext(`${fs.readFileSync(path.join(root,'data.js'),'utf8')};({CITIES})`);
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const url=guide=>`https://grupystudenckie.pl/poradniki/${guide.slug}/`;
const share=guide=>`https://grupystudenckie.pl/assets/share/guides/${guide.slug}.jpg`;

function rewriteLinks(html){
  for(const guide of GUIDES){
    html=html.replaceAll(`href="#${guide.anchor}"`,`href="/poradniki/${guide.slug}/"`)
      .replaceAll(`href="/poradniki.html#${guide.anchor}"`,`href="/poradniki/${guide.slug}/"`);
  }
  return html.replaceAll('href="index.html#miasta"','href="/#miasta"');
}

function faqFor(guide){
  return [
    [`Od czego zacząć temat „${guide.title}”?`,`Zacznij od zebrania aktualnych informacji z oficjalnej strony uczelni, a następnie porównaj je z praktycznymi doświadczeniami studentów w grupie swojego miasta lub uczelni.`],
    [`Czy ten poradnik dotyczy każdej uczelni?`,`Poradnik opisuje uniwersalne zasady. Terminy, regulaminy, wymagane dokumenty i dostępne świadczenia zawsze potwierdź bezpośrednio na swojej uczelni.`],
    [`Gdzie zadać dodatkowe pytanie?`,`Wybierz swoje miasto akademickie, dołącz do głównej grupy studentów, a jeżeli jest dostępna — także do grupy konkretnej uczelni.`]
  ];
}

const head=({title,description,canonical,image,type='article'})=>`<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><meta name="description" content="${escape(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${canonical}"><meta property="og:locale" content="pl_PL"><meta property="og:type" content="${type}"><meta property="og:site_name" content="Studenci Polska"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${image}"><meta property="og:image:secure_url" content="${image}"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${escape(title)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="${escape(description)}"><meta name="twitter:image" content="${image}"><meta name="twitter:image:alt" content="${escape(title)}"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Playfair+Display:ital,wght@1,700&display=swap" rel="stylesheet"><link rel="stylesheet" href="/poradniki.css">`;

const nav=(active='')=>`<a class="skip-link" href="#main-content">Przejdź do treści</a><header class="guide-nav"><a class="brand" href="/"><span>SP</span>studenci<b>.</b>polska</a><nav aria-label="Główna nawigacja"><a href="/#miasta">Miasta</a><a href="/poradniki.html"${active==='guides'?' aria-current="page"':''}>Poradniki</a><a href="/grupy-tematyczne.html">Grupy tematyczne</a></nav><a class="language-switch" href="/en/" lang="en" hreflang="en">EN</a><a class="back" href="/#miasta">Wszystkie miasta →</a></header>`;
const footer=`<footer><a class="brand" href="/"><span>SP</span>studenci<b>.</b>polska</a><p>Miasta, uczelnie, wydarzenia i praktyczne poradniki.</p><a class="footer-link" href="/grupy-tematyczne.html">Grupy tematyczne</a><a class="footer-link" href="/en/" lang="en">English</a><small>© 2026 Studenci Polska</small></footer><script src="/analytics.js" defer></script>`;

for(const [index,guide] of GUIDES.entries()){
  let article=rewriteLinks(content[guide.anchor]||'');
  article=article.replace('<article class="guide-article"', '<article class="guide-article guide-detail"')
    .replace('<h2>','<h1>').replace('</h2>','</h1>');
  const faq=faqFor(guide);
  const related=[GUIDES[(index+1)%GUIDES.length],GUIDES[(index+5)%GUIDES.length],GUIDES[(index+11)%GUIDES.length]];
  const cities=[CITIES[index%CITIES.length],CITIES[(index+7)%CITIES.length],CITIES[(index+19)%CITIES.length]];
  const schema=[
    {'@context':'https://schema.org','@type':'Article',headline:guide.title,description:guide.description,image:[share(guide)],url:url(guide),inLanguage:'pl-PL',author:{'@type':'Organization',name:'Studenci Polska'},publisher:{'@type':'Organization',name:'Studenci Polska',url:'https://grupystudenckie.pl/'},isPartOf:{'@type':'WebSite',name:'Studenci Polska',url:'https://grupystudenckie.pl/'}},
    {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Strona główna',item:'https://grupystudenckie.pl/'},{'@type':'ListItem',position:2,name:'Poradniki',item:'https://grupystudenckie.pl/poradniki.html'},{'@type':'ListItem',position:3,name:guide.title,item:url(guide)}]},
    {'@context':'https://schema.org','@type':'FAQPage',mainEntity:faq.map(([question,answer])=>({'@type':'Question',name:question,acceptedAnswer:{'@type':'Answer',text:answer}}))}
  ];
  const html=`<!doctype html><html lang="pl"><head>${head({title:`${guide.title} | Studenci Polska`,description:guide.description,canonical:url(guide),image:share(guide)})}${schema.map(item=>`<script type="application/ld+json">${JSON.stringify(item)}</script>`).join('')}</head><body>${nav('guides')}<main id="main-content"><div class="guide-breadcrumb"><a href="/poradniki.html">Poradniki</a><span>→</span><span>${escape(guide.title)}</span></div><section class="guides guide-single">${article}</section><section class="guide-related-section"><p class="overline">CZYTAJ DALEJ</p><h2>Powiązane<br><em>poradniki.</em></h2><div class="guide-index">${related.map(item=>`<a href="/poradniki/${item.slug}/"><span>${item.number}</span>${escape(item.title)}</a>`).join('')}</div></section><section class="guide-city-links"><p class="overline">SPOŁECZNOŚCI STUDENCKIE</p><h2>Znajdź grupy<br><em>dla siebie.</em></h2><p>Połącz wiedzę z ludźmi: wybierz miasto albo grupę zgodną z Twoimi zainteresowaniami.</p><div>${cities.map(city=>`<a href="/${city.slug}/">${escape(city.name)}</a>`).join('')}<a href="/#miasta">Wszystkie miasta →</a><a href="/grupy-tematyczne.html">Grupy tematyczne →</a></div></section><section class="guide-faq"><p class="overline">PYTANIA I ODPOWIEDZI</p><h2>Najczęstsze<br><em>pytania.</em></h2>${faq.map(([question,answer])=>`<details><summary>${escape(question)}<span>+</span></summary><p>${escape(answer)}</p></details>`).join('')}</section><section class="guide-cta"><h2>Znajdź swoje<br><em>miasto.</em></h2><a href="/#miasta">Przeglądaj miasta →</a></section></main>${footer}</body></html>`;
  const dir=path.join(root,'poradniki',guide.slug);
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'index.html'),html);
}

const hubTitle='Poradniki dla studentów — studia, mieszkanie i życie | Studenci Polska';
const hubDescription='Praktyczne poradniki dla studentów: wybór miasta i kierunku, rekrutacja, mieszkanie, budżet, sesja, praca, bezpieczeństwo i Erasmus.';
const hubSchema={'@context':'https://schema.org','@type':'CollectionPage',name:hubTitle,description:hubDescription,url:'https://grupystudenckie.pl/poradniki.html',image:'https://grupystudenckie.pl/assets/share/guides.jpg',inLanguage:'pl-PL',mainEntity:{'@type':'ItemList',itemListElement:GUIDES.map((guide,index)=>({'@type':'ListItem',position:index+1,name:guide.title,url:url(guide)}))}};
const hub=`<!doctype html><html lang="pl"><head>${head({title:hubTitle,description:hubDescription,canonical:'https://grupystudenckie.pl/poradniki.html',image:'https://grupystudenckie.pl/assets/share/guides.jpg',type:'website'})}<script type="application/ld+json">${JSON.stringify(hubSchema)}</script></head><body>${nav('guides')}<main id="main-content"><section class="guide-hero"><div><p class="overline">PORADNIKI DLA STUDENTÓW</p><h1>Dobry start<br>bez <em>chaosu.</em></h1></div><p>Krótko, praktycznie i bez zbędnego komplikowania. Wybierz temat, który jest Ci teraz potrzebny.</p></section><section class="guide-index guide-hub-grid">${GUIDES.map(guide=>`<a href="/poradniki/${guide.slug}/"><span>${guide.number}</span>${escape(guide.title)}<small>${escape(guide.description)}</small></a>`).join('')}</section><section class="theme-guide-promo"><div><p class="overline">GRUPY TEMATYCZNE</p><h2>Wiedza to początek.<br><em>Znajdź społeczność.</em></h2><p>Biznes, AI, praca zdalna, sport, moda, gry i wyjazdy — wybierz temat dla siebie.</p></div><a href="/grupy-tematyczne.html">Zobacz wszystkie grupy →</a></section><section class="guide-city-links"><p class="overline">43 MIASTA AKADEMICKIE</p><h2>Poradnik to początek.<br><em>Znajdź swoich.</em></h2><p>Na podstronie miasta znajdziesz grupę główną, uczelnie, imprezy i lokalny przewodnik.</p><div>${CITIES.map(city=>`<a href="/${city.slug}/">${escape(city.name)}</a>`).join('')}</div></section><section class="guide-cta"><h2>Wybierz swoje<br><em>miasto.</em></h2><a href="/#miasta">Przeglądaj miasta →</a></section></main>${footer}</body></html>`;
fs.writeFileSync(path.join(root,'poradniki.html'),hub);
console.log(`Generated ${GUIDES.length} guide pages and the guide hub`);
