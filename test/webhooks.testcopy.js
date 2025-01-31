const request = require('supertest');
const nock = require('nock');
const app = require('../app');
const WebhookSubscription = require('../models/WebhookSubscription');
const WebhookEvent = require('../models/WebhookEvent');
const { setupDB, teardownDB } = require('./setup');

describe('Webhook Event Handling', () => {
  let subscription;
  let secret = 'test-secret';

  beforeAll(async () => {
    await setupDB();
    // Create test subscription
    subscription = await WebhookSubscription.create({
      user: new mongoose.Types.ObjectId(),
      targetUrl: 'https://example.com/webhook',
      eventType: 'test.event',
      secret
    });
  });

  afterAll(async () => await teardownDB());

  test('POST /webhooks - should store incoming event', async () => {
    const payload = { event: 'test' };
    const signature = createSignature(payload, secret);

    const res = await request(app)
      .post('/webhooks')
      .set('X-Subscription-ID', subscription._id)
      .set('X-Webhook-Signature', signature)
      .send(payload);

    expect(res.statusCode).toBe(202);

    const event = await WebhookEvent.findOne();
    expect(event).toBeTruthy();
    expect(event.status).toBe('pending');
  });

  test('POST /webhooks - should handle invalid signature', async () => {
    const res = await request(app)
      .post('/webhooks')
      .set('X-Subscription-ID', subscription._id)
      .set('X-Webhook-Signature', 'invalid')
      .send({ event: 'test' });

    expect(res.statusCode).toBe(401);
  });

  test('Webhook retry mechanism - should retry failed deliveries', async () => {
    // Mock external service to fail first 2 times
    const scope = nock('https://example.com')
      .post('/webhook')
      .reply(500)
      .post('/webhook')
      .reply(500)
      .post('/webhook')
      .reply(200);

    const event = await WebhookEvent.create({
      subscription: subscription._id,
      payload: { test: true }
    });

    // Trigger processing (you'd need to export your queue processor)
    await processWebhook(event._id);

    const updatedEvent = await WebhookEvent.findById(event._id);
    expect(updatedEvent.attempts).toBe(3);
    expect(updatedEvent.status).toBe('failed');
  });
});

function createSignature(payload, secret) {
  return require('crypto')
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
}
