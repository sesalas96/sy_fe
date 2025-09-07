// API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://sybe-production.up.railway.app';

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

export interface Inspection {
  _id?: string;
  id?: string;
  inspectionNumber?: string;
  workOrder: string;
  type: 'seguridad' | 'calidad' | 'progreso' | 'final' | 'inicial';
  status: 'programada' | 'en_progreso' | 'completada' | 'fallida' | 'cancelada';
  scheduledDate: string;
  inspector: string;
  description: string;
  actualStartTime?: string;
  actualEndTime?: string;
  location?: string;
  checklist?: ChecklistItem[];
  nonConformities?: NonConformity[];
  score?: number;
  maxScore?: number;
  isPassed?: boolean;
  summary?: string;
  recommendations?: string[];
  attachments?: FileAttachment[];
  signatures?: InspectionSignature[];
  createdAt: string;
  updatedAt: string;
  workOrderData?: any;
  inspectorData?: any;
}

export interface ChecklistItem {
  category: string;
  item: string;
  compliant: boolean;
  comments?: string;
  evidence?: FileAttachment[];
}

export interface FileAttachment {
  filename: string;
  fileUrl: string;
  fileType: string;
}

export interface NonConformity {
  _id?: string;
  id?: string;
  nonConformityNumber?: string;
  category: 'seguridad' | 'calidad' | 'cumplimiento' | 'documentacion' | 'otro';
  severity: 'baja' | 'media' | 'alta' | 'critica';
  description: string;
  location?: string;
  correctiveAction: string;
  dueDate: string;
  status: 'abierta' | 'en_progreso' | 'cerrada' | 'verificada';
  verificationNotes?: string;
  closureEvidence?: FileAttachment[];
  createdAt?: string;
  updatedAt?: string;
}

export interface InspectionSignature {
  role: 'inspector' | 'contractor' | 'client' | 'supervisor';
  signature: string;
  comments?: string;
  signedAt?: string;
}


export interface InspectionFilters {
  search?: string;
  workOrder?: string;
  type?: 'seguridad' | 'calidad' | 'progreso' | 'final' | 'inicial';
  status?: 'programada' | 'en_progreso' | 'completada' | 'fallida' | 'cancelada';
  inspector?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface InspectionStats {
  summary: {
    total: number;
    programadas: number;
    en_progreso: number;
    completadas: number;
    fallidas: number;
    canceladas: number;
    tasaCompletitud: number;
    tiempoPromedioHoras: number;
  };
  byType: Array<{
    type: string;
    count: number;
    completadas: number;
    fallidas: number;
  }>;
  byStatus: Array<{
    status: string;
    count: number;
  }>;
  nonConformitiesByCategory: Array<{
    category: string;
    count: number;
    severity: Record<string, number>;
  }>;
  monthlyTrend: Array<{
    month: string;
    inspections: number;
    completed: number;
    nonConformities: number;
  }>;
}

export class InspectionApi {
  static async getInspections(filters: InspectionFilters = {}): Promise<{ inspections: Inspection[]; total: number; page: number; totalPages: number }> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiCall(`/inspections?${params.toString()}`);
    return response.data || response;
  }

  static async getInspection(id: string): Promise<Inspection> {
    const response = await apiCall(`/inspections/${id}`);
    return response.data || response;
  }

  static async createInspection(data: {
    workOrder: string;
    type: string;
    scheduledDate: string;
    inspector: string;
    description: string;
  }): Promise<Inspection> {
    const response = await apiCall('/inspections', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.data || response;
  }

  static async startInspection(id: string): Promise<Inspection> {
    const response = await apiCall(`/inspections/${id}/start`, {
      method: 'PATCH',
      body: JSON.stringify({})
    });
    return response.data || response;
  }

  static async updateChecklist(inspectionId: string, checklist: ChecklistItem[]): Promise<Inspection> {
    const response = await apiCall(`/inspections/${inspectionId}/checklist`, {
      method: 'PATCH',
      body: JSON.stringify({ checklist })
    });
    return response.data || response;
  }

  static async createNonConformity(inspectionId: string, data: {
    category: string;
    description: string;
    severity: string;
    location?: string;
    correctiveAction: string;
    dueDate: string;
  }): Promise<NonConformity> {
    const response = await apiCall(`/inspections/${inspectionId}/non-conformities`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.data || response;
  }

  static async updateNonConformity(id: string, data: Partial<NonConformity>): Promise<NonConformity> {
    const response = await apiCall(`/non-conformities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return response.data || response;
  }

  static async addSignature(inspectionId: string, signature: InspectionSignature): Promise<InspectionSignature> {
    const response = await apiCall(`/inspections/${inspectionId}/signatures`, {
      method: 'POST',
      body: JSON.stringify(signature)
    });
    return response.data || response;
  }

  static async completeInspection(id: string, data: { summary?: string; recommendations?: string[] }): Promise<Inspection> {
    const response = await apiCall(`/inspections/${id}/complete`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return response.data || response;
  }

  static async closeNonConformity(inspectionId: string, nonConformityNumber: string, data: {
    verificationNotes: string;
    closureEvidence?: FileAttachment[];
  }): Promise<NonConformity> {
    const response = await apiCall(`/inspections/${inspectionId}/non-conformities/${nonConformityNumber}/close`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return response.data || response;
  }

  static async getInspectionStats(): Promise<InspectionStats> {
    const response = await apiCall('/inspections/stats');
    return response.data || response;
  }

  static async deleteInspection(id: string): Promise<void> {
    await apiCall(`/inspections/${id}`, {
      method: 'DELETE'
    });
  }
}