// API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Helper function to make authenticated API calls
const apiCall = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const token = getAuthToken();
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
};

export interface DepartmentUser {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  companyId?: string;
  companyName?: string;
  isActive: boolean;
  assignedAt?: string;
}

export interface UserAssignmentData {
  userIds: string[];
}

export interface DepartmentUsersFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

export class DepartmentUsersService {
  /**
   * Get all users assigned to a department
   */
  static async getDepartmentUsers(departmentId: string, filters?: DepartmentUsersFilters): Promise<{
    users: DepartmentUser[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters?.page) queryParams.append('page', filters.page.toString());
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());
      if (filters?.search) queryParams.append('search', filters.search);
      if (filters?.role) queryParams.append('role', filters.role);
      
      const endpoint = `/departments/${departmentId}/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiCall(endpoint);
      
      return response.data || response;
    } catch (error) {
      console.error('Error fetching department users:', error);
      throw error;
    }
  }

  /**
   * Assign users to a department
   */
  static async assignUsers(departmentId: string, data: UserAssignmentData): Promise<void> {
    try {
      await apiCall(`/departments/${departmentId}/users`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Error assigning users to department:', error);
      throw error;
    }
  }

  /**
   * Remove users from a department
   */
  static async removeUsers(departmentId: string, data: UserAssignmentData): Promise<void> {
    try {
      await apiCall(`/departments/${departmentId}/users`, {
        method: 'DELETE',
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Error removing users from department:', error);
      throw error;
    }
  }

  /**
   * Get available users for assignment (users from the same company not yet in the department)
   */
  static async getAvailableUsers(departmentId: string, companyId: string): Promise<DepartmentUser[]> {
    try {
      const response = await apiCall(`/departments/${departmentId}/available-users?companyId=${companyId}`);
      return response.data || response;
    } catch (error) {
      console.error('Error fetching available users:', error);
      throw error;
    }
  }
}

export default DepartmentUsersService;