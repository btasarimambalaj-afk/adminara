// Toast Notification System

window.showToast = (type, message) => {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${getIcon(type)}</span>
    <span class="toast-message">${message}</span>
  `;
  
  document.body.appendChild(toast);
  
  // Animate in
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Remove after 5 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
};

function getIcon(type) {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  return icons[type] || icons.info;
}

// User-friendly error messages
const ERROR_MESSAGES = {
  'NotAllowedError': 'Mikrofon izni verilmedi. Lütfen tarayıcı ayarlarından izin verin.',
  'NotFoundError': 'Mikrofon bulunamadı. Lütfen cihazınızı kontrol edin.',
  'NotReadableError': 'Mikrofon kullanımda. Diğer uygulamaları kapatın.',
  'OverconstrainedError': 'Mikrofon ayarları uyumsuz.',
  'TypeError': 'Tarayıcı desteği eksik. Lütfen güncelleyin.',
  'default': 'Bağlantı hatası. Lütfen tekrar deneyin.'
};

window.getUserFriendlyError = (error) => {
  return ERROR_MESSAGES[error.name] || ERROR_MESSAGES.default;
};
