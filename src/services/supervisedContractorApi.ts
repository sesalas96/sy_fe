import { ApiResponse } from './userApi';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Helper function for API calls
const apiCall = async (method: string, endpoint: string, data?: any, params?: any) => {
  const token = localStorage.getItem('token');
  
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  let url = `${API_BASE_URL}${endpoint}`;
  
  if (params) {
    const queryString = new URLSearchParams(params).toString();
    url += `?${queryString}`;
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error en la solicitud');
  }

  return response.json();
};

export interface SupervisedContractor {
  _id: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  cedula: string;
  email?: string;
  phone?: string;
  role?: string;
  ordenPatronal?: string;
  polizaINS?: {
    number: string;
    expiryDate: string;
  };
  status: string;
  company: {
    _id: string;
    name: string;
    industry?: string;
    employeeCount?: number;
  };
  certifications?: {
    name: string;
    issuedDate: string;
    expiryDate: string;
    status: string;
    _id: string;
  }[];
  courses?: {
    courseId: string;
    courseName: string;
    completedDate: string;
    score: number;
    status: string;
    _id: string;
  }[];
  supervisor?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt?: string;
  updatedAt?: string;
  lastAccess?: string;
}

export interface SupervisedContractorStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  expiringDocuments: number;
  companiesCount: number;
  byCompany: {
    _id: string;
    name: string;
    count: number;
    active: number;
    inactive: number;
  }[];
}

export interface SupervisedContractorFilters {
  page?: number;
  limit?: number;
  companyId?: string;
  status?: 'activo' | 'inactivo' | 'baja';
  search?: string;
  expiringDocs?: boolean;
}

export interface SupervisedContractorResponse {
  success: boolean;
  data: {
    contractors: SupervisedContractor[];
    summary: {
      totalContractors: number;
      activeContractors: number;
      inactiveContractors: number;
      expiringDocuments: number;
      companiesSupervised: number;
      contractorsByCompany: {
        _id: string;
        companyId: string;
        companyName: string;
        totalContractors: number;
        activeContractors: number;
      }[];
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  message?: string;
}

export const supervisedContractorApi = {
  // Get all supervised contractors with filters
  getAll: async (filters?: SupervisedContractorFilters): Promise<SupervisedContractorResponse> => {
    return apiCall('GET', '/contractors/supervised', null, filters);
  },

  // Get contractor by ID (if within supervised companies)
  getById: async (id: string): Promise<ApiResponse<SupervisedContractor>> => {
    return apiCall('GET', `/contractors/supervised/${id}`);
  },

  // Get statistics for supervised contractors
  getStats: async (): Promise<ApiResponse<SupervisedContractorStats>> => {
    return apiCall('GET', '/contractors/supervised/stats');
  },

  // Get contractors by company (only supervised companies)
  getByCompany: async (companyId: string, filters?: Omit<SupervisedContractorFilters, 'companyId'>): Promise<SupervisedContractorResponse> => {
    return apiCall('GET', '/contractors/supervised', null, { ...filters, companyId });
  },

  // Get contractors with expiring documents
  getExpiringDocs: async (filters?: Omit<SupervisedContractorFilters, 'expiringDocs'>): Promise<SupervisedContractorResponse> => {
    return apiCall('GET', '/contractors/supervised', null, { ...filters, expiringDocs: true });
  },

  // Search contractors
  search: async (searchTerm: string, filters?: Omit<SupervisedContractorFilters, 'search'>): Promise<SupervisedContractorResponse> => {
    return apiCall('GET', '/contractors/supervised', null, { ...filters, search: searchTerm });
  }
};