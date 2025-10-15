// PWA Install Prompt Handler
let deferredPrompt;

window.addEventListener('beforeinstallprompt', e => {
  console.log('🚀 PWA install prompt available');

  // Prevent default browser prompt
  e.preventDefault();

  // Store event for later use
  deferredPrompt = e;

  // Show custom install button
  showInstallPromotion();
});

function showInstallPromotion() {
  // Check if previously dismissed
  const dismissed = localStorage.getItem('pwa-dismissed');
  if (dismissed && Date.now() < parseInt(dismissed)) {
    return;
  }

  // Create install banner
  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.className = 'pwa-install-banner';
  banner.innerHTML = `
    <div class="banner-content">
      <span class="banner-icon">📱</span>
      <div class="banner-text">
        <strong>Uygulamayı Yükle</strong>
        <p>Ana ekrana ekle, daha hızlı erişim</p>
      </div>
      <button id="pwa-install-btn" class="install-btn">Yükle</button>
      <button id="pwa-dismiss-btn" class="dismiss-btn">✕</button>
    </div>
  `;

  document.body.appendChild(banner);

  // Slide in animation
  setTimeout(() => banner.classList.add('show'), 100);

  // Install button click
  document.getElementById('pwa-install-btn').addEventListener('click', async () => {
    if (!deferredPrompt) return;

    // Show browser install prompt
    deferredPrompt.prompt();

    // Wait for user choice
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`PWA install outcome: ${outcome}`);

    // Track installation
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_install', { outcome });
    }

    // Clear prompt
    deferredPrompt = null;
    banner.remove();
  });

  // Dismiss button
  document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
    banner.classList.remove('show');
    setTimeout(() => banner.remove(), 300);

    // Remember dismissal (don't show again for 7 days)
    localStorage.setItem('pwa-dismissed', Date.now() + 7 * 24 * 60 * 60 * 1000);
  });
}

// Track successful installation
window.addEventListener('appinstalled', () => {
  console.log('✅ PWA installed successfully');

  // Track event
  if (typeof gtag !== 'undefined') {
    gtag('event', 'pwa_installed');
  }

  // Show thank you message
  if (typeof showToast === 'function') {
    showToast('success', 'Uygulama başarıyla yüklendi! 🎉');
  }

  // Clear deferred prompt
  deferredPrompt = null;
});

// Detect if running as PWA
function isPWA() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone ||
    document.referrer.includes('android-app://')
  );
}

if (isPWA()) {
  console.log('🚀 Running as PWA');
  document.body.classList.add('pwa-mode');
}
