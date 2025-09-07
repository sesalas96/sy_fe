import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  Fab,
  Tooltip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  School as SchoolIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sync as SyncIcon,
  PlayArrow as PlayIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { TalentLMSCourse, UserRole } from '../../types';
import { TalentLMSService } from '../../services/talentLmsService';
import { useAuth } from '../../contexts/AuthContext';

interface CourseStats {
  totalCourses: number;
  activeCourses: number;
  totalEnrollments: number;
  completedEnrollments: number;
  averageCompletionRate: number;
  syncedContractors: number;
}

export const Courses: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  
  const [courses, setCourses] = useState<TalentLMSCourse[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<TalentLMSCourse[]>([]);
  const [stats, setStats] = useState<CourseStats>({
    totalCourses: 0,
    activeCourses: 0,
    totalEnrollments: 0,
    completedEnrollments: 0,
    averageCompletionRate: 0,
    syncedContractors: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    lastCheck?: Date;
    error?: string;
  }>({ connected: false });
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Dialogs
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, categoryFilter, levelFilter, statusFilter, courses]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Test connection first
      const connectionResult = await TalentLMSService.testConnection();
      setConnectionStatus(connectionResult);
      
      if (!connectionResult.connected) {
        setError('No se pudo conectar con TalentLMS');
        return;
      }
      
      // Load courses and stats
      const [coursesData, statsData] = await Promise.all([
        TalentLMSService.getCourses(),
        TalentLMSService.getStatistics()
      ]);
      
      setCourses(coursesData);
      setStats(statsData);
      
    } catch (err) {
      setError('Error al cargar los cursos');
      console.error('Error loading courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...courses];
    
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(course => course.category === categoryFilter);
    }
    
    if (levelFilter !== 'all') {
      filtered = filtered.filter(course => course.level === levelFilter);
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(course => course.status === statusFilter);
    }
    
    setFilteredCourses(filtered);
  };

  const handleSyncCourses = async () => {
    try {
      setSyncing(true);
      await loadData(); // Reload all data
    } catch (err) {
      setError('Error al sincronizar cursos');
    } finally {
      setSyncing(false);
    }
  };

  const handleCourseView = (course: TalentLMSCourse) => {
    navigate(`/courses/${course.id}`);
  };

  const handleManageEnrollments = (course: TalentLMSCourse) => {
    navigate(`/courses/${course.id}/enrollments`);
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  const formatPrice = (price: number, currency: string): string => {
    if (price === 0) return 'Gratuito';
    return `$${price} ${currency}`;
  };

  const getLevelChip = (level: string) => {
    const levelConfig = {
      beginner: { label: 'Principiante', color: 'success' as const },
      intermediate: { label: 'Intermedio', color: 'warning' as const },
      advanced: { label: 'Avanzado', color: 'error' as const }
    };
    
    const config = levelConfig[level as keyof typeof levelConfig] || { label: level, color: 'default' as const };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      active: { label: 'Activo', color: 'success' as const, icon: <CheckCircleIcon /> },
      inactive: { label: 'Inactivo', color: 'default' as const, icon: <WarningIcon /> }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'default' as const };
    return <Chip label={config.label} color={config.color} size="small" icon={config.icon} />;
  };

  const getCategories = () => {
    const categoriesSet = new Set(courses.map(c => c.category));
    return Array.from(categoriesSet).sort();
  };

  const canManageCourses = () => {
    return hasRole([UserRole.SAFETY_STAFF, UserRole.CLIENT_SUPERVISOR]);
  };

  const canViewProgress = () => {
    return hasRole([UserRole.SAFETY_STAFF, UserRole.CLIENT_SUPERVISOR, UserRole.CLIENT_STAFF, UserRole.CLIENT_APPROVER, UserRole.VALIDADORES_OPS]);
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Cursos TalentLMS
        </Typography>
        <LinearProgress sx={{ mb: 3 }} />
        <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
          Cargando cursos desde TalentLMS...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Cursos TalentLMS
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Estado de conexión">
            <Button
              variant="outlined"
              onClick={() => setConnectionDialogOpen(true)}
              color={connectionStatus.connected ? 'success' : 'error'}
              startIcon={connectionStatus.connected ? <CheckCircleIcon /> : <WarningIcon />}
            >
              {connectionStatus.connected ? 'Conectado' : 'Desconectado'}
            </Button>
          </Tooltip>
          
          {canManageCourses() && (
            <>
              <Button
                variant="outlined"
                onClick={handleSyncCourses}
                disabled={syncing}
                startIcon={syncing ? <SyncIcon className="animate-spin" /> : <RefreshIcon />}
              >
                {syncing ? 'Sincronizando...' : 'Sincronizar'}
              </Button>
              
              <Button
                variant="contained"
                onClick={() => navigate('/courses/settings')}
                startIcon={<SettingsIcon />}
              >
                Configurar
              </Button>
            </>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!connectionStatus.connected && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No hay conexión con TalentLMS. Algunas funciones pueden no estar disponibles.
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Cursos
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalCourses}
                  </Typography>
                </Box>
                <SchoolIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Activos
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {stats.activeCourses}
                  </Typography>
                </Box>
                <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Inscripciones
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    {stats.totalEnrollments}
                  </Typography>
                </Box>
                <PeopleIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Completados
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {stats.completedEnrollments}
                  </Typography>
                </Box>
                <AssignmentIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    % Promedio
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {stats.averageCompletionRate}%
                  </Typography>
                </Box>
                <TrendingUpIcon color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Sincronizados
                  </Typography>
                  <Typography variant="h4" color="secondary.main">
                    {stats.syncedContractors}
                  </Typography>
                </Box>
                <SyncIcon color="secondary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid size={{ xs: 12, sm: 4, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Categoría</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Categoría"
              >
                <MenuItem value="all">Todas</MenuItem>
                {getCategories().map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 4, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Nivel</InputLabel>
              <Select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                label="Nivel"
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="beginner">Principiante</MenuItem>
                <MenuItem value="intermediate">Intermedio</MenuItem>
                <MenuItem value="advanced">Avanzado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 4, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Estado"
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="active">Activo</MenuItem>
                <MenuItem value="inactive">Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 4, md: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setLevelFilter('all');
                setStatusFilter('all');
              }}
            >
              Limpiar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Courses Grid */}
      <Grid container spacing={3}>
        {filteredCourses.map((course) => (
          <Grid key={course.id} size={{ xs: 12, sm: 6, lg: 4 }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {course.thumbnail_url && (
                <CardMedia
                  component="img"
                  height="140"
                  image={course.thumbnail_url}
                  alt={course.name}
                  sx={{ objectFit: 'cover' }}
                />
              )}
              
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {course.name}
                  </Typography>
                  {getStatusChip(course.status)}
                </Box>
                
                <Typography variant="body2" color="textSecondary" paragraph sx={{ 
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {course.description}
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  <Chip 
                    label={course.category} 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                  />
                  {getLevelChip(course.level)}
                  {course.certification_enabled && (
                    <Chip 
                      label="Certificación" 
                      size="small" 
                      color="success" 
                      icon={<AssignmentIcon />}
                    />
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      <ScheduleIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      {formatDuration(course.duration)}
                    </Typography>
                    <Typography variant="body2" fontWeight="medium" color="primary">
                      {formatPrice(course.price, course.currency)}
                    </Typography>
                  </Box>
                  
                  {course.required_for_companies && course.required_for_companies.length > 0 && (
                    <Tooltip title={`Obligatorio para ${course.required_for_companies.length} empresa(s)`}>
                      <Chip 
                        label="Obligatorio" 
                        size="small" 
                        color="error" 
                        icon={<WarningIcon />}
                      />
                    </Tooltip>
                  )}
                </Box>
              </CardContent>
              
              <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                <Button
                  size="small"
                  onClick={() => handleCourseView(course)}
                  startIcon={<PlayIcon />}
                >
                  Ver Curso
                </Button>
                
                {canManageCourses() && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleManageEnrollments(course)}
                    startIcon={<PeopleIcon />}
                  >
                    Gestionar
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredCourses.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No se encontraron cursos
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {searchTerm || categoryFilter !== 'all' || levelFilter !== 'all' || statusFilter !== 'all'
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'No hay cursos disponibles en TalentLMS'}
          </Typography>
        </Box>
      )}

      {/* Floating Action Button for Progress View */}
      {canViewProgress() && (
        <Fab
          color="secondary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => navigate('/courses/progress')}
        >
          <TrendingUpIcon />
        </Fab>
      )}

      {/* Connection Status Dialog */}
      <Dialog open={connectionDialogOpen} onClose={() => setConnectionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Estado de Conexión TalentLMS</DialogTitle>
        <DialogContent>
          <List>
            <ListItem>
              <ListItemIcon>
                {connectionStatus.connected ? <CheckCircleIcon color="success" /> : <WarningIcon color="error" />}
              </ListItemIcon>
              <ListItemText
                primary="Estado de Conexión"
                secondary={connectionStatus.connected ? 'Conectado exitosamente' : 'No conectado'}
              />
            </ListItem>
            
            <Divider />
            
            {connectionStatus.lastCheck && (
              <ListItem>
                <ListItemIcon>
                  <ScheduleIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Última Verificación"
                  secondary={connectionStatus.lastCheck.toLocaleString('es-CR')}
                />
              </ListItem>
            )}
            
            {connectionStatus.error && (
              <ListItem>
                <ListItemIcon>
                  <WarningIcon color="error" />
                </ListItemIcon>
                <ListItemText
                  primary="Error"
                  secondary={connectionStatus.error}
                />
              </ListItem>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConnectionDialogOpen(false)}>
            Cerrar
          </Button>
          <Button onClick={loadData} variant="contained">
            Probar Conexión
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};