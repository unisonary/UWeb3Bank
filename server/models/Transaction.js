const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  cardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card',
    required: true
  },
  type: {
    type: String,
    enum: ['purchase', 'refund', 'funding', 'withdrawal', 'fee'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  description: {
    type: String,
    required: true
  },
  merchant: {
    name: String,
    category: String,
    location: String
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  // Profit margin tracking
  baseAmount: {
    type: Number,
    required: true
  },
  profitMargin: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  profitAmount: {
    type: Number,
    required: true,
    min: 0
  },
  // External API reference
  externalTransactionId: {
    type: String
  },
  externalReference: {
    type: String
  },
  // Metadata
  metadata: {
    type: Map,
    of: String
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ cardId: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ processedAt: -1 });
transactionSchema.index({ externalTransactionId: 1 });

// Virtual for total amount (base + profit)
transactionSchema.virtual('totalAmount').get(function() {
  return this.baseAmount + this.profitAmount;
});

// Virtual for profit percentage
transactionSchema.virtual('profitPercentage').get(function() {
  if (this.baseAmount === 0) return 0;
  return ((this.profitAmount / this.baseAmount) * 100).toFixed(2);
});

// Ensure virtual fields are serialized
transactionSchema.set('toJSON', { virtuals: true });
transactionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Transaction', transactionSchema); 