const nameInput = document.getElementById('welcomeNameInput');
const startBtn = document.getElementById('startCallBtn');

function updateBtn(){
  const ok = nameInput.value.trim().length >= 2;
  startBtn.disabled = !ok;
  startBtn.classList.toggle('ready', ok);
}

window.addEventListener('load', () => {
  updateBtn();
  nameInput.focus();
});

nameInput.addEventListener('input', updateBtn);

nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !startBtn.disabled) {
    e.preventDefault();
    startBtn.click();
  }
});

const socket = io();
let myPosition = null;

socket.on('queue:joined', (data) => {
  myPosition = data.position;
  const statusEl = document.getElementById('queueStatus');
  if (statusEl) {
    statusEl.textContent = `Sırada: ${myPosition}. sıradasınız`;
    statusEl.classList.remove('hidden');
  }
});

socket.on('queue:ready', () => {
  myPosition = null;
  const statusEl = document.getElementById('queueStatus');
  if (statusEl) {
    statusEl.textContent = 'Sıranız geldi! Bağlanıyor...';
  }
  document.getElementById('callButton').click();
});

startBtn.onclick = function() {
  const name = nameInput.value.trim();
  if (name.length >= 2) {
    document.getElementById('customerName').value = name;
    document.getElementById('welcomeWrapper').classList.add('hidden');
    document.getElementById('callScreen').classList.remove('hidden');
    document.getElementById('callButton').click();
  }
};

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(() => console.log('✅ Service Worker registered'))
    .catch((err) => console.error('❌ Service Worker registration failed:', err));
}
