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
        `${BASE_URL}/api/courses/progress/${userId}`,
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
        `${BASE_URL}/api/courses/${courseId}/enroll`,
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
        `${BASE_URL}/api/courses/${courseId}/complete`,
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
        `${BASE_URL}/api/courses/expirations?days=${days}`,
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
        `${BASE_URL}/api/courses/${courseId}/certificate`,
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
        `${BASE_URL}/api/talent-lms/test-connection`,
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
        `${BASE_URL}/api/talent-lms/sync-contractor`,
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
        `${BASE_URL}/api/talent-lms/contractors/${contractorId}/progress`,
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
        `${BASE_URL}/api/talent-lms/enroll-contractor`,
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
        `${BASE_URL}/api/talent-lms/contractors/${contractorId}/sync-completions`,
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
        `${BASE_URL}/api/talent-lms/contractors/${contractorId}/auto-enroll`,
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
        `${BASE_URL}/api/talent-lms/courses`,
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

  async getTalentLMSAvailableCourses() {
    try {
      const response = await fetch(
        `${BASE_URL}/api/talent-lms/courses`,
        {
          method: 'GET',
          headers: this.getAuthHeaders()
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener cursos disponibles');
      }

      return result;
    } catch (error) {
      console.error('Error fetching available courses:', error);
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

  // User course management methods
  async getUserCourses(userId: string, params?: { type?: string; status?: string }) {
    try {
      const queryParams = new URLSearchParams();
      if (params?.type) queryParams.append('type', params.type);
      if (params?.status) queryParams.append('status', params.status);

      const url = `${BASE_URL}/api/users/${userId}/courses${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener cursos del usuario');
      }

      return result;
    } catch (error) {
      console.error('Error fetching user courses:', error);
      throw error;
    }
  }

  async enrollUserInCourse(userId: string, courseId: string) {
    try {
      const response = await fetch(
        `${BASE_URL}/users/${userId}/courses/enroll`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ courseId })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al inscribir usuario en el curso');
      }

      return result;
    } catch (error) {
      console.error('Error enrolling user in course:', error);
      throw error;
    }
  }

  async markUserCourseComplete(userId: string, courseId: string, data?: { score?: number; certificateUrl?: string }) {
    try {
      const response = await fetch(
        `${BASE_URL}/users/${userId}/courses/${courseId}/complete`,
        {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(data || {})
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al marcar curso como completado');
      }

      return result;
    } catch (error) {
      console.error('Error marking user course complete:', error);
      throw error;
    }
  }

  async updateUserCourseProgress(userId: string, courseId: string, progress: number) {
    try {
      const response = await fetch(
        `${BASE_URL}/users/${userId}/courses/${courseId}/progress`,
        {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ progress })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al actualizar progreso del curso');
      }

      return result;
    } catch (error) {
      console.error('Error updating user course progress:', error);
      throw error;
    }
  }

  // TalentLMS user methods
  async syncUserToTalentLMS(userId: string) {
    try {
      const response = await fetch(
        `${BASE_URL}/api/talent-lms/sync-user`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ userId })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al sincronizar usuario con TalentLMS');
      }

      return result;
    } catch (error) {
      console.error('Error syncing user to TalentLMS:', error);
      throw error;
    }
  }

  async enrollUserInTalentLMSCourses(userId: string, courseIds: string[]) {
    try {
      const response = await fetch(
        `${BASE_URL}/api/talent-lms/enroll-user-simple`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ userId, courseIds })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al inscribir usuario en cursos');
      }

      return result;
    } catch (error) {
      console.error('Error enrolling user in courses:', error);
      throw error;
    }
  }

  async getUserTalentLMSProgress(userId: string) {
    try {
      const response = await fetch(
        `${BASE_URL}/api/talent-lms/users/${userId}/progress`,
        {
          method: 'GET',
          headers: this.getAuthHeaders()
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener progreso del usuario en TalentLMS');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching user TalentLMS progress:', error);
      throw error;
    }
  }

  async syncUserCompletions(userId: string) {
    try {
      const response = await fetch(
        `${BASE_URL}/api/talent-lms/users/${userId}/sync-completions`,
        {
          method: 'POST',
          headers: this.getAuthHeaders()
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al sincronizar cursos completados del usuario');
      }

      return result;
    } catch (error) {
      console.error('Error syncing user completions:', error);
      throw error;
    }
  }

  async searchTalentLMSUser(params: { id?: string; email?: string; username?: string }) {
    try {
      const queryParams = new URLSearchParams();
      if (params.id) queryParams.append('id', params.id);
      if (params.email) queryParams.append('email', params.email);
      if (params.username) queryParams.append('username', params.username);

      const url = `${BASE_URL}/api/talent-lms/search-user?${queryParams.toString()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok && response.status !== 404) {
        throw new Error(result.message || 'Error al buscar usuario en TalentLMS');
      }

      return result;
    } catch (error) {
      console.error('Error searching TalentLMS user:', error);
      throw error;
    }
  }

  async signupTalentLMSUser(userData: {
    firstName: string;
    lastName: string;
    email: string;
    login: string;
    password: string;
    userType?: 'SuperAdmin' | 'Admin-Type' | 'Trainer-Type' | 'Learner-Type';
    language?: string;
    timezone?: string;
    restrictEmail?: string;
    customFields?: Record<string, string>;
  }) {
    try {
      const response = await fetch(
        `${BASE_URL}/api/talent-lms/signup-user`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(userData)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al registrar usuario en TalentLMS');
      }

      return result;
    } catch (error) {
      console.error('Error signing up TalentLMS user:', error);
      throw error;
    }
  }

  async enrollToCourse(data: {
    userId?: string;
    courseId?: string;
    userEmail?: string;
    courseName?: string;
    role?: 'learner' | 'instructor';
  }) {
    try {
      const response = await fetch(
        `${BASE_URL}/api/talent-lms/enroll-to-course`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(data)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al inscribir en el curso');
      }

      return result;
    } catch (error) {
      console.error('Error enrolling to course:', error);
      throw error;
    }
  }

  async unenrollFromCourse(data: {
    userId: string;
    courseId: string;
  }) {
    try {
      const response = await fetch(
        `${BASE_URL}/api/talent-lms/unenroll-from-course`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(data)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al desinscribir del curso');
      }

      return result;
    } catch (error) {
      console.error('Error unenrolling from course:', error);
      throw error;
    }
  }

  async goToCourse(data: {
    userId: string;
    courseId: string;
    logoutRedirect?: string;
    courseCompletedRedirect?: string;
    headerHiddenOptions?: string;
  }) {
    try {
      const response = await fetch(
        `${BASE_URL}/api/talent-lms/goto-course`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(data)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener URL del curso');
      }

      return result;
    } catch (error) {
      console.error('Error getting course URL:', error);
      throw error;
    }
  }
}

export const coursesApi = new CoursesApi();