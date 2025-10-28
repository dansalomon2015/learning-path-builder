import axios, { AxiosInstance } from 'axios';

// Simple auth service without Firebase
class AuthService {
  private static token: string | null = localStorage.getItem('auth_token');
  private static user: any = null;

  static async signIn(email: string, password: string) {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user } = response.data;

      this.token = token;
      this.user = user;
      localStorage.setItem('auth_token', token);

      return user;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  static async signUp(email: string, password: string, name: string) {
    try {
      const response = await axios.post('/api/auth/register', { email, password, name });
      const { token, user } = response.data;

      this.token = token;
      this.user = user;
      localStorage.setItem('auth_token', token);

      return user;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  static signOut() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('auth_token');
  }

  static getCurrentUser() {
    return this.user;
  }

  static getToken() {
    return this.token;
  }

  static isAuthenticated() {
    return !!this.token;
  }
}

export { AuthService };
