/**
 * Airgo App Global Configuration
 */

// If testing on a physical device, replace 'localhost' with your local machine's IP (e.g., '192.168.1.50')
const DEV_BACKEND = 'https://airgo-backend.onrender.com/api'; // Switched to live server to prevent local IP issues
const PROD_BACKEND = 'https://airgo-backend.onrender.com/api';

// Automatically toggle backend URL based on development/production mode
export const API_URL = __DEV__ ? DEV_BACKEND : PROD_BACKEND;
