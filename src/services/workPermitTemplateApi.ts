export interface WorkPermitTemplate {
  _id: string;
  name: string;
  description?: string;
  category: string;
  fields?: TemplateField[];
  requiredForms?: TemplateForm[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Campos adicionales del template
  workDescription?: string;
  defaultLocation?: string;
  defaultDuration?: number;
  identifiedRisks?: string[];
  toolsToUse?: string[];
  requiredPPE?: string[];
  equipmentType?: string[];
  safetyControls?: Array<{
    item: string;
    description?: string;
    checked: boolean;
    isCritical?: boolean;
    requiresRemedialPlan?: boolean;
    remedialPlan?: string;
    order?: number;
    category?: string;
    verificationMethod?: string;
    acceptanceCriteria?: string;
    _id?: string;
  }>;
  requiredApprovals?: string[];
  weatherConditions?: {
    maxWindSpeed?: number;
    prohibitedConditions?: string[];
  };
  code?: string;
  isGlobal?: boolean;
  usageCount?: number;
  version?: number;
}

export interface TemplateForm {
  form: string | any; // ID del formulario o objeto completo
  mandatory: boolean;
  order: number;
  condition?: {
    field: string;
    operator: string;
    value: any;
  };
}

export interface TemplateField {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';
  label: string;
  required: boolean;
  options?: string[];
  defaultValue?: any;
}

export interface WorkPermitTemplateFormData {
  name: string;
  description?: string;
  category: string;
  fields: TemplateField[];
  isActive?: boolean;
  requiredForms?: TemplateForm[];
  workDescription?: string;
  defaultLocation?: string;
  identifiedRisks?: string[];
  toolsToUse?: string[];
  requiredPPE?: string[];
  safetyControls?: Array<{
    item: string;
    description?: string;
    checked: boolean;
  }>;
  requiredApprovals?: string[];
  requiredDocuments?: Array<{
    name: string;
    required: boolean;
    description?: string;
  }>;
}

export interface TemplateCategory {
  _id: string;
  name: string;
  description?: string;
  templateCount: number;
}

export interface ApiResponse<T> {
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

class WorkPermitTemplateApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Template CRUD operations
  async getAllTemplates(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<WorkPermitTemplate[]>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.category) queryParams.append('category', params.category);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

      const response = await fetch(`${BASE_URL}/api/work-permit-templates?${queryParams.toString()}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener templates');
      }

      return {
        success: true,
        data: result.data || [],
        pagination: result.pagination
      };
    } catch (error) {
      console.error('Error fetching templates:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener templates'
      };
    }
  }

  async getTemplateById(templateId: string): Promise<ApiResponse<WorkPermitTemplate>> {
    try {
      const response = await fetch(`${BASE_URL}/api/work-permit-templates/${templateId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener template');
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('Error fetching template:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener template'
      };
    }
  }

  async createTemplate(templateData: WorkPermitTemplateFormData): Promise<ApiResponse<WorkPermitTemplate>> {
    try {
      const response = await fetch(`${BASE_URL}/api/work-permit-templates`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(templateData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al crear template');
      }

      return {
        success: true,
        data: result.data,
        message: 'Template creado exitosamente'
      };
    } catch (error) {
      console.error('Error creating template:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al crear template'
      };
    }
  }

  async updateTemplate(templateId: string, templateData: Partial<WorkPermitTemplateFormData>): Promise<ApiResponse<WorkPermitTemplate>> {
    try {
      const response = await fetch(`${BASE_URL}/api/work-permit-templates/${templateId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(templateData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al actualizar template');
      }

      return {
        success: true,
        data: result.data,
        message: 'Template actualizado exitosamente'
      };
    } catch (error) {
      console.error('Error updating template:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al actualizar template'
      };
    }
  }

  async deleteTemplate(templateId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${BASE_URL}/api/work-permit-templates/${templateId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al eliminar template');
      }

      return {
        success: true,
        message: 'Template eliminado exitosamente'
      };
    } catch (error) {
      console.error('Error deleting template:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al eliminar template'
      };
    }
  }

  // Category operations
  async getCategories(): Promise<ApiResponse<TemplateCategory[]>> {
    try {
      const response = await fetch(`${BASE_URL}/api/work-permit-templates/categories`, {
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
      console.error('Error fetching categories:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener categorías'
      };
    }
  }

  // Template activation/deactivation
  async toggleTemplateStatus(templateId: string): Promise<ApiResponse<WorkPermitTemplate>> {
    try {
      const response = await fetch(`${BASE_URL}/api/work-permit-templates/${templateId}/toggle-status`, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al cambiar estado del template');
      }

      return {
        success: true,
        data: result.data,
        message: 'Estado del template actualizado'
      };
    } catch (error) {
      console.error('Error toggling template status:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al cambiar estado del template'
      };
    }
  }

  // Clone template
  async cloneTemplate(templateId: string, newName: string): Promise<ApiResponse<WorkPermitTemplate>> {
    try {
      const response = await fetch(`${BASE_URL}/api/work-permit-templates/${templateId}/clone`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ name: newName })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al clonar template');
      }

      return {
        success: true,
        data: result.data,
        message: 'Template clonado exitosamente'
      };
    } catch (error) {
      console.error('Error cloning template:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al clonar template'
      };
    }
  }

  // Get templates by category
  async getTemplatesByCategory(category: string): Promise<ApiResponse<WorkPermitTemplate[]>> {
    try {
      const response = await fetch(`${BASE_URL}/api/work-permit-templates/category/${category}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener templates por categoría');
      }

      return {
        success: true,
        data: result.data || []
      };
    } catch (error) {
      console.error('Error fetching templates by category:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener templates por categoría'
      };
    }
  }

  // Actualizar formularios de un template
  async updateTemplateForms(templateId: string, forms: TemplateForm[]): Promise<ApiResponse<WorkPermitTemplate>> {
    try {
      const response = await fetch(`${BASE_URL}/api/work-permit-templates/${templateId}/forms`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ forms })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al actualizar formularios del template');
      }

      return {
        success: true,
        data: result.data,
        message: 'Formularios actualizados exitosamente'
      };
    } catch (error) {
      console.error('Error updating template forms:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al actualizar formularios'
      };
    }
  }

  // Obtener formularios de un template
  async getTemplateForms(templateId: string): Promise<ApiResponse<TemplateForm[]>> {
    try {
      const response = await fetch(`${BASE_URL}/api/work-permit-templates/${templateId}/forms`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener formularios del template');
      }

      return {
        success: true,
        data: result.data || result.forms || []
      };
    } catch (error) {
      console.error('Error fetching template forms:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener formularios'
      };
    }
  }

  // Obtener formularios disponibles para una categoría
  async getAvailableFormsByCategory(category: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await fetch(`${BASE_URL}/api/work-permit-templates/category/${category}/available-forms`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener formularios disponibles');
      }

      return {
        success: true,
        data: result.data || result.forms || []
      };
    } catch (error) {
      console.error('Error fetching available forms:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener formularios disponibles'
      };
    }
  }
}

export const workPermitTemplateApi = new WorkPermitTemplateApiService();