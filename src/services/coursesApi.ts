const BASE_URL = process.env.REACT_APP_API_URL || 'https://sybe-production.up.railway.app/api';

export interface Course {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: number; // en minutos
  level: 'beginner' | 'intermediate' | 'advanced';
  status: 'active' | 'inactive';
  thumbnailUrl?: string;
  talentLmsId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseProgress {
  courseId: string;
  userId: string;
  enrollmentDate: string;
  completionDate?: string;
  completionPercentage: number;
  certificateUrl?: string;
  score?: number;
  status: 'enrolled' | 'in_progress' | 'completed' | 'expired';
  expiryDate?: string;
}

export interface TalentLMSProgress {
  contractorId: string;
  talentLmsUserId: string;
  courses: {
    id: string;
    name: string;
    enrollmentDate: string;
    completionDate?: string;
    completionPercentage: number;
    certificateUrl?: string;
    status: string;
  }[];
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  overallProgress: number;
}

class CoursesApi {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }

  // Courses API
  async getCourses(params?: {
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const queryParams = new URLSearchParams();
      if (params?.type) queryParams.append('type', params.type);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const response = await fetch(
        `${BASE_URL}/courses?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders()
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener cursos');
      }

      return result;
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  }

  async getUserProgress(userId: string) {
    try {
      const response = await fetch(
        `${BASE_URL}/courses/progress/${userId}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders()
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener progreso');
      }

      return result;
    } catch (error) {
      console.error('Error fetching user progress:', error);
      throw error;
    }
  }

  async enrollInCourse(courseId: string) {
    try {
      const response = await fetch(
        `${BASE_URL}/courses/${courseId}/enroll`,
        {
          method: 'POST',
          headers: this.getAuthHeaders()
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al inscribirse en el curso');
      }

      return result;
    } catch (error) {
      console.error('Error enrolling in course:', error);
      throw error;
    }
  }

  async markCourseComplete(courseId: string, data: {
    score?: number;
    certificateUrl?: string;
    completionDate?: string;
  }) {
    try {
      const response = await fetch(
        `${BASE_URL}/courses/${courseId}/complete`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(data)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al completar el curso');
      }

      return result;
    } catch (error) {
      console.error('Error marking course complete:', error);
      throw error;
    }
  }

  async getExpiringCourses(days: number = 30) {
    try {
      const response = await fetch(
        `${BASE_URL}/courses/expirations?days=${days}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders()
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener cursos por vencer');
      }

      return result;
    } catch (error) {
      console.error('Error fetching expiring courses:', error);
      throw error;
    }
  }

  async downloadCertificate(courseId: string) {
    try {
      const response = await fetch(
        `${BASE_URL}/courses/${courseId}/certificate`,
        {
          method: 'GET',
          headers: this.getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('Error al descargar certificado');
      }

      // Asumiendo que devuelve un blob o URL
      return response;
    } catch (error) {
      console.error('Error downloading certificate:', error);
      throw error;
    }
  }

  // TalentLMS Integration
  async testTalentLMSConnection() {
    try {
      const response = await fetch(
        `${BASE_URL}/talentlms/test-connection`,
        {
          method: 'POST',
          headers: this.getAuthHeaders()
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al probar conexión con TalentLMS');
      }

      return result;
    } catch (error) {
      console.error('Error testing TalentLMS connection:', error);
      throw error;
    }
  }

  async syncContractorToTalentLMS(contractorId: string, forceSync: boolean = false) {
    try {
      const response = await fetch(
        `${BASE_URL}/talentlms/sync-contractor`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ contractorId, forceSync })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al sincronizar contratista');
      }

      return result;
    } catch (error) {
      console.error('Error syncing contractor:', error);
      throw error;
    }
  }

  async getContractorProgress(contractorId: string): Promise<TalentLMSProgress> {
    try {
      const response = await fetch(
        `${BASE_URL}/talentlms/contractor/${contractorId}/progress`,
        {
          method: 'GET',
          headers: this.getAuthHeaders()
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener progreso del contratista');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching contractor progress:', error);
      throw error;
    }
  }

  async enrollContractorInCourses(contractorId: string, courseIds: string[]) {
    try {
      const response = await fetch(
        `${BASE_URL}/talentlms/enroll`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ contractorId, courseIds })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al inscribir contratista en cursos');
      }

      return result;
    } catch (error) {
      console.error('Error enrolling contractor:', error);
      throw error;
    }
  }

  async syncContractorCompletions(contractorId: string) {
    try {
      const response = await fetch(
        `${BASE_URL}/talentlms/contractor/${contractorId}/sync-completions`,
        {
          method: 'POST',
          headers: this.getAuthHeaders()
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al sincronizar cursos completados');
      }

      return result;
    } catch (error) {
      console.error('Error syncing completions:', error);
      throw error;
    }
  }

  async autoEnrollContractor(contractorId: string) {
    try {
      const response = await fetch(
        `${BASE_URL}/talentlms/contractor/${contractorId}/auto-enroll`,
        {
          method: 'POST',
          headers: this.getAuthHeaders()
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al auto-inscribir contratista');
      }

      return result;
    } catch (error) {
      console.error('Error auto-enrolling contractor:', error);
      throw error;
    }
  }

  async getTalentLMSCourses() {
    try {
      const response = await fetch(
        `${BASE_URL}/talentlms/courses`,
        {
          method: 'GET',
          headers: this.getAuthHeaders()
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener cursos de TalentLMS');
      }

      return result;
    } catch (error) {
      console.error('Error fetching TalentLMS courses:', error);
      throw error;
    }
  }

  async syncWithTalentLMS() {
    try {
      const response = await fetch(
        `${BASE_URL}/courses/sync`,
        {
          method: 'POST',
          headers: this.getAuthHeaders()
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al sincronizar con TalentLMS');
      }

      return result;
    } catch (error) {
      console.error('Error syncing with TalentLMS:', error);
      throw error;
    }
  }
}

export const coursesApi = new CoursesApi();