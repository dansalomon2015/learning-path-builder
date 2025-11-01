import axios from 'axios';
import type { AxiosError } from 'axios';

interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

// Simple auth service without Firebase
class AuthService {
  private static token: string | null = localStorage.getItem('auth_token');
  private static user: AuthUser | null = null;

  static async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      const response = await axios.post<{ token: string; user: AuthUser }>('/api/auth/login', {
        email,
        password,
      });
      const { token, user } = response.data;

      this.token = token;
      this.user = user;
      localStorage.setItem('auth_token', token);

      return user;
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      const errorMessage = error.response?.data.message ?? 'Login failed';
      throw new Error(errorMessage);
    }
  }

  static async signUp(email: string, password: string, name: string): Promise<AuthUser> {
    try {
      const response = await axios.post<{ token: string; user: AuthUser }>('/api/auth/register', {
        email,
        password,
        name,
      });
      const { token, user } = response.data;

      this.token = token;
      this.user = user;
      localStorage.setItem('auth_token', token);

      return user;
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      const errorMessage = error.response?.data.message ?? 'Registration failed';
      throw new Error(errorMessage);
    }
  }

  static signOut(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem('auth_token');
  }

  static getCurrentUser(): AuthUser | null {
    return this.user;
  }

  static getToken(): string | null {
    return this.token;
  }

  static isAuthenticated(): boolean {
    return this.token != null;
  }
}

export { AuthService };
