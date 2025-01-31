const request = require('supertest');
const app = require('../app');
const WebhookSubscription = require('../models/WebhookSubscription');
const { setupDB, teardownDB } = require('./setup');

let authToken;

describe('Webhook Subscription API', () => {
  beforeAll(async () => {
    await setupDB();
    // Create test user and get token
    await request(app)
      .post('/auth/signup')
      .send({ email: 'test@example.com', password: 'password123' });

    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    authToken = loginRes.body.token;
  });

  afterAll(async () => await teardownDB());

  test('POST /subscriptions - should create webhook subscription', async () => {
    const res = await request(app)
      .post('/subscriptions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        targetUrl: 'https://example.com/webhook',
        eventType: 'payment.received'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.targetUrl).toBe('https://example.com/webhook');
  });

  test('POST /subscriptions - should validate input', async () => {
    const res = await request(app)
      .post('/subscriptions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ targetUrl: 'invalid-url', eventType: '' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  test('GET /subscriptions - should list user subscriptions', async () => {
    const res = await request(app)
      .get('/subscriptions')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('DELETE /subscriptions/:id - should cancel subscription', async () => {
    const sub = await WebhookSubscription.findOne();
    const res = await request(app)
      .delete(`/subscriptions/${sub._id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(204);
  });
});
