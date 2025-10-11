// Connection Health Monitor - Bağlantı kalitesini izler ve otomatik düzeltir

class ConnectionMonitor {
  constructor(pc, onQualityChange) {
    this.pc = pc;
    this.onQualityChange = onQualityChange;
    this.stats = {
      packetLoss: 0,
      latency: 0,
      bitrate: 0,
      quality: 'good' // good, fair, poor
    };
    this.monitoring = false;
    this.monitorInterval = null;
  }
  
  start() {
    if (this.monitoring) return;
    this.monitoring = true;
    
    console.log('📊 Connection Monitor başlatıldı');
    
    this.monitorInterval = setInterval(() => {
      this.checkConnection();
    }, 2000); // Her 2 saniyede bir kontrol
  }
  
  stop() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    this.monitoring = false;
    console.log('📊 Connection Monitor durduruldu');
  }
  
  async checkConnection() {
    if (!this.pc) return;
    
    try {
      const stats = await this.pc.getStats();
      let inboundStats = null;
      
      stats.forEach(report => {
        if (report.type === 'inbound-rtp' && report.kind === 'audio') {
          inboundStats = report;
        }
      });
      
      if (inboundStats) {
        // Packet loss hesapla
        const packetsLost = inboundStats.packetsLost || 0;
        const packetsReceived = inboundStats.packetsReceived || 0;
        const totalPackets = packetsLost + packetsReceived;
        
        if (totalPackets > 0) {
          this.stats.packetLoss = (packetsLost / totalPackets) * 100;
        }
        
        // Jitter (latency)
        this.stats.latency = inboundStats.jitter || 0;
        
        // Kalite değerlendirmesi
        const oldQuality = this.stats.quality;
        
        if (this.stats.packetLoss > 5 || this.stats.latency > 0.1) {
          this.stats.quality = 'poor';
        } else if (this.stats.packetLoss > 2 || this.stats.latency > 0.05) {
          this.stats.quality = 'fair';
        } else {
          this.stats.quality = 'good';
        }
        
        // Kalite değiştiyse bildir
        if (oldQuality !== this.stats.quality) {
          console.log(`📊 Bağlantı kalitesi: ${oldQuality} → ${this.stats.quality}`);
          if (this.onQualityChange) {
            this.onQualityChange(this.stats.quality);
          }
          
          // Kötü kalitede bitrate düşür
          if (this.stats.quality === 'poor') {
            await this.reduceBitrate();
          }
        }
        
        // Log (sadece sorun varsa)
        if (this.stats.quality !== 'good') {
          console.log('📊 Stats:', {
            packetLoss: this.stats.packetLoss.toFixed(2) + '%',
            latency: (this.stats.latency * 1000).toFixed(0) + 'ms',
            quality: this.stats.quality
          });
        }
      }
    } catch (error) {
      console.error('❌ Stats error:', error);
    }
  }
  
  async reduceBitrate() {
    try {
      const senders = this.pc.getSenders();
      
      for (const sender of senders) {
        if (sender.track && sender.track.kind === 'video') {
          const params = sender.getParameters();
          
          if (!params.encodings) {
            params.encodings = [{}];
          }
          
          // Bitrate'i 500kbps'e düşür
          params.encodings[0].maxBitrate = 500000;
          
          await sender.setParameters(params);
          console.log('⚠️ Video bitrate düşürüldü: 500kbps');
        }
      }
    } catch (error) {
      console.error('❌ Bitrate reduction error:', error);
    }
  }
  
  getStats() {
    return { ...this.stats };
  }
}
