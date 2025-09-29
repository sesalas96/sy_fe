const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Helper function for API calls
const apiCall = async (method: string, endpoint: string, data?: any) => {
  const token = localStorage.getItem('token');
  
  const config: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  if (data && method !== 'GET') {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(errorData.message || 'API call failed');
  }

  return response.json();
};

export interface UserVerificationCompany {
  id: string;
  name: string;
  role: string;
  isActive: boolean;
  isPrimary: boolean;
}

export interface VerificationDetail {
  id: string; // Template verification ID
  _id?: string; // Alternative field for UserCompanyVerification ID
  userVerificationId?: string; // UserCompanyVerification ID (for submitted verifications)
  userCompanyVerificationId?: string; // Another possible field name
  name: string;
  type: string;
  category?: string;
  description?: string;
  isRequired: boolean;
  status: 'not_submitted' | 'pending' | 'in_review' | 'approved' | 'rejected' | 'expired';
  documentUrl?: string;
  documentoId?: string; // GridFS document ID
  certificateNumber?: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  expiryDate?: string;
  validityPeriod?: number;
  renewalNoticePercentages?: number[];
}

export interface UserCompanyVerifications {
  company: UserVerificationCompany;
  verifications: {
    total: number;
    required: number;
    completed: number;
    pending: number;
    expired: number;
    details: VerificationDetail[];
  };
  complianceStatus: 'compliant' | 'partial' | 'non_compliant';
}

export interface SubmitVerificationData {
  documentUrl?: string;
  certificateNumber?: string;
  expiryDate?: string;
  notes?: string;
}

class UserVerificationsApi {
  // Get all verifications for the current user across all companies
  async getMyVerifications(): Promise<UserCompanyVerifications[]> {
    try {
      // First try to get from auth/me endpoint
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Auth/me response:', data);
          
          // Check if companiesVerifications exists in the response
          if (data.user && data.user.companiesVerifications) {
            console.log('Found companiesVerifications in user data');
            return data.user.companiesVerifications;
          }
        }
      }
      
      // Fallback to verifications endpoint
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || user._id;
      if (!userId) throw new Error('User ID not found');
      
      console.log('Falling back to verifications endpoint');
      const result = await apiCall('GET', `/api/verifications/users/${userId}/all`);
      
      // Handle response format
      if (result.success && result.data) {
        return result.data;
      }
      return result;
    } catch (error) {
      console.error('Error fetching user verifications:', error);
      throw error;
    }
  }

  // Get verifications for a specific user (requires permissions)
  async getUserVerifications(userId: string): Promise<UserCompanyVerifications[]> {
    try {
      const result = await apiCall('GET', `/api/verifications/users/${userId}/all`);
      
      // Handle response format
      if (result.success && result.data) {
        return result.data;
      }
      return result;
    } catch (error) {
      console.error('Error fetching user verifications:', error);
      throw error;
    }
  }

  // Get user verifications for a specific company
  async getUserCompanyVerifications(userId: string, companyId: string): Promise<UserCompanyVerifications> {
    try {
      return await apiCall('GET', `/api/verifications/users/${userId}/companies/${companyId}`);

    } catch (error) {
      console.error('Error fetching user company verifications:', error);
      throw error;
    }
  }

  // Submit or update a verification
  async submitVerification(
    companyId: string, 
    verificationId: string, 
    data: SubmitVerificationData
  ): Promise<any> {
    try {
      return await apiCall('POST', `/api/verifications/companies/${companyId}/verifications/${verificationId}/submit`, data);
    } catch (error) {
      console.error('Error submitting verification:', error);
      throw error;
    }
  }

  // Upload document for verification
  async uploadVerificationDocument(file: File): Promise<{ url: string }> {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE_URL}/api/upload/verification-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(errorData.message || 'Upload failed');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error uploading verification document:', error);
      throw error;
    }
  }

  // Review a user verification (approve or reject)
  async reviewVerification(
    userVerificationId: string,
    decision: 'approve' | 'reject',
    rejectionReason?: string,
    expiryDate?: string
  ): Promise<any> {
    try {
      const data: any = { 
        status: decision === 'approve' ? 'approved' : 'rejected' 
      };
      
      if (decision === 'approve' && expiryDate) {
        data.expiryDate = expiryDate;
      }
      
      if (decision === 'reject' && rejectionReason) {
        data.rejectionReason = rejectionReason;
      }
      
      return await apiCall('PUT', `/api/verifications/user-verifications/${userVerificationId}/review`, data);
    } catch (error) {
      console.error('Error reviewing verification:', error);
      throw error;
    }
  }
}

export const userVerificationsApi = new UserVerificationsApi();