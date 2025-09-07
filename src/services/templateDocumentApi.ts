export interface TemplateDocument {
  _id: string;
  filename: string;
  originalName: string;
  description?: string;
  documentType: 'requirement' | 'example' | 'instruction' | 'other';
  size: number;
  mimetype: string;
  uploadedBy: {
    _id: string;
    nombre: string;
    apellido: string;
  };
  uploadedAt: string;
  url?: string;
}

export interface TemplateDocumentFormData {
  description?: string;
  documentType: 'requirement' | 'example' | 'instruction' | 'other';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

class TemplateDocumentApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`
    };
  }

  private getAuthHeadersWithJson() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Upload document
  async uploadDocument(
    templateId: string, 
    file: File, 
    data: TemplateDocumentFormData
  ): Promise<ApiResponse<TemplateDocument>> {
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('description', data.description || '');
      formData.append('documentType', data.documentType);

      const response = await fetch(`${BASE_URL}/work-permits/${templateId}/documents`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al subir documento');
      }

      return {
        success: true,
        data: result.data,
        message: 'Documento subido exitosamente'
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al subir documento'
      };
    }
  }

  // Get all documents
  async getDocuments(templateId: string): Promise<ApiResponse<TemplateDocument[]>> {
    try {
      const response = await fetch(`${BASE_URL}/work-permits/${templateId}/documents`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener documentos');
      }

      return {
        success: true,
        data: result.data || []
      };
    } catch (error) {
      console.error('Error fetching documents:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener documentos'
      };
    }
  }

  // Get specific document
  async getDocument(templateId: string, documentId: string): Promise<ApiResponse<TemplateDocument>> {
    try {
      const response = await fetch(`${BASE_URL}/work-permits/${templateId}/documents/${documentId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener documento');
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('Error fetching document:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener documento'
      };
    }
  }

  // Update document metadata
  async updateDocument(
    templateId: string, 
    documentId: string, 
    data: Partial<TemplateDocumentFormData>
  ): Promise<ApiResponse<TemplateDocument>> {
    try {
      const response = await fetch(`${BASE_URL}/work-permits/${templateId}/documents/${documentId}`, {
        method: 'PUT',
        headers: this.getAuthHeadersWithJson(),
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al actualizar documento');
      }

      return {
        success: true,
        data: result.data,
        message: 'Documento actualizado exitosamente'
      };
    } catch (error) {
      console.error('Error updating document:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al actualizar documento'
      };
    }
  }

  // Delete document
  async deleteDocument(templateId: string, documentId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${BASE_URL}/work-permits/${templateId}/documents/${documentId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al eliminar documento');
      }

      return {
        success: true,
        message: 'Documento eliminado exitosamente'
      };
    } catch (error) {
      console.error('Error deleting document:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al eliminar documento'
      };
    }
  }

  // Download document
  async downloadDocument(templateId: string, documentId: string, inline: boolean = false): Promise<void> {
    try {
      const url = `${BASE_URL}/work-permits/${templateId}/documents/${documentId}/download${inline ? '?inline=true' : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Error al descargar documento');
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'documento';

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      if (inline) {
        // Open in new tab for preview
        const fileURL = URL.createObjectURL(blob);
        window.open(fileURL, '_blank');
      } else {
        // Download file
        const a = document.createElement('a');
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
  }

  // Get document download URL
  getDocumentUrl(templateId: string, documentId: string, inline: boolean = false): string {
    return `${BASE_URL}/work-permits/${templateId}/documents/${documentId}/download${inline ? '?inline=true' : ''}`;
  }
}

export const templateDocumentApi = new TemplateDocumentApiService();