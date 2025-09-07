import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Breadcrumbs,
  Link,
  CircularProgress
} from '@mui/material';
import {
  Sync as SyncIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Business as BusinessIcon,
  School as SchoolIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { 
  Company, 
  Contractor, 
  SyncOperation, 
  TalentLMSCourse, 
  CourseRequirement,
  UserRole 
} from '../types';
import { TalentLMSService, BulkSyncRequest } from '../services/talentLmsService';
import { companyApi } from '../services/companyApi';
import { useAuth } from '../contexts/AuthContext';

interface SyncStep {
  label: string;
  description: string;
  completed: boolean;
  error?: string;
  progress?: number;
}

interface SyncPlan {
  company: Company;
  contractors: Contractor[];
  requiredCourses: CourseRequirement[];
  forceSync: boolean;
  autoEnroll: boolean;
}

export const BulkSync: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [, setCourses] = useState<TalentLMSCourse[]>([]);
  const [syncOperations, setSyncOperations] = useState<SyncOperation[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeStep, setActiveStep] = useState(0);
  
  // Sync configuration
  const [syncPlan, setSyncPlan] = useState<SyncPlan | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [forceSync, setForceSync] = useState(false);
  const [autoEnroll, setAutoEnroll] = useState(true);
  
  // Sync execution
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncStep[]>([]);
  const [currentSyncOperation, setCurrentSyncOperation] = useState<SyncOperation | null>(null);
  
  // Confirmation dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Poll sync operation status
    if (currentSyncOperation && currentSyncOperation.status === 'in_progress') {
      const interval = setInterval(async () => {
        try {
          const updatedOperation = await TalentLMSService.getSyncOperation(currentSyncOperation.id);
          if (updatedOperation) {
            setCurrentSyncOperation(updatedOperation);
            updateSyncProgress(updatedOperation);
            
            if (updatedOperation.status !== 'in_progress') {
              clearInterval(interval);
              setSyncing(false);
              
              if (updatedOperation.status === 'completed') {
                setActiveStep(3); // Success step
              } else {
                setError('Error en la sincronización masiva');
              }
            }
          }
        } catch (err) {
          clearInterval(interval);
          setSyncing(false);
          setError('Error al verificar estado de sincronización');
        }
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [currentSyncOperation]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [companiesResponse, coursesData, syncOpsData] = await Promise.all([
        companyApi.getAll(),
        TalentLMSService.getCourses(),
        TalentLMSService.getSyncOperations(20)
      ]);
      
      const companiesData = companiesResponse.success && companiesResponse.data 
        ? companiesResponse.data.filter((company: Company) => company.name.toLowerCase() !== 'particular')
        : [];
      
      setCompanies(companiesData);
      setCourses(coursesData);
      setSyncOperations(syncOpsData);
      
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error loading bulk sync data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySelect = async (company: Company) => {
    try {
      setSelectedCompany(company);
      
      // Load contractors for this company (mock data)
      const mockContractors: Contractor[] = [
        {
          id: '1',
          userId: 'user1',
          fullName: 'Juan Carlos Pérez',
          cedula: '1-2345-6789',
          ordenPatronal: 'OP-001',
          polizaINS: 'INS-12345',
          status: 'active' as const,
          companyId: company._id || company.id || '',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          userId: 'user2',
          fullName: 'María González López',
          cedula: '2-3456-7890',
          ordenPatronal: 'OP-002',
          polizaINS: 'INS-23456',
          status: 'active' as const,
          companyId: company._id || company.id || '',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ].filter(c => c.companyId === company.id);
      
      // Load required courses for this company
      const requiredCourses = await TalentLMSService.getCourseRequirements(company.id);
      
      setSyncPlan({
        company,
        contractors: mockContractors,
        requiredCourses,
        forceSync,
        autoEnroll
      });
      
      setActiveStep(1);
      
    } catch (err) {
      setError('Error al cargar información de la empresa');
      console.error('Error loading company data:', err);
    }
  };

  const handleConfigurationNext = () => {
    if (!syncPlan) return;
    
    setSyncPlan({
      ...syncPlan,
      forceSync,
      autoEnroll
    });
    
    setActiveStep(2);
  };

  const handleStartSync = () => {
    setConfirmDialogOpen(true);
  };

  const handleConfirmSync = async () => {
    if (!syncPlan) return;
    
    try {
      setSyncing(true);
      setConfirmDialogOpen(false);
      setError('');
      
      // Initialize sync progress
      const initialProgress: SyncStep[] = [
        { label: 'Validando contratistas', description: 'Verificando información de contratistas', completed: false },
        { label: 'Sincronizando con TalentLMS', description: 'Creando/actualizando usuarios en TalentLMS', completed: false },
        { label: 'Inscribiendo en cursos', description: 'Inscribiendo en cursos obligatorios', completed: false },
        { label: 'Finalizando sincronización', description: 'Completando proceso de sincronización', completed: false }
      ];
      setSyncProgress(initialProgress);
      
      // Start bulk sync operation
      const request: BulkSyncRequest = {
        companyId: syncPlan.company.id,
        forceSync: syncPlan.forceSync
      };
      
      const operation = await TalentLMSService.bulkSyncContractors(request);
      setCurrentSyncOperation(operation);
      
      // Auto-enroll in required courses if enabled
      if (syncPlan.autoEnroll && syncPlan.requiredCourses.length > 0) {
        // TODO: Implement auto-enrollment logic
      }
      
    } catch (err) {
      setError('Error al iniciar sincronización masiva');
      console.error('Error starting bulk sync:', err);
      setSyncing(false);
    }
  };

  const updateSyncProgress = (operation: SyncOperation) => {
    const progress = (operation.processedItems / operation.totalItems) * 100;
    
    setSyncProgress(prev => prev.map((step, index) => {
      if (index === 0) { // Validation step
        return { ...step, completed: progress > 0, progress: Math.min(25, progress) };
      } else if (index === 1) { // Sync step
        return { ...step, completed: progress > 25, progress: Math.min(50, progress) };
      } else if (index === 2) { // Enrollment step
        return { ...step, completed: progress > 50, progress: Math.min(75, progress) };
      } else { // Finalization step
        return { ...step, completed: progress >= 100, progress };
      }
    }));
  };

  const handleReset = () => {
    setActiveStep(0);
    setSyncPlan(null);
    setSelectedCompany(null);
    setSyncProgress([]);
    setCurrentSyncOperation(null);
    setSyncing(false);
    setError('');
  };

  const getSyncStatusChip = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendiente', color: 'default' as const, icon: <SyncIcon /> },
      in_progress: { label: 'En Progreso', color: 'warning' as const, icon: <PlayArrowIcon /> },
      completed: { label: 'Completado', color: 'success' as const, icon: <CheckCircleIcon /> },
      failed: { label: 'Fallido', color: 'error' as const, icon: <ErrorIcon /> }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'default' as const };
    return <Chip label={config.label} color={config.color} size="small" icon={config.icon} />;
  };

  const canPerformBulkSync = () => {
    return hasRole([UserRole.SAFETY_STAFF, UserRole.CLIENT_SUPERVISOR]);
  };

  if (!canPerformBulkSync()) {
    return (
      <Box>
        <Alert severity="error">
          No tienes permisos para realizar sincronización masiva
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box>
        <LinearProgress sx={{ mb: 3 }} />
        <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
          Cargando información para sincronización masiva...
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
        <Typography color="textPrimary">Sincronización Masiva</Typography>
      </Breadcrumbs>

      <Typography variant="h4" gutterBottom>
        <SyncIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Sincronización Masiva con TalentLMS
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3 }}>
            <Stepper activeStep={activeStep} orientation="vertical">
              {/* Step 1: Company Selection */}
              <Step>
                <StepLabel>Selección de Espacios de Trabajo</StepLabel>
                <StepContent>
                  <Typography variant="body2" paragraph>
                    Selecciona la empresa cuyos contratistas deseas sincronizar con TalentLMS.
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {companies.map((company) => (
                      <Grid key={company.id} size={{ xs: 12, sm: 6 }}>
                        <Card 
                          sx={{ 
                            cursor: 'pointer',
                            border: selectedCompany?.id === company.id ? 2 : 1,
                            borderColor: selectedCompany?.id === company.id ? 'primary.main' : 'divider'
                          }}
                          onClick={() => handleCompanySelect(company)}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <BusinessIcon color="primary" />
                              <Box>
                                <Typography variant="h6">
                                  {company.name}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  {company.industry} • {company.employeeCount} empleados
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </StepContent>
              </Step>

              {/* Step 2: Configuration */}
              <Step>
                <StepLabel>Configuración</StepLabel>
                <StepContent>
                  {syncPlan && (
                    <Box>
                      <Typography variant="body2" paragraph>
                        Configura las opciones de sincronización para {syncPlan.company.name}.
                      </Typography>
                      
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Se sincronizarán {syncPlan.contractors.length} contratistas con TalentLMS.
                      </Alert>
                      
                      <Box sx={{ mb: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox 
                              checked={forceSync} 
                              onChange={(e) => setForceSync(e.target.checked)}
                            />
                          }
                          label="Forzar sincronización (actualizar usuarios existentes)"
                        />
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox 
                              checked={autoEnroll} 
                              onChange={(e) => setAutoEnroll(e.target.checked)}
                            />
                          }
                          label="Inscribir automáticamente en cursos obligatorios"
                        />
                      </Box>
                      
                      {syncPlan.requiredCourses.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Cursos obligatorios ({syncPlan.requiredCourses.length}):
                          </Typography>
                          <List dense>
                            {syncPlan.requiredCourses.map((req) => (
                              <ListItem key={req.id}>
                                <ListItemIcon>
                                  <SchoolIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary={req.courseName} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                      
                      <Box sx={{ mt: 2 }}>
                        <Button onClick={() => setActiveStep(0)} sx={{ mr: 1 }}>
                          Anterior
                        </Button>
                        <Button 
                          variant="contained" 
                          onClick={handleConfigurationNext}
                        >
                          Continuar
                        </Button>
                      </Box>
                    </Box>
                  )}
                </StepContent>
              </Step>

              {/* Step 3: Review and Execute */}
              <Step>
                <StepLabel>Revisión y Ejecución</StepLabel>
                <StepContent>
                  {syncPlan && (
                    <Box>
                      <Typography variant="body2" paragraph>
                        Revisa la configuración antes de iniciar la sincronización.
                      </Typography>
                      
                      <Card variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Resumen de Sincronización
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 6 }}>
                              <Typography variant="body2">
                                <strong>Espacios de Trabajo:</strong> {syncPlan.company.name}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                              <Typography variant="body2">
                                <strong>Contratistas:</strong> {syncPlan.contractors.length}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                              <Typography variant="body2">
                                <strong>Forzar sincronización:</strong> {forceSync ? 'Sí' : 'No'}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                              <Typography variant="body2">
                                <strong>Inscripción automática:</strong> {autoEnroll ? 'Sí' : 'No'}
                              </Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                      
                      {syncing && syncProgress.length > 0 && (
                        <Card variant="outlined" sx={{ mb: 2 }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              Progreso de Sincronización
                            </Typography>
                            {syncProgress.map((step, index) => (
                              <Box key={index} sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  {step.completed ? (
                                    <CheckCircleIcon color="success" fontSize="small" />
                                  ) : (
                                    <CircularProgress size={16} />
                                  )}
                                  <Typography variant="body2" fontWeight="medium">
                                    {step.label}
                                  </Typography>
                                </Box>
                                <Typography variant="caption" color="textSecondary" display="block">
                                  {step.description}
                                </Typography>
                                {step.progress !== undefined && (
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={step.progress} 
                                    sx={{ mt: 1 }}
                                  />
                                )}
                              </Box>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                      
                      <Box sx={{ mt: 2 }}>
                        <Button onClick={() => setActiveStep(1)} sx={{ mr: 1 }} disabled={syncing}>
                          Anterior
                        </Button>
                        <Button 
                          variant="contained" 
                          onClick={handleStartSync}
                          disabled={syncing}
                          startIcon={syncing ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                        >
                          {syncing ? 'Sincronizando...' : 'Iniciar Sincronización'}
                        </Button>
                      </Box>
                    </Box>
                  )}
                </StepContent>
              </Step>

              {/* Step 4: Success */}
              <Step>
                <StepLabel>Sincronización Completada</StepLabel>
                <StepContent>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      La sincronización masiva se ha completado exitosamente.
                    </Typography>
                  </Alert>
                  
                  {currentSyncOperation && (
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Resultados de la Sincronización
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 6 }}>
                            <Typography variant="body2">
                              <strong>Total procesados:</strong> {currentSyncOperation.processedItems}/{currentSyncOperation.totalItems}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <Typography variant="body2" color="success.main">
                              <strong>Exitosos:</strong> {currentSyncOperation.successfulItems}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <Typography variant="body2" color="error.main">
                              <strong>Fallidos:</strong> {currentSyncOperation.failedItems}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <Typography variant="body2">
                              <strong>Duración:</strong> {
                                currentSyncOperation.completedAt && 
                                Math.round((currentSyncOperation.completedAt.getTime() - currentSyncOperation.startedAt.getTime()) / 1000)
                              }s
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  )}
                  
                  <Box sx={{ mt: 2 }}>
                    <Button onClick={handleReset} variant="contained">
                      Nueva Sincronización
                    </Button>
                    <Button onClick={() => navigate('/courses/progress')} sx={{ ml: 1 }}>
                      Ver Progreso
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            </Stepper>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Operaciones Recientes
              </Typography>
              
              {syncOperations.length > 0 ? (
                <List>
                  {syncOperations.slice(0, 5).map((operation) => (
                    <ListItem key={operation.id} divider>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2">
                              {operation.type.replace('_', ' ')}
                            </Typography>
                            {getSyncStatusChip(operation.status)}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              {operation.startedAt.toLocaleString('es-CR')}
                            </Typography>
                            <Typography variant="caption" display="block">
                              {operation.successfulItems}/{operation.totalItems} exitosos
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No hay operaciones recientes
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirmar Sincronización Masiva</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Esta operación sincronizará todos los contratistas de la empresa seleccionada con TalentLMS.
          </Alert>
          
          {syncPlan && (
            <Typography variant="body2">
              Se procesarán <strong>{syncPlan.contractors.length} contratistas</strong> de la empresa <strong>{syncPlan.company.name}</strong>.
              
              {forceSync && (
                <><br /><br />Se actualizarán los usuarios existentes en TalentLMS.</>
              )}
              
              {autoEnroll && syncPlan.requiredCourses.length > 0 && (
                <><br /><br />Se inscribirán automáticamente en <strong>{syncPlan.requiredCourses.length} cursos obligatorios</strong>.</>
              )}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmSync} variant="contained" color="warning">
            Confirmar Sincronización
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};