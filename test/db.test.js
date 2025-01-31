const mongoose = require('mongoose');
const { setupDB, teardownDB } = require('./setup');
const WebhookSubscription = require('../models/WebhookSubscription');

describe('Database Operations', () => {
  beforeAll(async () => await setupDB());
  afterAll(async () => await teardownDB());

  test('should create and retrieve subscription', async () => {
    const sub = await WebhookSubscription.create({
      user: new mongoose.Types.ObjectId(),
      targetUrl: 'https://test.com',
      eventType: 'test'
    });

    const found = await WebhookSubscription.findById(sub._id);
    expect(found.targetUrl).toBe('https://test.com');
  });
});
