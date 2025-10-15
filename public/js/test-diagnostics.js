// test-diagnostics.js - System Diagnostics & Health Checks

const diagnostics = {
  results: [],

  async checkWebSocketLatency() {
    const start = Date.now();
    return new Promise((resolve) => {
      const socket = io({ transports: ['websocket'] });
      socket.on('connect', () => {
        const latency = Date.now() - start;
        socket.disconnect();
        resolve({
          name: 'WebSocket Latency',
          status: latency < 100 ? 'healthy' : latency < 300 ? 'warning' : 'error',
          value: `${latency}ms`,
          message: latency < 100 ? 'Excellent' : latency < 300 ? 'Good' : 'Slow connection',
          fixes: latency >= 300 ? ['Check network', 'Restart router'] : []
        });
      });
      socket.on('connect_error', () => {
        socket.disconnect();
        resolve({
          name: 'WebSocket Latency',
          status: 'error',
          value: 'Failed',
          message: 'Cannot connect to WebSocket',
          fixes: ['Check server status', 'Verify firewall settings']
        });
      });
    });
  },

  async checkHTTPSProtocol() {
    const isHTTPS = window.location.protocol === 'https:';
    return {
      name: 'HTTPS Protocol',
      status: isHTTPS ? 'healthy' : 'warning',
      value: window.location.protocol,
      message: isHTTPS ? 'Secure connection' : 'Insecure connection',
      fixes: !isHTTPS ? ['Enable HTTPS', 'Use SSL certificate'] : []
    };
  },

  async checkCORS() {
    try {
      const response = await fetch('/health', { method: 'OPTIONS' });
      const corsHeader = response.headers.get('Access-Control-Allow-Origin');
      return {
        name: 'CORS Configuration',
        status: corsHeader ? 'healthy' : 'warning',
        value: corsHeader || 'Not configured',
        message: corsHeader ? 'CORS enabled' : 'CORS not configured',
        fixes: !corsHeader ? ['Configure CORS headers'] : []
      };
    } catch (error) {
      return {
        name: 'CORS Configuration',
        status: 'error',
        value: 'Failed',
        message: error.message,
        fixes: ['Check server configuration']
      };
    }
  },

  async checkDNSSpeed() {
    const start = Date.now();
    try {
      await fetch('/health', { cache: 'no-store' });
      const dnsTime = Date.now() - start;
      return {
        name: 'DNS Resolution',
        status: dnsTime < 50 ? 'healthy' : dnsTime < 150 ? 'warning' : 'error',
        value: `${dnsTime}ms`,
        message: dnsTime < 50 ? 'Fast' : dnsTime < 150 ? 'Moderate' : 'Slow',
        fixes: dnsTime >= 150 ? ['Change DNS server', 'Clear DNS cache'] : []
      };
    } catch (error) {
      return {
        name: 'DNS Resolution',
        status: 'error',
        value: 'Failed',
        message: error.message,
        fixes: ['Check internet connection']
      };
    }
  },

  async checkICEGathering() {
    try {
      const pc = new RTCPeerConnection();
      const start = Date.now();
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          pc.close();
          resolve({
            name: 'ICE Gathering',
            status: 'error',
            value: 'Timeout',
            message: 'ICE gathering timeout',
            fixes: ['Check firewall', 'Enable STUN/TURN']
          });
        }, 5000);

        pc.onicecandidate = (event) => {
          if (event.candidate === null) {
            clearTimeout(timeout);
            const duration = Date.now() - start;
            pc.close();
            resolve({
              name: 'ICE Gathering',
              status: duration < 2000 ? 'healthy' : 'warning',
              value: `${duration}ms`,
              message: 'ICE candidates gathered',
              fixes: []
            });
          }
        };

        pc.createOffer().then(offer => pc.setLocalDescription(offer));
      });
    } catch (error) {
      return {
        name: 'ICE Gathering',
        status: 'error',
        value: 'Failed',
        message: error.message,
        fixes: ['Check WebRTC support']
      };
    }
  },

  async checkTURNAuth() {
    try {
      const response = await fetch('/api/ice-servers');
      const data = await response.json();
      const hasTURN = data.iceServers?.some(s => s.urls?.some(u => u.includes('turn:')));
      return {
        name: 'TURN Server',
        status: hasTURN ? 'healthy' : 'warning',
        value: hasTURN ? 'Configured' : 'Not configured',
        message: hasTURN ? 'TURN server available' : 'No TURN server',
        fixes: !hasTURN ? ['Configure TURN server'] : []
      };
    } catch (error) {
      return {
        name: 'TURN Server',
        status: 'error',
        value: 'Failed',
        message: error.message,
        fixes: ['Check ICE server endpoint']
      };
    }
  },

  async checkXSSVulnerability() {
    const testString = '<script>alert("xss")</script>';
    const div = document.createElement('div');
    div.textContent = testString;
    const isSafe = div.innerHTML.includes('&lt;script&gt;');
    return {
      name: 'XSS Protection',
      status: isSafe ? 'healthy' : 'error',
      value: isSafe ? 'Protected' : 'Vulnerable',
      message: isSafe ? 'XSS protection active' : 'XSS vulnerability detected',
      fixes: !isSafe ? ['Sanitize user input', 'Use textContent'] : []
    };
  },

  async checkCookieSecurity() {
    const cookies = document.cookie;
    const hasSecure = cookies.includes('Secure');
    const hasHttpOnly = !cookies.includes('sessionId'); // httpOnly cookies not accessible
    return {
      name: 'Cookie Security',
      status: hasHttpOnly ? 'healthy' : 'warning',
      value: hasHttpOnly ? 'Secure' : 'Needs improvement',
      message: hasHttpOnly ? 'HttpOnly cookies enabled' : 'HttpOnly not detected',
      fixes: !hasHttpOnly ? ['Enable httpOnly flag', 'Use Secure flag'] : []
    };
  },

  async checkCSP() {
    const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    return {
      name: 'Content Security Policy',
      status: csp ? 'healthy' : 'warning',
      value: csp ? 'Enabled' : 'Not configured',
      message: csp ? 'CSP headers present' : 'No CSP detected',
      fixes: !csp ? ['Add CSP headers'] : []
    };
  },

  async checkPageLoad() {
    const perfData = performance.getEntriesByType('navigation')[0];
    const loadTime = perfData ? perfData.loadEventEnd - perfData.fetchStart : 0;
    return {
      name: 'Page Load Time',
      status: loadTime < 2000 ? 'healthy' : loadTime < 4000 ? 'warning' : 'error',
      value: `${Math.round(loadTime)}ms`,
      message: loadTime < 2000 ? 'Fast' : loadTime < 4000 ? 'Moderate' : 'Slow',
      fixes: loadTime >= 4000 ? ['Optimize assets', 'Enable caching'] : []
    };
  },

  async checkMemoryLeak() {
    if (performance.memory) {
      const used = performance.memory.usedJSHeapSize / 1048576;
      const limit = performance.memory.jsHeapSizeLimit / 1048576;
      const percentage = (used / limit) * 100;
      return {
        name: 'Memory Usage',
        status: percentage < 50 ? 'healthy' : percentage < 80 ? 'warning' : 'error',
        value: `${Math.round(used)}MB / ${Math.round(limit)}MB`,
        message: `${Math.round(percentage)}% used`,
        fixes: percentage >= 80 ? ['Reload page', 'Close unused tabs'] : []
      };
    }
    return {
      name: 'Memory Usage',
      status: 'unknown',
      value: 'N/A',
      message: 'Memory API not available',
      fixes: []
    };
  },

  async checkBrowserCompatibility() {
    const features = {
      webrtc: !!window.RTCPeerConnection,
      websocket: !!window.WebSocket,
      serviceWorker: 'serviceWorker' in navigator,
      localStorage: !!window.localStorage,
      mediaDevices: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    };
    const supported = Object.values(features).filter(Boolean).length;
    const total = Object.keys(features).length;
    return {
      name: 'Browser Compatibility',
      status: supported === total ? 'healthy' : supported >= 3 ? 'warning' : 'error',
      value: `${supported}/${total} features`,
      message: supported === total ? 'Fully compatible' : 'Some features missing',
      fixes: supported < total ? ['Update browser', 'Use modern browser'] : []
    };
  }
};

async function runFullDiagnostics() {
  const panel = document.getElementById('diagnosticsResult');
  panel.innerHTML = '<p style="text-align:center;color:#666;">Running diagnostics...</p>';
  panel.style.display = 'grid';

  const checks = [
    diagnostics.checkWebSocketLatency(),
    diagnostics.checkHTTPSProtocol(),
    diagnostics.checkCORS(),
    diagnostics.checkDNSSpeed(),
    diagnostics.checkICEGathering(),
    diagnostics.checkTURNAuth(),
    diagnostics.checkXSSVulnerability(),
    diagnostics.checkCookieSecurity(),
    diagnostics.checkCSP(),
    diagnostics.checkPageLoad(),
    diagnostics.checkMemoryLeak(),
    diagnostics.checkBrowserCompatibility()
  ];

  const results = await Promise.all(checks);
  diagnostics.results = results;

  panel.innerHTML = results.map(result => `
    <div class="diagnostic-card">
      <h3>
        <span class="status-indicator status-${result.status}"></span>
        ${result.name}
      </h3>
      <p><strong>Value:</strong> ${result.value}</p>
      <p><strong>Status:</strong> ${result.message}</p>
      ${result.fixes.length > 0 ? `
        <div class="fix-actions">
          <strong>Fixes:</strong>
          ${result.fixes.map(fix => `<button class="fix-btn" onclick="alert('${fix}')">${fix}</button>`).join('')}
        </div>
      ` : ''}
    </div>
  `).join('');
}
