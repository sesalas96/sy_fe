import { Company } from '../types';

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


export interface CompanyFilters {
  name?: string;
  industry?: string;
  status?: 'active' | 'inactive' | 'suspended';
  employeeCountRange?: {
    min?: number;
    max?: number;
  };
}

export class CompanyService {
  /**
   * Get all companies with optional filtering
   */
  static async getCompanies(filters?: CompanyFilters): Promise<Company[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters?.name) queryParams.append('name', filters.name);
      if (filters?.industry) queryParams.append('industry', filters.industry);
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.employeeCountRange?.min) queryParams.append('employeeCountMin', filters.employeeCountRange.min.toString());
      if (filters?.employeeCountRange?.max) queryParams.append('employeeCountMax', filters.employeeCountRange.max.toString());
      
      const endpoint = `/api/companies${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiCall(endpoint);
      
      return response.data.map((company: any) => ({
        ...company,
        createdAt: new Date(company.createdAt),
        updatedAt: new Date(company.updatedAt),
        insuranceInfo: company.insuranceInfo ? {
          ...company.insuranceInfo,
          expiryDate: new Date(company.insuranceInfo.expiryDate)
        } : undefined,
        certifications: company.certifications?.map((cert: any) => ({
          ...cert,
          issueDate: new Date(cert.issueDate),
          expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : undefined
        })) || []
      }));
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  }

  /**
   * Get company by ID
   */
  static async getCompanyById(id: string): Promise<Company | null> {
    try {
      const response = await apiCall(`/api/companies/${id}`);
      const company = response.data;
      
      return {
        ...company,
        createdAt: new Date(company.createdAt),
        updatedAt: new Date(company.updatedAt),
        insuranceInfo: company.insuranceInfo ? {
          ...company.insuranceInfo,
          expiryDate: new Date(company.insuranceInfo.expiryDate)
        } : undefined,
        certifications: company.certifications?.map((cert: any) => ({
          ...cert,
          issueDate: new Date(cert.issueDate),
          expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : undefined
        })) || []
      };
    } catch (error) {
      console.error('Error fetching company:', error);
      return null;
    }
  }

  /**
   * Create new company
   */
  static async createCompany(companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<Company> {
    try {
      const response = await apiCall('/api/companies', {
        method: 'POST',
        body: JSON.stringify(companyData)
      });
      
      const company = response.data;
      return {
        ...company,
        createdAt: new Date(company.createdAt),
        updatedAt: new Date(company.updatedAt),
        insuranceInfo: company.insuranceInfo ? {
          ...company.insuranceInfo,
          expiryDate: new Date(company.insuranceInfo.expiryDate)
        } : undefined,
        certifications: company.certifications?.map((cert: any) => ({
          ...cert,
          issueDate: new Date(cert.issueDate),
          expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : undefined
        })) || []
      };
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  }

  /**
   * Update existing company
   */
  static async updateCompany(id: string, companyData: Partial<Omit<Company, 'id' | 'createdAt'>>): Promise<Company> {
    try {
      const response = await apiCall(`/api/companies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(companyData)
      });
      
      const company = response.data;
      return {
        ...company,
        createdAt: new Date(company.createdAt),
        updatedAt: new Date(company.updatedAt),
        insuranceInfo: company.insuranceInfo ? {
          ...company.insuranceInfo,
          expiryDate: new Date(company.insuranceInfo.expiryDate)
        } : undefined,
        certifications: company.certifications?.map((cert: any) => ({
          ...cert,
          issueDate: new Date(cert.issueDate),
          expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : undefined
        })) || []
      };
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  }

  /**
   * Delete company
   */
  static async deleteCompany(id: string): Promise<void> {
    try {
      await apiCall(`/api/companies/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
  }

  /**
   * Get companies summary statistics
   */
  static async getCompaniesStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    byIndustry: { [industry: string]: number };
  }> {
    try {
      const response = await apiCall('/api/companies/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching company stats:', error);
      throw error;
    }
  }

  /**
   * Check if company has active contractors
   */
  static async hasActiveContractors(companyId: string): Promise<boolean> {
    try {
      const response = await apiCall(`/api/companies/${companyId}/has-active-contractors`);
      return response.data;
    } catch (error) {
      console.error('Error checking active contractors:', error);
      return false;
    }
  }

  /**
   * Get company certifications that are expiring soon
   */
  static async getExpiringCertifications(companyId?: string, daysAhead: number = 30): Promise<{
    companyId: string;
    companyName: string;
    certification: {
      name: string;
      expiryDate: Date;
      daysUntilExpiry: number;
    };
  }[]> {
    try {
      const queryParams = new URLSearchParams();
      if (companyId) queryParams.append('companyId', companyId);
      if (daysAhead !== 30) queryParams.append('daysAhead', daysAhead.toString());
      
      const endpoint = `/api/companies/certifications/expiring${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiCall(endpoint);
      
      return response.data.map((item: any) => ({
        ...item,
        certification: {
          ...item.certification,
          expiryDate: new Date(item.certification.expiryDate)
        }
      }));
    } catch (error) {
      console.error('Error fetching expiring certifications:', error);
      throw error;
    }
  }

  /**
   * Update company status
   */
  static async updateCompanyStatus(id: string, status: 'active' | 'inactive' | 'suspended'): Promise<Company> {
    try {
      const response = await apiCall(`/api/companies/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      
      const company = response.data;
      return {
        ...company,
        createdAt: new Date(company.createdAt),
        updatedAt: new Date(company.updatedAt),
        insuranceInfo: company.insuranceInfo ? {
          ...company.insuranceInfo,
          expiryDate: new Date(company.insuranceInfo.expiryDate)
        } : undefined,
        certifications: company.certifications?.map((cert: any) => ({
          ...cert,
          issueDate: new Date(cert.issueDate),
          expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : undefined
        })) || []
      };
    } catch (error) {
      console.error('Error updating company status:', error);
      throw error;
    }
  }

  /**
   * Get companies for dropdown/select components
   */
  static async getCompaniesForSelect(): Promise<{ id: string; name: string }[]> {
    try {
      const response = await apiCall('/api/companies/select');
      // Map _id to id for consistency with frontend expectations
      return response.data.map((company: any) => ({
        id: company._id || company.id,
        name: company.name
      }));
    } catch (error) {
      console.error('Error fetching companies for select:', error);
      throw error;
    }
  }
}

export default CompanyService;