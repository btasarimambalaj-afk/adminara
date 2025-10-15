// test-repair.js - Automated Repair Functions

const repairActions = {
  clearCache() {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then(names => names.forEach(name => caches.delete(name)));
      }
      alert('✅ Cache cleared successfully. Please reload the page.');
      return true;
    } catch (error) {
      alert('❌ Failed to clear cache: ' + error.message);
      return false;
    }
  },

  resetServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
        alert('✅ Service Worker reset. Please reload the page.');
      });
    } else {
      alert('⚠️ Service Worker not supported');
    }
  },

  clearCookies() {
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
    alert('✅ Cookies cleared. Please reload the page.');
  },

  reconnectWebSocket() {
    if (window.socket) {
      window.socket.disconnect();
      setTimeout(() => {
        window.socket.connect();
        alert('✅ WebSocket reconnected');
      }, 1000);
    } else {
      alert('⚠️ No active WebSocket connection');
    }
  },

  resetWebRTC() {
    if (window.webrtcManager) {
      window.webrtcManager.cleanup();
      alert('✅ WebRTC reset. Please start a new call.');
    } else {
      alert('⚠️ No active WebRTC connection');
    }
  },

  checkPermissions() {
    const permissions = ['camera', 'microphone'];
    permissions.forEach(async (perm) => {
      try {
        const result = await navigator.permissions.query({ name: perm });
        console.log(`${perm}: ${result.state}`);
      } catch (error) {
        console.log(`${perm}: not supported`);
      }
    });
    alert('✅ Check console for permission status');
  },

  testMediaDevices() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          stream.getTracks().forEach(track => track.stop());
          alert('✅ Camera and microphone access granted');
        })
        .catch(error => {
          alert('❌ Media access denied: ' + error.message);
        });
    } else {
      alert('⚠️ getUserMedia not supported');
    }
  },

  reloadPage() {
    if (confirm('Reload the page?')) {
      window.location.reload();
    }
  },

  exportDiagnostics() {
    if (diagnostics.results.length === 0) {
      alert('⚠️ No diagnostics data. Run diagnostics first.');
      return;
    }

    const report = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      results: diagnostics.results
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagnostics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  quickFix() {
    if (confirm('Run quick fix? This will:\n- Clear cache\n- Reset Service Worker\n- Reconnect WebSocket\n\nContinue?')) {
      this.clearCache();
      this.resetServiceWorker();
      this.reconnectWebSocket();
      setTimeout(() => {
        if (confirm('Quick fix completed. Reload page now?')) {
          window.location.reload();
        }
      }, 2000);
    }
  },

  autoFix() {
    const issues = diagnostics.results
      .filter(r => r.status === 'fulfilled' && r.value.fixes && r.value.fixes.length > 0)
      .map(r => r.value);

    if (issues.length === 0) {
      alert('✅ No issues found that can be auto-fixed!');
      return;
    }

    const fixList = issues.map(i => `- ${i.name}`).join('\n');
    if (confirm(`Auto-fix will attempt to resolve:\n${fixList}\n\nContinue?`)) {
      issues.forEach(issue => {
        issue.fixes.forEach(fix => {
          if (this[fix.action]) {
            console.log(`Applying fix: ${fix.label}`);
            this[fix.action]();
          }
        });
      });
      setTimeout(() => {
        alert('✅ Auto-fix completed! Please reload the page.');
      }, 1000);
    }
  },

  retryWebSocket() {
    this.reconnectWebSocket();
  },

  checkNetwork() {
    alert('🔍 Network check:\n- Online: ' + navigator.onLine + '\n- Check your internet connection');
  },

  updateBrowser() {
    alert('🌐 Please update your browser to the latest version for best compatibility.');
  },

  enforceHTTPS() {
    if (location.protocol === 'http:' && location.hostname !== 'localhost') {
      if (confirm('Switch to HTTPS?')) {
        window.location.href = location.href.replace('http:', 'https:');
      }
    } else {
      alert('✅ Already using HTTPS or localhost');
    }
  },

  requestMediaPermissions() {
    this.testMediaDevices();
  },

  optimizeAssets() {
    alert('🛠️ Asset optimization tips:\n- Enable browser caching\n- Compress images\n- Minify CSS/JS\n- Use CDN');
  }
};

// Global repair function
window.repairActions = repairActions;
