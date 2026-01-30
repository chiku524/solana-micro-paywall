// API client utilities

// Use API subdomain for production, or allow override via env var for local dev
function getApiUrl(): string {
  // In browser, check for environment variable override (for local dev)
  if (typeof window !== 'undefined') {
    // If NEXT_PUBLIC_API_URL is explicitly set, use it (for local development)
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    // In production, use API subdomain
    // Pages: micropaywall.app, Workers: api.micropaywall.app
    if (window.location.hostname === 'micropaywall.app' || window.location.hostname.endsWith('.micropaywall.app')) {
      return 'https://api.micropaywall.app';
    }
    // Fallback for other domains (e.g., preview deployments)
    return '';
  }
  
  // Fallback for server-side (shouldn't happen with static export)
  return process.env.NEXT_PUBLIC_API_URL || 'https://api.micropaywall.app';
}

const API_URL = getApiUrl();

export class ApiError extends Error {
  constructor(
    public status: number,
    public error: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Token refresh handler
let refreshPromise: Promise<boolean> | null = null;

async function refreshTokenIfNeeded(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return false;
      }

      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  retryOn401 = true
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  // Handle empty responses (like 405 Method Not Allowed with no body)
  const contentType = response.headers.get('content-type');
  let data: unknown = {};
  if (contentType && contentType.includes('application/json')) {
    try {
      const text = await response.text();
      data = text ? (JSON.parse(text) as unknown) : {};
    } catch {
      data = {};
    }
  }

  const errData = data as { error?: string; message?: string };

  // Auto-refresh token on 401 if retry is enabled
  if (!response.ok && response.status === 401 && retryOn401 && endpoint !== '/api/auth/refresh') {
    const refreshed = await refreshTokenIfNeeded();
    if (refreshed) {
      // Retry the request with new token
      const newToken = localStorage.getItem('token');
      const newHeaders: Record<string, string> = {
        ...(options.headers as Record<string, string>),
      };
      if (newToken) {
        newHeaders.Authorization = `Bearer ${newToken}`;
      }
      return request<T>(endpoint, { ...options, headers: newHeaders }, false);
    }
  }
  
  if (!response.ok) {
    throw new ApiError(
      response.status,
      errData.error ?? `HTTP ${response.status}`,
      errData.message ?? response.statusText ?? 'An error occurred'
    );
  }

  return data as T;
}

export async function apiGet<T>(endpoint: string, token?: string): Promise<T> {
  return request<T>(endpoint, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function apiPost<T>(
  endpoint: string,
  body: unknown,
  token?: string
): Promise<T> {
  return request<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function apiPut<T>(
  endpoint: string,
  body: unknown,
  token?: string
): Promise<T> {
  return request<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function apiDelete<T>(
  endpoint: string,
  token?: string
): Promise<T> {
  return request<T>(endpoint, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
