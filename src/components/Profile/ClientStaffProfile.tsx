import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Card,
  CardContent,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  IconButton,
  Badge,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  School as CourseIcon,
  Assignment as TaskIcon,
  Edit as EditIcon,
  Photo as PhotoIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useContractorFiles } from '../../hooks/useContractorFiles';
import { AvatarEditModal } from './AvatarEditModal';

export const ClientStaffProfile: React.FC = () => {
  const { user, userAvatarUrl } = useAuth();
  const { loading } = useContractorFiles();
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [staffSettings, setStaffSettings] = useState({
    courseReminders: true,
    taskNotifications: true,
    weeklyReports: false,
    learningPreference: 'visual',
    workDepartment: 'operations',
    shiftPreference: 'morning'
  });

  const personalStats = {
    completedCourses: 8,
    activeCourses: 2,
    certificatesEarned: 6,
    complianceScore: 92,
    tasksCompleted: 47,
    currentLevel: 'Intermedio'
  };

  const activeCourses = [
    { name: 'Seguridad en Espacios Confinados', progress: 75, dueDate: '2024-02-15' },
    { name: 'Uso Correcto de EPP', progress: 45, dueDate: '2024-02-20' }
  ];

  const recentAchievements = [
    { title: 'Curso Completado', description: 'Primeros Auxilios Básicos', date: '2024-01-15' },
    { title: 'Certificación Obtenida', description: 'Manejo de Equipos', date: '2024-01-10' },
    { title: 'Evaluación Aprobada', description: 'Protocolos de Emergencia', date: '2024-01-05' }
  ];

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Personal Identity */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Tooltip title={userAvatarUrl ? "Clic para editar foto" : "Agregar foto de perfil"}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      <IconButton
                        sx={{
                          bgcolor: 'info.main',
                          color: 'white',
                          width: 28,
                          height: 28,
                          '&:hover': {
                            bgcolor: 'info.dark',
                          }
                        }}
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAvatarModalOpen(true);
                        }}
                      >
                        <EditIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    }
                  >
                    <Box 
                      sx={{ 
                        position: 'relative', 
                        mr: 2,
                        cursor: 'pointer',
                        '&:hover': {
                          '& .MuiAvatar-root': {
                            opacity: 0.8
                          }
                        }
                      }}
                      onClick={() => setAvatarModalOpen(true)}
                    >
                      <Avatar
                        sx={{ 
                          width: 80, 
                          height: 80, 
                          bgcolor: userAvatarUrl ? 'transparent' : 'info.main',
                          transition: 'opacity 0.2s',
                          border: !userAvatarUrl ? '2px dashed' : 'none',
                          borderColor: 'action.disabled'
                        }}
                        src={userAvatarUrl || undefined}
                      >
                        {!userAvatarUrl && <PhotoIcon sx={{ fontSize: 40 }} />}
                      </Avatar>
                      {loading && (
                        <Box sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'rgba(255,255,255,0.8)',
                          borderRadius: '50%'
                        }}>
                          <CircularProgress size={24} />
                        </Box>
                      )}
                    </Box>
                  </Badge>
                </Tooltip>
                <Box>
                  <Typography variant="h6" color="info.main">
                    {user?.name}
                  </Typography>
                  <Chip 
                    label="Internos" 
                    color="info" 
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="textSecondary">
                    Empleado - TechCorp S.A.
                  </Typography>
                  {!userAvatarUrl && (
                    <Typography 
                      variant="caption" 
                      color="primary" 
                      sx={{ 
                        mt: 0.5, 
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        '&:hover': {
                          textDecoration: 'none'
                        }
                      }}
                      onClick={() => setAvatarModalOpen(true)}
                    >
                      Agregar foto
                    </Typography>
                  )}
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Nombre Completo"
                    value={user?.name || ''}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Email Corporativo"
                    value={user?.email || ''}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="ID de Empleado"
                    value="EMP-2024-0789"
                    disabled
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <InputLabel>Departamento</InputLabel>
                    <Select
                      value={staffSettings.workDepartment}
                      onChange={(e) => setStaffSettings(prev => ({...prev, workDepartment: e.target.value}))}
                      label="Departamento"
                    >
                      <MenuItem value="operations">Operaciones</MenuItem>
                      <MenuItem value="maintenance">Mantenimiento</MenuItem>
                      <MenuItem value="quality">Calidad</MenuItem>
                      <MenuItem value="administration">Administración</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Learning Progress */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="info.main">
                Progreso de Aprendizaje
              </Typography>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 4 }}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="h5" color="success.main">
                      {personalStats.completedCourses}
                    </Typography>
                    <Typography variant="caption">
                      Cursos Completados
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="h5" color="warning.main">
                      {personalStats.activeCourses}
                    </Typography>
                    <Typography variant="caption">
                      En Progreso
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="h5" color="primary.main">
                      {personalStats.certificatesEarned}
                    </Typography>
                    <Typography variant="caption">
                      Certificados
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Box sx={{ p: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Nivel Actual: {personalStats.currentLevel} ({personalStats.complianceScore}%)
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={personalStats.complianceScore} 
                      color="info"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <InputLabel>Preferencia de Aprendizaje</InputLabel>
                    <Select
                      value={staffSettings.learningPreference}
                      onChange={(e) => setStaffSettings(prev => ({...prev, learningPreference: e.target.value}))}
                      label="Preferencia de Aprendizaje"
                    >
                      <MenuItem value="visual">Visual (Videos, Imágenes)</MenuItem>
                      <MenuItem value="reading">Lectura (Documentos, Textos)</MenuItem>
                      <MenuItem value="interactive">Interactivo (Simuladores)</MenuItem>
                      <MenuItem value="mixed">Mixto</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Courses */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="info.main">
                Cursos Activos
              </Typography>
              <List>
                {activeCourses.map((course, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CourseIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={course.name}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            Vence: {course.dueDate}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={course.progress} 
                              sx={{ width: '100%', mr: 1, height: 6, borderRadius: 3 }}
                            />
                            <Typography variant="caption">
                              {course.progress}%
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Personal Settings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="info.main">
                Configuraciones Personales
              </Typography>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <InputLabel>Turno Preferido</InputLabel>
                    <Select
                      value={staffSettings.shiftPreference}
                      onChange={(e) => setStaffSettings(prev => ({...prev, shiftPreference: e.target.value}))}
                      label="Turno Preferido"
                    >
                      <MenuItem value="morning">Matutino (7:00 AM - 3:00 PM)</MenuItem>
                      <MenuItem value="afternoon">Vespertino (3:00 PM - 11:00 PM)</MenuItem>
                      <MenuItem value="night">Nocturno (11:00 PM - 7:00 AM)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={staffSettings.courseReminders}
                          onChange={(e) => setStaffSettings(prev => ({...prev, courseReminders: e.target.checked}))}
                          color="info"
                        />
                      }
                      label="Recordatorios de cursos"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={staffSettings.taskNotifications}
                          onChange={(e) => setStaffSettings(prev => ({...prev, taskNotifications: e.target.checked}))}
                          color="warning"
                        />
                      }
                      label="Notificaciones de tareas"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={staffSettings.weeklyReports}
                          onChange={(e) => setStaffSettings(prev => ({...prev, weeklyReports: e.target.checked}))}
                          color="success"
                        />
                      }
                      label="Reportes semanales"
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Achievements */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="info.main">
                Logros Recientes
              </Typography>
              <List>
                {recentAchievements.map((achievement, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <TaskIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={achievement.title}
                      secondary={`${achievement.description} - ${achievement.date}`}
                    />
                    <Chip label="COMPLETADO" color="success" size="small" />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Avatar Edit Modal */}
      <AvatarEditModal
        open={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        currentAvatarUrl={userAvatarUrl}
        onAvatarUpdated={() => {
          // Avatar will be refreshed automatically via AuthContext
        }}
      />
    </Box>
  );
};