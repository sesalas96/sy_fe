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
  AccessTime as AccessTimeIcon,
  WorkspacePremium as CertificationIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  RemoveCircleOutline as RemoveCircleOutlineIcon,
  PlayArrow as PlayArrowIcon
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
  const [talentLMSUser, setTalentLMSUser] = useState<any>(null);
  const [talentLMSProgress, setTalentLMSProgress] = useState<any>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CR');
  };

  const checkTalentLMSUser = useCallback(async () => {
    if (!user?._id && !user?.id) return;

    try {
      const response = await coursesApi.searchTalentLMSUser({ email: user.email || '' });
      if (response.success && response.data) {
        // searchTalentLMSUser puede devolver un objeto o un array
        const userData = Array.isArray(response.data) ? response.data[0] : response.data;

        if (userData) {
          // La respuesta de searchTalentLMSUser ya incluye los cursos
          // No necesitamos hacer otra llamada
          setTalentLMSUser(userData);
          console.log('TalentLMS user set with courses:', userData.courses?.length || 0);
        } else {
          setTalentLMSUser(null);
        }
      } else {
        setTalentLMSUser(null);
      }
    } catch (error) {
      console.error('Error checking TalentLMS user:', error);
      setTalentLMSUser(null);
    }
  }, [user]);

  const loadCourseProgress = useCallback(async () => {
    if (!user?._id && !user?.id) return;

    const userId = user._id || user.id || '';

    try {
      // TalentLMS progress will be loaded separately if needed

      // Cargar cursos del usuario (iniciales y adicionales)
      try {
        const userCoursesResponse = await coursesApi.getUserCourses(userId);
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
      } catch (error) {
        console.error('Error loading user courses:', error);
        // Set empty structure instead of leaving null
        setUserCourses({
          initial: [],
          additional: [],
          enrollments: [],
          stats: null
        });
      }

      // Cargar cursos disponibles
      try {
        const availableCoursesResponse = await coursesApi.getTalentLMSAvailableCourses();
        if (availableCoursesResponse.success && availableCoursesResponse.data) {
          // Filtrar solo cursos activos
          const activeCourses = availableCoursesResponse.data.filter((course: any) =>
            course.status === 'active' || course.status === 'Active' || !course.status
          );
          setAvailableCourses(activeCourses);
        }
      } catch (error) {
        console.error('Error loading available courses:', error);
      }
    } catch (error) {
      console.error('Error loading course progress:', error);
    }
  }, [user?._id, user?.id]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await checkTalentLMSUser();
      await loadCourseProgress();
      setLoading(false);
    };
    init();
  }, [checkTalentLMSUser, loadCourseProgress]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEnrollInCourse = async (courseId: string) => {
    if (!user || !talentLMSUser) return;

    setEnrolling(courseId);
    try {
      const response = await coursesApi.enrollToCourse({
        userId: String(talentLMSUser.id),
        courseId: courseId,
        role: 'learner'
      });

      if (response.success) {
        // Recargar el progreso del curso y la información del usuario en TalentLMS
        await loadCourseProgress();
        await checkTalentLMSUser();

        // Cambiar al tab "Cursos del usuario" (index 0)
        setTabValue(0);
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
    } finally {
      setEnrolling(null);
    }
  };

  const handleUnenrollFromCourse = async (courseId: string) => {
    if (!talentLMSUser) return;

    try {
      const response = await coursesApi.unenrollFromCourse({
        userId: String(talentLMSUser.id),
        courseId: courseId
      });

      if (response.success) {
        // Recargar el progreso del curso y la información del usuario en TalentLMS
        await loadCourseProgress();
        await checkTalentLMSUser();
      }
    } catch (error: any) {
      console.error('Error unenrolling from course:', error);
    }
  };

  // Función para filtrar cursos disponibles (excluir los ya inscritos)
  const getFilteredAvailableCourses = () => {
    if (!availableCourses || availableCourses.length === 0) return [];

    // Obtener IDs de todos los cursos que el usuario ya tiene
    const enrolledCourseIds = new Set<string>();

    // Agregar cursos de TalentLMS
    if (talentLMSUser?.courses) {
      talentLMSUser.courses.forEach((course: any) => {
        enrolledCourseIds.add(String(course.id));
      });
    }

    // Agregar cursos iniciales
    if (userCourses?.initial) {
      userCourses.initial.forEach((course: any) => {
        const courseId = typeof course === 'string' ? course : course.id;
        if (courseId) enrolledCourseIds.add(String(courseId));
      });
    }

    // Agregar cursos adicionales
    if (userCourses?.additional) {
      userCourses.additional.forEach((course: any) => {
        const courseId = typeof course === 'string' ? course : course.id;
        if (courseId) enrolledCourseIds.add(String(courseId));
      });
    }

    // Agregar enrollments
    if (userCourses?.enrollments) {
      userCourses.enrollments.forEach((course: any) => {
        const courseId = typeof course === 'string' ? course : course.id;
        if (courseId) enrolledCourseIds.add(String(courseId));
      });
    }

    // Filtrar cursos disponibles excluyendo los ya inscritos
    return availableCourses.filter(course => !enrolledCourseIds.has(String(course.id)));
  };

  const handleGoToCourse = async (courseId: string) => {
    if (!talentLMSUser) return;

    try {
      // Obtener la URL base de la aplicación
      const appBaseUrl = window.location.origin;

      const response = await coursesApi.goToCourse({
        userId: String(talentLMSUser.id),
        courseId: courseId,
        // Redirigir al dashboard cuando el usuario cierre sesión en TalentLMS
        logoutRedirect: `${appBaseUrl}/dashboard`,
        // Redirigir a la página de cursos cuando complete el curso
        courseCompletedRedirect: `${appBaseUrl}/courses?completed=true`,
        // Ocultar el logo y el menú en TalentLMS para una experiencia más integrada
        headerHiddenOptions: 'logo;menu'
      });

      if (response.success && response.data?.goto_url) {
        // Abrir el curso en una nueva pestaña
        window.open(response.data.goto_url, '_blank');
      }
    } catch (error: any) {
      console.error('Error going to course:', error);
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
      <Typography variant="h4" gutterBottom>
        <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Mis Cursos
      </Typography>

      {/* Tabs */}
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        textColor="primary"
        indicatorColor="primary"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab
          label={`Cursos del usuario ${(() => {
            const initialCount = userCourses?.initial?.length || 0;
            const additionalCount = userCourses?.additional?.length || 0;
            const enrollmentsCount = userCourses?.enrollments?.length || 0;
            const talentLMSCount = talentLMSUser?.courses?.length || 0;
            const total = initialCount + additionalCount + enrollmentsCount + talentLMSCount;
            return `(${total})`;
          })()}`}
          disabled={!talentLMSUser}
          sx={{ display: talentLMSUser ? 'inline-flex' : 'none' }}
        />
        <Tab
          label={`Cursos Disponibles (${getFilteredAvailableCourses().length})`}
          disabled={!talentLMSUser}
          sx={{ display: talentLMSUser ? 'inline-flex' : 'none' }}
        />
      </Tabs>

      {/* Tab Panel 0: Cursos del usuario */}
      <TabPanel value={tabValue} index={0}>
        {talentLMSUser ? (
          <>
            {(userCourses && (userCourses.initial?.length > 0 || userCourses.additional?.length > 0)) ||
             (talentLMSUser.courses && talentLMSUser.courses.length > 0) ? (
              <Stack spacing={3}>
                {/* Cursos Iniciales */}
                {userCourses.initial?.length > 0 && (
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

            {/* Cursos Adicionales */}
            {userCourses.additional?.length > 0 && (
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

            {/* Cursos en TalentLMS */}
            {talentLMSProgress && talentLMSProgress.courses && talentLMSProgress.courses.length > 0 && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SchoolIcon color="primary" />
                  Progreso en TalentLMS
                </Typography>
                <Stack spacing={2}>
                  {talentLMSProgress.courses.map((course: any) => (
                    <Card key={course.id} variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6">
                              {course.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              ID: {course.id}
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">Progreso</Typography>
                                <Typography variant="body2" fontWeight="medium">{course.completionPercentage}%</Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={course.completionPercentage}
                                sx={{ height: 8, borderRadius: 4 }}
                                color={course.status === 'completed' ? 'success' : 'primary'}
                              />
                            </Box>
                          </Box>
                          <Box sx={{ ml: 2, textAlign: 'right' }}>
                            <Chip
                              label={
                                course.status === 'completed' ? 'Completado' :
                                course.status === 'not_started' ? 'No iniciado' :
                                'En Progreso'
                              }
                              color={
                                course.status === 'completed' ? 'success' :
                                course.status === 'not_started' ? 'default' :
                                'warning'
                              }
                              size="small"
                              sx={{ mb: 1 }}
                            />
                            <Typography variant="caption" display="block" color="text.secondary">
                              {course.enrollmentDate && `Inscrito: ${formatDate(course.enrollmentDate)}`}
                            </Typography>
                            {course.completionDate && (
                              <Typography variant="caption" display="block" color="text.secondary">
                                Completado: {formatDate(course.completionDate)}
                              </Typography>
                            )}
                            {course.status === 'completed' && course.certificateUrl && (
                              <Button
                                size="small"
                                startIcon={<DownloadIcon />}
                                sx={{ mt: 1 }}
                                href={course.certificateUrl}
                                target="_blank"
                              >
                                Certificado
                              </Button>
                            )}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </>
            )}

            {/* Cursos Inscritos en TalentLMS - Detallado */}
            {talentLMSUser && talentLMSUser.courses && talentLMSUser.courses.length > 0 && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SchoolIcon color="info" />
                  Cursos Inscritos en TalentLMS ({talentLMSUser.courses.length})
                </Typography>
                <Stack spacing={2}>
                  {talentLMSUser.courses.map((course: any) => (
                    <Card key={course.id} variant="outlined" sx={{
                      borderColor: course.expired_on ? 'error.main' :
                                  course.completion_percentage === 100 ? 'success.main' :
                                  'divider'
                    }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" gutterBottom>
                              {course.name}
                            </Typography>

                            <Grid container spacing={2} sx={{ mt: 1 }}>
                              <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="body2" color="text.secondary">
                                  <strong>ID del Curso:</strong> {course.id}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Categoría:</strong> {course.category || 'Sin categoría'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Inscrito:</strong> {formatDate(course.enrolled_on)}
                                </Typography>
                                {course.completed_on && (
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>Completado:</strong> {formatDate(course.completed_on)}
                                  </Typography>
                                )}
                                {course.expired_on && (
                                  <Typography variant="body2" color="error">
                                    <strong>Expirado:</strong> {formatDate(course.expired_on)}
                                  </Typography>
                                )}
                              </Grid>

                              <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Estado:</strong> {course.completion_status_formatted || course.completion_status || 'En progreso'}
                                </Typography>
                                {course.total_time && (
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>Tiempo Total:</strong> {course.total_time_formatted || course.total_time}
                                  </Typography>
                                )}
                                {course.time_spent && (
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>Tiempo Invertido:</strong> {course.time_spent_formatted || course.time_spent}
                                  </Typography>
                                )}
                                {course.last_accessed_unit_name && (
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>Última Unidad:</strong> {course.last_accessed_unit_name}
                                  </Typography>
                                )}
                              </Grid>
                            </Grid>

                            {/* Progress bar */}
                            <Box sx={{ mt: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">Progreso</Typography>
                                <Typography variant="body2" fontWeight="medium">
                                  {course.completion_percentage}%
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={course.completion_percentage}
                                sx={{
                                  height: 10,
                                  borderRadius: 5,
                                  backgroundColor: 'grey.300',
                                  '& .MuiLinearProgress-bar': {
                                    borderRadius: 5,
                                  }
                                }}
                                color={course.completion_percentage === 100 ? 'success' : 'primary'}
                              />
                            </Box>

                            {/* Status chips and actions */}
                            <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                              <Chip
                                label={`${course.completion_percentage}% Completado`}
                                color={course.completion_percentage === 100 ? 'success' : 'primary'}
                                size="small"
                              />
                              {course.expired_on && (
                                <Chip
                                  label="Expirado"
                                  color="error"
                                  size="small"
                                />
                              )}
                              {course.certification && (
                                <Chip
                                  label="Con Certificación"
                                  color="info"
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Box>

                            {/* Action buttons */}
                            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                              <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                startIcon={<VisibilityIcon />}
                                onClick={() => handleGoToCourse(course.id)}
                              >
                                Ir al Curso
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<RemoveCircleOutlineIcon />}
                                onClick={() => handleUnenrollFromCourse(course.id)}
                              >
                                Desinscribir
                              </Button>

                              {course.last_accessed_unit_url && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  href={course.last_accessed_unit_url}
                                  target="_blank"
                                  startIcon={<PlayArrowIcon />}
                                >
                                  Continuar Curso
                                </Button>
                              )}
                              {course.completion_percentage === 100 && course.certification && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  startIcon={<DownloadIcon />}
                                >
                                  Descargar Certificado
                                </Button>
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
            No hay cursos asignados a este usuario.
          </Alert>
        )}
          </>
        ) : (
          <Alert severity="warning">
            Este usuario no está registrado en TalentLMS.
          </Alert>
        )}
      </TabPanel>

      {/* Tab Panel 1: Cursos Disponibles */}
      <TabPanel value={tabValue} index={1}>
        {(() => {
          const filteredCourses = getFilteredAvailableCourses();
          return filteredCourses.length > 0 ? (
            <Grid container spacing={2}>
              {filteredCourses.map((course: any) => (
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
        );
        })()}
      </TabPanel>
    </Box>
  );
};