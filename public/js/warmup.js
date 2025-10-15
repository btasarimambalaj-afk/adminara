// Render Cold Start Handler

async function warmupServer() {
  const statusEl = document.getElementById('status') || document.getElementById('status-text');
  if (!statusEl) return true;

  const originalText = statusEl.textContent;
  statusEl.textContent = 'Sunucu hazırlanıyor... (15-30 sn)';

  const startTime = Date.now();
  let ready = false;

  for (let i = 0; i < 6; i++) {
    try {
      const response = await fetch('/health', {
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        ready = true;
        break;
      }
    } catch (err) {
      console.log(`Warmup attempt ${i + 1}/6 failed`);
    }

    if (i < 5) {
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  const elapsed = Math.floor((Date.now() - startTime) / 1000);

  if (ready) {
    statusEl.textContent = originalText;
    console.log(`✅ Server ready in ${elapsed}s`);
  } else {
    statusEl.textContent = `Yavaş yanıt: ${elapsed}s - Lütfen bekleyin`;
    console.warn(`⚠️ Server slow response: ${elapsed}s`);
  }

  return ready;
}

// Auto-run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', warmupServer);
} else {
  warmupServer();
}
