const { maskPii } = require('../../utils/encryption');

describe('Security: PII Masking', () => {
  test('should mask email addresses', () => {
    const email = 'john.doe@example.com';
    const masked = maskPii(email, 'email');
    
    expect(masked).not.toBe(email);
    expect(masked).toContain('@example.com');
    expect(masked).toMatch(/^j\*+e@example\.com$/);
  });
  
  test('should mask phone numbers', () => {
    const phone = '+905551234567';
    const masked = maskPii(phone, 'phone');
    
    expect(masked).not.toBe(phone);
    expect(masked).toContain('4567');
    expect(masked).toMatch(/^\+90555\*+4567$/);
  });
  
  test('should mask names', () => {
    const name = 'John Doe';
    const masked = maskPii(name, 'name');
    
    expect(masked).not.toBe(name);
    expect(masked).toBe('J*** D***');
  });
  
  test('should auto-detect email', () => {
    const email = 'test@example.com';
    const masked = maskPii(email, 'auto');
    
    expect(masked).toContain('@example.com');
    expect(masked).not.toBe(email);
  });
  
  test('should auto-detect phone', () => {
    const phone = '+905551234567';
    const masked = maskPii(phone, 'auto');
    
    expect(masked).toContain('4567');
    expect(masked).not.toBe(phone);
  });
  
  test('should handle short strings', () => {
    const short = 'ab';
    const masked = maskPii(short);
    
    expect(masked).toBe('***');
  });
});
