// PWA Install Prompt Handler
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallButton();
});

function showInstallButton() {
  const installBtn = document.createElement('button');
  installBtn.id = 'pwa-install-btn';
  installBtn.className = 'pwa-install-btn';
  installBtn.innerHTML = '📱 Uygulamayı Yükle';
  installBtn.onclick = installPWA;
  
  document.body.appendChild(installBtn);
  
  setTimeout(() => {
    installBtn.classList.add('show');
  }, 3000);
}

async function installPWA() {
  if (!deferredPrompt) return;
  
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  
  console.log(`PWA install: ${outcome}`);
  
  if (outcome === 'accepted') {
    document.getElementById('pwa-install-btn')?.remove();
  }
  
  deferredPrompt = null;
}

window.addEventListener('appinstalled', () => {
  console.log('PWA installed');
  document.getElementById('pwa-install-btn')?.remove();
});
