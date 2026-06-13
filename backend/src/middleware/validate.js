const { createErrorResponse } = require('../utils');

module.exports = function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return createErrorResponse(res, {
        statusCode: 400,
        message: 'Validation failed',
        errors: result.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    req.body = result.data; // Données validées et nettoyées
    next();
  };
};
