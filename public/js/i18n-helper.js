// Simple i18n helper for non-module scripts
class I18nHelper {
  constructor() {
    this.currentLang = localStorage.getItem('i18nextLng') || this.detectLanguage();
    this.translations = {};
    this.rtlLanguages = ['ar', 'he', 'fa'];
  }

  detectLanguage() {
    const browserLang = navigator.language.split('-')[0];
    const supportedLangs = ['tr', 'en', 'de', 'ar'];
    return supportedLangs.includes(browserLang) ? browserLang : 'tr';
  }

  async init() {
    const langs = ['tr', 'en', 'de', 'ar'];
    for (const lang of langs) {
      try {
        const response = await fetch(`/locales/${lang}/translation.json`);
        this.translations[lang] = await response.json();
      } catch (e) {
        console.warn(`Failed to load ${lang} translations`);
      }
    }
    this.applyLanguage(this.currentLang);
  }

  t(key, params = {}) {
    const keys = key.split('.');
    let value = this.translations[this.currentLang];
    for (const k of keys) {
      value = value?.[k];
    }
    if (typeof value === 'string') {
      return value.replace(/\{\{(\w+)\}\}/g, (_, k) => params[k] || '');
    }
    return value || key;
  }

  changeLanguage(lang) {
    if (this.translations[lang]) {
      this.currentLang = lang;
      localStorage.setItem('i18nextLng', lang);
      this.applyLanguage(lang);
    }
  }

  applyLanguage(lang) {
    document.documentElement.lang = lang;
    const isRTL = this.rtlLanguages.includes(lang);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';

    // Load RTL CSS if needed
    if (isRTL && !document.getElementById('rtl-css')) {
      const link = document.createElement('link');
      link.id = 'rtl-css';
      link.rel = 'stylesheet';
      link.href = '/css/rtl.css';
      document.head.appendChild(link);
    } else if (!isRTL) {
      const rtlCss = document.getElementById('rtl-css');
      if (rtlCss) rtlCss.remove();
    }

    this.updateUI();
  }

  updateUI() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = this.t(key);
    });
  }
}

const i18n = new I18nHelper();
window.i18n = i18n;

// Auto-detect and apply language on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => i18n.init());
} else {
  i18n.init();
}
