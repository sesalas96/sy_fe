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

export interface WorkRequest {
  _id: string;
  id?: string; // For compatibility
  requestNumber: string;
  title: string;
  description: string;
  serviceId?: string; // For compatibility
  service?: {
    _id: string;
    name: string;
    code: string;
    billingUnit: string;
  };
  requestedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  clientId?: string; // For compatibility
  company?: {
    _id: string;
    name: string;
  };
  clientCompanyId?: string; // For compatibility
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'baja' | 'media' | 'alta' | 'urgente';
  status: 'draft' | 'published' | 'bidding' | 'awarded' | 'completed' | 'cancelled' | 'borrador' | 'publicado' | 'licitando' | 'adjudicado' | 'completado' | 'cancelado' | 'pending' | 'pendiente' | 'in_review' | 'en_revision';
  requestedDate: string;
  requestedStartDate?: string; // For compatibility
  requestedEndDate?: string; // For compatibility
  timeWindow: {
    start: string;
    end: string;
    isFlexible?: boolean;
  };
  location: {
    address: string;
    coordinates?: { lat: number; lng: number };
  };
  estimatedBudget?: {
    currency: string;
    min?: number;
    max?: number;
  };
  budget?: number; // For compatibility
  currency?: string; // For compatibility
  requirements?: string[];
  attachments: string[];
  bids?: Bid[];
  tags?: string[];
  publishedAt?: string;
  biddingDeadline?: string;
  awardedBidId?: string;
  createdAt: string;
  updatedAt: string;
  bidCount?: number;
}

export interface Bid {
  id: string;
  workRequestId: string;
  contractorId: string;
  contractorCompanyId: string;
  totalPrice: number;
  currency: string;
  proposedStartDate: string;
  proposedEndDate: string;
  laborCost: number;
  materialsCost: number;
  equipmentCost: number;
  otherCosts: number;
  notes: string;
  status: 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'withdrawn';
  validUntil: string;
  milestones: BidMilestone[];
  attachments: string[];
  createdAt: string;
  updatedAt: string;
  contractor?: any;
  contractorCompany?: any;
  workRequest?: WorkRequest;
}

export interface BidMilestone {
  id: string;
  name: string;
  description: string;
  plannedDate: string;
  estimatedHours: number;
  percentage: number;
}

export interface WorkRequestFilters {
  search?: string;
  serviceId?: string;
  clientCompanyId?: string;
  priority?: string;
  status?: string;
  minBudget?: number;
  maxBudget?: number;
  startDate?: string;
  endDate?: string;
  location?: string;
  page?: number;
  limit?: number;
}

export interface BidFilters {
  workRequestId?: string;
  contractorId?: string;
  contractorCompanyId?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface WorkRequestStats {
  totalRequests: number;
  publishedRequests: number;
  biddingRequests: number;
  awardedRequests: number;
  avgBudget: number;
  avgBidsPerRequest: number;
}

export interface WorkRequestStatsResponse {
  success: boolean;
  stats: {
    summary: {
      _id: null;
      total: number;
      pending: number;
      published: number;
      inProgress: number;
      completed: number;
      canceled: number;
      avgBudgetMin: number | null;
      avgBudgetMax: number | null;
    };
    byStatus: Array<{
      _id: string;
      count: number;
      totalBudgetMin: number;
      totalBudgetMax: number;
    }>;
    byPriority: Array<{
      _id: string;
      count: number;
    }>;
    byService: Array<{
      _id: string;
      count: number;
      serviceName: string;
      serviceCode: string;
    }>;
    monthlyTrend: Array<{
      _id: {
        year: number;
        month: number;
      };
      count: number;
      completedCount: number;
      canceledCount: number;
    }>;
    recentRequests: WorkRequest[];
  };
}

export class WorkRequestApi {
  static async getWorkRequests(filters: WorkRequestFilters = {}): Promise<{ requests: WorkRequest[]; total: number; page: number; totalPages: number }> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiCall(`/work-requests?${params.toString()}`);
    
    // Handle the actual backend response structure
    if (response.success && response.workRequests) {
      return {
        requests: response.workRequests,
        total: response.pagination?.total || 0,
        page: response.pagination?.page || 1,
        totalPages: response.pagination?.pages || 1
      };
    }
    
    return response.data || response;
  }

  static async getWorkRequest(id: string): Promise<WorkRequest> {
    const response = await apiCall(`/work-requests/${id}`);
    
    // Handle the actual backend response structure
    if (response.success && response.workRequest) {
      return response.workRequest;
    }
    
    return response.data || response;
  }

  static async createWorkRequest(data: any): Promise<WorkRequest> {
    const response = await apiCall('/work-requests', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.data || response;
  }

  static async updateWorkRequest(id: string, data: any): Promise<WorkRequest> {
    const response = await apiCall(`/work-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    
    // Handle the actual backend response structure
    if (response.success && response.workRequest) {
      return response.workRequest;
    }
    
    return response.data || response;
  }

  static async publishWorkRequest(id: string): Promise<WorkRequest> {
    console.log('API: Publishing work request directly');
    
    const response = await apiCall(`/work-requests/${id}/publish`, {
      method: 'PATCH'
    });
    return response.data || response;
  }

  static async updateWorkRequestStatus(id: string, status: string): Promise<WorkRequest> {
    console.log('API: Updating work request status to:', status);
    
    const response = await apiCall(`/work-requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    return response.data || response;
  }

  static async awardBid(workRequestId: string, bidId: string): Promise<WorkRequest> {
    const response = await apiCall(`/work-requests/${workRequestId}/award`, {
      method: 'POST',
      body: JSON.stringify({ bidId })
    });
    return response.data || response;
  }

  static async deleteWorkRequest(id: string): Promise<void> {
    await apiCall(`/work-requests/${id}`, {
      method: 'DELETE'
    });
  }

  static async getWorkRequestStats(): Promise<WorkRequestStatsResponse> {
    const response = await apiCall('/work-requests/stats');
    return response.data || response;
  }
}

export class BidsApi {
  static async getBids(filters: BidFilters = {}): Promise<{ bids: Bid[]; total: number; page: number; totalPages: number }> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiCall(`/bids?${params.toString()}`);
    return response.data || response;
  }

  static async getBid(id: string): Promise<Bid> {
    const response = await apiCall(`/bids/${id}`);
    return response.data || response;
  }

  static async createBid(data: Omit<Bid, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Bid> {
    const response = await apiCall('/bids', {
      method: 'POST',
      body: JSON.stringify({ ...data, status: 'submitted' })
    });
    return response.data || response;
  }

  static async updateBid(id: string, data: Partial<Bid>): Promise<Bid> {
    const response = await apiCall(`/bids/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return response.data || response;
  }

  static async withdrawBid(id: string): Promise<Bid> {
    const response = await apiCall(`/bids/${id}/withdraw`, {
      method: 'POST'
    });
    return response.data || response;
  }

  static async deleteBid(id: string): Promise<void> {
    await apiCall(`/bids/${id}`, {
      method: 'DELETE'
    });
  }
}