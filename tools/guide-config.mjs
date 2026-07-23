export const GUIDES=[
  ['miasto','jak-wybrac-miasto-i-uczelnie','Jak wybrać miasto i uczelnię?','Porównaj kierunki, koszty życia, kampus, dojazdy i możliwości rozwoju przed wyborem miejsca studiów.'],
  ['mieszkanie','bezpieczny-wynajem-mieszkania','Bezpieczny wynajem mieszkania dla studenta','Jak sprawdzić ofertę, umowę, kaucję i właściciela przed wynajęciem pokoju lub mieszkania.'],
  ['akademik','akademik-czy-mieszkanie','Akademik czy mieszkanie?','Porównanie kosztów, prywatności, lokalizacji i studenckiej codzienności w akademiku oraz mieszkaniu.'],
  ['budzet','budzet-studenta','Budżet studenta bez niespodzianek','Prosty plan kosztów stałych, codziennych wydatków i rezerwy finansowej podczas studiów.'],
  ['stypendia','stypendia-i-pomoc-materialna','Stypendia i pomoc materialna dla studentów','Gdzie sprawdzać stypendia, zapomogi i terminy składania dokumentów na uczelni.'],
  ['start','pierwsze-tygodnie-na-studiach','Pierwsze tygodnie na studiach','Praktyczna checklista: konto uczelniane, plan zajęć, dziekanat, biblioteka i najważniejsze terminy.'],
  ['ludzie','jak-poznac-ludzi-na-studiach','Jak poznać ludzi na studiach?','Grupy, wydarzenia, koła naukowe, sport i bezpieczne sposoby budowania znajomości.'],
  ['sesja','jak-przygotowac-sie-do-sesji','Jak przygotować się do pierwszej sesji?','Planowanie egzaminów, aktywna nauka, powtórki i organizacja czasu bez chaosu.'],
  ['praca','praca-podczas-studiow','Praca podczas studiów','Jak znaleźć bezpieczną ofertę, dopasować grafik i budować doświadczenie bez zaniedbywania nauki.'],
  ['przeprowadzka','przeprowadzka-na-studia','Przeprowadzka na studia bez chaosu','Co spakować, jak odebrać pokój i co sprawdzić w nowym mieście podczas pierwszego tygodnia.'],
  ['bezpieczenstwo','bezpieczenstwo-studenta','Bezpieczeństwo studenta na co dzień','Jak rozpoznawać oszustwa mieszkaniowe, fałszywe oferty pracy i ryzykowne płatności.'],
  ['zdrowie','zdrowie-i-rownowaga-na-studiach','Zdrowie i równowaga na studiach','Sen, regularność, pomoc psychologiczna i reagowanie, gdy trudności zaczynają narastać.'],
  ['rekrutacja','rekrutacja-na-studia-krok-po-kroku','Rekrutacja na studia krok po kroku','Terminy, punkty, dokumenty, opłaty i kierunek rezerwowy w jednym praktycznym planie.'],
  ['kierunek','jak-wybrac-kierunek-studiow','Jak wybrać kierunek studiów?','Jak porównać programy, specjalności, praktyki i możliwe ścieżki kariery po studiach.'],
  ['legitymacja','legitymacja-studencka-i-znizki','Legitymacja studencka i zniżki','Ważność dokumentu, bilety, ulgi i bezpieczne korzystanie z legitymacji studenckiej.'],
  ['organizacja','organizacja-nauki-na-studiach','Organizacja nauki na studiach','Jeden kalendarz, priorytety, terminy projektów i regularne powtórki bez przeciążenia.'],
  ['portfolio','kola-naukowe-i-portfolio','Koła naukowe i portfolio studenta','Jak wybierać aktywności, dokumentować projekty i zamieniać doświadczenie w dobre portfolio.'],
  ['wyjazdy','erasmus-i-wyjazdy-studenckie','Erasmus i wyjazdy studenckie','Język, przedmioty, budżet, dokumenty i przygotowanie do wyjazdu zagranicznego.'],
  ['biznes','jak-zaczac-biznes-na-studiach','Jak zacząć biznes na studiach?','Od pomysłu i pierwszego klienta po prosty budżet, testowanie usługi i bezpieczne formalności.'],
  ['szkolenia','kursy-i-szkolenia-dla-studentow','Kursy i szkolenia dla studentów','Jak wybierać wartościowe kursy, warsztaty i certyfikaty bez przepłacania i kolekcjonowania przypadkowych szkoleń.'],
  ['ai','ai-w-nauce-i-pracy-studenta','AI w nauce i pracy studenta','Jak rozsądnie korzystać ze sztucznej inteligencji na studiach, rozwijać kompetencje i nie naruszać zasad uczelni.'],
  ['moda','moda-cyrkularna-i-wymiana-ubran','Moda cyrkularna i wymiana ubrań','Bezpieczna sprzedaż, kupowanie i wymiana ubrań między studentami oraz sposoby na bardziej świadomą garderobę.'],
  ['praca-zdalna','jak-znalezc-prace-zdalna-na-studiach','Jak znaleźć pracę zdalną na studiach?','Gdzie szukać zleceń, jak sprawdzać ogłoszenia i przygotować się do pierwszej bezpiecznej współpracy online.'],
  ['tanie-wyjazdy','tanie-wyjazdy-studenckie','Tanie wyjazdy studenckie','Planowanie transportu, noclegu, budżetu i bezpieczeństwa podczas niedrogich wyjazdów ze znajomymi.']
].map(([anchor,slug,title,description],index)=>({anchor,slug,title,description,number:String(index+1).padStart(2,'0')}));

export const GUIDE_BY_ANCHOR=Object.fromEntries(GUIDES.map(guide=>[guide.anchor,guide]));
