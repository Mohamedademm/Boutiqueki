const { createErrorResponse } = require('../utils');

module.exports = function requireRole(...roles) {
  // Accept both requireRole('owner', 'admin') and requireRole(['owner', 'admin'])
  const allowed = roles.flat();
  return (req, res, next) => {
    if (!req.user) {
      return createErrorResponse(res, { statusCode: 401, message: 'Unauthorized' });
    }

    // Admin has superuser access to everything
    if (req.user.role === 'admin') {
      return next();
    }

    if (!allowed.includes(req.user.role)) {
      return createErrorResponse(res, { statusCode: 403, message: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};
