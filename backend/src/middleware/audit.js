const { db } = require('../utils');

const auditLog = (action, resourceFn = (req) => req.originalUrl) => {
  return async (req, res, next) => {
    // We capture the end of the response to ensure we only log successful actions if needed
    // or just log the attempt. Here we log asynchronously.
    const originalSend = res.send;

    res.send = function (data) {
      res.send = originalSend;
      
      // We only log if it's a successful mutation (POST/PUT/PATCH/DELETE) or specific auth routes
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const userId = req.user?.id || null;
          const resource = typeof resourceFn === 'function' ? resourceFn(req) : resourceFn;
          const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

          // Don't await to avoid blocking the response
          db.query(
            `INSERT INTO audit_logs (user_id, action, resource, details, ip_address) VALUES ($1, $2, $3, $4, $5)`,
            [userId, action, resource, JSON.stringify(req.body || {}), ip]
          ).catch(err => console.error('Audit log error:', err));
        } catch (err) {
          console.error('Audit middleware error:', err);
        }
      }
      return res.send(data);
    };
    next();
  };
};

module.exports = { auditLog };
