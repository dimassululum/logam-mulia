import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for attaching tokens
apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor for handling token expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const refreshToken = localStorage.getItem('refresh_token');
      const requestUrl = String(originalRequest?.url || '');
      const isAuthRequest = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/refresh-token');

      if (refreshToken && !originalRequest?._retry && !isAuthRequest) {
        originalRequest._retry = true;

        try {
          const { data } = await axios.post(`${baseURL}/auth/refresh-token`, { refreshToken });
          const nextAccessToken = data.data.accessToken;

          localStorage.setItem('access_token', nextAccessToken);
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;

          return apiClient(originalRequest);
        } catch {
          localStorage.removeItem('refresh_token');
        }
      }

      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);
