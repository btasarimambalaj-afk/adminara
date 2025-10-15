/**
 * Adaptive Quality Manager
 * Adjusts video bitrate based on bandwidth and battery
 */
class AdaptiveQuality {
  constructor(peerConnection) {
    this.pc = peerConnection;
    this.currentBitrate = 1500000; // 1.5Mbps default
    this.minBitrate = 300000; // 300kbps
    this.maxBitrate = 1500000; // 1.5Mbps
    this.batteryThreshold = 0.2; // 20%
    this.statsInterval = null;
    this.batteryLevel = 1;
    this.isLowPower = false;
  }

  /**
   * Start adaptive quality monitoring
   */
  start() {
    this.monitorBattery();
    this.monitorBandwidth();
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }

  /**
   * Monitor battery level
   */
  async monitorBattery() {
    if (!navigator.getBattery) return;

    try {
      const battery = await navigator.getBattery();

      const updateBattery = () => {
        this.batteryLevel = battery.level;
        this.isLowPower = battery.level < this.batteryThreshold;

        if (this.isLowPower) {
          console.log('🔋 Low battery detected, reducing quality');
          this.setBitrate(this.minBitrate);
        }
      };

      battery.addEventListener('levelchange', updateBattery);
      battery.addEventListener('chargingchange', updateBattery);
      updateBattery();
    } catch (err) {
      console.warn('Battery API not available', err);
    }
  }

  /**
   * Monitor bandwidth via getStats()
   */
  monitorBandwidth() {
    this.statsInterval = setInterval(async () => {
      if (!this.pc || this.pc.connectionState !== 'connected') return;

      try {
        const stats = await this.pc.getStats();
        const bandwidth = this.calculateBandwidth(stats);

        if (bandwidth > 0) {
          this.adaptBitrate(bandwidth);
        }
      } catch (err) {
        console.error('Stats error:', err);
      }
    }, 3000); // Check every 3s
  }

  /**
   * Calculate available bandwidth from stats
   */
  calculateBandwidth(stats) {
    let bandwidth = 0;

    stats.forEach(report => {
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        bandwidth = report.availableOutgoingBitrate || 0;
      }
    });

    return bandwidth;
  }

  /**
   * Adapt bitrate based on bandwidth
   */
  adaptBitrate(bandwidth) {
    let targetBitrate;

    // Low power mode
    if (this.isLowPower) {
      targetBitrate = this.minBitrate;
    }
    // Poor network (<500kbps)
    else if (bandwidth < 500000) {
      targetBitrate = this.minBitrate;
    }
    // Fair network (500kbps-1Mbps)
    else if (bandwidth < 1000000) {
      targetBitrate = 500000;
    }
    // Good network (>1Mbps)
    else {
      targetBitrate = this.maxBitrate;
    }

    // Only update if significant change
    if (Math.abs(targetBitrate - this.currentBitrate) > 100000) {
      this.setBitrate(targetBitrate);
    }
  }

  /**
   * Set video bitrate
   */
  async setBitrate(bitrate) {
    if (!this.pc) return;

    try {
      const senders = this.pc.getSenders();
      const videoSender = senders.find(s => s.track?.kind === 'video');

      if (!videoSender) return;

      const params = videoSender.getParameters();
      if (!params.encodings || params.encodings.length === 0) {
        params.encodings = [{}];
      }

      params.encodings[0].maxBitrate = bitrate;
      await videoSender.setParameters(params);

      this.currentBitrate = bitrate;
      console.log(`📊 Bitrate adjusted: ${(bitrate / 1000).toFixed(0)}kbps`);

      // Emit metric
      if (window.metricsReporter) {
        window.metricsReporter.reportBitrateChange(bitrate);
      }
    } catch (err) {
      console.error('Failed to set bitrate:', err);
    }
  }

  /**
   * Get current quality info
   */
  getQualityInfo() {
    return {
      bitrate: this.currentBitrate,
      batteryLevel: this.batteryLevel,
      isLowPower: this.isLowPower,
      quality: this.getQualityLabel(),
    };
  }

  /**
   * Get quality label
   */
  getQualityLabel() {
    if (this.currentBitrate <= 300000) return 'Low (300kbps)';
    if (this.currentBitrate <= 500000) return 'Medium (500kbps)';
    return 'High (1.5Mbps)';
  }
}

// Export for use in webrtc.js
window.AdaptiveQuality = AdaptiveQuality;
