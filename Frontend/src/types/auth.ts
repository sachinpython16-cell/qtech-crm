export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginCredentials {
  identifier: string; // Email or username
  password: string;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}

export interface MessageResponse {
  message: string;
}
