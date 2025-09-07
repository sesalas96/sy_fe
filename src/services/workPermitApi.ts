import { WorkPermit } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://sybe-production.up.railway.app';

export interface WorkPermitCreateData {
  contractorId: string;
  companyId?: string;
  templateId?: string;
  category: string; // Campo requerido por el backend
  linkedUsers?: Array<{
    userId: string;
    role: 'principal' | 'support' | 'observer';
  }>;
  workDescription: string;
  location: string;
  startDate: string; // ISO 8601 format
  endDate: string; // ISO 8601 format
  workHours?: {
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
  identifiedRisks: string[];
  toolsToUse: string[];
  requiredPPE: string[];
  safetyControls?: {
    item: string;
    description: string; // Campo requerido por el backend
    checked: boolean;
    notes?: string;
  }[];
  additionalControls?: string;
  requiredApprovals: Array<{ 
    department: string;
    requiredRole?: string;
  }>; // Array of approval objects
  requiredForms?: Array<{
    form: string; // ID del formulario
    mandatory: boolean;
    order: number;
    condition?: {
      field: string;
      operator: string;
      value: any;
    };
  }>;
  formResponses?: Record<string, any[]>; // formId -> array de respuestas
}

export interface WorkPermitUpdateData extends Partial<WorkPermitCreateData> {}

export interface WorkPermitFilters {
  page?: number;
  limit?: number;
  status?: 'borrador' | 'pendiente' | 'aprobado' | 'rechazado' | 'expirado' | 'cancelado';
  companyId?: string;
  department?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface WorkPermitStats {
  summary: {
    total: number;
    recent: number;
    activePermits: number;
    pendingApprovals: number;
    expiringSoon: number;
    avgApprovalTimeHours: number;
  };
  byStatus: {
    borrador: number;
    pendiente: number;
    aprobado: number;
    rechazado: number;
    expirado: number;
    cancelado: number;
  };
  byDepartment: Array<{
    department: string;
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    approvalRate: number;
    avgResponseHours: number;
  }>;
  timeline: Array<{
    _id: {
      week: number;
      year: number;
    };
    count: number;
    approved: number;
    rejected: number;
  }>;
  topContractors: Array<{
    _id: string;
    permitCount: number;
    approvedCount: number;
    rejectedCount: number;
    cedula: string;
    approvalRate: number;
  }>;
  topRisks: Array<{
    risk: string;
    frequency: number;
  }>;
  alerts: {
    expiringSoon: number;
    pendingApprovals: number;
    overduePermits: number;
  };
}

export interface ApprovalData {
  action: 'approve' | 'reject';
  department: 'supervisor' | 'hse' | 'seguridad';
  comments?: string;
}

export interface PaginatedWorkPermits {
  permits: WorkPermit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class WorkPermitApi {
  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  static async createWorkPermit(data: WorkPermitCreateData): Promise<WorkPermit> {
    const response = await fetch(`${API_BASE_URL}/api/work-permits`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al crear el permiso de trabajo');
    }

    const result = await response.json();
    
    // Handle wrapped response format
    if (result.success !== undefined) {
      if (!result.success) {
        throw new Error(result.message || 'Error en la respuesta del servidor');
      }
      return result.data;
    }
    
    return result;
  }

  static async getWorkPermits(filters?: WorkPermitFilters): Promise<PaginatedWorkPermits> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}/api/work-permits?${params}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Error al obtener los permisos de trabajo');
    }

    const apiResponse: ApiResponse<WorkPermit[]> = await response.json();
    
    if (!apiResponse.success) {
      throw new Error('Error en la respuesta del servidor');
    }

    // Transform API response to expected format
    return {
      permits: apiResponse.data || [],
      total: apiResponse.pagination?.total || 0,
      page: apiResponse.pagination?.page || 1,
      limit: apiResponse.pagination?.limit || 10,
      totalPages: apiResponse.pagination?.pages || 1
    };
  }

  static async getWorkPermit(id: string): Promise<WorkPermit> {
    const response = await fetch(`${API_BASE_URL}/api/work-permits/${id}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Permiso de trabajo no encontrado');
      }
      throw new Error('Error al obtener el permiso de trabajo');
    }

    const result = await response.json();
    
    // Handle both direct response and wrapped response formats
    if (result.success !== undefined) {
      // Wrapped format: {success: true, data: {...}}
      if (!result.success) {
        throw new Error('Error en la respuesta del servidor');
      }
      return result.data;
    }
    
    // Direct format: {...}
    return result;
  }

  static async updateWorkPermit(id: string, data: WorkPermitUpdateData): Promise<WorkPermit> {
    const response = await fetch(`${API_BASE_URL}/api/work-permits/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al actualizar el permiso de trabajo');
    }

    return response.json();
  }

  static async deleteWorkPermit(id: string, reason?: string): Promise<void> {
    const options: RequestInit = {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    };

    // Only include body and Content-Type if reason is provided
    if (reason) {
      options.body = JSON.stringify({ reason });
    }

    const response = await fetch(`${API_BASE_URL}/api/work-permits/${id}`, options);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al cancelar el permiso de trabajo');
    }
  }

  static async signWorkPermit(id: string): Promise<WorkPermit> {
    const response = await fetch(`${API_BASE_URL}/api/work-permits/${id}/sign`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al firmar el permiso de trabajo');
    }

    return response.json();
  }

  static async approveWorkPermit(id: string, data: ApprovalData): Promise<WorkPermit> {
    const response = await fetch(`${API_BASE_URL}/api/work-permits/${id}/approve`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al procesar la aprobación');
    }

    return response.json();
  }

  static async getWorkPermitStats(companyId?: string, timeframe?: number): Promise<WorkPermitStats> {
    const params = new URLSearchParams();
    if (companyId) params.append('companyId', companyId);
    if (timeframe) params.append('timeframe', timeframe.toString());
    
    const response = await fetch(`${API_BASE_URL}/api/work-permits/stats?${params.toString()}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Error al obtener las estadísticas');
    }

    const result = await response.json();
    
    // Handle both direct response and wrapped response formats
    if (result.success !== undefined) {
      if (!result.success) {
        throw new Error(result.message || 'Error en la respuesta del servidor');
      }
      return result.data;
    }
    
    return result;
  }

  static async getWorkPermitsByContractor(contractorId: string): Promise<WorkPermit[]> {
    const response = await fetch(`${API_BASE_URL}/api/work-permits?contractorId=${contractorId}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Error al obtener los permisos del contratista');
    }

    const data = await response.json();
    return data.permits || [];
  }

  static async getPendingApprovals(department: string): Promise<WorkPermit[]> {
    const response = await fetch(`${API_BASE_URL}/api/work-permits?status=pendiente&department=${department}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Error al obtener los permisos pendientes de aprobación');
    }

    const data = await response.json();
    return data.permits || [];
  }

  static async getExpiringPermits(days: number = 7): Promise<WorkPermit[]> {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    
    const response = await fetch(`${API_BASE_URL}/api/work-permits?status=aprobado&endDate=${endDate.toISOString()}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Error al obtener los permisos próximos a vencer');
    }

    const data = await response.json();
    return data.permits || [];
  }

  static async exportWorkPermits(filters: WorkPermitFilters & { format?: 'csv' | 'excel' }): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.status) params.append('status', filters.status);
    if (filters.companyId) params.append('companyId', filters.companyId);
    if (filters.department) params.append('department', filters.department);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.search) params.append('search', filters.search);
    params.append('format', filters.format || 'excel');

    const response = await fetch(`${API_BASE_URL}/api/work-permits/export?${params.toString()}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Error al exportar los permisos de trabajo');
    }

    return response.blob();
  }
}

export default WorkPermitApi;