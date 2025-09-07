import { UserRole } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Base dashboard stats interface - common fields
export interface BaseDashboardStats {
  [key: string]: any;
}

// Role-specific stats interfaces
export interface SuperAdminStats extends BaseDashboardStats {
  totalCompanies: number;
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  systemUptime: number;
  apiRequests: number;
  newCompaniesThisMonth: number;
  activeUsersToday: number;
  systemHealth: {
    database: string;
    apiServer: string;
    storageUsage: number;
    memoryUsage: number;
  };
}

export interface SafetyStaffStats extends BaseDashboardStats {
  activeContractors: number;
  pendingPermits: number;
  expiringDocuments: number;
  completedCourses: number;
  pendingApprovals: number;
  complianceRate: number;
  riskAssessments: {
    high: number;
    medium: number;
    low: number;
  };
  incidentsThisMonth: number;
  inspectionsScheduled: number;
}

export interface ClientSupervisorStats extends BaseDashboardStats {
  totalContractors: number;
  activePermits: number;
  complianceRate: number;
  pendingApprovals: number;
  monthlyGrowth: number;
  contractorsByStatus: {
    active: number;
    inactive: number;
    suspended: number;
  };
  departmentStats: {
    [department: string]: number;
  };
  trainingCompletion: number;
}

export interface ClientApproverStats extends BaseDashboardStats {
  pendingApprovals: number;
  approvedToday: number;
  rejectedToday: number;
  avgResponseTime: number;
  approvalsByType: {
    work_permit: number;
    access_request: number;
    document_validation: number;
  };
  departmentDistribution: {
    [department: string]: number;
  };
}

export interface ClientStaffStats extends BaseDashboardStats {
  completedCourses: number;
  activeCourses: number;
  certificatesEarned: number;
  overallProgress: number;
  nextCertificationExpiry: string;
  hoursCompleted: number;
  complianceStatus: string;
  upcomingDeadlines: number;
}

export interface ValidadoresOpsStats extends BaseDashboardStats {
  pendingVerifications: number;
  accessesGranted: number;
  incidentsReported: number;
  toolsRegistered: number;
  todayStats: {
    entrances: number;
    exits: number;
    currentInside: number;
    violations: number;
  };
  vehicleAccess: {
    pending: number;
    approved: number;
    inPremises: number;
  };
}

export interface ContratistaAdminStats extends BaseDashboardStats {
  teamMembers: number;
  activePermits: number;
  completedTrainings: number;
  pendingTasks: number;
  companyCompliance: number;
  teamStats: {
    active: number;
    onLeave: number;
    suspended: number;
  };
  trainingStats: {
    completed: number;
    inProgress: number;
    overdue: number;
  };
  documentStats: {
    valid: number;
    expiring: number;
    expired: number;
  };
}

export interface ContratistaSubalternosStats extends BaseDashboardStats {
  assignedTasks: number;
  completedTasks: number;
  activeCourses: number;
  complianceScore: number;
  currentProject: {
    id: string;
    name: string;
    supervisor: string;
  };
  monthlyStats: {
    hoursWorked: number;
    tasksCompleted: number;
    safetyIncidents: number;
  };
}

export interface ContratistaHuerfanoStats extends BaseDashboardStats {
  activeProjects: number;
  completedProjects: number;
  certifications: number;
  monthlyEarnings: number;
  complianceScore: number;
  clientRating: number;
  projectStats: {
    onTime: number;
    delayed: number;
    cancelled: number;
  };
  upcomingRenewals: {
    insurance: string;
    certifications: number;
    licenses: number;
  };
}

// Legacy interface for backward compatibility
export interface DashboardStats {
  totalTeamMembers: number;
  activePermits: number;
  completedTrainings: number;
  pendingTasks: number;
  complianceScore: number;
  activeContractors: number;
  expiredCertifications: number;
  upcomingDeadlines: number;
}

export interface DashboardActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user: {
    name: string;
    role: string;
  };
  status: string;
  priority?: string;
}

export interface DashboardAlert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'high' | 'medium' | 'low';
  actionRequired: boolean;
}

class DashboardService {
  private static instance: DashboardService;
  
  private constructor() {}
  
  static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  async getStats<T extends BaseDashboardStats>(userRole?: UserRole): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Error al obtener estadísticas del dashboard');
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return role-specific mock data if API fails
      return this.getMockStatsForRole(userRole) as T;
    }
  }

  private getMockStatsForRole(role?: UserRole): BaseDashboardStats {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return {
          totalCompanies: 150,
          totalUsers: 1250,
          activeSubscriptions: 125,
          totalRevenue: 125000,
          systemUptime: 99.9,
          apiRequests: 50000,
          newCompaniesThisMonth: 12,
          activeUsersToday: 450,
          systemHealth: {
            database: 'healthy',
            apiServer: 'healthy',
            storageUsage: 65,
            memoryUsage: 45
          }
        } as SuperAdminStats;
      
      case UserRole.SAFETY_STAFF:
        return {
          activeContractors: 450,
          pendingPermits: 25,
          expiringDocuments: 12,
          completedCourses: 180,
          pendingApprovals: 8,
          complianceRate: 87.5,
          riskAssessments: {
            high: 5,
            medium: 15,
            low: 30
          },
          incidentsThisMonth: 3,
          inspectionsScheduled: 12
        } as SafetyStaffStats;
      
      case UserRole.CLIENT_SUPERVISOR:
        return {
          totalContractors: 75,
          activePermits: 12,
          complianceRate: 92.3,
          pendingApprovals: 5,
          monthlyGrowth: 15.2,
          contractorsByStatus: {
            active: 65,
            inactive: 8,
            suspended: 2
          },
          departmentStats: {
            maintenance: 25,
            construction: 30,
            cleaning: 20
          },
          trainingCompletion: 85.5
        } as ClientSupervisorStats;
      
      case UserRole.CLIENT_APPROVER:
        return {
          pendingApprovals: 12,
          approvedToday: 5,
          rejectedToday: 2,
          avgResponseTime: 2.5,
          approvalsByType: {
            work_permit: 6,
            access_request: 4,
            document_validation: 2
          },
          departmentDistribution: {
            maintenance: 5,
            operations: 4,
            administration: 3
          }
        } as ClientApproverStats;
      
      case UserRole.CLIENT_STAFF:
        return {
          completedCourses: 8,
          activeCourses: 2,
          certificatesEarned: 6,
          overallProgress: 80,
          nextCertificationExpiry: '2024-06-15',
          hoursCompleted: 45,
          complianceStatus: 'compliant',
          upcomingDeadlines: 3
        } as ClientStaffStats;
      
      case UserRole.VALIDADORES_OPS:
        return {
          pendingVerifications: 8,
          accessesGranted: 125,
          incidentsReported: 2,
          toolsRegistered: 45,
          todayStats: {
            entrances: 85,
            exits: 73,
            currentInside: 12,
            violations: 1
          },
          vehicleAccess: {
            pending: 3,
            approved: 42,
            inPremises: 15
          }
        } as ValidadoresOpsStats;
      
      case UserRole.CONTRATISTA_ADMIN:
        return {
          teamMembers: 25,
          activePermits: 8,
          completedTrainings: 120,
          pendingTasks: 15,
          companyCompliance: 88.5,
          teamStats: {
            active: 20,
            onLeave: 3,
            suspended: 2
          },
          trainingStats: {
            completed: 120,
            inProgress: 18,
            overdue: 5
          },
          documentStats: {
            valid: 145,
            expiring: 12,
            expired: 3
          }
        } as ContratistaAdminStats;
      
      case UserRole.CONTRATISTA_SUBALTERNOS:
        return {
          assignedTasks: 12,
          completedTasks: 45,
          activeCourses: 3,
          complianceScore: 85,
          currentProject: {
            id: 'proj_001',
            name: 'Mantenimiento Planta Sur',
            supervisor: 'Ing. Roberto Silva'
          },
          monthlyStats: {
            hoursWorked: 160,
            tasksCompleted: 45,
            safetyIncidents: 0
          }
        } as ContratistaSubalternosStats;
      
      case UserRole.CONTRATISTA_HUERFANO:
        return {
          activeProjects: 3,
          completedProjects: 28,
          certifications: 12,
          monthlyEarnings: 8500,
          complianceScore: 90,
          clientRating: 4.8,
          projectStats: {
            onTime: 25,
            delayed: 2,
            cancelled: 1
          },
          upcomingRenewals: {
            insurance: '2024-03-15',
            certifications: 2,
            licenses: 1
          }
        } as ContratistaHuerfanoStats;
      
      default:
        return {
          totalTeamMembers: 8,
          activePermits: 3,
          completedTrainings: 24,
          pendingTasks: 5,
          complianceScore: 92,
          activeContractors: 15,
          expiredCertifications: 2,
          upcomingDeadlines: 7
        } as DashboardStats;
    }
  }

  async getActivities(limit: number = 10, offset: number = 0): Promise<DashboardActivity[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/activities?limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Error al obtener actividades del dashboard');
      }

      const data = await response.json();
      return data.activities || data;
    } catch (error) {
      console.error('Error fetching dashboard activities:', error);
      // Return mock data if API fails
      return [
        {
          id: '1',
          type: 'permit_created',
          description: 'Nuevo permiso de trabajo creado para mantenimiento eléctrico',
          timestamp: new Date().toISOString(),
          user: {
            name: 'Sandra López',
            role: 'Técnico Eléctrico'
          },
          status: 'pending'
        },
        {
          id: '2',
          type: 'training_completed',
          description: 'Entrenamiento de seguridad completado',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          user: {
            name: 'Diego Morales',
            role: 'Técnico Soldador'
          },
          status: 'completed'
        }
      ];
    }
  }

  async getAlerts(type: string = 'all'): Promise<DashboardAlert[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/alerts?type=${type}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Error al obtener alertas del dashboard');
      }

      const data = await response.json();
      return data.alerts || data;
    } catch (error) {
      console.error('Error fetching dashboard alerts:', error);
      // Return mock data if API fails
      return [
        {
          id: '1',
          type: 'warning',
          title: 'Certificación próxima a vencer',
          message: 'La certificación de Roberto Castro vence en 5 días',
          timestamp: new Date().toISOString(),
          isRead: false,
          priority: 'high',
          actionRequired: true
        },
        {
          id: '2',
          type: 'error',
          title: 'Permiso vencido',
          message: 'El permiso de trabajo #PT-001 ha vencido sin completarse',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          isRead: false,
          priority: 'high',
          actionRequired: true
        },
        {
          id: '3',
          type: 'info',
          title: 'Nuevo miembro del equipo',
          message: 'Ana García se ha unido al equipo como Técnico de Mantenimiento',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          isRead: true,
          priority: 'low',
          actionRequired: false
        }
      ];
    }
  }

  async markAlertAsRead(alertId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/alerts/${alertId}/read`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Error al marcar alerta como leída');
      }
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  }

  // Role-specific API endpoints
  async getSystemHealth(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/system-health`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error('Error fetching system health:', error);
      return null;
    }
  }

  async getRevenue(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/revenue`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error('Error fetching revenue:', error);
      return null;
    }
  }

  async getApiUsage(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/api-usage`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error('Error fetching API usage:', error);
      return null;
    }
  }

  async getWorkPermitsStats(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/work-permits/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Error al obtener estadísticas de permisos de trabajo');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching work permits stats:', error);
      return {
        success: false,
        data: {
          byStatus: {
            borrador: 0,
            pendiente: 0,
            aprobado: 0,
            rechazado: 0,
            expirado: 0,
            cancelado: 0
          },
          alerts: {
            expiringSoon: 0,
            pendingApprovals: 0
          },
          byDepartment: []
        }
      };
    }
  }

  async getRiskAssessments(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/risk-assessments`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error('Error fetching risk assessments:', error);
      return null;
    }
  }

  async getIncidents(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/incidents`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error('Error fetching incidents:', error);
      return null;
    }
  }

  async getInspections(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/inspections`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error('Error fetching inspections:', error);
      return null;
    }
  }

  async getContractors(page: number = 1, limit: number = 20, filters?: any): Promise<any> {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters || {})
      });
      const response = await fetch(`${API_BASE_URL}/api/dashboard/contractors?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error('Error fetching contractors:', error);
      return null;
    }
  }

  async getMyCourses(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/my-courses`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error('Error fetching my courses:', error);
      return null;
    }
  }

  async getMyTasks(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/my-tasks`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error('Error fetching my tasks:', error);
      return null;
    }
  }

  async getTodayStats(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/today-stats`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error('Error fetching today stats:', error);
      return null;
    }
  }

  async getVehicleAccess(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/vehicle-access`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error('Error fetching vehicle access:', error);
      return null;
    }
  }

  async getTeam(page: number = 1, limit: number = 10): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/team?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error('Error fetching team:', error);
      return null;
    }
  }

  async getProjects(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/projects`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error('Error fetching projects:', error);
      return null;
    }
  }

  async getInvoices(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/invoices`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return null;
    }
  }
}

export default DashboardService.getInstance();