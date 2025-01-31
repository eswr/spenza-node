const axios = require('axios');
const WebhookEvent = require('../models/WebhookEvent');
const boom = require('@hapi/boom');
const crypto = require('crypto');

exports.processWebhook = async (eventId) => {
  const event = await WebhookEvent.findById(eventId).populate('subscription');

  if (!event) {
    throw boom.notFound('Webhook event not found.');
  }

  try {
    // Create signature if secret is provided
    const signature = event.subscription.secret
      ? createSignature(event.payload, event.subscription.secret)
      : null;

    const headers = signature
      ? { 'X-Webhook-Signature': signature }
      : {};

    await axios.post(event.subscription.targetUrl, event.payload, { headers });

    event.status = 'delivered';
  } catch (err) {
    event.attempts += 1;
    event.status = event.attempts >= 3 ? 'failed' : 'pending';
    if (event.attempts < 3) {
      throw new Error('Retrying webhook delivery.');
    }
  } finally {
    event.lastAttempt = new Date();
    await event.save();
  }
};

function createSignature(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
}
