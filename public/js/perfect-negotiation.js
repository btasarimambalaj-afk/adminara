// Perfect Negotiation Pattern - WebRTC'nin resmi önerisi
// Timing sorunlarını ve collision'ları otomatik çözer

class PerfectNegotiation {
  constructor(pc, socket, isPolite) {
    this.pc = pc;
    this.socket = socket;
    this.isPolite = isPolite; // Customer: polite, Admin: impolite
    this.makingOffer = false;
    this.ignoreOffer = false;
    this.isSettingRemoteAnswerPending = false;
    
    this.setupNegotiation();
  }
  
  setupNegotiation() {
    // Negotiation needed - otomatik offer gönder
    this.pc.onnegotiationneeded = async () => {
      try {
        this.makingOffer = true;
        await this.pc.setLocalDescription();
        console.log('📤 Perfect Negotiation: Sending', this.pc.localDescription.type);
        this.socket.emit('rtc:description', { 
          description: this.pc.localDescription 
        }, (ack) => {
          if (ack?.ok) {
            console.log('✅ Description acknowledged');
          } else {
            console.warn('⚠️ Description not acknowledged, retrying...');
            setTimeout(() => {
              this.socket.emit('rtc:description', { description: this.pc.localDescription });
            }, 1000);
          }
        });
      } catch (error) {
        console.error('❌ Negotiation error:', error);
      } finally {
        this.makingOffer = false;
      }
    };
    
    // Description (offer/answer) alındığında
    this.socket.on('rtc:description', async ({ description }) => {
      try {
        console.log('📥 Perfect Negotiation: Received', description.type);
        
        // Collision detection
        const readyForOffer =
          !this.makingOffer &&
          (this.pc.signalingState === 'stable' || this.isSettingRemoteAnswerPending);
        
        const offerCollision = description.type === 'offer' && !readyForOffer;
        
        this.ignoreOffer = !this.isPolite && offerCollision;
        
        if (this.ignoreOffer) {
          console.log('⚠️ Ignoring offer (impolite peer, collision)');
          return;
        }
        
        this.isSettingRemoteAnswerPending = description.type === 'answer';
        await this.pc.setRemoteDescription(description);
        this.isSettingRemoteAnswerPending = false;
        
        // Offer aldıysak answer gönder
        if (description.type === 'offer') {
          await this.pc.setLocalDescription();
          console.log('📤 Perfect Negotiation: Sending answer');
          this.socket.emit('rtc:description', { 
            description: this.pc.localDescription 
          }, (ack) => {
            if (ack?.ok) {
              console.log('✅ Answer acknowledged');
            } else {
              console.warn('⚠️ Answer not acknowledged');
            }
          });
        }
      } catch (error) {
        console.error('❌ Description handling error:', error);
      }
    });
  }
}
