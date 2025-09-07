import { useState, useEffect, useCallback } from 'react';
import { UserRole } from '../types';
import dashboardService, { 
  BaseDashboardStats,
  DashboardActivity,
  DashboardAlert,
  SuperAdminStats,
  SafetyStaffStats,
  ClientSupervisorStats,
  ClientApproverStats,
  ClientStaffStats,
  ValidadoresOpsStats,
  ContratistaAdminStats,
  ContratistaSubalternosStats,
  ContratistaHuerfanoStats
} from '../services/dashboardService';

export interface UseDashboardReturn {
  stats: BaseDashboardStats | null;
  activities: DashboardActivity[];
  alerts: DashboardAlert[];
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  refreshActivities: () => Promise<void>;
  refreshAlerts: () => Promise<void>;
  markAlertAsRead: (alertId: string) => Promise<void>;
  // Role-specific data
  contractors?: any[];
  team?: any[];
  projects?: any[];
  courses?: any[];
  tasks?: any[];
  systemHealth?: any;
  revenue?: any;
  apiUsage?: any;
  riskAssessments?: any;
  incidents?: any;
  inspections?: any;
  todayStats?: any;
  vehicleAccess?: any;
  invoices?: any;
}

export const useDashboard = (userRole: UserRole): UseDashboardReturn => {
  const [stats, setStats] = useState<BaseDashboardStats | null>(null);
  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [contractors, setContractors] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [apiUsage, setApiUsage] = useState<any>(null);
  const [riskAssessments, setRiskAssessments] = useState<any>(null);
  const [incidents, setIncidents] = useState<any>(null);
  const [inspections, setInspections] = useState<any>(null);
  const [todayStats, setTodayStats] = useState<any>(null);
  const [vehicleAccess, setVehicleAccess] = useState<any>(null);
  const [invoices, setInvoices] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStats = useCallback(async () => {
    try {
      setError(null);
      let statsData: BaseDashboardStats;
      
      switch (userRole) {
        case UserRole.SUPER_ADMIN:
          statsData = await dashboardService.getStats<SuperAdminStats>(userRole);
          break;
        case UserRole.SAFETY_STAFF:
          statsData = await dashboardService.getStats<SafetyStaffStats>(userRole);
          break;
        case UserRole.CLIENT_SUPERVISOR:
          statsData = await dashboardService.getStats<ClientSupervisorStats>(userRole);
          break;
        case UserRole.CLIENT_APPROVER:
          statsData = await dashboardService.getStats<ClientApproverStats>(userRole);
          break;
        case UserRole.CLIENT_STAFF:
          statsData = await dashboardService.getStats<ClientStaffStats>(userRole);
          break;
        case UserRole.VALIDADORES_OPS:
          statsData = await dashboardService.getStats<ValidadoresOpsStats>(userRole);
          break;
        case UserRole.CONTRATISTA_ADMIN:
          statsData = await dashboardService.getStats<ContratistaAdminStats>(userRole);
          break;
        case UserRole.CONTRATISTA_SUBALTERNOS:
          statsData = await dashboardService.getStats<ContratistaSubalternosStats>(userRole);
          break;
        case UserRole.CONTRATISTA_HUERFANO:
          statsData = await dashboardService.getStats<ContratistaHuerfanoStats>(userRole);
          break;
        default:
          statsData = await dashboardService.getStats(userRole);
      }
      
      setStats(statsData);
    } catch (err) {
      setError('Error al cargar estadísticas del dashboard');
      console.error('Dashboard stats error:', err);
    }
  }, [userRole]);

  const refreshActivities = useCallback(async () => {
    try {
      const activitiesData = await dashboardService.getActivities(10, 0);
      setActivities(activitiesData);
    } catch (err) {
      console.error('Dashboard activities error:', err);
    }
  }, []);

  const refreshAlerts = useCallback(async () => {
    try {
      const alertsData = await dashboardService.getAlerts('all');
      setAlerts(alertsData);
    } catch (err) {
      console.error('Dashboard alerts error:', err);
    }
  }, []);

  const markAlertAsRead = useCallback(async (alertId: string) => {
    try {
      await dashboardService.markAlertAsRead(alertId);
      // Update local state
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, isRead: true } : alert
      ));
    } catch (err) {
      console.error('Mark alert as read error:', err);
    }
  }, []);

  // Role-specific data fetching
  const loadRoleSpecificData = useCallback(async () => {
    try {
      switch (userRole) {
        case UserRole.SUPER_ADMIN:
          const [healthData, revenueData, apiData, workPermitsData] = await Promise.all([
            dashboardService.getSystemHealth(),
            dashboardService.getRevenue(),
            dashboardService.getApiUsage(),
            dashboardService.getWorkPermitsStats()
          ]);
          setSystemHealth(healthData);
          setRevenue(revenueData);
          setApiUsage(apiData);
          setTasks(workPermitsData); // Using tasks as workPermitsStats
          break;

        case UserRole.SAFETY_STAFF:
          const [riskData, incidentData, inspectionData] = await Promise.all([
            dashboardService.getRiskAssessments(),
            dashboardService.getIncidents(),
            dashboardService.getInspections()
          ]);
          setRiskAssessments(riskData);
          setIncidents(incidentData);
          setInspections(inspectionData);
          break;

        case UserRole.CLIENT_SUPERVISOR:
        case UserRole.CLIENT_APPROVER:
          const contractorsData = await dashboardService.getContractors(1, 20);
          if (contractorsData?.contractors) {
            setContractors(contractorsData.contractors);
          }
          break;

        case UserRole.CLIENT_STAFF:
          const [coursesData, tasksData] = await Promise.all([
            dashboardService.getMyCourses(),
            dashboardService.getMyTasks()
          ]);
          if (coursesData?.courses) setCourses(coursesData.courses);
          if (tasksData?.tasks) setTasks(tasksData.tasks);
          break;

        case UserRole.VALIDADORES_OPS:
          const [todayData, vehicleData] = await Promise.all([
            dashboardService.getTodayStats(),
            dashboardService.getVehicleAccess()
          ]);
          setTodayStats(todayData);
          setVehicleAccess(vehicleData);
          break;

        case UserRole.CONTRATISTA_ADMIN:
          const [teamData, projectsData] = await Promise.all([
            dashboardService.getTeam(1, 10),
            dashboardService.getProjects()
          ]);
          if (teamData?.members) setTeam(teamData.members);
          if (projectsData?.projects) setProjects(projectsData.projects);
          break;

        case UserRole.CONTRATISTA_SUBALTERNOS:
          const [workerTasksData, workerCoursesData] = await Promise.all([
            dashboardService.getMyTasks(),
            dashboardService.getMyCourses()
          ]);
          if (workerTasksData?.tasks) setTasks(workerTasksData.tasks);
          if (workerCoursesData?.training) setCourses(workerCoursesData.training);
          break;

        case UserRole.CONTRATISTA_HUERFANO:
          const [independentProjectsData, invoicesData] = await Promise.all([
            dashboardService.getProjects(),
            dashboardService.getInvoices()
          ]);
          if (independentProjectsData?.projects) setProjects(independentProjectsData.projects);
          if (invoicesData?.invoices) setInvoices(invoicesData.invoices);
          break;

        default:
          break;
      }
    } catch (err) {
      console.error('Role-specific data loading error:', err);
    }
  }, [userRole]);

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          refreshStats(),
          refreshActivities(),
          refreshAlerts(),
          loadRoleSpecificData()
        ]);
      } catch (err) {
        setError('Error al cargar datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userRole, refreshStats, refreshActivities, refreshAlerts, loadRoleSpecificData]);

  return {
    stats,
    activities,
    alerts,
    loading,
    error,
    refreshStats,
    refreshActivities,
    refreshAlerts,
    markAlertAsRead,
    // Role-specific data
    contractors,
    team,
    projects,
    courses,
    tasks,
    systemHealth,
    revenue,
    apiUsage,
    riskAssessments,
    incidents,
    inspections,
    todayStats,
    vehicleAccess,
    invoices
  };
};