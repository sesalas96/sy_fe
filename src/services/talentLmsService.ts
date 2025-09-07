import { 
  TalentLMSCourse, 
  TalentLMSUser, 
  TalentLMSEnrollment, 
  ContractorProgress, 
  CourseRequirement, 
  SyncOperation,
  TalentLMSWebhookEvent 
} from '../types';

// Mock API delay simulation
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock TalentLMS courses data
let mockTalentLMSCourses: TalentLMSCourse[] = [
  {
    id: 'tlms-001',
    name: 'Seguridad Industrial Básica',
    description: 'Curso fundamental sobre principios de seguridad industrial y prevención de riesgos laborales.',
    category: 'Seguridad',
    duration: 120, // 2 hours
    level: 'beginner',
    price: 0,
    currency: 'USD',
    status: 'active',
    created_on: '2024-01-15T10:00:00Z',
    last_update_on: '2024-06-01T14:30:00Z',
    thumbnail_url: 'https://example.com/thumbnails/seguridad-basica.jpg',
    certification_enabled: true,
    required_for_companies: ['company1', 'company2']
  },
  {
    id: 'tlms-002',
    name: 'Trabajo en Altura',
    description: 'Capacitación especializada en técnicas seguras para trabajo en altura, uso de EPP y procedimientos de rescate.',
    category: 'Seguridad Especializada',
    duration: 180, // 3 hours
    level: 'intermediate',
    price: 50,
    currency: 'USD',
    status: 'active',
    created_on: '2024-01-20T09:00:00Z',
    last_update_on: '2024-06-15T16:45:00Z',
    thumbnail_url: 'https://example.com/thumbnails/trabajo-altura.jpg',
    certification_enabled: true,
    required_for_companies: ['company1']
  },
  {
    id: 'tlms-003',
    name: 'Manejo de Materiales Peligrosos',
    description: 'Protocolo para el manejo seguro de sustancias químicas y materiales peligrosos en el lugar de trabajo.',
    category: 'Seguridad Química',
    duration: 150, // 2.5 hours
    level: 'advanced',
    price: 75,
    currency: 'USD',
    status: 'active',
    created_on: '2024-02-01T11:00:00Z',
    last_update_on: '2024-06-20T13:20:00Z',
    thumbnail_url: 'https://example.com/thumbnails/materiales-peligrosos.jpg',
    certification_enabled: true,
    required_for_companies: ['company3']
  },
  {
    id: 'tlms-004',
    name: 'Primeros Auxilios en el Trabajo',
    description: 'Capacitación en técnicas básicas de primeros auxilios y respuesta a emergencias en el lugar de trabajo.',
    category: 'Salud y Emergencias',
    duration: 240, // 4 hours
    level: 'beginner',
    price: 30,
    currency: 'USD',
    status: 'active',
    created_on: '2024-02-10T08:30:00Z',
    last_update_on: '2024-06-25T10:15:00Z',
    thumbnail_url: 'https://example.com/thumbnails/primeros-auxilios.jpg',
    certification_enabled: true,
    required_for_companies: ['company1', 'company2', 'company3']
  },
  {
    id: 'tlms-005',
    name: 'Prevención de Incendios',
    description: 'Protocolos de prevención de incendios, uso de extintores y procedimientos de evacuación.',
    category: 'Prevención',
    duration: 90, // 1.5 hours
    level: 'beginner',
    price: 25,
    currency: 'USD',
    status: 'active',
    created_on: '2024-02-15T14:00:00Z',
    last_update_on: '2024-06-30T17:30:00Z',
    thumbnail_url: 'https://example.com/thumbnails/prevencion-incendios.jpg',
    certification_enabled: true
  },
  {
    id: 'tlms-006',
    name: 'Ergonomía y Posturas de Trabajo',
    description: 'Principios de ergonomía laboral y técnicas para mantener posturas saludables durante el trabajo.',
    category: 'Salud Ocupacional',
    duration: 60, // 1 hour
    level: 'beginner',
    price: 15,
    currency: 'USD',
    status: 'active',
    created_on: '2024-03-01T09:45:00Z',
    last_update_on: '2024-07-05T12:00:00Z',
    thumbnail_url: 'https://example.com/thumbnails/ergonomia.jpg',
    certification_enabled: false
  }
];

// Mock TalentLMS users (contractors synced to TalentLMS)
let mockTalentLMSUsers: TalentLMSUser[] = [
  {
    id: 'tlms-user-001',
    login: 'juan.perez',
    first_name: 'Juan Carlos',
    last_name: 'Pérez',
    email: 'juan.perez@email.com',
    user_type: 'Learner',
    created_on: '2024-06-01T10:00:00Z',
    last_login: '2024-07-14T08:30:00Z',
    avatar: 'https://example.com/avatars/juan-perez.jpg'
  },
  {
    id: 'tlms-user-002',
    login: 'maria.gonzalez',
    first_name: 'María',
    last_name: 'González López',
    email: 'maria.gonzalez@email.com',
    user_type: 'Learner',
    created_on: '2024-06-05T14:20:00Z',
    last_login: '2024-07-13T16:45:00Z'
  }
];

// Mock enrollments
let mockEnrollments: TalentLMSEnrollment[] = [
  {
    id: 'enroll-001',
    user_id: 'tlms-user-001',
    course_id: 'tlms-001',
    enrollment_date: '2024-06-01T10:30:00Z',
    completion_status: 'completed',
    completion_percentage: 100,
    completion_date: '2024-06-03T15:20:00Z',
    certificate_url: 'https://example.com/certificates/cert-001.pdf',
    time_spent: 125,
    grade: 95
  },
  {
    id: 'enroll-002',
    user_id: 'tlms-user-001',
    course_id: 'tlms-002',
    enrollment_date: '2024-06-05T09:00:00Z',
    completion_status: 'in_progress',
    completion_percentage: 65,
    time_spent: 118,
    last_accessed: '2024-07-14T08:30:00Z'
  },
  {
    id: 'enroll-003',
    user_id: 'tlms-user-002',
    course_id: 'tlms-001',
    enrollment_date: '2024-06-06T11:15:00Z',
    completion_status: 'completed',
    completion_percentage: 100,
    completion_date: '2024-06-08T14:45:00Z',
    certificate_url: 'https://example.com/certificates/cert-002.pdf',
    time_spent: 130,
    grade: 88
  },
  {
    id: 'enroll-004',
    user_id: 'tlms-user-002',
    course_id: 'tlms-004',
    enrollment_date: '2024-06-10T13:30:00Z',
    completion_status: 'not_started',
    completion_percentage: 0,
    time_spent: 0
  }
];

// Mock course requirements
let mockCourseRequirements: CourseRequirement[] = [
  {
    id: 'req-001',
    companyId: 'company1',
    courseId: 'tlms-001',
    courseName: 'Seguridad Industrial Básica',
    isRequired: true,
    validityPeriod: 12,
    jobRoles: ['Obrero', 'Técnico', 'Supervisor'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-06-01')
  },
  {
    id: 'req-002',
    companyId: 'company1',
    courseId: 'tlms-002',
    courseName: 'Trabajo en Altura',
    isRequired: true,
    validityPeriod: 24,
    jobRoles: ['Técnico en Altura', 'Montajista'],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-06-15')
  },
  {
    id: 'req-003',
    companyId: 'company2',
    courseId: 'tlms-001',
    courseName: 'Seguridad Industrial Básica',
    isRequired: true,
    validityPeriod: 12,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-06-01')
  }
];

// Mock sync operations
let mockSyncOperations: SyncOperation[] = [
  {
    id: 'sync-001',
    type: 'contractor_sync',
    status: 'completed',
    startedAt: new Date('2024-07-14T09:00:00Z'),
    completedAt: new Date('2024-07-14T09:05:00Z'),
    targetIds: ['1'],
    totalItems: 1,
    processedItems: 1,
    successfulItems: 1,
    failedItems: 0,
    initiatedBy: 'user-admin'
  }
];

export interface TalentLMSConnectionStatus {
  connected: boolean;
  apiUrl?: string;
  lastCheck: Date;
  error?: string;
}

export interface EnrollmentRequest {
  contractorId: string;
  courseIds: string[];
  forceEnroll?: boolean;
}

export interface BulkSyncRequest {
  companyId?: string;
  contractorIds?: string[];
  forceSync?: boolean;
}

export class TalentLMSService {
  /**
   * Test TalentLMS connection
   */
  static async testConnection(): Promise<TalentLMSConnectionStatus> {
    await delay(1000);
    
    // Mock successful connection
    return {
      connected: true,
      apiUrl: 'https://safetycr.talentlms.com/api/v1',
      lastCheck: new Date()
    };
  }

  /**
   * Get all available courses from TalentLMS
   */
  static async getCourses(filters?: {
    category?: string;
    level?: string;
    status?: string;
    companyId?: string;
  }): Promise<TalentLMSCourse[]> {
    await delay(500);
    
    let filtered = [...mockTalentLMSCourses];
    
    if (filters?.category) {
      filtered = filtered.filter(course => 
        course.category.toLowerCase().includes(filters.category!.toLowerCase())
      );
    }
    
    if (filters?.level) {
      filtered = filtered.filter(course => course.level === filters.level);
    }
    
    if (filters?.status) {
      filtered = filtered.filter(course => course.status === filters.status);
    }
    
    if (filters?.companyId) {
      filtered = filtered.filter(course => 
        course.required_for_companies?.includes(filters.companyId!) || 
        !course.required_for_companies
      );
    }
    
    return filtered;
  }

  /**
   * Get course by ID
   */
  static async getCourseById(courseId: string): Promise<TalentLMSCourse | null> {
    await delay(200);
    
    const course = mockTalentLMSCourses.find(c => c.id === courseId);
    return course ? { ...course } : null;
  }

  /**
   * Sync contractor to TalentLMS
   */
  static async syncContractorToTalentLMS(
    contractorId: string, 
    forceSync: boolean = false
  ): Promise<{ success: boolean; talentLmsUserId?: string; message: string }> {
    await delay(2000);
    
    // Mock contractor data - in real implementation, fetch from contractor service
    const mockContractor = {
      id: contractorId,
      fullName: 'Juan Carlos Pérez',
      email: 'juan.perez@email.com',
      cedula: '1-2345-6789'
    };
    
    // Check if user already exists
    const existingUser = mockTalentLMSUsers.find(user => 
      user.email === mockContractor.email
    );
    
    if (existingUser && !forceSync) {
      return {
        success: true,
        talentLmsUserId: existingUser.id,
        message: 'Usuario ya existe en TalentLMS'
      };
    }
    
    // Create new user or update existing
    const newUser: TalentLMSUser = {
      id: `tlms-user-${Date.now()}`,
      login: mockContractor.email.split('@')[0],
      first_name: mockContractor.fullName.split(' ')[0],
      last_name: mockContractor.fullName.split(' ').slice(1).join(' '),
      email: mockContractor.email,
      user_type: 'Learner',
      created_on: new Date().toISOString()
    };
    
    if (!existingUser) {
      mockTalentLMSUsers.push(newUser);
    } else {
      // Update existing user
      Object.assign(existingUser, newUser, { id: existingUser.id });
    }
    
    return {
      success: true,
      talentLmsUserId: existingUser?.id || newUser.id,
      message: existingUser ? 'Usuario actualizado en TalentLMS' : 'Usuario creado en TalentLMS'
    };
  }

  /**
   * Bulk sync contractors to TalentLMS
   */
  static async bulkSyncContractors(request: BulkSyncRequest): Promise<SyncOperation> {
    await delay(1000);
    
    // Mock contractor IDs - in real implementation, fetch based on companyId or provided IDs
    const contractorIds = request.contractorIds || ['1', '2', '3', '4', '5'];
    
    const syncOperation: SyncOperation = {
      id: `sync-${Date.now()}`,
      type: 'bulk_sync',
      status: 'in_progress',
      startedAt: new Date(),
      targetIds: contractorIds,
      totalItems: contractorIds.length,
      processedItems: 0,
      successfulItems: 0,
      failedItems: 0,
      errors: [],
      initiatedBy: 'current-user'
    };
    
    mockSyncOperations.push(syncOperation);
    
    // Simulate async processing
    setTimeout(() => {
      syncOperation.status = 'completed';
      syncOperation.completedAt = new Date();
      syncOperation.processedItems = contractorIds.length;
      syncOperation.successfulItems = contractorIds.length - 1; // Simulate one failure
      syncOperation.failedItems = 1;
      syncOperation.errors = ['Error sincronizando contratista ID: 3 - Email inválido'];
    }, 3000);
    
    return syncOperation;
  }

  /**
   * Enroll contractor in specific courses
   */
  static async enrollContractorInCourses(request: EnrollmentRequest): Promise<{
    success: boolean;
    enrollments: TalentLMSEnrollment[];
    errors: string[];
  }> {
    await delay(1500);
    
    const { courseIds } = request;
    const enrollments: TalentLMSEnrollment[] = [];
    const errors: string[] = [];
    
    // Find TalentLMS user for contractor
    const talentUser = mockTalentLMSUsers.find(user => 
      user.first_name.toLowerCase().includes('juan') // Mock mapping
    );
    
    if (!talentUser) {
      errors.push('Contratista no encontrado en TalentLMS. Debe sincronizar primero.');
      return { success: false, enrollments: [], errors };
    }
    
    for (const courseId of courseIds) {
      const course = mockTalentLMSCourses.find(c => c.id === courseId);
      if (!course) {
        errors.push(`Curso ${courseId} no encontrado`);
        continue;
      }
      
      // Check if already enrolled
      const existingEnrollment = mockEnrollments.find(e => 
        e.user_id === talentUser.id && e.course_id === courseId
      );
      
      if (existingEnrollment) {
        errors.push(`Usuario ya está inscrito en el curso: ${course.name}`);
        continue;
      }
      
      const newEnrollment: TalentLMSEnrollment = {
        id: `enroll-${Date.now()}-${courseId}`,
        user_id: talentUser.id,
        course_id: courseId,
        enrollment_date: new Date().toISOString(),
        completion_status: 'not_started',
        completion_percentage: 0,
        time_spent: 0
      };
      
      mockEnrollments.push(newEnrollment);
      enrollments.push(newEnrollment);
    }
    
    return {
      success: errors.length === 0,
      enrollments,
      errors
    };
  }

  /**
   * Auto-enroll contractor in company required courses
   */
  static async autoEnrollContractorInCompanyCourses(
    contractorId: string, 
    companyId: string
  ): Promise<{
    success: boolean;
    enrollments: TalentLMSEnrollment[];
    message: string;
  }> {
    await delay(1000);
    
    // Get required courses for company
    const requiredCourses = mockCourseRequirements.filter(req => 
      req.companyId === companyId && req.isRequired
    );
    
    if (requiredCourses.length === 0) {
      return {
        success: true,
        enrollments: [],
        message: 'No hay cursos obligatorios configurados para esta empresa'
      };
    }
    
    const courseIds = requiredCourses.map(req => req.courseId);
    const result = await this.enrollContractorInCourses({ contractorId, courseIds });
    
    return {
      success: result.success,
      enrollments: result.enrollments,
      message: `Inscrito automáticamente en ${result.enrollments.length} cursos obligatorios`
    };
  }

  /**
   * Get contractor progress from TalentLMS
   */
  static async getContractorProgress(contractorId: string): Promise<ContractorProgress | null> {
    await delay(300);
    
    // Mock mapping contractor to TalentLMS user
    const talentUser = mockTalentLMSUsers.find(user => 
      user.first_name.toLowerCase().includes('juan') // Mock mapping
    );
    
    if (!talentUser) {
      return null;
    }
    
    const userEnrollments = mockEnrollments.filter(e => e.user_id === talentUser.id);
    const totalCourses = userEnrollments.length;
    const completedCourses = userEnrollments.filter(e => e.completion_status === 'completed').length;
    const inProgressCourses = userEnrollments.filter(e => e.completion_status === 'in_progress').length;
    
    const overallProgress = totalCourses > 0 
      ? Math.round(userEnrollments.reduce((sum, e) => sum + e.completion_percentage, 0) / totalCourses)
      : 0;
    
    return {
      contractorId,
      talentLmsUserId: talentUser.id,
      enrollments: userEnrollments,
      totalCourses,
      completedCourses,
      inProgressCourses,
      overallProgress,
      lastSyncDate: new Date()
    };
  }

  /**
   * Sync completed courses from TalentLMS to Safety system
   */
  static async syncCompletedCourses(contractorId: string): Promise<{
    success: boolean;
    syncedCourses: number;
    message: string;
  }> {
    await delay(800);
    
    const progress = await this.getContractorProgress(contractorId);
    
    if (!progress) {
      return {
        success: false,
        syncedCourses: 0,
        message: 'Contratista no encontrado en TalentLMS'
      };
    }
    
    const completedCourses = progress.enrollments.filter(e => 
      e.completion_status === 'completed' && e.completion_date
    );
    
    // Here would be the logic to save completed courses to the Safety system
    // For now, just return mock data
    
    return {
      success: true,
      syncedCourses: completedCourses.length,
      message: `Sincronizados ${completedCourses.length} cursos completados`
    };
  }

  /**
   * Get sync operation status
   */
  static async getSyncOperation(operationId: string): Promise<SyncOperation | null> {
    await delay(100);
    
    const operation = mockSyncOperations.find(op => op.id === operationId);
    return operation ? { ...operation } : null;
  }

  /**
   * Get all sync operations
   */
  static async getSyncOperations(limit: number = 20): Promise<SyncOperation[]> {
    await delay(200);
    
    return [...mockSyncOperations]
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get course requirements for a company
   */
  static async getCourseRequirements(companyId?: string): Promise<CourseRequirement[]> {
    await delay(200);
    
    if (companyId) {
      return mockCourseRequirements.filter(req => req.companyId === companyId);
    }
    
    return [...mockCourseRequirements];
  }

  /**
   * Update course requirements for a company
   */
  static async updateCourseRequirements(
    companyId: string, 
    requirements: Omit<CourseRequirement, 'id' | 'createdAt' | 'updatedAt'>[]
  ): Promise<CourseRequirement[]> {
    await delay(500);
    
    // Remove existing requirements for this company
    mockCourseRequirements = mockCourseRequirements.filter(req => req.companyId !== companyId);
    
    // Add new requirements
    const newRequirements = requirements.map(req => ({
      ...req,
      id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    mockCourseRequirements.push(...newRequirements);
    
    return newRequirements;
  }

  /**
   * Handle TalentLMS webhook events
   */
  static async handleWebhookEvent(event: TalentLMSWebhookEvent): Promise<{
    success: boolean;
    message: string;
  }> {
    await delay(100);
    
    // Process different event types
    switch (event.event_type) {
      case 'course_completion':
        if (event.user_id && event.course_id && event.completion_date) {
          // Update enrollment status
          const enrollment = mockEnrollments.find(e => 
            e.user_id === event.user_id && e.course_id === event.course_id
          );
          
          if (enrollment) {
            enrollment.completion_status = 'completed';
            enrollment.completion_percentage = event.completion_percentage || 100;
            enrollment.completion_date = event.completion_date;
            enrollment.certificate_url = event.certificate_url;
          }
          
          return {
            success: true,
            message: 'Evento de completitud de curso procesado'
          };
        }
        break;
        
      case 'course_enrollment':
        if (event.user_id && event.course_id) {
          // Check if enrollment already exists
          const existingEnrollment = mockEnrollments.find(e => 
            e.user_id === event.user_id && e.course_id === event.course_id
          );
          
          if (!existingEnrollment) {
            const newEnrollment: TalentLMSEnrollment = {
              id: `enroll-webhook-${Date.now()}`,
              user_id: event.user_id,
              course_id: event.course_id,
              enrollment_date: event.timestamp,
              completion_status: 'not_started',
              completion_percentage: 0,
              time_spent: 0
            };
            
            mockEnrollments.push(newEnrollment);
          }
          
          return {
            success: true,
            message: 'Evento de inscripción procesado'
          };
        }
        break;
        
      default:
        return {
          success: true,
          message: `Evento ${event.event_type} recibido y registrado`
        };
    }
    
    return {
      success: false,
      message: 'Evento no pudo ser procesado - datos insuficientes'
    };
  }

  /**
   * Get statistics for dashboard
   */
  static async getStatistics(): Promise<{
    totalCourses: number;
    activeCourses: number;
    totalEnrollments: number;
    completedEnrollments: number;
    averageCompletionRate: number;
    syncedContractors: number;
  }> {
    await delay(300);
    
    const totalCourses = mockTalentLMSCourses.length;
    const activeCourses = mockTalentLMSCourses.filter(c => c.status === 'active').length;
    const totalEnrollments = mockEnrollments.length;
    const completedEnrollments = mockEnrollments.filter(e => e.completion_status === 'completed').length;
    
    const averageCompletionRate = totalEnrollments > 0 
      ? Math.round(mockEnrollments.reduce((sum, e) => sum + e.completion_percentage, 0) / totalEnrollments)
      : 0;
    
    return {
      totalCourses,
      activeCourses,
      totalEnrollments,
      completedEnrollments,
      averageCompletionRate,
      syncedContractors: mockTalentLMSUsers.length
    };
  }
}

export default TalentLMSService;