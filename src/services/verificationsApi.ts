import { getApiUrl } from '../config';

const API_URL = getApiUrl();

class VerificationsApi {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Get all verifications for the current user
  async getUserVerifications() {
    try {
      const response = await fetch(`${API_URL}/api/verifications/users/me/all`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error('Error al obtener verificaciones');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching user verifications:', error);
      throw error;
    }
  }

  // Get verifications for a specific company
  async getUserCompanyVerifications(userId: string, companyId: string) {
    try {
      const response = await fetch(`${API_URL}/api/verifications/users/${userId}/companies/${companyId}`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error('Error al obtener verificaciones de la compañía');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching company verifications:', error);
      throw error;
    }
  }

  // Submit verification
  async submitVerification(companyId: string, verificationId: string, data: {
    documentUrl: string;
    certificateNumber?: string;
    expiryDate?: string;
    notes?: string;
  }) {
    try {
      const response = await fetch(`${API_URL}/api/verifications/companies/${companyId}/verifications/${verificationId}/submit`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Error al enviar verificación');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error submitting verification:', error);
      throw error;
    }
  }

  // Check if user has pending verifications
  async hasPendingVerifications() {
    try {
      const verifications = await this.getUserVerifications();
      
      return verifications.some((companyVer: any) => {
        const { verifications } = companyVer;
        return verifications.pending > 0 || verifications.expired > 0 || 
               verifications.completed < verifications.required;
      });
    } catch (error) {
      console.error('Error checking pending verifications:', error);
      return false;
    }
  }

  // Company verifications CRUD operations
  
  // Get all verifications for a company
  async getCompanyVerifications(companyId: string) {
    try {
      const response = await fetch(`${API_URL}/api/verifications/companies/${companyId}`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error('Error al obtener verificaciones de la compañía');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching company verifications:', error);
      throw error;
    }
  }

  // Create new verification for a company
  async createCompanyVerification(companyId: string, verification: {
    name: string;
    type: string;
    isRequired: boolean;
    validityPeriod?: number;
    category?: string;
    description?: string;
    renewalNoticePeriod?: number;
    renewalNoticePercentages?: number[];
  }) {
    try {
      const response = await fetch(`${API_URL}/api/verifications/companies/${companyId}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(verification)
      });

      if (!response.ok) {
        throw new Error('Error al crear verificación');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating verification:', error);
      throw error;
    }
  }

  // Update verification
  async updateVerification(verificationId: string, updates: {
    name?: string;
    type?: string;
    isRequired?: boolean;
    validityPeriod?: number;
    category?: string;
    description?: string;
    renewalNoticePeriod?: number;
    renewalNoticePercentages?: number[];
  }) {
    try {
      const response = await fetch(`${API_URL}/api/verifications/${verificationId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Error al actualizar verificación');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating verification:', error);
      throw error;
    }
  }

  // Delete verification
  async deleteVerification(verificationId: string) {
    try {
      const response = await fetch(`${API_URL}/api/verifications/${verificationId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error('Error al eliminar verificación');
      }

      return true;
    } catch (error) {
      console.error('Error deleting verification:', error);
      throw error;
    }
  }

  // Get company verification statistics
  async getCompanyVerificationStats(companyId: string) {
    try {
      const response = await fetch(`${API_URL}/api/verifications/companies/${companyId}/stats`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error('Error al obtener estadísticas de verificaciones');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching verification stats:', error);
      throw error;
    }
  }
}

export const verificationsApi = new VerificationsApi();