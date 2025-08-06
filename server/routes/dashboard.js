const express = require('express');
const { query, validationResult } = require('express-validator');
const Card = require('../models/Card');
const Transaction = require('../models/Transaction');
const Settings = require('../models/Settings');
const virtualCardAPI = require('../services/virtualCardAPI');
const { logger } = require('../utils/logger');

const router = express.Router();

// Get dashboard overview statistics
router.get('/overview', async (req, res) => {
  try {
    // Get basic counts
    const totalCards = await Card.countDocuments();
    const activeCards = await Card.countDocuments({ status: 'active' });
    const blockedCards = await Card.countDocuments({ status: 'blocked' });
    const totalTransactions = await Transaction.countDocuments();

    // Get total balances
    const balanceResult = await Card.aggregate([
      { $group: { _id: null, totalBalance: { $sum: '$balance' } } }
    ]);
    const totalBalance = balanceResult.length > 0 ? balanceResult[0].totalBalance : 0;

    // Get profit statistics
    const profitResult = await Transaction.aggregate([
      { $group: { _id: null, totalProfit: { $sum: '$profitAmount' } } }
    ]);
    const totalProfit = profitResult.length > 0 ? profitResult[0].totalProfit : 0;

    // Get recent activity
    const recentTransactions = await Transaction.find()
      .populate('cardId', 'cardholderName cardNumber')
      .populate('processedBy', 'email')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get cards by status
    const cardsByStatus = await Card.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get transactions by type
    const transactionsByType = await Transaction.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalCards,
          activeCards,
          blockedCards,
          totalTransactions,
          totalBalance,
          totalProfit
        },
        recentActivity: recentTransactions,
        cardsByStatus,
        transactionsByType
      }
    });

  } catch (error) {
    logger.error('Dashboard overview error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get analytics data with date range
router.get('/analytics', [
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO date'),
  query('groupBy').optional().isIn(['day', 'week', 'month']).withMessage('Group by must be day, week, or month')
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

    const { startDate, endDate, groupBy = 'day' } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get transaction analytics
    const transactionAnalytics = await Transaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupBy === 'day' ? '%Y-%m-%d' : groupBy === 'week' ? '%Y-%U' : '%Y-%m',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalProfit: { $sum: '$profitAmount' },
          avgProfitMargin: { $avg: '$profitMargin' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get card creation analytics
    const cardAnalytics = await Card.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupBy === 'day' ? '%Y-%m-%d' : groupBy === 'week' ? '%Y-%U' : '%Y-%m',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        transactionAnalytics,
        cardAnalytics,
        filters: { startDate, endDate, groupBy }
      }
    });

  } catch (error) {
    logger.error('Dashboard analytics error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get profit margin analysis
router.get('/profit-analysis', async (req, res) => {
  try {
    // Get profit margin settings
    const profitMarginSettings = await Settings.getProfitMarginSettings();

    // Get profit statistics by transaction type
    const profitByType = await Transaction.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalProfit: { $sum: '$profitAmount' },
          avgProfitMargin: { $avg: '$profitMargin' },
          minProfitMargin: { $min: '$profitMargin' },
          maxProfitMargin: { $max: '$profitMargin' }
        }
      }
    ]);

    // Get profit trend over time
    const profitTrend = await Transaction.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$createdAt' }
          },
          totalProfit: { $sum: '$profitAmount' },
          avgProfitMargin: { $avg: '$profitMargin' }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 12 } // Last 12 months
    ]);

    // Get top profitable cards
    const topProfitableCards = await Transaction.aggregate([
      {
        $group: {
          _id: '$cardId',
          totalProfit: { $sum: '$profitAmount' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalProfit: -1 } },
      { $limit: 10 }
    ]);

    // Populate card details for top profitable cards
    const topCardsWithDetails = await Transaction.populate(topProfitableCards, {
      path: '_id',
      select: 'cardholderName cardNumber status'
    });

    res.json({
      success: true,
      data: {
        profitMarginSettings,
        profitByType,
        profitTrend,
        topProfitableCards: topCardsWithDetails
      }
    });

  } catch (error) {
    logger.error('Profit analysis error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get system health and API status
router.get('/system-health', async (req, res) => {
  try {
    // Test external API connection
    const apiStatus = await virtualCardAPI.testConnection();

    // Get database status
    const dbStatus = {
      connected: true,
      collections: {
        cards: await Card.countDocuments(),
        transactions: await Transaction.countDocuments(),
        settings: await Settings.countDocuments()
      }
    };

    // Get system uptime
    const uptime = process.uptime();

    // Get memory usage
    const memoryUsage = process.memoryUsage();

    res.json({
      success: true,
      data: {
        api: apiStatus,
        database: dbStatus,
        system: {
          uptime,
          memoryUsage,
          nodeVersion: process.version,
          environment: process.env.NODE_ENV
        }
      }
    });

  } catch (error) {
    logger.error('System health check error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get quick actions data
router.get('/quick-actions', async (req, res) => {
  try {
    // Get cards that need attention
    const cardsNeedingAttention = await Card.find({
      $or: [
        { status: 'blocked' },
        { balance: { $lt: 10 } }, // Low balance
        { lastUsed: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } // Inactive for 30 days
      ]
    }).limit(5);

    // Get recent failed transactions
    const failedTransactions = await Transaction.find({ status: 'failed' })
      .populate('cardId', 'cardholderName cardNumber')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get pending transactions
    const pendingTransactions = await Transaction.find({ status: 'pending' })
      .populate('cardId', 'cardholderName cardNumber')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        cardsNeedingAttention,
        failedTransactions,
        pendingTransactions
      }
    });

  } catch (error) {
    logger.error('Quick actions error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get export data for reports
router.get('/export', [
  query('type').isIn(['cards', 'transactions', 'analytics']).withMessage('Export type must be cards, transactions, or analytics'),
  query('format').optional().isIn(['json', 'csv']).withMessage('Format must be json or csv'),
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO date')
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

    const { type, format = 'json', startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    let data;
    let filename;

    switch (type) {
      case 'cards':
        data = await Card.find(dateFilter).populate('issuedBy', 'email');
        filename = `cards-export-${new Date().toISOString().split('T')[0]}`;
        break;
      
      case 'transactions':
        data = await Transaction.find(dateFilter)
          .populate('cardId', 'cardholderName cardNumber')
          .populate('processedBy', 'email');
        filename = `transactions-export-${new Date().toISOString().split('T')[0]}`;
        break;
      
      case 'analytics':
        data = await Transaction.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
              },
              count: { $sum: 1 },
              totalAmount: { $sum: '$amount' },
              totalProfit: { $sum: '$profitAmount' }
            }
          },
          { $sort: { _id: 1 } }
        ]);
        filename = `analytics-export-${new Date().toISOString().split('T')[0]}`;
        break;
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csvData);
    } else {
      res.json({
        success: true,
        data,
        filename: `${filename}.json`
      });
    }

  } catch (error) {
    logger.error('Export error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Helper function to convert data to CSV
function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

module.exports = router; 