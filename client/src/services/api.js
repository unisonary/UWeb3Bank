import axios from 'axios';

// Create axios instance
export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API functions
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  verify: () => api.get('/auth/verify'),
  changePassword: (passwords) => api.post('/auth/change-password', passwords),
  getProfile: () => api.get('/auth/profile'),
};

export const cardsAPI = {
  getAll: (params) => api.get('/cards', { params }),
  getById: (cardId) => api.get(`/cards/${cardId}`),
  create: (cardData) => api.post('/cards', cardData),
  update: (cardId, updateData) => api.patch(`/cards/${cardId}`, updateData),
  fund: (cardId, fundData) => api.post(`/cards/${cardId}/fund`, fundData),
  getTransactions: (cardId, params) => api.get(`/cards/${cardId}/transactions`, { params }),
  sync: (cardId) => api.post(`/cards/${cardId}/sync`),
};

export const transactionsAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (transactionId) => api.get(`/transactions/${transactionId}`),
  create: (transactionData) => api.post('/transactions', transactionData),
  update: (transactionId, updateData) => api.patch(`/transactions/${transactionId}`, updateData),
};

export const settingsAPI = {
  getAll: (params) => api.get('/settings', { params }),
  getByKey: (key) => api.get(`/settings/${key}`),
  update: (key, data) => api.put(`/settings/${key}`, data),
  getProfitMargins: () => api.get('/settings/profit-margin/all'),
  updateProfitMargins: (data) => api.put('/settings/profit-margin/bulk', data),
  initialize: () => api.post('/settings/initialize'),
  delete: (key) => api.delete(`/settings/${key}`),
};

export const dashboardAPI = {
  getOverview: () => api.get('/dashboard/overview'),
  getAnalytics: (params) => api.get('/dashboard/analytics', { params }),
  getProfitAnalysis: () => api.get('/dashboard/profit-analysis'),
  getSystemHealth: () => api.get('/dashboard/system-health'),
  getQuickActions: () => api.get('/dashboard/quick-actions'),
  export: (params) => api.get('/dashboard/export', { params }),
};

export default api; 