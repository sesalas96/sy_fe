import React from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { useDashboard } from '../hooks/useDashboard';
import { usePageTitle, getPageTitle } from '../hooks/usePageTitle';

// Import all role-specific dashboards
import { SuperAdminDashboard } from '../components/Dashboards/SuperAdminDashboard';
import { SafetyStaffDashboard } from '../components/Dashboards/SafetyStaffDashboard';
import { ClientSupervisorDashboard } from '../components/Dashboards/ClientSupervisorDashboard';
import { ClientApproverDashboard } from '../components/Dashboards/ClientApproverDashboard';
import { ClientStaffDashboard } from '../components/Dashboards/ClientStaffDashboard';
import { ValidadoresOpsDashboard } from '../components/Dashboards/ValidadoresOpsDashboard';
import { ContratistaAdminDashboard } from '../components/Dashboards/ContratistaAdminDashboard';
import { ContratistaSubalternosDashboard } from '../components/Dashboards/ContratistaSubalternosDashboard';
import { ContratistaHuerfanoDashboard } from '../components/Dashboards/ContratistaHuerfanoDashboard';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Set page title
  usePageTitle(getPageTitle('Inicio'), 'Dashboard principal del Sistema de Gestión de Seguridad');
  
  // Initialize dashboard hook with user role
  const dashboardData = useDashboard(user?.role || UserRole.CLIENT_STAFF);
  
  // Show loading state
  if (dashboardData.loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '400px',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Cargando dashboard...
        </Typography>
      </Box>
    );
  }

  // Show error state
  if (dashboardData.error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {dashboardData.error}
        </Alert>
        <Typography variant="body1">
          Por favor, intenta recargar la página o contacta al administrador del sistema.
        </Typography>
      </Box>
    );
  }

  // Route to appropriate dashboard based on user role
  const renderRoleDashboard = () => {
    if (!user) return null;

    const dashboardProps = {
      dashboardData,
      onRefresh: {
        stats: dashboardData.refreshStats,
        activities: dashboardData.refreshActivities,
        alerts: dashboardData.refreshAlerts
      }
    };

    switch (user.role) {
      case UserRole.SUPER_ADMIN:
        return <SuperAdminDashboard {...dashboardProps} />;
      
      case UserRole.SAFETY_STAFF:
        return <SafetyStaffDashboard {...dashboardProps} />;
      
      case UserRole.CLIENT_SUPERVISOR:
        return <ClientSupervisorDashboard {...dashboardProps} />;
      
      case UserRole.CLIENT_APPROVER:
        return <ClientApproverDashboard {...dashboardProps} />;
      
      case UserRole.CLIENT_STAFF:
        return <ClientStaffDashboard {...dashboardProps} />;
      
      case UserRole.VALIDADORES_OPS:
        return <ValidadoresOpsDashboard {...dashboardProps} />;
      
      case UserRole.CONTRATISTA_ADMIN:
        return <ContratistaAdminDashboard {...dashboardProps} />;
      
      case UserRole.CONTRATISTA_SUBALTERNOS:
        return <ContratistaSubalternosDashboard {...dashboardProps} />;
      
      case UserRole.CONTRATISTA_HUERFANO:
        return <ContratistaHuerfanoDashboard {...dashboardProps} />;
      
      default:
        return (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h5" color="error" gutterBottom>
              Rol no reconocido
            </Typography>
            <Typography variant="body1">
              No se pudo determinar el panel apropiado para el rol: {user.role}
            </Typography>
          </Box>
        );
    }
  };

  return renderRoleDashboard();
};