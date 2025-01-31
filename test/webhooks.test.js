const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const WebhookSubscription = require('../models/WebhookSubscription');

let authToken;
let mongoServer;

beforeAll(async () => {
  // Start MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Connect to the in-memory database
  await mongoose.connect(uri);

  // Create a test user
  await request(app)
    .post('/auth/signup')
    .send({ email: 'test@example.com', password: 'password123' });

  // Login the test user to obtain a JWT token
  const res = await request(app)
    .post('/auth/login')
    .send({ email: 'test@example.com', password: 'password123' });

  authToken = res.body.token;
});

afterAll(async () => {
  // Clean up the test database
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe('Webhook Subscription API', () => {
  it('should create a webhook subscription', async () => {
    const res = await request(app)
      .post('/subscriptions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        targetUrl: 'https://example.com/webhook',
        eventType: 'payment.received',
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body).toHaveProperty('targetUrl', 'https://example.com/webhook');
  });

  it('should list all webhook subscriptions', async () => {
    const res = await request(app)
      .get('/subscriptions')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
