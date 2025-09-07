import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Chip,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Breadcrumbs,
  Link,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  PlayArrow as PlayArrowIcon,
  Sync as SyncIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { 
  ContractorProgress,
  Company,
  UserRole
} from '../../types';
import { TalentLMSService } from '../../services/talentLmsService';
import { CompanyService } from '../../services/companyService';
import { useAuth } from '../../contexts/AuthContext';

interface ProgressStats {
  totalContractors: number;
  syncedContractors: number;
  totalEnrollments: number;
  completedCourses: number;
  inProgressCourses: number;
  averageProgress: number;
}

export const ContractorProgressPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  
  const [contractorProgress, setContractorProgress] = useState<ContractorProgress[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState<ProgressStats>({
    totalContractors: 0,
    syncedContractors: 0,
    totalEnrollments: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    averageProgress: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [syncing, setSyncing] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [progressFilter, setProgressFilter] = useState('all');
  
  // Dialog states
  const [selectedContractor, setSelectedContractor] = useState<ContractorProgress | null>(null);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Apply filters
    // TODO: Implement filtering logic
  }, [searchTerm, companyFilter, progressFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load companies
      const companiesData = await CompanyService.getCompanies();
      setCompanies(companiesData);
      
      // TODO: Load actual contractor progress data
      // For now using mock data
      const mockProgress: ContractorProgress[] = [
        {
          contractorId: '1',
          talentLmsUserId: 'tlms-user-001',
          enrollments: [
            {
              id: 'enroll-001',
              user_id: 'tlms-user-001',
              course_id: 'tlms-001',
              enrollment_date: '2024-06-01T10:30:00Z',
              completion_status: 'completed',
              completion_percentage: 100,
              completion_date: '2024-06-03T15:20:00Z',
              certificate_url: 'https://example.com/certificates/cert-001.pdf',
              time_spent: 125,
              grade: 95
            },
            {
              id: 'enroll-002',
              user_id: 'tlms-user-001',
              course_id: 'tlms-002',
              enrollment_date: '2024-06-05T09:00:00Z',
              completion_status: 'in_progress',
              completion_percentage: 65,
              time_spent: 118,
              last_accessed: '2024-07-14T08:30:00Z'
            }
          ],
          totalCourses: 2,
          completedCourses: 1,
          inProgressCourses: 1,
          overallProgress: 82,
          lastSyncDate: new Date('2024-07-14T10:00:00Z')
        },
        {
          contractorId: '2',
          talentLmsUserId: 'tlms-user-002',
          enrollments: [
            {
              id: 'enroll-003',
              user_id: 'tlms-user-002',
              course_id: 'tlms-001',
              enrollment_date: '2024-06-06T11:15:00Z',
              completion_status: 'completed',
              completion_percentage: 100,
              completion_date: '2024-06-08T14:45:00Z',
              certificate_url: 'https://example.com/certificates/cert-002.pdf',
              time_spent: 130,
              grade: 88
            }
          ],
          totalCourses: 1,
          completedCourses: 1,
          inProgressCourses: 0,
          overallProgress: 100,
          lastSyncDate: new Date('2024-07-13T16:00:00Z')
        }
      ];
      
      setContractorProgress(mockProgress);
      
      // Calculate stats
      const totalContractors = 5; // Mock total contractors
      const syncedContractors = mockProgress.length;
      const totalEnrollments = mockProgress.reduce((sum, p) => sum + p.totalCourses, 0);
      const completedCourses = mockProgress.reduce((sum, p) => sum + p.completedCourses, 0);
      const inProgressCourses = mockProgress.reduce((sum, p) => sum + p.inProgressCourses, 0);
      const averageProgress = mockProgress.length > 0 
        ? Math.round(mockProgress.reduce((sum, p) => sum + p.overallProgress, 0) / mockProgress.length)
        : 0;
      
      setStats({
        totalContractors,
        syncedContractors,
        totalEnrollments,
        completedCourses,
        inProgressCourses,
        averageProgress
      });
      
    } catch (err) {
      setError('Error al cargar el progreso de contratistas');
      console.error('Error loading contractor progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncProgress = async () => {
    try {
      setSyncing(true);
      setError('');
      
      // Sync progress for all contractors
      for (const progress of contractorProgress) {
        await TalentLMSService.syncCompletedCourses(progress.contractorId);
      }
      
      await loadData();
      
    } catch (err) {
      setError('Error al sincronizar progreso');
      console.error('Error syncing progress:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleViewDetails = (progress: ContractorProgress) => {
    setSelectedContractor(progress);
    setProgressDialogOpen(true);
  };

  const getProgressColor = (percentage: number): 'success' | 'warning' | 'error' | 'primary' => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    if (percentage >= 40) return 'primary';
    return 'error';
  };

  const getEnrollmentStatusChip = (status: string) => {
    const statusConfig = {
      not_started: { label: 'No Iniciado', color: 'default' as const, icon: <ScheduleIcon /> },
      in_progress: { label: 'En Progreso', color: 'warning' as const, icon: <PlayArrowIcon /> },
      completed: { label: 'Completado', color: 'success' as const, icon: <CheckCircleIcon /> }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'default' as const };
    return <Chip label={config.label} color={config.color} size="small" icon={config.icon} />;
  };

  const formatTimeSpent = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  const mockContractors = [
    { id: '1', fullName: 'Juan Carlos Pérez', cedula: '1-2345-6789', companyId: 'company1' },
    { id: '2', fullName: 'María González López', cedula: '2-3456-7890', companyId: 'company2' }
  ];

  const getContractorInfo = (contractorId: string) => {
    return mockContractors.find(c => c.id === contractorId) || 
      { fullName: 'Contratista Desconocido', cedula: 'N/A', companyId: '' };
  };

  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    return company?.name || 'Espacios de Trabajo Desconocida';
  };

  const canSyncProgress = () => {
    return hasRole([UserRole.SAFETY_STAFF, UserRole.CLIENT_SUPERVISOR]);
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Progreso de Contratistas
        </Typography>
        <LinearProgress sx={{ mb: 3 }} />
        <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
          Cargando progreso de contratistas...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/courses'); }}>
          Cursos
        </Link>
        <Typography color="textPrimary">Progreso de Contratistas</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Progreso de Contratistas
        </Typography>
        
        {canSyncProgress() && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={handleSyncProgress}
              disabled={syncing}
              startIcon={syncing ? <SyncIcon className="animate-spin" /> : <RefreshIcon />}
            >
              {syncing ? 'Sincronizando...' : 'Sincronizar Progreso'}
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => {/* TODO: Export progress */}}
            >
              Exportar
            </Button>
          </Box>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Contratistas
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalContractors}
                  </Typography>
                </Box>
                <PersonIcon color="primary" sx={{ fontSize: 40 }} />
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
                  <Typography variant="h4" color="success.main">
                    {stats.syncedContractors}
                  </Typography>
                </Box>
                <SyncIcon color="success" sx={{ fontSize: 40 }} />
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
                <SchoolIcon color="info" sx={{ fontSize: 40 }} />
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
                    {stats.completedCourses}
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
                    En Progreso
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {stats.inProgressCourses}
                  </Typography>
                </Box>
                <ScheduleIcon color="warning" sx={{ fontSize: 40 }} />
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
                    Promedio
                  </Typography>
                  <Typography variant="h4" color="secondary.main">
                    {stats.averageProgress}%
                  </Typography>
                </Box>
                <TrendingUpIcon color="secondary" sx={{ fontSize: 40 }} />
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
              placeholder="Buscar contratistas..."
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
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Espacios de Trabajo</InputLabel>
              <Select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                label="Espacios de Trabajo"
              >
                <MenuItem value="all">Todas</MenuItem>
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Progreso</InputLabel>
              <Select
                value={progressFilter}
                onChange={(e) => setProgressFilter(e.target.value)}
                label="Progreso"
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="completed">Completado (100%)</MenuItem>
                <MenuItem value="high">Alto (80-99%)</MenuItem>
                <MenuItem value="medium">Medio (50-79%)</MenuItem>
                <MenuItem value="low">Bajo (0-49%)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Progress Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Contratista</TableCell>
              <TableCell>Espacios de Trabajo</TableCell>
              <TableCell>Cursos Totales</TableCell>
              <TableCell>Completados</TableCell>
              <TableCell>En Progreso</TableCell>
              <TableCell>Progreso General</TableCell>
              <TableCell>Última Sincronización</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contractorProgress.map((progress) => {
              const contractor = getContractorInfo(progress.contractorId);
              const companyName = getCompanyName(contractor.companyId);
              
              return (
                <TableRow key={progress.contractorId}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                        {contractor.fullName.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {contractor.fullName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {contractor.cedula}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {companyName}
                    </Typography>
                  </TableCell>
                  <TableCell>{progress.totalCourses}</TableCell>
                  <TableCell>
                    <Typography color="success.main" fontWeight="medium">
                      {progress.completedCourses}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography color="warning.main" fontWeight="medium">
                      {progress.inProgressCourses}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={progress.overallProgress}
                        color={getProgressColor(progress.overallProgress)}
                        sx={{ width: 100, height: 8, borderRadius: 1 }}
                      />
                      <Typography variant="body2" fontWeight="medium">
                        {progress.overallProgress}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {progress.lastSyncDate.toLocaleDateString('es-CR')}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver detalles">
                      <IconButton 
                        size="small" 
                        onClick={() => handleViewDetails(progress)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {contractorProgress.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <TrendingUpIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No hay datos de progreso
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Los contratistas deben estar sincronizados con TalentLMS para ver su progreso
          </Typography>
        </Box>
      )}

      {/* Progress Details Dialog */}
      <Dialog 
        open={progressDialogOpen} 
        onClose={() => setProgressDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        {selectedContractor && (
          <>
            <DialogTitle>
              Detalle del Progreso - {getContractorInfo(selectedContractor.contractorId).fullName}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Resumen General
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h4" color="primary">
                          {selectedContractor.totalCourses}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Cursos Totales
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h4" color="success.main">
                          {selectedContractor.completedCourses}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Completados
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h4" color="warning.main">
                          {selectedContractor.inProgressCourses}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          En Progreso
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h4" color="secondary.main">
                          {selectedContractor.overallProgress}%
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Promedio
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>

              <Typography variant="h6" gutterBottom>
                Inscripciones Detalladas
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Curso</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Progreso</TableCell>
                      <TableCell>Tiempo</TableCell>
                      <TableCell>Calificación</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedContractor.enrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            Curso {enrollment.course_id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {getEnrollmentStatusChip(enrollment.completion_status)}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={enrollment.completion_percentage}
                              color={getProgressColor(enrollment.completion_percentage)}
                              sx={{ width: 80, height: 6, borderRadius: 1 }}
                            />
                            <Typography variant="body2">
                              {enrollment.completion_percentage}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {formatTimeSpent(enrollment.time_spent)}
                        </TableCell>
                        <TableCell>
                          {enrollment.grade ? (
                            <Chip 
                              label={`${enrollment.grade}%`} 
                              color={enrollment.grade >= 80 ? 'success' : enrollment.grade >= 60 ? 'warning' : 'error'}
                              size="small"
                            />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setProgressDialogOpen(false)}>
                Cerrar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};