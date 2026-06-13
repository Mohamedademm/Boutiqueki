/**
 * @boutiki/utils — Config Module
 * Reads and validates environment variables at startup.
 * Fails fast if required variables are missing.
 */

/**
 * Required environment variables and their descriptions.
 */
const REQUIRED_VARS = {
  DATABASE_URL: 'PostgreSQL connection string (e.g. Neon.tech URL)',
  JWT_SECRET: 'Secret key for signing access tokens',
  JWT_REFRESH_SECRET: 'Secret key for signing refresh tokens',
};

/**
 * Optional environment variables with their default values.
 */
const DEFAULTS = {
  NODE_ENV: 'development',
  PORT: '3000',
  CLIENT_URL: 'http://localhost:5173',
  JWT_EXPIRE: '15m',
  JWT_REFRESH_EXPIRE: '7d',
  BCRYPT_ROUNDS: '12',
};

/**
 * Validate that all required environment variables are present.
 * Logs warnings for missing optional variables.
 * @throws {Error} If any required variable is missing.
 */
function validateEnv() {
  const missing = [];

  for (const [key, description] of Object.entries(REQUIRED_VARS)) {
    if (!process.env[key]) {
      missing.push(`  - ${key}: ${description}`);
    }
  }

  if (missing.length > 0) {
    const errorMsg = [
      '',
      '❌ Missing required environment variables:',
      ...missing,
      '',
      'Please set them in your .env file or environment.',
      '',
    ].join('\n');

    throw new Error(errorMsg);
  }

  // Apply defaults for optional vars
  for (const [key, defaultValue] of Object.entries(DEFAULTS)) {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
    }
  }
}

/**
 * Get the full configuration object (after validation).
 * @returns {object} Configuration object with all env vars
 */
function getConfig() {
  return {
    nodeEnv: process.env.NODE_ENV || DEFAULTS.NODE_ENV,
    port: parseInt(process.env.PORT || DEFAULTS.PORT, 10),
    clientUrl: process.env.CLIENT_URL || DEFAULTS.CLIENT_URL,
    databaseUrl: process.env.DATABASE_URL,
    jwt: {
      secret: process.env.JWT_SECRET,
      refreshSecret: process.env.JWT_REFRESH_SECRET,
      expire: process.env.JWT_EXPIRE || DEFAULTS.JWT_EXPIRE,
      refreshExpire: process.env.JWT_REFRESH_EXPIRE || DEFAULTS.JWT_REFRESH_EXPIRE,
    },
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || DEFAULTS.BCRYPT_ROUNDS, 10),
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    isDev: (process.env.NODE_ENV || DEFAULTS.NODE_ENV) === 'development',
    isProd: process.env.NODE_ENV === 'production',
  };
}

module.exports = {
  validateEnv,
  getConfig,
  REQUIRED_VARS,
  DEFAULTS,
};
