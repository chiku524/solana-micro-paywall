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

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
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
  let data: any;
  
  if (contentType && contentType.includes('application/json')) {
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      data = {};
    }
  } else {
    // Non-JSON response or empty body
    data = {};
  }
  
  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.error || `HTTP ${response.status}`,
      data.message || response.statusText || 'An error occurred'
    );
  }
  
  return data;
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
