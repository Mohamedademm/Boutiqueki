/**
 * @boutiki/utils — Response Helpers
 * Standardized API response format for the BoutiqueKi platform.
 *
 * All API responses follow the shape:
 * {
 *   success: boolean,
 *   data?: any,
 *   message?: string,
 *   errors?: array,
 *   meta?: { page, limit, total, totalPages }
 * }
 */

/**
 * Create a standardized success response.
 * @param {import('express').Response} res
 * @param {object} options
 * @param {number} [options.statusCode=200] — HTTP status code
 * @param {string} [options.message] — Success message
 * @param {any} [options.data] — Response payload
 * @param {object} [options.meta] — Pagination metadata
 */
function createSuccessResponse(res, { statusCode = 200, message, data, meta } = {}) {
  const body = { success: true };

  if (message) body.message = message;
  if (data !== undefined) body.data = data;
  if (meta) body.meta = meta;

  return res.status(statusCode).json(body);
}

/**
 * Create a standardized error response.
 * @param {import('express').Response} res
 * @param {object} options
 * @param {number} [options.statusCode=500] — HTTP status code
 * @param {string} [options.message='Internal Server Error'] — Error message
 * @param {Array} [options.errors] — Detailed validation errors
 */
function createErrorResponse(res, { statusCode = 500, message = 'Internal Server Error', errors } = {}) {
  const body = {
    success: false,
    message,
  };

  if (errors) body.errors = errors;

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && errors) {
    body.debug = errors;
  }

  return res.status(statusCode).json(body);
}

module.exports = {
  createSuccessResponse,
  createErrorResponse,
};
