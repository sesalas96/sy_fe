export interface Form {
  _id: string;
  code?: string;
  name: string;
  description?: string;
  category: string;
  requiredFor?: string[];
  tags?: string[];
  metadata?: {
    estimatedCompletionTime?: number;
    requiresApproval?: boolean;
    approvalRoles?: string[];
    attachmentRequired?: boolean;
    expirationDays?: number;
  };
  sections: FormSection[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  fields: FormField[];
}

export interface FormField {
  id: string;
  label: string;
  name: string;
  type: 'checkbox' | 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'textarea' | 'radio' | 'signature' | 'file';
  required: boolean;
  order: number;
  options?: Array<{ value: string; label: string }> | string[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  conditional?: {
    showIf: {
      field: string;
      operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan';
      value: any;
    };
  };
  placeholder?: string;
  helperText?: string;
}

export interface FormCreateData {
  name: string;
  description?: string;
  category: string;
  requiredFor?: string[];
  tags?: string[];
  metadata?: {
    estimatedCompletionTime?: number;
    requiresApproval?: boolean;
    approvalRoles?: string[];
    attachmentRequired?: boolean;
    expirationDays?: number;
  };
  sections: FormSection[];
}

export interface FormStats {
  totalForms: number;
  activeForms: number;
  byCategory: Array<{
    category: string;
    count: number;
  }>;
  byWorkPermitCategory: Array<{
    category: string;
    count: number;
  }>;
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

class FormsApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Listar formularios
  async getAllForms(params?: {
    page?: number;
    limit?: number;
    category?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<Form[]>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.category) queryParams.append('category', params.category);
      if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

      const response = await fetch(`${BASE_URL}/forms?${queryParams.toString()}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener formularios');
      }

      return {
        success: true,
        data: result.data || result.forms || [],
        pagination: result.pagination
      };
    } catch (error) {
      console.error('Error fetching forms:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener formularios'
      };
    }
  }

  // Buscar formularios
  async searchForms(query: string, limit?: number): Promise<ApiResponse<Form[]>> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('q', query);
      if (limit) queryParams.append('limit', limit.toString());

      const response = await fetch(`${BASE_URL}/forms/templates/search?${queryParams.toString()}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al buscar formularios');
      }

      return {
        success: true,
        data: result.data || result.forms || []
      };
    } catch (error) {
      console.error('Error searching forms:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al buscar formularios'
      };
    }
  }

  // Obtener formulario por ID
  async getFormById(formId: string): Promise<ApiResponse<Form>> {
    try {
      const response = await fetch(`${BASE_URL}/forms/${formId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener formulario');
      }

      return {
        success: true,
        data: result.data || result.form
      };
    } catch (error) {
      console.error('Error fetching form:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener formulario'
      };
    }
  }

  // Crear formulario
  async createForm(formData: FormCreateData): Promise<ApiResponse<Form>> {
    try {
      const response = await fetch(`${BASE_URL}/forms`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al crear formulario');
      }

      return {
        success: true,
        data: result.data || result.form,
        message: 'Formulario creado exitosamente'
      };
    } catch (error) {
      console.error('Error creating form:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al crear formulario'
      };
    }
  }

  // Actualizar formulario
  async updateForm(formId: string, formData: Partial<FormCreateData>): Promise<ApiResponse<Form>> {
    try {
      const response = await fetch(`${BASE_URL}/forms/${formId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al actualizar formulario');
      }

      return {
        success: true,
        data: result.data || result.form,
        message: 'Formulario actualizado exitosamente'
      };
    } catch (error) {
      console.error('Error updating form:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al actualizar formulario'
      };
    }
  }

  // Duplicar formulario
  async duplicateForm(formId: string, newName: string): Promise<ApiResponse<Form>> {
    try {
      const response = await fetch(`${BASE_URL}/forms/templates/${formId}/duplicate`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ name: newName })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al duplicar formulario');
      }

      return {
        success: true,
        data: result.data || result.form,
        message: 'Formulario duplicado exitosamente'
      };
    } catch (error) {
      console.error('Error duplicating form:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al duplicar formulario'
      };
    }
  }

  // Desactivar formulario (soft delete)
  async deleteForm(formId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${BASE_URL}/forms/${formId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al desactivar formulario');
      }

      return {
        success: true,
        message: 'Formulario desactivado exitosamente'
      };
    } catch (error) {
      console.error('Error deleting form:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al desactivar formulario'
      };
    }
  }

  // Obtener formularios por categoría
  async getFormsByCategory(category: string, includeInactive = false): Promise<ApiResponse<Form[]>> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('includeInactive', includeInactive.toString());

      const response = await fetch(`${BASE_URL}/forms/templates/category/${category}?${queryParams.toString()}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener formularios por categoría');
      }

      return {
        success: true,
        data: result.data || result.forms || []
      };
    } catch (error) {
      console.error('Error fetching forms by category:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener formularios por categoría'
      };
    }
  }

  // Obtener formularios por categoría de permiso de trabajo
  async getFormsByWorkPermitCategory(category: string): Promise<ApiResponse<Form[]>> {
    try {
      const response = await fetch(`${BASE_URL}/forms/templates/work-permit-category/${category}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener formularios');
      }

      return {
        success: true,
        data: result.data || result.forms || []
      };
    } catch (error) {
      console.error('Error fetching forms by work permit category:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener formularios'
      };
    }
  }

  // Obtener estadísticas de formularios
  async getFormStats(): Promise<ApiResponse<FormStats>> {
    try {
      const response = await fetch(`${BASE_URL}/forms/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener estadísticas');
      }

      return {
        success: true,
        data: result.data || result.stats
      };
    } catch (error) {
      console.error('Error fetching form stats:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener estadísticas'
      };
    }
  }
}

export const formsApi = new FormsApiService();