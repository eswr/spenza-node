const express = require('express');
const router = express.Router();
const WebhookEvent = require('../models/WebhookEvent');
const webhookQueue = require('../queues/webhookQueue');
const boom = require('@hapi/boom');
const verifyWebhookSignature = require('../middleware/webhookAuth');

router.post('/', verifyWebhookSignature, async (req, res, next) => {
  try {
    const { subscription } = req; // Added by verifyWebhookSignature middleware

    if (!subscription.active) {
      return next(boom.badRequest('Subscription is inactive.'));
    }

    const event = new WebhookEvent({
      subscription: subscription._id,
      payload: req.body,
    });

    await event.save();

    // Add job to the queue with retry configuration
    await webhookQueue.add(
      { eventId: event._id },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
      }
    );

    res.status(202).json({ message: 'Webhook received and is being processed.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
