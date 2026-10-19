/**
 * CBMS - Client-side Bilingual Translation Engine (ES / EN)
 * Self-contained Vanilla ES6+ without external libraries
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'cbms_preferred_lang';
  let currentLang = 'es';
  let translations = null;

  async function loadTranslations() {
    try {
      const response = await fetch('./data/translations.json');
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status} loading translations`);
      }
      translations = await response.json();
    } catch (err) {
      console.warn('Could not load translations.json, fallback to static HTML:', err);
      translations = null;
    }
  }

  function detectInitialLanguage() {
    // 1. URL parameter check (?lang=en or ?lang=es)
    const urlParams = new URLSearchParams(window.location.search);
    const paramLang = urlParams.get('lang');
    if (paramLang === 'en' || paramLang === 'es') {
      return paramLang;
    }

    // 2. Local storage check
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'es') {
      return saved;
    }

    // 3. Browser language fallback
    const browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (browserLang.startsWith('en')) {
      return 'en';
    }

    return 'es';
  }

  function applyTranslations(lang) {
    if (!translations || !translations[lang]) return;

    const dict = translations[lang];

    // Update textual contents
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[key] !== undefined) {
        // Use innerHTML only if key contains HTML tags, otherwise textContent
        if (dict[key].includes('<') && dict[key].includes('>')) {
          el.innerHTML = dict[key];
        } else {
          el.textContent = dict[key];
        }
      }
    });

    // Update image alt attributes
    document.querySelectorAll('[data-i18n-alt]').forEach((el) => {
      const key = el.getAttribute('data-i18n-alt');
      if (dict[key] !== undefined) {
        el.setAttribute('alt', dict[key]);
      }
    });

    // Update document language tag
    document.documentElement.lang = lang;

    // Update language switch buttons active states
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      const btnLang = btn.getAttribute('data-lang');
      const isActive = btnLang === lang;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    // Dispatch custom event for dynamic components (e.g., content-loader)
    window.dispatchEvent(new CustomEvent('cbms:languageChanged', { detail: { lang } }));
  }

  async function setLanguage(lang) {
    if (lang !== 'es' && lang !== 'en') return;
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);

    if (!translations) {
      await loadTranslations();
    }
    applyTranslations(lang);
  }

  function getLanguage() {
    return currentLang;
  }

  function getTranslation(key, fallback = '') {
    if (!translations || !translations[currentLang]) return fallback;
    return translations[currentLang][key] || fallback;
  }

  async function init() {
    await loadTranslations();
    currentLang = detectInitialLanguage();
    applyTranslations(currentLang);

    // Bind click events on language toggle buttons
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const targetLang = e.currentTarget.getAttribute('data-lang');
        if (targetLang && targetLang !== currentLang) {
          setLanguage(targetLang);
        }
      });
    });
  }

  // Public API exposed on window
  window.cbmsI18n = {
    init,
    setLanguage,
    getLanguage,
    getTranslation
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
