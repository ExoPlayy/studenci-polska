const slug=new URLSearchParams(location.search).get('miasto');
const city=CITIES.find(item=>item.slug===slug)||CITIES[0];
const seoContent=CITY_CONTENT[city.slug];
const universityGroups=UNIVERSITY_GROUPS[city.slug]||[];
const cityEvents=CITY_EVENTS[city.slug]||[];
const universityNames=universityGroups.map(group=>group[1]).filter(Boolean);
const siteUrl='https://grupystudenckie.pl';
const canonicalUrl=`${siteUrl}/city.html?miasto=${encodeURIComponent(city.slug)}`;
const absoluteImage=`${siteUrl}/${city.image}`;
const pageTitle=`${city.name} — grupy studenckie, uczelnie i wydarzenia`;
const pageDescription=universityNames.length?`${city.name} dla studentów: grupy uczelniane, wydarzenia, atrakcje i praktyczny przewodnik. Sprawdź m.in. ${universityNames.slice(0,3).join(', ')}.`:`${city.name} dla studentów: grupy studenckie, wydarzenia, atrakcje oraz praktyczne porady o mieszkaniu i codziennym życiu w mieście.`;
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
if(universityGroups.length||cityEvents.length){
  const localData=document.createElement('script');
  localData.type='application/ld+json';
  localData.textContent=JSON.stringify({
    '@context':'https://schema.org',
    '@type':'ItemList',
    name:`Uczelnie, grupy i wydarzenia studenckie — ${city.name}`,
    description:`Lista pomocnych linków dla studentów w mieście ${city.name}: grupy uczelniane, grupa miejska i wydarzenia integracyjne.`,
    url:canonicalUrl,
    itemListElement:[
      ...universityGroups.map((group,index)=>({'@type':'ListItem',position:index+1,name:group[1],url:group[2]})),
      ...cityEvents.map((event,index)=>({'@type':'ListItem',position:universityGroups.length+index+1,name:event[0],url:event[2]}))
    ]
  });
  document.head.appendChild(localData);
}
const universitySection=universityGroups.length?`<section class="universities-section"><div class="universities-head"><div><p class="overline blue">GRUPY UCZELNIANE</p><h2>Znajdź swoich<br><em>z uczelni.</em></h2></div><p>${universityGroups.length} grup dla studentów uczelni w mieście ${city.name}. Wybierz swoją szkołę i dołącz bezpośrednio na Facebooku.</p></div><div class="universities-grid">${universityGroups.map((group,index)=>`<a class="university-card" href="${group[2]}" target="_blank" rel="noopener noreferrer"><span class="university-number">${String(index+1).padStart(2,'0')}</span><strong>${group[0]}</strong><p>${group[1]}</p><i>↗</i></a>`).join('')}</div></section>`:'';
const attractionAnswer=seoContent?.attractions?.length?`Po zajęciach w mieście ${city.name} warto sprawdzić między innymi: ${seoContent.attractions.join(', ')}. To dobre punkty startowe do poznawania miasta ze znajomymi z roku, grupy uczelnianej albo wydarzeń studenckich.`:`W mieście ${city.name} warto śledzić centrum, okolice uczelni, lokalne wydarzenia, kluby studenckie, kawiarnie i miejsca spotkań polecane przez osoby z grup miejskich oraz uczelnianych.`;
const universityAnswer=universityGroups.length?`Na tej stronie znajdziesz kafelki z grupami uczelnianymi dla miasta ${city.name}. Są tu między innymi: ${universityGroups.slice(0,6).map(group=>group[1]).join(', ')}${universityGroups.length>6?' i kolejne uczelnie widoczne w sekcji grup uczelnianych.':'.'}`:`Lista uczelni dla miasta ${city.name} będzie rozwijana. Warto sprawdzać główną grupę miejską, bo tam najłatwiej znaleźć osoby z konkretnych kierunków, roczników i uczelni.`;
const eventsAnswer=cityEvents.length?`Aktualne imprezy studenckie dla miasta ${city.name} są pokazane wyżej w sekcji wydarzeń. Kliknięcie w plakat prowadzi bezpośrednio do wydarzenia na Facebooku.`:`Imprezy studenckie dla miasta ${city.name} będą dodawane w sekcji wydarzeń. Do tego czasu warto obserwować główną grupę miejską, gdzie pojawiają się informacje o integracjach, otrzęsinach i spotkaniach dla studentów.`;
const cityFaqItems=[
  [`Jak znaleźć grupę studentów w mieście ${city.name}?`,`Najprościej zacząć od głównej grupy studenckiej miasta ${city.name}, do której prowadzi duży przycisk na górze strony. Jeśli dla miasta są dodane grupy uczelniane, znajdziesz je niżej w osobnej sekcji z kafelkami uczelni.`],
  [`Gdzie szukać imprez studenckich w mieście ${city.name}?`,eventsAnswer],
  [`Jakie uczelnie są w mieście ${city.name}?`,universityAnswer],
  [`Co warto zobaczyć w mieście ${city.name} po zajęciach?`,attractionAnswer],
  [`Jak przygotować się do studiów w mieście ${city.name}?`,`Przed startem studiów w mieście ${city.name} sprawdź dojazd na konkretny wydział, koszt pokoju lub akademika, najważniejsze terminy uczelni oraz grupy studentów. Dobrym krokiem jest też zapisanie wydarzeń integracyjnych i dołączenie do grupy swojego miasta.`]
];
const faqData=document.createElement('script');
faqData.type='application/ld+json';
faqData.textContent=JSON.stringify({'@context':'https://schema.org','@type':'FAQPage',mainEntity:cityFaqItems.map(item=>({'@type':'Question',name:item[0],acceptedAnswer:{'@type':'Answer',text:item[1]}}))});
document.head.appendChild(faqData);
const seoSection=seoContent?`<section class="city-seo" aria-labelledby="city-guide-title"><div class="city-seo-head"><div><p class="overline blue">PRZEWODNIK STUDENCKI</p><h2 id="city-guide-title">Poznaj ${city.name}<br><em>po swojemu.</em></h2></div><p>Praktyczne informacje na spokojny start. Najważniejsze grupy i wydarzenia pozostają wyżej — tutaj możesz rozwinąć tylko potrzebny temat.</p></div><div class="city-seo-details"><details><summary><span>01</span><strong>Jak wygląda życie studenckie w mieście ${city.name}?</strong><i>+</i></summary><div class="seo-detail-body"><p>${seoContent.life}</p><p>Wybierając ${city.name} jako miejsce studiów, warto porównać nie tylko uczelnie, ale też lokalizację wydziału, komunikację i możliwości spędzania czasu po zajęciach.</p></div></details><details><summary><span>02</span><strong>Atrakcje studenckie i miejsca warte poznania</strong><i>+</i></summary><div class="seo-detail-body"><p>Po zajęciach warto zobaczyć miejsca, które najlepiej pokazują charakter miasta ${city.name}:</p><ul>${seoContent.attractions.map(place=>`<li>${place}</li>`).join('')}</ul><p>To dobry punkt wyjścia do poznawania miasta ze znajomymi z roku, grupy uczelnianej albo wydarzeń studenckich.</p></div></details><details><summary><span>03</span><strong>Mieszkanie i dojazdy na uczelnię</strong><i>+</i></summary><div class="seo-detail-body"><p>Przy szukaniu pokoju w mieście ${city.name} sprawdź trasę do konkretnego budynku wydziału w godzinach porannych. Tańsza oferta nie zawsze jest korzystniejsza, jeśli wymaga kilku przesiadek albo długich powrotów wieczorem.</p><ul><li>Porównaj czynsz, opłaty, internet i wysokość kaucji.</li><li>Sprawdź przystanki oraz częstotliwość połączeń.</li><li>Obejrzyj okolicę i części wspólne przed podpisaniem umowy.</li><li>Zapisz stan wyposażenia w protokole odbioru.</li></ul><a href="poradniki.html#mieszkanie">Przeczytaj poradnik o bezpiecznym wynajmie →</a></div></details><details><summary><span>04</span><strong>Pierwszy miesiąc studiów w mieście ${city.name}</strong><i>+</i></summary><div class="seo-detail-body"><ul><li>Aktywuj pocztę i system swojej uczelni.</li><li>Znajdź bibliotekę, dziekanat i punkt obsługi studenta.</li><li>Dołącz do głównej grupy miasta oraz grupy swojej uczelni.</li><li>Sprawdź wydarzenia integracyjne i koła zainteresowań.</li><li>Zapisz terminy składania wniosków o akademik i stypendia.</li></ul><a href="poradniki.html#start">Zobacz checklistę na pierwsze tygodnie →</a></div></details><details><summary><span>05</span><strong>Jak poznać innych studentów?</strong><i>+</i></summary><div class="seo-detail-body"><p>Najłatwiej zacząć od grupy miejskiej, grupy swojej uczelni i osób z zajęć. W mieście ${city.name} warto śledzić również wydarzenia integracyjne, koła naukowe, sport akademicki i wolontariat. Regularna obecność w kilku miejscach zwykle działa lepiej niż próba uczestniczenia we wszystkim.</p><a href="poradniki.html#ludzie">Więcej o życiu studenckim po zajęciach →</a></div></details><details><summary><span>06</span><strong>Praktyczny start — najważniejsze poradniki</strong><i>+</i></summary><div class="seo-detail-body guide-links"><a href="poradniki.html#akademik">Akademik czy mieszkanie?</a><a href="poradniki.html#budzet">Budżet studenta</a><a href="poradniki.html#stypendia">Stypendia i pomoc materialna</a><a href="poradniki.html#sesja">Pierwsza sesja</a><a href="poradniki.html#praca">Praca podczas studiów</a><a href="poradniki.html#bezpieczenstwo">Bezpieczeństwo i oszustwa</a></div></details></div></section>`:'';
const universitySeoSection=universityGroups.length?`<section class="city-seo city-seo-universities" aria-labelledby="city-university-guide-title"><div class="city-seo-head"><div><p class="overline blue">UCZELNIE I GRUPY</p><h2 id="city-university-guide-title">Uczelnie w mieście ${city.name}<br><em>i grupy studentów.</em></h2></div><p>Ta część jest na dole strony, bo najważniejsze akcje są wyżej. Pomaga jednak szybko odnaleźć uczelnie, skróty nazw i grupy dla rocznika 2026.</p></div><div class="university-seo-list">${universityGroups.map(group=>`<article><h3>${group[1]}</h3><p><strong>${group[0]}</strong> — grupa dla studentów i kandydatów uczelni ${group[1]} w mieście ${city.name}. To dobre miejsce na pytania o rekrutację, zajęcia, kierunki, dojazdy i pierwsze tygodnie studiowania.</p><a href="${group[2]}" target="_blank" rel="noopener noreferrer">Przejdź do grupy ${group[0]} ↗</a></article>`).join('')}</div></section>`:'';
const cityFaqSection=`<section class="city-seo city-faq-section" aria-labelledby="city-faq-title"><div class="city-seo-head"><div><p class="overline blue">FAQ DLA STUDENTÓW</p><h2 id="city-faq-title">Najczęstsze pytania<br><em>o ${city.name}.</em></h2></div><p>Krótka sekcja na końcu strony — głównie dla osób, które szukają konkretnych informacji o studiowaniu, grupach, uczelniach i wydarzeniach w mieście ${city.name}.</p></div><div class="city-seo-details">${cityFaqItems.map((item,index)=>`<details><summary><span>${String(index+1).padStart(2,'0')}</span><strong>${item[0]}</strong><i>+</i></summary><div class="seo-detail-body"><p>${item[1]}</p></div></details>`).join('')}</div></section>`;
const eventsSection=cityEvents.length?`<section class="events-section"><div class="events-head"><div><p class="overline blue">NADCHODZĄCE IMPREZY STUDENCKIE</p><h2>Spotkajmy się<br><em>na żywo.</em></h2></div><p>${cityEvents.length} nadchodzących wydarzeń dla studentów w mieście ${city.name}. Kliknij plakat, aby przejść do wydarzenia na Facebooku.</p></div><div class="events-grid real-events">${cityEvents.map((event,index)=>`<a class="event-card" href="${event[2]}" target="_blank" rel="noopener noreferrer"><div class="event-image"><img src="${event[1]}" alt="${event[0]}" loading="lazy"><span>${String(index+1).padStart(2,'0')}</span><i>↗</i></div><p>WYDARZENIE STUDENCKIE</p><h3>${event[0]}</h3><b>Zobacz wydarzenie →</b></a>`).join('')}</div></section>`:`<section class="events-section"><div class="events-head"><div><p class="overline blue">WYDARZENIA W MIEŚCIE</p><h2>Spotkajmy się<br><em>na żywo.</em></h2></div><p>Już wkrótce pojawią się tutaj dedykowane wydarzenia dla studentów w mieście ${city.name}.</p></div><div class="events-grid"><article class="event-placeholder"><div class="event-art"><span>01</span><i>＋</i></div><p>WKRÓTCE</p><h3>Pierwsze wydarzenie</h3><span>Grafika i szczegóły pojawią się niebawem.</span></article><article class="event-placeholder"><div class="event-art alt"><span>02</span><i>＋</i></div><p>WKRÓTCE</p><h3>Kolejne spotkanie</h3><span>To miejsce czeka na dedykowane wydarzenie.</span></article><article class="event-placeholder"><div class="event-art dark"><span>03</span><i>＋</i></div><p>WKRÓTCE</p><h3>Coś specjalnego</h3><span>Obserwuj grupę, żeby niczego nie przegapić.</span></article></div></section>`;
document.getElementById('cityPage').innerHTML=`
<section class="city-hero" style="--city-image:url('${city.image}')"><div class="city-hero-shade"></div><div class="city-hero-copy"><p class="overline">${city.region.toUpperCase()} · MIASTO ${city.number}</p><h1>${city.name}</h1><p>${city.desc}</p><a class="button" href="#dolacz">Dołącz do społeczności <span>↓</span></a></div></section>
<section class="join-section" id="dolacz"><div class="join-copy"><p class="overline">SPOŁECZNOŚĆ ${city.name.toUpperCase()}</p><h2>Poznaj ludzi,<br>zanim zacznie się <em>rok.</em></h2><p>Pytaj o uczelnie i mieszkania, poznaj przyszłych znajomych oraz bądź na bieżąco z tym, co dzieje się w mieście.</p></div><a class="join-button" href="${city.facebook}" target="_blank" rel="noopener noreferrer"><span><small>OFICJALNA GRUPA STUDENCKA 2026</small>Dołącz do grupy — ${city.name}</span><b>↗</b></a></section>
${eventsSection}
${universitySection}
<section class="city-features"><article><span>01</span><h3>Studiowanie</h3><p>Sprawdź ofertę lokalnych uczelni i wybierz środowisko dopasowane do Twojego kierunku.</p></article><article><span>02</span><h3>Codzienność</h3><p>Pomyśl o dojazdach, mieszkaniu i miejscach, w których naprawdę będziesz spędzać czas.</p></article><article><span>03</span><h3>Po zajęciach</h3><p>Poznaj kulturę, naturę i społeczność, które budują unikalny klimat miasta.</p></article></section>
${seoSection}
${universitySeoSection}
${cityFaqSection}
<section class="next-city"><p>NASTĘPNE MIASTO</p><a href="city.html?miasto=${CITIES[(CITIES.indexOf(city)+1)%CITIES.length].slug}">${CITIES[(CITIES.indexOf(city)+1)%CITIES.length].name} <span>→</span></a></section>`;
