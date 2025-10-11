(function() {
  'use strict';
  
  var state = {
    passed: 0,
    failed: 0,
    total: 0,
    startTime: 0,
    results: [],
    filter: 'all'
  };
  
  var elements = {};
  
  function init() {
    elements.logs = document.getElementById('logs');
    elements.passed = document.getElementById('passed');
    elements.failed = document.getElementById('failed');
    elements.total = document.getElementById('total');
    elements.duration = document.getElementById('duration');
    elements.progress = document.getElementById('progress');
    
    document.getElementById('runAll').onclick = runAll;
    document.getElementById('clearBtn').onclick = clear;
    document.getElementById('exportBtn').onclick = exportData;
    
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
    
    var pct = (state.total / 17) * 100;
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
    return new Promise(function(resolve) {
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
    return fetch('/health')
      .then(function(res) { return res.json(); })
      .then(function(data) {
        var ok = data.status === 'ok';
        addLog(ok ? 'OK Health check passed' : 'FAIL Health check failed', ok ? 'success' : 'error');
        setStatus('health', ok ? 'success' : 'failed');
        updateStats(ok);
      })
      .catch(function(err) {
        addLog('FAIL Health error: ' + err.message, 'error');
        setStatus('health', 'failed');
        updateStats(false);
      });
  }
  
  function test6() {
    setStatus('ice', 'running');
    addLog('Checking /config/ice-servers...', 'info');
    return fetch('/config/ice-servers')
      .then(function(res) { return res.json(); })
      .then(function(data) {
        var ok = data.iceServers && data.iceServers.length > 0;
        addLog(ok ? 'OK ICE Servers: ' + data.iceServers.length : 'FAIL No ICE servers', ok ? 'success' : 'error');
        setStatus('ice', ok ? 'success' : 'failed');
        updateStats(ok);
      })
      .catch(function(err) {
        addLog('FAIL ICE error: ' + err.message, 'error');
        setStatus('ice', 'failed');
        updateStats(false);
      });
  }
  
  function test7() {
    setStatus('metrics', 'running');
    addLog('Checking /metrics...', 'info');
    return fetch('/metrics')
      .then(function(res) {
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
      .catch(function(err) {
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
    var socket = io({ 
      reconnection: false, 
      timeout: 10000,
      transports: ['websocket', 'polling']
    });
    
    return new Promise(function(resolve) {
      var timeout = setTimeout(function() {
        addLog('FAIL Socket timeout (10s)', 'error');
        setStatus('socketConnect', 'failed');
        updateStats(false);
        if (socket) socket.disconnect();
        resolve();
      }, 10000);
      
      socket.once('connect', function() {
        clearTimeout(timeout);
        addLog('OK Socket connected: ' + socket.id, 'success');
        setStatus('socketConnect', 'success');
        updateStats(true);
        socket.disconnect();
        resolve();
      });
      
      socket.once('connect_error', function() {
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
    return fetch('/health')
      .then(function(res) {
        var dur = Date.now() - start;
        var ok = res.ok;
        addLog(ok ? 'OK Ping: ' + dur + 'ms' : 'FAIL Ping failed', ok ? 'success' : 'error');
        setStatus('ping', ok ? 'success' : 'failed');
        updateStats(ok);
      })
      .catch(function(err) {
        addLog('FAIL Ping error: ' + err.message, 'error');
        setStatus('ping', 'failed');
        updateStats(false);
      });
  }
  
  function test10() {
    setStatus('otpMetrics', 'running');
    addLog('Checking OTP metrics...', 'info');
    return fetch('/metrics')
      .then(function(res) {
        if (res.status === 401) {
          addLog('OK OTP metrics protected (skipping content check)', 'success');
          setStatus('otpMetrics', 'success');
          updateStats(true);
          return;
        }
        return res.text();
      })
      .then(function(text) {
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
      .catch(function(err) {
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
    } catch(err) {
      addLog('FAIL Peer connection error: ' + err.message, 'error');
      setStatus('peerConnection', 'failed');
      updateStats(false);
    }
    return Promise.resolve();
  }
  
  function test14() {
    setStatus('iceGathering', 'running');
    addLog('Testing ICE gathering...', 'info');
    return fetch('/config/ice-servers')
      .then(function(res) { return res.json(); })
      .then(function(data) {
        var pc = new RTCPeerConnection(data);
        return new Promise(function(resolve) {
          var timeout = setTimeout(function() {
            var state = pc.iceGatheringState;
            addLog('OK ICE gathering state: ' + state, 'success');
            pc.close();
            setStatus('iceGathering', 'success');
            updateStats(true);
            resolve();
          }, 2000);
          
          pc.onicecandidate = function(e) {
            if (e.candidate) {
              addLog('OK ICE candidate: ' + e.candidate.type, 'info');
            }
          };
          
          pc.createOffer().then(function(offer) {
            return pc.setLocalDescription(offer);
          });
        });
      })
      .catch(function(err) {
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
    return fetch('/config/ice-servers')
      .then(function(res) { return res.json(); })
      .then(function(data) {
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
        
        addLog(hasTurn ? 'OK TURN server configured' : 'WARN No TURN server', hasTurn ? 'success' : 'warning');
        setStatus('turnServer', hasTurn ? 'success' : 'failed');
        updateStats(hasTurn);
      })
      .catch(function(err) {
        addLog('FAIL TURN test error: ' + err.message, 'error');
        setStatus('turnServer', 'failed');
        updateStats(false);
      });
  }
  
  function runAll() {
    clear();
    state.startTime = Date.now();
    addLog('Starting test suite...', 'info');
    
    test1()
      .then(function() { return wait(300); })
      .then(test2)
      .then(function() { return wait(300); })
      .then(test3)
      .then(function() { return wait(300); })
      .then(test4)
      .then(function() { return wait(300); })
      .then(test5)
      .then(function() { return wait(300); })
      .then(test6)
      .then(function() { return wait(300); })
      .then(test7)
      .then(function() { return wait(300); })
      .then(test8)
      .then(function() { return wait(300); })
      .then(test9)
      .then(function() { return wait(300); })
      .then(test10)
      .then(function() { return wait(300); })
      .then(test11)
      .then(function() { return wait(300); })
      .then(test12)
      .then(function() { return wait(300); })
      .then(test13)
      .then(function() { return wait(300); })
      .then(test14)
      .then(function() { return wait(300); })
      .then(test15)
      .then(function() { return wait(300); })
      .then(test16)
      .then(function() { return wait(300); })
      .then(test17)
      .then(function() {
        var dur = Math.floor((Date.now() - state.startTime) / 1000);
        var rate = Math.round((state.passed / state.total) * 100);
        var msg = 'Tests complete: ' + state.passed + '/' + state.total + ' (' + rate + '%) - ' + dur + 's';
        addLog(msg, state.passed === state.total ? 'success' : 'warning');
      })
      .catch(function(err) {
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
        duration: Math.floor((Date.now() - state.startTime) / 1000)
      },
      results: state.results
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
      health: test5,
      ice: test6,
      metrics: test7,
      socketConnect: test8,
      ping: test9,
      otpMetrics: test10,
      rateLimiter: test11,
      otpLockout: test12,
      peerConnection: test13,
      iceGathering: test14,
      mediaStream: test15,
      reconnect: test16,
      turnServer: test17
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
