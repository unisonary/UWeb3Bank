const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  cardId: {
    type: String,
    required: true,
    unique: true
  },
  cardNumber: {
    type: String,
    required: true,
    unique: true
  },
  cardholderName: {
    type: String,
    required: true
  },
  expiryDate: {
    type: String,
    required: true
  },
  cvv: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked', 'expired'],
    default: 'active'
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  cardType: {
    type: String,
    enum: ['virtual', 'physical'],
    default: 'virtual'
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  lastUsed: {
    type: Date
  },
  metadata: {
    type: Map,
    of: String
  },
  tags: [{
    type: String
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
cardSchema.index({ cardId: 1 });
cardSchema.index({ cardNumber: 1 });
cardSchema.index({ status: 1 });
cardSchema.index({ issuedBy: 1 });
cardSchema.index({ issuedAt: -1 });

// Virtual for masked card number
cardSchema.virtual('maskedCardNumber').get(function() {
  if (!this.cardNumber) return '';
  return `****-****-****-${this.cardNumber.slice(-4)}`;
});

// Ensure virtual fields are serialized
cardSchema.set('toJSON', { virtuals: true });
cardSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Card', cardSchema); 