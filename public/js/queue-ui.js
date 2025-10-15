class QueueUI {
  constructor() {
    this.queueContainer = null;
    this.position = null;
  }

  init() {
    this.createQueueUI();
  }

  createQueueUI() {
    this.queueContainer = document.createElement('div');
    this.queueContainer.id = 'queue-container';
    this.queueContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      text-align: center;
      z-index: 10000;
      display: none;
      min-width: 300px;
    `;

    this.queueContainer.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 20px;">⏳</div>
      <h2 style="margin: 0 0 10px 0; color: #333;">Sırada Bekliyorsunuz</h2>
      <p style="color: #666; margin: 0 0 20px 0;">Sıradaki yeriniz:</p>
      <div id="queue-position" style="font-size: 48px; font-weight: bold; color: #4CAF50; margin-bottom: 20px;">-</div>
      <p style="color: #999; font-size: 14px;">Destek temsilcisi müsait olduğunda bağlantı kurulacak</p>
    `;

    document.body.appendChild(this.queueContainer);
  }

  show(position) {
    this.position = position;
    if (!this.queueContainer) this.createQueueUI();

    const positionEl = document.getElementById('queue-position');
    if (positionEl) {
      positionEl.textContent = position;
    }

    this.queueContainer.style.display = 'block';
  }

  hide() {
    if (this.queueContainer) {
      this.queueContainer.style.display = 'none';
    }
  }

  updatePosition(position) {
    this.position = position;
    const positionEl = document.getElementById('queue-position');
    if (positionEl) {
      positionEl.textContent = position;
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = QueueUI;
}
