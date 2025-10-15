class AdminApp {
  constructor() {
    this.socket = io({
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      transports: ['websocket', 'polling'],
    });
    this.webRTCManager = new WebRTCManager();
    this.authenticated = false;
    this.timer = Helpers.createTimer();
    this.init();
  }

  async init() {
    this.setupWelcomeEvents();
    this.setupEvents();
    await this.checkHttpSession();
  }

  async checkHttpSession() {
    try {
      const r = await fetch('/admin/session/verify');
      if (r.ok) {
        console.log('✅ Valid cookie session');
        this.authenticated = true;
        document.getElementById('welcomeScreen').classList.add('hidden');
        document.getElementById('adminPanel').classList.remove('hidden');
        document.getElementById('waiting-message').classList.remove('hidden');
        document.getElementById('controlButtons').classList.remove('hidden');
        const ok = await this.webRTCManager.start(this.socket, false);
        if (ok) {
          console.log('✅ Admin WebRTC stream ready');
        }
        this.socket.emit('room:join', { isAdmin: true });
        console.log('✅ Admin joining room...');
      }
    } catch (e) {
      console.log('❌ No valid session');
    }
    const refreshBtn = document.getElementById('refreshButton');
    if (refreshBtn) refreshBtn.onclick = () => window.location.reload();
  }

  setupWelcomeEvents() {
    const requestBtn = document.getElementById('requestOtpBtn');
    const verifyBtn = document.getElementById('verifyOtpBtn');
    const otpInput = document.getElementById('otpInput');
    const otpError = document.getElementById('otpError');
    const otpSuccess = document.getElementById('otpSuccess');
    const otpSection = document.getElementById('otpInputSection');

    otpInput.oninput = () => {
      const ok = otpInput.value.trim().length === 6;
      verifyBtn.disabled = !ok;
      verifyBtn.classList.toggle('ready', ok);
    };

    requestBtn.onclick = async () => {
      requestBtn.disabled = true;
      requestBtn.textContent = 'Gönderiliyor...';
      try {
        const response = await fetch('/admin/otp/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminId: 'admin' }),
        });
        if (response.ok) {
          otpSuccess.classList.remove('hidden');
          otpSection.classList.remove('hidden');
          requestBtn.classList.add('hidden');
          otpInput.focus();
        } else {
          otpError.textContent = 'Şifre gönderilemedi';
          otpError.classList.remove('hidden');
          requestBtn.disabled = false;
          requestBtn.textContent = 'Kod Gönder';
        }
      } catch (e) {
        otpError.textContent = 'Bağlantı hatası';
        otpError.classList.remove('hidden');
        requestBtn.disabled = false;
        requestBtn.textContent = 'Kod Gönder';
      }
    };

    const handleVerify = async () => {
      const code = otpInput.value.trim();
      if (!/^\d{6}$/.test(code)) {
        otpError.textContent = 'Lütfen 6 haneli şifre girin';
        otpError.classList.remove('hidden');
        return;
      }
      verifyBtn.disabled = true;
      verifyBtn.textContent = 'Kontrol ediliyor...';
      try {
        const r = await fetch('/admin/otp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminId: 'admin', code }),
        });
        if (r.status === 204) {
          this.authenticated = true;
          document.getElementById('welcomeScreen').classList.add('hidden');
          document.getElementById('adminPanel').classList.remove('hidden');
          document.getElementById('waiting-message').classList.remove('hidden');
          document.getElementById('controlButtons').classList.remove('hidden');
          const ok = await this.webRTCManager.start(this.socket, false);
          if (ok) {
            this.webRTCManager.createPeerConnection();
            console.log('✅ Admin WebRTC ready');
          }
          this.socket.emit('room:join', { isAdmin: true });
          console.log('✅ Admin joined room');
        } else {
          otpError.textContent = 'Hatalı şifre!';
          otpError.classList.remove('hidden');
          otpInput.value = '';
          verifyBtn.disabled = false;
          verifyBtn.textContent = 'Panele Gir';
        }
      } catch (e) {
        otpError.textContent = 'Hata oluştu';
        otpError.classList.remove('hidden');
        verifyBtn.disabled = false;
        verifyBtn.textContent = 'Panele Gir';
      }
    };

    verifyBtn.onclick = handleVerify;
    otpInput.onkeypress = e => {
      if (e.key === 'Enter' && otpInput.value.trim().length === 6) handleVerify();
    };
  }

  setupEvents() {
    this.socket.on('disconnect', reason => {
      console.log('🔴 Socket disconnected:', reason);
      if (typeof window.showToast === 'function') {
        window.showToast('warning', 'Bağlantı koptu, yeniden bağlanılıyor...');
      }
    });

    this.socket.on('reconnect', async attemptNumber => {
      console.log('🟢 Socket reconnected after', attemptNumber, 'attempts');
      if (typeof window.showToast === 'function') {
        window.showToast('success', 'Bağlantı yeniden kuruldu');
      }
      if (this.authenticated) {
        try {
          const r = await fetch('/admin/session/verify');
          if (r.ok) {
            this.socket.emit('room:join', { isAdmin: true });
            console.log('✅ Re-joined room after reconnect');
          } else {
            this.authenticated = false;
            window.location.reload();
          }
        } catch (e) {
          this.authenticated = false;
          window.location.reload();
        }
      }
    });

    this.socket.on('room:joined', data => {
      if (data.role === 'admin') {
        console.log('✅ Admin room:joined event received');
        if (!this.webRTCManager.peerConnection) {
          this.webRTCManager.createPeerConnection();
          console.log('✅ Admin peer connection created, waiting for customer...');
        }
      }
    });

    this.socket.on('room:user:joined', async data => {
      if (data.role === 'customer') {
        console.log('👤 Müşteri odaya katıldı:', data.customerName);
        document.getElementById('waiting-message').classList.add('hidden');
        document.getElementById('callInfo').classList.remove('hidden');

        if (data.customerName) {
          const nameDisplay = document.getElementById('customerNameDisplay');
          nameDisplay.textContent = `👤 ${data.customerName}`;
        }

        this.timer.start();
      }
    });

    this.socket.on('queue:update', data => {
      const queueEl = document.getElementById('queueLength');
      if (queueEl) {
        queueEl.textContent = data.queueLength || 0;
      }
    });

    this.socket.emit('queue:get');

    this.socket.on('customer:name:updated', data => {
      const nameDisplay = document.getElementById('customerNameDisplay');
      if (nameDisplay && data.customerName) {
        nameDisplay.textContent = `👤 ${data.customerName}`;
      }
    });

    this.socket.on('room:timeout', () => {
      document.getElementById('waiting-message').classList.remove('hidden');
      document.getElementById('callInfo').classList.add('hidden');
      this.timer.stop();
    });

    Helpers.setupControlButtons(this.webRTCManager);

    document.getElementById('endButton').onclick = () => {
      this.timer.stop();
      this.socket.emit('call:end');
      document.getElementById('waiting-message').classList.remove('hidden');
      document.getElementById('callInfo').classList.add('hidden');
    };

    this.socket.on('call:ended', () => {
      this.timer.stop();
      document.getElementById('waiting-message').classList.remove('hidden');
      document.getElementById('callInfo').classList.add('hidden');
    });

    document.getElementById('diagnosticsToggle').onclick = () => {
      document.getElementById('diagnosticsPanel').classList.toggle('hidden');
    };

    document.getElementById('restartICEButton').onclick = async () => {
      if (this.webRTCManager.peerConnection) {
        await this.webRTCManager.handleConnectionFailure();
        if (typeof window.showToast === 'function') {
          window.showToast('info', 'Bağlantı yeniden başlatılıyor...');
        }
      }
    };

    const testBtn = document.getElementById('testButton');
    const refreshBtn = document.getElementById('refreshButton');
    const reloadBtn = document.getElementById('reloadBtn');

    if (testBtn) testBtn.onclick = () => window.open('/test-suite.html', '_blank');
    if (refreshBtn) refreshBtn.onclick = () => window.location.reload();
    if (reloadBtn) reloadBtn.onclick = () => window.location.reload();
  }
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/service-worker.js')
    .then(() => console.log('✅ Service Worker registered'))
    .catch(err => console.error('❌ Service Worker registration failed:', err));
}

new AdminApp();
