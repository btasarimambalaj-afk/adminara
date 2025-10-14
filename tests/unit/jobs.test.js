const { rotateTurnSecret } = require('../../jobs/turn-rotation');
const { cleanupExpiredSessions } = require('../../jobs/session-cleanup');
const { deleteOldLogs } = require('../../jobs/retention');

describe('Background Jobs', () => {
  test('should rotate TURN secret', async () => {
    const result = await rotateTurnSecret();
    expect(result.success).toBe(true);
    expect(result.rotatedAt).toBeDefined();
  });
  
  test('should cleanup expired sessions', async () => {
    const result = await cleanupExpiredSessions();
    expect(result.success).toBe(true);
    expect(result.cleaned).toBeGreaterThanOrEqual(0);
  });
  
  test('should delete old logs', async () => {
    const result = await deleteOldLogs();
    expect(result.success).toBe(true);
    expect(result.deleted).toBeGreaterThanOrEqual(0);
  });
});
