// API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://sybe-production.up.railway.app/api';

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

export interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  companyId?: string;
  companyName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  departments?: Array<{
    _id: string;
    name: string;
    code: string;
  }>;
}

export interface UserFilters {
  companyId?: string;
  role?: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export class UserService {
  /**
   * Get all users with optional filtering
   */
  static async getUsers(filters?: UserFilters): Promise<{
    users: User[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters?.companyId) queryParams.append('companyId', filters.companyId);
      if (filters?.role) queryParams.append('role', filters.role);
      if (filters?.search) queryParams.append('search', filters.search);
      if (filters?.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString());
      if (filters?.page) queryParams.append('page', filters.page.toString());
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());
      
      const endpoint = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiCall(endpoint);
      
      return response.data || response;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Get users by company for dropdown selection
   */
  static async getUsersByCompany(companyId: string): Promise<Array<{ 
    id: string; 
    name: string; 
    email: string;
    role: string;
  }>> {
    try {
      const result = await this.getUsers({ 
        companyId, 
        isActive: true,
        limit: 100 // Get all active users for selection
      });
      
      return result.users.map(user => ({
        id: user._id,
        name: user.fullName,
        email: user.email,
        role: user.role
      }));
    } catch (error) {
      console.error('Error fetching users by company:', error);
      return [];
    }
  }

  /**
   * Get a single user by ID
   */
  static async getUser(id: string): Promise<User | null> {
    try {
      const response = await apiCall(`/users/${id}`);
      return response.data || response;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }
}

export default UserService;