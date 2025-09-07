// API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

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

export interface ServiceCategory {
  _id: string;
  id?: string;
  name: string;
  code: string;
  description?: string;
  parentCategory?: string | null;
  parentId?: string;
  children?: ServiceCategory[];
  icon: string;
  requiredCertifications: Array<{
    name: string;
    description: string;
    validityDays: number;
    _id: string;
  }>;
  requiredPPE: Array<{
    name: string;
    description: string;
    _id: string;
  }>;
  defaultTools: Array<{
    name: string;
    description: string;
    _id: string;
  }>;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface Service {
  _id: string;
  id?: string;
  name: string;
  code: string;
  description: string;
  categoryId?: string;
  category?: {
    _id: string;
    name: string;
    code: string;
    requiredCertifications?: Array<{
      name: string;
      description: string;
      validityDays: number;
      _id: string;
    }>;
    requiredPPE?: Array<{
      name: string;
      description: string;
      _id: string;
    }>;
  };
  basePrice: number;
  currency?: string;
  unit?: string;
  billingUnit: string;
  estimatedDuration: {
    value: number;
    unit: string;
  };
  sla: {
    responseTime: {
      value?: number;
      unit: string;
    };
    resolutionTime: {
      value?: number;
      unit: string;
    };
  };
  leadTime: {
    value?: number;
    unit: string;
  };
  riskLevel: 'bajo' | 'medio' | 'alto' | 'crítico';
  commonRisks: Array<{
    description: string;
    preventiveMeasure: string;
    _id: string;
  }>;
  requiredTools: Array<{
    name: string;
    description: string;
    whoProvides: string;
    _id: string;
  }>;
  requiredCertifications: string[];
  requiredPPE: string[];
  tags: string[];
  relatedServices: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  __v?: number;
  
  // Legacy fields for compatibility
  slaHours?: number;
  requiresCertification?: boolean;
  safetyRequirements?: string[];
}

export interface ServiceFilters {
  search?: string;
  category?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  billingUnit?: string;
  riskLevel?: 'bajo' | 'medio' | 'alto' | 'crítico';
  requiresCertification?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface ServiceStats {
  services: {
    total: number;
    active: number;
    inactive: number;
  };
  categories: {
    total: number;
    active: number;
  };
  breakdown: {
    byCategory: Array<{
      _id: string;
      categoryName: string;
      categoryCode: string;
      count: number;
      activeCount: number;
    }>;
    byRiskLevel: Array<{
      _id: string;
      count: number;
    }>;
    byBillingUnit: Array<{
      _id: string;
      count: number;
    }>;
  };
  averages: {
    _id: null;
    avgPrice: number;
    avgDuration: any;
    minPrice: number;
    maxPrice: number;
    minDuration: {
      value: number;
      unit: string;
    };
    maxDuration: {
      value: number;
      unit: string;
    };
  };
  
  // Legacy fields for compatibility
  totalServices?: number;
  activeServices?: number;
  categoriesCount?: number;
  avgPrice?: number;
}

export interface ServiceCreateData {
  name: string;
  code: string;
  description: string;
  category: string; // Backend expects 'category', not 'categoryId'
  billingUnit: string;
  basePrice: number;
  currency?: string;
  estimatedDuration: {
    value: number;
    unit: string;
  };
  sla: {
    responseTime: {
      value?: number;
      unit: string;
    };
    resolutionTime: {
      value?: number;
      unit: string;
    };
  };
  leadTime: {
    value?: number;
    unit: string;
  };
  riskLevel: 'bajo' | 'medio' | 'alto' | 'crítico';
  commonRisks: Array<{
    description: string;
    preventiveMeasure: string;
  }>;
  requiredTools: Array<{
    name: string;
    description: string;
    whoProvides: string;
  }>;
  requiredCertifications: string[];
  requiredPPE: string[];
  tags: string[];
  relatedServices: string[];
  isActive: boolean;
}

export class ServicesApi {
  static async getServiceCategories(): Promise<ServiceCategory[]> {
    const response = await apiCall('/services/categories');
    
    // Handle the actual backend response structure
    if (response.success && response.categories) {
      return response.categories;
    }
    
    return response.data || response;
  }

  static async createServiceCategory(data: Omit<ServiceCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceCategory> {
    const response = await apiCall('/services/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.data || response;
  }

  static async updateServiceCategory(id: string, data: Partial<ServiceCategory>): Promise<ServiceCategory> {
    const response = await apiCall(`/services/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return response.data || response;
  }

  static async deleteServiceCategory(id: string): Promise<void> {
    await apiCall(`/services/categories/${id}`, {
      method: 'DELETE'
    });
  }

  static async getServices(filters: ServiceFilters = {}): Promise<{ services: Service[]; total: number; page: number; totalPages: number }> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.billingUnit) params.append('billingUnit', filters.billingUnit);
    if (filters.riskLevel) params.append('riskLevel', filters.riskLevel);
    if (filters.requiresCertification !== undefined) params.append('requiresCertification', filters.requiresCertification.toString());
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiCall(`/services?${params.toString()}`);
    
    // Handle the actual backend response structure
    if (response.success && response.services) {
      return {
        services: response.services,
        total: response.pagination?.total || 0,
        page: response.pagination?.page || 1,
        totalPages: response.pagination?.pages || 1
      };
    }
    
    return response.data || response;
  }

  static async getService(id: string): Promise<Service> {
    console.log('ServicesApi.getService called with ID:', id);
    const response = await apiCall(`/services/${id}`);
    console.log('ServicesApi.getService response:', response);
    
    // Handle the actual backend response structure with success wrapper
    if (response.success && response.service) {
      console.log('Returning service from success wrapper');
      return response.service;
    }
    
    console.log('Returning service from data fallback');
    return response.data || response;
  }

  static async createService(data: ServiceCreateData): Promise<Service> {
    const response = await apiCall('/services', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.data || response;
  }

  static async updateService(id: string, data: Partial<ServiceCreateData>): Promise<Service> {
    const response = await apiCall(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return response.data || response;
  }

  static async deleteService(id: string): Promise<void> {
    await apiCall(`/services/${id}`, {
      method: 'DELETE'
    });
  }

  static async getServicesStats(): Promise<ServiceStats> {
    const response = await apiCall('/services/stats');
    
    // Handle the actual backend response structure with success wrapper
    if (response.success && response.stats) {
      return response.stats;
    }
    
    return response.data || response;
  }
}