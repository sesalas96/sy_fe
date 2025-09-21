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

  const response = await fetch(`${API_BASE_URL}/api${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
};

export interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  companyId: string;
  approvalAuthority: boolean;
  requiredRole?: string;
  approvalOrder?: number;
  isActive: boolean;
  settings?: {
    requiresComments?: boolean;
    maxApprovalTimeHours?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentCreateData {
  name: string;
  code: string;
  description?: string;
  companyId: string;
  approvalAuthority: boolean;
  requiredRole?: string;
  approvalOrder?: number;
  settings?: {
    requiresComments?: boolean;
    maxApprovalTimeHours?: number;
  };
}

export interface DepartmentUpdateData extends Partial<Omit<DepartmentCreateData, 'companyId'>> {}

export interface DepartmentFilters {
  companyId?: string;
  approvalAuthority?: boolean;
  search?: string;
  isActive?: boolean;
}

export class DepartmentService {
  /**
   * Get all departments with optional filtering
   */
  static async getDepartments(filters?: DepartmentFilters): Promise<Department[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters?.companyId) queryParams.append('companyId', filters.companyId);
      if (filters?.approvalAuthority !== undefined) queryParams.append('approvalAuthority', filters.approvalAuthority.toString());
      if (filters?.search) queryParams.append('search', filters.search);
      if (filters?.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString());
      
      const endpoint = `/departments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiCall(endpoint);
      
      return response.data || response;
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  }

  /**
   * Get departments that can approve work permits for a company
   */
  static async getApprovalDepartments(companyId: string): Promise<Department[]> {
    try {
      const response = await apiCall(`/departments/approval/${companyId}`);
      return response.data || response;
    } catch (error) {
      console.error('Error fetching approval departments:', error);
      throw error;
    }
  }

  /**
   * Get a single department by ID
   */
  static async getDepartment(id: string): Promise<Department | null> {
    try {
      const response = await apiCall(`/departments/${id}`);
      return response.data || response;
    } catch (error) {
      console.error('Error fetching department:', error);
      return null;
    }
  }

  /**
   * Create a new department
   */
  static async createDepartment(data: DepartmentCreateData): Promise<Department> {
    try {
      const response = await apiCall('/departments', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      return response.data || response;
    } catch (error) {
      console.error('Error creating department:', error);
      throw error;
    }
  }

  /**
   * Update an existing department
   */
  static async updateDepartment(id: string, data: DepartmentUpdateData): Promise<Department> {
    try {
      const response = await apiCall(`/departments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      
      return response.data || response;
    } catch (error) {
      console.error('Error updating department:', error);
      throw error;
    }
  }

  /**
   * Delete/deactivate a department
   */
  static async deleteDepartment(id: string, reason?: string): Promise<void> {
    try {
      const options: RequestInit = {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (reason) {
        options.body = JSON.stringify({ reason });
      }

      await apiCall(`/departments/${id}`, options);
    } catch (error) {
      console.error('Error deleting department:', error);
      throw error;
    }
  }

  /**
   * Get departments for select dropdown
   */
  static async getDepartmentsForSelect(companyId?: string, approvalOnly: boolean = false): Promise<Array<{ id: string; name: string; code: string }>> {
    try {
      const filters: DepartmentFilters = {
        isActive: true
      };
      
      if (companyId) filters.companyId = companyId;
      if (approvalOnly) filters.approvalAuthority = true;
      
      const departments = await this.getDepartments(filters);
      return departments.map(dept => ({
        id: dept._id,
        name: dept.name,
        code: dept.code
      }));
    } catch (error) {
      console.error('Error fetching departments for select:', error);
      return [];
    }
  }
}

export default DepartmentService;