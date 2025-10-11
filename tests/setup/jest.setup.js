global.fetch = jest.fn();
global.navigator = {
  sendBeacon: jest.fn(() => true),
  mediaDevices: {
    getUserMedia: jest.fn(async () => ({
      getTracks: () => [],
      getAudioTracks: () => [],
      getVideoTracks: () => []
    }))
  }
};

global.RTCPeerConnection = class extends EventTarget {
  constructor() {
    super();
    this.connectionState = 'new';
  }
  addTrack = jest.fn();
  createOffer = jest.fn(async () => ({ type: 'offer', sdp: 'mock' }));
  setLocalDescription = jest.fn(async () => {});
  close = jest.fn();
  __simulateConnected() {
    this.connectionState = 'connected';
    this.dispatchEvent(new Event('connectionstatechange'));
  }
};

jest.useFakeTimers();
