// frontend/src/hooks/useAPI.js
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    authAPI,
    bbmAPI,
    customerAPI,
    deliveredAPI,
    fileAPI,
    handleApiError
} from '../services/api';

// ============================================
// AUTHENTICATION HOOK
// ============================================

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const storedUserRaw = localStorage.getItem('user');
      if (storedUserRaw) {
        const storedUser = JSON.parse(storedUserRaw);
        let nextUser = storedUser;
        const response = await authAPI.getProfile().catch(() => null);
        const profile = response?.data;
        if (profile) {
          nextUser = profile.user ? profile.user : profile;
          localStorage.setItem('user', JSON.stringify(nextUser));
        }
        setUser(nextUser);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  };

  // Melakukan autentikasi dan mengelola state user saat berhasil/gagal
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authAPI.login(email, password);
      const data = response?.data;
      
      // Jika API mengembalikan user, anggap autentikasi berhasil
      if (data?.user) {
        setUser(data.user);
        return { success: true, user: data.user };
      }
      
      // Jika autentikasi gagal, kembalikan pesan error tanpa melempar exception
      const errorMessage = 'Username atau password salah';
      setError(errorMessage);
      return { success: false, error: errorMessage };
      
    } catch (error) {
      // Tangani error dari API dan konversi ke pesan yang bisa ditampilkan
      console.error('Login error caught:', error);
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setIsLoading(true);
      await authAPI.updateProfile(profileData);
      await checkAuthStatus();
      return { success: true };
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isLoading,
    error,
    login,
    logout,
    updateProfile,
    isAuthenticated: !!user
  };
};

// ============================================
// DATA FETCHING HOOK
// ============================================

export const useAPIData = (apiFunction) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const fnRef = useRef(apiFunction);

  useEffect(() => {
    fnRef.current = apiFunction;
  }, [apiFunction]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fnRef.current();
      const next = response?.data ?? response;
      setData(next);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = () => {
    fetchData();
  };

  return {
    data,
    isLoading,
    error,
    refetch
  };
};

// ============================================
// CUSTOMERS HOOK
// ============================================

export const useCustomers = (filters = {}) => {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const filtersRef = useRef(filters);
  const depKey = JSON.stringify(filters);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await customerAPI.getAll(filtersRef.current);
      const data = response?.data ?? response;
      setCustomers(data.data || data.customers || data);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [depKey, fetchCustomers]);

  const createCustomer = async (customerData) => {
    try {
      const response = await customerAPI.create(customerData);
      await fetchCustomers();
      return { success: true, data: response?.data ?? response };
    } catch (error) {
      const errorMessage = handleApiError(error);
      return { success: false, error: errorMessage };
    }
  };

  const updateCustomer = async (id, customerData) => {
    try {
      const response = await customerAPI.update(id, customerData);
      await fetchCustomers();
      return { success: true, data: response?.data ?? response };
    } catch (error) {
      const errorMessage = handleApiError(error);
      return { success: false, error: errorMessage };
    }
  };

  const deleteCustomer = async (id) => {
    try {
      await customerAPI.delete(id);
      await fetchCustomers();
      return { success: true };
    } catch (error) {
      const errorMessage = handleApiError(error);
      return { success: false, error: errorMessage };
    }
  };

  return {
    customers,
    isLoading,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    refetch: fetchCustomers
  };
};

// ============================================
// DELIVERIES HOOK
// ============================================

export const useDeliveries = (filters = {}) => {
  const [deliveries, setDeliveries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const filtersRef = useRef(filters);
  const depKey = JSON.stringify(filters);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const fetchDeliveries = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await deliveredAPI.getAll(filtersRef.current);
      const data = response?.data ?? response;
      setDeliveries(data.data || data.deliveries || data);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
  }, [depKey, fetchDeliveries]);

  const createDelivery = async (deliveryData) => {
    try {
      const response = await deliveredAPI.create(deliveryData);
      await fetchDeliveries();
      return { success: true, data: response?.data ?? response };
    } catch (error) {
      const errorMessage = handleApiError(error);
      return { success: false, error: errorMessage };
    }
  };

  const updateDelivery = async (id, deliveryData) => {
    try {
      const response = await deliveredAPI.update(id, deliveryData);
      await fetchDeliveries();
      return { success: true, data: response?.data ?? response };
    } catch (error) {
      const errorMessage = handleApiError(error);
      return { success: false, error: errorMessage };
    }
  };

  const deleteDelivery = async (id) => {
    try {
      await deliveredAPI.delete(id);
      await fetchDeliveries();
      return { success: true };
    } catch (error) {
      const errorMessage = handleApiError(error);
      return { success: false, error: errorMessage };
    }
  };

  return {
    deliveries,
    isLoading,
    error,
    createDelivery,
    updateDelivery,
    deleteDelivery,
    refetch: fetchDeliveries
  };
};

// ============================================
// BBM HOOK
// ============================================

export const useBBM = (filters = {}) => {
  const [bbmRecords, setBbmRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const filtersRef = useRef(filters);
  const depKey = JSON.stringify(filters);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const fetchBBMRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await bbmAPI.getAll(filtersRef.current);
      const data = response?.data ?? response;
      setBbmRecords(data.data || data.bbmRecords || data);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBBMRecords();
  }, [depKey, fetchBBMRecords]);

  const createBBMRecord = async (bbmData) => {
    try {
      const response = await bbmAPI.create(bbmData);
      await fetchBBMRecords();
      return { success: true, data: response?.data ?? response };
    } catch (error) {
      const errorMessage = handleApiError(error);
      return { success: false, error: errorMessage };
    }
  };

  const updateBBMRecord = async (id, bbmData) => {
    try {
      const response = await bbmAPI.update(id, bbmData);
      await fetchBBMRecords();
      return { success: true, data: response?.data ?? response };
    } catch (error) {
      const errorMessage = handleApiError(error);
      return { success: false, error: errorMessage };
    }
  };

  const deleteBBMRecord = async (id) => {
    try {
      await bbmAPI.delete(id);
      await fetchBBMRecords();
      return { success: true };
    } catch (error) {
      const errorMessage = handleApiError(error);
      return { success: false, error: errorMessage };
    }
  };

  return {
    bbmRecords,
    isLoading,
    error,
    createBBMRecord,
    updateBBMRecord,
    deleteBBMRecord,
    refetch: fetchBBMRecords
  };
};

// ============================================
// FILE UPLOAD HOOK
// ============================================

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const uploadFile = async (file, category = 'document') => {
    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      const response = await fileAPI.upload(file, category);
      setUploadProgress(100);
      return { success: true, data: response?.data ?? response };
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadFile,
    isUploading,
    uploadProgress,
    error
  };
};

export default {
  useAuth,
  useAPIData,
  useCustomers,
  useDeliveries,
  useBBM,
  useFileUpload
};
