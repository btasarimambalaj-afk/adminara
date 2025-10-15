// tests/integration/webrtc-deep.test.js - WebRTC Deep Tests

describe('WebRTC Deep Tests', () => {
  let pc;

  afterEach(() => {
    if (pc) {
      pc.close();
      pc = null;
    }
  });

  test('ICE candidate gathering with timeout', async () => {
    pc = new RTCPeerConnection();
    const candidates = [];
    let gatheringComplete = false;

    const timeout = new Promise((resolve) => setTimeout(() => resolve('timeout'), 5000));
    const gathering = new Promise((resolve) => {
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          candidates.push(event.candidate);
        } else {
          gatheringComplete = true;
          resolve('complete');
        }
      };
    });

    pc.createDataChannel('test');
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const result = await Promise.race([gathering, timeout]);
    
    expect(result).toBe('complete');
    expect(candidates.length).toBeGreaterThan(0);
    expect(gatheringComplete).toBe(true);
  }, 10000);

  test('Connection state transitions', async () => {
    pc = new RTCPeerConnection();
    const states = [];

    pc.onconnectionstatechange = () => {
      states.push(pc.connectionState);
    };

    expect(pc.connectionState).toBe('new');
    
    pc.createDataChannel('test');
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(states).toContain('connecting');
  });
});
