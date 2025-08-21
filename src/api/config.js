/**
 * API Configuration for IAA Feedback System
 *
 * This file contains the base configuration for API requests
 * to the cloud-based IAA backend server.
 */

// Base API URL - Cloud-ready configuration
const isDevelopment = import.meta.env.VITE_ENVIRONMENT === 'development';

// Helper function to check if an URL is accessible
const checkUrlAccess = async (url) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    await fetch(`${url}/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    return true;
  } catch {
    return false;
  }
};

// Define API URLs
const LOCAL_API = 'http://127.0.0.1:8001';
const CLOUD_API = 'https://iaa-2bs1.onrender.com';

// Initialize API_BASE_URL
export let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (isDevelopment ? LOCAL_API : CLOUD_API);

// Dynamic API URL selection
(async () => {
  try {
    // First try the configured URL
    if (!await checkUrlAccess(API_BASE_URL)) {
      // If configured URL fails, try the alternate URL
      const alternateUrl = API_BASE_URL === LOCAL_API ? CLOUD_API : LOCAL_API;
      if (await checkUrlAccess(alternateUrl)) {
        console.log(`Switching to alternate API URL: ${alternateUrl}`);
        API_BASE_URL = alternateUrl;
      }
    }
  } catch (error) {
    console.error('Error checking API URLs:', error);
  }
})();

// App Configuration
export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'IAA Feedback System',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  environment: import.meta.env.VITE_ENVIRONMENT || 'development',
  debug: import.meta.env.VITE_DEBUG === 'true'
};

console.log('🌐 Frontend Configuration:');
console.log(`📡 API URL: ${API_BASE_URL}`);
console.log(`🏷️  App: ${APP_CONFIG.name} v${APP_CONFIG.version}`);
console.log(`🔧 Environment: ${APP_CONFIG.environment}`);

// Authentication endpoints
export const AUTH_ENDPOINTS = {
  REGISTER: `${API_BASE_URL}/auth/register`,
  LOGIN: `${API_BASE_URL}/auth/login`,
  REFRESH_TOKEN: `${API_BASE_URL}/auth/refresh`,
};

// System endpoints
export const SYSTEM_ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/health`,
  DB_INFO: `${API_BASE_URL}/db-info`,
  SETUP: `${API_BASE_URL}/setup`,
  TABLES: `${API_BASE_URL}/tables`,
};

// Default request headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

// Add auth token to headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('iaa_token');
  return {
    ...DEFAULT_HEADERS,
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// Handle API errors
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  // Network error
  if (!error.response) {
    return {
      success: false,
      message: 'Network error. Please check your connection.',
    };
  }
  
  // Server error with response
  const status = error.response.status;
  
  if (status === 401) {
    // Unauthorized - clear token and redirect to login
    localStorage.removeItem('iaa_token');
    localStorage.removeItem('iaa_user');
    window.location.href = '/login';
    return {
      success: false,
      message: 'Your session has expired. Please login again.',
    };
  }
  
  if (status === 403) {
    return {
      success: false,
      message: 'You do not have permission to perform this action.',
    };
  }
  
  if (status === 404) {
    return {
      success: false,
      message: 'The requested resource was not found.',
    };
  }
  
  if (status >= 500) {
    return {
      success: false,
      message: 'Server error. Please try again later.',
    };
  }
  
  // Default error message
  return {
    success: false,
    message: error.response?.data?.message || 'An unexpected error occurred.',
  };
};

// API configuration object
const apiConfig = {
  baseUrl: API_BASE_URL,
  auth: AUTH_ENDPOINTS,
  system: SYSTEM_ENDPOINTS,
  headers: DEFAULT_HEADERS,
  getAuthHeaders,
  handleApiError,
};

export default apiConfig;
