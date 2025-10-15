const { issueTokens, verifyToken, verifyTotp, generateMfaSecret } = require('../../utils/auth');

describe('Auth Utils', () => {
  test('should issue valid JWT tokens', () => {
    const user = { id: 'admin', role: 'admin' };
    const { accessToken, refreshToken, expiresIn } = issueTokens(user);

    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();
    expect(expiresIn).toBe(900); // 15 min

    const decoded = verifyToken(accessToken);
    expect(decoded.sub).toBe('admin');
    expect(decoded.role).toBe('admin');
  });

  test('should reject expired tokens', () => {
    const jwt = require('jsonwebtoken');
    const config = require('../../config');

    const expiredToken = jwt.sign(
      { sub: 'admin', exp: Math.floor(Date.now() / 1000) - 3600 },
      config.JWT_SECRET
    );

    expect(() => verifyToken(expiredToken)).toThrow();
  });

  test('should generate MFA secret', async () => {
    const { secret, qrCode, otpauth } = await generateMfaSecret('admin');

    expect(secret).toBeDefined();
    expect(secret.length).toBe(32);
    expect(qrCode).toContain('data:image/png;base64');
    expect(otpauth).toContain('otpauth://totp/');
  });

  test('should verify valid TOTP code', () => {
    const { authenticator } = require('otplib');
    const secret = authenticator.generateSecret();
    const code = authenticator.generate(secret);

    expect(verifyTotp(secret, code)).toBe(true);
  });

  test('should reject invalid TOTP code', () => {
    const { authenticator } = require('otplib');
    const secret = authenticator.generateSecret();

    expect(verifyTotp(secret, '000000')).toBe(false);
  });
});
