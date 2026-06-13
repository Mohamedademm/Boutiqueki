// Shared test environment — ensures secrets exist for all test files (no real DB needed).
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';
process.env.BCRYPT_ROUNDS = process.env.BCRYPT_ROUNDS || '4'; // faster hashing in tests
