import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Business as BusinessIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { DashboardProps } from '../../types/dashboard';
import { safeArray } from '../../utils/dashboardUtils';
import { testSuperAdminEndpoints } from '../../utils/testApiEndpoints';
import { testSafeArray } from '../../utils/testSafeArray';

export const SuperAdminDashboard: React.FC<DashboardProps> = ({ dashboardData, onRefresh }) => {
  // Extract data from API response structure
  const stats = dashboardData?.stats?.success ? dashboardData.stats.data : dashboardData?.stats;
  const activities = safeArray(dashboardData?.activities);
  const alerts = safeArray(dashboardData?.alerts);
  
  // Extract specific API data
  const systemHealthData = dashboardData?.systemHealth?.success ? dashboardData.systemHealth.data : null;
  const revenueData = dashboardData?.revenue?.success ? dashboardData.revenue.data : null;
  const apiUsageData = dashboardData?.apiUsage?.success ? dashboardData.apiUsage.data : null;
  const workPermitsData = dashboardData?.tasks;
  
  // Debug logging - Complete data structure
  console.log('🔍 COMPLETE SuperAdmin Dashboard Data Structure:');
  console.log('📊 Stats:', stats);
  console.log('📋 Activities:', activities);
  console.log('🚨 Alerts:', alerts);
  console.log('🏥 System Health Data:', systemHealthData);
  console.log('💰 Revenue Data:', revenueData);
  console.log('📈 API Usage Data:', apiUsageData);
  console.log('📋 Work Permits Data:', workPermitsData);
  console.log('🌐 Complete Dashboard Data Object:', dashboardData);
  
  // Data analysis
  console.log('📄 Data Analysis:', {
    statsType: typeof stats,
    statsKeys: stats ? Object.keys(stats) : 'null',
    activitiesLength: activities.length,
    alertsLength: alerts.length,
    activitiesIsArray: Array.isArray(activities),
    alertsIsArray: Array.isArray(alerts),
    systemHealthExists: !!systemHealthData,
    revenueExists: !!revenueData,
    apiUsageExists: !!apiUsageData,
    workPermitsExists: !!workPermitsData,
    hasData: {
      activities: activities.length > 0,
      alerts: alerts.length > 0,
      stats: !!stats,
      systemHealth: !!systemHealthData,
      revenue: !!revenueData,
      apiUsage: !!apiUsageData,
      workPermits: !!workPermitsData
    }
  });
  
  
  // Use the data directly from dashboardData since it's already loaded
  const systemHealth = systemHealthData;
  const revenueStats = revenueData;
  const apiUsageStats = apiUsageData;
  
  
  // Calculate work permits statistics from real API data
  const workPermitsStats = (workPermitsData as any)?.data ? {
    totalWorkPermits: Object.values((workPermitsData as any).data.byStatus).reduce((a: any, b: any) => a + b, 0),
    activeWorkPermits: ((workPermitsData as any).data.byStatus.aprobado || 0) + ((workPermitsData as any).data.byStatus.pendiente || 0),
    pendingApprovals: (workPermitsData as any).data.alerts.pendingApprovals || 0,
    draftPermits: (workPermitsData as any).data.byStatus.borrador || 0,
    expiringSoon: (workPermitsData as any).data.alerts.expiringSoon || 0
  } : {
    totalWorkPermits: 0,
    activeWorkPermits: 0,
    pendingApprovals: 0,
    draftPermits: 0,
    expiringSoon: 0
  };

  // Merge API data with base stats - use real API structure
  const enhancedStats = {
    // Base stats from dashboard API
    totalCompanies: stats?.totalCompanies || 0,
    totalUsers: stats?.totalUsers || 0,
    totalContractors: stats?.totalContractors || 0,
    
    // Work permits from real API
    ...workPermitsStats,
    
    // Revenue data from API
    totalRevenue: revenueStats?.totalRevenue || 0,
    monthlyRevenue: revenueStats?.monthlyRevenue || 0,
    averageRevenuePerUser: revenueStats?.averageRevenuePerUser || 0,
    growthRate: revenueStats?.growthRate || 0,
    subscriptionBreakdown: revenueStats?.subscriptionBreakdown || { basic: 0, premium: 0, enterprise: 0 },
    
    // System health from API
    systemUptime: systemHealth?.uptime || 0,
    systemHealth: {
      database: systemHealth?.database || 'unknown',
      apiServer: systemHealth?.apiServer || 'unknown',
      storageUsage: systemHealth?.storageUsage || 0,
      memoryUsage: systemHealth?.memoryUsage || 0,
      activeConnections: systemHealth?.activeConnections || 0,
      errorRate: systemHealth?.errorRate || 0
    },
    
    // API usage from API
    totalRequests: apiUsageStats?.totalRequests || 0,
    requestsToday: apiUsageStats?.requestsToday || 0,
    avgResponseTime: apiUsageStats?.averageResponseTime || 0,
    errorRate: apiUsageStats?.errorRate || 0,
    topEndpoints: apiUsageStats?.topEndpoints || []
  };

  // Final display stats with all fallbacks
  const displayStats = enhancedStats || {
    totalCompanies: 0,
    totalUsers: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    systemUptime: 0,
    apiRequests: 0,
    newCompaniesThisMonth: 0,
    activeUsersToday: 0,
    systemHealth: {
      database: 'healthy',
      apiServer: 'healthy',
      storageUsage: 0,
      memoryUsage: 0
    }
  };

  // Determine data source indicators
  const hasApiData = {
    stats: !!stats,
    systemHealth: !!systemHealth,
    revenue: !!revenueStats,
    apiUsage: !!apiUsageStats,
    workPermits: !!workPermitsData
  };

  const systemStats = [
    {
      title: 'Espacios de Trabajos Registradas',
      value: (displayStats.totalCompanies || 0).toLocaleString(),
      subtitle: `${displayStats.totalContractors || 0} contratistas`,
      icon: <BusinessIcon sx={{ fontSize: 32, color: '#1976d2' }} />,
      isApiData: hasApiData.stats
    },
    {
      title: 'Usuarios Totales',
      value: (displayStats.totalUsers || 0).toLocaleString(),
      subtitle: `Sistema en línea`,
      icon: <PeopleIcon sx={{ fontSize: 32, color: '#2e7d32' }} />,
      isApiData: hasApiData.stats
    },
    {
      title: 'Permisos de Trabajo',
      value: (displayStats.totalWorkPermits || 0).toLocaleString(),
      subtitle: `${displayStats.draftPermits || 0} borradores, ${displayStats.expiringSoon || 0} por vencer`,
      icon: <AssessmentIcon sx={{ fontSize: 32, color: '#ed6c02' }} />,
      isApiData: hasApiData.workPermits
    },
    {
      title: 'Ingresos Totales',
      value: `$${(displayStats.totalRevenue || 0).toLocaleString()}`,
      subtitle: hasApiData.revenue ? `${displayStats.growthRate >= 0 ? '+' : ''}${displayStats.growthRate}% crecimiento` : 'Total acumulado',
      icon: <TrendingUpIcon sx={{ fontSize: 32, color: '#d32f2f' }} />,
      isApiData: hasApiData.revenue || hasApiData.stats
    }
  ];

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'security': return 'warning';
      case 'system': return 'info';
      case 'billing': return 'success';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Panel de Administrador
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Gestión completa del sistema y supervisión de todas las operaciones
          </Typography>
          {/* API Connection Status */}
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Chip 
              label={`Base Stats: ${hasApiData.stats ? 'API' : 'MOCK'}`}
              color={hasApiData.stats ? 'success' : 'warning'}
              size="small"
            />
            <Chip 
              label={`System Health: ${hasApiData.systemHealth ? 'API' : 'MOCK'}`}
              color={hasApiData.systemHealth ? 'success' : 'warning'}
              size="small"
            />
            <Chip 
              label={`Revenue: ${hasApiData.revenue ? 'API' : 'MOCK'}`}
              color={hasApiData.revenue ? 'success' : 'warning'}
              size="small"
            />
            <Chip 
              label={`API Usage: ${hasApiData.apiUsage ? 'API' : 'MOCK'}`}
              color={hasApiData.apiUsage ? 'success' : 'warning'}
              size="small"
            />
            <Chip 
              label={`Work Permits: ${hasApiData.workPermits ? 'API' : 'MOCK'}`}
              color={hasApiData.workPermits ? 'success' : 'warning'}
              size="small"
            />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => {
              onRefresh.stats();
              onRefresh.activities();
              onRefresh.alerts();
            }}
          >
            Actualizar Datos
          </Button>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => {
              console.log('🔧 Running tests...');
              testSafeArray();
              testSuperAdminEndpoints()
                .then(result => {
                  console.log('🎉 Test completed:', result);
                  alert('Revisa la consola para ver los resultados del test de API');
                })
                .catch(err => {
                  console.error('❌ Test failed:', err);
                  alert('Error en el test de API. Revisa la consola.');
                });
            }}
          >
            Test API
          </Button>
          <Button variant="outlined" size="small">
            Generar Reporte
          </Button>
          <Button variant="contained" size="small">
            Configuración del Sistema
          </Button>
        </Box>
      </Box>

      {/* System Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {systemStats.map((stat, index) => (
          <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ position: 'relative' }}>
              {/* Data source indicator */}
              <Chip 
                label={stat.isApiData ? 'API' : 'MOCK'} 
                color={stat.isApiData ? 'success' : 'warning'} 
                size="small" 
                sx={{ 
                  position: 'absolute', 
                  top: 8, 
                  right: 8, 
                  fontSize: '0.7rem' 
                }}
              />
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {stat.icon}
                  <Box>
                    <Typography variant="h4">{stat.value}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {stat.subtitle}
                    </Typography>
                  </Box>
                </Box>
                <Typography color="textSecondary">{stat.title}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* System Health */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, height: '300px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Estado del Sistema
              </Typography>
              <Chip 
                label={hasApiData.systemHealth ? 'API' : 'LOCAL'} 
                color={hasApiData.systemHealth ? 'success' : 'default'} 
                size="small" 
              />
            </Box>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2">Uptime del Sistema</Typography>
                <Chip 
                  label={`${displayStats.systemUptime}%`} 
                  color="success" 
                  size="small" 
                />
              </Box>
              
              {/* Datos de System Health API */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2">Base de Datos</Typography>
                <Chip 
                  label={systemHealth?.database || displayStats.systemHealth?.database || 'Saludable'} 
                  color={systemHealth?.database === 'healthy' ? 'success' : 'warning'} 
                  size="small" 
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2">Servidor API</Typography>
                <Chip 
                  label={systemHealth?.apiServer || displayStats.systemHealth?.apiServer || 'Operativo'} 
                  color={systemHealth?.apiServer === 'healthy' ? 'success' : 'warning'} 
                  size="small" 
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2">Uso de Almacenamiento</Typography>
                <Typography variant="body2" color="textSecondary">
                  {systemHealth?.storageUsage || displayStats.systemHealth?.storageUsage || 65}%
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2">Uso de Memoria</Typography>
                <Typography variant="body2" color="textSecondary">
                  {systemHealth?.memoryUsage || displayStats.systemHealth?.memoryUsage || 45}%
                </Typography>
              </Box>
              
              {/* Datos de API Usage */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2">Peticiones API (Hoy)</Typography>
                <Typography variant="body2" color="textSecondary">
                  {(displayStats.requestsToday || 0).toLocaleString()}
                </Typography>
              </Box>
              
              {/* Datos de Revenue API */}
              {revenueStats && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Ingresos Mensuales</Typography>
                  <Typography variant="body2" color="primary">
                    ${(revenueStats.monthlyRevenue || 0).toLocaleString()}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Alerts */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, height: '300px' }}>
            <Typography variant="h6" gutterBottom>
              Alertas del Sistema ({alerts.filter((a: any) => !a.isRead).length})
            </Typography>
            {alerts.length === 0 ? (
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: 200,
                  textAlign: 'center'
                }}
              >
                <Typography variant="h3" sx={{ opacity: 0.3, mb: 1 }}>🔔</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  No hay alertas activas
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ mb: 2 }}>
                  {hasApiData.stats ? 'Conectado al API' : 'Esperando datos del servidor'}
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={() => onRefresh.alerts()}
                >
                  Actualizar Alertas
                </Button>
              </Box>
            ) : (
              <List sx={{ maxHeight: 220, overflow: 'auto' }}>
                {alerts.slice(0, 5).map((alert: any, index: number) => (
                  <ListItem key={alert.id || index} sx={{ px: 0, py: 1 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" component="span">
                            {alert.title}
                          </Typography>
                          <Chip 
                            label={alert.priority || 'normal'} 
                            color={getPriorityColor(alert.priority || 'low')} 
                            size="small" 
                          />
                        </Box>
                      }
                      secondary={alert.message}
                    />
                  </ListItem>
                ))}
                {alerts.length > 5 && (
                  <ListItem sx={{ px: 0, py: 1, justifyContent: 'center' }}>
                    <Typography variant="caption" color="primary">
                      +{alerts.length - 5} alertas más
                    </Typography>
                  </ListItem>
                )}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Recent Activities */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, height: '300px' }}>
            <Typography variant="h6" gutterBottom>
              Actividades Recientes
            </Typography>
            {activities.length === 0 ? (
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: 200,
                  textAlign: 'center'
                }}
              >
                <Typography variant="h3" sx={{ opacity: 0.3, mb: 1 }}>📋</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  No hay actividades recientes
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ mb: 2 }}>
                  {hasApiData.stats ? 'Conectado al API' : 'Esperando datos del servidor'}
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={() => onRefresh.activities()}
                >
                  Actualizar Actividades
                </Button>
              </Box>
            ) : (
              <List sx={{ maxHeight: 220, overflow: 'auto' }}>
                {activities.slice(0, 5).map((activity: any, index: number) => (
                  <ListItem key={activity.id || index} sx={{ px: 0, py: 1 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" component="span">
                            {activity.title || activity.description}
                          </Typography>
                          <Chip 
                            label={activity.type || activity.status} 
                            color={getActivityColor(activity.type || activity.status)} 
                            size="small" 
                          />
                        </Box>
                      }
                      secondary={activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Sin fecha'}
                    />
                  </ListItem>
                ))}
                {activities.length > 5 && (
                  <ListItem sx={{ px: 0, py: 1, justifyContent: 'center' }}>
                    <Typography variant="caption" color="primary">
                      +{activities.length - 5} actividades más
                    </Typography>
                  </ListItem>
                )}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Work Permits Details */}
      {workPermitsData && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  Estadísticas de Permisos de Trabajo
                </Typography>
                <Chip 
                  label={hasApiData.workPermits ? 'API' : 'LOCAL'} 
                  color={hasApiData.workPermits ? 'success' : 'default'} 
                  size="small" 
                />
              </Box>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Total Permisos</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {Number(workPermitsStats.totalWorkPermits) || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Borradores</Typography>
                  <Typography variant="body2" color="warning.main">
                    {Number(workPermitsStats.draftPermits) || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Activos</Typography>
                  <Typography variant="body2" color="success.main">
                    {Number(workPermitsStats.activeWorkPermits) || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Por Vencer</Typography>
                  <Typography variant="body2" color="error.main">
                    {Number(workPermitsStats.expiringSoon) || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Aprobaciones Pendientes</Typography>
                  <Typography variant="body2" color="warning.main">
                    {Number(workPermitsStats.pendingApprovals) || 0}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Por Departamento
              </Typography>
              <Box sx={{ mt: 2 }}>
                {(workPermitsData as any)?.data?.byDepartment?.map((dept: any, index: number) => (
                  <Box key={dept._id || index} sx={{ mb: 2, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                      {dept._id || 'Sin departamento'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Typography variant="caption">
                        Pendientes: <strong>{dept.pending}</strong>
                      </Typography>
                      <Typography variant="caption">
                        Aprobados: <strong>{dept.approved}</strong>
                      </Typography>
                      <Typography variant="caption">
                        Rechazados: <strong>{dept.rejected}</strong>
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* API Stats and Revenue Details */}
      {(apiUsageStats || revenueStats) && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {/* API Usage Details */}
          {apiUsageStats && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Estadísticas de API
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Peticiones Totales</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {(apiUsageStats?.totalRequests || 0).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Peticiones Hoy</Typography>
                    <Typography variant="body2">
                      {(apiUsageStats?.requestsToday || 0).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Tiempo Promedio de Respuesta</Typography>
                    <Typography variant="body2">
                      {apiUsageStats?.averageResponseTime || 0}ms
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Tasa de Error</Typography>
                    <Typography variant="body2" color={apiUsageStats?.errorRate > 1 ? "error.main" : "success.main"}>
                      {(apiUsageStats?.errorRate || 0).toFixed(2)}%
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          )}
          
          {/* Revenue Details */}
          {revenueStats && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Detalles de Ingresos
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Ingresos del Mes</Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      ${(revenueStats?.monthlyRevenue || 0).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Tasa de Crecimiento</Typography>
                    <Typography 
                      variant="body2" 
                      color={(revenueStats?.growthRate || 0) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {revenueStats?.growthRate >= 0 ? '+' : ''}{revenueStats?.growthRate || 0}%
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Promedio por Usuario</Typography>
                    <Typography variant="body2">
                      ${(revenueStats?.averageRevenuePerUser || 0).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Total Suscripciones</Typography>
                    <Typography variant="body2">
                      {((revenueStats?.subscriptionBreakdown?.basic || 0) + 
                        (revenueStats?.subscriptionBreakdown?.premium || 0) + 
                        (revenueStats?.subscriptionBreakdown?.enterprise || 0)).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Companies Management Table */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Gestión de Espacios de Trabajos
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Espacios de Trabajo</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Usuarios</TableCell>
                    <TableCell>Última Actividad</TableCell>
                    <TableCell>Suscripción</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Mock company data */}
                  <TableRow>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        TechCorp S.A.
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label="Activa" color="success" size="small" />
                    </TableCell>
                    <TableCell>45</TableCell>
                    <TableCell>Hace 2 horas</TableCell>
                    <TableCell>Premium</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined">
                        Gestionar
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        Constructora ABC
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label="Activa" color="success" size="small" />
                    </TableCell>
                    <TableCell>23</TableCell>
                    <TableCell>Hace 1 día</TableCell>
                    <TableCell>Básico</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined">
                        Gestionar
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        Servicios XYZ Ltda.
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label="Suspendida" color="warning" size="small" />
                    </TableCell>
                    <TableCell>12</TableCell>
                    <TableCell>Hace 5 días</TableCell>
                    <TableCell>Premium</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined">
                        Gestionar
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};