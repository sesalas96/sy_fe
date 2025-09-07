import axios from 'axios';

const API_BASE_URL = 'https://sybe-production.up.railway.app';

export interface FileUploadResponse {
  success: boolean;
  fileId: string;
  filename: string;
  originalName: string;
  message?: string;
}

export interface FileInfo {
  _id: string;
  originalName: string;
  uploadedBy: string;
  uploadDate: string;
  fileType: string;
  bucketName: string;
}

class FileService {
  private apiUrl = `${API_BASE_URL}/api/files`;
  private contractorFilesUrl = `${API_BASE_URL}/api/contractor-files`;

  async uploadFile(file: File, userId?: string): Promise<FileUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (userId) {
        formData.append('uploadedBy', userId);
      }

      const response = await axios.post(`${this.apiUrl}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 segundos para subida
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return {
          success: false,
          fileId: '',
          filename: '',
          originalName: file.name,
          message: error.response.data.message || 'Error al subir archivo'
        };
      }
      throw error;
    }
  }

  async uploadMultipleFiles(files: File[], userId?: string): Promise<FileUploadResponse[]> {
    try {
      const uploads = files.map(file => this.uploadFile(file, userId));
      return await Promise.all(uploads);
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw error;
    }
  }

  async getFile(fileId: string): Promise<Blob> {
    const response = await axios.get(`${this.apiUrl}/${fileId}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async getFileInfo(fileId: string): Promise<FileInfo> {
    const response = await axios.get(`${this.apiUrl}/${fileId}/info`);
    return response.data;
  }

  async deleteFile(fileId: string): Promise<{ success: boolean; message: string }> {
    const response = await axios.delete(`${this.apiUrl}/${fileId}`);
    return response.data;
  }

  // Métodos específicos para archivos de contratistas
  async uploadContractorIdentity(userId: string, files: {
    selfie?: File;
    idFront?: File;
    idBack?: File;
  }): Promise<FileUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('userId', userId);
      
      if (files.selfie) formData.append('selfie', files.selfie);
      if (files.idFront) formData.append('idFront', files.idFront);
      if (files.idBack) formData.append('idBack', files.idBack);

      const token = localStorage.getItem('token');
      const response = await axios.post(`${this.contractorFilesUrl}/identity`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        timeout: 30000,
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return {
          success: false,
          fileId: '',
          filename: '',
          originalName: '',
          message: error.response.data.message || 'Error al subir fotos de identidad'
        };
      }
      throw error;
    }
  }

  async uploadContractorDocuments(userId: string, documents: {
    polizaINS?: File;
    ordenPatronal?: File;
    initialCourses?: File[];
    additionalCourses?: File[];
    medicalCertificate?: File;
    contractorLicense?: File;
    backgroundCheck?: File;
  }): Promise<FileUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('userId', userId);
      
      // Documentos individuales
      if (documents.polizaINS) formData.append('polizaINS', documents.polizaINS);
      if (documents.ordenPatronal) formData.append('ordenPatronal', documents.ordenPatronal);
      if (documents.medicalCertificate) formData.append('medicalCertificate', documents.medicalCertificate);
      if (documents.contractorLicense) formData.append('contractorLicense', documents.contractorLicense);
      if (documents.backgroundCheck) formData.append('backgroundCheck', documents.backgroundCheck);
      
      // Arrays de cursos
      if (documents.initialCourses) {
        documents.initialCourses.forEach(file => {
          formData.append('initialCourses', file);
        });
      }
      if (documents.additionalCourses) {
        documents.additionalCourses.forEach(file => {
          formData.append('additionalCourses', file);
        });
      }

      const token = localStorage.getItem('token');
      const response = await axios.post(`${this.contractorFilesUrl}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        timeout: 60000,
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return {
          success: false,
          fileId: '',
          filename: '',
          originalName: '',
          message: error.response.data.message || 'Error al subir documentos'
        };
      }
      throw error;
    }
  }

  async getContractorFiles(userId: string, documentType?: string): Promise<any> {
    const token = localStorage.getItem('token');
    let url = `${this.contractorFilesUrl}/user/${userId}`;
    
    // Agregar parámetro documentType si se especifica
    if (documentType) {
      url += `?documentType=${documentType}`;
    }
    
    console.log('Getting contractor files from URL:', url);
    console.log('UserId:', userId);
    console.log('DocumentType filter:', documentType || 'all');
    console.log('Token:', token ? 'present' : 'missing');
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Contractor files response:', response.data);
    return response.data;
  }

  // Métodos de conveniencia para tipos específicos de documentos
  async getIdentityFiles(userId: string): Promise<any> {
    return this.getContractorFiles(userId, 'identity');
  }

  async getLegalFiles(userId: string): Promise<any> {
    return this.getContractorFiles(userId, 'legal');
  }

  async getMedicalFiles(userId: string): Promise<any> {
    return this.getContractorFiles(userId, 'medical');
  }

  async getCourseFiles(userId: string): Promise<any> {
    return this.getContractorFiles(userId, 'course');
  }

  async downloadContractorFile(fileId: string): Promise<Blob> {
    const token = localStorage.getItem('token');
    const url = `${this.contractorFilesUrl}/download/${fileId}`;
    console.log('Download URL:', url);
    console.log('Token:', token ? 'present' : 'missing');
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      responseType: 'blob'
    });
    return response.data;
  }

  async deleteContractorFile(fileId: string): Promise<{ success: boolean; message: string }> {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`${this.contractorFilesUrl}/${fileId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  }

  async updateContractorDocument(
    userId: string, 
    fieldName: string, 
    file: File, 
    expiryDate?: string
  ): Promise<{ success: boolean; message: string; file?: any }> {
    try {
      const formData = new FormData();
      // The field name should be 'document' according to the CURL example
      formData.append('document', file);
      
      if (expiryDate) {
        formData.append('expiryDate', expiryDate);
      }

      const token = localStorage.getItem('token');
      // Use /user/ instead of /document/ in the URL path
      const response = await axios.put(
        `${this.contractorFilesUrl}/user/${userId}/${fieldName}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
          timeout: 30000,
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return {
          success: false,
          message: error.response.data.message || 'Error al actualizar documento'
        };
      }
      throw error;
    }
  }
}

export const fileService = new FileService();
export default fileService;