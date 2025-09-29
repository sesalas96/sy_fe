import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  TablePagination,
  List,
  ListItem,
  InputAdornment,
  Snackbar,
  useTheme,
  useMediaQuery,
  Stack,
  Drawer,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Category as CategoryIcon,
  Timer as TimerIcon,
  Analytics as AnalyticsIcon,
  Close as CloseIcon,
  Error as ErrorIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { verificationsApi } from '../../services/verificationsApi';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

interface CompanyVerificationsProps {
  companyId: string;
  companyName: string;
}

interface Verification {
  _id: string;
  name: string;
  type: string;
  category?: string;
  description?: string;
  isRequired: boolean;
  validityPeriod?: number;
  renewalNoticePeriod?: number;
  renewalNoticePercentages?: number[];
  createdAt: string;
  updatedAt: string;
}

const verificationTypes = [
  { value: 'document', label: 'Documento' },
  { value: 'course', label: 'Curso' },
  { value: 'certification', label: 'Certificación' },
  { value: 'training', label: 'Entrenamiento' },
  { value: 'medical_exam', label: 'Examen Médico' },
  { value: 'background_check', label: 'Verificación de Antecedentes' },
  { value: 'other', label: 'Otro' }
];

const verificationCategories = [
  'Seguridad',
  'Salud',
  'Calidad',
  'Medio Ambiente',
  'Legal',
  'Técnico',
  'Administrativo',
  'Otro'
];

export const CompanyVerifications: React.FC<CompanyVerificationsProps> = ({ companyId }) => {
  const { hasRole } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVerification, setEditingVerification] = useState<Verification | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [verificationToDelete, setVerificationToDelete] = useState<Verification | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  
  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'document',
    category: '',
    description: '',
    isRequired: true,
    validityPeriod: 365
  });

  // Notification percentages
  const [notificationPercentages, setNotificationPercentages] = useState<number[]>([25]);
  
  // Stats drawer state
  const [statsDrawerOpen, setStatsDrawerOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  
  // Filter states
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    isRequired: 'all'
  });

  const canManageVerifications = () => {
    return hasRole([UserRole.SUPER_ADMIN, UserRole.SAFETY_STAFF]);
  };

  const loadVerifications = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await verificationsApi.getCompanyVerifications(companyId);
      setVerifications(data);
    } catch (error) {
      console.error('Error loading verifications:', error);
      setError('Error al cargar las verificaciones');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadVerifications();
  }, [loadVerifications]);

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const data = await verificationsApi.getCompanyVerificationStats(companyId);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
      setSnackbarMessage('Error al cargar las estadísticas');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleOpenStatsDrawer = () => {
    setStatsDrawerOpen(true);
    if (!stats) {
      loadStats();
    }
  };

  const handleOpenDialog = (verification?: Verification) => {
    if (verification) {
      setEditingVerification(verification);
      setFormData({
        name: verification.name,
        type: verification.type,
        category: verification.category || '',
        description: verification.description || '',
        isRequired: verification.isRequired,
        validityPeriod: verification.validityPeriod || 365
      });
      
      // Always use percentages
      if (verification.renewalNoticePercentages && verification.renewalNoticePercentages.length > 0) {
        setNotificationPercentages(verification.renewalNoticePercentages);
      } else {
        // Default percentage if no percentages exist
        setNotificationPercentages([25]);
      }
    } else {
      setEditingVerification(null);
      setFormData({
        name: '',
        type: 'document',
        category: '',
        description: '',
        isRequired: true,
        validityPeriod: 365
      });
      setNotificationPercentages([25]);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingVerification(null);
  };

  const checkDuplicateNotificationDays = () => {
    if (formData.validityPeriod > 0) {
      const days = notificationPercentages
        .filter(p => p > 0)
        .map(p => Math.floor((p / 100) * formData.validityPeriod));
      
      const uniqueDays = new Set(days);
      return days.length !== uniqueDays.size;
    }
    return false;
  };

  const getDuplicateDays = (index: number): boolean => {
    if (formData.validityPeriod > 0) {
      const currentDays = Math.floor((notificationPercentages[index] / 100) * formData.validityPeriod);
      const allDays = notificationPercentages
        .filter(p => p > 0)
        .map((p, i) => ({ days: Math.floor((p / 100) * formData.validityPeriod), index: i }));
      
      return allDays.some(d => d.index !== index && d.days === currentDays);
    }
    return false;
  };

  const handleSubmit = async () => {
    try {
      let dataToSubmit: any = {
        ...formData,
        validityPeriod: formData.type === 'background_check' ? undefined : formData.validityPeriod,
      };

      if (formData.type !== 'background_check') {
        // Always use percentages
        // Validate that percentages don't result in duplicate days
        const validPercentages = notificationPercentages.filter(p => p > 0);
        const days = validPercentages.map(p => Math.floor((p / 100) * formData.validityPeriod));
        
        console.log('Validation debug:', {
          validityPeriod: formData.validityPeriod,
          percentages: validPercentages,
          calculatedDays: days
        });
        
        const uniqueDays = new Set(days);
        
        if (days.length !== uniqueDays.size) {
          setError('Los porcentajes configurados resultan en días de notificación duplicados. Ajuste los porcentajes para evitar notificaciones en el mismo día.');
          setSnackbarMessage('Los porcentajes configurados resultan en días de notificación duplicados');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
          return;
        }
        
        // Send percentages array sorted in descending order
        dataToSubmit.renewalNoticePercentages = notificationPercentages
          .filter(p => p > 0) // Only send non-zero percentages
          .sort((a, b) => b - a);
        // Don't send renewalNoticePeriod when using percentages
        delete dataToSubmit.renewalNoticePeriod;
      }

      if (editingVerification) {
        // Update verification
        await verificationsApi.updateVerification(editingVerification._id, dataToSubmit);
      } else {
        // Create new verification
        await verificationsApi.createCompanyVerification(companyId, dataToSubmit);
      }
      
      await loadVerifications();
      handleCloseDialog();
      setError('');
      
      // Show success message
      setSnackbarMessage(editingVerification ? 'Verificación actualizada exitosamente' : 'Verificación creada exitosamente');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error saving verification:', error);
      setError('Error al guardar la verificación');
      
      // Show error message
      setSnackbarMessage('Error al guardar la verificación. Por favor, intente nuevamente.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleDelete = async () => {
    if (!verificationToDelete) return;

    try {
      await verificationsApi.deleteVerification(verificationToDelete._id);
      await loadVerifications();
      setDeleteDialogOpen(false);
      setVerificationToDelete(null);
      setError('');
      
      // Show success message
      setSnackbarMessage('Verificación eliminada exitosamente');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error deleting verification:', error);
      setError('Error al eliminar la verificación');
      
      // Show error message
      setSnackbarMessage('Error al eliminar la verificación. Por favor, intente nuevamente.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, verification: Verification) => {
    setAnchorEl(event.currentTarget);
    setSelectedVerification(verification);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedVerification(null);
  };

  const getTypeLabel = (type: string) => {
    const typeObj = verificationTypes.find(t => t.value === type);
    return typeObj ? typeObj.label : type;
  };

  const getTypeChip = (type: string) => {
    const colors: { [key: string]: any } = {
      document: 'default',
      course: 'primary',
      certification: 'secondary',
      training: 'info',
      medical_exam: 'warning',
      background_check: 'error',
      other: 'default'
    };

    return (
      <Chip 
        label={getTypeLabel(type)} 
        size="small" 
        color={colors[type] || 'default'}
      />
    );
  };

  // Get unique categories from verifications
  const getUniqueCategories = () => {
    const categories = new Set<string>();
    verifications.forEach(v => {
      if (v.category) categories.add(v.category);
    });
    return Array.from(categories).sort();
  };

  // Filter verifications
  const filteredVerifications = verifications.filter(verification => {
    // Type filter
    if (filters.type !== 'all' && verification.type !== filters.type) {
      return false;
    }
    
    // Category filter
    if (filters.category !== 'all') {
      if (filters.category === 'none' && verification.category) {
        return false;
      }
      if (filters.category !== 'none' && verification.category !== filters.category) {
        return false;
      }
    }
    
    // Required filter
    if (filters.isRequired !== 'all') {
      const isRequired = filters.isRequired === 'required';
      if (verification.isRequired !== isRequired) {
        return false;
      }
    }
    
    return true;
  });

  // Check if any filters are active
  const hasActiveFilters = () => {
    return filters.type !== 'all' || filters.category !== 'all' || filters.isRequired !== 'all';
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      type: 'all',
      category: 'all',
      isRequired: 'all'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
          {/* Header */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'stretch', sm: 'center' }, 
            gap: { xs: 1, sm: 0 },
            mb: { xs: 2, sm: 3 } 
          }}>
            <Typography 
              variant={isMobile ? 'subtitle1' : 'h6'} 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                fontSize: { xs: '1.1rem', sm: '1.25rem' }
              }}
            >
              <AssignmentIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
              {isXs ? 'Verificaciones' : 'Verificaciones del Espacio de Trabajo'}
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1, 
              width: isXs ? '100%' : 'auto' 
            }}>
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={() => setFilterDrawerOpen(true)}
                fullWidth={isXs}
                size={isMobile ? 'medium' : 'large'}
                color={hasActiveFilters() ? 'primary' : 'inherit'}
                endIcon={hasActiveFilters() ? (
                  <Box 
                    sx={{ 
                      bgcolor: 'primary.main', 
                      color: 'white', 
                      borderRadius: '12px', 
                      px: 0.75, 
                      py: 0.25,
                      fontSize: '0.75rem',
                      minWidth: '20px',
                      textAlign: 'center',
                      fontWeight: 'medium'
                    }}
                  >
                    {filteredVerifications.length}
                  </Box>
                ) : null}
              >
                {isXs ? 'Filtros' : 'Filtrar'}
              </Button>
              <Button
                variant="outlined"
                startIcon={!isXs && <AnalyticsIcon />}
                onClick={handleOpenStatsDrawer}
                fullWidth={isXs}
                size={isMobile ? 'medium' : 'large'}
              >
                {isXs ? 'Stats' : 'Estadísticas'}
              </Button>
              {canManageVerifications() && (
                <Button
                  variant="contained"
                  startIcon={!isXs && <AddIcon />}
                  onClick={() => handleOpenDialog()}
                  fullWidth={isXs}
                  size={isMobile ? 'medium' : 'large'}
                >
                  {isXs ? 'Nueva' : 'Nueva Verificación'}
                </Button>
              )}
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Active filters info */}
          {hasActiveFilters() && (
            <Alert 
              severity="info" 
              sx={{ mb: 2 }}
              action={
                <Button 
                  color="inherit" 
                  size="small"
                  onClick={handleResetFilters}
                >
                  Limpiar
                </Button>
              }
            >
              Mostrando {filteredVerifications.length} de {verifications.length} verificaciones
            </Alert>
          )}


          {/* Table/Cards */}
          {isMobile ? (
            // Mobile Card Layout
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1, sm: 2 } }}>
              {filteredVerifications.length === 0 ? (
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: { xs: 2, sm: 4 } }}>
                    <Typography variant="body2" color="text.secondary">
                      {hasActiveFilters() 
                        ? 'No se encontraron verificaciones con los filtros seleccionados' 
                        : 'No hay verificaciones configuradas para este espacio de trabajo'}
                    </Typography>
                    {hasActiveFilters() && (
                      <Button 
                        size="small" 
                        onClick={handleResetFilters} 
                        sx={{ mt: 2 }}
                      >
                        Limpiar filtros
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                filteredVerifications
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((verification) => (
                    <Card key={verification._id} variant="outlined">
                      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {verification.name}
                            </Typography>
                            {verification.description && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {verification.description}
                              </Typography>
                            )}
                          </Box>
                          {canManageVerifications() && (
                            <IconButton
                              onClick={(e) => handleMenuOpen(e, verification)}
                              size="small"
                              sx={{ ml: 1 }}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          )}
                        </Box>
                        
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                          {getTypeChip(verification.type)}
                          {verification.category && (
                            <Chip 
                              label={verification.category} 
                              size="small" 
                              icon={<CategoryIcon />}
                              variant="outlined"
                            />
                          )}
                          {verification.isRequired ? (
                            <Chip 
                              label="Requerida" 
                              size="small" 
                              color="success" 
                              icon={<CheckCircleIcon />}
                            />
                          ) : (
                            <Chip 
                              label="Opcional" 
                              size="small" 
                              color="default" 
                              variant="outlined"
                            />
                          )}
                        </Stack>
                        
                        {verification.validityPeriod && (
                          <Box sx={{ 
                            p: { xs: 1, sm: 1.5 }, 
                            bgcolor: 'grey.50', 
                            borderRadius: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: { xs: 0.5, sm: 1 }
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <TimerIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                              <Typography variant="body2">
                                Vigencia: <strong>{verification.validityPeriod} días</strong>
                              </Typography>
                            </Box>
                            {(verification.renewalNoticePercentages && verification.renewalNoticePercentages.length > 0) ? (
                              <Typography variant="caption" color="text.secondary">
                                Notificaciones: {verification.renewalNoticePercentages.map((p, index) => (
                                  <span key={index}>
                                    {p}% ({Math.floor((p / 100) * verification.validityPeriod!)}d)
                                    {index < verification.renewalNoticePercentages!.length - 1 ? ', ' : ''}
                                  </span>
                                ))}
                              </Typography>
                            ) : verification.renewalNoticePeriod ? (
                              <Typography variant="caption" color="text.secondary">
                                Notificación: {verification.renewalNoticePeriod} días antes
                              </Typography>
                            ) : null}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))
              )}
            </Box>
          ) : (
            // Desktop Table Layout
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Categoría</TableCell>
                    <TableCell align="center">Requerida</TableCell>
                    <TableCell align="center">Vigencia</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredVerifications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          {hasActiveFilters() 
                            ? 'No se encontraron verificaciones con los filtros seleccionados' 
                            : 'No hay verificaciones configuradas para este espacio de trabajo'}
                        </Typography>
                        {hasActiveFilters() && (
                          <Button 
                            size="small" 
                            onClick={handleResetFilters} 
                            sx={{ mt: 2 }}
                          >
                            Limpiar filtros
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVerifications
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((verification) => (
                        <TableRow key={verification._id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {verification.name}
                              </Typography>
                              {verification.description && (
                                <Typography variant="caption" color="text.secondary">
                                  {verification.description}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>{getTypeChip(verification.type)}</TableCell>
                          <TableCell>
                            {verification.category && (
                              <Chip 
                                label={verification.category} 
                                size="small" 
                                icon={<CategoryIcon />}
                                variant="outlined"
                              />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {verification.isRequired ? (
                              <CheckCircleIcon color="success" />
                            ) : (
                              <WarningIcon color="disabled" />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {verification.validityPeriod ? (
                              <Box>
                                <Chip 
                                  label={`${verification.validityPeriod} días`}
                                  size="small"
                                  icon={<TimerIcon />}
                                />
                                {(verification.renewalNoticePercentages && verification.renewalNoticePercentages.length > 0) ? (
                                  <Tooltip title={
                                    `Avisos: ${verification.renewalNoticePercentages
                                      .map(p => `${p}% (${Math.floor((p / 100) * verification.validityPeriod!)} días)`)
                                      .join(', ')}`
                                  }>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                      {verification.renewalNoticePercentages.length} avisos ({verification.renewalNoticePercentages.join('%, ')}%)
                                    </Typography>
                                  </Tooltip>
                                ) : verification.renewalNoticePeriod ? (
                                  <Tooltip title={`Aviso: ${verification.renewalNoticePeriod} días antes`}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                      {verification.renewalNoticePeriod}d antes
                                    </Typography>
                                  </Tooltip>
                                ) : null}
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Sin vencimiento
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {canManageVerifications() ? (
                              <IconButton
                                onClick={(e) => handleMenuOpen(e, verification)}
                                size="small"
                              >
                                <MoreVertIcon />
                              </IconButton>
                            ) : (
                              <Typography variant="body2" color="text.secondary">-</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {filteredVerifications.length > 0 && (
            <TablePagination
              component="div"
              count={filteredVerifications.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            />
          )}
        </CardContent>
      </Card>

      {/* Filter Drawer */}
      <Drawer
        anchor={isMobile ? 'bottom' : 'right'}
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: isMobile ? '100%' : 350,
              height: isMobile ? 'auto' : '100%',
              maxHeight: isMobile ? '80vh' : '100%'
            }
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3 
          }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterListIcon />
              Filtrar Verificaciones
            </Typography>
            <IconButton onClick={() => setFilterDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Filter Summary */}
          {hasActiveFilters() && (
            <Alert 
              severity="info" 
              sx={{ mb: 3 }}
              action={
                <Button 
                  color="inherit" 
                  size="small"
                  onClick={handleResetFilters}
                >
                  Limpiar
                </Button>
              }
            >
              {filteredVerifications.length} de {verifications.length} verificaciones
            </Alert>
          )}
          
          {/* Type filter */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Tipo de Verificación</InputLabel>
            <Select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              label="Tipo de Verificación"
            >
              <MenuItem value="all">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography>Todos los tipos</Typography>
                  <Chip label={verifications.length} size="small" />
                </Box>
              </MenuItem>
              <Divider />
              {verificationTypes.map((type) => {
                const count = verifications.filter(v => v.type === type.value).length;
                return (
                  <MenuItem key={type.value} value={type.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <Typography>{type.label}</Typography>
                      <Chip label={count} size="small" variant="outlined" />
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {/* Category filter */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Categoría</InputLabel>
            <Select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              label="Categoría"
            >
              <MenuItem value="all">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography>Todas las categorías</Typography>
                  <Chip label={verifications.length} size="small" />
                </Box>
              </MenuItem>
              <MenuItem value="none">
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <Typography>Sin categoría</Typography>
                  <Chip label={verifications.filter(v => !v.category).length} size="small" variant="outlined" />
                </Box>
              </MenuItem>
              <Divider />
              {getUniqueCategories().map((cat) => {
                const count = verifications.filter(v => v.category === cat).length;
                return (
                  <MenuItem key={cat} value={cat}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <Typography>{cat}</Typography>
                      <Chip label={count} size="small" variant="outlined" />
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {/* Required filter */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Tipo de Requerimiento</InputLabel>
            <Select
              value={filters.isRequired}
              onChange={(e) => setFilters({ ...filters, isRequired: e.target.value })}
              label="Tipo de Requerimiento"
            >
              <MenuItem value="all">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography>Todas</Typography>
                  <Chip label={verifications.length} size="small" />
                </Box>
              </MenuItem>
              <Divider />
              <MenuItem value="required">
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon color="success" sx={{ fontSize: 20 }} />
                    <Typography>Requeridas</Typography>
                  </Box>
                  <Chip label={verifications.filter(v => v.isRequired).length} size="small" color="success" variant="outlined" />
                </Box>
              </MenuItem>
              <MenuItem value="optional">
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon color="disabled" sx={{ fontSize: 20 }} />
                    <Typography>Opcionales</Typography>
                  </Box>
                  <Chip label={verifications.filter(v => !v.isRequired).length} size="small" variant="outlined" />
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={handleResetFilters}
              disabled={!hasActiveFilters()}
            >
              Limpiar filtros
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={() => setFilterDrawerOpen(false)}
            >
              Aplicar
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem 
          onClick={() => {
            handleOpenDialog(selectedVerification!);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => {
            setVerificationToDelete(selectedVerification);
            setDeleteDialogOpen(true);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Eliminar</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isXs}
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: 0, sm: '32px' },
            width: { xs: '100%', sm: 'auto' },
            maxHeight: { xs: '100%', sm: '90vh' }
          }
        }}
      >
        <DialogTitle>
          {editingVerification ? 'Editar Verificación' : 'Nueva Verificación'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Nombre"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />

            <FormControl fullWidth required>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                label="Tipo"
              >
                {verificationTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                label="Categoría"
              >
                <MenuItem value="">Sin categoría</MenuItem>
                {verificationCategories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Descripción"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isRequired}
                  onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                />
              }
              label="Verificación requerida"
            />

            {formData.type !== 'background_check' && (
              <>
                <TextField
                  label="Período de validez (días)"
                  type="number"
                  value={formData.validityPeriod}
                  onChange={(e) => setFormData({ ...formData, validityPeriod: parseInt(e.target.value) || 0 })}
                  fullWidth
                  helperText="Número de días que la verificación es válida"
                />

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Notificación antes del vencimiento (%)
                  </Typography>
                  <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Configure hasta 5 notificaciones por porcentaje del período de validez
                      </Typography>
                      
                      {notificationPercentages.map((percentage, index) => (
                        <Box key={index} sx={{ 
                          display: 'flex', 
                          flexDirection: { xs: 'column', sm: 'row' },
                          gap: 1, 
                          mb: 2, 
                          alignItems: { xs: 'stretch', sm: 'center' } 
                        }}>
                          <TextField
                            label={`Notificación ${index + 1}`}
                            type="number"
                            value={percentage}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              if (value >= 0 && value <= 100) {
                                const newPercentages = [...notificationPercentages];
                                newPercentages[index] = value;
                                setNotificationPercentages(newPercentages);
                              }
                            }}
                            size="small"
                            error={percentage > 0 && getDuplicateDays(index)}
                            helperText={percentage > 0 && getDuplicateDays(index) ? 'Días duplicados' : ''}
                            slotProps={{
                              input: {
                                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                              },
                              htmlInput: { min: 0, max: 100 }
                            }}
                            sx={{ flex: 1 }}
                          />
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: { xs: 'space-between', sm: 'flex-start' },
                            gap: 1 
                          }}>
                            <Typography variant="caption" color="text.secondary" sx={{ minWidth: { xs: 'auto', sm: 120 } }}>
                              {Math.floor((percentage / 100) * formData.validityPeriod)} días antes
                            </Typography>
                            {notificationPercentages.length > 1 && (
                              <IconButton
                                size="small"
                                onClick={() => {
                                  const newPercentages = notificationPercentages.filter((_, i) => i !== index);
                                  setNotificationPercentages(newPercentages);
                                }}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </Box>
                        </Box>
                      ))}
                      
                      {notificationPercentages.length < 5 && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => {
                            const lastPercentage = notificationPercentages[notificationPercentages.length - 1] || 50;
                            const newPercentage = Math.max(10, lastPercentage - 10);
                            setNotificationPercentages([...notificationPercentages, newPercentage]);
                          }}
                          fullWidth
                        >
                          Agregar notificación
                        </Button>
                      )}
                      
                      <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Sugerencias: 75% (3/4 del período), 50% (mitad), 25% (1/4), 10% (cerca del vencimiento)
                        </Typography>
                      </Box>
                      
                      {checkDuplicateNotificationDays() && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                          Los porcentajes configurados resultan en días de notificación duplicados. Ajuste los porcentajes para evitar notificaciones en el mismo día.
                        </Alert>
                      )}
                    </Box>
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          gap: { xs: 1, sm: 0 },
          p: { xs: 2, sm: 1 }
        }}>
          <Button 
            onClick={handleCloseDialog}
            fullWidth={isXs}
            size={isMobile ? 'medium' : 'large'}
          >
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={!formData.name.trim() || checkDuplicateNotificationDays()}
            fullWidth={isXs}
            size={isMobile ? 'medium' : 'large'}
          >
            {editingVerification ? 'Guardar cambios' : 'Crear verificación'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        fullScreen={isXs}
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: 0, sm: '32px' },
            width: { xs: '100%', sm: 'auto' },
            maxHeight: { xs: '100%', sm: '90vh' }
          }
        }}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de que desea eliminar la verificación "{verificationToDelete?.name}"?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Esta acción no se puede deshacer. Los usuarios que ya hayan enviado esta verificación mantendrán sus registros.
          </Alert>
        </DialogContent>
        <DialogActions sx={{
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          gap: { xs: 1, sm: 0 },
          p: { xs: 2, sm: 1 }
        }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            fullWidth={isXs}
            size={isMobile ? 'medium' : 'large'}
          >
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleDelete}
            fullWidth={isXs}
            size={isMobile ? 'medium' : 'large'}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Stats Drawer */}
      <Drawer
        anchor={isMobile ? 'bottom' : 'right'}
        open={statsDrawerOpen}
        onClose={() => setStatsDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: isMobile ? '100%' : 400,
              height: isMobile ? 'auto' : '100%',
              maxHeight: isMobile ? '80vh' : '100%'
            }
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3 
          }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AnalyticsIcon />
              Estadísticas de Verificaciones
            </Typography>
            <IconButton onClick={() => setStatsDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          {statsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : stats ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Overview Stats */}
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                    Resumen General
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
                    <Box>
                      <Typography variant="h4">{stats.totalVerifications || 0}</Typography>
                      <Typography variant="body2" color="text.secondary">Verificaciones</Typography>
                    </Box>
                    <Box>
                      <Typography variant="h4" color="primary">{stats.requiredVerifications || 0}</Typography>
                      <Typography variant="body2" color="text.secondary">Requeridas</Typography>
                    </Box>
                    <Box>
                      <Typography variant="h4">{stats.totalUsers || 0}</Typography>
                      <Typography variant="body2" color="text.secondary">Usuarios</Typography>
                    </Box>
                    <Box>
                      <Typography variant="h4" color="secondary">
                        {stats.totalVerifications - stats.requiredVerifications || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Opcionales</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Overall Compliance */}
              {stats.overallCompliance && (
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                      Cumplimiento General
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircleIcon color="success" sx={{ fontSize: 20 }} />
                          <Typography variant="body2">Cumple completamente</Typography>
                        </Box>
                        <Chip 
                          label={stats.overallCompliance.compliant || 0} 
                          color="success" 
                          size="small" 
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <WarningIcon color="warning" sx={{ fontSize: 20 }} />
                          <Typography variant="body2">Cumplimiento parcial</Typography>
                        </Box>
                        <Chip 
                          label={stats.overallCompliance.partial || 0} 
                          color="warning" 
                          size="small" 
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ErrorIcon sx={{ fontSize: 20, color: 'error.main' }} />
                          <Typography variant="body2">No cumple</Typography>
                        </Box>
                        <Chip 
                          label={stats.overallCompliance.nonCompliant || 0} 
                          color="error" 
                          size="small" 
                        />
                      </Box>
                    </Box>

                    {/* Compliance percentage */}
                    {stats.totalUsers > 0 && (
                      <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Porcentaje de cumplimiento
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                          <Typography variant="h3" color="primary">
                            {Math.round((stats.overallCompliance.compliant / stats.totalUsers) * 100)}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            de usuarios cumplen
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* User Compliance Details */}
              {stats.userCompliance && stats.userCompliance.length > 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                      Detalle por Usuario
                    </Typography>
                    <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                      {stats.userCompliance.map((user: any, index: number) => (
                        <ListItem key={index} sx={{ px: 0, py: 1 }}>
                          <ListItemText 
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2">{user.userName || 'Usuario'}</Typography>
                                <Chip 
                                  label={
                                    user.complianceStatus === 'compliant' ? 'Cumple' :
                                    user.complianceStatus === 'partial' ? 'Parcial' : 'No cumple'
                                  }
                                  size="small"
                                  color={
                                    user.complianceStatus === 'compliant' ? 'success' :
                                    user.complianceStatus === 'partial' ? 'warning' : 'error'
                                  }
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  {user.completedVerifications}/{user.totalRequired} verificaciones completadas
                                </Typography>
                                {user.missingVerifications && user.missingVerifications.length > 0 && (
                                  <Typography variant="caption" color="error" sx={{ display: 'block' }}>
                                    Falta: {user.missingVerifications.join(', ')}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              )}

              {/* No users message */}
              {stats.totalUsers === 0 && (
                <Alert severity="info">
                  No hay usuarios asignados a este espacio de trabajo aún.
                </Alert>
              )}

              {/* Last Updated */}
              <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 2 }}>
                Actualizado: {new Date().toLocaleString('es-ES')}
              </Typography>
            </Box>
          ) : (
            <Alert severity="info">
              No hay estadísticas disponibles
            </Alert>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};