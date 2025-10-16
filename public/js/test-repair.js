// test-repair.js - System Repair Actions

class RepairActions {
  async clearCache() {
    console.log('🗑️ Clearing cache...');
    showToast('info', 'Clearing cache...');

    try {
      localStorage.clear();
      sessionStorage.clear();

      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.unregister();
        }
      }

      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
      }

      showToast('success', 'Cache cleared successfully');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      showToast('error', `Clear cache failed: ${error.message}`);
    }
  }

  retryWebSocket() {
    console.log('🔄 Retrying WebSocket connection...');
    showToast('info', 'Reconnecting...');
    setTimeout(() => window.location.reload(), 1000);
  }

  async checkNetwork() {
    console.log('🌐 Checking network...');

    try {
      const response = await fetch('/health', { method: 'HEAD' });
      if (response.ok) {
        showToast('success', 'Network is working');
      } else {
        showToast('error', 'Server unreachable');
      }
    } catch (error) {
      showToast('error', 'Network error: Check your connection');
    }
  }

  updateBrowser() {
    const userAgent = navigator.userAgent;
    let browserName = 'your browser';

    if (userAgent.includes('Chrome')) browserName = 'Chrome';
    else if (userAgent.includes('Firefox')) browserName = 'Firefox';
    else if (userAgent.includes('Safari')) browserName = 'Safari';
    else if (userAgent.includes('Edge')) browserName = 'Edge';

    showToast('warning', `Please update ${browserName} to the latest version`);

    const updateUrls = {
      Chrome: 'chrome://settings/help',
      Firefox: 'about:support',
      Safari: 'https://support.apple.com/downloads/safari',
      Edge: 'edge://settings/help'
    };

    setTimeout(() => {
      if (updateUrls[browserName]) {
        window.open(updateUrls[browserName], '_blank');
      }
    }, 2000);
  }

  enforceHTTPS() {
    if (location.protocol === 'http:' && location.hostname !== 'localhost') {
      if (confirm('Switch to HTTPS?')) {
        showToast('info', 'Redirecting to HTTPS...');
        setTimeout(() => {
          location.href = location.href.replace('http:', 'https:');
        }, 1000);
      }
    } else {
      showToast('success', 'Already using HTTPS or localhost');
    }
  }

  async requestMediaPermissions() {
    console.log('🎥 Requesting media permissions...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      showToast('success', 'Permissions granted');
      stream.getTracks().forEach(track => track.stop());
      setTimeout(() => runFullDiagnostics(), 1000);
    } catch (error) {
      showToast('error', `Permission denied: ${error.name}`);
      this.showPermissionInstructions();
    }
  }

  showPermissionInstructions() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>🎥 Camera/Microphone Permissions</h3>
        <p>To enable permissions:</p>
        <ol>
          <li>Click the 🔒 icon in your browser's address bar</li>
          <li>Find "Camera" and "Microphone" settings</li>
          <li>Change to "Allow"</li>
          <li>Reload the page</li>
        </ol>
        <button onclick="this.parentElement.parentElement.remove()">Got it</button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  reloadPage() {
    showToast('info', 'Reloading page...');
    setTimeout(() => window.location.reload(true), 500);
  }

  async optimizeAssets() {
    console.log('⚡ Optimizing assets...');
    showToast('info', 'Optimizing...');

    const criticalResources = ['/css/main.css', '/js/webrtc.js', '/js/client.js'];

    for (const resource of criticalResources) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = resource;
      document.head.appendChild(link);
    }

    if ('connection' in navigator && 'saveData' in navigator.connection) {
      document.documentElement.classList.add('save-data-mode');
    }

    showToast('success', 'Optimization applied');
    setTimeout(() => window.location.reload(), 2000);
  }

  async autoFix() {
    console.log('🔧 Running auto-fix...');

    const issues = diagnostics.results
      .filter(r => r.status === 'fulfilled' && r.value.fixes && r.value.fixes.length > 0)
      .map(r => r.value);

    if (issues.length === 0) {
      showToast('success', 'No issues found that can be auto-fixed!');
      return;
    }

    const fixList = issues.map(i => `- ${i.name}`).join('\n');
    if (confirm(`Auto-fix will attempt to resolve:\n${fixList}\n\nContinue?`)) {
      showToast('info', 'Running auto-fix...');

      for (const issue of issues) {
        for (const fix of issue.fixes) {
          if (this[fix.action]) {
            console.log(`Applying fix: ${fix.label}`);
            try {
              await this[fix.action]();
            } catch (error) {
              console.error(`Fix failed: ${fix.label}`, error);
            }
          }
        }
      }

      showToast('success', 'Auto-fix completed');
      setTimeout(() => runFullDiagnostics(), 3000);
    }
  }

  async repairWebRTC() {
    console.log('🔧 Repairing WebRTC...');

    try {
      const pc = new RTCPeerConnection();
      pc.createDataChannel('test');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await new Promise((resolve) => {
        pc.onicecandidate = (event) => {
          if (event.candidate === null) resolve();
        };
        setTimeout(resolve, 5000);
      });

      pc.close();
      showToast('success', 'WebRTC is working');
    } catch (error) {
      showToast('error', `WebRTC repair failed: ${error.message}`);
      this.showWebRTCTroubleshooting();
    }
  }

  showWebRTCTroubleshooting() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>🔧 WebRTC Troubleshooting</h3>
        <h4>Common Issues:</h4>
        <ul>
          <li><strong>Firewall blocking:</strong> Check firewall settings</li>
          <li><strong>VPN interference:</strong> Try disabling VPN</li>
          <li><strong>Browser extensions:</strong> Disable ad blockers</li>
          <li><strong>Network type:</strong> Corporate networks may block WebRTC</li>
        </ul>
        <h4>Quick Fixes:</h4>
        <ol>
          <li>Restart your browser</li>
          <li>Clear browser cache and cookies</li>
          <li>Try incognito/private mode</li>
          <li>Switch to a different network</li>
        </ol>
        <button onclick="this.parentElement.parentElement.remove()">Close</button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  async cleanupDatabase() {
    console.log('🗄️ Cleaning up database...');

    try {
      if ('indexedDB' in window) {
        const databases = await indexedDB.databases();
        for (const db of databases) {
          indexedDB.deleteDatabase(db.name);
          console.log(`Deleted database: ${db.name}`);
        }
        showToast('success', 'Database cleaned');
      }
    } catch (error) {
      showToast('error', `Database cleanup failed: ${error.message}`);
    }
  }

  async resetAll() {
    if (!confirm('⚠️ This will reset all settings and clear all data. Continue?')) {
      return;
    }

    console.log('🔄 Resetting everything...');

    try {
      await this.clearCache();
      await this.cleanupDatabase();

      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.unregister();
        }
      }

      showToast('success', 'Reset complete. Reloading...');
      setTimeout(() => window.location.href = '/', 2000);
    } catch (error) {
      showToast('error', `Reset failed: ${error.message}`);
    }
  }
}

// Initialize repair actions
const repairActions = new RepairActions();

// Helper function for toast notifications
function showToast(type, message) {
  if (typeof window.showToast === 'function') {
    window.showToast(type, message);
  } else {
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
}
