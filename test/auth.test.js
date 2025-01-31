const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const { setupDB, teardownDB } = require('./setup');

describe('Authentication System', () => {
  beforeAll(async () => await setupDB());
  afterAll(async () => await teardownDB());

  test('POST /auth/signup - should create new user', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message', 'User created successfully.'); // Updated expectation
  });

  test('POST /auth/signup - should prevent duplicate users', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty('message', 'User already exists.'); // Optional: Check message
  });

  test('POST /auth/login - should return JWT token', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});
