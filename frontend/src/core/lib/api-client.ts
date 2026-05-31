import axios from 'axios';
import { resolvePublicApiBaseUrl } from './public-url';
import { MOCK_AUTH_COOKIES } from './mock-auth';

function resolveApiBaseUrl() {
  return resolvePublicApiBaseUrl();
}

const baseURL = resolveApiBaseUrl();
let refreshAccessTokenPromise: Promise<string> | null = null;

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

function clearBrowserAuthSession() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_name');
  localStorage.removeItem('user_email');
  document.cookie = `${MOCK_AUTH_COOKIES.role}=; path=/; max-age=0; SameSite=Lax`;
  document.cookie = `${MOCK_AUTH_COOKIES.name}=; path=/; max-age=0; SameSite=Lax`;
  document.cookie = `${MOCK_AUTH_COOKIES.email}=; path=/; max-age=0; SameSite=Lax`;
}

async function refreshAccessToken(refreshToken: string) {
  if (!refreshAccessTokenPromise) {
    refreshAccessTokenPromise = axios
      .post(`${baseURL}/auth/refresh-token`, { refreshToken })
      .then(({ data }) => data.data.accessToken)
      .finally(() => {
        refreshAccessTokenPromise = null;
      });
  }

  return refreshAccessTokenPromise;
}

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
          const nextAccessToken = await refreshAccessToken(refreshToken);

          localStorage.setItem('access_token', nextAccessToken);
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;

          return apiClient(originalRequest);
        } catch {
          clearBrowserAuthSession();
        }
      }

      clearBrowserAuthSession();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
