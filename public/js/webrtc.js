class WebRTCManager {
  constructor() {
    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
    this.socket = null;
    this.isCaller = false;
    this.perfectNegotiation = null;
    this.connectionMonitor = null;
    this.retryCount = 0;
    this.maxRetries = 10;
    this.reconnectTimer = null;
    this.maxReconnectAttempts = 10;
    this.reconnectAttempts = 0;
    this.config = null;
    this.heartbeatInterval = null;
    this.connectionState = 'disconnected';
    this.persistentMode = false;
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
      
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
      });
      
      console.log('✅ Got local stream:', this.localStream.getTracks().length, 'tracks');
      console.log('📹 Kamera kapalı başlatıldı');
      
      this.setupSocketListeners();
      
      return true;
    } catch (error) {
      console.error('❌ getUserMedia error:', error);
      return false;
    }
  }

  setupSocketListeners() {
    console.log('📡 Setting up socket listeners');
    
    // ICE candidates (her zaman gerekli)
    this.socket.on('rtc:ice:candidate', async ({ candidate }) => {
      if (this.peerConnection && candidate) {
        console.log('🧊 Adding ICE candidate');
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });
    
    // Perfect Negotiation kullanılıyor, legacy listener'lar gereksiz
    console.log('✅ Perfect Negotiation exclusive mode - legacy disabled');
  }

  createPeerConnection() {
    console.log('🔗 Creating peer connection');
    
    this.peerConnection = new RTCPeerConnection(this.config);
    
    // Add local tracks
    this.localStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, this.localStream);
      console.log('✅ Added track:', track.kind);
    });
    
    // Handle remote tracks
    this.peerConnection.ontrack = (event) => {
      console.log('📺 Received remote track:', event.track.kind);
      const remoteVideo = document.getElementById('remoteVideo');
      if (remoteVideo && event.streams[0]) {
        remoteVideo.srcObject = event.streams[0];
        this.setAudioOutputToEarpiece(remoteVideo);
        console.log('✅ Remote video set');
      }
    };
    
    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('rtc:ice:candidate', { candidate: event.candidate });
        console.log('📤 Sent ICE candidate');
      }
    };
    
    // Connection state
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection.connectionState;
      console.log('🔌 Connection state:', state);
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
      
      if (state === 'disconnected') {
        this.showUserMessage('Bağlantı koptu, yeniden deneniyor...', 'warning');
        this.stopHeartbeat();
        this.scheduleReconnect();
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
      console.log('🧊 ICE state:', this.peerConnection.iceConnectionState);
      
      if (this.peerConnection.iceConnectionState === 'failed') {
        this.handleConnectionFailure();
      }
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
      this.connectionMonitor = new ConnectionMonitor(
        this.peerConnection,
        (quality) => {
          console.log('📊 Kalite değişti:', quality);
          // UI'da gösterilebilir
        }
      );
      console.log('✅ Connection Monitor aktif');
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
            height: { ideal: 1080, max: 1440 }
          }
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
          
          const earpiece = audioOutputs.find(d => 
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
    
    // iOS kontrolü
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      // iOS: Proximity sensor kullanıyor, manuel değiştirme yok
      console.log('🍎 iOS: Proximity sensor aktif - Telefonu uzaklaştırın/yaklaştırın');
      // Buton durumunu toggle et (görsel için)
      this.isUsingEarpiece = !this.isUsingEarpiece;
      return !this.isUsingEarpiece;
    }
    
    // Android/Desktop: setSinkId ile değiştir
    if (typeof remoteVideo.setSinkId !== 'undefined') {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
        
        if (this.isUsingEarpiece) {
          // Hoparlör modu
          const speaker = audioOutputs.find(d => 
            d.label.toLowerCase().includes('speaker') ||
            d.label.toLowerCase().includes('hoparlör') ||
            d.label.toLowerCase().includes('loud')
          );
          
          if (speaker) {
            await remoteVideo.setSinkId(speaker.deviceId);
            console.log('🔊 Hoparlör:', speaker.label);
          } else if (audioOutputs.length > 0) {
            await remoteVideo.setSinkId(audioOutputs[0].deviceId);
            console.log('🔊 Hoparlör:', audioOutputs[0].label);
          }
          this.isUsingEarpiece = false;
        } else {
          // Ahize modu
          const earpiece = audioOutputs.find(d => 
            d.label.toLowerCase().includes('earpiece') ||
            d.label.toLowerCase().includes('receiver') ||
            d.label.toLowerCase().includes('kulaklık')
          );
          
          if (earpiece) {
            await remoteVideo.setSinkId(earpiece.deviceId);
            console.log('👂 Ahize:', earpiece.label);
          } else {
            await remoteVideo.setSinkId('');
            console.log('👂 Ahize: Varsayılan');
          }
          this.isUsingEarpiece = true;
        }
      } catch (error) {
        console.error('❌ setSinkId hatası:', error);
        this.isUsingEarpiece = !this.isUsingEarpiece;
      }
    } else {
      // setSinkId desteklenmiyorsa sadece state değiştir
      console.warn('⚠️ setSinkId desteklenmiyor');
      this.isUsingEarpiece = !this.isUsingEarpiece;
    }
    
    return !this.isUsingEarpiece;
  }

  scheduleReconnect() {
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (this.peerConnection?.connectionState === 'disconnected') {
        this.handleConnectionFailure();
      }
    }, 2000);
  }

  async handleConnectionFailure() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnect attempts reached');
      this.showUserMessage('Bağlantı kurulamadı. Lütfen sayfayı yenileyin.', 'error');
      this.connectionState = 'failed';
      return;
    }
    
    this.reconnectAttempts++;
    const backoff = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 8000);
    const startTime = Date.now();
    
    console.log(`🔄 Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} (backoff: ${backoff}ms)`);
    this.showUserMessage(`Yeniden bağlanılıyor... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`, 'info');
    this.connectionState = 'reconnecting';
    
    this.sendMetric('/metrics/reconnect-attempt');
    
    await new Promise(resolve => setTimeout(resolve, backoff));
    
    try {
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
          body: JSON.stringify(data)
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
        this.peerConnection.getStats().then(stats => {
          let rtt = 0;
          stats.forEach(report => {
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
              rtt = report.currentRoundTripTime || 0;
            }
          });
          if (rtt > 0) {
            console.log('❤️ Heartbeat OK - RTT:', Math.round(rtt * 1000), 'ms');
          }
        }).catch(() => {});
      } else {
        console.warn('⚠️ Heartbeat failed - connection not stable');
        this.stopHeartbeat();
      }
    }, 5000);
  }
  
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      console.log('❤️ Heartbeat stopped');
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
    clearTimeout(this.reconnectTimer);
    console.log('📴 Ending call, keepConnection:', keepConnection);
    
    if (!keepConnection) {
      this.stopHeartbeat();
      
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
      }
      
      if (this.peerConnection) {
        this.peerConnection.close();
      }
      
      const localVideo = document.getElementById('localVideo');
      const remoteVideo = document.getElementById('remoteVideo');
      if (localVideo) localVideo.srcObject = null;
      if (remoteVideo) remoteVideo.srcObject = null;
      
      this.localStream = null;
      this.remoteStream = null;
      this.peerConnection = null;
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
