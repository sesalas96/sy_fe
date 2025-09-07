import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  LinearProgress,
  Chip,
  Button,
  Stepper,
  Step,
  StepLabel,
  Divider,
  IconButton,
  Collapse,
  Alert,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  PlayArrow as PlayIcon,
  School as TutorialIcon,
  Assignment as TaskIcon,
  Timer as TimerIcon,
  EmojiEvents as TrophyIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

interface Task {
  id: number;
  title: string;
  completed: boolean;
  category: string;
}

interface Tutorial {
  id: number;
  title: string;
  steps: string[];
  progress: number;
  estimatedTime: string;
}

const HelpCenterTasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: 'Completar perfil de usuario', completed: true, category: 'Configuración' },
    { id: 2, title: 'Ver video de inducción de seguridad', completed: true, category: 'Seguridad' },
    { id: 3, title: 'Configurar notificaciones', completed: false, category: 'Configuración' },
    { id: 4, title: 'Crear tu primer permiso de trabajo', completed: false, category: 'Permisos' },
    { id: 5, title: 'Revisar protocolos de emergencia', completed: false, category: 'Seguridad' },
  ]);

  const [expandedTutorial, setExpandedTutorial] = useState<number | null>(null);

  const tutorials: Tutorial[] = [
    {
      id: 1,
      title: 'Guía de inicio rápido',
      steps: [
        'Configura tu perfil y preferencias',
        'Explora el dashboard principal',
        'Crea tu primer permiso de trabajo',
        'Configura las notificaciones',
        'Completa la evaluación de seguridad',
      ],
      progress: 60,
      estimatedTime: '15 min',
    },
    {
      id: 2,
      title: 'Gestión de permisos de trabajo',
      steps: [
        'Tipos de permisos disponibles',
        'Crear un nuevo permiso',
        'Proceso de aprobación',
        'Seguimiento de permisos',
      ],
      progress: 0,
      estimatedTime: '20 min',
    },
    {
      id: 3,
      title: 'Protocolos de seguridad',
      steps: [
        'Equipos de protección personal',
        'Evaluación de riesgos',
        'Procedimientos de emergencia',
        'Reportes de incidentes',
      ],
      progress: 25,
      estimatedTime: '30 min',
    },
  ];

  const handleTaskToggle = (taskId: number) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  // const handleNext = () => {
  //   setActiveStep((prevActiveStep) => prevActiveStep + 1);
  // };

  // const handleBack = () => {
  //   setActiveStep((prevActiveStep) => prevActiveStep - 1);
  // };

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalProgress = (completedTasks / tasks.length) * 100;

  return (
    <Box sx={{ p: 3 }}>
      {/* Progress Overview */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Box sx={{ color: 'white' }}>
            <Typography variant="h6" gutterBottom>
              Tu Progreso
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ flex: 1, mr: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={totalProgress} 
                  sx={{ 
                    height: 10, 
                    borderRadius: 5,
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'white',
                    }
                  }}
                />
              </Box>
              <Typography variant="h5">
                {Math.round(totalProgress)}%
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip 
                icon={<CheckCircleIcon />}
                label={`${completedTasks} completadas`}
                sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
              <Chip 
                icon={<TaskIcon />}
                label={`${tasks.length - completedTasks} pendientes`}
                sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Active Tasks */}
      <Typography variant="h6" gutterBottom>
        Tareas Pendientes
      </Typography>
      <List sx={{ mb: 3 }}>
        {tasks.map((task) => (
          <Card key={task.id} sx={{ mb: 1 }}>
            <ListItem
              secondaryAction={
                <Chip label={task.category} size="small" variant="outlined" />
              }
            >
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={task.completed}
                  onChange={() => handleTaskToggle(task.id)}
                  icon={<UncheckedIcon />}
                  checkedIcon={<CheckCircleIcon color="success" />}
                />
              </ListItemIcon>
              <ListItemText 
                primary={task.title}
                sx={{
                  textDecoration: task.completed ? 'line-through' : 'none',
                  color: task.completed ? 'text.secondary' : 'text.primary',
                }}
              />
            </ListItem>
          </Card>
        ))}
      </List>

      <Divider sx={{ my: 3 }} />

      {/* Tutorials */}
      <Typography variant="h6" gutterBottom>
        Tutoriales Disponibles
      </Typography>
      
      {tutorials.map((tutorial) => (
        <Card key={tutorial.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box
              sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setExpandedTutorial(
                expandedTutorial === tutorial.id ? null : tutorial.id
              )}
            >
              <TutorialIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1">{tutorial.title}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <TimerIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">
                    {tutorial.estimatedTime}
                  </Typography>
                  {tutorial.progress > 0 && (
                    <>
                      <Typography variant="caption" color="text.secondary">•</Typography>
                      <Typography variant="caption" color="primary">
                        {tutorial.progress}% completado
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>
              <IconButton>
                {expandedTutorial === tutorial.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            
            <Collapse in={expandedTutorial === tutorial.id}>
              <Box sx={{ mt: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={tutorial.progress} 
                  sx={{ mb: 2 }}
                />
                <Stepper activeStep={Math.floor(tutorial.progress / 25)} orientation="vertical">
                  {tutorial.steps.map((step, index) => (
                    <Step key={index}>
                      <StepLabel>{step}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
                <Button 
                  variant="contained" 
                  startIcon={<PlayIcon />}
                  sx={{ mt: 2 }}
                  fullWidth
                >
                  {tutorial.progress > 0 ? 'Continuar Tutorial' : 'Comenzar Tutorial'}
                </Button>
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      ))}

      {/* Achievement Alert */}
      {completedTasks >= 3 && (
        <Alert 
          severity="success" 
          icon={<TrophyIcon />}
          sx={{ mt: 3 }}
        >
          <Typography variant="subtitle2">
            ¡Felicitaciones! Has completado {completedTasks} tareas. 
            Sigue así para desbloquear más funcionalidades.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default HelpCenterTasks;