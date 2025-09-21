import apiClient from './apiClient';

export interface UserVerificationCompany {
  id: string;
  name: string;
  role: string;
  isActive: boolean;
  isPrimary: boolean;
}

export interface VerificationDetail {
  id: string;
  name: string;
  type: string;
  category?: string;
  description?: string;
  isRequired: boolean;
  status: 'not_submitted' | 'pending' | 'in_review' | 'approved' | 'rejected' | 'expired';
  documentUrl?: string;
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
      const response = await apiClient.get('/api/verifications/users/me/all');
      return response.data;
    } catch (error) {
      console.error('Error fetching user verifications:', error);
      throw error;
    }
  }

  // Get verifications for a specific user (requires permissions)
  async getUserVerifications(userId: string): Promise<UserCompanyVerifications[]> {
    try {
      const response = await apiClient.get(`/api/verifications/users/${userId}/all`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user verifications:', error);
      throw error;
    }
  }

  // Get user verifications for a specific company
  async getUserCompanyVerifications(userId: string, companyId: string): Promise<UserCompanyVerifications> {
    try {
      const response = await apiClient.get(`/api/verifications/users/${userId}/companies/${companyId}`);
      return response.data;
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
      const response = await apiClient.post(
        `/api/verifications/companies/${companyId}/verifications/${verificationId}/submit`,
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error submitting verification:', error);
      throw error;
    }
  }

  // Upload document for verification
  async uploadVerificationDocument(file: File): Promise<{ url: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiClient.post('/api/upload/verification-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error uploading verification document:', error);
      throw error;
    }
  }
}

export const userVerificationsApi = new UserVerificationsApi();