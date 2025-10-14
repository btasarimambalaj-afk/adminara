const { hasPermission, getRolePermissions, roleExists, getDefaultRole } = require('../../utils/rbac');

describe('RBAC Utils', () => {
  test('should check admin permissions', () => {
    expect(hasPermission('admin', 'queue:pop')).toBe(true);
    expect(hasPermission('admin', 'reports:generate')).toBe(true);
    expect(hasPermission('admin', 'users:delete')).toBe(true);
  });
  
  test('should check operator permissions', () => {
    expect(hasPermission('operator', 'queue:pop')).toBe(true);
    expect(hasPermission('operator', 'reports:read')).toBe(true);
    expect(hasPermission('operator', 'users:delete')).toBe(false);
  });
  
  test('should check viewer permissions', () => {
    expect(hasPermission('viewer', 'queue:read')).toBe(true);
    expect(hasPermission('viewer', 'queue:pop')).toBe(false);
    expect(hasPermission('viewer', 'users:delete')).toBe(false);
  });
  
  test('should get role permissions', () => {
    const adminPerms = getRolePermissions('admin');
    expect(adminPerms).toBeInstanceOf(Array);
    expect(adminPerms.length).toBeGreaterThan(0);
    expect(adminPerms).toContain('queue:pop');
  });
  
  test('should check if role exists', () => {
    expect(roleExists('admin')).toBe(true);
    expect(roleExists('operator')).toBe(true);
    expect(roleExists('invalid')).toBe(false);
  });
  
  test('should get default role', () => {
    const defaultRole = getDefaultRole();
    expect(defaultRole).toBe('viewer');
  });
});
