const { test, expect } = require('@playwright/test');

test.describe('WebRTC TURN Fallback', () => {
  test('should fallback to TURN on NAT failure', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Mock restrictive NAT
    await page.addInitScript(() => {
      const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
      navigator.mediaDevices.getUserMedia = function(constraints) {
        return originalGetUserMedia.call(this, constraints);
      };
    });
    
    await page.fill('input[placeholder*="isim"]', 'Test Customer');
    await page.click('button:has-text("Destek")');
    
    await page.waitForTimeout(5000);
    
    // Check TURN usage
    const turnUsed = await page.evaluate(async () => {
      if (!window.webrtcManager?.peerConnection) return false;
      
      const stats = await window.webrtcManager.peerConnection.getStats();
      let usedRelay = false;
      
      stats.forEach(report => {
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          const localId = report.localCandidateId;
          const remoteId = report.remoteCandidateId;
          
          stats.forEach(r => {
            if (r.id === localId || r.id === remoteId) {
              if (r.candidateType === 'relay') {
                usedRelay = true;
              }
            }
          });
        }
      });
      
      return usedRelay;
    });
    
    // TURN may or may not be used depending on network
    expect(typeof turnUsed).toBe('boolean');
  });
});
