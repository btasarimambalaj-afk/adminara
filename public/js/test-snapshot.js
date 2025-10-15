// test-snapshot.js - Snapshot & Rollback System

class SnapshotManager {
  constructor() {
    this.snapshots = [];
    this.maxSnapshots = 5;
    this.storageKey = 'test-snapshots';
    this.loadSnapshots();
  }

  loadSnapshots() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.snapshots = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load snapshots:', e);
    }
  }

  saveSnapshots() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.snapshots));
    } catch (e) {
      console.error('Failed to save snapshots:', e);
    }
  }

  createSnapshot(name = null) {
    const snapshot = {
      id: Date.now(),
      name: name || `Snapshot ${new Date().toLocaleString('tr-TR')}`,
      timestamp: Date.now(),
      state: {
        localStorage: this.captureLocalStorage(),
        sessionStorage: this.captureSessionStorage(),
        cookies: this.captureCookies(),
        url: window.location.href
      }
    };

    this.snapshots.unshift(snapshot);
    
    // Keep only last N snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots = this.snapshots.slice(0, this.maxSnapshots);
    }

    this.saveSnapshots();
    return snapshot;
  }

  captureLocalStorage() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key !== this.storageKey) {
        data[key] = localStorage.getItem(key);
      }
    }
    return data;
  }

  captureSessionStorage() {
    const data = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      data[key] = sessionStorage.getItem(key);
    }
    return data;
  }

  captureCookies() {
    return document.cookie;
  }

  rollback(snapshotId) {
    const snapshot = this.snapshots.find(s => s.id === snapshotId);
    if (!snapshot) {
      throw new Error('Snapshot not found');
    }

    // Restore localStorage
    localStorage.clear();
    Object.entries(snapshot.state.localStorage).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });

    // Restore sessionStorage
    sessionStorage.clear();
    Object.entries(snapshot.state.sessionStorage).forEach(([key, value]) => {
      sessionStorage.setItem(key, value);
    });

    // Restore cookies (limited)
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });

    // Reload page
    window.location.href = snapshot.state.url;
  }

  deleteSnapshot(snapshotId) {
    this.snapshots = this.snapshots.filter(s => s.id !== snapshotId);
    this.saveSnapshots();
  }

  listSnapshots() {
    return this.snapshots;
  }

  clearAll() {
    this.snapshots = [];
    this.saveSnapshots();
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SnapshotManager;
}
