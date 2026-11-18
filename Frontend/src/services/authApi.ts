import {
  User,
  TokenResponse,
  LoginCredentials,
  RegisterCredentials,
  MessageResponse,
} from '../types/auth';

const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string) || '/api/v1';

const TOKEN_KEYS = {
  ACCESS: 'qtech_crm_access_token',
  REFRESH: 'qtech_crm_refresh_token',
};

export const tokenStorage = {
  getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEYS.ACCESS);
  },
  getRefreshToken(): string | null {
    return localStorage.getItem(TOKEN_KEYS.REFRESH);
  },
  setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem(TOKEN_KEYS.ACCESS, accessToken);
    localStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken);
  },
  clearTokens() {
    localStorage.removeItem(TOKEN_KEYS.ACCESS);
    localStorage.removeItem(TOKEN_KEYS.REFRESH);
  },
};

/**
 * Handle extracting error detail from fetch Response
 */
async function getErrorMessage(res: Response): Promise<string> {
  try {
    const errorData = await res.json();
    if (errorData?.detail) {
      if (typeof errorData.detail === 'string') {
        return errorData.detail;
      }
      if (Array.isArray(errorData.detail)) {
        return errorData.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
      }
    }
    return 'An unexpected error occurred';
  } catch {
    return `Server error (${res.status})`;
  }
}

/**
 * Authenticated fetch wrapper with automatic token refresh on 401
 */
export async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  let accessToken = tokenStorage.getAccessToken();

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // If unauthorized, attempt to rotate refresh token
  if (response.status === 401 && tokenStorage.getRefreshToken()) {
    try {
      const refreshed = await refreshTokenApi();
      accessToken = refreshed.access_token;

      // Retry original request with new token
      headers.set('Authorization', `Bearer ${accessToken}`);
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
    } catch {
      tokenStorage.clearTokens();
    }
  }

  return response;
}

export async function loginApi(credentials: LoginCredentials): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    const errorMsg = await getErrorMessage(res);
    throw new Error(errorMsg);
  }

  const data: TokenResponse = await res.json();
  tokenStorage.setTokens(data.access_token, data.refresh_token);
  return data;
}

export async function registerApi(credentials: RegisterCredentials): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    const errorMsg = await getErrorMessage(res);
    throw new Error(errorMsg);
  }

  return res.json();
}

export async function getMeApi(): Promise<User> {
  const res = await fetchWithAuth('/auth/me');

  if (!res.ok) {
    const errorMsg = await getErrorMessage(res);
    throw new Error(errorMsg);
  }

  return res.json();
}

export async function refreshTokenApi(): Promise<TokenResponse> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    tokenStorage.clearTokens();
    throw new Error('Session expired. Please log in again.');
  }

  const data: TokenResponse = await res.json();
  tokenStorage.setTokens(data.access_token, data.refresh_token);
  return data;
}

export async function logoutApi(): Promise<MessageResponse> {
  const refreshToken = tokenStorage.getRefreshToken();
  let result: MessageResponse = { message: 'Logged out' };

  try {
    const res = await fetchWithAuth('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (res.ok) {
      result = await res.json();
    }
  } finally {
    tokenStorage.clearTokens();
  }

  return result;
}
