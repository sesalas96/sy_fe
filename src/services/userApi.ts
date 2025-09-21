import { User, UserRole } from '../types';

const BASE_URL = process.env.REACT_APP_API_URL || 'https://sybe-production.up.railway.app/api';;

export interface UserFormData {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  company?: string;
  isActive?: boolean;
}

export interface UserProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  role?: UserRole;
  isActive?: boolean;
  search?: string;
  company?: string;
  companyId?: string;
}

export interface UserGeneralStats {
  summary: {
    total: number;
    active: number;
    inactive: number;
    activePercentage: number;
  };
  byRole: Record<string, number>;
  byStatus: Record<string, number>;
  recent: User[];
}

export interface LoginHistoryEntry {
  id: string;
  date: string;
  success: boolean;
  ipAddress: string;
  userAgent: string;
  location?: string;
  failureReason?: string;
  device?: {
    type: string;
    os: string;
    browser: string;
  };
}

export interface LoginHistoryResponse {
  success: boolean;
  data: {
    logins: LoginHistoryEntry[];
    pagination: {
      current: number;
      pages: number;
      total: number;
      limit: number;
    };
  };
}

export interface UserIndividualStats {
  profile: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    status: string;
    isActive: boolean;
    company?: string;
    lastLogin?: string;
    createdAt: string;
  };
  activity: {
    totalLogins: number;
    lastLoginDaysAgo: number;
    accountAge: number;
  };
  permissions: {
    certifications: string[];
    phone: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class UserApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getAll(filters: UserFilters = {}): Promise<ApiResponse<User[]>> {
    try {
      const params = new URLSearchParams();
      
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.role) params.append('role', filters.role);
      if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.company) params.append('company', filters.company);
      if (filters.companyId) params.append('companyId', filters.companyId);

      const response = await fetch(`${BASE_URL}/api/users?${params.toString()}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener usuarios');
      }

      return {
        success: true,
        data: result.data || result.users || [],
        pagination: result.pagination
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener usuarios'
      };
    }
  }

  async getById(userId: string): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${BASE_URL}/api/users/${userId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener usuario');
      }

      return {
        success: true,
        data: result.data || result.user || result
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener usuario'
      };
    }
  }

  async create(userData: UserFormData): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${BASE_URL}/api/users`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(userData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al crear usuario');
      }

      return {
        success: true,
        data: result.data || result.user || result,
        message: result.message || 'Usuario creado exitosamente'
      };
    } catch (error) {
      console.error('Error creating user:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al crear usuario'
      };
    }
  }

  async update(userId: string, userData: Partial<UserFormData>): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${BASE_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(userData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al actualizar usuario');
      }

      return {
        success: true,
        data: result.data || result.user || result,
        message: result.message || 'Usuario actualizado exitosamente'
      };
    } catch (error) {
      console.error('Error updating user:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al actualizar usuario'
      };
    }
  }

  async delete(userId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${BASE_URL}/api/users/${userId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al eliminar usuario');
      }

      return {
        success: true,
        message: result.message || 'Usuario eliminado exitosamente'
      };
    } catch (error) {
      console.error('Error deleting user:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al eliminar usuario'
      };
    }
  }

  async getGeneralStats(): Promise<ApiResponse<UserGeneralStats>> {
    try {
      const response = await fetch(`${BASE_URL}/api/users/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener estadísticas generales');
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('Error fetching general stats:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener estadísticas generales'
      };
    }
  }

  async getStats(userId: string): Promise<ApiResponse<UserIndividualStats>> {
    try {
      const response = await fetch(`${BASE_URL}/api/users/${userId}/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener estadísticas del usuario');
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener estadísticas del usuario'
      };
    }
  }

  async getProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${BASE_URL}/api/users/profile`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener perfil');
      }

      return {
        success: true,
        data: result.data || result.user || result
      };
    } catch (error) {
      console.error('Error fetching profile:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener perfil'
      };
    }
  }

  async updateProfile(profileData: UserProfileData): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(profileData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al actualizar perfil');
      }

      return {
        success: true,
        data: result.data || result.user || result,
        message: result.message || 'Perfil actualizado exitosamente'
      };
    } catch (error) {
      console.error('Error updating profile:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al actualizar perfil'
      };
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${BASE_URL}/api/users/change-password`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al cambiar contraseña');
      }

      return {
        success: true,
        message: result.message || 'Contraseña cambiada exitosamente'
      };
    } catch (error) {
      console.error('Error changing password:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al cambiar contraseña'
      };
    }
  }

  async toggleStatus(userId: string): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${BASE_URL}/api/users/${userId}/toggle-status`, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al cambiar estado del usuario');
      }

      return {
        success: true,
        data: result.data || result.user || result,
        message: result.message || 'Estado del usuario actualizado'
      };
    } catch (error) {
      console.error('Error toggling user status:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al cambiar estado del usuario'
      };
    }
  }

  async getLoginHistory(
    userId: string, 
    params?: {
      page?: number;
      limit?: number;
      success?: boolean;
    }
  ): Promise<LoginHistoryResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.success !== undefined) queryParams.append('success', params.success.toString());

      const response = await fetch(
        `${BASE_URL}/api/users/${userId}/login-history?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders()
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener historial de login');
      }

      return {
        success: true,
        data: {
          logins: result.data.logins || [],
          pagination: result.data.pagination || { current: 1, pages: 1, total: 0, limit: 10 }
        }
      };
    } catch (error) {
      console.error('Error fetching login history:', error);
      return {
        success: false,
        data: {
          logins: [],
          pagination: { current: 1, pages: 1, total: 0, limit: 10 }
        }
      };
    }
  }

  async updateSupervisedCompanies(userId: string, companyIds: string[]): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${BASE_URL}/api/users/${userId}/supervised-companies`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ companyIds })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al actualizar empresas supervisadas');
      }

      return {
        success: true,
        data: result.data || result.user || result,
        message: result.message || 'Espacios de Trabajos supervisadas actualizadas exitosamente'
      };
    } catch (error) {
      console.error('Error updating supervised companies:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al actualizar empresas supervisadas'
      };
    }
  }

  async getSupervisedCompanies(userId: string): Promise<ApiResponse<{ _id: string; name: string }[]>> {
    try {
      const response = await fetch(`${BASE_URL}/api/users/${userId}/supervised-companies`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener empresas supervisadas');
      }

      return {
        success: true,
        data: result.data || result.companies || []
      };
    } catch (error) {
      console.error('Error fetching supervised companies:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener empresas supervisadas'
      };
    }
  }

  async exportUsers(filters: UserFilters & { format?: 'csv' | 'excel' }): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.role) params.append('role', filters.role);
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.company) params.append('company', filters.company);
    if (filters.companyId) params.append('companyId', filters.companyId);
    params.append('format', filters.format || 'excel');

    const response = await fetch(`${BASE_URL}/api/users/export?${params.toString()}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Error al exportar los usuarios');
    }

    return response.blob();
  }
}

export const userApi = new UserApiService();