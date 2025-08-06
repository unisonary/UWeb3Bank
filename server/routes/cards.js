const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Card = require('../models/Card');
const Transaction = require('../models/Transaction');
const Settings = require('../models/Settings');
const virtualCardAPI = require('../services/virtualCardAPI');
const { logger } = require('../utils/logger');

const router = express.Router();

// Validation middleware
const createCardValidation = [
  body('cardholderName').trim().isLength({ min: 1 }).withMessage('Cardholder name is required'),
  body('currency').optional().isIn(['USD', 'EUR', 'GBP']).withMessage('Invalid currency'),
  body('spendingLimit').optional().isNumeric().withMessage('Spending limit must be a number'),
  body('tags').optional().isArray().withMessage('Tags must be an array')
];

const fundCardValidation = [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('currency').optional().isIn(['USD', 'EUR', 'GBP']).withMessage('Invalid currency')
];

// Get all cards with pagination and filtering
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['active', 'inactive', 'blocked', 'expired']).withMessage('Invalid status'),
  query('search').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { cardholderName: { $regex: req.query.search, $options: 'i' } },
        { cardNumber: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Get cards with pagination
    const cards = await Card.find(filter)
      .populate('issuedBy', 'email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await Card.countDocuments(filter);

    res.json({
      success: true,
      data: cards,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Get cards error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Create new virtual card
router.post('/', createCardValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { cardholderName, currency = 'USD', spendingLimit, tags = [] } = req.body;

    // Get current profit margin settings
    const profitMarginSettings = await Settings.getProfitMarginSettings();
    const defaultProfitMargin = profitMarginSettings.default_profit_margin || parseFloat(process.env.DEFAULT_PROFIT_MARGIN) || 2.5;

    // Create card via external API
    const apiResult = await virtualCardAPI.createCard({
      cardholderName,
      currency,
      spendingLimit,
      metadata: { tags: tags.join(',') }
    });

    if (!apiResult.success) {
      throw new Error(apiResult.error || 'Failed to create card via API');
    }

    // Save card to database
    const card = new Card({
      cardId: apiResult.cardId,
      cardNumber: apiResult.cardNumber,
      cardholderName,
      expiryDate: apiResult.expiryDate,
      cvv: apiResult.cvv,
      currency,
      issuedBy: req.user.userId,
      tags
    });

    await card.save();

    logger.info(`Card created by ${req.user.email}: ${card.cardId}`);

    res.status(201).json({
      success: true,
      message: 'Card created successfully',
      data: card
    });

  } catch (error) {
    logger.error('Create card error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

// Get specific card details
router.get('/:cardId', async (req, res) => {
  try {
    const { cardId } = req.params;

    const card = await Card.findOne({ cardId })
      .populate('issuedBy', 'email');

    if (!card) {
      return res.status(404).json({ 
        success: false, 
        error: 'Card not found' 
      });
    }

    // Get recent transactions for this card
    const transactions = await Transaction.find({ cardId: card._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        card,
        recentTransactions: transactions
      }
    });

  } catch (error) {
    logger.error('Get card error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Update card
router.patch('/:cardId', [
  body('status').optional().isIn(['active', 'inactive', 'blocked']).withMessage('Invalid status'),
  body('tags').optional().isArray().withMessage('Tags must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { cardId } = req.params;
    const { status, tags } = req.body;

    const card = await Card.findOne({ cardId });
    if (!card) {
      return res.status(404).json({ 
        success: false, 
        error: 'Card not found' 
      });
    }

    // Update via external API if status is changing
    if (status && status !== card.status) {
      if (status === 'blocked') {
        await virtualCardAPI.cancelCard(cardId, 'Admin request');
      } else if (status === 'active' && card.status === 'blocked') {
        // Note: Some APIs may not support reactivating cancelled cards
        await virtualCardAPI.updateCard(cardId, { status: 'active' });
      }
    }

    // Update local database
    const updateData = {};
    if (status) updateData.status = status;
    if (tags) updateData.tags = tags;

    const updatedCard = await Card.findOneAndUpdate(
      { cardId },
      updateData,
      { new: true }
    ).populate('issuedBy', 'email');

    logger.info(`Card ${cardId} updated by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Card updated successfully',
      data: updatedCard
    });

  } catch (error) {
    logger.error('Update card error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

// Fund card
router.post('/:cardId/fund', fundCardValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { cardId } = req.params;
    const { amount, currency = 'USD' } = req.body;

    const card = await Card.findOne({ cardId });
    if (!card) {
      return res.status(404).json({ 
        success: false, 
        error: 'Card not found' 
      });
    }

    // Get profit margin settings
    const profitMarginSettings = await Settings.getProfitMarginSettings();
    const profitMargin = profitMarginSettings.funding_profit_margin || parseFloat(process.env.DEFAULT_PROFIT_MARGIN) || 2.5;

    // Calculate profit
    const profitAmount = (amount * profitMargin) / 100;
    const totalAmount = amount + profitAmount;

    // Fund card via external API
    const apiResult = await virtualCardAPI.fundCard(cardId, totalAmount, currency);

    if (!apiResult.success) {
      throw new Error(apiResult.error || 'Failed to fund card via API');
    }

    // Create transaction record
    const transaction = new Transaction({
      transactionId: apiResult.transactionId,
      cardId: card._id,
      type: 'funding',
      amount: totalAmount,
      baseAmount: amount,
      profitMargin,
      profitAmount,
      currency,
      description: `Card funding - ${currency} ${amount}`,
      status: 'completed',
      externalTransactionId: apiResult.transactionId,
      processedBy: req.user.userId
    });

    await transaction.save();

    // Update card balance
    card.balance += totalAmount;
    card.lastUsed = new Date();
    await card.save();

    logger.info(`Card ${cardId} funded by ${req.user.email}: ${currency} ${totalAmount}`);

    res.json({
      success: true,
      message: 'Card funded successfully',
      data: {
        transaction,
        newBalance: card.balance
      }
    });

  } catch (error) {
    logger.error('Fund card error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

// Get card transactions
router.get('/:cardId/transactions', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['purchase', 'refund', 'funding', 'withdrawal', 'fee']).withMessage('Invalid transaction type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { cardId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const card = await Card.findOne({ cardId });
    if (!card) {
      return res.status(404).json({ 
        success: false, 
        error: 'Card not found' 
      });
    }

    // Build filter
    const filter = { cardId: card._id };
    if (req.query.type) filter.type = req.query.type;

    // Get transactions
    const transactions = await Transaction.find(filter)
      .populate('processedBy', 'email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await Transaction.countDocuments(filter);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Get card transactions error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Sync card with external API
router.post('/:cardId/sync', async (req, res) => {
  try {
    const { cardId } = req.params;

    const card = await Card.findOne({ cardId });
    if (!card) {
      return res.status(404).json({ 
        success: false, 
        error: 'Card not found' 
      });
    }

    // Get latest data from external API
    const apiResult = await virtualCardAPI.getCard(cardId);
    
    if (!apiResult.success) {
      throw new Error(apiResult.error || 'Failed to sync card via API');
    }

    // Update local card data
    const apiData = apiResult.data;
    card.balance = apiData.balance || card.balance;
    card.status = apiData.status || card.status;
    card.lastUsed = apiData.last_used ? new Date(apiData.last_used) : card.lastUsed;
    
    await card.save();

    logger.info(`Card ${cardId} synced by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Card synced successfully',
      data: card
    });

  } catch (error) {
    logger.error('Sync card error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

module.exports = router; 