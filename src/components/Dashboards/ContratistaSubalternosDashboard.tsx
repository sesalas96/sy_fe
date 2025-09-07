import React, { useState } from 'react';
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
  Alert
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  School as SchoolIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardProps } from '../../types/dashboard';
import { ContratistaSubalternosStats } from '../../services/dashboardService';

interface AssignedTask {
  id: string;
  title: string;
  description: string;
  assignedBy: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
}

interface TrainingProgress {
  id: string;
  courseName: string;
  progress: number;
  dueDate: string;
  instructor: string;
  status: 'in_progress' | 'completed' | 'overdue';
}

export const ContratistaSubalternosDashboard: React.FC<DashboardProps> = ({ dashboardData }) => {
  const { user } = useAuth();
  const stats = dashboardData.stats as ContratistaSubalternosStats;

  // Default values in case stats are not available
  const displayStats = stats || {
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
  };

  const [tasks, setTasks] = useState<AssignedTask[]>([
    {
      id: '1',
      title: 'Inspección de Equipos Zona A',
      description: 'Realizar inspección visual de equipos eléctricos en zona industrial A',
      assignedBy: 'José Contratista Admin',
      dueDate: '2024-01-22',
      status: 'pending',
      priority: 'high'
    },
    {
      id: '2',
      title: 'Mantenimiento Preventivo Compresor #3',
      description: 'Cambio de filtros y verificación de presiones en compresor principal',
      assignedBy: 'José Contratista Admin',
      dueDate: '2024-01-25',
      status: 'in_progress',
      priority: 'medium'
    },
    {
      id: '3',
      title: 'Reporte Semanal de Actividades',
      description: 'Completar reporte semanal de actividades realizadas',
      assignedBy: 'José Contratista Admin',
      dueDate: '2024-01-21',
      status: 'pending',
      priority: 'medium'
    }
  ]);

  const trainings: TrainingProgress[] = [
    {
      id: '1',
      courseName: 'Seguridad en Espacios Confinados',
      progress: 75,
      dueDate: '2024-02-15',
      instructor: 'María Instructor',
      status: 'in_progress'
    },
    {
      id: '2',
      courseName: 'Uso Correcto de EPP',
      progress: 100,
      dueDate: '2024-01-15',
      instructor: 'Carlos Safety',
      status: 'completed'
    }
  ];

  const workerStats = [
    {
      title: 'Tareas Asignadas',
      value: displayStats.assignedTasks,
      icon: <AssignmentIcon />,
      color: '#1976d2',
      subtitle: 'Pendientes de completar'
    },
    {
      title: 'Tareas Completadas',
      value: displayStats.completedTasks,
      icon: <CheckCircleIcon />,
      color: '#4caf50',
      subtitle: 'Este mes'
    },
    {
      title: 'Cursos Activos',
      value: displayStats.activeCourses,
      icon: <SchoolIcon />,
      color: '#ff9800',
      subtitle: 'En progreso'
    },
    {
      title: 'Puntaje de Cumplimiento',
      value: `${displayStats.complianceScore}%`,
      icon: <PersonIcon />,
      color: '#9c27b0',
      subtitle: 'Desempeño general'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'info';
      case 'pending': return 'warning';
      case 'overdue': return 'error';
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

  const handleTaskStatusUpdate = (taskId: string, newStatus: string) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus as any } : task
      )
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Avatar sx={{ mr: 2, bgcolor: '#1976d2', width: 56, height: 56 }}>
          {user?.name?.charAt(0)}
        </Avatar>
        <Box>
          <Typography variant="h4" gutterBottom>
            Mi Panel de Trabajo
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            {user?.name} - Trabajador Especializado
          </Typography>
        </Box>
      </Box>

      {/* Compliance Alert */}
      {displayStats.complianceScore < 95 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Tu puntaje de cumplimiento es {displayStats.complianceScore}%. Completa las tareas pendientes para mejorar tu evaluación.
        </Alert>
      )}

      {/* Worker Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {workerStats.map((stat, index) => (
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
        {/* Assigned Tasks */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Mis Tareas Asignadas
            </Typography>
            <List>
              {tasks.map((task) => (
                <ListItem key={task.id} divider>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {task.title}
                        <Chip 
                          label={task.priority} 
                          color={getPriorityColor(task.priority) as any}
                          size="small" 
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {task.description}
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                          Asignado por: {task.assignedBy}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Fecha límite: {new Date(task.dueDate).toLocaleDateString('es-ES')}
                        </Typography>
                      </Box>
                    }
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
                    <Chip 
                      label={task.status.replace('_', ' ')} 
                      color={getStatusColor(task.status) as any}
                      size="small" 
                    />
                    {task.status === 'pending' && (
                      <Button 
                        size="small" 
                        variant="contained" 
                        color="primary"
                        onClick={() => handleTaskStatusUpdate(task.id, 'in_progress')}
                      >
                        Iniciar
                      </Button>
                    )}
                    {task.status === 'in_progress' && (
                      <Button 
                        size="small" 
                        variant="contained" 
                        color="success"
                        onClick={() => handleTaskStatusUpdate(task.id, 'completed')}
                      >
                        Completar
                      </Button>
                    )}
                  </Box>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Training Progress */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Mis Entrenamientos
            </Typography>
            <List>
              {trainings.map((training) => (
                <ListItem key={training.id} divider>
                  <ListItemText
                    primary={training.courseName}
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" display="block">
                          Instructor: {training.instructor}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Vence: {new Date(training.dueDate).toLocaleDateString('es-ES')}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={training.progress} 
                            sx={{ width: '100%', mr: 1, height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="caption">
                            {training.progress}%
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                  <Chip 
                    label={training.status.replace('_', ' ')} 
                    color={getStatusColor(training.status) as any}
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
              <Button variant="outlined" size="small" startIcon={<AccessTimeIcon />}>
                Registrar Horas
              </Button>
              <Button variant="outlined" size="small" startIcon={<AssignmentIcon />}>
                Solicitar Permiso
              </Button>
              <Button variant="outlined" size="small" startIcon={<SchoolIcon />}>
                Ver Cursos Disponibles
              </Button>
              <Button variant="outlined" size="small" color="warning">
                Reportar Problema
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};