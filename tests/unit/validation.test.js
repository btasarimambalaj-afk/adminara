const { validateRoomJoin, validateRTCMessage } = require('../../utils/validation');

describe('Validation Utils', () => {
  describe('validateRoomJoin', () => {
    it('should validate customer role', () => {
      const data = { role: 'customer', customerName: 'Test User' };
      const { error } = validateRoomJoin(data);
      expect(error).toBeUndefined();
    });

    it('should validate admin role', () => {
      const data = { role: 'admin' };
      const { error } = validateRoomJoin(data);
      expect(error).toBeUndefined();
    });

    it('should reject invalid role', () => {
      const data = { role: 'invalid' };
      const { error } = validateRoomJoin(data);
      expect(error).toBeDefined();
    });

    it('should require customerName for customer', () => {
      const data = { role: 'customer' };
      const { error } = validateRoomJoin(data);
      expect(error).toBeDefined();
    });

    it('should reject long customerName', () => {
      const data = { role: 'customer', customerName: 'a'.repeat(51) };
      const { error } = validateRoomJoin(data);
      expect(error).toBeDefined();
    });
  });

  describe('validateRTCMessage', () => {
    it('should validate description message', () => {
      const data = { type: 'description', description: { type: 'offer', sdp: 'test' } };
      const { error } = validateRTCMessage(data);
      expect(error).toBeUndefined();
    });

    it('should validate ice-candidate message', () => {
      const data = { type: 'ice-candidate', candidate: { candidate: 'test' } };
      const { error } = validateRTCMessage(data);
      expect(error).toBeUndefined();
    });

    it('should reject invalid type', () => {
      const data = { type: 'invalid' };
      const { error } = validateRTCMessage(data);
      expect(error).toBeDefined();
    });

    it('should require description for description type', () => {
      const data = { type: 'description' };
      const { error } = validateRTCMessage(data);
      expect(error).toBeDefined();
    });

    it('should require candidate for ice-candidate type', () => {
      const data = { type: 'ice-candidate' };
      const { error } = validateRTCMessage(data);
      expect(error).toBeDefined();
    });
  });
});
