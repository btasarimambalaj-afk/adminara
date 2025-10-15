// Text Chat System for AdminAra
class ChatManager {
  constructor(socket) {
    this.socket = socket;
    this.messages = [];
    this.isOpen = false;
    this.unreadCount = 0;
    this.init();
  }

  init() {
    this.createChatUI();
    this.setupSocketListeners();
    this.setupEventListeners();
  }

  createChatUI() {
    const chatHTML = `
      <div id="chatContainer" class="chat-container hidden">
        <div class="chat-header">
          <span>💬 Chat</span>
          <button id="chatClose" class="chat-close">✕</button>
        </div>
        <div id="chatMessages" class="chat-messages"></div>
        <div class="chat-input-wrapper">
          <input type="text" id="chatInput" placeholder="Mesaj yazın..." maxlength="500" />
          <button id="chatSend" class="chat-send-btn">Gönder</button>
        </div>
      </div>
      <button id="chatToggle" class="chat-toggle-btn">
        💬 <span id="chatBadge" class="chat-badge hidden">0</span>
      </button>
    `;

    document.body.insertAdjacentHTML('beforeend', chatHTML);
  }

  setupSocketListeners() {
    this.socket.on('chat:message', data => {
      this.addMessage(data.message, data.sender, data.timestamp);
      if (!this.isOpen) {
        this.unreadCount++;
        this.updateBadge();
      }
    });
  }

  setupEventListeners() {
    const toggle = document.getElementById('chatToggle');
    const close = document.getElementById('chatClose');
    const send = document.getElementById('chatSend');
    const input = document.getElementById('chatInput');

    toggle.onclick = () => this.toggleChat();
    close.onclick = () => this.closeChat();
    send.onclick = () => this.sendMessage();

    input.onkeypress = e => {
      if (e.key === 'Enter') this.sendMessage();
    };
  }

  toggleChat() {
    const container = document.getElementById('chatContainer');
    this.isOpen = !this.isOpen;
    container.classList.toggle('hidden');

    if (this.isOpen) {
      this.unreadCount = 0;
      this.updateBadge();
      document.getElementById('chatInput').focus();
    }
  }

  closeChat() {
    this.isOpen = false;
    document.getElementById('chatContainer').classList.add('hidden');
  }

  sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;

    this.socket.emit('chat:send', { message, timestamp: Date.now() });
    this.addMessage(message, 'me', Date.now());
    input.value = '';
  }

  addMessage(message, sender, timestamp) {
    const messagesDiv = document.getElementById('chatMessages');
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${sender === 'me' ? 'chat-message-me' : 'chat-message-other'}`;

    const time = new Date(timestamp).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    messageEl.innerHTML = `
      <div class="chat-message-content">${this.escapeHtml(message)}</div>
      <div class="chat-message-time">${time}</div>
    `;

    messagesDiv.appendChild(messageEl);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    this.messages.push({ message, sender, timestamp });
  }

  updateBadge() {
    const badge = document.getElementById('chatBadge');
    if (this.unreadCount > 0) {
      badge.textContent = this.unreadCount > 9 ? '9+' : this.unreadCount;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  clearMessages() {
    this.messages = [];
    document.getElementById('chatMessages').innerHTML = '';
  }
}
