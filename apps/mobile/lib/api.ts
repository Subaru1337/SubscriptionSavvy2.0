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

let isRedirectingToLogin = false;

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
    if (error.response && error.response.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('user_data');
      delete api.defaults.headers.common.Authorization;

      if (!isRedirectingToLogin) {
        isRedirectingToLogin = true;
        router.replace('/');
        setTimeout(() => {
          isRedirectingToLogin = false;
        }, 1000);
      }
    } else {
      console.error(
        "Axios Error:",
        error.message,
        error.response?.status,
        error.response?.data?.error ?? error.response?.data,
        error.config?.baseURL,
        error.config?.url,
      );
    }
    return Promise.reject(error);
  }
);
