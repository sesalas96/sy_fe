import { ApiResponse } from './userApi';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://sybe-production.up.railway.app/api';

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
  error?: string;
}

class PasswordRecoveryApi {
  private async makeRequest<T>(
    endpoint: string,
    method: string = 'GET',
    data?: any
  ): Promise<T> {
    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    try {
      return await this.makeRequest<ForgotPasswordResponse>(
        '/auth/forgot-password',
        'POST',
        { email: email.trim().toLowerCase() }
      );
    } catch (error) {
      console.error('Error in forgotPassword:', error);
      return {
        success: false,
        message: '',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  async resetPassword(token: string, password: string): Promise<ResetPasswordResponse> {
    try {
      return await this.makeRequest<ResetPasswordResponse>(
        '/auth/reset-password',
        'POST',
        { token: token.trim(), password }
      );
    } catch (error) {
      console.error('Error in resetPassword:', error);
      return {
        success: false,
        message: '',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  // Validation helpers
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('La contraseña debe tener al menos 8 caracteres');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra minúscula');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra mayúscula');
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push('La contraseña debe contener al menos un número');
    }

    if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) {
      errors.push('La contraseña debe contener al menos un carácter especial (!@#$%^&*(),.?":{}|<>)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateToken(token: string): boolean {
    return !!(token && token.length >= 10); // Basic token validation
  }
}

export const passwordRecoveryApi = new PasswordRecoveryApi();