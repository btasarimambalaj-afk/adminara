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
