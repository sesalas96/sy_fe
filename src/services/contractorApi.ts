import { ApiResponse } from './userApi';

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

export interface ContractorInitialCourse {
  _id?: string;
  name: string;
  completionDate: string;
  certificateUrl?: string;
  talentLMSCourseId?: string;
}

export interface ContractorAdditionalCourse {
  _id?: string;
  name: string;
  completionDate: string;
  expiryDate?: string;
  certificateUrl?: string;
  talentLMSCourseId?: string;
}

export interface ContractorFormData {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  cedula: string;
  email?: string;
  phone?: string;
  companyId: string;
  status?: 'active' | 'inactive' | 'suspended';
  polizaINS?: {
    number: string;
    expiryDate: string;
    documentUrl?: string;
  };
  ordenPatronal?: {
    number?: string;
    expiryDate?: string;
    documentUrl?: string;
  };
  supervisorId?: string;
}

export interface Contractor {
  _id: string;
  firstName: string;
  lastName: string;
  fullName?: string; // Optional fallback
  cedula: string;
  email?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended' | 'activo' | 'inactivo' | 'baja'; // Support both English and Spanish
  company?: {
    _id: string;
    name: string;
    industry?: string;
    employeeCount?: number;
    settings?: {
      notificationDays: number[];
      requiredCourses: {
        name: string;
        isInitial: boolean;
        _id: string;
      }[];
    };
  };
  polizaINS?: {
    number: string;
    expiryDate: string;
    documentUrl?: string;
  };
  ordenPatronal?: {
    number?: string;
    expiryDate?: string;
    documentUrl?: string;
  };
  initialCourses?: ContractorInitialCourse[];
  additionalCourses?: ContractorAdditionalCourse[];
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
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  reviewStats?: {
    averageRating: number;
    totalReviews: number;
    lastReviewDate?: string;
    wouldHireAgainPercentage: number;
  };
  expiringItems?: any[];
  deactivationDate?: string;
  deactivationReason?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface ContractorFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  companyId?: string;
}

export const contractorApi = {
  // Get all contractors
  getAll: async (filters?: ContractorFilters): Promise<ApiResponse<Contractor[]>> => {
    return apiCall('GET', '/contractors', null, filters);
  },

  // Get contractor by ID
  getById: async (id: string): Promise<ApiResponse<Contractor>> => {
    return apiCall('GET', `/contractors/${id}`);
  },

  // Create new contractor
  create: async (data: ContractorFormData): Promise<ApiResponse<Contractor>> => {
    return apiCall('POST', '/contractors', data);
  },

  // Update contractor
  update: async (id: string, data: Partial<ContractorFormData>): Promise<ApiResponse<Contractor>> => {
    return apiCall('PUT', `/contractors/${id}`, data);
  },

  // Delete contractor
  delete: async (id: string, reason?: string): Promise<ApiResponse<any>> => {
    return apiCall('DELETE', `/contractors/${id}`, reason ? { reason } : {});
  },

  // Add initial course to contractor
  addInitialCourse: async (id: string, course: ContractorInitialCourse): Promise<ApiResponse<any>> => {
    return apiCall('POST', `/contractors/${id}/initial-courses`, course);
  },

  // Add additional course to contractor
  addAdditionalCourse: async (id: string, course: ContractorAdditionalCourse): Promise<ApiResponse<any>> => {
    return apiCall('POST', `/contractors/${id}/additional-courses`, course);
  },

  // Update initial course
  updateInitialCourse: async (id: string, courseId: string, course: Partial<ContractorInitialCourse>): Promise<ApiResponse<any>> => {
    return apiCall('PUT', `/contractors/${id}/initial-courses/${courseId}`, course);
  },

  // Update additional course
  updateAdditionalCourse: async (id: string, courseId: string, course: Partial<ContractorAdditionalCourse>): Promise<ApiResponse<any>> => {
    return apiCall('PUT', `/contractors/${id}/additional-courses/${courseId}`, course);
  },

  // Delete initial course
  deleteInitialCourse: async (id: string, courseId: string): Promise<ApiResponse<any>> => {
    return apiCall('DELETE', `/contractors/${id}/initial-courses/${courseId}`);
  },

  // Delete additional course
  deleteAdditionalCourse: async (id: string, courseId: string): Promise<ApiResponse<any>> => {
    return apiCall('DELETE', `/contractors/${id}/additional-courses/${courseId}`);
  },

  // Get contractor verification data
  getVerification: async (id: string): Promise<ApiResponse<any>> => {
    return apiCall('GET', `/contractors/${id}/verification`);
  },

  // Update contractor verification status
  updateVerification: async (id: string, data: {
    status: 'verified' | 'rejected';
    rejectionReason?: string;
  }): Promise<ApiResponse<any>> => {
    return apiCall('PUT', `/contractors/${id}/verification`, data);
  },

  // Get contractor evaluations
  getEvaluations: async (id: string): Promise<ApiResponse<any>> => {
    return apiCall('GET', `/contractors/${id}/evaluations`);
  },

  // Add new evaluation
  addEvaluation: async (id: string, evaluation: {
    scores: {
      safety: number;
      quality: number;
      timeliness: number;
      communication: number;
    };
    comments?: string;
  }): Promise<ApiResponse<any>> => {
    return apiCall('POST', `/contractors/${id}/evaluate`, evaluation);
  },

  // Get contractor certifications
  getCertifications: async (id: string): Promise<ApiResponse<any>> => {
    return apiCall('GET', `/contractors/${id}/certifications`);
  },

  // Add new certification
  addCertification: async (id: string, certification: {
    type: string;
    name: string;
    issuedBy: string;
    issueDate: string;
    expiryDate: string;
    certificateNumber: string;
    documentUrl?: string;
  }): Promise<ApiResponse<any>> => {
    return apiCall('POST', `/contractors/${id}/certifications`, certification);
  },

  // Get terms acceptance status
  getTermsAcceptance: async (id: string): Promise<ApiResponse<any>> => {
    return apiCall('GET', `/contractors/${id}/terms`);
  },

  // Get verification documents
  getVerificationDocuments: async (id: string): Promise<ApiResponse<any>> => {
    return apiCall('GET', `/contractors/${id}/verification-documents`);
  },

  // Export contractors
  exportContractors: async (filters: ContractorFilters & { format?: 'csv' | 'excel' }): Promise<Blob> => {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.companyId) params.append('companyId', filters.companyId);
    params.append('format', filters.format || 'excel');

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/contractors/export?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al exportar los contratistas');
    }

    return response.blob();
  }
};