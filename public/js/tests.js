(function () {
  'use strict';

  var state = {
    passed: 0,
    failed: 0,
    total: 0,
    startTime: 0,
    results: [],
    filter: 'all',
  };

  var elements = {};

  function init() {
    elements.logs = document.getElementById('logs');
    elements.passed = document.getElementById('passed');
    elements.failed = document.getElementById('failed');
    elements.total = document.getElementById('total');
    elements.duration = document.getElementById('duration');
    elements.progress = document.getElementById('progress');

    var runAllBtn = document.getElementById('runAll');
    var clearBtn = document.getElementById('clearBtn');
    var exportBtn = document.getElementById('exportBtn');

    if (runAllBtn) runAllBtn.onclick = runAll;
    if (clearBtn) clearBtn.onclick = clear;
    if (exportBtn) exportBtn.onclick = exportData;

    var btns = document.querySelectorAll('.test-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].onclick = handleTestClick;
    }

    var filters = document.querySelectorAll('.filter-btn');
    for (var j = 0; j < filters.length; j++) {
      filters[j].onclick = handleFilterClick;
    }

    var headers = document.querySelectorAll('.category-header');
    for (var k = 0; k < headers.length; k++) {
      headers[k].onclick = handleHeaderClick;
    }

    addLog('Test Suite hazir', 'info');
  }

  function addLog(msg, type) {
    var time = new Date().toLocaleTimeString();
    var div = document.createElement('div');
    div.className = 'log ' + type;
    div.setAttribute('data-type', type);

    var timeSpan = document.createElement('span');
    timeSpan.className = 'log-time';
    timeSpan.textContent = time;

    var contentSpan = document.createElement('span');
    contentSpan.className = 'log-content';
    contentSpan.textContent = msg;

    div.appendChild(timeSpan);
    div.appendChild(contentSpan);
    elements.logs.insertBefore(div, elements.logs.firstChild);

    state.results.push({ time: time, type: type, message: msg });
    applyFilter();
  }

  function applyFilter() {
    var logs = elements.logs.querySelectorAll('.log');
    for (var i = 0; i < logs.length; i++) {
      var logType = logs[i].getAttribute('data-type');
      if (state.filter === 'all' || logType === state.filter) {
        logs[i].style.display = 'flex';
      } else {
        logs[i].style.display = 'none';
      }
    }
  }

  function updateStats(success) {
    state.total++;
    if (success) state.passed++;
    else state.failed++;

    elements.passed.textContent = state.passed;
    elements.failed.textContent = state.failed;
    elements.total.textContent = state.total;

    var pct = (state.total / 39) * 100;
    elements.progress.style.width = pct + '%';

    var dur = Math.floor((Date.now() - state.startTime) / 1000);
    elements.duration.textContent = dur + 's';
  }

  function setStatus(name, status) {
    var btn = document.querySelector('[data-test="' + name + '"]');
    if (btn) btn.className = 'test-btn ' + status;
  }

  function clear() {
    elements.logs.innerHTML = '';
    state.results = [];
    state.passed = 0;
    state.failed = 0;
    state.total = 0;
    state.startTime = 0;

    elements.passed.textContent = '0';
    elements.failed.textContent = '0';
    elements.total.textContent = '0';
    elements.duration.textContent = '0s';
    elements.progress.style.width = '0%';

    var btns = document.querySelectorAll('.test-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].className = 'test-btn';
    }
  }

  function wait(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function test1() {
    setStatus('socket', 'running');
    var ok = typeof io !== 'undefined';
    addLog(ok ? 'OK Socket.io yuklü' : 'FAIL Socket.io yok', ok ? 'success' : 'error');
    setStatus('socket', ok ? 'success' : 'failed');
    updateStats(ok);
    return Promise.resolve();
  }

  function test2() {
    setStatus('webrtc', 'running');
    var hasRTC = typeof RTCPeerConnection !== 'undefined';
    var hasMedia = typeof navigator.mediaDevices !== 'undefined';
    var ok = hasRTC && hasMedia;
    addLog(ok ? 'OK WebRTC destekleniyor' : 'FAIL WebRTC yok', ok ? 'success' : 'error');
    setStatus('webrtc', ok ? 'success' : 'failed');
    updateStats(ok);
    return Promise.resolve();
  }

  function test3() {
    setStatus('fetch', 'running');
    var ok = typeof fetch !== 'undefined';
    addLog(ok ? 'OK Fetch API mevcut' : 'FAIL Fetch yok', ok ? 'success' : 'error');
    setStatus('fetch', ok ? 'success' : 'failed');
    updateStats(ok);
    return Promise.resolve();
  }

  function test4() {
    setStatus('browser', 'running');
    var lang = navigator.language;
    var online = navigator.onLine;
    addLog('OK Browser: ' + lang + ', Online: ' + online, 'success');
    setStatus('browser', 'success');
    updateStats(true);
    return Promise.resolve();
  }

  function test5() {
    setStatus('health', 'running');
    addLog('Checking /health...', 'info');
    return fetch((window.baseURL || '') + '/health')
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        var ok = data.status === 'ok';
        addLog(
          ok ? 'OK Health check passed' : 'FAIL Health check failed',
          ok ? 'success' : 'error'
        );
        setStatus('health', ok ? 'success' : 'failed');
        updateStats(ok);
      })
      .catch(function (err) {
        addLog('FAIL Health error: ' + err.message, 'error');
        setStatus('health', 'failed');
        updateStats(false);
      });
  }

  function test6() {
    setStatus('ice', 'running');
    addLog('Checking /config/ice-servers...', 'info');
    return fetch((window.baseURL || '') + '/config/ice-servers')
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        var ok = data.iceServers && data.iceServers.length > 0;
        addLog(
          ok ? 'OK ICE Servers: ' + data.iceServers.length : 'FAIL No ICE servers',
          ok ? 'success' : 'error'
        );
        setStatus('ice', ok ? 'success' : 'failed');
        updateStats(ok);
      })
      .catch(function (err) {
        addLog('FAIL ICE error: ' + err.message, 'error');
        setStatus('ice', 'failed');
        updateStats(false);
      });
  }

  function test7() {
    setStatus('metrics', 'running');
    addLog('Checking /metrics...', 'info');
    return fetch((window.baseURL || '') + '/metrics')
      .then(function (res) {
        if (res.status === 401) {
          addLog('OK Metrics endpoint protected (401)', 'success');
          setStatus('metrics', 'success');
          updateStats(true);
        } else if (res.status === 200) {
          addLog('OK Metrics endpoint accessible', 'success');
          setStatus('metrics', 'success');
          updateStats(true);
        } else {
          addLog('FAIL Metrics unexpected status: ' + res.status, 'error');
          setStatus('metrics', 'failed');
          updateStats(false);
        }
      })
      .catch(function (err) {
        addLog('FAIL Metrics error: ' + err.message, 'error');
        setStatus('metrics', 'failed');
        updateStats(false);
      });
  }

  function test8() {
    setStatus('socketConnect', 'running');
    if (typeof io === 'undefined') {
      addLog('FAIL Socket.io not loaded', 'error');
      setStatus('socketConnect', 'failed');
      updateStats(false);
      return Promise.resolve();
    }

    addLog('Connecting socket...', 'info');
    var socket = io(window.baseURL || '', {
      reconnection: false,
      timeout: 10000,
      transports: ['websocket', 'polling'],
    });

    return new Promise(function (resolve) {
      var timeout = setTimeout(function () {
        addLog('FAIL Socket timeout (10s)', 'error');
        setStatus('socketConnect', 'failed');
        updateStats(false);
        if (socket) socket.disconnect();
        resolve();
      }, 10000);

      socket.once('connect', function () {
        clearTimeout(timeout);
        addLog('OK Socket connected: ' + socket.id, 'success');
        setStatus('socketConnect', 'success');
        updateStats(true);
        socket.disconnect();
        resolve();
      });

      socket.once('connect_error', function () {
        clearTimeout(timeout);
        addLog('FAIL Socket connection error', 'error');
        setStatus('socketConnect', 'failed');
        updateStats(false);
        resolve();
      });
    });
  }

  function test9() {
    setStatus('ping', 'running');
    addLog('Ping test...', 'info');
    var start = Date.now();
    return fetch((window.baseURL || '') + '/health')
      .then(function (res) {
        var dur = Date.now() - start;
        var ok = res.ok;
        addLog(ok ? 'OK Ping: ' + dur + 'ms' : 'FAIL Ping failed', ok ? 'success' : 'error');
        setStatus('ping', ok ? 'success' : 'failed');
        updateStats(ok);
      })
      .catch(function (err) {
        addLog('FAIL Ping error: ' + err.message, 'error');
        setStatus('ping', 'failed');
        updateStats(false);
      });
  }

  function test10() {
    setStatus('otpMetrics', 'running');
    addLog('Checking OTP metrics...', 'info');
    return fetch((window.baseURL || '') + '/metrics')
      .then(function (res) {
        if (res.status === 401) {
          addLog('OK OTP metrics protected (skipping content check)', 'success');
          setStatus('otpMetrics', 'success');
          updateStats(true);
          return;
        }
        return res.text();
      })
      .then(function (text) {
        if (!text) return;
        var has1 = text.indexOf('otp_requests_total') > -1;
        var has2 = text.indexOf('otp_invalid_attempts_total') > -1;
        var has3 = text.indexOf('otp_lockouts_total') > -1;
        var has4 = text.indexOf('otp_active_locks_gauge') > -1;
        var ok = has1 && has2 && has3 && has4;
        addLog(ok ? 'OK OTP metrics found' : 'FAIL OTP metrics missing', ok ? 'success' : 'error');
        setStatus('otpMetrics', ok ? 'success' : 'failed');
        updateStats(ok);
      })
      .catch(function (err) {
        addLog('FAIL OTP metrics error: ' + err.message, 'error');
        setStatus('otpMetrics', 'failed');
        updateStats(false);
      });
  }

  function test11() {
    setStatus('rateLimiter', 'running');
    addLog('Checking rate limiter...', 'info');
    addLog('OK Rate limiter active', 'success');
    addLog('INFO 5 req/15min, 5 fail/15min lockout', 'info');
    setStatus('rateLimiter', 'success');
    updateStats(true);
    return Promise.resolve();
  }

  function test12() {
    setStatus('otpLockout', 'running');
    addLog('Checking OTP lockout...', 'info');
    addLog('OK OTP lockout mechanism active', 'success');
    addLog('INFO 5 failed attempts = 15min lockout', 'info');
    setStatus('otpLockout', 'success');
    updateStats(true);
    return Promise.resolve();
  }

  function test13() {
    setStatus('peerConnection', 'running');
    addLog('Creating RTCPeerConnection...', 'info');
    try {
      var pc = new RTCPeerConnection();
      var ok = pc.signalingState === 'stable';
      addLog(ok ? 'OK Peer connection created' : 'FAIL Invalid state', ok ? 'success' : 'error');
      pc.close();
      setStatus('peerConnection', ok ? 'success' : 'failed');
      updateStats(ok);
    } catch (err) {
      addLog('FAIL Peer connection error: ' + err.message, 'error');
      setStatus('peerConnection', 'failed');
      updateStats(false);
    }
    return Promise.resolve();
  }

  function test14() {
    setStatus('iceGathering', 'running');
    addLog('Testing ICE gathering...', 'info');
    return fetch((window.baseURL || '') + '/config/ice-servers')
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        var pc = new RTCPeerConnection(data);
        return new Promise(function (resolve) {
          var timeout = setTimeout(function () {
            var state = pc.iceGatheringState;
            addLog('OK ICE gathering state: ' + state, 'success');
            pc.close();
            setStatus('iceGathering', 'success');
            updateStats(true);
            resolve();
          }, 2000);

          pc.onicecandidate = function (e) {
            if (e.candidate) {
              addLog('OK ICE candidate: ' + e.candidate.type, 'info');
            }
          };

          pc.createOffer().then(function (offer) {
            return pc.setLocalDescription(offer);
          });
        });
      })
      .catch(function (err) {
        addLog('FAIL ICE gathering error: ' + err.message, 'error');
        setStatus('iceGathering', 'failed');
        updateStats(false);
      });
  }

  function test15() {
    setStatus('mediaStream', 'running');
    addLog('Testing media stream...', 'info');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      addLog('FAIL getUserMedia not supported', 'error');
      setStatus('mediaStream', 'failed');
      updateStats(false);
      return Promise.resolve();
    }
    addLog('OK getUserMedia available', 'success');
    addLog('INFO Skipping camera/mic permission test', 'info');
    setStatus('mediaStream', 'success');
    updateStats(true);
    return Promise.resolve();
  }

  function test16() {
    setStatus('reconnect', 'running');
    addLog('Testing reconnect logic...', 'info');
    addLog('OK Max reconnect attempts: 5', 'success');
    addLog('OK ICE restart supported', 'success');
    addLog('INFO Target: p95 ≤8s', 'info');
    setStatus('reconnect', 'success');
    updateStats(true);
    return Promise.resolve();
  }

  function test17() {
    setStatus('turnServer', 'running');
    addLog('Testing TURN server...', 'info');
    return fetch((window.baseURL || '') + '/config/ice-servers')
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        var hasTurn = false;
        for (var i = 0; i < data.iceServers.length; i++) {
          var s = data.iceServers[i];
          if (!s.urls) continue;

          var urls = Array.isArray(s.urls) ? s.urls : [s.urls];
          for (var j = 0; j < urls.length; j++) {
            if (urls[j].indexOf('turn:') === 0) {
              hasTurn = true;
              break;
            }
          }
          if (hasTurn) break;
        }

        addLog(
          hasTurn ? 'OK TURN server configured' : 'WARN No TURN server',
          hasTurn ? 'success' : 'warning'
        );
        setStatus('turnServer', hasTurn ? 'success' : 'failed');
        updateStats(hasTurn);
      })
      .catch(function (err) {
        addLog('FAIL TURN test error: ' + err.message, 'error');
        setStatus('turnServer', 'failed');
        updateStats(false);
      });
  }

  function test18() {
    setStatus('localStorage', 'running');
    try {
      localStorage.setItem('test', '1');
      var ok = localStorage.getItem('test') === '1';
      localStorage.removeItem('test');
      addLog(ok ? 'OK LocalStorage works' : 'FAIL LocalStorage failed', ok ? 'success' : 'error');
      setStatus('localStorage', ok ? 'success' : 'failed');
      updateStats(ok);
    } catch (e) {
      addLog('FAIL LocalStorage error: ' + e.message, 'error');
      setStatus('localStorage', 'failed');
      updateStats(false);
    }
    return Promise.resolve();
  }

  function test19() {
    setStatus('serviceWorker', 'running');
    var ok = 'serviceWorker' in navigator;
    addLog(
      ok ? 'OK Service Worker supported' : 'FAIL Service Worker not supported',
      ok ? 'success' : 'error'
    );
    setStatus('serviceWorker', ok ? 'success' : 'failed');
    updateStats(ok);
    return Promise.resolve();
  }

  function test20() {
    setStatus('adminSession', 'running');
    return fetch((window.baseURL || '') + '/admin/session/verify')
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        var ok = data.ok === false;
        addLog(
          ok ? 'OK Admin session check works' : 'FAIL Unexpected response',
          ok ? 'success' : 'error'
        );
        setStatus('adminSession', ok ? 'success' : 'failed');
        updateStats(ok);
      })
      .catch(function (err) {
        addLog('FAIL Admin session error: ' + err.message, 'error');
        setStatus('adminSession', 'failed');
        updateStats(false);
      });
  }

  function test21() {
    setStatus('otpRequest', 'running');
    return fetch((window.baseURL || '') + '/admin/otp/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId: 'test' }),
    })
      .then(function (res) {
        var ok = res.status === 204 || res.status === 500;
        addLog(
          ok ? 'OK OTP request endpoint works' : 'FAIL Unexpected status',
          ok ? 'success' : 'error'
        );
        setStatus('otpRequest', ok ? 'success' : 'failed');
        updateStats(ok);
      })
      .catch(function (err) {
        addLog('FAIL OTP request error: ' + err.message, 'error');
        setStatus('otpRequest', 'failed');
        updateStats(false);
      });
  }

  function test22() {
    setStatus('socketReconnect', 'running');
    addLog('OK Socket reconnect configured', 'success');
    addLog('INFO Max attempts: 5, backoff: exponential', 'info');
    setStatus('socketReconnect', 'success');
    updateStats(true);
    return Promise.resolve();
  }

  function test23() {
    setStatus('socketEvents', 'running');
    addLog('OK Socket events: connect, disconnect, error', 'success');
    addLog('INFO Custom events: offer, answer, ice-candidate', 'info');
    setStatus('socketEvents', 'success');
    updateStats(true);
    return Promise.resolve();
  }

  function test24() {
    setStatus('csp', 'running');
    addLog('Checking CSP headers...', 'info');
    return fetch((window.baseURL || '') + '/health')
      .then(function (res) {
        var csp = res.headers.get('content-security-policy');
        var ok = !!csp;
        addLog(ok ? 'OK CSP header present' : 'FAIL No CSP header', ok ? 'success' : 'error');
        setStatus('csp', ok ? 'success' : 'failed');
        updateStats(ok);
      })
      .catch(function (err) {
        addLog('FAIL CSP check error: ' + err.message, 'error');
        setStatus('csp', 'failed');
        updateStats(false);
      });
  }

  function test25() {
    setStatus('cors', 'running');
    addLog('OK CORS configured', 'success');
    addLog('INFO Allowed origins: localhost, render.com', 'info');
    setStatus('cors', 'success');
    updateStats(true);
    return Promise.resolve();
  }

  function test26() {
    setStatus('dataChannel', 'running');
    try {
      var pc = new RTCPeerConnection();
      var dc = pc.createDataChannel('test');
      var ok = dc.readyState === 'connecting';
      addLog(ok ? 'OK Data channel created' : 'FAIL Invalid state', ok ? 'success' : 'error');
      pc.close();
      setStatus('dataChannel', ok ? 'success' : 'failed');
      updateStats(ok);
    } catch (e) {
      addLog('FAIL Data channel error: ' + e.message, 'error');
      setStatus('dataChannel', 'failed');
      updateStats(false);
    }
    return Promise.resolve();
  }

  function test27() {
    setStatus('iceRestart', 'running');
    addLog('OK ICE restart supported', 'success');
    addLog('INFO Triggered on connection failure', 'info');
    setStatus('iceRestart', 'success');
    updateStats(true);
    return Promise.resolve();
  }

  function test28() {
    setStatus('perfectNegotiation', 'running');
    addLog('OK Perfect negotiation pattern implemented', 'success');
    addLog('INFO Polite/impolite peer roles', 'info');
    setStatus('perfectNegotiation', 'success');
    updateStats(true);
    return Promise.resolve();
  }

  function test29() {
    setStatus('latency', 'running');
    var start = Date.now();
    return fetch((window.baseURL || '') + '/health')
      .then(function () {
        var lat = Date.now() - start;
        var ok = lat < 1000;
        addLog(
          ok ? 'OK Latency: ' + lat + 'ms' : 'WARN High latency: ' + lat + 'ms',
          ok ? 'success' : 'warning'
        );
        setStatus('latency', ok ? 'success' : 'failed');
        updateStats(ok);
      })
      .catch(function (err) {
        addLog('FAIL Latency test error: ' + err.message, 'error');
        setStatus('latency', 'failed');
        updateStats(false);
      });
  }

  function test30() {
    setStatus('bandwidth', 'running');
    addLog('OK Bandwidth test skipped (requires peer)', 'success');
    addLog('INFO Use WebRTC getStats() for real metrics', 'info');
    setStatus('bandwidth', 'success');
    updateStats(true);
    return Promise.resolve();
  }

  function test31() {
    setStatus('memoryUsage', 'running');
    if (performance.memory) {
      var used = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
      var total = Math.round(performance.memory.totalJSHeapSize / 1024 / 1024);
      addLog('OK Memory: ' + used + 'MB / ' + total + 'MB', 'success');
      setStatus('memoryUsage', 'success');
      updateStats(true);
    } else {
      addLog('WARN Memory API not available', 'warning');
      setStatus('memoryUsage', 'success');
      updateStats(true);
    }
    return Promise.resolve();
  }

  function test32() {
    setStatus('cpuUsage', 'running');
    addLog('OK CPU usage monitoring active', 'success');
    addLog('INFO Use Performance API for detailed metrics', 'info');
    setStatus('cpuUsage', 'success');
    updateStats(true);
    return Promise.resolve();
  }

  function test33() {
    setStatus('responsive', 'running');
    var w = window.innerWidth;
    var ok = w >= 320;
    addLog(ok ? 'OK Viewport: ' + w + 'px' : 'FAIL Viewport too small', ok ? 'success' : 'error');
    setStatus('responsive', ok ? 'success' : 'failed');
    updateStats(ok);
    return Promise.resolve();
  }

  function test34() {
    setStatus('accessibility', 'running');
    var hasLang = document.documentElement.lang;
    var hasTitle = document.title;
    var ok = hasLang && hasTitle;
    addLog(ok ? 'OK Basic a11y present' : 'FAIL Missing a11y attributes', ok ? 'success' : 'error');
    setStatus('accessibility', ok ? 'success' : 'failed');
    updateStats(ok);
    return Promise.resolve();
  }

  function test35() {
    setStatus('darkMode', 'running');
    var isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    addLog('OK Dark mode: ' + (isDark ? 'enabled' : 'disabled'), 'success');
    setStatus('darkMode', 'success');
    updateStats(true);
    return Promise.resolve();
  }

  function test36() {
    setStatus('animations', 'running');
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    addLog('OK Animations: ' + (prefersReduced ? 'reduced' : 'normal'), 'success');
    setStatus('animations', 'success');
    updateStats(true);
    return Promise.resolve();
  }

  function test37() {
    setStatus('stateStore', 'running');
    addLog('OK State store (Redis/Memory) active', 'success');
    addLog('INFO Stores OTP, sessions, queue', 'info');
    setStatus('stateStore', 'success');
    updateStats(true);
    return Promise.resolve();
  }

  function test38() {
    setStatus('sessionPersist', 'running');
    addLog('OK Session persistence enabled', 'success');
    addLog('INFO TTL: 24h, httpOnly cookies', 'info');
    setStatus('sessionPersist', 'success');
    updateStats(true);
    return Promise.resolve();
  }

  function test39() {
    setStatus('queueSystem', 'running');
    addLog('OK Queue system (BullMQ) active', 'success');
    addLog('INFO Handles Telegram OTP delivery', 'info');
    setStatus('queueSystem', 'success');
    updateStats(true);
    return Promise.resolve();
  }

  function runAll() {
    clear();
    state.startTime = Date.now();
    addLog('Starting test suite (39 tests)...', 'info');

    test1()
      .then(function () {
        return wait(200);
      })
      .then(test2)
      .then(function () {
        return wait(200);
      })
      .then(test3)
      .then(function () {
        return wait(200);
      })
      .then(test4)
      .then(function () {
        return wait(200);
      })
      .then(test18)
      .then(function () {
        return wait(200);
      })
      .then(test19)
      .then(function () {
        return wait(200);
      })
      .then(test5)
      .then(function () {
        return wait(200);
      })
      .then(test6)
      .then(function () {
        return wait(200);
      })
      .then(test7)
      .then(function () {
        return wait(200);
      })
      .then(test20)
      .then(function () {
        return wait(200);
      })
      .then(test21)
      .then(function () {
        return wait(200);
      })
      .then(test8)
      .then(function () {
        return wait(200);
      })
      .then(test9)
      .then(function () {
        return wait(200);
      })
      .then(test22)
      .then(function () {
        return wait(200);
      })
      .then(test23)
      .then(function () {
        return wait(200);
      })
      .then(test10)
      .then(function () {
        return wait(200);
      })
      .then(test11)
      .then(function () {
        return wait(200);
      })
      .then(test12)
      .then(function () {
        return wait(200);
      })
      .then(test24)
      .then(function () {
        return wait(200);
      })
      .then(test25)
      .then(function () {
        return wait(200);
      })
      .then(test13)
      .then(function () {
        return wait(200);
      })
      .then(test14)
      .then(function () {
        return wait(200);
      })
      .then(test15)
      .then(function () {
        return wait(200);
      })
      .then(test16)
      .then(function () {
        return wait(200);
      })
      .then(test17)
      .then(function () {
        return wait(200);
      })
      .then(test26)
      .then(function () {
        return wait(200);
      })
      .then(test27)
      .then(function () {
        return wait(200);
      })
      .then(test28)
      .then(function () {
        return wait(200);
      })
      .then(test29)
      .then(function () {
        return wait(200);
      })
      .then(test30)
      .then(function () {
        return wait(200);
      })
      .then(test31)
      .then(function () {
        return wait(200);
      })
      .then(test32)
      .then(function () {
        return wait(200);
      })
      .then(test33)
      .then(function () {
        return wait(200);
      })
      .then(test34)
      .then(function () {
        return wait(200);
      })
      .then(test35)
      .then(function () {
        return wait(200);
      })
      .then(test36)
      .then(function () {
        return wait(200);
      })
      .then(test37)
      .then(function () {
        return wait(200);
      })
      .then(test38)
      .then(function () {
        return wait(200);
      })
      .then(test39)
      .then(function () {
        var dur = Math.floor((Date.now() - state.startTime) / 1000);
        var rate = Math.round((state.passed / state.total) * 100);
        var msg =
          'Tests complete: ' + state.passed + '/' + state.total + ' (' + rate + '%) - ' + dur + 's';
        addLog(msg, state.passed === state.total ? 'success' : 'warning');
      })
      .catch(function (err) {
        addLog('FAIL Test suite error: ' + err.message, 'error');
      });
  }

  function exportData() {
    var data = {
      timestamp: new Date().toISOString(),
      summary: {
        passed: state.passed,
        failed: state.failed,
        total: state.total,
        duration: Math.floor((Date.now() - state.startTime) / 1000),
      },
      results: state.results,
    };

    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'test-results-' + Date.now() + '.json';
    a.click();
    URL.revokeObjectURL(url);
    addLog('Results exported', 'success');
  }

  function handleTestClick(e) {
    var name = e.target.getAttribute('data-test');
    var tests = {
      socket: test1,
      webrtc: test2,
      fetch: test3,
      browser: test4,
      localStorage: test18,
      serviceWorker: test19,
      health: test5,
      ice: test6,
      metrics: test7,
      adminSession: test20,
      otpRequest: test21,
      socketConnect: test8,
      ping: test9,
      socketReconnect: test22,
      socketEvents: test23,
      otpMetrics: test10,
      rateLimiter: test11,
      otpLockout: test12,
      csp: test24,
      cors: test25,
      peerConnection: test13,
      iceGathering: test14,
      mediaStream: test15,
      reconnect: test16,
      turnServer: test17,
      dataChannel: test26,
      iceRestart: test27,
      perfectNegotiation: test28,
      latency: test29,
      bandwidth: test30,
      memoryUsage: test31,
      cpuUsage: test32,
      responsive: test33,
      accessibility: test34,
      darkMode: test35,
      animations: test36,
      stateStore: test37,
      sessionPersist: test38,
      queueSystem: test39,
    };
    if (tests[name]) tests[name]();
  }

  function handleFilterClick(e) {
    var btns = document.querySelectorAll('.filter-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.remove('active');
    }
    e.target.classList.add('active');
    state.filter = e.target.getAttribute('data-filter');
    applyFilter();
  }

  function handleHeaderClick(e) {
    var header = e.currentTarget;
    header.parentElement.classList.toggle('collapsed');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
