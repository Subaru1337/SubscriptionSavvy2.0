import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { router } from 'expo-router';

// Read API URL from app config (app.json > extra.apiUrl) with hardcoded fallback
const configApiUrl = Constants.expoConfig?.extra?.apiUrl;
export const API_URL = configApiUrl || "https://subscription-savvy2-0-web.vercel.app/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'X-Client-Type': 'mobile',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error("Axios Error:", error.message, error.code, error.config?.baseURL, error.config?.url);
    if (error.response && error.response.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
      // Redirect to login screen
      router.replace('/');
    }
    return Promise.reject(error);
  }
);
