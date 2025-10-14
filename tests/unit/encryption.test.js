const { encrypt, decrypt, maskPii, hash } = require('../../utils/encryption');

describe('Encryption Utils', () => {
  const testKey = 'test-encryption-key-32-chars-min';
  
  test('should encrypt and decrypt data', () => {
    const plaintext = 'sensitive data';
    const encrypted = encrypt(plaintext, testKey);
    const decrypted = decrypt(encrypted, testKey);
    
    expect(encrypted).not.toBe(plaintext);
    expect(decrypted).toBe(plaintext);
  });
  
  test('should mask email addresses', () => {
    expect(maskPii('john@example.com', 'email')).toBe('j**n@example.com');
    expect(maskPii('a@example.com', 'email')).toBe('a***@example.com');
  });
  
  test('should mask phone numbers', () => {
    expect(maskPii('+905551234567', 'phone')).toBe('+90555***4567');
    expect(maskPii('5551234567', 'phone')).toBe('555***4567');
  });
  
  test('should mask names', () => {
    expect(maskPii('John Doe', 'name')).toBe('J*** D**');
    expect(maskPii('Alice', 'name')).toBe('A****');
  });
  
  test('should hash data consistently', () => {
    const data = 'test data';
    const hash1 = hash(data);
    const hash2 = hash(data);
    
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 = 64 hex chars
  });
  
  test('should auto-detect PII type', () => {
    expect(maskPii('test@example.com')).toContain('@');
    expect(maskPii('+905551234567')).toContain('***');
  });
});
