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
  LinearProgress,
  Avatar,
  Alert,
  Divider
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  School as SchoolIcon,
  Business as BusinessIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardProps } from '../../types/dashboard';
import { ContratistaHuerfanoStats } from '../../services/dashboardService';

interface Project {
  id: string;
  title: string;
  client: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'active' | 'completed' | 'paused';
  progress: number;
  value: number;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  status: 'valid' | 'expiring' | 'expired';
}

export const ContratistaHuerfanoDashboard: React.FC<DashboardProps> = ({ dashboardData }) => {
  const { user } = useAuth();
  const stats = dashboardData?.stats as ContratistaHuerfanoStats;
  // const activities = safeArray(dashboardData?.activities);
  // const alerts = safeArray(dashboardData?.alerts);

  // Default values in case stats are not available
  const displayStats = stats || {
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
  };

  const projects: Project[] = [
    {
      id: '1',
      title: 'Instalación Sistema HVAC',
      client: 'TechCorp S.A.',
      description: 'Instalación completa de sistema de climatización en oficinas corporativas',
      startDate: '2024-01-15',
      endDate: '2024-02-15',
      status: 'active',
      progress: 65,
      value: 3500
    },
    {
      id: '2',
      title: 'Mantenimiento Eléctrico Industrial',
      client: 'Manufacturas del Norte',
      description: 'Mantenimiento preventivo y correctivo de instalaciones eléctricas',
      startDate: '2024-01-20',
      endDate: '2024-01-25',
      status: 'active',
      progress: 30,
      value: 1200
    },
    {
      id: '3',
      title: 'Auditoría de Seguridad',
      client: 'Construcciones Beta',
      description: 'Evaluación completa de protocolos de seguridad en obra',
      startDate: '2024-02-01',
      endDate: '2024-02-05',
      status: 'pending',
      progress: 0,
      value: 800
    }
  ];

  const certifications: Certification[] = [
    {
      id: '1',
      name: 'Certificación en Alturas',
      issuer: 'Instituto de Seguridad Industrial',
      issueDate: '2023-06-15',
      expiryDate: '2024-06-15',
      status: 'expiring'
    },
    {
      id: '2',
      name: 'Licencia Electricista Industrial',
      issuer: 'Colegio de Ingenieros',
      issueDate: '2022-03-10',
      expiryDate: '2025-03-10',
      status: 'valid'
    },
    {
      id: '3',
      name: 'Certificación HVAC Avanzado',
      issuer: 'Asociación HVAC Nacional',
      issueDate: '2023-09-20',
      expiryDate: '2026-09-20',
      status: 'valid'
    }
  ];

  const independentStats = [
    {
      title: 'Proyectos Activos',
      value: displayStats.activeProjects,
      icon: <AssignmentIcon />,
      color: '#1976d2',
      trend: 'En progreso'
    },
    {
      title: 'Proyectos Completados',
      value: displayStats.completedProjects,
      icon: <CheckCircleIcon />,
      color: '#4caf50',
      trend: 'Este año'
    },
    {
      title: 'Certificaciones Vigentes',
      value: displayStats.certifications,
      icon: <SchoolIcon />,
      color: '#ff9800',
      trend: '2 por renovar'
    },
    {
      title: 'Ingresos Mensuales',
      value: `$${(displayStats.monthlyEarnings || 0).toLocaleString()}`,
      icon: <TrendingUpIcon />,
      color: '#9c27b0',
      trend: '+15% vs mes anterior'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'valid': return 'success';
      case 'pending': case 'expiring': return 'warning';
      case 'completed': return 'info';
      case 'paused': case 'expired': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': 'Pendiente',
      'active': 'Activo',
      'completed': 'Completado',
      'paused': 'Pausado',
      'valid': 'Vigente',
      'expiring': 'Por Vencer',
      'expired': 'Vencido'
    };
    return labels[status] || status;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Avatar sx={{ mr: 2, bgcolor: '#1976d2', width: 56, height: 56 }}>
          {user?.name?.charAt(0)}
        </Avatar>
        <Box>
          <Typography variant="h4" gutterBottom>
            Panel de Contratista Particular
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            {user?.name} - Profesional Independiente
          </Typography>
        </Box>
      </Box>

      {/* Compliance Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Como Contratista Particular, mantén tus certificaciones actualizadas y cumple con los estándares de seguridad.
          Tu puntaje actual: <strong>{displayStats.complianceScore}%</strong>
        </Typography>
      </Alert>

      {/* Independent Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {independentStats.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    backgroundColor: stat.color, 
                    borderRadius: '50%', 
                    p: 1, 
                    color: 'white',
                    mr: 2
                  }}>
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography variant="h4">{stat.value}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {stat.trend}
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
        {/* Active Projects */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Mis Proyectos
            </Typography>
            <List>
              {projects.map((project) => (
                <ListItem key={project.id} divider>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h6">{project.title}</Typography>
                        <Chip 
                          label={getStatusLabel(project.status)} 
                          color={getStatusColor(project.status) as any}
                          size="small" 
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="textPrimary">
                          Cliente: {project.client}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {project.description}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                          <Typography variant="caption">
                            {new Date(project.startDate).toLocaleDateString('es-ES')} - {new Date(project.endDate).toLocaleDateString('es-ES')}
                          </Typography>
                          <Typography variant="caption" color="primary">
                            Valor: ${(project.value || 0).toLocaleString()}
                          </Typography>
                        </Box>
                        {project.status === 'active' && (
                          <Box sx={{ mt: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="caption">Progreso</Typography>
                              <Typography variant="caption">{project.progress}%</Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={project.progress} 
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Certifications & Quick Actions */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Mis Certificaciones
            </Typography>
            <List dense>
              {certifications.map((cert) => (
                <ListItem key={cert.id}>
                  <ListItemText
                    primary={cert.name}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          {cert.issuer}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Vence: {new Date(cert.expiryDate).toLocaleDateString('es-ES')}
                        </Typography>
                      </Box>
                    }
                  />
                  <Chip 
                    label={getStatusLabel(cert.status)} 
                    color={getStatusColor(cert.status) as any}
                    size="small" 
                  />
                </ListItem>
              ))}
            </List>
          </Paper>

          <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Gestión Independiente
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="contained" color="primary" startIcon={<BusinessIcon />}>
                Buscar Proyectos
              </Button>
              <Button variant="outlined" startIcon={<AssignmentIcon />}>
                Crear Propuesta
              </Button>
              <Divider sx={{ my: 1 }} />
              <Button variant="outlined" size="small" startIcon={<SchoolIcon />}>
                Renovar Certificaciones
              </Button>
              <Button variant="outlined" size="small" startIcon={<TrendingUpIcon />}>
                Ver Historial de Ingresos
              </Button>
              <Button variant="outlined" size="small" color="warning" startIcon={<WarningIcon />}>
                Reportar Incidente
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};