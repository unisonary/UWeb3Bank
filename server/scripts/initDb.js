const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Settings = require('../models/Settings');
const { logger } = require('../utils/logger');

const initializeDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info('Connected to MongoDB');

    // Check if admin user exists
    const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL });
    
    if (!existingAdmin) {
      // Create admin user
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
      
      const adminUser = new User({
        email: process.env.ADMIN_EMAIL,
        password: hashedPassword,
        role: 'super_admin',
        isActive: true
      });

      await adminUser.save();
      logger.info('Admin user created successfully');
    } else {
      logger.info('Admin user already exists');
    }

    // Initialize default settings
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

    for (const setting of defaultSettings) {
      const existingSetting = await Settings.findOne({ key: setting.key });
      if (!existingSetting) {
        await Settings.setValue(
          setting.key,
          setting.value,
          setting.category,
          setting.description
        );
        logger.info(`Setting ${setting.key} initialized`);
      }
    }

    logger.info('Database initialization completed successfully');
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
    
    process.exit(0);
  } catch (error) {
    logger.error('Database initialization failed:', error);
    process.exit(1);
  }
};

// Run initialization if this script is executed directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase }; 