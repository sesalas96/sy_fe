import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Button,
  IconButton,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Assignment as AssignmentIcon,
  Settings as SettingsIcon,
  AccountCircle as AccountIcon,
  TrendingUp as TrendingIcon,
  AdminPanelSettings as AdminIcon,
  CheckCircle as ApprovalIcon,
  Report as ReportIcon,
  GroupWork as TeamIcon,
  VerifiedUser as VerifiedIcon,
  Business as BusinessIcon,
  PersonAdd as PersonAddIcon,
  Work as WorkIcon,
  Description as DocumentIcon,
  Dashboard as DashboardIcon,
  Gavel as ComplianceIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';

const HelpCenterHome: React.FC = () => {
  const { user } = useAuth();
  const tutorialProgress = 65; // Porcentaje de progreso

  // Define role-specific quick actions
  const getRoleQuickActions = () => {
    if (!user?.role) return [];

    const roleActions: Record<string, Array<{ icon: React.ReactNode; label: string; color: string }>> = {
      'super_admin': [
        { icon: <AdminIcon />, label: 'Panel Admin', color: '#9C27B0' },
        { icon: <TeamIcon />, label: 'Gestión Usuarios', color: '#673AB7' },
        { icon: <DashboardIcon />, label: 'Dashboard', color: '#3F51B5' },
        { icon: <SettingsIcon />, label: 'Configuración', color: '#FF9800' },
      ],
      'safety_staff': [
        { icon: <SecurityIcon />, label: 'Inspecciones', color: '#4CAF50' },
        { icon: <AssignmentIcon />, label: 'Permisos', color: '#2196F3' },
        { icon: <ReportIcon />, label: 'Incidentes', color: '#F44336' },
        { icon: <VerifiedIcon />, label: 'Auditorías', color: '#00BCD4' },
      ],
      'client_supervisor': [
        { icon: <AssignmentIcon />, label: 'Crear Permiso', color: '#2196F3' },
        { icon: <TeamIcon />, label: 'Mi Equipo', color: '#009688' },
        { icon: <ReportIcon />, label: 'Reportar', color: '#FF5722' },
        { icon: <WorkIcon />, label: 'Trabajos Activos', color: '#795548' },
      ],
      'client_approver': [
        { icon: <ApprovalIcon />, label: 'Aprobar Permisos', color: '#FF9800' },
        { icon: <ComplianceIcon />, label: 'Validar HSE', color: '#FF6F00' },
        { icon: <SecurityIcon />, label: 'Análisis Riesgos', color: '#4CAF50' },
        { icon: <DashboardIcon />, label: 'Dashboard HSE', color: '#2196F3' },
      ],
      'client_staff': [
        { icon: <AssignmentIcon />, label: 'Ver Permisos', color: '#2196F3' },
        { icon: <ReportIcon />, label: 'Reportar', color: '#FF5722' },
        { icon: <SecurityIcon />, label: 'Seguridad', color: '#4CAF50' },
        { icon: <AccountIcon />, label: 'Mi Perfil', color: '#9C27B0' },
      ],
      'validadores_ops': [
        { icon: <VerifiedIcon />, label: 'Verificar Docs', color: '#00BCD4' },
        { icon: <DocumentIcon />, label: 'Certificaciones', color: '#3F51B5' },
        { icon: <TeamIcon />, label: 'Contratistas', color: '#009688' },
        { icon: <ComplianceIcon />, label: 'Checklist', color: '#FF9800' },
      ],
      'contratista_admin': [
        { icon: <BusinessIcon />, label: 'Mi Espacio de trabajo', color: '#795548' },
        { icon: <PersonAddIcon />, label: 'Gestión Personal', color: '#607D8B' },
        { icon: <DocumentIcon />, label: 'Documentos', color: '#3F51B5' },
        { icon: <WorkIcon />, label: 'Licitaciones', color: '#FF5722' },
      ],
      'contratista_subalternos': [
        { icon: <WorkIcon />, label: 'Mis Trabajos', color: '#9E9E9E' },
        { icon: <DocumentIcon />, label: 'Mis Certificados', color: '#607D8B' },
        { icon: <SecurityIcon />, label: 'Protocolos', color: '#4CAF50' },
        { icon: <AccountIcon />, label: 'Mi Perfil', color: '#9C27B0' },
      ],
      'contratista_huerfano': [
        { icon: <WorkIcon />, label: 'Oportunidades', color: '#3F51B5' },
        { icon: <DocumentIcon />, label: 'Mi Portfolio', color: '#2196F3' },
        { icon: <VerifiedIcon />, label: 'Certificaciones', color: '#00BCD4' },
        { icon: <AccountIcon />, label: 'Mi Perfil', color: '#9C27B0' },
      ],
    };

    return roleActions[user.role.toLowerCase()] || [
      { icon: <SecurityIcon />, label: 'Seguridad', color: '#4CAF50' },
      { icon: <AssignmentIcon />, label: 'Permisos', color: '#2196F3' },
      { icon: <SettingsIcon />, label: 'Configuración', color: '#FF9800' },
      { icon: <AccountIcon />, label: 'Mi Cuenta', color: '#9C27B0' },
    ];
  };

  const quickActions = getRoleQuickActions();

  // Define role-specific popular articles
  const getRolePopularArticles = () => {
    if (!user?.role) return [];

    const roleArticles: Record<string, Array<{ title: string; views: number }>> = {
      'super_admin': [
        { title: 'Gestión de espacios de trabajo y empresas', views: 1456 },
        { title: 'Configuración de roles y permisos', views: 1234 },
        { title: 'Generación de reportes ejecutivos', views: 987 },
        { title: 'Administración de suscripciones', views: 756 },
      ],
      'safety_staff': [
        { title: 'Proceso de aprobación de permisos críticos', views: 1567 },
        { title: 'Realización de inspecciones de seguridad', views: 1234 },
        { title: 'Gestión de incidentes y emergencias', views: 987 },
        { title: 'Actualización de procedimientos HSE', views: 856 },
      ],
      'client_supervisor': [
        { title: 'Cómo crear un nuevo permiso de trabajo', views: 1890 },
        { title: 'Coordinación con contratistas', views: 1234 },
        { title: 'Supervisión de trabajos en campo', views: 987 },
        { title: 'Reportar observaciones de seguridad', views: 723 },
      ],
      'client_approver': [
        { title: 'Guía de aprobación de permisos de alto riesgo', views: 1678 },
        { title: 'Validación de análisis de riesgos', views: 1345 },
        { title: 'Auditoría de cumplimiento normativo', views: 987 },
        { title: 'Autorización de trabajos críticos', views: 856 },
      ],
      'client_staff': [
        { title: 'Cómo reportar condiciones inseguras', views: 1234 },
        { title: 'Consultar permisos de trabajo activos', views: 987 },
        { title: 'Completar capacitaciones obligatorias', views: 856 },
        { title: 'Procedimientos de emergencia', views: 723 },
      ],
      'validadores_ops': [
        { title: 'Verificación de documentación de contratistas', views: 1456 },
        { title: 'Validación de certificaciones y competencias', views: 1234 },
        { title: 'Uso de check-lists de verificación', views: 987 },
        { title: 'Inspección de equipos y herramientas', views: 856 },
      ],
      'contratista_admin': [
        { title: 'Gestión de personal de la empresa', views: 1567 },
        { title: 'Participación en licitaciones', views: 1234 },
        { title: 'Mantener documentación corporativa', views: 987 },
        { title: 'Coordinación de trabajos asignados', views: 856 },
      ],
      'contratista_subalternos': [
        { title: 'Ejecución segura de trabajos', views: 1234 },
        { title: 'Uso correcto de EPP', views: 987 },
        { title: 'Reporte de avances de trabajo', views: 856 },
        { title: 'Mantener certificaciones vigentes', views: 723 },
      ],
      'contratista_huerfano': [
        { title: 'Cómo encontrar oportunidades de trabajo', views: 1456 },
        { title: 'Actualizar perfil profesional', views: 1234 },
        { title: 'Enviar propuestas competitivas', views: 987 },
        { title: 'Mantener certificaciones al día', views: 856 },
      ],
    };

    return roleArticles[user.role.toLowerCase()] || [
      { title: 'Cómo crear un nuevo permiso de trabajo', views: 1234 },
      { title: 'Configurar notificaciones de seguridad', views: 987 },
      { title: 'Guía de aprobación de permisos', views: 856 },
      { title: 'Reportar incidentes de seguridad', views: 723 },
    ];
  };

  const popularArticles = getRolePopularArticles();

  return (
    <Box sx={{ p: 3 }}>

      {/* Quick Actions */}
      <Typography variant="h6" gutterBottom>
        Acciones Rápidas
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        {quickActions.map((action, index) => (
          <Box key={index} sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 120, maxWidth: 200 }}>
            <Card 
              sx={{ 
                textAlign: 'center', 
                cursor: 'pointer',
                height: '100%',
                '&:hover': { 
                  transform: 'translateY(-2px)',
                  boxShadow: 3,
                  transition: 'all 0.3s'
                }
              }}
            >
              <CardContent>
                <IconButton 
                  sx={{ 
                    color: action.color,
                    backgroundColor: `${action.color}20`,
                    mb: 1
                  }}
                >
                  {action.icon}
                </IconButton>
                <Typography variant="body2">{action.label}</Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Tutorial Progress */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle1">
              Progreso del Tutorial
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tutorialProgress}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={tutorialProgress} 
            sx={{ height: 8, borderRadius: 4, mb: 2 }}
          />
          <Button size="small" variant="text">
            Continuar donde lo dejaste
          </Button>
        </CardContent>
      </Card>

      {/* Popular Articles */}
      <Typography variant="h6" gutterBottom>
        Artículos Populares
      </Typography>
      <Box>
        {popularArticles.map((article, index) => (
          <Card 
            key={index} 
            sx={{ 
              mb: 1, 
              cursor: 'pointer',
              '&:hover': { backgroundColor: 'action.hover' }
            }}
          >
            <CardContent sx={{ py: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">{article.title}</Typography>
                <Chip 
                  icon={<TrendingIcon />} 
                  label={`${article.views} vistas`} 
                  size="small" 
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default HelpCenterHome;