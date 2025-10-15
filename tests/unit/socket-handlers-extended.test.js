const { validateOffer, validateAnswer, validateIceCandidate } = require('../../socket/handlers');

describe('Socket Handlers - Extended Coverage', () => {
  describe('validateOffer', () => {
    test('accepts valid offer', () => {
      const offer = { type: 'offer', sdp: 'v=0\r\no=- 123 456 IN IP4 127.0.0.1' };
      expect(validateOffer(offer)).toBe(true);
    });

    test('rejects missing type', () => {
      expect(validateOffer({ sdp: 'test' })).toBe(false);
    });

    test('rejects missing sdp', () => {
      expect(validateOffer({ type: 'offer' })).toBe(false);
    });

    test('rejects wrong type', () => {
      expect(validateOffer({ type: 'answer', sdp: 'test' })).toBe(false);
    });

    test('rejects null', () => {
      expect(validateOffer(null)).toBe(false);
    });
  });

  describe('validateAnswer', () => {
    test('accepts valid answer', () => {
      const answer = { type: 'answer', sdp: 'v=0\r\no=- 789 012 IN IP4 127.0.0.1' };
      expect(validateAnswer(answer)).toBe(true);
    });

    test('rejects missing type', () => {
      expect(validateAnswer({ sdp: 'test' })).toBe(false);
    });

    test('rejects missing sdp', () => {
      expect(validateAnswer({ type: 'answer' })).toBe(false);
    });

    test('rejects wrong type', () => {
      expect(validateAnswer({ type: 'offer', sdp: 'test' })).toBe(false);
    });

    test('rejects null', () => {
      expect(validateAnswer(null)).toBe(false);
    });
  });

  describe('validateIceCandidate', () => {
    test('accepts valid candidate', () => {
      const candidate = {
        candidate: 'candidate:1 1 UDP 2130706431 192.168.1.1 54321 typ host',
        sdpMid: '0',
        sdpMLineIndex: 0,
      };
      expect(validateIceCandidate(candidate)).toBe(true);
    });

    test('rejects missing candidate', () => {
      expect(validateIceCandidate({ sdpMid: '0', sdpMLineIndex: 0 })).toBe(false);
    });

    test('rejects empty candidate', () => {
      expect(validateIceCandidate({ candidate: '', sdpMid: '0', sdpMLineIndex: 0 })).toBe(false);
    });

    test('rejects null', () => {
      expect(validateIceCandidate(null)).toBe(false);
    });

    test('accepts candidate without sdpMid', () => {
      expect(validateIceCandidate({ candidate: 'test', sdpMLineIndex: 0 })).toBe(true);
    });
  });
});
