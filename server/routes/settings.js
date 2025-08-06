const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Settings = require('../models/Settings');
const { logger } = require('../utils/logger');

const router = express.Router();

// Validation middleware
const updateSettingValidation = [
  body('value').notEmpty().withMessage('Value is required'),
  body('description').optional().trim()
];

// Get all settings by category
router.get('/', [
  query('category').optional().isIn(['profit_margin', 'system', 'api', 'security', 'ui']).withMessage('Invalid category')
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

    const { category } = req.query;

    let settings;
    if (category) {
      settings = await Settings.getByCategory(category);
    } else {
      settings = await Settings.find({ isActive: true }).sort({ category: 1, key: 1 });
    }

    // Group settings by category
    const groupedSettings = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {});

    res.json({
      success: true,
      data: groupedSettings
    });

  } catch (error) {
    logger.error('Get settings error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get specific setting
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;

    const setting = await Settings.findOne({ key, isActive: true });
    if (!setting) {
      return res.status(404).json({ 
        success: false, 
        error: 'Setting not found' 
      });
    }

    res.json({
      success: true,
      data: setting
    });

  } catch (error) {
    logger.error('Get setting error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Update setting
router.put('/:key', updateSettingValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { key } = req.params;
    const { value, description } = req.body;

    // Validate profit margin settings
    if (key.includes('profit_margin') || key.includes('margin')) {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0 || numValue > 100) {
        return res.status(400).json({ 
          success: false, 
          error: 'Profit margin must be a number between 0 and 100' 
        });
      }
    }

    const setting = await Settings.setValue(
      key, 
      value, 
      'profit_margin', 
      description, 
      req.user.userId
    );

    logger.info(`Setting ${key} updated by ${req.user.email}: ${value}`);

    res.json({
      success: true,
      message: 'Setting updated successfully',
      data: setting
    });

  } catch (error) {
    logger.error('Update setting error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get profit margin settings specifically
router.get('/profit-margin/all', async (req, res) => {
  try {
    const profitMarginSettings = await Settings.getProfitMarginSettings();

    // Set defaults if not configured
    const defaultSettings = {
      default_profit_margin: parseFloat(process.env.DEFAULT_PROFIT_MARGIN) || 2.5,
      min_profit_margin: parseFloat(process.env.MIN_PROFIT_MARGIN) || 0.5,
      max_profit_margin: parseFloat(process.env.MAX_PROFIT_MARGIN) || 10.0,
      funding_profit_margin: 2.5,
      transaction_profit_margin: 1.5,
      ...profitMarginSettings
    };

    res.json({
      success: true,
      data: defaultSettings
    });

  } catch (error) {
    logger.error('Get profit margin settings error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Update profit margin settings
router.put('/profit-margin/bulk', [
  body('default_profit_margin').optional().isFloat({ min: 0, max: 100 }).withMessage('Default profit margin must be between 0 and 100'),
  body('min_profit_margin').optional().isFloat({ min: 0, max: 100 }).withMessage('Min profit margin must be between 0 and 100'),
  body('max_profit_margin').optional().isFloat({ min: 0, max: 100 }).withMessage('Max profit margin must be between 0 and 100'),
  body('funding_profit_margin').optional().isFloat({ min: 0, max: 100 }).withMessage('Funding profit margin must be between 0 and 100'),
  body('transaction_profit_margin').optional().isFloat({ min: 0, max: 100 }).withMessage('Transaction profit margin must be between 0 and 100')
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

    const updates = req.body;
    const updatedSettings = [];

    // Update each setting
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && value !== null) {
        const setting = await Settings.setValue(
          key,
          value,
          'profit_margin',
          `Profit margin setting for ${key}`,
          req.user.userId
        );
        updatedSettings.push(setting);
      }
    }

    logger.info(`Profit margin settings updated by ${req.user.email}:`, updates);

    res.json({
      success: true,
      message: 'Profit margin settings updated successfully',
      data: updatedSettings
    });

  } catch (error) {
    logger.error('Update profit margin settings error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Initialize default settings
router.post('/initialize', async (req, res) => {
  try {
    const defaultSettings = [
      {
        key: 'default_profit_margin',
        value: parseFloat(process.env.DEFAULT_PROFIT_MARGIN) || 2.5,
        category: 'profit_margin',
        description: 'Default profit margin percentage for all transactions'
      },
      {
        key: 'min_profit_margin',
        value: parseFloat(process.env.MIN_PROFIT_MARGIN) || 0.5,
        category: 'profit_margin',
        description: 'Minimum allowed profit margin percentage'
      },
      {
        key: 'max_profit_margin',
        value: parseFloat(process.env.MAX_PROFIT_MARGIN) || 10.0,
        category: 'profit_margin',
        description: 'Maximum allowed profit margin percentage'
      },
      {
        key: 'funding_profit_margin',
        value: 2.5,
        category: 'profit_margin',
        description: 'Profit margin percentage for card funding'
      },
      {
        key: 'transaction_profit_margin',
        value: 1.5,
        category: 'profit_margin',
        description: 'Profit margin percentage for regular transactions'
      },
      {
        key: 'system_name',
        value: 'UWeb3Bank Admin Dashboard',
        category: 'system',
        description: 'System display name'
      },
      {
        key: 'maintenance_mode',
        value: false,
        category: 'system',
        description: 'Enable maintenance mode'
      }
    ];

    const createdSettings = [];
    for (const setting of defaultSettings) {
      const existingSetting = await Settings.findOne({ key: setting.key });
      if (!existingSetting) {
        const newSetting = await Settings.setValue(
          setting.key,
          setting.value,
          setting.category,
          setting.description,
          req.user.userId
        );
        createdSettings.push(newSetting);
      }
    }

    logger.info(`Default settings initialized by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Default settings initialized successfully',
      data: createdSettings
    });

  } catch (error) {
    logger.error('Initialize settings error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Delete setting
router.delete('/:key', async (req, res) => {
  try {
    const { key } = req.params;

    const setting = await Settings.findOne({ key });
    if (!setting) {
      return res.status(404).json({ 
        success: false, 
        error: 'Setting not found' 
      });
    }

    // Soft delete by setting isActive to false
    setting.isActive = false;
    setting.updatedBy = req.user.userId;
    await setting.save();

    logger.info(`Setting ${key} deactivated by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Setting deactivated successfully'
    });

  } catch (error) {
    logger.error('Delete setting error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

module.exports = router; 