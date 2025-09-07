export interface FormTemplate {
  _id: string;
  name: string;
  description?: string;
  category: string;
  sections: FormSection[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FormSection {
  sectionName: string;
  items: FormItem[];
}

export interface FormItem {
  text: string;
  type: 'checkbox' | 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'textarea';
  required: boolean;
  options?: string[]; // Para select y multiselect
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface FormTemplateCreateData {
  name: string;
  description?: string;
  category: string;
  sections: FormSection[];
  isActive?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const BASE_URL = process.env.REACT_APP_API_URL || 'https://sybe-production.up.railway.app/api';

class FormTemplateApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getAllFormTemplates(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<FormTemplate[]>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.category) queryParams.append('category', params.category);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

      const response = await fetch(`${BASE_URL}/form-templates?${queryParams.toString()}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener formularios');
      }

      return {
        success: true,
        data: result.data || [],
        pagination: result.pagination
      };
    } catch (error) {
      console.error('Error fetching form templates:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener formularios'
      };
    }
  }

  async getFormTemplateById(templateId: string): Promise<ApiResponse<FormTemplate>> {
    try {
      const response = await fetch(`${BASE_URL}/form-templates/${templateId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener formulario');
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('Error fetching form template:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener formulario'
      };
    }
  }

  async createFormTemplate(templateData: FormTemplateCreateData): Promise<ApiResponse<FormTemplate>> {
    try {
      const response = await fetch(`${BASE_URL}/form-templates`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(templateData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al crear formulario');
      }

      return {
        success: true,
        data: result.data,
        message: 'Formulario creado exitosamente'
      };
    } catch (error) {
      console.error('Error creating form template:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al crear formulario'
      };
    }
  }

  async updateFormTemplate(templateId: string, templateData: Partial<FormTemplateCreateData>): Promise<ApiResponse<FormTemplate>> {
    try {
      const response = await fetch(`${BASE_URL}/form-templates/${templateId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(templateData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al actualizar formulario');
      }

      return {
        success: true,
        data: result.data,
        message: 'Formulario actualizado exitosamente'
      };
    } catch (error) {
      console.error('Error updating form template:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al actualizar formulario'
      };
    }
  }

  async deleteFormTemplate(templateId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${BASE_URL}/form-templates/${templateId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al eliminar formulario');
      }

      return {
        success: true,
        message: 'Formulario eliminado exitosamente'
      };
    } catch (error) {
      console.error('Error deleting form template:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al eliminar formulario'
      };
    }
  }

  async toggleFormTemplateStatus(templateId: string): Promise<ApiResponse<FormTemplate>> {
    try {
      const response = await fetch(`${BASE_URL}/form-templates/${templateId}/toggle-status`, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al cambiar estado del formulario');
      }

      return {
        success: true,
        data: result.data,
        message: 'Estado del formulario actualizado'
      };
    } catch (error) {
      console.error('Error toggling form template status:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al cambiar estado del formulario'
      };
    }
  }

  async cloneFormTemplate(templateId: string, newName: string): Promise<ApiResponse<FormTemplate>> {
    try {
      const response = await fetch(`${BASE_URL}/form-templates/${templateId}/clone`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ name: newName })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al clonar formulario');
      }

      return {
        success: true,
        data: result.data,
        message: 'Formulario clonado exitosamente'
      };
    } catch (error) {
      console.error('Error cloning form template:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al clonar formulario'
      };
    }
  }

  async getFormTemplateCategories(): Promise<ApiResponse<string[]>> {
    try {
      const response = await fetch(`${BASE_URL}/form-templates/categories`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener categorías');
      }

      return {
        success: true,
        data: result.data || []
      };
    } catch (error) {
      console.error('Error fetching form categories:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener categorías'
      };
    }
  }
}

export const formTemplateApi = new FormTemplateApiService();