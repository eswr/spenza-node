const boom = require('@hapi/boom');
const WebhookSubscription = require('../models/WebhookSubscription');
const crypto = require('crypto');

const verifyWebhookSignature = async (req, res, next) => {
  const signature = req.header('X-Webhook-Signature');
  const subscriptionId = req.header('X-Subscription-ID');

  if (!signature || !subscriptionId) {
    return next(boom.unauthorized('Missing authentication headers.'));
  }

  try {
    const subscription = await WebhookSubscription.findById(subscriptionId);

    if (!subscription) {
      return next(boom.notFound('Subscription not found.'));
    }

    if (!subscription.secret) {
      return next(boom.badRequest('No secret configured for this subscription.'));
    }

    const computedSignature = createSignature(req.body, subscription.secret);

    if (signature !== computedSignature) {
      return next(boom.unauthorized('Invalid signature.'));
    }

    req.subscription = subscription;
    next();
  } catch (err) {
    next(err);
  }
};

function createSignature(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
}

module.exports = verifyWebhookSignature;
