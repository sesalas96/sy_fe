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
  Avatar
} from '@mui/material';
import {
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardProps } from '../../types/dashboard';
import { ClientStaffStats } from '../../services/dashboardService';

interface CourseProgress {
  id: string;
  name: string;
  progress: number;
  status: 'in_progress' | 'completed' | 'not_started';
  dueDate?: string;
  certificateUrl?: string;
}

interface UpcomingTask {
  id: string;
  title: string;
  type: 'course' | 'renewal' | 'safety_meeting';
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
}

export const ClientStaffDashboard: React.FC<DashboardProps> = ({ dashboardData }) => {
  const { user } = useAuth();
  const stats = dashboardData.stats as ClientStaffStats;

  // Default values in case stats are not available
  const displayStats = stats || {
    completedCourses: 8,
    activeCourses: 2,
    certificatesEarned: 6,
    overallProgress: 80,
    nextCertificationExpiry: '2024-06-15',
    hoursCompleted: 45,
    complianceStatus: 'compliant',
    upcomingDeadlines: 3
  };

  const courses: CourseProgress[] = [
    {
      id: '1',
      name: 'Seguridad en Espacios Confinados',
      progress: 75,
      status: 'in_progress',
      dueDate: '2024-02-15'
    },
    {
      id: '2',
      name: 'Manejo de Equipos de Protección Personal',
      progress: 100,
      status: 'completed',
      certificateUrl: '/certificates/epp-cert.pdf'
    },
    {
      id: '3',
      name: 'Procedimientos de Emergencia',
      progress: 45,
      status: 'in_progress',
      dueDate: '2024-02-20'
    }
  ];

  const upcomingTasks: UpcomingTask[] = [
    {
      id: '1',
      title: 'Renovar certificación CPR',
      type: 'renewal',
      dueDate: '2024-02-10',
      priority: 'high'
    },
    {
      id: '2',
      title: 'Charla de seguridad mensual',
      type: 'safety_meeting',
      dueDate: '2024-02-05',
      priority: 'medium'
    },
    {
      id: '3',
      title: 'Completar curso de Alturas',
      type: 'course',
      dueDate: '2024-02-15',
      priority: 'high'
    }
  ];

  const personalStats = [
    {
      title: 'Cursos Completados',
      value: displayStats.completedCourses,
      icon: <CheckCircleIcon />,
      color: '#4caf50'
    },
    {
      title: 'Cursos Activos',
      value: displayStats.activeCourses,
      icon: <SchoolIcon />,
      color: '#2196f3'
    },
    {
      title: 'Certificados Obtenidos',
      value: displayStats.certificatesEarned,
      icon: <AssignmentIcon />,
      color: '#ff9800'
    },
    {
      title: 'Progreso General',
      value: `${displayStats.overallProgress}%`,
      icon: <AccessTimeIcon />,
      color: '#9c27b0'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'info';
      case 'not_started': return 'default';
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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Avatar sx={{ mr: 2, bgcolor: '#1976d2', width: 56, height: 56 }}>
          {user?.name?.charAt(0)}
        </Avatar>
        <Box>
          <Typography variant="h4" gutterBottom>
            Mi Panel Personal
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Bienvenido, {user?.name}
          </Typography>
        </Box>
      </Box>

      {/* Personal Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {personalStats.map((stat, index) => (
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
                  <Typography variant="h4">{stat.value}</Typography>
                </Box>
                <Typography color="textSecondary">{stat.title}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Course Progress */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Mis Cursos
            </Typography>
            <List>
              {courses.map((course) => (
                <ListItem key={course.id} divider>
                  <ListItemText
                    primary={course.name}
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption">
                            Progreso: {course.progress}%
                          </Typography>
                          {course.dueDate && (
                            <Typography variant="caption">
                              Vence: {new Date(course.dueDate).toLocaleDateString('es-ES')}
                            </Typography>
                          )}
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={course.progress} 
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    }
                  />
                  <Box sx={{ ml: 2 }}>
                    <Chip 
                      label={course.status.replace('_', ' ')} 
                      color={getStatusColor(course.status) as any}
                      size="small" 
                    />
                    {course.certificateUrl && (
                      <Button 
                        size="small" 
                        variant="outlined" 
                        sx={{ ml: 1 }}
                        onClick={() => window.open(course.certificateUrl, '_blank')}
                      >
                        Ver Certificado
                      </Button>
                    )}
                  </Box>
                </ListItem>
              ))}
            </List>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button variant="contained" color="primary">
                Explorar Más Cursos
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Upcoming Tasks */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Tareas Pendientes
            </Typography>
            <List>
              {upcomingTasks.map((task) => (
                <ListItem key={task.id} divider>
                  <ListItemText
                    primary={task.title}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          Tipo: {task.type.replace('_', ' ')}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Vence: {new Date(task.dueDate).toLocaleDateString('es-ES')}
                        </Typography>
                      </Box>
                    }
                  />
                  <Chip 
                    label={task.priority} 
                    color={getPriorityColor(task.priority) as any}
                    size="small" 
                  />
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* Quick Actions */}
          <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Acciones Rápidas
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="outlined" size="small">
                Ver Mis Certificados
              </Button>
              <Button variant="outlined" size="small">
                Actualizar Perfil
              </Button>
              <Button variant="outlined" size="small">
                Historial de Capacitaciones
              </Button>
              <Button variant="outlined" size="small" color="warning">
                Reportar Incidente
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};