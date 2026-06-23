import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
export const API_URL = "https://subscription-savvy2-0-web.vercel.app/api";
export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

import { router } from 'expo-router';

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
      // Redirect to login screen
      if (router.canGoBack()) {
        router.dismissAll();
      }
      router.replace('/');
    }
    return Promise.reject(error);
  }
);
