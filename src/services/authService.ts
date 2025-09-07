const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://sybe-production.up.railway.app';

interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    company?: {
      _id: string;
      name: string;
      ruc: string;
      address: string;
      phone: string;
      email: string;
      isActive: boolean;
      settings?: {
        notificationDays: number[];
        requiredCourses: string[];
      };
    } | null;
  };
}

interface AuthError {
  success: false;
  error: string;
}

class AuthService {
  private static instance: AuthService;
  
  private constructor() {}
  
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error((data as AuthError).error || 'Error al iniciar sesión');
      }

      return data as LoginResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error de conexión con el servidor');
    }
  }

  async getCurrentUser(token: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener usuario actual');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error de conexión con el servidor');
    }
  }

  getStoredToken(): string | null {
    return localStorage.getItem('token');
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  removeToken(): void {
    localStorage.removeItem('token');
  }
}

export default AuthService.getInstance();