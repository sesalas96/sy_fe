import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  TablePagination,
  Avatar,
  Tooltip,
  Drawer,
  Divider,
  Badge,
  useMediaQuery,
  useTheme,
  Skeleton,
  Snackbar,
  Checkbox,
  DialogContentText
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  FilterAlt as FilterAltIcon,
  Download as DownloadIcon,
  Assessment as AssessmentIcon,
  Clear as ClearIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { contractorApi, Contractor, ContractorFilters } from '../../services/contractorApi';
import { useAuth } from '../../contexts/AuthContext';

interface ContractorStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  expiringDocuments: number;
  validCertifications: number;
  expiredCertifications: number;
  completedCourses: number;
  averageCourseScore: number;
  byCompany: {
    _id: string;
    name: string;
    count: number;
  }[];
}

export const Contractors: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const hasLoadedRef = useRef(false);

  // Main states
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [filteredContractors, setFilteredContractors] = useState<Contractor[]>([]);
  const [stats, setStats] = useState<ContractorStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [documentStatusFilter, setDocumentStatusFilter] = useState<string>('all');
  const [supervisorFilter, setSupervisorFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalContractors, setTotalContractors] = useState(0);

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [contractorToDelete, setContractorToDelete] = useState<Contractor | null>(null);
  const [contractorToEdit, setContractorToEdit] = useState<Contractor | null>(null);
  
  // Drawer states
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
  const [statsDrawerOpen, setStatsDrawerOpen] = useState(false);
  
  // Bulk action states
  const [selectedContractors, setSelectedContractors] = useState<string[]>([]);
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'success' });

  // Export states
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv'>('excel');
  const [exportLoading, setExportLoading] = useState(false);

  // Form states for create/edit
  const [contractorForm, setContractorForm] = useState({
    fullName: '',
    firstName: '',
    lastName: '',
    cedula: '',
    email: '',
    phone: '',
    companyId: user?.company?._id || '',
    supervisorId: '',
    status: 'active' as 'active' | 'inactive' | 'suspended',
    polizaINS: {
      number: '',
      expiryDate: '',
      documentUrl: ''
    },
    ordenPatronal: {
      number: '',
      expiryDate: '',
      documentUrl: ''
    }
  });

  // Load contractors with API
  const loadContractors = useCallback(async () => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    setLoading(true);
    setError(null);
    
    try {
      const filters: ContractorFilters = {
        page: page + 1,
        limit: rowsPerPage
      };
      
      // Only add filters if they have values
      if (searchTerm) {
        filters.search = searchTerm;
      }
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      if (companyFilter !== 'all') {
        filters.companyId = companyFilter;
      }
      
      const response = await contractorApi.getAll(filters);
      
      if (response.success && response.data) {
        setContractors(response.data);
        setFilteredContractors(response.data);
        setTotalContractors(response.pagination?.total || response.data.length);
        
        // Calculate stats
        calculateStats(response.data);
      } else {
        throw new Error(response.message || 'Error al cargar contratistas');
      }
    } catch (err: any) {
      console.error('Error loading contractors:', err);
      setError(err.message || 'Error al cargar los contratistas');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, statusFilter, companyFilter]);

  // Calculate statistics
  const calculateStats = (contractorsList: Contractor[]) => {
    const stats: ContractorStats = {
      total: contractorsList.length,
      active: 0,
      inactive: 0,
      suspended: 0,
      expiringDocuments: 0,
      validCertifications: 0,
      expiredCertifications: 0,
      completedCourses: 0,
      averageCourseScore: 0,
      byCompany: []
    };

    const companyMap = new Map<string, { name: string; count: number }>();
    let totalCourseScores = 0;
    let totalCoursesWithScores = 0;

    contractorsList.forEach(contractor => {
      // Status counts
      if (contractor.status === 'active' || contractor.status === 'activo') stats.active++;
      else if (contractor.status === 'inactive' || contractor.status === 'inactivo') stats.inactive++;
      else if (contractor.status === 'suspended' || contractor.status === 'baja') stats.suspended++;

      // Document expiry check
      const now = new Date();
      if (contractor.polizaINS?.expiryDate) {
        const expiryDate = new Date(contractor.polizaINS.expiryDate);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) stats.expiringDocuments++;
      }
      if (contractor.ordenPatronal?.expiryDate) {
        const expiryDate = new Date(contractor.ordenPatronal.expiryDate);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) stats.expiringDocuments++;
      }

      // Certifications count
      if (contractor.certifications) {
        contractor.certifications.forEach(cert => {
          if (cert.status === 'valid') stats.validCertifications++;
          else if (cert.status === 'expired') stats.expiredCertifications++;
        });
      }

      // Courses count and scores
      if (contractor.courses) {
        stats.completedCourses += contractor.courses.filter(c => c.status === 'completed').length;
        contractor.courses.forEach(course => {
          if (course.score) {
            totalCourseScores += course.score;
            totalCoursesWithScores++;
          }
        });
      }

      // Company grouping
      if (contractor.company) {
        const existing = companyMap.get(contractor.company._id);
        if (existing) {
          existing.count++;
        } else {
          companyMap.set(contractor.company._id, {
            name: contractor.company.name,
            count: 1
          });
        }
      }
    });

    // Calculate average course score
    if (totalCoursesWithScores > 0) {
      stats.averageCourseScore = Math.round(totalCourseScores / totalCoursesWithScores);
    }

    // Convert company map to array
    stats.byCompany = Array.from(companyMap.entries()).map(([_id, data]) => ({
      _id,
      ...data
    }));

    setStats(stats);
  };

  // Effects
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (user) {
      hasLoadedRef.current = false;
      loadContractors();
    }
  }, [user, loadContractors]);

  // Apply client-side filtering
  useEffect(() => {
    let filtered = [...contractors];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(contractor => {
        const fullName = contractor.fullName || `${contractor.firstName} ${contractor.lastName}`;
        return fullName.toLowerCase().includes(search) ||
               contractor.cedula.includes(search) ||
               contractor.email?.toLowerCase().includes(search) ||
               contractor.company?.name?.toLowerCase().includes(search);
      });
    }

    // Document status filter
    if (documentStatusFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(contractor => {
        const polizaExpiry = contractor.polizaINS?.expiryDate ? new Date(contractor.polizaINS.expiryDate) : null;
        const ordenExpiry = contractor.ordenPatronal?.expiryDate ? new Date(contractor.ordenPatronal.expiryDate) : null;
        
        if (documentStatusFilter === 'valid') {
          return (!polizaExpiry || polizaExpiry > now) && (!ordenExpiry || ordenExpiry > now);
        } else if (documentStatusFilter === 'expiring') {
          const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          return (polizaExpiry && polizaExpiry > now && polizaExpiry <= thirtyDaysFromNow) ||
                 (ordenExpiry && ordenExpiry > now && ordenExpiry <= thirtyDaysFromNow);
        } else if (documentStatusFilter === 'expired') {
          return (polizaExpiry && polizaExpiry <= now) || (ordenExpiry && ordenExpiry <= now);
        }
        return true;
      });
    }

    // Supervisor filter
    if (supervisorFilter !== 'all') {
      filtered = filtered.filter(contractor => contractor.supervisor?._id === supervisorFilter);
    }

    // Date range filter
    if (dateRangeFilter.start || dateRangeFilter.end) {
      filtered = filtered.filter(contractor => {
        const createdDate = new Date(contractor.createdAt || '');
        const startDate = dateRangeFilter.start ? new Date(dateRangeFilter.start) : null;
        const endDate = dateRangeFilter.end ? new Date(dateRangeFilter.end) : null;
        
        if (startDate && createdDate < startDate) return false;
        if (endDate && createdDate > endDate) return false;
        return true;
      });
    }

    setFilteredContractors(filtered);
    setTotalContractors(filtered.length);
  }, [contractors, searchTerm, documentStatusFilter, supervisorFilter, dateRangeFilter]);

  // Handlers
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
    hasLoadedRef.current = false;
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    hasLoadedRef.current = false;
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCompanyFilter('all');
    setDocumentStatusFilter('all');
    setSupervisorFilter('all');
    setDateRangeFilter({ start: '', end: '' });
    setPage(0);
    hasLoadedRef.current = false;
  };

  const handleDeleteClick = (contractor: Contractor) => {
    setContractorToDelete(contractor);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!contractorToDelete) return;

    try {
      const response = await contractorApi.delete(contractorToDelete._id);
      if (response.success) {
        await loadContractors();
        setSnackbar({
          open: true,
          message: 'Contratista eliminado exitosamente',
          severity: 'success'
        });
      } else {
        throw new Error(response.message || 'Error al eliminar el contratista');
      }
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || 'Error al eliminar el contratista',
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
      setContractorToDelete(null);
    }
  };

  const handleCreateContractor = async () => {
    try {
      // Validate required fields
      if (!contractorForm.fullName && (!contractorForm.firstName || !contractorForm.lastName)) {
        throw new Error('El nombre completo es requerido');
      }
      if (!contractorForm.cedula) {
        throw new Error('La cédula es requerida');
      }

      const formData: any = {
        ...contractorForm,
        fullName: contractorForm.fullName || `${contractorForm.firstName} ${contractorForm.lastName}`,
        status: contractorForm.status || 'active'
      };
      
      // Remove empty polizaINS or ordenPatronal if not provided
      if (!formData.polizaINS?.number && !formData.polizaINS?.expiryDate) {
        delete formData.polizaINS;
      }
      if (!formData.ordenPatronal?.number && !formData.ordenPatronal?.expiryDate) {
        delete formData.ordenPatronal;
      }

      const response = await contractorApi.create(formData);
      if (response.success) {
        hasLoadedRef.current = false;
        await loadContractors();
        setCreateDialogOpen(false);
        resetForm();
        setSnackbar({
          open: true,
          message: 'Contratista creado exitosamente',
          severity: 'success'
        });
      } else {
        throw new Error(response.message || 'Error al crear el contratista');
      }
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || 'Error al crear el contratista',
        severity: 'error'
      });
    }
  };

  const handleUpdateContractor = async () => {
    if (!contractorToEdit) return;

    try {
      const formData: any = {
        ...contractorForm,
        fullName: contractorForm.fullName || `${contractorForm.firstName} ${contractorForm.lastName}`,
        status: contractorForm.status || 'active'
      };
      
      // Remove empty polizaINS or ordenPatronal if not provided
      if (!formData.polizaINS?.number && !formData.polizaINS?.expiryDate) {
        delete formData.polizaINS;
      }
      if (!formData.ordenPatronal?.number && !formData.ordenPatronal?.expiryDate) {
        delete formData.ordenPatronal;
      }
      
      const response = await contractorApi.update(contractorToEdit._id, formData);
      if (response.success) {
        hasLoadedRef.current = false;
        await loadContractors();
        setEditDialogOpen(false);
        setContractorToEdit(null);
        resetForm();
        setSnackbar({
          open: true,
          message: 'Contratista actualizado exitosamente',
          severity: 'success'
        });
      } else {
        throw new Error(response.message || 'Error al actualizar el contratista');
      }
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || 'Error al actualizar el contratista',
        severity: 'error'
      });
    }
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      
      const filters: ContractorFilters & { format: 'csv' | 'excel' } = {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        companyId: companyFilter !== 'all' ? companyFilter : undefined,
        search: searchTerm || undefined,
        format: exportFormat
      };
      
      const blob = await contractorApi.exportContractors(filters);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contratistas_${new Date().toISOString().split('T')[0]}.${exportFormat === 'csv' ? 'csv' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setExportDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'Exportación completada exitosamente',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error al exportar los contratistas',
        severity: 'error'
      });
    } finally {
      setExportLoading(false);
    }
  };

  const resetForm = () => {
    setContractorForm({
      fullName: '',
      firstName: '',
      lastName: '',
      cedula: '',
      email: '',
      phone: '',
      companyId: user?.company?._id || '',
      supervisorId: '',
      status: 'active',
      polizaINS: { number: '', expiryDate: '', documentUrl: '' },
      ordenPatronal: { number: '', expiryDate: '', documentUrl: '' }
    });
  };

  // UI Helper functions
  const getContractorName = (contractor: Contractor) => {
    if (contractor.fullName) return contractor.fullName;
    if (contractor.firstName && contractor.lastName) {
      return `${contractor.firstName} ${contractor.lastName}`;
    }
    return 'Sin nombre';
  };

  const getInitials = (contractor: Contractor) => {
    const name = getContractorName(contractor);
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus === 'active' || normalizedStatus === 'activo') return 'success.main';
    if (normalizedStatus === 'inactive' || normalizedStatus === 'inactivo') return 'warning.main';
    return 'error.main';
  };

  const getStatusChip = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    let label = 'Desconocido';
    let color: 'success' | 'default' | 'error' = 'default';
    let icon = null;

    if (normalizedStatus === 'active' || normalizedStatus === 'activo') {
      label = 'Activo';
      color = 'success';
      icon = <CheckCircleIcon />;
    } else if (normalizedStatus === 'inactive' || normalizedStatus === 'inactivo') {
      label = 'Inactivo';
      color = 'default';
    } else if (normalizedStatus === 'suspended' || normalizedStatus === 'baja') {
      label = 'Suspendido';
      color = 'error';
      icon = <WarningIcon />;
    }

    return <Chip label={label} color={color as any} size="small" icon={icon as any} />;
  };

  const getDocumentStatus = (expiryDate: string | undefined) => {
    if (!expiryDate) return null;
    
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return <Chip label="Vencido" color="error" size="small" />;
    } else if (daysUntilExpiry <= 30) {
      return <Chip label={`Vence en ${daysUntilExpiry}d`} color="warning" size="small" />;
    } else {
      return <Chip label="Vigente" color="success" size="small" />;
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-CR');
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || companyFilter !== 'all' || 
                          documentStatusFilter !== 'all' || supervisorFilter !== 'all' || 
                          dateRangeFilter.start || dateRangeFilter.end;

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          mb: { xs: 2, sm: 3 },
          gap: 1
        }}>
          <Box>
            <Typography variant={isMobile ? "h5" : "h4"} gutterBottom sx={{ mb: { xs: 0.5, sm: 1 } }}>
              Contratistas
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Gestione todos los contratistas registrados en el sistema
            </Typography>
          </Box>
          
          {/* Desktop Primary Action */}
          {!isMobile && (
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{ 
                px: 3,
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                }
              }}
            >
              Nuevo Contratista
            </Button>
          )}
        </Box>

        {/* Action Buttons */}
        <Box sx={{ 
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 2 },
          mb: 2
        }}>
          {/* Mobile Primary Action */}
          {isMobile && (
            <Button
              variant="contained"
              fullWidth
              onClick={() => setCreateDialogOpen(true)}
              sx={{ 
                py: 1.5,
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                }
              }}
            >
              <AddIcon sx={{ mr: 1 }} />
              Nuevo Contratista
            </Button>
          )}

          {/* Secondary Actions */}
          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            flexWrap: 'wrap',
            flex: 1
          }}>
            <Button
              variant="outlined"
              onClick={() => setStatsDrawerOpen(true)}
              startIcon={<AssessmentIcon />}
              sx={{ 
                flex: { xs: 1, sm: 'none' },
                minWidth: { xs: 0, sm: 140 }
              }}
            >
              Estadísticas
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => setFiltersDrawerOpen(true)}
              startIcon={<FilterAltIcon />}
              sx={{ 
                flex: { xs: 1, sm: 'none' },
                minWidth: { xs: 0, sm: 100 },
                position: 'relative'
              }}
            >
              Filtros
              {hasActiveFilters && (
                <Box sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'error.main',
                  border: '2px solid',
                  borderColor: 'background.paper'
                }} />
              )}
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => setExportDialogOpen(true)}
              startIcon={<DownloadIcon />}
              sx={{ 
                flex: { xs: 1, sm: 'none' },
                minWidth: { xs: 0, sm: 110 }
              }}
            >
              Exportar
            </Button>

            {selectedContractors.length > 0 && (
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<NotificationsIcon />}
                sx={{ 
                  flex: { xs: 1, sm: 'none' },
                  minWidth: { xs: 0, sm: 160 }
                }}
              >
                Acciones ({selectedContractors.length})
              </Button>
            )}
          </Box>
        </Box>
      </Box>


      {/* Error Display */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }} 
          onClose={() => setError(null)}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => { hasLoadedRef.current = false; loadContractors(); }}
            >
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Main Content Table/Cards */}
      <Card>
        {loading ? (
          <Box sx={{ p: 3 }}>
            {[...Array(5)].map((_, index) => (
              <Skeleton key={index} height={80} sx={{ mb: 1 }} animation="wave" />
            ))}
          </Box>
        ) : filteredContractors.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <PeopleIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No se encontraron contratistas
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {contractors.length === 0 
                ? 'No hay contratistas registrados en el sistema'
                : 'No hay contratistas que coincidan con los filtros seleccionados'
              }
            </Typography>
            {hasActiveFilters && (
              <Button 
                variant="text" 
                onClick={handleClearFilters} 
                sx={{ mt: 2 }}
                startIcon={<ClearIcon />}
              >
                Limpiar Filtros
              </Button>
            )}
          </Box>
        ) : isMobile ? (
          // Mobile Cards View
          <Box sx={{ p: 2 }}>
            {filteredContractors.map((contractor) => (
              <Card key={contractor._id} sx={{ mb: 2, boxShadow: 2 }}>
                <CardContent>
                  {/* Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <Avatar
                        sx={{ 
                          width: 48, 
                          height: 48, 
                          mr: 2,
                          bgcolor: getStatusColor(contractor.status),
                          fontSize: '1rem'
                        }}
                      >
                        {getInitials(contractor)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {getContractorName(contractor)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {contractor.cedula}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          {getStatusChip(contractor.status)}
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                  
                  {/* Company Info */}
                  {contractor.company && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Empresa
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {contractor.company.name}
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Contact Info */}
                  {(contractor.email || contractor.phone) && (
                    <Box sx={{ mb: 2 }}>
                      {contractor.email && (
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          📧 {contractor.email}
                        </Typography>
                      )}
                      {contractor.phone && (
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                          📞 {contractor.phone}
                        </Typography>
                      )}
                    </Box>
                  )}
                  
                  {/* Documents */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Documentos
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                      {contractor.polizaINS?.number && (
                        <Box>
                          <Typography variant="caption">Póliza INS: {contractor.polizaINS.number}</Typography>
                          {getDocumentStatus(contractor.polizaINS.expiryDate)}
                        </Box>
                      )}
                      {contractor.ordenPatronal?.number && (
                        <Box>
                          <Typography variant="caption">Orden Patronal: {contractor.ordenPatronal.number}</Typography>
                          {getDocumentStatus(contractor.ordenPatronal.expiryDate)}
                        </Box>
                      )}
                    </Box>
                  </Box>
                  
                  {/* Stats */}
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Certificaciones
                      </Typography>
                      <Typography variant="body2">
                        {contractor.certifications?.length || 0}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Cursos
                      </Typography>
                      <Typography variant="body2">
                        {contractor.courses?.length || 0}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Última actividad
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(contractor.updatedAt)}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Actions */}
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => navigate(`/contractors/${contractor._id}`)}
                    >
                      Ver
                    </Button>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => {
                        setContractorToEdit(contractor);
                        setContractorForm({
                          fullName: contractor.fullName || '',
                          firstName: contractor.firstName || '',
                          lastName: contractor.lastName || '',
                          cedula: contractor.cedula,
                          email: contractor.email || '',
                          phone: contractor.phone || '',
                          companyId: contractor.company?._id || '',
                          supervisorId: contractor.supervisor?._id || '',
                          status: contractor.status as any,
                          polizaINS: contractor.polizaINS ? 
                            { ...contractor.polizaINS, documentUrl: contractor.polizaINS.documentUrl || '' } : 
                            { number: '', expiryDate: '', documentUrl: '' },
                          ordenPatronal: contractor.ordenPatronal ? 
                            { 
                              number: contractor.ordenPatronal.number || '', 
                              expiryDate: contractor.ordenPatronal.expiryDate || '', 
                              documentUrl: contractor.ordenPatronal.documentUrl || '' 
                            } : 
                            { number: '', expiryDate: '', documentUrl: '' }
                        });
                        setEditDialogOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteClick(contractor)}
                    >
                      Eliminar
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          // Desktop Table View
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedContractors.length > 0 && selectedContractors.length < filteredContractors.length}
                      checked={filteredContractors.length > 0 && selectedContractors.length === filteredContractors.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedContractors(filteredContractors.map(c => c._id));
                        } else {
                          setSelectedContractors([]);
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>Contratista</TableCell>
                  <TableCell>Empresa</TableCell>
                  <TableCell>Documentos</TableCell>
                  <TableCell>Supervisor</TableCell>
                  <TableCell align="center">Certificaciones</TableCell>
                  <TableCell align="center">Cursos</TableCell>
                  <TableCell>Última Actividad</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredContractors.map((contractor) => (
                  <TableRow 
                    key={contractor._id} 
                    hover
                    selected={selectedContractors.includes(contractor._id)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedContractors.includes(contractor._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedContractors([...selectedContractors, contractor._id]);
                          } else {
                            setSelectedContractors(selectedContractors.filter(id => id !== contractor._id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          sx={{ 
                            width: 40, 
                            height: 40, 
                            mr: 2,
                            bgcolor: getStatusColor(contractor.status),
                            fontSize: '0.875rem'
                          }}
                        >
                          {getInitials(contractor)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {getContractorName(contractor)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {contractor.cedula}
                          </Typography>
                          {contractor.email && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {contractor.email}
                            </Typography>
                          )}
                          <Box sx={{ mt: 0.5 }}>
                            {getStatusChip(contractor.status)}
                          </Box>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {contractor.company ? (
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {contractor.company.name}
                          </Typography>
                          {contractor.company.industry && (
                            <Typography variant="caption" color="text.secondary">
                              {contractor.company.industry}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Sin empresa
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {contractor.polizaINS?.number ? (
                          <Box>
                            <Typography variant="caption">Póliza INS: {contractor.polizaINS.number}</Typography>
                            <Box sx={{ mt: 0.5 }}>
                              {getDocumentStatus(contractor.polizaINS.expiryDate)}
                            </Box>
                          </Box>
                        ) : null}
                        {contractor.ordenPatronal?.number ? (
                          <Box>
                            <Typography variant="caption">Orden Patronal: {contractor.ordenPatronal.number}</Typography>
                            <Box sx={{ mt: 0.5 }}>
                              {getDocumentStatus(contractor.ordenPatronal.expiryDate)}
                            </Box>
                          </Box>
                        ) : null}
                        {!contractor.polizaINS?.number && !contractor.ordenPatronal?.number && (
                          <Typography variant="caption" color="text.secondary">
                            Sin documentos
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {contractor.supervisor ? (
                        <Box>
                          <Typography variant="body2">
                            {contractor.supervisor.firstName} {contractor.supervisor.lastName}
                          </Typography>
                          {contractor.supervisor.email && (
                            <Typography variant="caption" color="text.secondary">
                              {contractor.supervisor.email}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Sin supervisor
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                        <Badge 
                          badgeContent={contractor.certifications?.length || 0} 
                          color="primary"
                          showZero
                        >
                          <AssignmentIcon color="action" />
                        </Badge>
                        {contractor.certifications && contractor.certifications.length > 0 && (
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {contractor.certifications.filter(c => c.status === 'valid').length > 0 && (
                              <Chip
                                label={`${contractor.certifications.filter(c => c.status === 'valid').length}`}
                                size="small"
                                color="success"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                            {contractor.certifications.filter(c => c.status === 'expired').length > 0 && (
                              <Chip
                                label={`${contractor.certifications.filter(c => c.status === 'expired').length}`}
                                size="small"
                                color="error"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                        <Badge 
                          badgeContent={contractor.courses?.length || 0} 
                          color="primary"
                          showZero
                        >
                          <SchoolIcon color="action" />
                        </Badge>
                        {contractor.courses && contractor.courses.length > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            Promedio: {Math.round(
                              contractor.courses.reduce((acc, c) => acc + (c.score || 0), 0) / contractor.courses.length
                            )}%
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(contractor.updatedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ver detalles">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/contractors/${contractor._id}`)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setContractorToEdit(contractor);
                            const validStatus = ['active', 'inactive', 'suspended'].includes(contractor.status) ? 
                              contractor.status as 'active' | 'inactive' | 'suspended' : 'active';
                            
                            setContractorForm({
                              fullName: contractor.fullName || '',
                              firstName: contractor.firstName || '',
                              lastName: contractor.lastName || '',
                              cedula: contractor.cedula,
                              email: contractor.email || '',
                              phone: contractor.phone || '',
                              companyId: contractor.company?._id || '',
                              supervisorId: contractor.supervisor?._id || '',
                              status: validStatus,
                              polizaINS: contractor.polizaINS ? 
                                { ...contractor.polizaINS, documentUrl: contractor.polizaINS.documentUrl || '' } : 
                                { number: '', expiryDate: '', documentUrl: '' },
                              ordenPatronal: contractor.ordenPatronal ? 
                                { 
                                  number: contractor.ordenPatronal.number || '', 
                                  expiryDate: contractor.ordenPatronal.expiryDate || '', 
                                  documentUrl: contractor.ordenPatronal.documentUrl || '' 
                                } : 
                                { number: '', expiryDate: '', documentUrl: '' }
                            });
                            setEditDialogOpen(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(contractor)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalContractors}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
        />
      </Card>

      {/* Statistics Drawer */}
      <Drawer
        anchor="right"
        open={statsDrawerOpen}
        onClose={() => setStatsDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '85%', sm: 400 },
            p: 3
          }
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Estadísticas</Typography>
            <IconButton onClick={() => setStatsDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          {stats && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Summary Cards */}
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PeopleIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4">{stats.total}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Contratistas
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
              
              {/* Status Breakdown */}
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Estado de Contratistas
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Activos</Typography>
                      <Chip label={stats.active} color="success" size="small" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Inactivos</Typography>
                      <Chip label={stats.inactive} size="small" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Suspendidos</Typography>
                      <Chip label={stats.suspended} color="error" size="small" />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
              
              {/* Documents */}
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Badge badgeContent={stats.expiringDocuments} color="warning">
                      <WarningIcon sx={{ fontSize: 32 }} />
                    </Badge>
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="h6">{stats.expiringDocuments}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Documentos por vencer
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Documentos que vencen en los próximos 30 días
                  </Typography>
                </CardContent>
              </Card>
              
              {/* Certifications */}
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Certificaciones
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Válidas</Typography>
                    <Chip label={stats.validCertifications} color="success" size="small" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Vencidas</Typography>
                    <Chip label={stats.expiredCertifications} color="error" size="small" />
                  </Box>
                </CardContent>
              </Card>
              
              {/* Courses */}
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Cursos
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Completados</Typography>
                    <Chip label={stats.completedCourses} color="primary" size="small" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Promedio General</Typography>
                    <Chip 
                      label={`${stats.averageCourseScore}%`} 
                      color={stats.averageCourseScore >= 80 ? "success" : "warning"} 
                      size="small" 
                    />
                  </Box>
                </CardContent>
              </Card>
              
              {/* By Company */}
              {stats.byCompany.length > 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Por Empresa
                    </Typography>
                    {stats.byCompany.map(company => (
                      <Box key={company._id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {company.name}
                        </Typography>
                        <Chip label={company.count} size="small" />
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </Box>
      </Drawer>

      {/* Filters Drawer */}
      <Drawer
        anchor="right"
        open={filtersDrawerOpen}
        onClose={() => setFiltersDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '85%', sm: 400 },
            p: 3
          }
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Filtros</Typography>
            <IconButton onClick={() => setFiltersDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Search Bar */}
            <TextField
              fullWidth
              placeholder="Buscar por nombre, cédula, email o empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              label="Buscar"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setSearchTerm('')} edge="end" size="small">
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                  hasLoadedRef.current = false;
                }}
                label="Estado"
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="active">Activo</MenuItem>
                <MenuItem value="inactive">Inactivo</MenuItem>
                <MenuItem value="suspended">Suspendido</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Empresa</InputLabel>
              <Select
                value={companyFilter}
                onChange={(e) => {
                  setCompanyFilter(e.target.value);
                  setPage(0);
                  hasLoadedRef.current = false;
                }}
                label="Empresa"
              >
                <MenuItem value="all">Todas</MenuItem>
                {stats?.byCompany.map(company => (
                  <MenuItem key={company._id} value={company._id}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Estado de Documentos</InputLabel>
              <Select
                value={documentStatusFilter}
                onChange={(e) => setDocumentStatusFilter(e.target.value)}
                label="Estado de Documentos"
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="valid">Vigente</MenuItem>
                <MenuItem value="expiring">Por vencer (30 días)</MenuItem>
                <MenuItem value="expired">Vencido</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Supervisor</InputLabel>
              <Select
                value={supervisorFilter}
                onChange={(e) => setSupervisorFilter(e.target.value)}
                label="Supervisor"
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="none">Sin supervisor</MenuItem>
                {/* Add supervisor options dynamically */}
              </Select>
            </FormControl>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Rango de Fechas
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  type="date"
                  label="Desde"
                  value={dateRangeFilter.start}
                  onChange={(e) => setDateRangeFilter(prev => ({ ...prev, start: e.target.value }))}
                  slotProps={{ inputLabel: { shrink: true } }}
                  fullWidth
                />
                <TextField
                  type="date"
                  label="Hasta"
                  value={dateRangeFilter.end}
                  onChange={(e) => setDateRangeFilter(prev => ({ ...prev, end: e.target.value }))}
                  slotProps={{ inputLabel: { shrink: true } }}
                  fullWidth
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={handleClearFilters}
                startIcon={<ClearIcon />}
              >
                Limpiar
              </Button>
              <Button
                variant="contained"
                fullWidth
                onClick={() => setFiltersDrawerOpen(false)}
              >
                Aplicar
              </Button>
            </Box>
          </Box>
        </Box>
      </Drawer>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea eliminar al contratista "{contractorToDelete && getContractorName(contractorToDelete)}"?
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={createDialogOpen || editDialogOpen} 
        onClose={() => {
          setCreateDialogOpen(false);
          setEditDialogOpen(false);
          setContractorToEdit(null);
          resetForm();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editDialogOpen ? 'Editar Contratista' : 'Crear Nuevo Contratista'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Nombre Completo"
              fullWidth
              value={contractorForm.fullName}
              onChange={(e) => setContractorForm(prev => ({ ...prev, fullName: e.target.value }))}
              required
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Nombre"
                fullWidth
                value={contractorForm.firstName}
                onChange={(e) => setContractorForm(prev => ({ ...prev, firstName: e.target.value }))}
              />
              <TextField
                label="Apellido"
                fullWidth
                value={contractorForm.lastName}
                onChange={(e) => setContractorForm(prev => ({ ...prev, lastName: e.target.value }))}
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Cédula"
                fullWidth
                value={contractorForm.cedula}
                onChange={(e) => setContractorForm(prev => ({ ...prev, cedula: e.target.value }))}
                required
              />
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={contractorForm.status}
                  onChange={(e) => setContractorForm(prev => ({ ...prev, status: e.target.value as any }))}
                  label="Estado"
                >
                  <MenuItem value="active">Activo</MenuItem>
                  <MenuItem value="inactive">Inactivo</MenuItem>
                  <MenuItem value="suspended">Suspendido</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={contractorForm.email}
                onChange={(e) => setContractorForm(prev => ({ ...prev, email: e.target.value }))}
              />
              <TextField
                label="Teléfono"
                fullWidth
                value={contractorForm.phone}
                onChange={(e) => setContractorForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </Box>
            
            <Divider />
            
            <Typography variant="subtitle2">Póliza INS</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Número de Póliza"
                fullWidth
                value={contractorForm.polizaINS.number}
                onChange={(e) => setContractorForm(prev => ({ 
                  ...prev, 
                  polizaINS: { ...prev.polizaINS, number: e.target.value } 
                }))}
              />
              <TextField
                label="Fecha de Vencimiento"
                type="date"
                fullWidth
                value={contractorForm.polizaINS.expiryDate}
                onChange={(e) => setContractorForm(prev => ({ 
                  ...prev, 
                  polizaINS: { ...prev.polizaINS, expiryDate: e.target.value } 
                }))}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>
            
            <Typography variant="subtitle2">Orden Patronal</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Número de Orden"
                fullWidth
                value={contractorForm.ordenPatronal.number}
                onChange={(e) => setContractorForm(prev => ({ 
                  ...prev, 
                  ordenPatronal: { ...prev.ordenPatronal, number: e.target.value } 
                }))}
              />
              <TextField
                label="Fecha de Vencimiento"
                type="date"
                fullWidth
                value={contractorForm.ordenPatronal.expiryDate}
                onChange={(e) => setContractorForm(prev => ({ 
                  ...prev, 
                  ordenPatronal: { ...prev.ordenPatronal, expiryDate: e.target.value } 
                }))}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
            setContractorToEdit(null);
            resetForm();
          }}>
            Cancelar
          </Button>
          <Button 
            onClick={editDialogOpen ? handleUpdateContractor : handleCreateContractor} 
            variant="contained"
          >
            {editDialogOpen ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Dialog */}
      <Dialog 
        open={exportDialogOpen} 
        onClose={() => setExportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DownloadIcon />
            Exportar Contratistas
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Formato</InputLabel>
              <Select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'excel' | 'csv')}
                label="Formato"
              >
                <MenuItem value="excel">Excel (.xlsx)</MenuItem>
                <MenuItem value="csv">CSV (.csv)</MenuItem>
              </Select>
            </FormControl>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              Se exportarán {filteredContractors.length} contratistas con los filtros actuales aplicados.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)} disabled={exportLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            variant="contained"
            disabled={exportLoading}
            startIcon={exportLoading ? <CircularProgress size={20} /> : <DownloadIcon />}
          >
            {exportLoading ? 'Exportando...' : 'Exportar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};