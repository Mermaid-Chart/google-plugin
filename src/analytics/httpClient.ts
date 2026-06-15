import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { prodUrl } from '../config/urls';

const ANALYTICS_BASE_URL = prodUrl;

const httpClient: AxiosInstance = axios.create({
  baseURL: ANALYTICS_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

httpClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.code === 'ERR_NETWORK') {
      console.warn(
        'Analytics endpoint unreachable - continuing without tracking'
      );
      return Promise.resolve({
        data: null,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: error.config,
      });
    }
    console.error('HTTP Client error:', error);
    return Promise.reject(error);
  }
);

export default httpClient;
