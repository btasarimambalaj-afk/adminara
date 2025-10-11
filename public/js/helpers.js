// Shared helper functions for client and admin
class Helpers {
  static show(el) {
    el && el.classList.remove('hidden');
  }

  static hide(el) {
    el && el.classList.add('hidden');
  }

  static updateConnectionStatus(el, status) {
    if (!el) return;
    const statusMap = {
      connected: 'Bağlandı',
      disconnected: 'Bağlantı Yok',
      connecting: 'Bağlanıyor...'
    };
    const indicator = `<span class="connection-indicator ${status}"></span>`;
    el.innerHTML = indicator + (statusMap[status] || status);
    el.className = `connection-status ${status}`;
  }

  static toggleFullscreen() {
    const vc = document.querySelector('.video-container');
    if (!document.fullscreenElement) {
      vc.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }

  static onFullscreenChange() {
    const vc = document.querySelector('.video-container');
    if (document.fullscreenElement) {
      vc.classList.add('fullscreen');
    } else {
      vc.classList.remove('fullscreen');
    }
  }

  static setupControlButtons(webRTCManager) {
    const muteBtn = document.getElementById('muteButton');
    const cameraBtn = document.getElementById('cameraButton');
    const speakerBtn = document.getElementById('speakerButton');
    const fullscreenBtn = document.getElementById('fullscreenButton');
    const exitFullscreenBtn = document.getElementById('exitFullscreenBtn');
    
    if (muteBtn) {
      muteBtn.onclick = () => {
        const isMuted = webRTCManager.toggleMute();
        muteBtn.classList.toggle('active', isMuted);
        const icon = muteBtn.querySelector('.icon') || muteBtn;
        icon.textContent = isMuted ? '🔇' : '🎙️';
        muteBtn.title = isMuted ? 'Mikrofon Kapalı' : 'Mikrofon Açık';
      };
    }
    
    if (cameraBtn) {
      cameraBtn.onclick = async () => {
        const isCameraOff = await webRTCManager.toggleCamera();
        cameraBtn.classList.toggle('active', isCameraOff);
        const icon = cameraBtn.querySelector('.icon') || cameraBtn;
        icon.textContent = isCameraOff ? '📵' : '📷';
        cameraBtn.title = isCameraOff ? 'Kamera Kapalı' : 'Kamera Açık';
      };
    }
    
    if (speakerBtn) {
      speakerBtn.onclick = async () => {
        const isSpeakerOn = await webRTCManager.toggleSpeaker();
        speakerBtn.classList.toggle('active', isSpeakerOn);
        const icon = speakerBtn.querySelector('.icon') || speakerBtn;
        icon.textContent = isSpeakerOn ? '🔉' : '🔈';
        speakerBtn.title = isSpeakerOn ? 'Hoparlör Açık' : 'Hoparlör Kapalı';
      };
    }
    
    if (fullscreenBtn) {
      fullscreenBtn.onclick = async () => {
        const vc = document.querySelector('.video-container');
        
        try {
          if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            // Tam ekran yap
            if (vc.requestFullscreen) {
              await vc.requestFullscreen();
            } else if (vc.webkitRequestFullscreen) {
              await vc.webkitRequestFullscreen();
            } else if (vc.mozRequestFullScreen) {
              await vc.mozRequestFullScreen();
            } else if (vc.msRequestFullscreen) {
              await vc.msRequestFullscreen();
            }
            console.log('✅ Tam ekran aktif');
          } else {
            // Tam ekrandan çık
            if (document.exitFullscreen) {
              await document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
              await document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
              await document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
              await document.msExitFullscreen();
            }
            console.log('✅ Tam ekrandan çıkıldı');
          }
        } catch (err) {
          console.error('❌ Tam ekran hatası:', err);
        }
      };
      
      // Fullscreen değişikliklerini dinle
      const handleFullscreenChange = () => {
        const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
        const vc = document.querySelector('.video-container');
        const icon = fullscreenBtn.querySelector('.icon') || fullscreenBtn;
        
        if (isFullscreen) {
          vc.classList.add('fullscreen');
          icon.textContent = '⤓';
          fullscreenBtn.title = 'Tam Ekrandan Çık';
          console.log('🔍 Fullscreen ON');
        } else {
          vc.classList.remove('fullscreen');
          icon.textContent = '⛶';
          fullscreenBtn.title = 'Tam Ekran';
          console.log('🔍 Fullscreen OFF');
        }
      };
      
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.addEventListener('mozfullscreenchange', handleFullscreenChange);
      document.addEventListener('msfullscreenchange', handleFullscreenChange);
    }
    
    if (exitFullscreenBtn) {
      exitFullscreenBtn.onclick = () => {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
      };
    }
  }

  static createTimer() {
    let callStartTime = null;
    let timerInterval = null;
    
    return {
      start() {
        callStartTime = Date.now();
        const callInfo = document.getElementById('callInfo');
        const callTime = document.getElementById('callTime');
        const callDuration = document.getElementById('callDuration');
        
        if (callInfo) callInfo.classList.remove('hidden');
        if (callTime) callTime.textContent = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        
        timerInterval = setInterval(() => {
          const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
          const minutes = Math.floor(elapsed / 60);
          const seconds = elapsed % 60;
          if (callDuration) {
            callDuration.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
          }
        }, 1000);
      },
      
      stop() {
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
        const callInfo = document.getElementById('callInfo');
        if (callInfo) callInfo.classList.add('hidden');
      }
    };
  }
}
