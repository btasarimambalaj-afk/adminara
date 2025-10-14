/**
 * WebRTC Connection Pool
 * Reuse peer connections to reduce setup time
 */
class WebRTCConnectionPool {
  constructor(maxSize = 3) {
    this.maxSize = maxSize;
    this.pool = [];
    this.active = new Map();
  }
  
  /**
   * Get connection from pool or create new
   */
  async acquire(config) {
    // Try to get from pool
    if (this.pool.length > 0) {
      const pc = this.pool.pop();
      console.log('📦 Reusing connection from pool');
      return pc;
    }
    
    // Create new
    console.log('🆕 Creating new connection');
    return new RTCPeerConnection(config);
  }
  
  /**
   * Return connection to pool
   */
  release(pc) {
    if (!pc) return;
    
    // Check if connection is reusable
    const state = pc.connectionState;
    if (state === 'closed' || state === 'failed') {
      console.log('❌ Connection not reusable:', state);
      return;
    }
    
    // Reset connection
    this.resetConnection(pc);
    
    // Add to pool if not full
    if (this.pool.length < this.maxSize) {
      this.pool.push(pc);
      console.log('📦 Connection returned to pool:', this.pool.length);
    } else {
      pc.close();
      console.log('🗑️ Pool full, closing connection');
    }
  }
  
  /**
   * Reset connection for reuse
   */
  resetConnection(pc) {
    // Remove all tracks
    pc.getSenders().forEach(sender => {
      if (sender.track) {
        pc.removeTrack(sender);
      }
    });
    
    // Clear event handlers
    pc.ontrack = null;
    pc.onicecandidate = null;
    pc.onconnectionstatechange = null;
    pc.oniceconnectionstatechange = null;
  }
  
  /**
   * Clear pool
   */
  clear() {
    this.pool.forEach(pc => pc.close());
    this.pool = [];
    this.active.clear();
    console.log('🧹 Pool cleared');
  }
  
  /**
   * Get pool stats
   */
  getStats() {
    return {
      poolSize: this.pool.length,
      maxSize: this.maxSize,
      activeConnections: this.active.size
    };
  }
}

// Export singleton
window.webrtcPool = new WebRTCConnectionPool();
