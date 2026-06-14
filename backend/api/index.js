// Vercel serverless entry — exposes the Express app as the request handler.
require('dotenv').config();
module.exports = require('../src/app');
