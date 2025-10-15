/**
 * Offline Handler
 * Detects offline/online status and shows banner
 */
class OfflineHandler {
  constructor() {
    this.isOffline = !navigator.onLine;
    this.banner = null;
    this.init();
  }

  init() {
    // Create offline banner
    this.createBanner();

    // Listen to online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Listen to service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data.type === 'OFFLINE') {
          this.handleOffline();
        } else if (event.data.type === 'ONLINE') {
          this.handleOnline();
        }
      });
    }

    // Check initial state
    if (this.isOffline) {
      this.showBanner();
    }
  }

  createBanner() {
    this.banner = document.createElement('div');
    this.banner.className = 'offline-banner';
    this.banner.innerHTML = '⚠️ İnternet bağlantısı yok - Offline moddasınız';
    document.body.prepend(this.banner);
  }

  handleOffline() {
    this.isOffline = true;
    this.showBanner();
    console.warn('📡 Offline mode activated');

    if (typeof window.showToast === 'function') {
      window.showToast('warning', 'İnternet bağlantısı kesildi');
    }
  }

  handleOnline() {
    this.isOffline = false;
    this.hideBanner();
    console.log('📡 Online mode restored');

    if (typeof window.showToast === 'function') {
      window.showToast('success', 'İnternet bağlantısı geri geldi');
    }
  }

  showBanner() {
    if (this.banner) {
      this.banner.classList.add('show');
    }
  }

  hideBanner() {
    if (this.banner) {
      this.banner.classList.remove('show');
    }
  }
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.offlineHandler = new OfflineHandler();
  });
} else {
  window.offlineHandler = new OfflineHandler();
}
