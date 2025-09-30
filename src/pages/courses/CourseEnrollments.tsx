import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Alert,
  LinearProgress,
  Breadcrumbs,
  Link,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Sync as SyncIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  School as SchoolIcon,
  Business as BusinessIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  TalentLMSCourse, 
  TalentLMSEnrollment, 
  Contractor, 
  Company, 
  SyncOperation,
  UserRole 
} from '../../types';
import { TalentLMSService, EnrollmentRequest, BulkSyncRequest } from '../../services/talentLmsService';
import { companyApi } from '../../services/companyApi';
import { useAuth } from '../../contexts/AuthContext';

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
      id={`enrollments-tabpanel-${index}`}
      aria-labelledby={`enrollments-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const CourseEnrollments: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { hasRole } = useAuth();
  
  const [course, setCourse] = useState<TalentLMSCourse | null>(null);
  const [enrollments, setEnrollments] = useState<TalentLMSEnrollment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contractors] = useState<Contractor[]>([]);
  const [syncOperations, setSyncOperations] = useState<SyncOperation[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  
  // Dialog states
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [bulkSyncDialogOpen, setBulkSyncDialogOpen] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  // Form states
  const [selectedContractors, setSelectedContractors] = useState<Contractor[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [syncInProgress, setSyncInProgress] = useState<SyncOperation | null>(null);

  useEffect(() => {
    if (courseId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  useEffect(() => {
    // Poll sync operation status
    if (syncInProgress && syncInProgress.status === 'in_progress') {
      const interval = setInterval(async () => {
        try {
          const updatedOperation = await TalentLMSService.getSyncOperation(syncInProgress.id);
          if (updatedOperation) {
            setSyncInProgress(updatedOperation);
            if (updatedOperation.status !== 'in_progress') {
              clearInterval(interval);
              setSyncing(false);
              if (updatedOperation.status === 'completed') {
                setSuccess(`Sincronización completada: ${updatedOperation.successfulItems}/${updatedOperation.totalItems} elementos procesados`);
              } else {
                setError('Error en la sincronización');
              }
              loadData(); // Reload data
            }
          }
        } catch (err) {
          clearInterval(interval);
          setSyncing(false);
        }
      }, 2000);
      
      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncInProgress]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!courseId) return;
      
      // Load course details
      const courseData = await TalentLMSService.getCourseById(courseId);
      if (!courseData) {
        setError('Curso no encontrado');
        return;
      }
      setCourse(courseData);
      
      // Load other data
      const [companiesResponse, syncOpsData] = await Promise.all([
        companyApi.getAll(),
        TalentLMSService.getSyncOperations(10)
      ]);
      
      const companiesData = companiesResponse.success && companiesResponse.data 
        ? companiesResponse.data.filter((company: Company) => company.name.toLowerCase() !== 'particular')
        : [];
      
      setCompanies(companiesData);
      setSyncOperations(syncOpsData);
      
      // TODO: Load actual enrollments for this course
      // For now using mock data
      setEnrollments([]);
      
    } catch (err) {
      setError('Error al cargar la información');
      console.error('Error loading enrollment data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollContractors = async () => {
    if (!courseId || selectedContractors.length === 0) return;
    
    try {
      setEnrolling(true);
      setError('');
      
      const request: EnrollmentRequest = {
        contractorId: selectedContractors[0].id, // TODO: Support multiple contractors
        courseIds: [courseId]
      };
      
      const result = await TalentLMSService.enrollContractorInCourses(request);
      
      if (result.success) {
        setSuccess(`Contratistas inscritos exitosamente en el curso`);
        setEnrollDialogOpen(false);
        setSelectedContractors([]);
        await loadData();
      } else {
        setError(`Errores en la inscripción: ${result.errors.join(', ')}`);
      }
      
    } catch (err) {
      setError('Error al inscribir contratistas');
      console.error('Error enrolling contractors:', err);
    } finally {
      setEnrolling(false);
    }
  };

  const handleBulkSync = async () => {
    if (!selectedCompany) return;
    
    try {
      setSyncing(true);
      setError('');
      
      const request: BulkSyncRequest = {
        companyId: selectedCompany.id,
        forceSync: true
      };
      
      const operation = await TalentLMSService.bulkSyncContractors(request);
      setSyncInProgress(operation);
      setBulkSyncDialogOpen(false);
      
    } catch (err) {
      setError('Error al iniciar sincronización masiva');
      console.error('Error starting bulk sync:', err);
      setSyncing(false);
    }
  };

  const getEnrollmentStatusChip = (status: string) => {
    const statusConfig = {
      not_started: { label: 'No Iniciado', color: 'default' as const, icon: <ScheduleIcon /> },
      in_progress: { label: 'En Progreso', color: 'warning' as const, icon: <ScheduleIcon /> },
      completed: { label: 'Completado', color: 'success' as const, icon: <CheckCircleIcon /> }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'default' as const };
    return <Chip label={config.label} color={config.color} size="small" icon={config.icon} />;
  };

  const getSyncStatusChip = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendiente', color: 'default' as const },
      in_progress: { label: 'En Progreso', color: 'warning' as const },
      completed: { label: 'Completado', color: 'success' as const },
      failed: { label: 'Fallido', color: 'error' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'default' as const };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const canManageEnrollments = () => {
    return hasRole([UserRole.SAFETY_STAFF, UserRole.CLIENT_SUPERVISOR]);
  };

  if (loading) {
    return (
      <Box>
        <LinearProgress sx={{ mb: 3 }} />
        <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
          Cargando información de inscripciones...
        </Typography>
      </Box>
    );
  }

  if (!course) {
    return (
      <Box>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/courses'); }}>
            Cursos
          </Link>
          <Typography color="textPrimary">Inscripciones</Typography>
        </Breadcrumbs>
        
        <Alert severity="error">
          Curso no encontrado
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/courses'); }}>
          Cursos
        </Link>
        <Link color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate(`/courses/${courseId}`); }}>
          {course.name}
        </Link>
        <Typography color="textPrimary">Inscripciones</Typography>
      </Breadcrumbs>

      <Typography variant="h4" gutterBottom>
        <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Gestión de Inscripciones
      </Typography>
      
      <Typography variant="h6" color="textSecondary" gutterBottom>
        {course.name}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      {syncing && syncInProgress && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={20} />
            <Box>
              <Typography variant="body2">
                Sincronización en progreso: {syncInProgress.processedItems}/{syncInProgress.totalItems}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(syncInProgress.processedItems / syncInProgress.totalItems) * 100}
                sx={{ mt: 1, width: 200 }}
              />
            </Box>
          </Box>
        </Alert>
      )}

      {/* Action Buttons */}
      {canManageEnrollments() && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setEnrollDialogOpen(true)}
          >
            Inscribir Contratistas
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<SyncIcon />}
            onClick={() => setBulkSyncDialogOpen(true)}
          >
            Sincronización Masiva
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => {/* TODO: Export enrollments */}}
          >
            Exportar
          </Button>
        </Box>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Inscripciones Actuales" />
          <Tab label="Historial de Sincronización" />
          <Tab label="Requisitos por Espacios de Trabajo" />
        </Tabs>
      </Box>

      {/* Current Enrollments Tab */}
      <TabPanel value={activeTab} index={0}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Contratista</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Fecha Inscripción</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Progreso</TableCell>
                <TableCell>Último Acceso</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {enrollments.length > 0 ? (
                enrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        Usuario TalentLMS {enrollment.user_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        usuario@email.com
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(enrollment.enrollment_date).toLocaleDateString('es-CR')}
                    </TableCell>
                    <TableCell>
                      {getEnrollmentStatusChip(enrollment.completion_status)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={enrollment.completion_percentage}
                          sx={{ width: 100, height: 8, borderRadius: 1 }}
                        />
                        <Typography variant="body2">
                          {enrollment.completion_percentage}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {enrollment.last_accessed 
                        ? new Date(enrollment.last_accessed).toLocaleDateString('es-CR')
                        : 'Nunca'
                      }
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ver detalles">
                        <IconButton size="small">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      {canManageEnrollments() && (
                        <Tooltip title="Eliminar inscripción">
                          <IconButton size="small" color="error">
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="textSecondary" sx={{ py: 4 }}>
                      No hay inscripciones para este curso
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Sync History Tab */}
      <TabPanel value={activeTab} index={1}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha/Hora</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Elementos</TableCell>
                <TableCell>Exitosos</TableCell>
                <TableCell>Fallidos</TableCell>
                <TableCell>Iniciado por</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {syncOperations.map((operation) => (
                <TableRow key={operation.id}>
                  <TableCell>
                    {operation.startedAt.toLocaleString('es-CR')}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={operation.type.replace('_', ' ')} 
                      size="small" 
                      variant="outlined" 
                    />
                  </TableCell>
                  <TableCell>
                    {getSyncStatusChip(operation.status)}
                  </TableCell>
                  <TableCell>{operation.totalItems}</TableCell>
                  <TableCell>
                    <Typography color="success.main">
                      {operation.successfulItems}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography color="error.main">
                      {operation.failedItems}
                    </Typography>
                  </TableCell>
                  <TableCell>{operation.initiatedBy}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver detalles">
                      <IconButton size="small">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Company Requirements Tab */}
      <TabPanel value={activeTab} index={2}>
        <Grid container spacing={3}>
          {companies.map((company) => (
            <Grid key={company.id} size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    {company.name}
                  </Typography>
                  
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {company.industry} • {company.userCount} empleados
                  </Typography>
                  
                  {course.required_for_companies?.includes(company._id || company.id || '') ? (
                    <Chip 
                      label="Curso Obligatorio" 
                      color="error" 
                      icon={<WarningIcon />}
                    />
                  ) : (
                    <Chip 
                      label="Curso Opcional" 
                      color="default" 
                      variant="outlined"
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Enrollment Dialog */}
      <Dialog open={enrollDialogOpen} onClose={() => setEnrollDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Inscribir Contratistas en {course.name}
            <IconButton onClick={() => setEnrollDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Autocomplete
                multiple
                options={contractors}
                getOptionLabel={(contractor) => `${contractor.fullName} (${contractor.cedula})`}
                value={selectedContractors}
                onChange={(e, newValue) => setSelectedContractors(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Seleccionar Contratistas"
                    placeholder="Buscar contratistas..."
                    fullWidth
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((contractor, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip
                        key={contractor.id}
                        label={contractor.fullName}
                        {...tagProps}
                      />
                    );
                  })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEnrollDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleEnrollContractors}
            variant="contained"
            disabled={selectedContractors.length === 0 || enrolling}
            startIcon={enrolling ? <CircularProgress size={20} /> : <PersonAddIcon />}
          >
            {enrolling ? 'Inscribiendo...' : 'Inscribir'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Sync Dialog */}
      <Dialog open={bulkSyncDialogOpen} onClose={() => setBulkSyncDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Sincronización Masiva de Contratistas
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            Sincronizar todos los contratistas de una empresa con TalentLMS y inscribirlos automáticamente en los cursos obligatorios.
          </Typography>
          
          <Autocomplete
            options={companies}
            getOptionLabel={(company) => company.name}
            value={selectedCompany}
            onChange={(e, newValue) => setSelectedCompany(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Seleccionar Espacios de Trabajo"
                placeholder="Buscar empresa..."
                fullWidth
                sx={{ mt: 2 }}
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkSyncDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleBulkSync}
            variant="contained"
            disabled={!selectedCompany || syncing}
            startIcon={syncing ? <CircularProgress size={20} /> : <SyncIcon />}
          >
            {syncing ? 'Sincronizando...' : 'Iniciar Sincronización'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};