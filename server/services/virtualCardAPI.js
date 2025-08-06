const axios = require('axios');
const { logger } = require('../utils/logger');

class VirtualCardAPI {
  constructor() {
    this.baseURL = process.env.VIRTUAL_CARD_API_BASE_URL;
    this.apiKey = process.env.VIRTUAL_CARD_API_KEY;
    this.apiSecret = process.env.VIRTUAL_CARD_API_SECRET;
    
    // Create axios instance with default config
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'X-API-Secret': this.apiSecret
      }
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.info('Virtual Card API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          data: config.data ? '***' : undefined
        });
        return config;
      },
      (error) => {
        logger.error('Virtual Card API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.info('Virtual Card API Response:', {
          status: response.status,
          url: response.config.url
        });
        return response;
      },
      (error) => {
        logger.error('Virtual Card API Response Error:', {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  // Create a new virtual card
  async createCard(cardData) {
    try {
      const response = await this.client.post('/cards', {
        cardholder_name: cardData.cardholderName,
        currency: cardData.currency || 'USD',
        spending_controls: {
          spending_limit: cardData.spendingLimit,
          spending_limit_duration: cardData.spendingLimitDuration || 'per_transaction'
        },
        metadata: cardData.metadata || {}
      });

      return {
        success: true,
        data: response.data,
        cardId: response.data.id,
        cardNumber: response.data.card_number,
        expiryDate: response.data.expiry_date,
        cvv: response.data.cvv
      };
    } catch (error) {
      logger.error('Failed to create virtual card:', error);
      throw new Error(`Failed to create card: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get card details
  async getCard(cardId) {
    try {
      const response = await this.client.get(`/cards/${cardId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error(`Failed to get card ${cardId}:`, error);
      throw new Error(`Failed to get card: ${error.response?.data?.message || error.message}`);
    }
  }

  // Update card
  async updateCard(cardId, updateData) {
    try {
      const response = await this.client.patch(`/cards/${cardId}`, updateData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error(`Failed to update card ${cardId}:`, error);
      throw new Error(`Failed to update card: ${error.response?.data?.message || error.message}`);
    }
  }

  // Cancel/block card
  async cancelCard(cardId, reason = 'Admin request') {
    try {
      const response = await this.client.post(`/cards/${cardId}/cancel`, {
        reason: reason
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error(`Failed to cancel card ${cardId}:`, error);
      throw new Error(`Failed to cancel card: ${error.response?.data?.message || error.message}`);
    }
  }

  // Fund card
  async fundCard(cardId, amount, currency = 'USD') {
    try {
      const response = await this.client.post(`/cards/${cardId}/fund`, {
        amount: amount,
        currency: currency
      });
      return {
        success: true,
        data: response.data,
        transactionId: response.data.transaction_id
      };
    } catch (error) {
      logger.error(`Failed to fund card ${cardId}:`, error);
      throw new Error(`Failed to fund card: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get card transactions
  async getCardTransactions(cardId, params = {}) {
    try {
      const response = await this.client.get(`/cards/${cardId}/transactions`, {
        params: {
          limit: params.limit || 50,
          offset: params.offset || 0,
          start_date: params.startDate,
          end_date: params.endDate,
          status: params.status
        }
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error(`Failed to get transactions for card ${cardId}:`, error);
      throw new Error(`Failed to get transactions: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get all cards
  async getAllCards(params = {}) {
    try {
      const response = await this.client.get('/cards', {
        params: {
          limit: params.limit || 50,
          offset: params.offset || 0,
          status: params.status
        }
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Failed to get all cards:', error);
      throw new Error(`Failed to get cards: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get account balance
  async getAccountBalance() {
    try {
      const response = await this.client.get('/account/balance');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Failed to get account balance:', error);
      throw new Error(`Failed to get balance: ${error.response?.data?.message || error.message}`);
    }
  }

  // Test API connection
  async testConnection() {
    try {
      const response = await this.client.get('/health');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('API connection test failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
}

module.exports = new VirtualCardAPI(); 