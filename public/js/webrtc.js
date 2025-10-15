class WebRTCManager {
  constructor() {
    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
    this.socket = null;
    this.isCaller = false;
    this.perfectNegotiation = null;
    this.connectionMonitor = null;
    this.adaptiveQuality = null;
    this.retryCount = 0;
    this.maxRetries = 10;
    this.reconnectTimer = null;
    this.maxReconnectAttempts = Infinity;
    this.reconnectAttempts = 0;
    this.config = null;
    this.heartbeatInterval = null;
    this.connectionState = 'disconnected';
    this.persistentMode = false;
    this.keepAliveInterval = null;
    this.iceCandidateQueue = [];
    this.bitrateMonitorInterval = null;
  }

  async loadIceConfig() {
    try {
      const r = await fetch('/config/ice-servers', { cache: 'no-store' });
      const data = await r.json();
      return data.error ? { iceServers: data.iceServers } : data;
    } catch {
      return { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    }
  }

  async start(socket, isCaller) {
    this.socket = socket;
    this.isCaller = isCaller;

    console.log('🚀 Starting WebRTC, isCaller:', isCaller);

    try {
      this.config = await this.loadIceConfig();
      console.log('✅ ICE config loaded:', this.config.iceServers.length, 'servers');

      // TURN server check
      const turnServers = this.config.iceServers.filter(s =>
        Array.isArray(s.urls) ? s.urls.some(u => u.includes('turn:')) : s.urls.includes('turn:')
      );
      if (turnServers.length > 0) {
        console.log('✅ TURN servers available:', turnServers.length);
      } else {
        console.warn('⚠️ No TURN servers - NAT traversal may fail');
      }

      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log('✅ Got local stream:', this.localStream.getTracks().length, 'tracks');
      console.log('📹 Kamera kapalı başlatıldı');

      this.setupSocketListeners();
      this.setupDeviceChangeListener();

      return true;
    } catch (error) {
      console.error('❌ getUserMedia error:', error);
      return false;
    }
  }

  setupSocketListeners() {
    console.log('📡 Setting up socket listeners');

    // ICE candidates with buffering
    this.socket.on('rtc:ice:candidate', async ({ candidate }) => {
      if (!candidate) return;

      if (!this.peerConnection) {
        console.log('🧊 Buffering ICE candidate (no peer connection yet)');
        this.iceCandidateQueue.push(candidate);
      } else {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          console.log('🧊 Added ICE candidate');
        } catch (err) {
          console.warn('⚠️ ICE candidate error:', err);
        }
      }
    });

    console.log('✅ Perfect Negotiation exclusive mode - legacy disabled');
  }

  createPeerConnection() {
    console.log('🔗 Creating peer connection');

    this.peerConnection = new RTCPeerConnection({
      ...this.config,
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    });

    // Process buffered ICE candidates
    if (this.iceCandidateQueue.length > 0) {
      console.log('🧊 Processing', this.iceCandidateQueue.length, 'buffered ICE candidates');
      this.iceCandidateQueue.forEach(async candidate => {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('⚠️ Buffered ICE candidate error:', err);
        }
      });
      this.iceCandidateQueue = [];
    }

    // Add local tracks with DTX optimization
    this.localStream.getTracks().forEach(track => {
      const sender = this.peerConnection.addTrack(track, this.localStream);
      console.log('✅ Added track:', track.kind);

      // Optimize audio with DTX and bitrate
      if (track.kind === 'audio') {
        const params = sender.getParameters();
        if (!params.encodings) params.encodings = [{}];
        params.encodings[0] = {
          maxBitrate: 64000,
          dtx: true,
        };
        sender.setParameters(params).catch(err => console.warn('⚠️ Audio params error:', err));
      }
    });

    // Handle remote tracks
    this.peerConnection.ontrack = event => {
      console.log('📺 Received remote track:', event.track.kind);
      const remoteVideo = document.getElementById('remoteVideo');
      if (remoteVideo && event.streams[0]) {
        remoteVideo.srcObject = event.streams[0];
        this.setAudioOutputToEarpiece(remoteVideo);
        console.log('✅ Remote video set');
      }
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = event => {
      if (event.candidate) {
        this.socket.emit('rtc:ice:candidate', { candidate: event.candidate });
        console.log('📤 Sent ICE candidate');
      }
    };

    // Connection state with detailed debug
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection.connectionState;
      console.log('━━━ CONNECTION STATE ━━━');
      console.log('Connection:', state);
      console.log('Signaling:', this.peerConnection.signalingState);
      console.log('ICE Connection:', this.peerConnection.iceConnectionState);
      console.log('ICE Gathering:', this.peerConnection.iceGatheringState);

      const senders = this.peerConnection.getSenders();
      const receivers = this.peerConnection.getReceivers();
      console.log(
        'Local tracks:',
        senders.length,
        senders.map(s => s.track?.kind)
      );
      console.log(
        'Remote tracks:',
        receivers.length,
        receivers.map(r => r.track?.kind)
      );
      console.log('━━━━━━━━━━━━━━━━━━━━━━');

      this.connectionState = state;

      if (state === 'connected') {
        this.retryCount = 0;
        this.reconnectAttempts = 0;
        if (this.connectionMonitor) {
          this.connectionMonitor.start();
        }
        this.showUserMessage('Bağlantı kuruldu', 'success');
        this.startHeartbeat();
        setTimeout(() => this.checkRelayUsage(), 1000);
      }

      if (state === 'connecting') {
        console.log('🔄 Connecting...');
      }

      if (state === 'disconnected') {
        this.showUserMessage('Bağlantı koptu, yeniden deneniyor...', 'warning');
        this.stopHeartbeat();
        setTimeout(() => {
          if (this.peerConnection?.connectionState === 'disconnected') {
            this.handleConnectionFailure();
          }
        }, 3000);
      }

      if (state === 'failed') {
        if (this.connectionMonitor) {
          this.connectionMonitor.stop();
        }
        this.stopHeartbeat();
        this.handleConnectionFailure();
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('🧊 ICE Connection state:', this.peerConnection.iceConnectionState);

      if (this.peerConnection.iceConnectionState === 'failed') {
        this.socket.emit('ice:failed', { state: 'failed' });
        this.handleConnectionFailure();
      }
    };

    this.peerConnection.onicegatheringstatechange = () => {
      console.log('🧊 ICE Gathering state:', this.peerConnection.iceGatheringState);
    };

    // Perfect Negotiation Pattern aktive et
    if (typeof PerfectNegotiation !== 'undefined') {
      this.perfectNegotiation = new PerfectNegotiation(
        this.peerConnection,
        this.socket,
        this.isCaller // Customer: true (polite), Admin: false (impolite)
      );
      console.log('✅ Perfect Negotiation aktif (polite:', this.isCaller, ')');
    }

    // Connection Monitor aktive et
    if (typeof ConnectionMonitor !== 'undefined') {
      this.connectionMonitor = new ConnectionMonitor(this.peerConnection, quality => {
        console.log('📊 Kalite değişti:', quality);
        this.updateConnectionQualityUI(quality);
      });
      console.log('✅ Connection Monitor aktif');
    }

    // Adaptive Quality aktive et
    if (typeof AdaptiveQuality !== 'undefined') {
      this.adaptiveQuality = new AdaptiveQuality(this.peerConnection);
      this.adaptiveQuality.start();
      console.log('✅ Adaptive Quality aktif');
    }

    // Dynamic bitrate monitoring
    this.startBitrateMonitoring();
  }

  startBitrateMonitoring() {
    if (this.bitrateMonitorInterval) return;

    this.bitrateMonitorInterval = setInterval(async () => {
      if (!this.peerConnection || this.peerConnection.connectionState !== 'connected') return;

      try {
        const stats = await this.peerConnection.getStats();
        let bandwidth = 0;

        stats.forEach(report => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            bandwidth = report.availableOutgoingBitrate || 0;
          }
        });

        if (bandwidth > 0) {
          await this.adjustBitrate(bandwidth);
        }
      } catch (err) {
        console.warn('⚠️ Bitrate monitoring error:', err);
      }
    }, 3000); // Every 3s
  }

  async adjustBitrate(bandwidth) {
    const senders = this.peerConnection.getSenders();
    const videoSender = senders.find(s => s.track?.kind === 'video');
    if (!videoSender) return;

    let targetBitrate;
    if (bandwidth < 500000) {
      targetBitrate = 300000; // 300kbps
    } else if (bandwidth < 1000000) {
      targetBitrate = 500000; // 500kbps
    } else {
      targetBitrate = 1500000; // 1.5Mbps
    }

    try {
      const params = videoSender.getParameters();
      if (!params.encodings) params.encodings = [{}];

      const currentBitrate = params.encodings[0].maxBitrate || 0;
      if (Math.abs(targetBitrate - currentBitrate) > 100000) {
        params.encodings[0].maxBitrate = targetBitrate;
        await videoSender.setParameters(params);
        console.log(
          `📊 Bitrate adjusted: ${(targetBitrate / 1000).toFixed(0)}kbps (bandwidth: ${(bandwidth / 1000).toFixed(0)}kbps)`
        );
      }
    } catch (err) {
      console.warn('⚠️ Bitrate adjustment error:', err);
    }
  }

  toggleMute() {
    const audioTrack = this.localStream?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return !audioTrack.enabled;
    }
    return false;
  }

  async toggleCamera() {
    const videoTrack = this.localStream?.getVideoTracks()[0];

    if (videoTrack) {
      // Video track var, kapat
      videoTrack.stop();
      this.localStream.removeTrack(videoTrack);

      // Peer connection'dan kaldır
      if (this.peerConnection) {
        const senders = this.peerConnection.getSenders();
        const videoSender = senders.find(s => s.track?.kind === 'video');
        if (videoSender) {
          this.peerConnection.removeTrack(videoSender);
        }
      }

      // Local video gizle
      const localVideo = document.getElementById('localVideo');
      if (localVideo) localVideo.srcObject = null;

      console.log('📵 Kamera kapatıldı');
      return true; // Kamera kapalı
    } else {
      // Video track yok, ekle - 2K'ya kadar adaptif
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920, max: 2560 },
            height: { ideal: 1080, max: 1440 },
          },
        });
        const newVideoTrack = videoStream.getVideoTracks()[0];
        this.localStream.addTrack(newVideoTrack);

        // Peer connection'a ekle - Perfect Negotiation otomatik renegotiate eder
        if (this.peerConnection) {
          const sender = this.peerConnection.addTrack(newVideoTrack, this.localStream);

          // Adaptif bitrate - internet hızına göre otomatik
          const params = sender.getParameters();
          if (!params.encodings) params.encodings = [{}];
          params.encodings[0].maxBitrate = 8000000; // 8 Mbps max (2K için)
          await sender.setParameters(params);

          // Perfect Negotiation onnegotiationneeded event'i ile otomatik renegotiate eder
          console.log('✅ Track eklendi, Perfect Negotiation renegotiate edecek');
        }

        // Local video göster
        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
          localVideo.srcObject = this.localStream;
        }

        console.log('📷 Kamera açıldı (2K adaptif)');
        return false; // Kamera açık
      } catch (error) {
        console.error('❌ Kamera açılamadı:', error);
        return true; // Kamera kapalı
      }
    }
  }

  setupDeviceChangeListener() {
    if (typeof navigator.mediaDevices === 'undefined') return;

    navigator.mediaDevices.addEventListener('devicechange', async () => {
      console.log('🎧 Audio device changed');
      const remoteVideo = document.getElementById('remoteVideo');
      if (!remoteVideo) return;

      const savedDeviceId = localStorage.getItem('preferredAudioOutput');
      if (savedDeviceId && typeof remoteVideo.setSinkId === 'function') {
        try {
          await remoteVideo.setSinkId(savedDeviceId);
          console.log('✅ Restored audio output after device change');
        } catch (err) {
          console.warn('⚠️ Could not restore audio output:', err);
        }
      }
    });
  }

  async setAudioOutputToEarpiece(videoElement) {
    // VARSAYILAN: Ahize modu (kulaklık)
    this.isUsingEarpiece = true;

    if (videoElement) {
      // Mobil cihazlarda playsinline zorla
      videoElement.setAttribute('playsinline', 'true');
      videoElement.setAttribute('webkit-playsinline', 'true');

      // iOS kontrolü
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

      if (isIOS) {
        // iOS: Proximity sensor otomatik çalışır
        console.log('🍎 iOS: Proximity sensor aktif - Telefonu kulağa yaklaştırın');
        videoElement.volume = 1.0;
        this.isUsingEarpiece = true;
        return;
      }

      // Android/Desktop: setSinkId ile ses çıkışını ayarla
      if (typeof videoElement.setSinkId !== 'undefined') {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const audioOutputs = devices.filter(d => d.kind === 'audiooutput');

          const earpiece = audioOutputs.find(
            d =>
              d.label.toLowerCase().includes('earpiece') ||
              d.label.toLowerCase().includes('receiver') ||
              d.label.toLowerCase().includes('kulaklık')
          );

          if (earpiece) {
            await videoElement.setSinkId(earpiece.deviceId);
            console.log('✅ Ahize modu:', earpiece.label);
          } else {
            await videoElement.setSinkId('');
            console.log('✅ Ahize modu: Varsayılan');
          }

          videoElement.volume = 1.0;
        } catch (error) {
          console.warn('⚠️ setSinkId hatası:', error);
          videoElement.volume = 1.0;
        }
      } else {
        console.warn('⚠️ setSinkId desteklenmiyor');
        videoElement.volume = 1.0;
      }
    }
  }

  async toggleSpeaker() {
    const remoteVideo = document.getElementById('remoteVideo');
    if (!remoteVideo) return false;

    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

    if (isIOS) {
      console.log('🍎 iOS: Proximity sensor aktif');
      this.isUsingEarpiece = !this.isUsingEarpiece;
      return !this.isUsingEarpiece;
    }

    if (typeof remoteVideo.setSinkId !== 'undefined') {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioOutputs = devices.filter(d => d.kind === 'audiooutput');

        // localStorage'dan son seçimi oku
        const savedDeviceId = localStorage.getItem('preferredAudioOutput');

        if (this.isUsingEarpiece) {
          const speaker =
            audioOutputs.find(
              d =>
                d.label.toLowerCase().includes('speaker') ||
                d.label.toLowerCase().includes('hoparlör') ||
                d.label.toLowerCase().includes('loud')
            ) || audioOutputs[0];

          if (speaker) {
            await remoteVideo.setSinkId(speaker.deviceId);
            localStorage.setItem('preferredAudioOutput', speaker.deviceId);
            console.log('🔊 Hoparlör:', speaker.label);
          }
          this.isUsingEarpiece = false;
        } else {
          const earpiece = audioOutputs.find(
            d =>
              d.label.toLowerCase().includes('earpiece') ||
              d.label.toLowerCase().includes('receiver') ||
              d.label.toLowerCase().includes('kulaklık')
          );

          if (earpiece) {
            await remoteVideo.setSinkId(earpiece.deviceId);
            localStorage.setItem('preferredAudioOutput', earpiece.deviceId);
            console.log('👂 Ahize:', earpiece.label);
          } else {
            await remoteVideo.setSinkId('');
            localStorage.removeItem('preferredAudioOutput');
            console.log('👂 Ahize: Varsayılan');
          }
          this.isUsingEarpiece = true;
        }
      } catch (error) {
        console.error('❌ setSinkId error:', error);
        this.showUserMessage('Hoparlöre geçilemedi', 'warning');
        this.isUsingEarpiece = !this.isUsingEarpiece;
      }
    } else {
      console.warn('⚠️ setSinkId not supported');
      this.isUsingEarpiece = !this.isUsingEarpiece;
    }

    return !this.isUsingEarpiece;
  }

  async restoreAudioOutput() {
    const remoteVideo = document.getElementById('remoteVideo');
    if (!remoteVideo || typeof remoteVideo.setSinkId !== 'function') return;

    const savedDeviceId = localStorage.getItem('preferredAudioOutput');
    if (savedDeviceId) {
      try {
        await remoteVideo.setSinkId(savedDeviceId);
        console.log('✅ Restored audio output:', savedDeviceId);
      } catch (err) {
        console.warn('⚠️ Could not restore audio output:', err);
        localStorage.removeItem('preferredAudioOutput');
      }
    }
  }

  async handleConnectionFailure() {
    if (
      this.maxReconnectAttempts !== Infinity &&
      this.reconnectAttempts >= this.maxReconnectAttempts
    ) {
      console.error('❌ Max reconnect attempts reached');
      this.showUserMessage('Bağlantı kurulamadı. Lütfen sayfayı yenileyin.', 'error');
      this.connectionState = 'failed';
      return;
    }

    if (!this.peerConnection) {
      console.error('❌ No peer connection for restart');
      return;
    }

    this.reconnectAttempts++;
    const backoff = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 8000);
    const startTime = Date.now();

    console.log(
      `🔄 Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} (backoff: ${backoff}ms)`
    );
    this.showUserMessage(
      `Yeniden bağlanılıyor... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
      'info'
    );
    this.connectionState = 'reconnecting';

    this.sendMetric('/metrics/reconnect-attempt');
    this.socket.emit('metrics:reconnect-attempt');

    await new Promise(resolve => setTimeout(resolve, backoff));

    try {
      await this.peerConnection.restartIce();
      const offer = await this.peerConnection.createOffer({ iceRestart: true });
      await this.peerConnection.setLocalDescription(offer);
      this.socket.emit('rtc:description', { description: offer, restart: true });

      const duration = Date.now() - startTime;
      this.sendMetric('/metrics/reconnect-success', { duration });
      console.log(`✅ ICE restart initiated - ${duration}ms`);
    } catch (err) {
      this.sendMetric('/metrics/reconnect-failure');
      console.error('❌ ICE restart failed:', err);
      setTimeout(() => this.handleConnectionFailure(), backoff);
    }
  }

  async checkRelayUsage() {
    try {
      const stats = await this.peerConnection.getStats();
      let selectedPairId;
      stats.forEach(r => {
        if (r.type === 'transport' && r.selectedCandidatePairId) {
          selectedPairId = r.selectedCandidatePairId;
        }
      });

      let pair, remote, local;
      stats.forEach(r => {
        if (r.id === selectedPairId) pair = r;
        if (pair && r.id === pair.remoteCandidateId) remote = r;
        if (pair && r.id === pair.localCandidateId) local = r;
      });

      const type = remote?.candidateType || local?.candidateType;
      if (type) {
        this.sendMetric('/metrics/candidate-type', { type });
        console.log('📊 Candidate type:', type);
      }
      if (type === 'relay') {
        this.sendMetric('/metrics/turn-selected');
        console.log('🔄 TURN relay selected');
      }
    } catch (err) {
      console.warn('Stats check failed:', err);
    }
  }

  sendMetric(url, data = {}) {
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
      } else {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('Metric send failed:', err);
    }
  }

  startHeartbeat() {
    this.stopHeartbeat();
    console.log('❤️ Starting heartbeat...');
    this.heartbeatInterval = setInterval(() => {
      if (this.peerConnection && this.peerConnection.connectionState === 'connected') {
        this.peerConnection
          .getStats()
          .then(stats => {
            let rtt = 0;
            stats.forEach(report => {
              if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                rtt = report.currentRoundTripTime || 0;
              }
            });
            if (rtt > 0) {
              console.log('❤️ Heartbeat OK - RTT:', Math.round(rtt * 1000), 'ms');
            }
          })
          .catch(() => {});
      } else {
        console.warn('⚠️ Heartbeat failed - connection not stable');
        this.stopHeartbeat();
      }
    }, 5000);

    this.startKeepAlive();
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      console.log('❤️ Heartbeat stopped');
    }
    this.stopKeepAlive();
  }

  startKeepAlive() {
    this.stopKeepAlive();
    this.keepAliveInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('ping');
      }
    }, 25000);
  }

  stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  updateConnectionQualityUI(quality) {
    const statusEl = document.getElementById('connection-status');
    if (!statusEl) return;

    const indicator = statusEl.querySelector('.connection-indicator');
    if (!indicator) return;

    indicator.className = 'connection-indicator';

    if (quality === 'good') {
      indicator.classList.add('connected');
      statusEl.innerHTML = '<span class="connection-indicator connected"></span>Bağlantı iyi';
    } else if (quality === 'fair') {
      indicator.classList.add('connecting');
      statusEl.innerHTML = '<span class="connection-indicator connecting"></span>Bağlantı orta';
      this.showUserMessage('Bağlantı kalitesi düştü', 'warning');
    } else if (quality === 'poor') {
      indicator.classList.add('disconnected');
      statusEl.innerHTML = '<span class="connection-indicator disconnected"></span>Bağlantı zayıf';
      this.showUserMessage('Bağlantı zayıf - lütfen internetinizi kontrol edin', 'error');
    }
  }

  showUserMessage(message, type = 'info') {
    if (typeof window.showToast === 'function') {
      window.showToast(type, message);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  endCall(keepConnection = false) {
    console.log('📴 Ending call, keepConnection:', keepConnection);

    if (!keepConnection) {
      this.stopHeartbeat();

      if (this.bitrateMonitorInterval) {
        clearInterval(this.bitrateMonitorInterval);
        this.bitrateMonitorInterval = null;
      }

      if (this.adaptiveQuality) {
        this.adaptiveQuality.stop();
        this.adaptiveQuality = null;
      }

      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        console.log('✅ Local stream tracks stopped');
      }

      if (this.peerConnection) {
        this.peerConnection.close();
        console.log('✅ Peer connection closed');
      }

      const localVideo = document.getElementById('localVideo');
      const remoteVideo = document.getElementById('remoteVideo');
      if (localVideo) localVideo.srcObject = null;
      if (remoteVideo) remoteVideo.srcObject = null;

      this.localStream = null;
      this.remoteStream = null;
      this.peerConnection = null;
      this.perfectNegotiation = null;
      this.connectionMonitor = null;
      this.reconnectAttempts = 0;
      this.connectionState = 'disconnected';
      this.iceCandidateQueue = [];
    } else {
      console.log('✅ Keeping connection alive for next customer');
      const remoteVideo = document.getElementById('remoteVideo');
      if (remoteVideo) remoteVideo.srcObject = null;
    }

    if (this.socket) {
      this.socket.emit('call:end');
    }
  }
}
