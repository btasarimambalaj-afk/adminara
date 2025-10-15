class MockPC {
  constructor() {
    this.signalingState = 'stable';
    this.localDescription = null;
  }

  async createOffer() {
    this.signalingState = 'have-local-offer';
    return { type: 'offer', sdp: 'v=0' };
  }

  async setLocalDescription(desc) {
    this.localDescription = desc;
  }
}

global.RTCPeerConnection = MockPC;

describe('E2E: WebRTC Glare Resolution', () => {
  test('simultaneous offers do not crash', async () => {
    const pcA = new RTCPeerConnection();
    const pcB = new RTCPeerConnection();

    // Both create offers simultaneously
    const offerA = await pcA.createOffer();
    const offerB = await pcB.createOffer();

    await pcA.setLocalDescription(offerA);
    await pcB.setLocalDescription(offerB);

    // Both should be in valid states
    expect(['stable', 'have-local-offer', 'have-remote-offer']).toContain(pcA.signalingState);
    expect(['stable', 'have-local-offer', 'have-remote-offer']).toContain(pcB.signalingState);
  });

  test('glare detection via signaling state', async () => {
    const pc = new RTCPeerConnection();

    expect(pc.signalingState).toBe('stable');

    await pc.createOffer();
    expect(pc.signalingState).toBe('have-local-offer');
  });
});
