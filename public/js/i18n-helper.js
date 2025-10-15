// Simple i18n helper for non-module scripts
class I18nHelper {
  constructor() {
    this.currentLang = localStorage.getItem('i18nextLng') || 'tr';
    this.translations = {};
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
    this.updateUI();
  }

  t(key) {
    const keys = key.split('.');
    let value = this.translations[this.currentLang];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  }

  changeLanguage(lang) {
    if (this.translations[lang]) {
      this.currentLang = lang;
      localStorage.setItem('i18nextLng', lang);
      this.updateUI();
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }
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
