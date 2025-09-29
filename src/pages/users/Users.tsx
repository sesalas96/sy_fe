import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
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
  Grid,
  Card,
  CardContent,
  TablePagination,
  CircularProgress,
  Tooltip,
  Snackbar,
  Alert as MuiAlert,
  Switch,
  FormControlLabel,
  Drawer,
  Divider,
  useTheme,
  useMediaQuery,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AdminPanelSettings as AdminIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  FilterAlt as FilterIcon,
  Analytics as StatsIcon,
  Close as CloseIcon,
  ClearAll as ClearAllIcon,
  CheckCircle as SuccessIcon,
  ErrorOutline as ErrorIcon,
  SupervisorAccount as SupervisorIcon,
  VerifiedUser as VerifiedIcon,
  Assessment as AssessmentIcon,
  Star as StarIcon,
  Badge as BadgeIcon,
  WorkspacePremium as CertificationIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { User, UserRole } from '../../types';
import { userApi, UserFilters, UserGeneralStats } from '../../services/userApi';
import { companyApi } from '../../services/companyApi';
import { useAuth } from '../../contexts/AuthContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';

// Custom hook para inputs con debouncing
const useDebouncedValue = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const Users: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  usePageTitle('Usuarios', 'Gestión de usuarios del sistema');
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [totalCount, setTotalCount] = useState(0);
  
  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState(''); // Estado local para el input
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [companies, setCompanies] = useState<{_id: string; name: string}[]>([]);
  
  // Dialog states
  // const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  // const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [supervisedCompaniesDialogOpen, setSupervisedCompaniesDialogOpen] = useState(false);
  const [selectedUserForSupervision, setSelectedUserForSupervision] = useState<User | null>(null);
  const [availableCompanies, setAvailableCompanies] = useState<{_id: string; name: string}[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  
  // Snackbar states
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'success' });
  
  // Stats
  const [stats, setStats] = useState<UserGeneralStats>({
    summary: { total: 0, active: 0, inactive: 0, activePercentage: 0 },
    byRole: {},
    byStatus: {},
    recent: []
  });

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarContent, setSidebarContent] = useState<'filters' | 'stats'>('filters');

  // Usar debouncing para el término de búsqueda
  const debouncedSearchTerm = useDebouncedValue(searchInput, 500);

  // Contractor verification and evaluation states
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<User | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'unverified' | 'pending' | 'verified' | 'rejected'>('unverified');
  const [rejectionReason, setRejectionReason] = useState('');
  
  const [evaluationDialogOpen, setEvaluationDialogOpen] = useState(false);
  const [evaluationScores, setEvaluationScores] = useState({
    safety: 0,
    quality: 0,
    timeliness: 0,
    communication: 0
  });
  
  const [certificationsDialogOpen, setCertificationsDialogOpen] = useState(false);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [newCertification, setNewCertification] = useState({
    type: '',
    name: '',
    issuedBy: '',
    issueDate: '',
    expiryDate: '',
    certificateNumber: '',
    documentUrl: ''
  });

  useEffect(() => {
    loadUsers(page, rowsPerPage);
    loadStats();
    loadCompanies();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Efecto para actualizar searchTerm cuando cambia debouncedSearchTerm
  useEffect(() => {
    setSearchTerm(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  // Efecto para aplicar filtros cuando cambia searchTerm
  useEffect(() => {
    if (searchTerm !== undefined) {
      setSearchLoading(true);
      applyFilters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, roleFilter, statusFilter, companyFilter, page, rowsPerPage]);

  const loadUsers = async (pageNum = 0, pageSize = 10) => {
    try {
      setLoading(true);
      const filters: UserFilters = {
        page: pageNum + 1,
        limit: pageSize
      };
      
      const response = await userApi.getAll(filters);
      if (response.success) {
        const usersData = response.data || [];
        setUsers(usersData);
        
        if (response.pagination) {
          setTotalCount(response.pagination.total || 0);
        } else {
          setTotalCount(usersData.length || 0);
        }
      }
    } catch (err) {
      setError('Error al cargar los usuarios');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await userApi.getGeneralStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
      // Fallback a stats vacías en caso de error
      setStats({
        summary: { total: 0, active: 0, inactive: 0, activePercentage: 0 },
        byRole: {},
        byStatus: {},
        recent: []
      });
    }
  };

  const loadCompanies = async () => {
    try {
      const response = await companyApi.getAll({ limit: 100 });
      if (response.success && response.data) {
        setCompanies(response.data);
      }
    } catch (err) {
      console.error('Error loading companies:', err);
    }
  };

  const applyFilters = async () => {
    try {
      const filters: UserFilters = {
        page: page + 1,
        limit: rowsPerPage
      };
      
      if (searchTerm) {
        filters.search = searchTerm;
      }
      
      if (roleFilter !== 'all') {
        filters.role = roleFilter as UserRole;
      }
      
      if (statusFilter !== 'all') {
        filters.isActive = statusFilter === 'active';
      }
      
      if (companyFilter !== 'all') {
        filters.companyId = companyFilter;
      }

      const response = await userApi.getAll(filters);
      if (response.success) {
        const usersData = response.data || [];
        setUsers(usersData);
        
        if (response.pagination) {
          setTotalCount(response.pagination.total || 0);
        } else {
          setTotalCount(usersData.length || 0);
        }
      }
    } catch (err) {
      console.error('Error applying filters:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Optimized handlers con useCallback
  const handleSearchInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  }, []);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
    
    // Scroll up to show the new page content
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    
    // Scroll up to show the new page content
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // const handleClearSearch = useCallback(() => {
  //   setSearchInput('');
  //   setSearchTerm('');
  //   setPage(0);
  // }, []);

  const handleClearAllFilters = useCallback(() => {
    setRoleFilter('all');
    setStatusFilter('all');
    setCompanyFilter('all');
    setPage(0);
  }, []);

  const handleEdit = (user: User) => {
    navigate(`/users/${user._id || user.id}/edit`);
  };

  const handleView = (user: User) => {
    navigate(`/users/${user._id || user.id}`);
  };

  const handleViewVerifications = (user: User) => {
    // Navigate to user details with a state indicating to open the verifications tab
    navigate(`/users/${user._id || user.id}`, { 
      state: { openVerificationsTab: true } 
    });
  };

  const handleViewEvaluations = (user: User) => {
    // Navigate to user details with a state indicating to open the evaluations tab
    navigate(`/users/${user._id || user.id}`, { 
      state: { openEvaluationsTab: true } 
    });
  };

  // const handleDeleteClick = (user: User) => {
  //   setUserToDelete(user);
  //   setDeleteDialogOpen(true);
  // };

  // const handleDeleteConfirm = async () => {
  //   if (userToDelete) {
  //     try {
  //       await userApi.delete(userToDelete._id || userToDelete.id || '');
  //       await loadUsers(page, rowsPerPage);
  //       await loadStats();
  //       setDeleteDialogOpen(false);
  //       setUserToDelete(null);
  //     } catch (err) {
  //       console.error('Error deleting user:', err);
  //       setError('Error al eliminar el usuario');
  //     }
  //   }
  // };

  // const handleDeleteCancel = () => {
  //   setDeleteDialogOpen(false);
  //   setUserToDelete(null);
  // };

  const handleAddNew = () => {
    navigate('/users/new');
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const response = await userApi.toggleStatus(user._id || user.id || '');
      if (response.success && response.data) {
        // Update the user in the local state
        setUsers(prevUsers => 
          prevUsers.map(u => 
            (u._id || u.id) === (user._id || user.id) 
              ? { ...u, isActive: !u.isActive }
              : u
          )
        );
        
        // Show success notification
        setSnackbar({
          open: true,
          message: `Usuario ${response.data.isActive ? 'activado' : 'desactivado'} exitosamente`,
          severity: 'success'
        });
        
        // Reload stats to update counts
        await loadStats();
      } else {
        throw new Error(response.message || 'Error al cambiar estado del usuario');
      }
    } catch (err) {
      console.error('Error toggling user status:', err);
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Error al cambiar estado del usuario',
        severity: 'error'
      });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleManageSupervisedCompanies = async (user: User) => {
    setSelectedUserForSupervision(user);
    setSelectedCompanies(user.supervisedCompanies?.map(comp => comp._id) || []);
    
    try {
      setLoadingCompanies(true);
      const response = await companyApi.getSelect();
      if (response.success && response.data) {
        setAvailableCompanies(response.data);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      setSnackbar({
        open: true,
        message: 'Error al cargar las empresas disponibles',
        severity: 'error'
      });
    } finally {
      setLoadingCompanies(false);
      setSupervisedCompaniesDialogOpen(true);
    }
  };

  const handleSupervisedCompaniesClose = () => {
    setSupervisedCompaniesDialogOpen(false);
    setSelectedUserForSupervision(null);
    setSelectedCompanies([]);
    setAvailableCompanies([]);
  };

  const handleSupervisedCompaniesSave = async () => {
    if (!selectedUserForSupervision) return;

    try {
      const response = await userApi.updateSupervisedCompanies(
        selectedUserForSupervision._id || selectedUserForSupervision.id || '',
        selectedCompanies
      );

      if (response.success) {
        // Update the user in the local state
        setUsers(prevUsers => 
          prevUsers.map(u => 
            (u._id || u.id) === (selectedUserForSupervision._id || selectedUserForSupervision.id)
              ? { 
                  ...u, 
                  supervisedCompanies: availableCompanies.filter(comp => 
                    selectedCompanies.includes(comp._id)
                  )
                }
              : u
          )
        );
        
        setSnackbar({
          open: true,
          message: 'Espacios de Trabajos supervisadas actualizadas exitosamente',
          severity: 'success'
        });
        
        handleSupervisedCompaniesClose();
      } else {
        throw new Error(response.message || 'Error al actualizar empresas supervisadas');
      }
    } catch (error) {
      console.error('Error updating supervised companies:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Error al actualizar empresas supervisadas',
        severity: 'error'
      });
    }
  };

  const handleCompanyToggle = (companyId: string) => {
    setSelectedCompanies(prev => 
      prev.includes(companyId)
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };


  // const formatDate = (date: Date | string) => {
  //   return new Date(date).toLocaleDateString('es-CR');
  // };

  const getStatusChip = (user: User) => {
    const isActive = user.isActive || user.active || false;
    return (
      <Chip
        label={isActive ? 'Activo' : 'Inactivo'}
        color={isActive ? 'success' : 'default'}
        size="small"
        icon={isActive ? <CheckCircleIcon /> : <CancelIcon />}
      />
    );
  };

  // const getRoleIcon = (role: UserRole) => {
  //   switch (role) {
  //     case UserRole.SUPER_ADMIN:
  //       return <AdminIcon />;
  //     case UserRole.SAFETY_STAFF:
  //       return <SecurityIcon />;
  //     case UserRole.CLIENT_SUPERVISOR:
  //     case UserRole.CLIENT_APPROVER:
  //       return <BusinessIcon />;
  //     default:
  //       return <EngineeringIcon />;
  //   }
  // };

  const getRoleLabel = (role: UserRole) => {
    const roleLabels: Record<UserRole, string> = {
      [UserRole.SUPER_ADMIN]: 'Administrador',
      [UserRole.SAFETY_STAFF]: 'Personal de Safety',
      [UserRole.CLIENT_SUPERVISOR]: 'Supervisores',
      [UserRole.CLIENT_APPROVER]: 'Verificadores',
      [UserRole.CLIENT_STAFF]: 'Interno',
      [UserRole.VALIDADORES_OPS]: 'Validador Operaciones',
      [UserRole.CONTRATISTA_ADMIN]: 'Contratista Admin',
      [UserRole.CONTRATISTA_SUBALTERNOS]: 'Contratista Subalterno',
      [UserRole.CONTRATISTA_HUERFANO]: 'Contratista Particular'
    };
    return roleLabels[role] || role;
  };

  const canManageUsers = () => {
    return hasRole([UserRole.SUPER_ADMIN, UserRole.SAFETY_STAFF]);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const isContractor = (role: UserRole) => {
    return [
      UserRole.CONTRATISTA_ADMIN,
      UserRole.CONTRATISTA_SUBALTERNOS,
      UserRole.CONTRATISTA_HUERFANO
    ].includes(role);
  };

  const getVerificationStatus = (user: User) => {
    // Use real data from verificationSummary
    if (user.verificationSummary) {
      const { globalCompliance } = user.verificationSummary;
      
      if (globalCompliance === 'compliant') {
        return { status: 'verified', label: 'Cumple', color: 'success' as const };
      } else if (globalCompliance === 'partial') {
        return { status: 'pending', label: 'Parcial', color: 'warning' as const };
      } else if (globalCompliance === 'non_compliant') {
        return { status: 'rejected', label: 'No cumple', color: 'error' as const };
      }
    }
    return { status: 'unverified', label: 'Sin verificar', color: 'default' as const };
  };

  const getEvaluationScore = (user: User) => {
    // Use real data from reviewSummary
    if (user.reviewSummary && user.reviewSummary.receivedReviews.averageRating > 0) {
      return user.reviewSummary.receivedReviews.averageRating;
    }
    return null;
  };

  const handleVerifyContractor = useCallback((user: User) => {
    setSelectedContractor(user);
    // Obtener estado actual de verificación del usuario (mock por ahora)
    const currentStatus = getVerificationStatus(user);
    setVerificationStatus(currentStatus.status as any);
    setVerificationDialogOpen(true);
  }, []);

  const handleEvaluateContractor = useCallback((user: User) => {
    setSelectedContractor(user);
    // Resetear puntuaciones para nueva evaluación
    setEvaluationScores({
      safety: 0,
      quality: 0,
      timeliness: 0,
      communication: 0
    });
    setEvaluationDialogOpen(true);
  }, []);

  // Handlers optimizados para los diálogos
  const handleVerificationStatusChange = useCallback((e: any) => {
    setVerificationStatus(e.target.value);
  }, []);

  const handleRejectionReasonChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRejectionReason(e.target.value);
  }, []);

  const handleEvaluationScoreChange = useCallback((category: keyof typeof evaluationScores) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
    setEvaluationScores(prev => ({ ...prev, [category]: value }));
  }, []);

  const handleCertificationFieldChange = useCallback((field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    const value = e.target.value;
    setNewCertification(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSaveVerification = async () => {
    if (!selectedContractor) return;
    
    try {
      // TODO: Llamar API de verificación
      // await userApi.updateVerification(selectedContractor.id, { 
      //   status: verificationStatus,
      //   rejectionReason: rejectionReason 
      // });
      
      setSnackbar({
        open: true,
        message: `Estado de verificación actualizado para ${selectedContractor.firstName} ${selectedContractor.lastName}`,
        severity: 'success'
      });
      
      setVerificationDialogOpen(false);
      // Recargar usuarios para mostrar el nuevo estado
      await loadUsers(page, rowsPerPage);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al actualizar estado de verificación',
        severity: 'error'
      });
    }
  };

  const handleSaveEvaluation = async () => {
    if (!selectedContractor) return;
    
    try {
      // TODO: Llamar API de evaluación
      // await userApi.evaluateContractor(selectedContractor.id, evaluationScores);
      
      const averageScore = Math.round(
        (evaluationScores.safety + evaluationScores.quality + 
         evaluationScores.timeliness + evaluationScores.communication) / 4
      );
      
      setSnackbar({
        open: true,
        message: `Evaluación guardada para ${selectedContractor.firstName} ${selectedContractor.lastName}. Puntuación promedio: ${averageScore}%`,
        severity: 'success'
      });
      
      setEvaluationDialogOpen(false);
      // Recargar usuarios para mostrar la nueva puntuación
      await loadUsers(page, rowsPerPage);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al guardar evaluación',
        severity: 'error'
      });
    }
  };

  const handleAddCertification = async () => {
    if (!selectedContractor || !newCertification.type) return;
    
    try {
      // TODO: Llamar API de certificaciones
      // await userApi.addCertification(selectedContractor.id, newCertification);
      
      setCertifications([...certifications, { ...newCertification, id: Date.now() }]);
      
      setSnackbar({
        open: true,
        message: 'Certificación agregada exitosamente',
        severity: 'success'
      });
      
      // Limpiar formulario
      setNewCertification({
        type: '',
        name: '',
        issuedBy: '',
        issueDate: '',
        expiryDate: '',
        certificateNumber: '',
        documentUrl: ''
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al agregar certificación',
        severity: 'error'
      });
    }
  };

  const hasActiveFilters = () => {
    return roleFilter !== 'all' || statusFilter !== 'all' || companyFilter !== 'all';
  };

  const openSidebar = (content: 'filters' | 'stats') => {
    setSidebarContent(content);
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  if (loading) {
    return <SkeletonLoader variant={isMobile ? 'cards' : 'table'} rows={rowsPerPage} />;
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ mb: 3 }}>
        {/* Header Title */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          mb: { xs: 2, sm: 3 },
          gap: 1
        }}>
          <Box>
            <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom sx={{ mb: { xs: 0.5, sm: 1 } }}>
              Usuarios
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Administre usuarios y permisos del sistema
            </Typography>
          </Box>
          
          {/* Desktop Actions - Primary */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={handleAddNew}
                sx={{ 
                  px: 3,
                  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                  }
                }}
              >
                Nuevo Usuario
              </Button>
            </Box>
          )}
        </Box>

        {/* Action Buttons Row */}
        <Box sx={{ 
          display: 'flex',
          gap: { xs: 1, sm: 2 },
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* Mobile Primary Action */}
          {isMobile && (
            <Button
              variant="contained"
              onClick={handleAddNew}
              sx={{ 
                minWidth: { xs: 80, sm: 'auto' },
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                }
              }}
            >
              <AddIcon sx={{ mr: { xs: 0, sm: 1 } }} />
              <Typography variant="button" sx={{ display: { xs: 'none', sm: 'block' } }}>
                Nuevo
              </Typography>
            </Button>
          )}

          {/* Secondary Actions - Both Mobile and Desktop */}
          <Button
            variant="outlined"
            onClick={() => openSidebar('stats')}
            sx={{ 
              minWidth: { xs: 'auto', sm: 120 },
              borderColor: 'divider',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'primary.50'
              }
            }}
          >
            <StatsIcon sx={{ 
              mr: { xs: 0, sm: 1 },
              color: 'primary.main'
            }} />
            <Typography variant="button" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Estadísticas
            </Typography>
          </Button>
          
          <Button
            variant="outlined"
            onClick={() => openSidebar('filters')}
            sx={{ 
              minWidth: { xs: 'auto', sm: 100 },
              position: 'relative',
              borderColor: 'divider',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'primary.50'
              }
            }}
          >
            <FilterIcon sx={{ 
              mr: { xs: 0, sm: 1 },
              color: 'primary.main'
            }} />
            <Typography variant="button" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Filtros
            </Typography>
            {hasActiveFilters() && (
              <Box sx={{
                position: 'absolute',
                top: -6,
                right: -6,
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: 'error.main',
                border: '2px solid',
                borderColor: 'background.paper'
              }} />
            )}
          </Button>
        </Box>
        
        {/* Search Bar - Fuera del sidebar */}
        <Box sx={{ 
          mt: { xs: 2, sm: 3 },
          mb: { xs: 2, sm: 3 }
        }}>
          <TextField
            fullWidth
            placeholder="Buscar por nombre, apellido o email..."
            value={searchInput}
            onChange={handleSearchInputChange}
            size={isMobile ? "small" : "medium"}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <>
                    {searchInput && (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSearchInput('');
                            setSearchTerm('');
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    )}
                    {searchLoading && (
                      <InputAdornment position="end">
                        <CircularProgress size={20} />
                      </InputAdornment>
                    )}
                  </>
                )
              }
            }}
            sx={{
              maxWidth: { xs: '100%', sm: 600 },
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.paper',
                '&:hover': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  }
                }
              }
            }}
          />
        </Box>
      </Box>



      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

{isMobile ? (
        // Mobile Card View
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {users.map((user) => (
            <Card key={user._id || user.id} sx={{ position: 'relative' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <Avatar
                      sx={{ 
                        width: 48, 
                        height: 48, 
                        mr: 2, 
                        bgcolor: 'primary.main',
                        fontSize: '1rem'
                      }}
                    >
                      {getInitials(user.firstName, user.lastName)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight="medium" sx={{ mb: 0.5 }}>
                        {user.firstName} {user.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {user.email}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={getRoleLabel(user.role)}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                        {getStatusChip(user)}
                      </Box>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, flexDirection: 'column' }}>
                    <Tooltip title="Ver detalles">
                      <IconButton
                        size="small"
                        onClick={() => handleView(user)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    {canManageUsers() && (
                      <>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(user)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        {user.role === UserRole.CLIENT_SUPERVISOR && (
                          <Tooltip title="Gestionar empresas supervisadas">
                            <IconButton
                              size="small"
                              onClick={() => handleManageSupervisedCompanies(user)}
                              color="info"
                            >
                              <SupervisorIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </>
                    )}
                  </Box>
                </Box>
                
                <Grid container spacing={1} sx={{ fontSize: '0.875rem' }}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Espacios de Trabajo
                    </Typography>
                    <Typography variant="body2">
                      {user.company?.name || 'Sin empresa'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Estado
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {canManageUsers() && (
                        <Tooltip title={user.isActive ? 'Desactivar usuario' : 'Activar usuario'}>
                          <Switch
                            checked={user.isActive || false}
                            onChange={() => handleToggleStatus(user)}
                            size="small"
                            color={user.isActive ? 'success' : 'default'}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  </Grid>
                  {/* Verificación y Evaluación */}
                  {(user.verificationSummary || user.reviewSummary) && (
                    <>
                      {user.verificationSummary && (
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">
                            Verificación
                          </Typography>
                          <Box sx={{ mt: 0.5 }}>
                            {(() => {
                              const verification = getVerificationStatus(user);
                              const summary = user.verificationSummary;
                              const tooltipContent = summary ? 
                                `${summary.compliantCompanies}/${summary.totalCompanies} empresas` : 
                                'Sin información';
                              
                              return (
                                <Tooltip title={tooltipContent}>
                                  <Chip
                                    icon={<VerifiedIcon />}
                                    label={verification.label}
                                    size="small"
                                    color={verification.color}
                                    variant={verification.status === 'verified' ? 'filled' : 'outlined'}
                                  />
                                </Tooltip>
                              );
                            })()}
                          </Box>
                        </Grid>
                      )}
                      {user.reviewSummary && (
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">
                            Evaluación
                          </Typography>
                          <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center' }}>
                            {(() => {
                              const score = getEvaluationScore(user);
                              const summary = user.reviewSummary;
                              const totalReviews = summary?.receivedReviews.total || 0;
                              
                              return (
                                <>
                                  <StarIcon sx={{ 
                                    color: score ? 
                                      (score >= 80 ? 'success.main' : score >= 60 ? 'warning.main' : 'error.main') : 
                                      'text.disabled', 
                                    fontSize: 20 
                                  }} />
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      ml: 0.5,
                                      fontWeight: score ? 'medium' : 'normal',
                                      color: score ? 'text.primary' : 'text.disabled'
                                    }}
                                  >
                                    {score ? `${Math.round(score)}%` : 'Sin evaluar'}
                                  </Typography>
                                  {totalReviews > 0 && (
                                    <Typography 
                                      variant="caption" 
                                      sx={{ 
                                        ml: 0.5,
                                        color: 'text.secondary'
                                      }}
                                    >
                                      ({totalReviews})
                                    </Typography>
                                  )}
                                </>
                              );
                            })()}
                          </Box>
                        </Grid>
                      )}
                    </>
                  )}
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        // Desktop Table View
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Usuario</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Espacios de Trabajo</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Verificación</TableCell>
                <TableCell align="center">Evaluación</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id || user.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        sx={{ 
                          width: 40, 
                          height: 40, 
                          mr: 2, 
                          bgcolor: 'primary.main',
                          fontSize: '0.875rem'
                        }}
                      >
                        {getInitials(user.firstName, user.lastName)}
                      </Avatar>
                      <Typography variant="body2" fontWeight="medium">
                        {user.firstName} {user.lastName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={getRoleLabel(user.role)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {user.company?.name || 'Sin empresa'}
                  </TableCell>
                  <TableCell>{getStatusChip(user)}</TableCell>
                  {/* Verificación Column */}
                  <TableCell align="center">
                    {user.verificationSummary ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        {(() => {
                          const verification = getVerificationStatus(user);
                          const summary = user.verificationSummary;
                          const tooltipContent = summary ? 
                            `Empresas cumplidas: ${summary.compliantCompanies}/${summary.totalCompanies}` : 
                            'Sin información de verificación';
                          
                          return (
                            <Tooltip title={tooltipContent}>
                              <Chip
                                icon={<VerifiedIcon />}
                                label={verification.label}
                                size="small"
                                color={verification.color}
                                variant={verification.status === 'verified' ? 'filled' : 'outlined'}
                              />
                            </Tooltip>
                          );
                        })()}
                        {canManageUsers() && (
                          <Tooltip title="Ver verificaciones detalladas">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleViewVerifications(user)}
                            >
                              <VerifiedIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  {/* Evaluación Column */}
                  <TableCell align="center">
                    {user.reviewSummary ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        {(() => {
                          const score = getEvaluationScore(user);
                          const summary = user.reviewSummary;
                          const totalReviews = summary?.receivedReviews.total || 0;
                          const tooltipContent = summary ? 
                            `${totalReviews} evaluación${totalReviews !== 1 ? 'es' : ''} • ${summary.receivedReviews.wouldHireAgainPercentage}% lo contrataría de nuevo` : 
                            'Sin evaluaciones';
                          
                          return (
                            <Tooltip title={tooltipContent}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <StarIcon sx={{ 
                                  color: score ? 
                                    (score >= 80 ? 'success.main' : score >= 60 ? 'warning.main' : 'error.main') : 
                                    'text.disabled', 
                                  fontSize: 20 
                                }} />
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    ml: 0.5,
                                    fontWeight: score ? 'medium' : 'normal',
                                    color: score ? 'text.primary' : 'text.disabled'
                                  }}
                                >
                                  {score ? `${Math.round(score)}%` : '--'}
                                </Typography>
                                {totalReviews > 0 && (
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      ml: 0.5,
                                      color: 'text.secondary'
                                    }}
                                  >
                                    ({totalReviews})
                                  </Typography>
                                )}
                              </Box>
                            </Tooltip>
                          );
                        })()}
                        {(hasRole([UserRole.SUPER_ADMIN, UserRole.SAFETY_STAFF, UserRole.CLIENT_SUPERVISOR, UserRole.CLIENT_APPROVER])) && (
                          <Tooltip title="Ver evaluaciones">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleViewEvaluations(user)}
                            >
                              <AssessmentIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <Tooltip title="Ver detalles">
                        <IconButton
                          size="small"
                          onClick={() => handleView(user)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      {canManageUsers() && (
                        <>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(user)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={user.isActive ? 'Desactivar usuario' : 'Activar usuario'}>
                            <Switch
                              checked={user.isActive || false}
                              onChange={() => handleToggleStatus(user)}
                              size="small"
                              color={user.isActive ? 'success' : 'default'}
                            />
                          </Tooltip>
                          {user.role === UserRole.CLIENT_SUPERVISOR && (
                            <Tooltip title="Gestionar empresas supervisadas">
                              <IconButton
                                size="small"
                                onClick={() => handleManageSupervisedCompanies(user)}
                                color="info"
                              >
                                <SupervisorIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
          />
        </TableContainer>
      )}

      {/* Mobile Pagination */}
      {isMobile && (
        <Paper sx={{ mt: 2 }}>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </Paper>
      )}

      {users.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="textSecondary">
            {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
              ? 'No se encontraron usuarios que coincidan con los filtros.' 
              : 'No hay usuarios registrados.'}
          </Typography>
        </Box>
      )}


      {/* Supervised Companies Management Dialog */}
      <Dialog 
        open={supervisedCompaniesDialogOpen} 
        onClose={handleSupervisedCompaniesClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SupervisorIcon />
            Gestionar Espacios de Trabajos Supervisados
          </Box>
          <Typography variant="body2" color="textSecondary">
            {selectedUserForSupervision && 
              `${selectedUserForSupervision.firstName} ${selectedUserForSupervision.lastName}`
            }
          </Typography>
        </DialogTitle>
        <DialogContent>
          {loadingCompanies ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Seleccionar empresas para supervisar:
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Marque las empresas que este usuario podrá supervisar además de su empresa principal.
              </Typography>
              
              <Grid container spacing={2}>
                {availableCompanies
                  .filter(company => company._id !== selectedUserForSupervision?.company?._id)
                  .map((company) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={company._id}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={selectedCompanies.includes(company._id)}
                            onChange={() => handleCompanyToggle(company._id)}
                            color="primary"
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {company.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              ID: {company._id}
                            </Typography>
                          </Box>
                        }
                      />
                    </Grid>
                  ))}
              </Grid>
              
              {availableCompanies.filter(company => 
                company._id !== selectedUserForSupervision?.company?._id
              ).length === 0 && (
                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                  No hay empresas adicionales disponibles para supervisar.
                </Typography>
              )}
              
              {selectedCompanies.length > 0 && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight="medium" gutterBottom>
                    Espacios de Trabajos seleccionadas ({selectedCompanies.length}):
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedCompanies.map(companyId => {
                      const company = availableCompanies.find(c => c._id === companyId);
                      return company ? (
                        <Chip
                          key={companyId}
                          label={company.name}
                          size="small"
                          onDelete={() => handleCompanyToggle(companyId)}
                          color="primary"
                          variant="outlined"
                        />
                      ) : null;
                    })}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSupervisedCompaniesClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSupervisedCompaniesSave} 
            variant="contained"
            disabled={loadingCompanies}
            startIcon={<SupervisorIcon />}
          >
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
          iconMapping={{
            success: <SuccessIcon fontSize="inherit" />,
            error: <ErrorIcon fontSize="inherit" />
          }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>

      {/* Sidebar Drawer */}
      <Drawer
        anchor="right"
        open={sidebarOpen}
        onClose={closeSidebar}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '80vw', sm: 400 },
              p: 0,
            }
          }
        }}
      >
        {/* Sidebar Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {sidebarContent === 'filters' ? (
              <>
                <FilterIcon />
                Filtros
              </>
            ) : (
              <>
                <StatsIcon />
                Estadísticas
              </>
            )}
          </Typography>
          <IconButton onClick={closeSidebar} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Sidebar Content */}
        <Box sx={{ p: 2 }}>
          {sidebarContent === 'filters' ? (
            <>
              {/* Filters Content */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2">Filtros Activos</Typography>
                  {hasActiveFilters() && (
                    <Button
                      size="small"
                      startIcon={<ClearAllIcon />}
                      onClick={handleClearAllFilters}
                    >
                      Limpiar Todo
                    </Button>
                  )}
                </Box>
                <Divider sx={{ mb: 2 }} />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Role Filter */}
                <FormControl fullWidth>
                  <InputLabel>Filtrar por Rol</InputLabel>
                  <Select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as any)}
                    label="Filtrar por Rol"
                  >
                    <MenuItem value="all">Todos los roles</MenuItem>
                    {Object.values(UserRole).map((role) => (
                      <MenuItem key={role} value={role}>
                        {getRoleLabel(role)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Status Filter */}
                <FormControl fullWidth>
                  <InputLabel>Filtrar por Estado</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    label="Filtrar por Estado"
                  >
                    <MenuItem value="all">Todos los estados</MenuItem>
                    <MenuItem value="active">Activos</MenuItem>
                    <MenuItem value="inactive">Inactivos</MenuItem>
                  </Select>
                </FormControl>

                {/* Company Filter */}
                {companies.length > 0 && (
                  <FormControl fullWidth>
                    <InputLabel>Filtrar por Espacios de Trabajo</InputLabel>
                    <Select
                      value={companyFilter}
                      onChange={(e) => setCompanyFilter(e.target.value)}
                      label="Filtrar por Espacios de Trabajo"
                    >
                      <MenuItem value="all">Todos los espacios</MenuItem>
                      {companies.map((company) => (
                        <MenuItem key={company._id} value={company._id}>
                          {company.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {/* Results Counter */}
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'primary.50', 
                  borderRadius: 1, 
                  border: '1px solid',
                  borderColor: 'primary.200',
                  textAlign: 'center'
                }}>
                  <Typography variant="h6" color="primary.main">
                    {users.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    usuarios encontrados
                  </Typography>
                </Box>
              </Box>
            </>
          ) : (
            <>
              {/* Stats Content */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                      <PeopleIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
                      <Box>
                        <Typography variant="h5">{stats.summary.total}</Typography>
                        <Typography variant="body2" color="text.secondary">Total Usuarios</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                      <CheckCircleIcon sx={{ fontSize: 32, color: 'success.main', mr: 2 }} />
                      <Box>
                        <Typography variant="h5">{stats.summary.active}</Typography>
                        <Typography variant="body2" color="text.secondary">Usuarios Activos</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                      <CancelIcon sx={{ fontSize: 32, color: 'warning.main', mr: 2 }} />
                      <Box>
                        <Typography variant="h5">{stats.summary.inactive}</Typography>
                        <Typography variant="body2" color="text.secondary">Usuarios Inactivos</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                      <AdminIcon sx={{ fontSize: 32, color: 'info.main', mr: 2 }} />
                      <Box>
                        <Typography variant="h5">{stats.summary.activePercentage}%</Typography>
                        <Typography variant="body2" color="text.secondary">Porcentaje Activos</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Role Distribution */}
                {Object.keys(stats.byRole).length > 0 && (
                  <>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Distribución por Rol</Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Card variant="outlined">
                        <CardContent>
                          {Object.entries(stats.byRole).map(([role, count]) => (
                            <Box key={role} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">
                                {getRoleLabel(role as UserRole)}
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {count}
                              </Typography>
                            </Box>
                          ))}
                        </CardContent>
                      </Card>
                    </Grid>
                  </>
                )}
              </Grid>
            </>
          )}
        </Box>
      </Drawer>

      {/* Verification Dialog */}
      <Dialog
        open={verificationDialogOpen}
        onClose={() => setVerificationDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VerifiedIcon color="primary" />
            Verificación de Contratista
          </Box>
          {selectedContractor && (
            <Typography variant="body2" color="text.secondary">
              {selectedContractor.firstName} {selectedContractor.lastName}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Actualizar el estado de verificación del contratista:
            </Typography>
            
            <FormControl fullWidth sx={{ mt: 3 }}>
              <InputLabel>Estado de Verificación</InputLabel>
              <Select
                value={verificationStatus}
                onChange={handleVerificationStatusChange}
                label="Estado de Verificación"
              >
                <MenuItem value="unverified">Sin verificar</MenuItem>
                <MenuItem value="pending">Pendiente</MenuItem>
                <MenuItem value="verified">Verificado</MenuItem>
                <MenuItem value="rejected">Rechazado</MenuItem>
              </Select>
            </FormControl>

            {verificationStatus === 'rejected' && (
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Motivo de rechazo"
                value={rejectionReason}
                onChange={handleRejectionReasonChange}
                sx={{ mt: 2 }}
                helperText="Explique el motivo del rechazo"
              />
            )}

            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Documentos requeridos para verificación:
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                <Typography component="li" variant="body2">Cédula de identidad</Typography>
                <Typography component="li" variant="body2">Certificado de antecedentes penales</Typography>
                <Typography component="li" variant="body2">Póliza de seguro vigente</Typography>
                <Typography component="li" variant="body2">Certificaciones profesionales</Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerificationDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveVerification}
            variant="contained"
            disabled={verificationStatus === 'rejected' && !rejectionReason}
            startIcon={<VerifiedIcon />}
          >
            Guardar Estado
          </Button>
        </DialogActions>
      </Dialog>

      {/* Evaluation Dialog */}
      <Dialog
        open={evaluationDialogOpen}
        onClose={() => setEvaluationDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssessmentIcon color="primary" />
            Evaluación de Contratista
          </Box>
          {selectedContractor && (
            <Typography variant="body2" color="text.secondary">
              {selectedContractor.firstName} {selectedContractor.lastName} - {selectedContractor.company?.name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Evalúe el desempeño del contratista en las siguientes categorías:
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <SecurityIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">Seguridad</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Cumplimiento de normas de seguridad y uso de EPP
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                      <TextField
                        type="number"
                        value={evaluationScores.safety}
                        onChange={handleEvaluationScoreChange('safety')}
                        slotProps={{
                          input: {
                            endAdornment: <InputAdornment position="end">%</InputAdornment>
                          },
                          htmlInput: { min: 0, max: 100 }
                        }}
                        sx={{ width: 120 }}
                      />
                      <Box sx={{ ml: 2, display: 'flex', gap: 0.5 }}>
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            sx={{
                              color: i < Math.floor(evaluationScores.safety / 20) 
                                ? 'warning.main' 
                                : 'action.disabled',
                              fontSize: 20
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CheckCircleIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">Calidad</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Calidad del trabajo realizado y atención al detalle
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                      <TextField
                        type="number"
                        value={evaluationScores.quality}
                        onChange={handleEvaluationScoreChange('quality')}
                        slotProps={{
                          input: {
                            endAdornment: <InputAdornment position="end">%</InputAdornment>
                          },
                          htmlInput: { min: 0, max: 100 }
                        }}
                        sx={{ width: 120 }}
                      />
                      <Box sx={{ ml: 2, display: 'flex', gap: 0.5 }}>
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            sx={{
                              color: i < Math.floor(evaluationScores.quality / 20) 
                                ? 'warning.main' 
                                : 'action.disabled',
                              fontSize: 20
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <AccessTimeIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">Puntualidad</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Cumplimiento de horarios y plazos establecidos
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                      <TextField
                        type="number"
                        value={evaluationScores.timeliness}
                        onChange={handleEvaluationScoreChange('timeliness')}
                        slotProps={{
                          input: {
                            endAdornment: <InputAdornment position="end">%</InputAdornment>
                          },
                          htmlInput: { min: 0, max: 100 }
                        }}
                        sx={{ width: 120 }}
                      />
                      <Box sx={{ ml: 2, display: 'flex', gap: 0.5 }}>
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            sx={{
                              color: i < Math.floor(evaluationScores.timeliness / 20) 
                                ? 'warning.main' 
                                : 'action.disabled',
                              fontSize: 20
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <SupervisorIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">Comunicación</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Comunicación efectiva y trabajo en equipo
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                      <TextField
                        type="number"
                        value={evaluationScores.communication}
                        onChange={handleEvaluationScoreChange('communication')}
                        slotProps={{
                          input: {
                            endAdornment: <InputAdornment position="end">%</InputAdornment>
                          },
                          htmlInput: { min: 0, max: 100 }
                        }}
                        sx={{ width: 120 }}
                      />
                      <Box sx={{ ml: 2, display: 'flex', gap: 0.5 }}>
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            sx={{
                              color: i < Math.floor(evaluationScores.communication / 20) 
                                ? 'warning.main' 
                                : 'action.disabled',
                              fontSize: 20
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Promedio General */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.50', borderRadius: 1, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Puntuación Promedio
              </Typography>
              <Typography variant="h3" color="primary.main">
                {Math.round(
                  (evaluationScores.safety + evaluationScores.quality + 
                   evaluationScores.timeliness + evaluationScores.communication) / 4
                )}%
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEvaluationDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveEvaluation}
            variant="contained"
            startIcon={<AssessmentIcon />}
          >
            Guardar Evaluación
          </Button>
        </DialogActions>
      </Dialog>

      {/* Certifications Dialog */}
      <Dialog
        open={certificationsDialogOpen}
        onClose={() => setCertificationsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CertificationIcon color="primary" />
            Certificaciones Especiales
          </Box>
          {selectedContractor && (
            <Typography variant="body2" color="text.secondary">
              {selectedContractor.firstName} {selectedContractor.lastName}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Lista de certificaciones existentes */}
            {certifications.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Certificaciones Actuales
                </Typography>
                <Grid container spacing={2}>
                  {certifications.map((cert, index) => (
                    <Grid size={{ xs: 12, md: 6 }} key={index}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <BadgeIcon color="primary" sx={{ mr: 1 }} />
                            <Typography variant="subtitle1" fontWeight="medium">
                              {cert.name}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Emitido por: {cert.issuedBy}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Número: {cert.certificateNumber}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Vigente hasta: {cert.expiryDate}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Formulario para nueva certificación */}
            <Typography variant="h6" gutterBottom>
              Agregar Nueva Certificación
            </Typography>
            
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Certificación</InputLabel>
                  <Select
                    value={newCertification.type}
                    onChange={handleCertificationFieldChange('type')}
                    label="Tipo de Certificación"
                  >
                    <MenuItem value="jefe_mina">Jefe de Mina</MenuItem>
                    <MenuItem value="supervisor_seguridad">Supervisor de Seguridad</MenuItem>
                    <MenuItem value="operador_montacargas">Operador de Montacargas</MenuItem>
                    <MenuItem value="trabajo_altura">Trabajo en Altura</MenuItem>
                    <MenuItem value="espacios_confinados">Espacios Confinados</MenuItem>
                    <MenuItem value="primeros_auxilios">Primeros Auxilios</MenuItem>
                    <MenuItem value="manejo_sustancias_peligrosas">Manejo de Sustancias Peligrosas</MenuItem>
                    <MenuItem value="otro">Otro</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Nombre de la Certificación"
                  value={newCertification.name}
                  onChange={handleCertificationFieldChange('name')}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Emitido por"
                  value={newCertification.issuedBy}
                  onChange={handleCertificationFieldChange('issuedBy')}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Número de Certificado"
                  value={newCertification.certificateNumber}
                  onChange={handleCertificationFieldChange('certificateNumber')}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Fecha de Emisión"
                  type="date"
                  value={newCertification.issueDate}
                  onChange={handleCertificationFieldChange('issueDate')}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Fecha de Vencimiento"
                  type="date"
                  value={newCertification.expiryDate}
                  onChange={handleCertificationFieldChange('expiryDate')}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="URL del Documento (opcional)"
                  value={newCertification.documentUrl}
                  onChange={handleCertificationFieldChange('documentUrl')}
                  helperText="Enlace al documento digitalizado de la certificación"
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddCertification}
                disabled={!newCertification.type || !newCertification.name}
              >
                Agregar Certificación
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCertificationsDialogOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};