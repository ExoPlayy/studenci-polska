(function () {
  'use strict';

  const allowedHosts = new Set(['grupystudenckie.pl', 'www.grupystudenckie.pl', 'exoplayy.github.io']);
  if (!allowedHosts.has(window.location.hostname)) return;
  if (navigator.globalPrivacyControl === true || navigator.doNotTrack === '1') return;

  const endpoint = 'https://stats.grupystudenckie.pl/collect.php';
  const query = new URLSearchParams(window.location.search);
  const pathCity = window.location.pathname.split('/').filter(Boolean)[0] || '';
  const currentCity = document.body.dataset.citySlug || query.get('miasto') || (pathCity && !pathCity.includes('.') ? pathCity : '');
  const campaign = {
    utm_source: query.get('utm_source') || '',
    utm_medium: query.get('utm_medium') || '',
    utm_campaign: query.get('utm_campaign') || ''
  };

  function deviceType() {
    const width = Math.min(window.screen.width || 9999, window.innerWidth || 9999);
    if (width < 600) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  function send(event, details) {
    const payload = Object.assign({
      event,
      page: window.location.pathname,
      city: currentCity,
      name: '',
      target: '',
      referrer: document.referrer,
      device: deviceType()
    }, campaign, details || {});

    try {
      fetch(endpoint, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        keepalive: true,
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify(payload)
      }).catch(function () {});
    } catch (error) {
      // Analityka nigdy nie może przeszkodzić w działaniu strony.
    }
  }

  function text(element, selector) {
    const node = selector ? element.querySelector(selector) : element;
    return node ? node.textContent.replace(/\s+/g, ' ').trim() : '';
  }

  function cityFromLink(link) {
    try {
      const url = new URL(link.href, window.location.href);
      const cleanSlug = url.pathname.split('/').filter(Boolean)[0] || '';
      return url.searchParams.get('miasto') || (cleanSlug && !cleanSlug.includes('.') ? cleanSlug : '');
    } catch (error) {
      return '';
    }
  }

  send('page_view', { name: document.title });

  document.addEventListener('click', function (event) {
    const link = event.target.closest('a');
    if (!link) return;

    if (link.matches('.city-card')) {
      send('city_click', { city: cityFromLink(link), name: text(link, 'h3'), target: link.href });
    } else if (link.matches('.join-button')) {
      send('city_group_click', { name: text(link, 'span'), target: link.href });
    } else if (link.matches('.university-card')) {
      send('university_group_click', { name: text(link, 'strong'), target: link.href });
    } else if (link.matches('.event-card')) {
      send('event_click', { name: text(link, 'h3'), target: link.href });
    } else if (link.matches('.newsletter-strip a')) {
      send('newsletter_click', { name: 'Studencki newsletter', target: link.href });
    } else if (link.matches('.insurance-action')) {
      send('insurance_click', { name: 'Ubezpiecz się na studiach', target: link.href });
    } else if (link.matches('.hero-group-card')) {
      const candidates = link.href.indexOf('studia2025') !== -1;
      send(candidates ? 'candidate_group_click' : 'national_group_click', {
        name: candidates ? 'Kandydaci na studia' : 'Studenci Polska',
        target: link.href
      });
    } else if (link.matches('.next-city a')) {
      send('next_city_click', { city: cityFromLink(link), name: text(link), target: link.href });
    }
  }, true);
})();
