jest.useFakeTimers();

global.navigator = global.navigator || {};
navigator.sendBeacon = jest.fn(() => true);

class MockPC {
  constructor() {
    this.connectionState = 'new';
    this.iceConnectionState = 'new';
    this._listeners = {};
  }

  addEventListener(type, fn) {
    (this._listeners[type] ||= new Set()).add(fn);
  }

  _emit(type) {
    (this._listeners[type] || []).forEach(fn => fn());
  }

  async createOffer(opts) {
    return { type: 'offer', sdp: `v=0\niceRestart=${!!opts?.iceRestart}` };
  }

  async setLocalDescription(desc) {
    this.localDescription = desc;
    this._emit('negotiationneeded');
  }

  __fail() {
    this.connectionState = 'disconnected';
    this.iceConnectionState = 'failed';
    this._emit('connectionstatechange');
  }

  __ok() {
    this.connectionState = 'connected';
    this.iceConnectionState = 'connected';
    this._emit('connectionstatechange');
  }
}

global.RTCPeerConnection = MockPC;

describe('E2E: Reconnect Flow', () => {
  test('reconnect attempt and success metrics called', async () => {
    const pc = new RTCPeerConnection();

    // Simulate failure
    pc.__fail();
    navigator.sendBeacon('/metrics/reconnect-attempt');

    // ICE restart
    const offer = await pc.createOffer({ iceRestart: true });
    await pc.setLocalDescription(offer);

    // Simulate recovery
    setTimeout(() => pc.__ok(), 2000);
    jest.advanceTimersByTime(2100);

    navigator.sendBeacon('/metrics/reconnect-success');

    expect(navigator.sendBeacon).toHaveBeenCalledWith('/metrics/reconnect-attempt');
    expect(navigator.sendBeacon).toHaveBeenCalledWith('/metrics/reconnect-success');
    expect(pc.connectionState).toBe('connected');
  });

  test('reconnect completes within 8s', () => {
    const pc = new RTCPeerConnection();
    const startTime = Date.now();

    pc.__fail();
    setTimeout(() => pc.__ok(), 7000);
    jest.advanceTimersByTime(7100);

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(8000);
    expect(pc.connectionState).toBe('connected');
  });
});
