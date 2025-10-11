const { createOtpForAdmin, verifyAdminOtp } = require('../../socket/admin-auth');

describe('admin-auth OTP', () => {
  let mockBot;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBot = { sendMessage: jest.fn(async () => ({ ok: true })) };
  });

  test('createOtpForAdmin generates 6-digit code', () => {
    const otp = createOtpForAdmin('admin', mockBot);
    expect(otp.password).toMatch(/^\d{6}$/);
    expect(otp.expires).toBeGreaterThan(Date.now());
  });

  test('verifyAdminOtp accepts valid code', () => {
    const otp = createOtpForAdmin('admin', mockBot);
    const result = verifyAdminOtp('admin', otp.password);
    expect(result).toBe(true);
  });

  test('verifyAdminOtp rejects invalid code', () => {
    createOtpForAdmin('admin', mockBot);
    const result = verifyAdminOtp('admin', '000000');
    expect(result).toBe(false);
  });

  test('verifyAdminOtp rejects expired OTP', () => {
    const otp = createOtpForAdmin('admin', mockBot);
    jest.spyOn(Date, 'now').mockReturnValue(otp.expires + 1000);
    const result = verifyAdminOtp('admin', otp.password);
    expect(result).toBe(false);
  });

  test('verifyAdminOtp prevents reuse', () => {
    const otp = createOtpForAdmin('admin', mockBot);
    verifyAdminOtp('admin', otp.password);
    const result = verifyAdminOtp('admin', otp.password);
    expect(result).toBe(false);
  });
});
