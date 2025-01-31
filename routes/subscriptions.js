const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const WebhookSubscription = require('../models/WebhookSubscription');
const { body, validationResult } = require('express-validator');
const boom = require('@hapi/boom');
const crypto = require('crypto');

router.post(
  '/',
  authenticate,
  [
    body('targetUrl').isURL().withMessage('A valid target URL is required.'),
    body('eventType').notEmpty().withMessage('Event type is required.'),
    body('secret').optional().isString(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(boom.badRequest(errors.array()));
    }

    const { targetUrl, eventType, secret } = req.body;

    try {
      const subscription = new WebhookSubscription({
        user: req.user.id,
        targetUrl,
        eventType,
        secret: secret || crypto.randomBytes(20).toString('hex'), // Generate if not provided
      });

      await subscription.save();
      res.status(201).json(subscription);
    } catch (err) {
      next(err);
    }
  }
);

router.get('/', authenticate, async (req, res, next) => {
  try {
    const subscriptions = await WebhookSubscription.find({ user: req.user.id });
    res.json(subscriptions);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const subscription = await WebhookSubscription.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { active: false },
      { new: true }
    );

    if (!subscription) {
      return next(boom.notFound('Subscription not found.'));
    }

    res.sendStatus(204);
    // res.status(200).json({ message: 'Subscription cancelled successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
