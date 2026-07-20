const slug=new URLSearchParams(location.search).get('miasto');
const city=CITIES.find(item=>item.slug===slug)||CITIES[0];
const seoContent=CITY_CONTENT[city.slug];
const siteUrl='https://grupystudenckie.pl';
const canonicalUrl=`${siteUrl}/city.html?miasto=${encodeURIComponent(city.slug)}`;
const absoluteImage=`${siteUrl}/${city.image}`;
const pageTitle=`${city.name} — grupy studenckie, uczelnie i wydarzenia`;
  const pageDescription=`${city.name} dla studentów: uczelnie, grupy studenckie, wydarzenia, atrakcje oraz praktyczne porady o mieszkaniu i codziennym życiu w mieście.`;
document.title=pageTitle;
function setMeta(selector,attribute,value){
  let element=document.head.querySelector(selector);
  if(!element){element=document.createElement('meta');document.head.appendChild(element)}
  element.setAttribute(attribute,value);
}
function setNamedMeta(name,value){setMeta(`meta[name="${name}"]`,'name',name);document.head.querySelector(`meta[name="${name}"]`).content=value}
function setPropertyMeta(property,value){setMeta(`meta[property="${property}"]`,'property',property);document.head.querySelector(`meta[property="${property}"]`).content=value}
setNamedMeta('description',pageDescription);
setNamedMeta('twitter:title',pageTitle);
setNamedMeta('twitter:description',pageDescription);
setNamedMeta('twitter:image',absoluteImage);
setPropertyMeta('og:title',pageTitle);
setPropertyMeta('og:description',pageDescription);
setPropertyMeta('og:url',canonicalUrl);
setPropertyMeta('og:image',absoluteImage);
setPropertyMeta('og:image:alt',`${city.name} — miasto akademickie`);
let canonical=document.head.querySelector('link[rel="canonical"]');
if(!canonical){canonical=document.createElement('link');canonical.rel='canonical';document.head.appendChild(canonical)}
canonical.href=canonicalUrl;
const structuredData=document.createElement('script');
structuredData.type='application/ld+json';
structuredData.textContent=JSON.stringify({
  '@context':'https://schema.org',
  '@type':'CollectionPage',
  name:pageTitle,
  description:pageDescription,
  url:canonicalUrl,
  image:absoluteImage,
  inLanguage:'pl-PL',
  isPartOf:{'@type':'WebSite',name:'Studenci Polska',url:`${siteUrl}/`},
  about:{'@type':'City',name:city.name,containedInPlace:{'@type':'AdministrativeArea',name:city.region}},
  breadcrumb:{
    '@type':'BreadcrumbList',
    itemListElement:[
      {'@type':'ListItem',position:1,name:'Miasta akademickie',item:`${siteUrl}/#miasta`},
      {'@type':'ListItem',position:2,name:city.name,item:canonicalUrl}
    ]
  }
});
document.head.appendChild(structuredData);
const universityGroups=UNIVERSITY_GROUPS[city.slug]||[];
const universitySection=universityGroups.length?`<section class="universities-section"><div class="universities-head"><div><p class="overline blue">GRUPY UCZELNIANE</p><h2>Znajdź swoich<br><em>z uczelni.</em></h2></div><p>${universityGroups.length} grup dla studentów uczelni w mieście ${city.name}. Wybierz swoją szkołę i dołącz bezpośrednio na Facebooku.</p></div><div class="universities-grid">${universityGroups.map((group,index)=>`<a class="university-card" href="${group[2]}" target="_blank" rel="noopener noreferrer"><span class="university-number">${String(index+1).padStart(2,'0')}</span><strong>${group[0]}</strong><p>${group[1]}</p><i>↗</i></a>`).join('')}</div></section>`:'';
const cityEvents=CITY_EVENTS[city.slug]||[];
if(seoContent){
  const faqData=document.createElement('script');
  faqData.type='application/ld+json';
  faqData.textContent=JSON.stringify({'@context':'https://schema.org','@type':'FAQPage',mainEntity:[
    {'@type':'Question',name:`Jak wygląda życie studenckie w mieście ${city.name}?`,acceptedAnswer:{'@type':'Answer',text:seoContent.life}},
    {'@type':'Question',name:`Co warto zobaczyć w mieście ${city.name} po zajęciach?`,acceptedAnswer:{'@type':'Answer',text:`Popularne miejsca to: ${seoContent.attractions.join(', ')}.`}},
    {'@type':'Question',name:`Jak przygotować się do przeprowadzki na studia do miasta ${city.name}?`,acceptedAnswer:{'@type':'Answer',text:'Sprawdź dojazd na konkretny wydział, pełny koszt pokoju, komunikację miejską oraz lokalne grupy studenckie i uczelniane.'}}
  ]});
  document.head.appendChild(faqData);
}
const seoSection=seoContent?`<section class="city-seo" aria-labelledby="city-guide-title"><div class="city-seo-head"><div><p class="overline blue">PRZEWODNIK STUDENCKI</p><h2 id="city-guide-title">Poznaj ${city.name}<br><em>po swojemu.</em></h2></div><p>Praktyczne informacje na spokojny start. Najważniejsze grupy i wydarzenia pozostają wyżej — tutaj możesz rozwinąć tylko potrzebny temat.</p></div><div class="city-seo-details"><details><summary><span>01</span><strong>Jak wygląda życie studenckie w mieście ${city.name}?</strong><i>+</i></summary><div class="seo-detail-body"><p>${seoContent.life}</p><p>Wybierając ${city.name} jako miejsce studiów, warto porównać nie tylko uczelnie, ale też lokalizację wydziału, komunikację i możliwości spędzania czasu po zajęciach.</p></div></details><details><summary><span>02</span><strong>Atrakcje studenckie i miejsca warte poznania</strong><i>+</i></summary><div class="seo-detail-body"><p>Po zajęciach warto zobaczyć miejsca, które najlepiej pokazują charakter miasta ${city.name}:</p><ul>${seoContent.attractions.map(place=>`<li>${place}</li>`).join('')}</ul><p>To dobry punkt wyjścia do poznawania miasta ze znajomymi z roku, grupy uczelnianej albo wydarzeń studenckich.</p></div></details><details><summary><span>03</span><strong>Mieszkanie i dojazdy na uczelnię</strong><i>+</i></summary><div class="seo-detail-body"><p>Przy szukaniu pokoju w mieście ${city.name} sprawdź trasę do konkretnego budynku wydziału w godzinach porannych. Tańsza oferta nie zawsze jest korzystniejsza, jeśli wymaga kilku przesiadek albo długich powrotów wieczorem.</p><ul><li>Porównaj czynsz, opłaty, internet i wysokość kaucji.</li><li>Sprawdź przystanki oraz częstotliwość połączeń.</li><li>Obejrzyj okolicę i części wspólne przed podpisaniem umowy.</li><li>Zapisz stan wyposażenia w protokole odbioru.</li></ul><a href="poradniki.html#mieszkanie">Przeczytaj poradnik o bezpiecznym wynajmie →</a></div></details><details><summary><span>04</span><strong>Pierwszy miesiąc studiów w mieście ${city.name}</strong><i>+</i></summary><div class="seo-detail-body"><ul><li>Aktywuj pocztę i system swojej uczelni.</li><li>Znajdź bibliotekę, dziekanat i punkt obsługi studenta.</li><li>Dołącz do głównej grupy miasta oraz grupy swojej uczelni.</li><li>Sprawdź wydarzenia integracyjne i koła zainteresowań.</li><li>Zapisz terminy składania wniosków o akademik i stypendia.</li></ul><a href="poradniki.html#start">Zobacz checklistę na pierwsze tygodnie →</a></div></details><details><summary><span>05</span><strong>Jak poznać innych studentów?</strong><i>+</i></summary><div class="seo-detail-body"><p>Najłatwiej zacząć od grupy miejskiej, grupy swojej uczelni i osób z zajęć. W mieście ${city.name} warto śledzić również wydarzenia integracyjne, koła naukowe, sport akademicki i wolontariat. Regularna obecność w kilku miejscach zwykle działa lepiej niż próba uczestniczenia we wszystkim.</p><a href="poradniki.html#ludzie">Więcej o życiu studenckim po zajęciach →</a></div></details><details><summary><span>06</span><strong>Praktyczny start — najważniejsze poradniki</strong><i>+</i></summary><div class="seo-detail-body guide-links"><a href="poradniki.html#akademik">Akademik czy mieszkanie?</a><a href="poradniki.html#budzet">Budżet studenta</a><a href="poradniki.html#stypendia">Stypendia i pomoc materialna</a><a href="poradniki.html#sesja">Pierwsza sesja</a><a href="poradniki.html#praca">Praca podczas studiów</a><a href="poradniki.html#bezpieczenstwo">Bezpieczeństwo i oszustwa</a></div></details></div></section>`:'';
const eventsSection=cityEvents.length?`<section class="events-section"><div class="events-head"><div><p class="overline blue">NADCHODZĄCE IMPREZY STUDENCKIE</p><h2>Spotkajmy się<br><em>na żywo.</em></h2></div><p>${cityEvents.length} nadchodzących wydarzeń dla studentów w mieście ${city.name}. Kliknij plakat, aby przejść do wydarzenia na Facebooku.</p></div><div class="events-grid real-events">${cityEvents.map((event,index)=>`<a class="event-card" href="${event[2]}" target="_blank" rel="noopener noreferrer"><div class="event-image"><img src="${event[1]}" alt="${event[0]}" loading="lazy"><span>${String(index+1).padStart(2,'0')}</span><i>↗</i></div><p>WYDARZENIE STUDENCKIE</p><h3>${event[0]}</h3><b>Zobacz wydarzenie →</b></a>`).join('')}</div></section>`:`<section class="events-section"><div class="events-head"><div><p class="overline blue">WYDARZENIA W MIEŚCIE</p><h2>Spotkajmy się<br><em>na żywo.</em></h2></div><p>Już wkrótce pojawią się tutaj dedykowane wydarzenia dla studentów w mieście ${city.name}.</p></div><div class="events-grid"><article class="event-placeholder"><div class="event-art"><span>01</span><i>＋</i></div><p>WKRÓTCE</p><h3>Pierwsze wydarzenie</h3><span>Grafika i szczegóły pojawią się niebawem.</span></article><article class="event-placeholder"><div class="event-art alt"><span>02</span><i>＋</i></div><p>WKRÓTCE</p><h3>Kolejne spotkanie</h3><span>To miejsce czeka na dedykowane wydarzenie.</span></article><article class="event-placeholder"><div class="event-art dark"><span>03</span><i>＋</i></div><p>WKRÓTCE</p><h3>Coś specjalnego</h3><span>Obserwuj grupę, żeby niczego nie przegapić.</span></article></div></section>`;
document.getElementById('cityPage').innerHTML=`
<section class="city-hero" style="--city-image:url('${city.image}')"><div class="city-hero-shade"></div><div class="city-hero-copy"><p class="overline">${city.region.toUpperCase()} · MIASTO ${city.number}</p><h1>${city.name}</h1><p>${city.desc}</p><a class="button" href="#dolacz">Dołącz do społeczności <span>↓</span></a></div></section>
<section class="join-section" id="dolacz"><div class="join-copy"><p class="overline">SPOŁECZNOŚĆ ${city.name.toUpperCase()}</p><h2>Poznaj ludzi,<br>zanim zacznie się <em>rok.</em></h2><p>Pytaj o uczelnie i mieszkania, poznaj przyszłych znajomych oraz bądź na bieżąco z tym, co dzieje się w mieście.</p></div><a class="join-button" href="${city.facebook}" target="_blank" rel="noopener noreferrer"><span><small>OFICJALNA GRUPA STUDENCKA 2026</small>Dołącz do grupy — ${city.name}</span><b>↗</b></a></section>
${eventsSection}
${universitySection}
<section class="city-features"><article><span>01</span><h3>Studiowanie</h3><p>Sprawdź ofertę lokalnych uczelni i wybierz środowisko dopasowane do Twojego kierunku.</p></article><article><span>02</span><h3>Codzienność</h3><p>Pomyśl o dojazdach, mieszkaniu i miejscach, w których naprawdę będziesz spędzać czas.</p></article><article><span>03</span><h3>Po zajęciach</h3><p>Poznaj kulturę, naturę i społeczność, które budują unikalny klimat miasta.</p></article></section>
${seoSection}
<section class="next-city"><p>NASTĘPNE MIASTO</p><a href="city.html?miasto=${CITIES[(CITIES.indexOf(city)+1)%CITIES.length].slug}">${CITIES[(CITIES.indexOf(city)+1)%CITIES.length].name} <span>→</span></a></section>`;
