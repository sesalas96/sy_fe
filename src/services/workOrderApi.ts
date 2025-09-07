// API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://sybe-production.up.railway.app';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Generic API call function
const apiCall = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const token = getAuthToken();
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export interface WorkOrder {
  _id?: string;
  id?: string;
  orderNumber: string;
  workRequestId?: string;
  workRequest?: {
    _id: string;
    title: string;
    description: string;
    requestNumber: string;
  };
  contractorId: string;
  contractor?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    company?: {
      _id: string;
      name: string;
    };
  };
  serviceId: string;
  service?: {
    _id: string;
    name: string;
    code: string;
    category: string;
  };
  companyId: string;
  company?: {
    _id: string;
    name: string;
  };
  status: 'pending' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled' | 
          'pendiente' | 'asignado' | 'en_progreso' | 'en_espera' | 'completado' | 'cancelado';
  priority: 'baja' | 'media' | 'alta' | 'urgente' | 'low' | 'medium' | 'high' | 'urgent';
  scheduledStartDate: string;
  scheduledEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  estimatedDuration: number; // in hours
  actualDuration?: number; // in hours
  location: {
    address: string;
    coordinates?: { lat: number; lng: number };
  };
  assignedTo?: string[];
  notes?: string;
  clientNotes?: string;
  contractorNotes?: string;
  attachments?: string[];
  materials?: Array<{
    name: string;
    quantity: number;
    unit: string;
    cost?: number;
  }>;
  laborCost?: number;
  materialCost?: number;
  totalCost?: number;
  currency?: string;
  progress?: number; // 0-100
  milestones?: Array<{
    name: string;
    description: string;
    dueDate: string;
    completed: boolean;
    completedAt?: string;
  }>;
  qualityChecks?: Array<{
    name: string;
    status: 'pending' | 'passed' | 'failed';
    checkedBy?: string;
    checkedAt?: string;
    notes?: string;
  }>;
  safetyRequirements?: string[];
  requiredCertifications?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  lastModifiedBy?: string;
}

export interface WorkOrderFilters {
  search?: string;
  status?: string;
  contractor?: string;
  service?: string;
  priority?: string;
  companyId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface WorkOrderStats {
  total: number;
  pending: number;
  assigned: number;
  inProgress: number;
  onHold: number;
  completed: number;
  cancelled: number;
  averageDuration: number;
  totalCost: number;
  byStatus: Array<{
    _id: string;
    count: number;
    totalCost?: number;
  }>;
  byPriority: Array<{
    _id: string;
    count: number;
  }>;
  byContractor: Array<{
    _id: string;
    contractor: {
      firstName: string;
      lastName: string;
      company?: { name: string };
    };
    count: number;
    totalCost?: number;
  }>;
  monthlyTrend: Array<{
    _id: { year: number; month: number };
    count: number;
    completedCount: number;
    totalCost: number;
  }>;
}

export interface WorkOrderStatsResponse {
  success: boolean;
  stats: WorkOrderStats;
}

export class WorkOrderApi {
  static async getWorkOrders(filters: WorkOrderFilters = {}): Promise<{ 
    workOrders: WorkOrder[]; 
    total: number; 
    page: number; 
    totalPages: number 
  }> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiCall(`/api/work-orders?${params.toString()}`);
    
    // Handle different response formats
    if (response.workOrders) {
      return {
        workOrders: response.workOrders,
        total: response.total || response.workOrders.length,
        page: response.page || 1,
        totalPages: response.totalPages || 1
      };
    }
    
    return response.data || response;
  }

  static async getWorkOrder(id: string): Promise<WorkOrder> {
    const response = await apiCall(`/api/work-orders/${id}`);
    
    // Handle the actual backend response structure
    if (response.success && response.workOrder) {
      return response.workOrder;
    }
    
    return response.data || response;
  }

  static async updateWorkOrder(id: string, data: Partial<WorkOrder>): Promise<WorkOrder> {
    const response = await apiCall(`/api/work-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return response.data || response;
  }

  static async updateWorkOrderStatus(id: string, status: string, notes?: string): Promise<WorkOrder> {
    console.log('API: Updating work order status to:', status);
    
    const response = await apiCall(`/api/work-orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes })
    });
    return response.data || response;
  }

  static async getWorkOrderStats(filters?: Omit<WorkOrderFilters, 'page' | 'limit'>): Promise<WorkOrderStatsResponse> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const queryString = params.toString();
    const response = await apiCall(`/api/work-orders/stats${queryString ? `?${queryString}` : ''}`);
    return response.data || response;
  }

  static async deleteWorkOrder(id: string): Promise<void> {
    await apiCall(`/api/work-orders/${id}`, {
      method: 'DELETE'
    });
  }
}