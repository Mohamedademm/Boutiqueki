const jwt = require('jsonwebtoken');
const { createErrorResponse } = require('../utils');

module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return createErrorResponse(res, { statusCode: 401, message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return createErrorResponse(res, { statusCode: 401, message: 'Token expired' });
    }
    return createErrorResponse(res, { statusCode: 401, message: 'Invalid token' });
  }
};
