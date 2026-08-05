/**
 * Airgo App Global Configuration
 */

// If testing on a physical device, replace 'localhost' with your local machine's IP (e.g., '192.168.1.50')
const DEV_BACKEND = 'http://10.203.13.149:5000/api'; // Use your local IP or 10.0.2.2 for Android emulator
const PROD_BACKEND = 'https://airgo-backend.onrender.com/api';

// Automatically toggle backend URL based on development/production mode
export const API_URL = __DEV__ ? DEV_BACKEND : PROD_BACKEND;
