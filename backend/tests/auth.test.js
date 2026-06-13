const request = require('supertest');
const app = require('../src/app');
const { db } = require('../src/utils');

// Mock db queries
jest.mock('../src/utils', () => {
  const originalModule = jest.requireActual('../src/utils');
  return {
    ...originalModule,
    db: {
      query: jest.fn(),
    },
  };
});

describe('Auth API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should return 400 if email is already in use', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: '123' }] }); // Simulate existing user

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'owner',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email already in use');
    });

    it('should register a new user successfully', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [] }) // User does not exist
        .mockResolvedValueOnce({ 
          rows: [{ id: '123', name: 'Test User', email: 'test@example.com', role: 'owner' }] 
        }) // Insert user
        .mockResolvedValueOnce({}); // Update refresh token

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'owner',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.data.email).toBe('test@example.com');
    });
  });
});
