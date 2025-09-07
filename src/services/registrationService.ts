import axios from 'axios';
import { UserRole } from '../types';

const API_BASE_URL = 'http://localhost:3000';

export interface RegistrationRole {
  value: UserRole;
  label: string;
  description: string;
}

export interface RegistrationSession {
  sessionId: string;
  role: UserRole;
  currentStep: number;
  expiresAt: string;
}

export interface StepData {
  [key: string]: any;
}

export interface FieldValidation {
  field: string;
  value: any;
  role: UserRole;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export interface StepInfo {
  step: number;
  title: string;
  fields: FieldInfo[];
  data: StepData;
}

export interface FieldInfo {
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  helperText?: string;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

class RegistrationService {
  private apiUrl = `${API_BASE_URL}/api/registration`;
  private authUrl = `${API_BASE_URL}/api/auth`;

  async getRoles(): Promise<RegistrationRole[]> {
    const response = await axios.get(`${this.apiUrl}/roles`);
    return response.data;
  }

  async startRegistration(role: UserRole): Promise<RegistrationSession> {
    const response = await axios.post(`${this.apiUrl}/start`, { role });
    return response.data;
  }

  async getCurrentStep(sessionId: string): Promise<StepInfo> {
    const response = await axios.get(`${this.apiUrl}/session/${sessionId}/current`);
    return response.data;
  }

  async submitStep(sessionId: string, data: StepData | FormData): Promise<{
    success: boolean;
    currentStep?: number;
    completed?: boolean;
    message?: string;
    errors?: { [field: string]: string };
    userId?: string; // ID del usuario creado cuando el registro se completa
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
      isActive: boolean;
      status: string;
    };
  }> {
    try {
      // Configurar headers apropiados para FormData (imágenes)
      const config = data instanceof FormData ? {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 segundos para subida de imágenes
      } : {
        headers: {
          'Content-Type': 'application/json',
        }
      };

      const response = await axios.post(`${this.apiUrl}/session/${sessionId}/submit`, data, config);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  async previousStep(sessionId: string): Promise<{
    success: boolean;
    currentStep: number;
  }> {
    const response = await axios.post(`${this.apiUrl}/session/${sessionId}/previous`);
    return response.data;
  }

  async validateField(validation: FieldValidation): Promise<ValidationResult> {
    try {
      const response = await axios.post(`${this.apiUrl}/validate-field`, validation);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return { valid: false, message: 'Error de validación' };
    }
  }

  formatCedula(value: string): string {
    // Quitar todos los caracteres no numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Aplicar formato 1-2345-6789
    if (numbers.length <= 1) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 1)}-${numbers.slice(1)}`;
    return `${numbers.slice(0, 1)}-${numbers.slice(1, 5)}-${numbers.slice(5, 9)}`;
  }

  validatePassword(password: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Debe tener al menos 8 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Debe contener al menos una mayúscula');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Debe contener al menos una minúscula');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Debe contener al menos un número');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Debe contener al menos un carácter especial');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async verifyEmail(email: string): Promise<{
    success: boolean;
    exists?: boolean;
    message?: string;
    error?: string;
    retryAfter?: number;
  }> {
    try {
      const response = await axios.post(`${this.authUrl}/verify-email`, {
        email
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  async validateTemporaryCode(code: string): Promise<{
    success: boolean;
    valid?: boolean;
    message?: string;
    error?: string;
    data?: {
      code?: string;
      company?: {
        id?: string;
        name?: string;
      };
      role?: string;
      description?: string;
      usesRemaining?: number;
      expiresAt?: string;
    };
  }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/temporary-codes/validate`, {
        code
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  async deleteSession(sessionId: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    sessionId?: string;
  }> {
    try {
      const response = await axios.delete(`${this.apiUrl}/session/${sessionId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  async uploadUserDocuments(userId: string, documents: { [fieldName: string]: File }): Promise<{
    success: boolean;
    uploadedFiles: { [fieldName: string]: string }; // fieldName -> fileId
    errors?: { [fieldName: string]: string };
    message?: string;
  }> {
    try {
      const formData = new FormData();
      formData.append('userId', userId);
      
      // Separar archivos de identidad vs documentos
      const identityFields = ['selfie', 'idFront', 'idBack'];
      const identityFiles: { [key: string]: File } = {};
      const documentFiles: { [key: string]: File } = {};
      
      Object.keys(documents).forEach(fieldName => {
        if (identityFields.includes(fieldName)) {
          identityFiles[fieldName] = documents[fieldName];
        } else {
          documentFiles[fieldName] = documents[fieldName];
        }
      });
      
      let uploadResults: any = { success: true, uploadedFiles: {} };
      
      // Subir fotos de identidad si las hay
      if (Object.keys(identityFiles).length > 0) {
        const identityFormData = new FormData();
        identityFormData.append('userId', userId);
        
        Object.keys(identityFiles).forEach(fieldName => {
          identityFormData.append(fieldName, identityFiles[fieldName]);
        });
        
        const token = localStorage.getItem('token');
        const identityResponse = await axios.post(`${API_BASE_URL}/api/contractor-files/identity`, identityFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
          timeout: 60000,
        });
        
        if (identityResponse.data.success) {
          uploadResults.uploadedFiles = { ...uploadResults.uploadedFiles, ...identityResponse.data.uploadedFiles };
        } else {
          return identityResponse.data;
        }
      }
      
      // Subir documentos si los hay
      if (Object.keys(documentFiles).length > 0) {
        const docFormData = new FormData();
        docFormData.append('userId', userId);
        
        Object.keys(documentFiles).forEach(fieldName => {
          docFormData.append(fieldName, documentFiles[fieldName]);
        });
        
        const token = localStorage.getItem('token');
        const docResponse = await axios.post(`${API_BASE_URL}/api/contractor-files/documents`, docFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
          timeout: 60000,
        });
        
        if (docResponse.data.success) {
          uploadResults.uploadedFiles = { ...uploadResults.uploadedFiles, ...docResponse.data.uploadedFiles };
        } else {
          return docResponse.data;
        }
      }
      
      return uploadResults;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }
}

export const registrationService = new RegistrationService();