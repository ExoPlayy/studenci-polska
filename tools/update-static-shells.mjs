import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const update=(file,transform)=>{
  const target=path.join(root,file);
  const before=fs.readFileSync(target,'utf8');
  const after=transform(before);
  if(after===before) throw new Error(`No changes applied to ${file}`);
  fs.writeFileSync(target,after);
};

update('index.html',html=>html
  .replace('<link rel="canonical" href="https://grupystudenckie.pl/">','<link rel="canonical" href="https://grupystudenckie.pl/"><link rel="alternate" hreflang="pl" href="https://grupystudenckie.pl/"><link rel="alternate" hreflang="en" href="https://grupystudenckie.pl/en/"><link rel="alternate" hreflang="x-default" href="https://grupystudenckie.pl/">')
  .replace('Przejd? do tre?ci','Przejdź do treści')
  .replace('<a href="poradniki.html">Poradniki</a></nav>','<a href="poradniki.html">Poradniki</a><a href="grupy-tematyczne.html">Grupy tematyczne</a></nav><a class="language-switch" href="/en/" lang="en" hreflang="en" aria-label="English version">EN</a>')
  .replace('<footer><a class="brand" href="index.html"><span>SP</span>studenci<b>.</b>polska</a><p>Twój przewodnik po studenckiej Polsce.</p><small>© 2026</small></footer>','<footer><a class="brand" href="index.html"><span>SP</span>studenci<b>.</b>polska</a><p>Twój przewodnik po studenckiej Polsce.</p><a class="footer-link" href="poradniki.html">Poradniki</a><a class="footer-link" href="grupy-tematyczne.html">Grupy tematyczne</a><a class="footer-link" href="/en/" lang="en">English</a><small>© 2026</small></footer>'));

update('city.html',html=>html
  .replace('Przejd? do tre?ci','Przejdź do treści')
  .replace('<a href="poradniki.html">Poradniki</a></nav>','<a href="poradniki.html">Poradniki</a><a href="grupy-tematyczne.html">Grupy tematyczne</a></nav><a class="language-switch" href="/en/" lang="en" hreflang="en" aria-label="English version">EN</a>')
  .replace('<a class="footer-link" href="poradniki.html">Poradniki dla studentów</a><small>© 2026</small>','<a class="footer-link" href="poradniki.html">Poradniki</a><a class="footer-link" href="grupy-tematyczne.html">Grupy tematyczne</a><a class="footer-link" href="/en/" lang="en">English</a><small>© 2026</small>'));

console.log('Updated homepage and city shell navigation');
