const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  category: {
    type: String,
    enum: ['profit_margin', 'system', 'api', 'security', 'ui'],
    required: true
  },
  description: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
settingsSchema.index({ key: 1 });
settingsSchema.index({ category: 1 });

// Static method to get setting value
settingsSchema.statics.getValue = async function(key, defaultValue = null) {
  const setting = await this.findOne({ key, isActive: true });
  return setting ? setting.value : defaultValue;
};

// Static method to set setting value
settingsSchema.statics.setValue = async function(key, value, category = 'system', description = '', userId = null) {
  const updateData = {
    value,
    category,
    description,
    updatedBy: userId
  };

  return await this.findOneAndUpdate(
    { key },
    updateData,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

// Static method to get all settings by category
settingsSchema.statics.getByCategory = async function(category) {
  return await this.find({ category, isActive: true }).sort({ key: 1 });
};

// Static method to get profit margin settings
settingsSchema.statics.getProfitMarginSettings = async function() {
  const settings = await this.find({ 
    category: 'profit_margin', 
    isActive: true 
  });
  
  const profitMarginSettings = {};
  settings.forEach(setting => {
    profitMarginSettings[setting.key] = setting.value;
  });
  
  return profitMarginSettings;
};

module.exports = mongoose.model('Settings', settingsSchema); 