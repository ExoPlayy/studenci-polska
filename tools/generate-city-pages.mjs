import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(import.meta.dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const data=vm.runInNewContext(`${read('data.js')};({CITIES,UNIVERSITY_GROUPS,CITY_EVENTS})`);
const CITY_CONTENT=vm.runInNewContext(`${read('city-content.js')};CITY_CONTENT`);
const baseTemplate=read('city.html');
const escapeHtml=value=>String(value ?? '').replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll("'",'&#39;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const optimizedImage=image=>`/${image.replace(/\.(?:jpe?g|png)$/i,'.webp')}`;
const shareImage=slug=>`/assets/share/${slug}.jpg`;
const cityUrl=slug=>`/${slug}/`;
const CITY_LOCATIVE={
  krakow:'Krakowie',trojmiasto:'Trójmieście',warszawa:'Warszawie',poznan:'Poznaniu',lodz:'Łodzi',wroclaw:'Wrocławiu',lublin:'Lublinie',katowice:'Katowicach',rzeszow:'Rzeszowie',torun:'Toruniu',bialystok:'Białymstoku',bydgoszcz:'Bydgoszczy',szczecin:'Szczecinie',olsztyn:'Olsztynie',kielce:'Kielcach',opole:'Opolu','zielona-gora':'Zielonej Górze',czestochowa:'Częstochowie','bielsko-biala':'Bielsku-Białej',radom:'Radomiu',koszalin:'Koszalinie',legnica:'Legnicy',gliwice:'Gliwicach',lomza:'Łomży',tarnow:'Tarnowie',chorzow:'Chorzowie','dabrowa-gornicza':'Dąbrowie Górniczej',gniezno:'Gnieźnie','gorzow-wielkopolski':'Gorzowie Wielkopolskim',konin:'Koninie',leszno:'Lesznie',chelm:'Chełmie',ciechanow:'Ciechanowie',elblag:'Elblągu',kalisz:'Kaliszu','nowy-sacz':'Nowym Sączu',plock:'Płocku',siedlce:'Siedlcach',slupsk:'Słupsku',walbrzych:'Wałbrzychu',wloclawek:'Włocławku',zamosc:'Zamościu','jelenia-gora':'Jeleniej Górze'
};

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

function renderEvents(events,city,locative){
  if(!events.length) return `<section class="events-section"><div class="events-head"><div><p class="overline blue">WYDARZENIA W MIEŚCIE</p><h2>Spotkajmy się<br><em>na żywo.</em></h2></div><p>Już wkrótce pojawią się tutaj dedykowane wydarzenia dla studentów w ${locative}.</p></div></section>`;
  return `<section class="events-section"><div class="events-head"><div><p class="overline blue">NADCHODZĄCE IMPREZY STUDENCKIE</p><h2>Spotkajmy się<br><em>na żywo.</em></h2></div><p>${events.length} nadchodzących wydarzeń dla studentów w ${locative}. Kliknij plakat, aby przejść do wydarzenia na Facebooku.</p></div><div class="events-grid real-events">${events.map((event,index)=>`<a class="event-card" href="${escapeHtml(event[2])}" target="_blank" rel="noopener noreferrer"><div class="event-image"><img src="${optimizedImage(event[1])}" alt="${escapeHtml(event[0])}" loading="lazy" decoding="async"><span>${String(index+1).padStart(2,'0')}</span><i>↗</i></div><p>WYDARZENIE STUDENCKIE</p><h3>${escapeHtml(event[0])}</h3><b>Zobacz wydarzenie →</b></a>`).join('')}</div></section>`;
}

function renderUniversities(groups,city,locative){
  if(!groups.length) return '';
  return `<section class="universities-section"><div class="universities-head"><div><p class="overline blue">GRUPY UCZELNIANE</p><h2>Znajdź swoich<br><em>z uczelni.</em></h2></div><p>${groups.length} grup dla studentów uczelni w ${locative}. Wybierz swoją szkołę i dołącz bezpośrednio na Facebooku.</p></div><div class="universities-grid">${groups.map((group,index)=>`<a class="university-card" href="${escapeHtml(group[2])}" target="_blank" rel="noopener noreferrer"><span class="university-number">${String(index+1).padStart(2,'0')}</span><strong>${escapeHtml(group[0])}</strong><p>${escapeHtml(group[1])}</p><i>↗</i></a>`).join('')}</div></section>`;
}

function getFaq(city,locative,groups,events,content){
  const attractions=content?.attractions?.length?content.attractions.join(', '):'centrum, okolice uczelni, lokalne wydarzenia i miejsca spotkań studentów';
  const universities=groups.length?`Na stronie znajdziesz grupy uczelniane, między innymi dla: ${groups.slice(0,6).map(group=>group[1]).join(', ')}${groups.length>6?' oraz kolejnych uczelni.':'.'}`:`Lista uczelni i grup będzie rozwijana. Aktualnych studentów najłatwiej znaleźć poprzez główną grupę miejską.`;
  const eventAnswer=events.length?'Aktualne imprezy są pokazane w sekcji wydarzeń. Kliknięcie w plakat prowadzi bezpośrednio do strony wydarzenia na Facebooku.':'Nowe imprezy będą pojawiały się w sekcji wydarzeń. Warto również obserwować główną grupę miejską.';
  return [
    [`Jak znaleźć grupę studentów w ${locative}?`,`Najprościej zacząć od głównej grupy studenckiej, do której prowadzi duży przycisk na górze strony. Dostępne grupy uczelniane znajdziesz niżej w osobnej sekcji.`],
    [`Gdzie szukać imprez studenckich w ${locative}?`,eventAnswer],
    [`Jakie uczelnie są w ${locative}?`,universities],
    [`Co warto zobaczyć w ${locative} po zajęciach?`,`Warto sprawdzić między innymi: ${attractions}. To dobre punkty startowe do poznawania miasta ze znajomymi z roku.`],
    [`Jak przygotować się do studiów w ${locative}?`,`Sprawdź dojazd na konkretny wydział, koszt pokoju lub akademika, terminy uczelni oraz grupy studentów. Zapisz też wydarzenia integracyjne i najważniejsze daty rekrutacji.`]
  ];
}

function renderSeo(city,locative,content,groups,faq){
  const guide=content?`<section class="city-seo" aria-labelledby="city-guide-title"><div class="city-seo-head"><div><p class="overline blue">PRZEWODNIK STUDENCKI</p><h2 id="city-guide-title">${escapeHtml(city.name)}<br><em>dla studentów.</em></h2></div><p>Praktyczne informacje na spokojny start. Najważniejsze grupy i wydarzenia pozostają wyżej.</p></div><div class="city-seo-details"><details><summary><span>01</span><strong>Jak wygląda życie studenckie w ${locative}?</strong><i>+</i></summary><div class="seo-detail-body"><p>${escapeHtml(content.life)}</p><p>Decydując się na studia w ${locative}, porównaj uczelnie, lokalizację wydziału, komunikację oraz możliwości spędzania czasu po zajęciach.</p></div></details><details><summary><span>02</span><strong>Atrakcje studenckie i miejsca warte poznania</strong><i>+</i></summary><div class="seo-detail-body"><p>Po zajęciach warto poznać miejsca najlepiej pokazujące charakter miasta:</p><ul>${content.attractions.map(place=>`<li>${escapeHtml(place)}</li>`).join('')}</ul></div></details><details><summary><span>03</span><strong>Mieszkanie i dojazdy na uczelnię</strong><i>+</i></summary><div class="seo-detail-body"><p>Przy szukaniu pokoju w ${locative} sprawdź trasę do konkretnego budynku wydziału w godzinach porannych. Porównaj czynsz, wszystkie opłaty, internet, kaucję oraz komunikację.</p><a href="/poradniki.html#mieszkanie">Przeczytaj poradnik o bezpiecznym wynajmie →</a></div></details><details><summary><span>04</span><strong>Pierwszy miesiąc studiów w ${locative}</strong><i>+</i></summary><div class="seo-detail-body"><ul><li>Aktywuj pocztę i system swojej uczelni.</li><li>Znajdź bibliotekę, dziekanat i punkt obsługi studenta.</li><li>Dołącz do grupy miasta oraz grupy swojej uczelni.</li><li>Sprawdź wydarzenia integracyjne i koła zainteresowań.</li></ul><a href="/poradniki.html#start">Zobacz checklistę na pierwsze tygodnie →</a></div></details><details><summary><span>05</span><strong>Jak poznać innych studentów?</strong><i>+</i></summary><div class="seo-detail-body"><p>Zacznij od grupy miejskiej, grupy swojej uczelni i osób z zajęć. Śledź wydarzenia integracyjne, koła naukowe, sport akademicki i wolontariat.</p><a href="/poradniki.html#ludzie">Więcej o życiu studenckim po zajęciach →</a></div></details><details><summary><span>06</span><strong>Praktyczny start — najważniejsze poradniki</strong><i>+</i></summary><div class="seo-detail-body guide-links"><a href="/poradniki.html#akademik">Akademik czy mieszkanie?</a><a href="/poradniki.html#budzet">Budżet studenta</a><a href="/poradniki.html#stypendia">Stypendia</a><a href="/poradniki.html#sesja">Pierwsza sesja</a><a href="/poradniki.html#rekrutacja">Rekrutacja</a><a href="/poradniki.html#kierunek">Wybór kierunku</a></div></details></div></section>`:'';
  const universitySeo=groups.length?`<section class="city-seo city-seo-universities" aria-labelledby="city-university-guide-title"><div class="city-seo-head"><div><p class="overline blue">UCZELNIE I GRUPY</p><h2 id="city-university-guide-title">Uczelnie w ${locative}<br><em>i grupy studentów.</em></h2></div><p>Znajdź uczelnię, skrót jej nazwy i grupę dla studentów oraz kandydatów.</p></div><div class="university-seo-list">${groups.map(group=>`<article><h3>${escapeHtml(group[1])}</h3><p><strong>${escapeHtml(group[0])}</strong> — grupa dla studentów i kandydatów uczelni ${escapeHtml(group[1])} w ${locative}. Możesz zapytać o rekrutację, zajęcia, kierunki, dojazdy i pierwszy rok.</p><a href="${escapeHtml(group[2])}" target="_blank" rel="noopener noreferrer">Przejdź do grupy ${escapeHtml(group[0])} ↗</a></article>`).join('')}</div></section>`:'';
  const faqHtml=`<section class="city-seo city-faq-section" aria-labelledby="city-faq-title"><div class="city-seo-head"><div><p class="overline blue">FAQ DLA STUDENTÓW</p><h2 id="city-faq-title">${escapeHtml(city.name)}<br><em>— pytania i odpowiedzi.</em></h2></div><p>Odpowiedzi o studiowaniu, grupach, uczelniach i wydarzeniach w ${locative}.</p></div><div class="city-seo-details">${faq.map((item,index)=>`<details><summary><span>${String(index+1).padStart(2,'0')}</span><strong>${escapeHtml(item[0])}</strong><i>+</i></summary><div class="seo-detail-body"><p>${escapeHtml(item[1])}</p></div></details>`).join('')}</div></section>`;
  return guide+universitySeo+faqHtml;
}

function renderPage(city,index){
  const locative=CITY_LOCATIVE[city.slug]||city.name;
  const groups=data.UNIVERSITY_GROUPS[city.slug]||[];
  const events=data.CITY_EVENTS[city.slug]||[];
  const content=CITY_CONTENT[city.slug];
  const faq=getFaq(city,locative,groups,events,content);
  const next=data.CITIES[(index+1)%data.CITIES.length];
  return `<section class="city-hero" style="--city-image:url('${optimizedImage(city.image)}')"><div class="city-hero-shade"></div><div class="city-hero-copy"><p class="overline">${escapeHtml(city.region.toUpperCase())} · MIASTO ${city.number}</p><h1>${escapeHtml(city.name)}</h1><p>${escapeHtml(city.desc)}</p><a class="button" href="#dolacz">Dołącz do społeczności <span>↓</span></a></div></section><section class="join-section" id="dolacz"><div class="join-copy"><p class="overline">SPOŁECZNOŚĆ ${escapeHtml(city.name.toUpperCase())}</p><h2>Poznaj ludzi,<br>zanim zacznie się <em>rok.</em></h2><p>Pytaj o uczelnie i mieszkania, poznaj przyszłych znajomych oraz bądź na bieżąco z tym, co dzieje się w mieście.</p></div><a class="join-button" href="${escapeHtml(city.facebook)}" target="_blank" rel="noopener noreferrer"><span><small>OFICJALNA GRUPA STUDENCKA 2026</small>Dołącz do grupy — ${escapeHtml(city.name)}</span><b>↗</b></a></section>${renderEvents(events,city,locative)}${renderUniversities(groups,city,locative)}<section class="city-features"><article><span>01</span><h3>Studiowanie</h3><p>Sprawdź ofertę lokalnych uczelni i wybierz środowisko dopasowane do Twojego kierunku.</p></article><article><span>02</span><h3>Codzienność</h3><p>Pomyśl o dojazdach, mieszkaniu i miejscach, w których naprawdę będziesz spędzać czas.</p></article><article><span>03</span><h3>Po zajęciach</h3><p>Poznaj kulturę, naturę i społeczność, które budują unikalny klimat miasta.</p></article></section>${renderSeo(city,locative,content,groups,faq)}<section class="next-city"><p>NASTĘPNE MIASTO</p><a href="${cityUrl(next.slug)}">${escapeHtml(next.name)} <span>→</span></a></section>`;
}

for(const [index,city] of data.CITIES.entries()){
  const groups=data.UNIVERSITY_GROUPS[city.slug]||[];
  const events=data.CITY_EVENTS[city.slug]||[];
  const content=CITY_CONTENT[city.slug];
  const locative=CITY_LOCATIVE[city.slug]||city.name;
  const faq=getFaq(city,locative,groups,events,content);
  const title=`${city.name} — grupy studenckie, uczelnie i wydarzenia | Studenci Polska`;
  const shareTitle=`Studenci ${city.name} 2026 — grupy, uczelnie i imprezy`;
  const description=groups.length?`Studiujesz w ${locative}? Znajdź grupę miasta, ${groups.length} grup uczelnianych, imprezy studenckie, atrakcje i praktyczne poradniki.`:`Studiujesz w ${locative}? Znajdź grupę miasta, wydarzenia studenckie, atrakcje oraz praktyczny przewodnik na dobry start.`;
  const canonical=`https://grupystudenckie.pl/${city.slug}/`;
  const image=`https://grupystudenckie.pl${shareImage(city.slug)}`;
  const schemas=[
    {'@context':'https://schema.org','@type':'CollectionPage',name:title,description,url:canonical,image,inLanguage:'pl-PL',isPartOf:{'@type':'WebSite',name:'Studenci Polska',url:'https://grupystudenckie.pl/'},about:{'@type':'City',name:city.name,containedInPlace:{'@type':'AdministrativeArea',name:city.region}},breadcrumb:{'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Miasta akademickie',item:'https://grupystudenckie.pl/#miasta'},{'@type':'ListItem',position:2,name:city.name,item:canonical}]}},
    {'@context':'https://schema.org','@type':'FAQPage',mainEntity:faq.map(item=>({'@type':'Question',name:item[0],acceptedAnswer:{'@type':'Answer',text:item[1]}}))}
  ];
  if(groups.length||events.length) schemas.push({'@context':'https://schema.org','@type':'ItemList',name:`Uczelnie, grupy i wydarzenia studenckie — ${city.name}`,url:canonical,itemListElement:[...groups.map((group,itemIndex)=>({'@type':'ListItem',position:itemIndex+1,name:group[1],url:group[2]})),...events.map((event,itemIndex)=>({'@type':'ListItem',position:groups.length+itemIndex+1,name:event[0],url:event[2]}))]});
  let html=rootify(baseTemplate)
    .replace('<title>Miasto akademickie | Studenci Polska</title>',`<title>${escapeHtml(title)}</title>`)
    .replace('<meta name="description" content="Grupy studenckie, uczelnie i wydarzenia w polskich miastach akademickich.">',`<meta name="description" content="${escapeHtml(description)}">`)
    .replace('<meta name="twitter:card" content="summary_large_image">',`<link rel="canonical" href="${canonical}"><meta property="og:title" content="${escapeHtml(shareTitle)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${image}"><meta property="og:image:secure_url" content="${image}"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${escapeHtml(`Studenci ${city.name} — grupy, uczelnie i wydarzenia`)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(shareTitle)}"><meta name="twitter:description" content="${escapeHtml(description)}"><meta name="twitter:image" content="${image}"><meta name="twitter:image:alt" content="${escapeHtml(`Studenci ${city.name} — grupy, uczelnie i wydarzenia`)}">${schemas.map(schema=>`<script type="application/ld+json" data-city-schema>${JSON.stringify(schema).replaceAll('<','\\u003c')}</script>`).join('')}`)
    .replace('<body class="detail">',`<body class="detail" data-city-slug="${city.slug}">`)
    .replace('<main id="cityPage"></main>',`<main id="cityPage">${renderPage(city,index)}</main>`);
  const dir=path.join(root,city.slug);
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'index.html'),html);
}

const today=new Date().toISOString().slice(0,10);
const entries=[['https://grupystudenckie.pl/','1.0'],['https://grupystudenckie.pl/poradniki.html','0.8'],...data.CITIES.map(city=>[`https://grupystudenckie.pl/${city.slug}/`,'0.8'])];
const sitemap=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map(([url,priority])=>`  <url><loc>${url}</loc><lastmod>${today}</lastmod><priority>${priority}</priority></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(root,'sitemap.xml'),sitemap);
console.log(`Generated ${data.CITIES.length} fully rendered city pages and sitemap.xml`);
