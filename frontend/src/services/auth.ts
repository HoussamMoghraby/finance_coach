/**
 * Authentication API service
 */
import api from './api';

export interface User {
  id: number;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  username: string;  // OAuth2 uses 'username' field
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export const authAPI = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const params = new URLSearchParams();
    params.append('username', data.username);
    params.append('password', data.password);

    const response = await api.post('/auth/login', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<User> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};
