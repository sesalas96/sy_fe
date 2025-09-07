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
  TableRow,
  LinearProgress
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  Warning as WarningIcon,
  Notifications as NotificationIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { DashboardProps } from '../../types/dashboard';
import { SafetyStaffStats } from '../../services/dashboardService';

interface ContractorAlert {
  id: string;
  contractorName: string;
  type: 'document_expiring' | 'course_expiring' | 'permit_expired';
  description: string;
  daysUntilExpiry: number;
  priority: 'high' | 'medium' | 'low';
}

export const SafetyStaffDashboard: React.FC<DashboardProps> = ({ dashboardData }) => {
  const stats = dashboardData.stats as SafetyStaffStats;

  // Default values in case stats are not available
  const displayStats = stats || {
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
  };

  // Mock alerts data based on dashboard alerts
  const contractorAlerts: ContractorAlert[] = [
    {
      id: '1',
      contractorName: 'Juan Pérez',
      type: 'document_expiring',
      description: 'Póliza INS vence en 5 días',
      daysUntilExpiry: 5,
      priority: 'high'
    },
    {
      id: '2',
      contractorName: 'María González',
      type: 'course_expiring',
      description: 'Curso de Alturas vence en 10 días',
      daysUntilExpiry: 10,
      priority: 'medium'
    },
    {
      id: '3',
      contractorName: 'Carlos Rodríguez',
      type: 'permit_expired',
      description: 'Permiso de trabajo expirado',
      daysUntilExpiry: -2,
      priority: 'high'
    }
  ];

  const operationalStats = [
    {
      title: 'Contratistas Activos',
      value: displayStats.activeContractors,
      icon: <PeopleIcon />,
      color: '#1976d2',
      change: '+5 esta semana'
    },
    {
      title: 'Permisos Pendientes',
      value: displayStats.pendingPermits,
      icon: <AssignmentIcon />,
      color: '#ff9800',
      change: '3 urgentes'
    },
    {
      title: 'Documentos por Vencer',
      value: displayStats.expiringDocuments,
      icon: <WarningIcon />,
      color: '#f44336',
      change: 'Próximos 30 días'
    },
    {
      title: 'Cursos Completados',
      value: displayStats.completedCourses,
      icon: <SchoolIcon />,
      color: '#4caf50',
      change: '+12 esta semana'
    }
  ];

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
        <Typography variant="h4" gutterBottom>
          Panel Operativo - Safety Staff
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<NotificationIcon />}>
            Enviar Notificaciones
          </Button>
          <Button variant="contained" color="primary">
            Generar Reporte
          </Button>
        </Box>
      </Box>

      {/* Operational Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {operationalStats.map((stat, index) => (
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
                      {stat.change}
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
        {/* Compliance Overview */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Estado de Cumplimiento
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Tasa General</Typography>
                <Typography variant="body2" color="primary">
                  {displayStats.complianceRate}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={displayStats.complianceRate} 
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
            <List dense>
              <ListItem>
                <ListItemText primary="Documentos Vigentes" />
                <Chip label="94%" color="success" size="small" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Cursos Actualizados" />
                <Chip label="91%" color="success" size="small" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Permisos Activos" />
                <Chip label="98%" color="success" size="small" />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Critical Alerts */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Alertas Críticas
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Contratista</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Días</TableCell>
                    <TableCell>Prioridad</TableCell>
                    <TableCell>Acción</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contractorAlerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>{alert.contractorName}</TableCell>
                      <TableCell>
                        <Chip 
                          label={alert.type.replace('_', ' ')} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{alert.description}</TableCell>
                      <TableCell>
                        <Typography 
                          color={alert.daysUntilExpiry < 0 ? 'error' : 'textPrimary'}
                        >
                          {alert.daysUntilExpiry < 0 ? 'Expirado' : `${alert.daysUntilExpiry} días`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={alert.priority} 
                          color={getPriorityColor(alert.priority) as any}
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Button size="small" variant="outlined">
                          Notificar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Acciones Rápidas
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button variant="contained" color="primary">
                Crear Contratista
              </Button>
              <Button variant="contained" color="secondary">
                Nuevo Permiso de Trabajo
              </Button>
              <Button variant="outlined">
                Sincronizar Cursos
              </Button>
              <Button variant="outlined">
                Revisar Aprobaciones
              </Button>
              <Button variant="outlined" color="warning">
                Ejecutar Verificación
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};