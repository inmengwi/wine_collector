// Auth Types

export interface User {
  id: string;
  email: string;
  name: string;
  profile_image: string | null;
  is_verified: boolean;
  birth_year: number | null;
  language: string | null;
  nationality: string | null;
  gender: string | null;
  wine_preferences: string | null;
  created_at: string;
  last_login_at: string | null;
}

export interface ProfileUpdateRequest {
  name?: string;
  profile_image?: string;
  birth_year?: number | null;
  language?: string | null;
  nationality?: string | null;
  gender?: string | null;
  wine_preferences?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  marketing_agreed?: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginResponse extends TokenResponse {
  user: User;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
