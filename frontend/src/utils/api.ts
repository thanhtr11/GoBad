import axios, { AxiosInstance } from 'axios';

let apiInstance: AxiosInstance;

export const initializeApi = (token: string | null) => {
  apiInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  return apiInstance;
};

export const api = {
  get: async (url: string) => {
    if (!apiInstance) {
      throw new Error('API not initialized');
    }
    return apiInstance.get(url);
  },
  post: async (url: string, data: any) => {
    if (!apiInstance) {
      throw new Error('API not initialized');
    }
    return apiInstance.post(url, data);
  },
  put: async (url: string, data: any) => {
    if (!apiInstance) {
      throw new Error('API not initialized');
    }
    return apiInstance.put(url, data);
  },
  patch: async (url: string, data: any) => {
    if (!apiInstance) {
      throw new Error('API not initialized');
    }
    return apiInstance.patch(url, data);
  },
  delete: async (url: string) => {
    if (!apiInstance) {
      throw new Error('API not initialized');
    }
    return apiInstance.delete(url);
  },
};

export default api;
