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
  Avatar,
  IconButton,
  LinearProgress,
  Badge
} from '@mui/material';
import {
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Notifications as NotificationsIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardProps } from '../../types/dashboard';
import { ContratistaAdminStats } from '../../services/dashboardService';
import { safeArray } from '../../utils/dashboardUtils';


interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'inactive' | 'on_leave';
  complianceScore: number;
  lastActivity: string;
  avatar?: string;
}

export const ContratistaAdminDashboard: React.FC<DashboardProps> = ({ dashboardData }) => {
  const stats = dashboardData?.stats as ContratistaAdminStats;
  const activities = safeArray(dashboardData?.activities);
  const alerts = safeArray(dashboardData?.alerts);
  const teamMembers = dashboardData?.team || [];
  // Mock team members if not provided by API
  const mockTeamMembers: TeamMember[] = [
    {
      id: '1',
      name: 'Ana García',
      role: 'Técnico Eléctrico',
      status: 'active',
      complianceScore: 95,
      lastActivity: '2024-01-20T10:30:00Z'
    },
    {
      id: '2',
      name: 'Carlos Mendez',
      role: 'Soldador',
      status: 'active',
      complianceScore: 88,
      lastActivity: '2024-01-20T09:15:00Z'
    },
    {
      id: '3',
      name: 'María López',
      role: 'Técnico Mecánico',
      status: 'on_leave',
      complianceScore: 92,
      lastActivity: '2024-01-19T16:45:00Z'
    }
  ];

  const displayTeamMembers = teamMembers.length > 0 ? teamMembers : mockTeamMembers;
  
  // Default values in case stats are not available
  const displayStats = stats || {
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
  };
  const { user } = useAuth();

  const teamStats = [
    {
      title: 'Miembros del Equipo',
      value: displayStats.teamMembers,
      icon: <PeopleIcon />,
      color: '#1976d2',
      subtitle: 'Activos y supervisados'
    },
    {
      title: 'Permisos Activos',
      value: displayStats.activePermits,
      icon: <AssignmentIcon />,
      color: '#2e7d32',
      subtitle: 'En proceso'
    },
    {
      title: 'Entrenamientos Completados',
      value: displayStats.completedTrainings,
      icon: <CheckCircleIcon />,
      color: '#ed6c02',
      subtitle: 'Este mes'
    },
    {
      title: 'Tareas Pendientes',
      value: displayStats.pendingTasks,
      icon: <WarningIcon />,
      color: '#d32f2f',
      subtitle: 'Requieren atención'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'approved': case 'completed': return 'success';
      case 'in_progress': case 'pending': return 'warning';
      case 'inactive': case 'on_leave': return 'default';
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

  const getComplianceColor = (score: number) => {
    if (score >= 95) return 'success';
    if (score >= 85) return 'warning';
    return 'error';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Gestión de Equipo
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Administrador: {user?.name}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<AddIcon />}>
            Agregar Miembro
          </Button>
          <Button variant="contained" color="primary">
            Nuevo Permiso
          </Button>
        </Box>
      </Box>

      {/* Team Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {teamStats.map((stat, index) => (
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
        {/* Team Members Overview */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Miembros del Equipo
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Empleado</TableCell>
                    <TableCell>Rol</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Cumplimiento</TableCell>
                    <TableCell>Última Actividad</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayTeamMembers.map((member: TeamMember) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: '#1976d2' }}>
                            {member.name.charAt(0)}
                          </Avatar>
                          {member.name}
                        </Box>
                      </TableCell>
                      <TableCell>{member.role}</TableCell>
                      <TableCell>
                        <Chip 
                          label={member.status.replace('_', ' ')} 
                          color={getStatusColor(member.status) as any}
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 120 }}>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={member.complianceScore} 
                              color={getComplianceColor(member.complianceScore) as any}
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                          </Box>
                          <Typography variant="body2" sx={{ minWidth: 35 }}>
                            {member.complianceScore}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{member.lastActivity}</TableCell>
                      <TableCell>
                        <IconButton size="small" color="primary">
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton size="small">
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Alerts */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <NotificationsIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                Alertas
              </Typography>
              <Badge badgeContent={safeArray(alerts).filter(a => !a.isRead).length} color="error" sx={{ ml: 1 }} />
            </Box>
            <List>
              {safeArray(alerts).slice(0, 3).map((alert) => (
                <ListItem key={alert.id} divider sx={{ px: 0 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" component="span">
                          {alert.title}
                        </Typography>
                        {!alert.isRead && (
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                          {alert.message}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Chip 
                            label={alert.type} 
                            color={alert.type === 'error' ? 'error' : alert.type === 'warning' ? 'warning' : 'info'}
                            size="small" 
                          />
                          <Chip 
                            label={alert.priority} 
                            color={getPriorityColor(alert.priority) as any}
                            size="small" 
                          />
                          <Typography variant="caption" color="textSecondary">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
              {safeArray(alerts).length === 0 && (
                <ListItem>
                  <ListItemText primary="No hay alertas disponibles" />
                </ListItem>
              )}
            </List>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button variant="outlined" size="small">
                Ver Todas las Alertas
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Activities */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <HistoryIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                Actividades Recientes
              </Typography>
            </Box>
            <List>
              {safeArray(activities).slice(0, 5).map((activity) => (
                <ListItem key={activity.id} divider sx={{ px: 0 }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    {activity.user.name.charAt(0)}
                  </Avatar>
                  <ListItemText
                    primary={activity.description}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          {activity.user.name} - {activity.user.role}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                          <Chip 
                            label={activity.status} 
                            color={getStatusColor(activity.status) as any}
                            size="small" 
                          />
                          <Typography variant="caption" color="textSecondary">
                            {new Date(activity.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
              {safeArray(activities).length === 0 && (
                <ListItem>
                  <ListItemText primary="No hay actividades disponibles" />
                </ListItem>
              )}
            </List>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button variant="outlined" size="small">
                Ver Todas las Actividades
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Gestión del Equipo
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button variant="contained" color="primary">
                Asignar Tarea
              </Button>
              <Button variant="contained" color="secondary">
                Programar Entrenamiento
              </Button>
              <Button variant="outlined">
                Revisar Progreso
              </Button>
              <Button variant="outlined">
                Generar Reporte Equipo
              </Button>
              <Button variant="outlined" color="warning">
                Alertas de Cumplimiento
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};