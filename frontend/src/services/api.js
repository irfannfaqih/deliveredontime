// frontend/src/services/api.js
import axios from 'axios';

// Base API configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor untuk menambahkan token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token'); // Sesuaikan dengan backend JWT
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor untuk handle error
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      const url = String(error.config?.url || '');
      const isAuthLogin = url.includes('/auth/login');
      const isOnLoginPage = typeof window !== 'undefined' && window.location?.pathname === '/login';
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      if (!isAuthLogin && !isOnLoginPage) {
        window.location.href = '/login';
      }
    }
    
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access denied:', error.response.data.message);
    }
    
    // Handle 429 Too Many Requests
    if (error.response?.status === 429) {
      console.warn('Rate limit exceeded, please try again later');
    }
    
    return Promise.reject(error);
  }
);

// ============================================
// AUTHENTICATION SERVICES
// ============================================

export const authAPI = {
  // Login user
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { data } = response.data;
      
      if (data.tokens) {
        localStorage.setItem('access_token', data.tokens.access);
        localStorage.setItem('refresh_token', data.tokens.refresh);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Register user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  createUser: async (userData) => {
    try {
      const response = await api.post('/auth/admin/create-user', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Admin: list users
  listUsers: async () => {
    try {
      const response = await api.get('/auth/admin/users');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // List messenger users (for all authenticated roles)
  listMessengers: async () => {
    try {
      const response = await api.get('/auth/messengers');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Admin: update user
  updateUser: async (id, payload) => {
    try {
      const response = await api.put(`/auth/admin/users/${id}`, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Admin: reset user password
  resetUserPassword: async (id, newPassword) => {
    try {
      const response = await api.post(`/auth/admin/users/${id}/reset-password`, { password: newPassword });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Admin: delete user
  deleteUser: async (id) => {
    try {
      const response = await api.delete(`/auth/admin/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await api.post('/auth/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },

  // Refresh token
  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) throw new Error('No refresh token available');
      
      const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
      const { data } = response.data;
      
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
      }
      
      return response.data;
    } catch (error) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      throw error.response?.data || error.message;
    }
  }
};

// ============================================
// CUSTOMER SERVICES
// ============================================

export const customerAPI = {
  // Get all customers with pagination and filters
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/customers', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get customer by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/customers/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create new customer
  create: async (customerData) => {
    try {
      const response = await api.post('/customers', customerData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update customer
  update: async (id, customerData) => {
    try {
      const response = await api.put(`/customers/${id}`, customerData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete customer
  delete: async (id) => {
    try {
      const response = await api.delete(`/customers/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

// ============================================
// DELIVERED SERVICES
// ============================================

export const deliveredAPI = {
  // Get all deliveries
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/delivered', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get delivery by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/delivered/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create delivery record
  create: async (deliveryData) => {
    try {
      const response = await api.post('/delivered', deliveryData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update delivery record
  update: async (id, deliveryData) => {
    try {
      const response = await api.put(`/delivered/${id}`, deliveryData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete delivery record
  delete: async (id) => {
    try {
      const response = await api.delete(`/delivered/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get delivery statistics
  getStats: async (params = {}) => {
    try {
      const response = await api.get('/delivered/stats', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get delivery reports by date
  getByDate: async (date) => {
    try {
      const response = await api.get('/delivered', {
        params: { date }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

// ============================================
// BBM SERVICES
// ============================================

export const bbmAPI = {
  // Get all BBM records
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/bbm', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get BBM by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/bbm/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create BBM record
  create: async (bbmData) => {
    try {
      const response = await api.post('/bbm', bbmData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update BBM record
  update: async (id, bbmData) => {
    try {
      const response = await api.put(`/bbm/${id}`, bbmData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete BBM record
  delete: async (id) => {
    try {
      const response = await api.delete(`/bbm/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get BBM statistics
  getStats: async (params = {}) => {
    try {
      const response = await api.get('/bbm/stats', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

// ============================================
// REPORT SERVICES
// ============================================

export const reportAPI = {
  // Generate report
  generate: async (reportConfig) => {
    try {
      const response = await api.post('/reports/generate', reportConfig);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get available reports
  getAll: async () => {
    try {
      const response = await api.get('/reports');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Download report
  download: async (filename) => {
    try {
      const response = await api.get(`/reports/${filename}`, {
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get daily summary
  getDailySummary: async (date) => {
    try {
      const response = await api.get('/reports/daily-summary', {
        params: { date }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

// ============================================
// FILE UPLOAD SERVICES
// ============================================

export const fileAPI = {
  // Upload single file
  upload: async (file, category = 'document', extra = {}) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      Object.entries(extra || {}).forEach(([k, v]) => {
        if (v !== undefined && v !== null) formData.append(k, v);
      });

      // Gunakan axios langsung dengan config khusus untuk upload
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/upload`,
        formData,
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            // Jangan set Content-Type, biarkan browser yang handle
          },
          timeout: 30000
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  },

  // Get file info
  getById: async (id) => {
    try {
      const response = await api.get(`/files/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete file
  delete: async (id) => {
    try {
      const response = await api.delete(`/files/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all files
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/files', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

// ============================================
// HEALTH & SYSTEM SERVICES
// ============================================

export const systemAPI = {
  // Health check
  health: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // API info
  info: async () => {
    try {
      const response = await api.get('/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Test connection
  test: async () => {
    try {
      const response = await api.get('/test');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('access_token');
};

// Get current user from localStorage
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Clear authentication data
export const clearAuth = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

// Format error message
export const formatError = (error) => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error) return error.error;
  if (error?.details) return error.details;
  return 'An unexpected error occurred';
};

// Handle API errors consistently
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error?.errors) {
    // Validation errors
    return error.errors.map(err => err.message).join(', ');
  }
  
  return formatError(error);
};

// Export default api instance
export default api;