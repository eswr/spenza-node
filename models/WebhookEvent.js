const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'WebhookSubscription', required: true },
  payload: { type: Object, required: true },
  status: { type: String, enum: ['pending', 'delivered', 'failed'], default: 'pending' },
  attempts: { type: Number, default: 0 },
  lastAttempt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('WebhookEvent', eventSchema);
