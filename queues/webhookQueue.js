const Queue = require('bull');
const { processWebhook } = require('../services/webhookProcessor');
require('dotenv').config();

let webhookQueue;

// if (process.env.NODE_ENV !== 'test') {
  webhookQueue = new Queue('webhook-delivery', {
    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    },
    settings: {
      backoffStrategies: {
        exponential: (attemptsMade) => Math.min(attemptsMade ** 2 * 1000, 60000),
      },
    },
  });

  // Processor
  webhookQueue.process(async (job) => {
    const { eventId } = job.data;
    await processWebhook(eventId);
  });
// }

module.exports = webhookQueue;
