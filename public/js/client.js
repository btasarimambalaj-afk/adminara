// Client-side application logic
class ClientApp {
  constructor() {
    this.socket = io();
    this.webRTCManager = new WebRTCManager();
    this.customerName = '';
    this.timer = Helpers.createTimer();
    this.reconnecting = false;
    this.init();
  }

  init() {
    this.setupSocketEvents();
    this.setupUIEvents();
    this.joinChannelImmediately();
  }
  
  async joinChannelImmediately() {
    // Sayfa açılır açılmaz kanala gir ve WebRTC başlat
    console.log('✅ Müşteri kanala katılıyor...');
    this.socket.emit('room:join', {
      isAdmin: false,
      customerName: 'Misafir'
    });
    
    // WebRTC stream'i başlat ama peer connection'u admin gelene kadar bekleme
    console.log('🎥 Customer WebRTC stream başlatılıyor...');
    const ok = await this.webRTCManager.start(this.socket, true);
    if (ok) {
      console.log('✅ Customer WebRTC stream hazır, admin bekleniyor...');
    } else {
      console.error('❌ Customer WebRTC başlamadı');
    }
  }
  


  setupSocketEvents() {
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      Helpers.updateConnectionStatus(
        document.getElementById('connection-status'),
        'connected'
      );
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      Helpers.updateConnectionStatus(
        document.getElementById('connection-status'),
        'disconnected'
      );
    });

    this.socket.on('room:joined', (data) => {
      console.log('Joined room:', data);
      if (data.role === 'customer') {
        document.getElementById('waiting-message').classList.remove('hidden');
      }
    });

    this.socket.on('room:full', () => {
      console.log('Room is full');
      document.getElementById('busy-message').classList.remove('hidden');
      document.getElementById('waiting-message').classList.add('hidden');
    });

    this.socket.on('room:user:joined', async (data) => {
      if (data.role === 'admin') {
        console.log('👨💼 Admin joined, creating peer connection');
        // Admin geldi, şimdi peer connection oluştur
        if (!this.webRTCManager.peerConnection) {
          this.webRTCManager.createPeerConnection();
          console.log('✅ Customer peer connection created');
        }
        await this.startCall();
      }
    });

    this.socket.on('call:ended', () => {
      console.log('Call ended by admin');
      this.endCall();
    });
    
    this.socket.on('room:timeout', () => {
      console.log('Room timeout');
      alert('Zaman aşımı! Admin 1 dakika içinde bağlanmadı.');
      window.location.reload();
    });
    
    this.socket.on('reconnect', () => {
      console.log('Socket reconnected');
      if (this.customerName) {
        this.reconnecting = true;
        this.socket.emit('room:join', {
          isAdmin: false,
          customerName: this.customerName
        });
        setTimeout(() => { this.reconnecting = false; }, 1000);
      }
    });
  }

  setupUIEvents() {
    const callButton = document.getElementById('callButton');
    const endButton = document.getElementById('endButton');
    const customerNameInput = document.getElementById('customerName');

    callButton.onclick = () => this.handleCallButton();
    endButton.onclick = () => this.endCall();

    customerNameInput.onkeypress = (e) => {
      if (e.key === 'Enter') this.handleCallButton();
    };
    
    // Setup control buttons using shared helper
    Helpers.setupControlButtons(this.webRTCManager);
  }

  async handleCallButton() {
    const nameInput = document.getElementById('customerName');
    this.customerName = nameInput.value.trim();

    if (this.customerName.length < 2) {
      alert('Lütfen adınızı girin (en az 2 karakter)');
      return;
    }

    document.getElementById('callButton').disabled = true;
    
    // İsim güncellemesi gönder (WebRTC zaten başlamış)
    this.socket.emit('customer:update:name', { customerName: this.customerName });
    console.log('✅ Müşteri ismi güncellendi:', this.customerName);
  }

  async startCall() {
    console.log('📞 startCall çağrıldı');
    document.getElementById('waiting-message').classList.add('hidden');
    document.getElementById('endButton').classList.remove('hidden');
    document.querySelector('.control-buttons').classList.remove('hidden');
    
    this.timer.start();

    // Perfect Negotiation onnegotiationneeded ile otomatik başlayacak
    console.log('✅ Perfect Negotiation aktif, negotiation başlıyor...');
    
    // Force negotiation by adding/removing a dummy track (Safari fix)
    if (this.webRTCManager.peerConnection) {
      const pc = this.webRTCManager.peerConnection;
      console.log('🔄 Signaling state:', pc.signalingState);
      console.log('🔄 Connection state:', pc.connectionState);
    }
  }

  endCall() {
    this.timer.stop();
    this.webRTCManager.endCall();
    document.getElementById('call-ended-message').classList.remove('hidden');
    document.getElementById('endButton').classList.add('hidden');
    document.querySelector('.control-buttons').classList.add('hidden');
    // Kanal açık kalıyor, sadece video kapanıyor
    console.log('✅ Görüşme bitti, kanal açık');
  }

  showError(message) {
    document.getElementById('error-text').textContent = message;
    document.getElementById('error-message').classList.remove('hidden');
    document.getElementById('waiting-message').classList.add('hidden');
  }
}

// Initialize app
new ClientApp();
