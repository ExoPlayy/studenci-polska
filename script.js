const grid=document.getElementById('cityGrid');
const input=document.getElementById('search');
const counter=document.getElementById('counter');
const empty=document.getElementById('empty');
const siteUrl='https://grupystudenckie.pl';
const structuredData=document.createElement('script');
structuredData.type='application/ld+json';
structuredData.textContent=JSON.stringify({
  '@context':'https://schema.org',
  '@type':'WebSite',
  name:'Studenci Polska',
  alternateName:'Grupy Studenckie',
  url:`${siteUrl}/`,
  description:'Przewodnik po miastach akademickich, grupach studenckich, uczelniach i wydarzeniach w Polsce.',
  inLanguage:'pl-PL',
  mainEntity:{
    '@type':'ItemList',
    numberOfItems:CITIES.length,
    itemListElement:CITIES.map((city,index)=>({
      '@type':'ListItem',
      position:index+1,
      name:city.name,
      url:`${siteUrl}/city.html?miasto=${encodeURIComponent(city.slug)}`
    }))
  }
});
document.head.appendChild(structuredData);
function render(list){grid.innerHTML=list.map(c=>`<a class="city-card" href="city.html?miasto=${c.slug}" aria-label="Otwórz przewodnik: ${c.name}"><img src="${c.image}" alt="${c.name} — miejski krajobraz" loading="lazy"><span class="num">${c.number}</span><span class="go">↗</span><div class="card-copy"><small>${c.region.toUpperCase()}</small><h3>${c.name}</h3><p>${c.tag}</p></div></a>`).join('');counter.textContent=`${list.length} ${list.length===1?'miasto':'miasta'}`;empty.style.display=list.length?'none':'block'}
render(CITIES);
input.addEventListener('input',()=>{const q=input.value.toLocaleLowerCase('pl').trim();render(CITIES.filter(c=>`${c.name} ${c.region} ${c.tag}`.toLocaleLowerCase('pl').includes(q)))})
