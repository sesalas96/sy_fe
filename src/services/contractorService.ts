import { Contractor } from '../types';

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

export interface ContractorCreateData {
  fullName: string;
  cedula: string;
  ordenPatronal?: string;
  polizaINS?: string;
  status: 'active' | 'inactive';
  companyId: string;
}

export interface ContractorUpdateData extends Partial<ContractorCreateData> {
  id: string;
}

export interface ContractorFilters {
  search?: string;
  status?: 'active' | 'inactive' | 'activo' | 'inactivo';
  companyId?: string;
  page?: number;
  limit?: number;
}

export class ContractorService {
  /**
   * Get all contractors with optional filtering
   */
  static async getContractors(filters?: ContractorFilters): Promise<Contractor[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters?.search) queryParams.append('search', filters.search);
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.companyId) queryParams.append('companyId', filters.companyId);
      if (filters?.page) queryParams.append('page', filters.page.toString());
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());
      
      const endpoint = `/contractors${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiCall(endpoint);
      
      // Handle both paginated and non-paginated responses
      if (response.data) {
        return response.data.map((contractor: any) => ({
          id: contractor._id || contractor.id,
          userId: contractor.userId || contractor.user?._id || '',
          fullName: contractor.fullName || `${contractor.firstName || ''} ${contractor.lastName || ''}`.trim(),
          cedula: contractor.cedula,
          ordenPatronal: contractor.ordenPatronal,
          polizaINS: contractor.polizaINS,
          status: contractor.status,
          companyId: contractor.companyId || contractor.company?._id || '',
          createdAt: new Date(contractor.createdAt),
          updatedAt: new Date(contractor.updatedAt)
        }));
      }
      
      // If it's a simple array response
      if (Array.isArray(response)) {
        return response.map((contractor: any) => ({
          id: contractor._id || contractor.id,
          userId: contractor.userId || contractor.user?._id || '',
          fullName: contractor.fullName || `${contractor.firstName || ''} ${contractor.lastName || ''}`.trim(),
          cedula: contractor.cedula,
          ordenPatronal: contractor.ordenPatronal,
          polizaINS: contractor.polizaINS,
          status: contractor.status,
          companyId: contractor.companyId || contractor.company?._id || '',
          createdAt: new Date(contractor.createdAt),
          updatedAt: new Date(contractor.updatedAt)
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching contractors:', error);
      throw error;
    }
  }

  /**
   * Get a single contractor by ID
   */
  static async getContractor(id: string): Promise<Contractor | null> {
    try {
      const response = await apiCall(`/contractors/${id}`);
      const contractor = response.data || response;
      
      return {
        id: contractor._id || contractor.id,
        userId: contractor.userId || contractor.user?._id || '',
        fullName: contractor.fullName || `${contractor.firstName || ''} ${contractor.lastName || ''}`.trim(),
        cedula: contractor.cedula,
        ordenPatronal: contractor.ordenPatronal,
        polizaINS: contractor.polizaINS,
        status: contractor.status,
        companyId: contractor.companyId || contractor.company?._id || '',
        createdAt: new Date(contractor.createdAt),
        updatedAt: new Date(contractor.updatedAt)
      };
    } catch (error) {
      console.error('Error fetching contractor:', error);
      return null;
    }
  }

  /**
   * Create a new contractor
   */
  static async createContractor(data: ContractorCreateData): Promise<Contractor> {
    try {
      const response = await apiCall('/contractors', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      const contractor = response.data || response;
      return {
        id: contractor._id || contractor.id,
        userId: contractor.userId || contractor.user?._id || '',
        fullName: contractor.fullName || data.fullName,
        cedula: contractor.cedula,
        ordenPatronal: contractor.ordenPatronal,
        polizaINS: contractor.polizaINS,
        status: contractor.status,
        companyId: contractor.companyId || contractor.company?._id || '',
        createdAt: new Date(contractor.createdAt),
        updatedAt: new Date(contractor.updatedAt)
      };
    } catch (error) {
      console.error('Error creating contractor:', error);
      throw error;
    }
  }

  /**
   * Update an existing contractor
   */
  static async updateContractor(data: ContractorUpdateData): Promise<Contractor> {
    try {
      const { id, ...updateData } = data;
      const response = await apiCall(`/contractors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      
      const contractor = response.data || response;
      return {
        id: contractor._id || contractor.id,
        userId: contractor.userId || contractor.user?._id || '',
        fullName: contractor.fullName || updateData.fullName || contractor.fullName,
        cedula: contractor.cedula,
        ordenPatronal: contractor.ordenPatronal,
        polizaINS: contractor.polizaINS,
        status: contractor.status,
        companyId: contractor.companyId || contractor.company?._id || '',
        createdAt: new Date(contractor.createdAt),
        updatedAt: new Date(contractor.updatedAt)
      };
    } catch (error) {
      console.error('Error updating contractor:', error);
      throw error;
    }
  }

  /**
   * Delete a contractor
   */
  static async deleteContractor(id: string): Promise<void> {
    try {
      await apiCall(`/contractors/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting contractor:', error);
      throw error;
    }
  }

  /**
   * Get contractor statistics
   */
  static async getContractorStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    recentlyAdded: number;
  }> {
    try {
      const response = await apiCall('/contractors/stats');
      return response.data || response;
    } catch (error) {
      console.error('Error fetching contractor stats:', error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        recentlyAdded: 0
      };
    }
  }

  /**
   * Check if cedula is already in use
   */
  static async checkCedulaExists(cedula: string, excludeId?: string): Promise<boolean> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('cedula', cedula);
      if (excludeId) queryParams.append('excludeId', excludeId);
      
      const response = await apiCall(`/contractors/check-cedula?${queryParams.toString()}`);
      return response.exists || false;
    } catch (error) {
      console.error('Error checking cedula:', error);
      return false;
    }
  }

  /**
   * Get contractors by company
   */
  static async getContractorsByCompany(companyId: string): Promise<Contractor[]> {
    return this.getContractors({ companyId });
  }

  /**
   * Get active contractors count
   */
  static async getActiveContractorsCount(): Promise<number> {
    try {
      const stats = await this.getContractorStats();
      return stats.active;
    } catch (error) {
      console.error('Error getting active contractors count:', error);
      return 0;
    }
  }

  /**
   * Get contractors for select dropdown
   */
  static async getContractorsForSelect(companyId?: string): Promise<Array<{ id: string; name: string; cedula: string }>> {
    try {
      const filters: ContractorFilters = {
        status: 'active'
      };
      if (companyId) {
        filters.companyId = companyId;
      }
      
      const contractors = await this.getContractors(filters);
      return contractors.map(contractor => ({
        id: contractor.id,
        name: contractor.fullName,
        cedula: contractor.cedula
      }));
    } catch (error) {
      console.error('Error fetching contractors for select:', error);
      return [];
    }
  }
}

export default ContractorService;