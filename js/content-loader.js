/**
 * CBMS - Dynamic Content Loader
 * Asynchronously loads novedades.json and actividades.json
 * Re-renders cards with active language without page reload
 */

(function () {
  'use strict';

  let cachedNews = null;
  let cachedEvents = null;

  function formatDate(isoString, lang) {
    if (!isoString) return '';
    try {
      const parts = isoString.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const month = parts[1];
        const day = parts[2];
        if (lang === 'en') {
          return `${month}/${day}/${year}`;
        }
        return `${day}/${month}/${year}`;
      }
      return isoString;
    } catch {
      return isoString;
    }
  }

  function renderNews(newsItems, lang) {
    const container = document.getElementById('news-container');
    if (!container) return;

    if (!newsItems || newsItems.length === 0) {
      const emptyMsg = window.cbmsI18n ? window.cbmsI18n.getTranslation('news_empty', 'No hay novedades disponibles.') : 'No hay novedades disponibles.';
      container.innerHTML = `<p class="empty-state">${emptyMsg}</p>`;
      return;
    }

    const readMoreText = window.cbmsI18n ? window.cbmsI18n.getTranslation('btn_read_more', 'Leer más') : 'Leer más';

    const cardsHtml = newsItems.map((item) => {
      const title = lang === 'en' ? (item.titulo_en || item.titulo_es) : item.titulo_es;
      const summary = lang === 'en' ? (item.resumen_en || item.resumen_es) : item.resumen_es;
      const formattedDate = formatDate(item.fecha, lang);

      const linkHtml = item.enlace_url 
        ? `<a href="${item.enlace_url}" class="item-link" target="_blank" rel="noopener noreferrer">${readMoreText} &rarr;</a>` 
        : '';

      return `
        <article class="item-card">
          <div class="item-meta">
            <span class="item-badge">${item.tipo}</span>
            <time class="item-date" datetime="${item.fecha}">${formattedDate}</time>
          </div>
          <h4 class="item-title">${title}</h4>
          <p class="item-summary">${summary}</p>
          ${linkHtml}
        </article>
      `;
    }).join('');

    container.innerHTML = cardsHtml;
  }

  function renderEvents(eventItems, lang) {
    const container = document.getElementById('events-container');
    if (!container) return;

    if (!eventItems || eventItems.length === 0) {
      const emptyMsg = window.cbmsI18n ? window.cbmsI18n.getTranslation('events_empty', 'No hay actividades programadas.') : 'No hay actividades programadas.';
      container.innerHTML = `<p class="empty-state">${emptyMsg}</p>`;
      return;
    }

    const moreInfoText = window.cbmsI18n ? window.cbmsI18n.getTranslation('btn_register', 'Más información') : 'Más información';

    const cardsHtml = eventItems.map((item) => {
      const title = lang === 'en' ? (item.titulo_en || item.titulo_es) : item.titulo_es;
      const summary = lang === 'en' ? (item.resumen_en || item.resumen_es) : item.resumen_es;
      const formattedDate = formatDate(item.fecha, lang);

      const linkHtml = item.enlace_url 
        ? `<a href="${item.enlace_url}" class="item-link" target="_blank" rel="noopener noreferrer">${moreInfoText} &rarr;</a>` 
        : '';

      return `
        <article class="item-card">
          <div class="item-meta">
            <span class="item-badge">${item.tipo}</span>
            <time class="item-date" datetime="${item.fecha}">${formattedDate}</time>
          </div>
          <h4 class="item-title">${title}</h4>
          <p class="item-summary" style="color: var(--color-accent-mint); font-size: 0.82rem; font-weight: 500; margin-bottom: 0.4rem;">
            📍 ${item.horario_lugar}
          </p>
          <p class="item-summary">${summary}</p>
          ${linkHtml}
        </article>
      `;
    }).join('');

    container.innerHTML = cardsHtml;
  }

  async function loadAllContent() {
    const currentLang = window.cbmsI18n ? window.cbmsI18n.getLanguage() : 'es';

    // Fetch News
    try {
      const newsResp = await fetch('./data/novedades.json');
      if (newsResp.ok) {
        cachedNews = await newsResp.json();
      } else {
        cachedNews = [];
      }
    } catch (e) {
      console.warn('Could not load novedades.json:', e);
      cachedNews = [];
    }
    renderNews(cachedNews, currentLang);

    // Fetch Events
    try {
      const eventsResp = await fetch('./data/actividades.json');
      if (eventsResp.ok) {
        cachedEvents = await eventsResp.json();
      } else {
        cachedEvents = [];
      }
    } catch (e) {
      console.warn('Could not load actividades.json:', e);
      cachedEvents = [];
    }
    renderEvents(cachedEvents, currentLang);
  }

  function reRenderWithLanguage(lang) {
    if (cachedNews) renderNews(cachedNews, lang);
    if (cachedEvents) renderEvents(cachedEvents, lang);
  }

  function init() {
    loadAllContent();

    // Listen for language change events
    window.addEventListener('cbms:languageChanged', (e) => {
      const newLang = e.detail && e.detail.lang ? e.detail.lang : 'es';
      reRenderWithLanguage(newLang);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
