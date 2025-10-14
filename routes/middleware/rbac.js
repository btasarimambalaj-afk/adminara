const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const logger = require('../../utils/logger');

// Load roles configuration
let rolesConfig;
try {
  const rolesPath = path.join(__dirname, '../../config/roles.yaml');
  rolesConfig = yaml.load(fs.readFileSync(rolesPath, 'utf8'));
} catch (err) {
  logger.error('Failed to load roles.yaml', { error: err.message });
  rolesConfig = { roles: {}, resources: {} };
}

/**
 * RBAC Middleware Factory
 * @param {string} permission - Required permission (e.g., 'queue:pop')
 * @returns {Function} Express middleware
 */
function requireRole(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        code: 'AUTH_401', 
        message: 'Authentication required',
        correlationId: req.id
      });
    }
    
    const userRole = req.user.role || 'viewer';
    const userPermissions = rolesConfig.roles[userRole] || [];
    
    if (!userPermissions.includes(permission)) {
      logger.warn('RBAC denied', { 
        user: req.user.id, 
        role: userRole, 
        permission,
        correlationId: req.id
      });
      
      return res.status(403).json({ 
        code: 'RBAC_403', 
        message: 'Insufficient permissions',
        required: permission,
        correlationId: req.id
      });
    }
    
    next();
  };
}

/**
 * Check if user has permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
function hasPermission(role, permission) {
  const permissions = rolesConfig.roles[role] || [];
  return permissions.includes(permission);
}

module.exports = { requireRole, hasPermission };
