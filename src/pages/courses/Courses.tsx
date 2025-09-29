import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  LinearProgress,
  Stack,
  Avatar,
  Tabs,
  Tab,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  School as SchoolIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  WorkspacePremium as CertificationIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { coursesApi } from '../../services/coursesApi';
import { usePageTitle } from '../../hooks/usePageTitle';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`courses-tabpanel-${index}`}
      aria-labelledby={`courses-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export const Courses: React.FC = () => {
  const { user } = useAuth();
  usePageTitle('Mis Cursos', 'Gestión de cursos personales');
  
  const [loading, setLoading] = useState(true);
  const [userCourses, setUserCourses] = useState<any>(null);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [courseFilter, setCourseFilter] = useState<'all' | 'enrollments' | 'enrolled'>('all');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CR');
  };

  const loadUserCourses = useCallback(async (filter: 'all' | 'enrollments' | 'enrolled' = 'all') => {
    if (!user?._id && !user?.id) return;
    
    const userId = user._id || user.id || '';
    setLoading(true);
    
    try {
      // Build query params based on filter
      let queryParams = {};
      if (filter === 'enrollments') {
        queryParams = { type: 'enrollments' };
      } else if (filter === 'enrolled') {
        queryParams = { type: 'enrollments', status: 'enrolled' };
      }
      
      // Cargar cursos del usuario
      const userCoursesResponse = await coursesApi.getUserCourses(userId, queryParams);
      if (userCoursesResponse.success && userCoursesResponse.data) {
        setUserCourses(userCoursesResponse.data);
      } else {
        setUserCourses({
          initial: [],
          additional: [],
          enrollments: [],
          stats: null
        });
      }
      
      // Cargar cursos disponibles (solo si no estamos filtrando)
      if (filter === 'all') {
        try {
          const availableCoursesResponse = await coursesApi.getTalentLMSAvailableCourses();
          if (availableCoursesResponse.success && availableCoursesResponse.data) {
            setAvailableCourses(availableCoursesResponse.data);
          }
        } catch (error) {
          console.error('Error loading available courses:', error);
        }
      }
    } catch (error) {
      console.error('Error loading user courses:', error);
      setUserCourses({
        initial: [],
        additional: [],
        enrollments: [],
        stats: null
      });
    } finally {
      setLoading(false);
    }
  }, [user?._id, user?.id]);

  useEffect(() => {
    loadUserCourses(courseFilter);
  }, [courseFilter]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEnrollInCourse = async (courseId: string) => {
    if (!user?._id && !user?.id) return;
    
    setEnrolling(courseId);
    try {
      const userId = user._id || user.id || '';
      await coursesApi.enrollUserInTalentLMSCourses(userId, [courseId]);
      // Recargar cursos del usuario
      await loadUserCourses(courseFilter);
    } catch (error) {
      console.error('Error enrolling in course:', error);
    } finally {
      setEnrolling(null);
    }
  };

  // Helper function to get course name from available courses
  const getCourseName = (courseId: string) => {
    if (!availableCourses || availableCourses.length === 0) return null;
    const course = availableCourses.find(c => c.id === courseId);
    return course?.name || null;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Mis Cursos
        </Typography>
        <LinearProgress sx={{ mb: 3 }} />
        <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
          Cargando tus cursos...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Mis Cursos
        </Typography>
        
        {/* Filter Buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            label="Todos"
            onClick={() => setCourseFilter('all')}
            color={courseFilter === 'all' ? 'primary' : 'default'}
            variant={courseFilter === 'all' ? 'filled' : 'outlined'}
            clickable
          />
          <Chip
            label="Solo Inscripciones"
            onClick={() => setCourseFilter('enrollments')}
            color={courseFilter === 'enrollments' ? 'primary' : 'default'}
            variant={courseFilter === 'enrollments' ? 'filled' : 'outlined'}
            clickable
            icon={<FilterIcon />}
          />
          <Chip
            label="Solo Activos"
            onClick={() => setCourseFilter('enrolled')}
            color={courseFilter === 'enrolled' ? 'primary' : 'default'}
            variant={courseFilter === 'enrolled' ? 'filled' : 'outlined'}
            clickable
            icon={<CheckCircleIcon />}
          />
        </Box>
      </Box>

      {/* Filter Message */}
      {courseFilter !== 'all' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {courseFilter === 'enrollments' 
            ? 'Mostrando solo cursos inscritos (enrollments)'
            : 'Mostrando solo cursos activos con estado "enrolled"'
          }
        </Alert>
      )}

      {/* Course Statistics */}
      {userCourses?.stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h4" color="success.main">
                  {userCourses.stats.totalCompleted || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">Completados</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h4" color="warning.main">
                  {userCourses.stats.totalEnrolled || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">En Progreso</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h4" color="info.main">
                  {userCourses.stats.averageScore || 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">Puntaje Promedio</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center', p: 2 }}>
                <Chip 
                  label={userCourses.stats.complianceStatus || 'N/A'}
                  color={
                    userCourses.stats.complianceStatus === 'compliant' ? 'success' :
                    userCourses.stats.complianceStatus === 'partial' ? 'warning' : 'error'
                  }
                  size="medium"
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Estado de Cumplimiento
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label={`Mis Cursos ${userCourses ? `(${
          courseFilter === 'all' 
            ? (userCourses.initial?.length || 0) + (userCourses.additional?.length || 0) + (userCourses.enrollments?.length || 0)
            : (userCourses.enrollments?.length || 0)
        })` : ''}`} />
        <Tab 
          label={`Cursos Disponibles ${availableCourses ? `(${availableCourses.length})` : ''}`} 
          disabled={courseFilter !== 'all'}
        />
      </Tabs>

      {/* Tab Panel 0: Mis Cursos */}
      <TabPanel value={tabValue} index={0}>
        {userCourses && (userCourses.initial?.length > 0 || userCourses.additional?.length > 0 || userCourses.enrollments?.length > 0) ? (
          <Stack spacing={3}>
            {/* Cursos Iniciales - Solo mostrar si no estamos filtrando */}
            {courseFilter === 'all' && userCourses.initial?.length > 0 && (
              <>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SchoolIcon color="primary" />
                  Cursos Iniciales
                </Typography>
                <Stack spacing={2}>
                  {userCourses.initial.map((course: any, index: number) => (
                    <Card key={`initial-${index}`} variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {course}
                            </Typography>
                            <Chip 
                              label="Curso Inicial" 
                              color="primary" 
                              size="small"
                              sx={{ mt: 1 }}
                            />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </>
            )}

            {/* Cursos Adicionales - Solo mostrar si no estamos filtrando */}
            {courseFilter === 'all' && userCourses.additional?.length > 0 && (
              <>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3 }}>
                  <SchoolIcon color="secondary" />
                  Cursos Adicionales
                </Typography>
                <Stack spacing={2}>
                  {userCourses.additional.map((course: any, index: number) => (
                    <Card key={`additional-${index}`} variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {course.name || course}
                            </Typography>
                            {course.expiryDate && (
                              <Typography variant="body2" color="text.secondary">
                                Vence: {formatDate(course.expiryDate)}
                              </Typography>
                            )}
                            <Chip 
                              label="Curso Adicional" 
                              color="secondary" 
                              size="small"
                              sx={{ mt: 1 }}
                            />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </>
            )}

            {/* Cursos Inscritos */}
            {userCourses.enrollments?.length > 0 && (
              <>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3 }}>
                  <SchoolIcon color="info" />
                  Cursos Inscritos
                </Typography>
                <Stack spacing={2}>
                  {userCourses.enrollments.map((enrollment: any, index: number) => (
                    <Card key={`enrollment-${index}`} variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {getCourseName(enrollment.talentLMSCourseId || enrollment.courseId) || `Curso ID: ${enrollment.courseId || enrollment.talentLMSCourseId || enrollment}`}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              ID: {enrollment.courseId} {enrollment.talentLMSCourseId && enrollment.talentLMSCourseId !== enrollment.courseId && `(TalentLMS: ${enrollment.talentLMSCourseId})`}
                            </Typography>
                            {enrollment.enrollmentDate && (
                              <Typography variant="body2" color="text.secondary">
                                Inscrito: {formatDate(enrollment.enrollmentDate)}
                              </Typography>
                            )}
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                              <Chip 
                                label="Inscrito" 
                                color="info" 
                                size="small"
                              />
                              {enrollment.progress !== undefined && (
                                <Chip 
                                  label={`${enrollment.progress}% completado`}
                                  color={enrollment.progress === 100 ? 'success' : 'default'}
                                  size="small"
                                />
                              )}
                              {enrollment.status && (
                                <Chip 
                                  label={enrollment.status === 'enrolled' ? 'Inscrito' : enrollment.status}
                                  color="info"
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </>
            )}
          </Stack>
        ) : (
          <Alert severity="info">
            No tienes cursos asignados.
          </Alert>
        )}
      </TabPanel>

      {/* Tab Panel 1: Cursos Disponibles */}
      <TabPanel value={tabValue} index={1}>
        {availableCourses && availableCourses.length > 0 ? (
          <Grid container spacing={2}>
            {availableCourses.map((course: any) => (
              <Grid size={{ xs: 12, md: 6 }} key={course.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      {/* Avatar del curso */}
                      <Avatar
                        src={course.avatar || course.big_avatar}
                        sx={{ width: 60, height: 60 }}
                      >
                        <SchoolIcon />
                      </Avatar>
                      
                      {/* Información del curso */}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {course.name}
                        </Typography>
                        
                        {course.description && (
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              mt: 0.5,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            dangerouslySetInnerHTML={{ __html: course.description }}
                          />
                        )}
                        
                        <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                          {course.certification && (
                            <Chip
                              icon={<CertificationIcon />}
                              label={`Certificado: ${course.certification_duration || 'N/A'}`}
                              size="small"
                              color="success"
                            />
                          )}
                          
                          {course.time_limit && course.time_limit !== "0" && (
                            <Chip
                              icon={<AccessTimeIcon />}
                              label={`Límite: ${course.time_limit} horas`}
                              size="small"
                            />
                          )}
                          
                          <Chip
                            label={course.status === 'active' ? 'Activo' : 'Inactivo'}
                            size="small"
                            color={course.status === 'active' ? 'primary' : 'default'}
                          />
                        </Box>
                      </Box>
                      
                      {/* Acción */}
                      {course.status === 'active' && (
                        <Box>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={enrolling === course.id ? <CircularProgress size={16} /> : <AddIcon />}
                            onClick={() => handleEnrollInCourse(course.id)}
                            disabled={enrolling === course.id}
                          >
                            {enrolling === course.id ? 'Inscribiendo...' : 'Inscribirse'}
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info">
            No hay cursos disponibles en este momento.
          </Alert>
        )}
      </TabPanel>
    </Box>
  );
};