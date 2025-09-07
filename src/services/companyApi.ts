import { CompanyFormData } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://sybe-production.up.railway.app/api';

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

interface CompaniesListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  industry?: string;
  employeeCountMin?: number;
  employeeCountMax?: number;
}

interface CompanyUsersParams {
  role?: string;
  isActive?: boolean;
}

interface CompanyContractorsParams {
  page?: number;
  limit?: number;
  status?: string;
}

interface CompanyReportsParams {
  reportType: 'contractors' | 'users';
  startDate?: string;
  endDate?: string;
}

interface BulkUpdateData {
  companyIds: string[];
  operation: 'activate' | 'deactivate' | 'updateSettings';
  data?: any;
}

export const companyApi = {
  // Crear una empresa
  create: async (data: CompanyFormData) => {
    return apiCall('POST', '/companies', data);
  },

  // Obtener lista de empresas
  getAll: async (params?: CompaniesListParams) => {
    return apiCall('GET', '/companies', null, params);
  },

  // Obtener empresas para select/dropdown
  getSelect: async () => {
    return apiCall('GET', '/companies/select');
  },

  // Obtener una empresa por ID
  getById: async (id: string) => {
    return apiCall('GET', `/companies/${id}`);
  },

  // Actualizar una empresa
  update: async (id: string, data: Partial<CompanyFormData>) => {
    return apiCall('PUT', `/companies/${id}`, data);
  },

  // Actualizar estado de empresa
  updateStatus: async (id: string, status: string) => {
    return apiCall('PATCH', `/companies/${id}/status`, { status });
  },

  // Eliminar/Desactivar empresa
  delete: async (id: string) => {
    return apiCall('DELETE', `/companies/${id}`);
  },

  // Actualizar configuración de empresa
  updateSettings: async (id: string, settings: any) => {
    return apiCall('PUT', `/companies/${id}/settings`, settings);
  },

  // Obtener dashboard de empresa
  getDashboard: async (id: string) => {
    return apiCall('GET', `/companies/${id}/dashboard`);
  },

  // Obtener usuarios de una empresa
  getUsers: async (id: string, params?: CompanyUsersParams) => {
    return apiCall('GET', `/companies/${id}/users`, null, params);
  },

  // Obtener contratistas de una empresa
  getContractors: async (id: string, params?: CompanyContractorsParams) => {
    return apiCall('GET', `/companies/${id}/contractors`, null, params);
  },

  // Obtener estadísticas de empresa
  getStats: async (id: string) => {
    return apiCall('GET', `/companies/${id}/stats`);
  },

  // Obtener estadísticas generales
  getGeneralStats: async () => {
    return apiCall('GET', '/companies/stats');
  },

  // Obtener certificaciones por vencer
  getExpiringCertifications: async (params?: { daysAhead?: number; companyId?: string }) => {
    return apiCall('GET', '/companies/certifications/expiring', null, params);
  },

  // Verificar si tiene contratistas activos
  hasActiveContractors: async (id: string) => {
    return apiCall('GET', `/companies/${id}/has-active-contractors`);
  },

  // Generar reportes de empresa
  getReports: async (id: string, params: CompanyReportsParams) => {
    return apiCall('GET', `/companies/${id}/reports`, null, params);
  },

  // Actualización masiva de empresas
  bulkUpdate: async (data: BulkUpdateData) => {
    return apiCall('POST', '/companies/bulk-update', data);
  }
};