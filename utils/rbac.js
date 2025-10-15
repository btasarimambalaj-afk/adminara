const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

let rolesConfig = null;

/**
 * Load roles configuration from YAML
 */
function loadRoles() {
  if (rolesConfig) return rolesConfig;

  try {
    const rolesPath = path.join(__dirname, '../config/roles.yaml');
    rolesConfig = yaml.load(fs.readFileSync(rolesPath, 'utf8'));
    logger.info('Roles configuration loaded', {
      roles: Object.keys(rolesConfig.roles || {}),
    });
    return rolesConfig;
  } catch (err) {
    logger.error('Failed to load roles.yaml', { error: err.message });
    return { roles: {}, resources: {}, default_role: 'viewer' };
  }
}

/**
 * Check if role has permission
 * @param {string} role - User role
 * @param {string} permission - Permission (e.g., 'queue:pop')
 * @returns {boolean}
 */
function hasPermission(role, permission) {
  const config = loadRoles();
  const permissions = config.roles[role] || [];
  return permissions.includes(permission);
}

/**
 * Get all permissions for role
 * @param {string} role - User role
 * @returns {string[]}
 */
function getRolePermissions(role) {
  const config = loadRoles();
  return config.roles[role] || [];
}

/**
 * Check if role exists
 * @param {string} role - Role name
 * @returns {boolean}
 */
function roleExists(role) {
  const config = loadRoles();
  return !!config.roles[role];
}

/**
 * Get default role
 * @returns {string}
 */
function getDefaultRole() {
  const config = loadRoles();
  return config.default_role || 'viewer';
}

/**
 * Get role hierarchy level
 * @param {string} role - Role name
 * @returns {number} Higher number = more privileged
 */
function getRoleLevel(role) {
  const config = loadRoles();
  const hierarchy = config.hierarchy || [];
  const index = hierarchy.indexOf(role);
  return index >= 0 ? index : -1;
}

/**
 * Check if role1 is higher than role2 in hierarchy
 * @param {string} role1 - First role
 * @param {string} role2 - Second role
 * @returns {boolean}
 */
function isHigherRole(role1, role2) {
  return getRoleLevel(role1) > getRoleLevel(role2);
}

module.exports = {
  loadRoles,
  hasPermission,
  getRolePermissions,
  roleExists,
  getDefaultRole,
  getRoleLevel,
  isHigherRole,
};
