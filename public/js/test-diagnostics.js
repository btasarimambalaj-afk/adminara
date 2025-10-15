// test-diagnostics.js - Advanced Diagnostic System

class SystemDiagnostics {
  constructor() {
    this.results = [];
  }

  async checkWebSocket() {
    const start = Date.now();
    return new Promise((resolve) => {
      const socket = io({ transports: ['websocket'] });
      socket.on('connect', () => {
        const latency = Date.now() - start;
        socket.disconnect();
        const result = {
          name: 'WebSocket Connection',
          status: latency < 100 ? 'healthy' : latency < 300 ? 'warning' : 'error',
          details: [`Connection time: ${latency}ms`, latency < 100 ? '✅ Excellent' : latency < 300 ? '⚠️ Good' : '❌ Slow connection'],
          fixes: latency >= 300 ? [{ label: 'Check Network', action: 'checkNetwork' }, { label: 'Restart Router', action: 'reloadPage' }] : []
        };
        socket.disconnect();
        resolve(result);
      });
      socket.on('connect_error', (error) => {
        socket.disconnect();
        resolve({
          name: 'WebSocket Connection',
          status: 'error',
          details: ['❌ Connection failed', error.message || 'Cannot connect'],
          fixes: [{ label: 'Check Server', action: 'checkNetwork' }, { label: 'Retry', action: 'retryWebSocket' }]
        });
      });
      setTimeout(() => resolve({
        name: 'WebSocket Connection',
        status: 'error',
        details: ['❌ Connection timeout'],
        fixes: [{ label: 'Retry', action: 'retryWebSocket' }]
      }), 5000);
    });
  },

  async checkWebRTC() {
    const result = {
      name: 'WebRTC Capabilities',
      status: 'unknown',
      details: [],
      fixes: []
    };

    try {
      if (!window.RTCPeerConnection) {
        result.status = 'error';
        result.details.push('❌ RTCPeerConnection not supported');
        result.fixes.push({ label: 'Update Browser', action: 'updateBrowser' });
        return result;
      }

      result.details.push('✅ RTCPeerConnection supported');

      const pc = new RTCPeerConnection();
      const start = Date.now();

      await new Promise((resolve) => {
        pc.onicecandidate = (event) => {
          if (event.candidate === null) {
            const duration = Date.now() - start;
            result.details.push(`ICE gathering: ${duration}ms`);
            result.status = duration < 5000 ? 'healthy' : 'warning';
            pc.close();
            resolve();
          }
        };

        pc.createDataChannel('test');
        pc.createOffer().then(offer => pc.setLocalDescription(offer));

        setTimeout(() => {
          result.status = 'error';
          result.details.push('❌ ICE gathering timeout');
          pc.close();
          resolve();
        }, 10000);
      });
    } catch (error) {
      result.status = 'error';
      result.details.push(`❌ Error: ${error.message}`);
    }

    return result;
  },

  async checkMediaDevices() {
    const result = {
      name: 'Media Devices',
      status: 'unknown',
      details: [],
      fixes: []
    };

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        result.status = 'error';
        result.details.push('❌ getUserMedia not supported');
        result.fixes.push({ label: 'Enable HTTPS', action: 'enforceHTTPS' });
        return result;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(d => d.kind === 'videoinput');
      const mics = devices.filter(d => d.kind === 'audioinput');

      result.details.push(`📷 Cameras: ${cameras.length}`);
      result.details.push(`🎤 Microphones: ${mics.length}`);

      if (cameras.length === 0 || mics.length === 0) {
        result.status = 'warning';
        result.fixes.push({ label: 'Check Permissions', action: 'requestMediaPermissions' });
      } else {
        result.status = 'healthy';
      }
    } catch (error) {
      result.status = 'error';
      result.details.push(`❌ Error: ${error.message}`);
    }

    return result;
  },

  async checkStorage() {
    const result = {
      name: 'Browser Storage',
      status: 'unknown',
      details: [],
      fixes: []
    };

    try {
      if (typeof localStorage !== 'undefined') {
        result.details.push('✅ LocalStorage available');

        if (navigator.storage && navigator.storage.estimate) {
          const estimate = await navigator.storage.estimate();
          const usage = ((estimate.usage / estimate.quota) * 100).toFixed(2);
          result.details.push(`Storage: ${usage}% used`);

          if (usage > 80) {
            result.status = 'warning';
            result.fixes.push({ label: 'Clear Cache', action: 'clearCache' });
          }
        }
      } else {
        result.status = 'error';
        result.details.push('❌ LocalStorage not available');
      }

      if (typeof indexedDB !== 'undefined') {
        result.details.push('✅ IndexedDB available');
      }

      if (result.status !== 'error' && result.status !== 'warning') {
        result.status = 'healthy';
      }
    } catch (error) {
      result.status = 'error';
      result.details.push(`❌ Error: ${error.message}`);
    }

    return result;
  },

  async checkNetwork() {
    const result = {
      name: 'Network Status',
      status: 'unknown',
      details: [],
      fixes: []
    };

    try {
      result.details.push(navigator.onLine ? '✅ Online' : '❌ Offline');

      if (navigator.connection) {
        const conn = navigator.connection;
        result.details.push(`Type: ${conn.effectiveType || 'unknown'}`);
        result.details.push(`Downlink: ${conn.downlink || 'unknown'} Mbps`);
        result.details.push(`RTT: ${conn.rtt || 'unknown'} ms`);

        if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') {
          result.status = 'warning';
          result.details.push('⚠️ Slow connection detected');
        } else {
          result.status = 'healthy';
        }
      } else {
        result.status = 'healthy';
      }
    } catch (error) {
      result.status = 'error';
      result.details.push(`❌ Error: ${error.message}`);
    }

    return result;
  },

  async checkSecurity() {
    const result = {
      name: 'Security Status',
      status: 'unknown',
      details: [],
      fixes: []
    };

    try {
      if (location.protocol === 'https:') {
        result.details.push('✅ HTTPS enabled');
      } else {
        result.status = 'warning';
        result.details.push('⚠️ HTTP (insecure)');
        result.fixes.push({ label: 'Switch to HTTPS', action: 'enforceHTTPS' });
      }

      const cookies = document.cookie.split(';');
      result.details.push(`Cookies: ${cookies.length}`);

      const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      if (cspMeta) {
        result.details.push('✅ CSP enabled');
      }

      if (result.status !== 'warning') {
        result.status = 'healthy';
      }
    } catch (error) {
      result.status = 'error';
      result.details.push(`❌ Error: ${error.message}`);
    }

    return result;
  },

  async checkPerformance() {
    const result = {
      name: 'Performance Metrics',
      status: 'unknown',
      details: [],
      fixes: []
    };

    try {
      if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;

        result.details.push(`Load time: ${loadTime}ms`);
        result.details.push(`DOM ready: ${domReady}ms`);

        if (loadTime > 3000) {
          result.status = 'warning';
          result.fixes.push({ label: 'Optimize Assets', action: 'optimizeAssets' });
        } else {
          result.status = 'healthy';
        }
      }

      if (window.performance && window.performance.memory) {
        const memory = window.performance.memory;
        const usage = ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(2);
        result.details.push(`Memory: ${usage}%`);

        if (usage > 80) {
          result.status = 'warning';
          result.fixes.push({ label: 'Reload Page', action: 'reloadPage' });
        }
      }

      if (result.status !== 'warning') {
        result.status = 'healthy';
      }
    } catch (error) {
      result.status = 'error';
      result.details.push(`❌ Error: ${error.message}`);
    }

    return result;
  }

  async runFullDiagnostics() {
    console.log('🔍 Starting full system diagnostics...');

    const checks = [
      this.checkWebSocket(),
      this.checkWebRTC(),
      this.checkMediaDevices(),
      this.checkStorage(),
      this.checkNetwork(),
      this.checkSecurity(),
      this.checkPerformance()
    ];

    const results = await Promise.allSettled(checks);
    this.results = results;
    this.displayResults(results);
    return results;
  }

  displayResults(results) {
    const container = document.getElementById('diagnosticsResult');
    container.style.display = 'grid';
    container.innerHTML = '';

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const card = this.createDiagnosticCard(result.value);
        container.appendChild(card);
      }
    });

    this.generateSummary(results);
  }

  createDiagnosticCard(data) {
    const card = document.createElement('div');
    card.className = 'diagnostic-card';

    const statusClass = `status-${data.status}`;
    const statusIcon = { healthy: '✅', warning: '⚠️', error: '❌', unknown: '❓' }[data.status];

    let html = `
      <h3>
        <span class="status-indicator ${statusClass}"></span>
        ${data.name}
      </h3>
      <div class="status-badge ${statusClass}">
        ${statusIcon} ${data.status.toUpperCase()}
      </div>
      <div class="details">
        ${data.details.map(d => `<p>• ${d}</p>`).join('')}
      </div>
    `;

    if (data.fixes && data.fixes.length > 0) {
      html += `
        <div class="fix-actions">
          ${data.fixes.map(fix => `
            <button class="fix-btn ${fix.action.includes('clear') || fix.action.includes('reload') ? 'danger' : ''}" 
                    onclick="repairActions.${fix.action}()">
              🔧 ${fix.label}
            </button>
          `).join('')}
        </div>
      `;
    }

    card.innerHTML = html;
    return card;
  }

  generateSummary(results) {
    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const healthy = fulfilled.filter(r => r.value.status === 'healthy').length;
    const warnings = fulfilled.filter(r => r.value.status === 'warning').length;
    const errors = fulfilled.filter(r => r.value.status === 'error').length;

    const summary = document.createElement('div');
    summary.className = 'summary-card';
    summary.innerHTML = `
      <h3>📊 Diagnostic Summary</h3>
      <div class="summary-stats">
        <div class="stat-item healthy">
          <span class="stat-value">${healthy}</span>
          <span class="stat-label">Healthy</span>
        </div>
        <div class="stat-item warning">
          <span class="stat-value">${warnings}</span>
          <span class="stat-label">Warnings</span>
        </div>
        <div class="stat-item error">
          <span class="stat-value">${errors}</span>
          <span class="stat-label">Errors</span>
        </div>
      </div>
      <div class="summary-actions">
        <button class="repair-button" onclick="repairActions.autoFix()">
          🛠️ Auto-Fix All Issues
        </button>
      </div>
    `;

    document.getElementById('diagnosticsResult').prepend(summary);
  }
}

// Initialize
const diagnostics = new SystemDiagnostics();

function runFullDiagnostics() {
  const panel = document.getElementById('diagnosticsResult');
  panel.innerHTML = '<p style="text-align:center;color:#666;">Running diagnostics...</p>';
  panel.style.display = 'grid';
  diagnostics.runFullDiagnostics();
}
