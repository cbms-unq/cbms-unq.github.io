/**
 * CBMS - Dynamic Content Loader
 * Asynchronously loads novedades.json and actividades.json
 * Re-renders cards with active language without page reload
 */

(function () {
  'use strict';

  let cachedNews = null;
  let cachedEvents = null;

  const TYPE_LABELS_EN = {
    'Noticia': 'News',
    'Llamado / Beca': 'Call / Fellowship',
    'Seminario': 'Seminar',
    'Publicación': 'Publication',
    'Taller': 'Workshop',
    'Jornada': 'Symposium',
    'Defensa de Tesis': 'Thesis Defense'
  };

  function translateType(tipo, lang) {
    if (!tipo) return '';
    if (lang === 'en' && TYPE_LABELS_EN[tipo]) {
      return TYPE_LABELS_EN[tipo];
    }
    return tipo;
  }

  function formatDate(isoString, lang) {
    if (!isoString) return '';
    try {
      const parts = isoString.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const month = parts[1];
        const day = parts[2];
        return lang === 'en' ? `${month}/${day}/${year}` : `${day}/${month}/${year}`;
      }
      return isoString;
    } catch {
      return isoString;
    }
  }

  function isSafeHttpUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return false;
    try {
      const parsed = new URL(rawUrl, window.location.href);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
      return false;
    }
  }

  function renderEmptyState(container, key, fallbackText) {
    const msg = window.cbmsI18n ? window.cbmsI18n.getTranslation(key, fallbackText) : fallbackText;
    const p = document.createElement('p');
    p.className = 'empty-state';
    p.textContent = msg;
    container.replaceChildren(p);
  }

  function buildItemCard(item, lang, options) {
    const article = document.createElement('article');
    article.className = 'item-card';

    const meta = document.createElement('div');
    meta.className = 'item-meta';

    const badge = document.createElement('span');
    badge.className = 'item-badge';
    badge.textContent = translateType(item.tipo, lang);
    meta.appendChild(badge);

    if (item.fecha) {
      const timeEl = document.createElement('time');
      timeEl.className = 'item-date';
      timeEl.setAttribute('datetime', item.fecha);
      timeEl.textContent = formatDate(item.fecha, lang);
      meta.appendChild(timeEl);
    } else if (options.fallbackDateLabel) {
      const dateLabel = document.createElement('span');
      dateLabel.className = 'item-date';
      dateLabel.textContent = options.fallbackDateLabel;
      meta.appendChild(dateLabel);
    }

    article.appendChild(meta);

    const titleEl = document.createElement('h4');
    titleEl.className = 'item-title';
    titleEl.textContent = lang === 'en' ? (item.titulo_en || item.titulo_es) : item.titulo_es;
    article.appendChild(titleEl);

    if (options.includeSchedule) {
      const scheduleText = lang === 'en'
        ? (item.horario_lugar_en || item.horario_lugar)
        : (item.horario_lugar_es || item.horario_lugar);
      if (scheduleText) {
        const scheduleEl = document.createElement('p');
        scheduleEl.className = 'item-schedule';
        scheduleEl.textContent = scheduleText;
        article.appendChild(scheduleEl);
      }
    }

    const summaryEl = document.createElement('p');
    summaryEl.className = 'item-summary';
    summaryEl.textContent = lang === 'en' ? (item.resumen_en || item.resumen_es) : item.resumen_es;
    article.appendChild(summaryEl);

    if (isSafeHttpUrl(item.enlace_url)) {
      const linkLabel = window.cbmsI18n
        ? window.cbmsI18n.getTranslation(options.linkKey, options.linkFallback)
        : options.linkFallback;
      const linkEl = document.createElement('a');
      linkEl.className = 'item-link';
      linkEl.href = item.enlace_url;
      linkEl.target = '_blank';
      linkEl.rel = 'noopener noreferrer';
      linkEl.textContent = `${linkLabel} \u2192`;
      article.appendChild(linkEl);
    }

    return article;
  }

  function renderNews(newsItems, lang) {
    const container = document.getElementById('news-container');
    if (!container) return;

    if (!newsItems || newsItems.length === 0) {
      renderEmptyState(container, 'news_empty', 'No hay novedades disponibles.');
      return;
    }

    const fragment = document.createDocumentFragment();
    newsItems.forEach((item) => {
      fragment.appendChild(buildItemCard(item, lang, {
        fallbackDateLabel: lang === 'en' ? 'Recent' : 'Reciente',
        includeSchedule: false,
        linkKey: 'btn_read_more',
        linkFallback: 'Leer más'
      }));
    });
    container.replaceChildren(fragment);
  }

  function renderEvents(eventItems, lang) {
    const container = document.getElementById('events-container');
    if (!container) return;

    if (!eventItems || eventItems.length === 0) {
      renderEmptyState(container, 'events_empty', 'No hay actividades programadas.');
      return;
    }

    const fragment = document.createDocumentFragment();
    eventItems.forEach((item) => {
      fragment.appendChild(buildItemCard(item, lang, {
        fallbackDateLabel: lang === 'en' ? 'Monthly series' : 'Ciclo mensual',
        includeSchedule: true,
        linkKey: 'btn_register',
        linkFallback: 'Más información'
      }));
    });
    container.replaceChildren(fragment);
  }

  async function fetchJsonArray(path) {
    try {
      const resp = await fetch(path);
      if (resp.ok) {
        return await resp.json();
      }
      return [];
    } catch (e) {
      console.warn(`Could not load ${path}:`, e);
      return [];
    }
  }

  async function loadAllContent() {
    const [news, events] = await Promise.all([
      fetchJsonArray('./data/novedades.json'),
      fetchJsonArray('./data/actividades.json')
    ]);

    cachedNews = news;
    cachedEvents = events;

    const currentLang = window.cbmsI18n ? window.cbmsI18n.getLanguage() : 'es';
    renderNews(cachedNews, currentLang);
    renderEvents(cachedEvents, currentLang);
  }

  function reRenderWithLanguage(lang) {
    if (cachedNews) renderNews(cachedNews, lang);
    if (cachedEvents) renderEvents(cachedEvents, lang);
  }

  function init() {
    loadAllContent();

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
