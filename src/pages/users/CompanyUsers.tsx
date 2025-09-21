import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  useTheme,
  useMediaQuery,
  Drawer,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  CheckCircle as ActiveIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  Clear as ClearIcon,
  Close as CloseIcon,
  Key as CodeIcon,
  FilterAlt as FilterAltIcon,
  SupervisorAccount as SupervisorIcon,
  Block as BlockIcon,
  VerifiedUser,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole, User as UserType } from '../../types';
import { userApi } from '../../services/userApi';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { usePageTitle } from '../../hooks/usePageTitle';

export const CompanyUsers: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  
  usePageTitle('Usuarios', 'Gestión de usuarios de empresas supervisadas');
  
  const [users, setUsers] = useState<UserType[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [companies, setCompanies] = useState<{_id: string; name: string; relationship: string; description: string}[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [, setSearchLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [error, setError] = useState<string>('');
  const [loadingProgress, setLoadingProgress] = useState<string>('');
  const [, setTotalNonContractorUsers] = useState(0);
  
  // Dialog and notification states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'success' });
  
  // Drawer state for mobile filters
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [statsDrawerOpen, setStatsDrawerOpen] = useState(false);
  
  // Export state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv'>('excel');
  const [exportLoading, setExportLoading] = useState(false);
  const [exportRole, setExportRole] = useState<string>('all');
  const [exportStatus, setExportStatus] = useState<string>('all');
  const [exportCompany, setExportCompany] = useState<string>('all');
  const [exportSearch, setExportSearch] = useState('');
  const [exportLimit, setExportLimit] = useState<number | ''>('');

  // Load companies first
  const loadCompanies = useCallback(async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://sybe-production.up.railway.app/api';
      const response = await fetch(`${API_BASE_URL}/api/companies/supervised`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener datos de empresas supervisadas');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        const supervisionCompanies = result.data.companies.filter((comp: any) => 
          comp.relationship === 'own_company' || comp.relationship === 'supervised_company'
        );
        setCompanies(supervisionCompanies);
        return supervisionCompanies;
      }
    } catch (err) {
      console.error('Error loading companies:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar empresas');
      return [];
    }
  }, []);

  // Load users with filters
  const loadUsers = useCallback(async (companiesList?: any[]) => {
    try {
      setLoading(true);
      setError('');
      
      // If no companies list provided, load it first
      const companies = companiesList || await loadCompanies();
      if (!companies || companies.length === 0) {
        setUsers([]);
        setFilteredUsers([]);
        return;
      }

      // If a specific company is selected, use only that one
      const targetCompanies = selectedCompany !== 'all' 
        ? companies.filter((c: any) => c._id === selectedCompany)
        : companies;

      const allUsers: UserType[] = [];
      let totalUsers = 0;
      
      for (let i = 0; i < targetCompanies.length; i++) {
        const company = targetCompanies[i];
        setLoadingProgress(`Cargando usuarios de ${company.name} (${i + 1}/${targetCompanies.length})`);
        
        try {
          // Build filters for API
          const filters: any = {
            company: company._id,
            limit: 100,
            page: 1
          };

          // Add search filter
          if (searchTerm.trim()) {
            filters.search = searchTerm.trim();
          }

          // Add role filter
          if (roleFilter !== 'all') {
            filters.role = roleFilter;
          }

          // Add status filter
          if (statusFilter !== 'all') {
            filters.isActive = statusFilter === 'active';
          }

          const usersResponse = await userApi.getAll(filters);
          
          if (usersResponse.success && usersResponse.data) {
            // Filter out contractor roles
            const nonContractorUsers = usersResponse.data.filter(user => 
              user.role !== UserRole.CONTRATISTA_ADMIN &&
              user.role !== UserRole.CONTRATISTA_SUBALTERNOS &&
              user.role !== UserRole.CONTRATISTA_HUERFANO
            );
            
            const usersWithCompany = nonContractorUsers.map(user => ({
              ...user,
              companyInfo: company
            }));
            allUsers.push(...usersWithCompany);
            
            // Track total for pagination info (only count non-contractor users)
            if (usersResponse.pagination) {
              totalUsers += nonContractorUsers.length;
            }
          }
        } catch (err) {
          console.error(`Error loading users for company ${company._id}:`, err);
        }
      }
      
      setUsers(allUsers);
      setFilteredUsers(allUsers);
      setTotalNonContractorUsers(totalUsers);
      setLoadingProgress('');
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
    } finally {
      setLoading(false);
      setLoadingProgress('');
    }
  }, [searchTerm, roleFilter, statusFilter, selectedCompany, loadCompanies])

  // Load companies on mount
  useEffect(() => {
    if (user && user.role === UserRole.CLIENT_SUPERVISOR) {
      loadCompanies().then(companies => {
        if (companies && companies.length > 0) {
          loadUsers(companies);
        }
      });
    }
  }, [user, loadCompanies, loadUsers]);

  // Reload users when filters change
  useEffect(() => {
    if (user && user.role === UserRole.CLIENT_SUPERVISOR && companies.length > 0) {
      const debounceTimer = setTimeout(() => {
        loadUsers();
      }, searchTerm ? 500 : 0); // Debounce search, immediate for other filters

      return () => clearTimeout(debounceTimer);
    }
  }, [searchTerm, roleFilter, statusFilter, selectedCompany, loadUsers, companies.length, user]);


  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    // Scroll to top on rows per page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewUser = (user: UserType) => {
    navigate(`/company-users/${user._id || user.id}`);
  };

  const handleEditUser = (user: UserType) => {
    navigate(`/company-users/${user._id || user.id}/edit`);
  };

  const handleCreateUser = () => {
    navigate('/company-users/new');
  };

  const handleDeleteUser = (user: UserType) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    try {
      setActionLoading(true);
      const response = await userApi.delete(userToDelete._id || userToDelete.id || '');
      
      if (response.success) {
        // Remove user from local state
        setUsers(prev => prev.filter(u => (u._id || u.id) !== (userToDelete._id || userToDelete.id)));
        setFilteredUsers(prev => prev.filter(u => (u._id || u.id) !== (userToDelete._id || userToDelete.id)));
        
        setSnackbar({
          open: true,
          message: `Usuario ${userToDelete.firstName} ${userToDelete.lastName} eliminado exitosamente`,
          severity: 'success'
        });
      } else {
        throw new Error(response.message || 'Error al eliminar el usuario');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Error al eliminar el usuario',
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleToggleUserStatus = async (user: UserType) => {
    try {
      setActionLoading(true);
      const response = await userApi.toggleStatus(user._id || user.id || '');
      
      if (response.success && response.data) {
        // Update user in local state
        const updatedUser = response.data;
        setUsers(prev => prev.map(u => 
          (u._id || u.id) === (user._id || user.id) ? { ...u, isActive: updatedUser.isActive } : u
        ));
        setFilteredUsers(prev => prev.map(u => 
          (u._id || u.id) === (user._id || user.id) ? { ...u, isActive: updatedUser.isActive } : u
        ));
        
        setSnackbar({
          open: true,
          message: `Usuario ${updatedUser.isActive ? 'activado' : 'desactivado'} exitosamente`,
          severity: 'success'
        });
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
    } finally {
      setActionLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSearchLoading(false);
    setRoleFilter('all');
    setStatusFilter('all');
    setSelectedCompany('all');
    setPage(0);
  };

  // Function to reload all data
  const reloadData = async () => {
    if (user && user.role === UserRole.CLIENT_SUPERVISOR) {
      const companies = await loadCompanies();
      if (companies && companies.length > 0) {
        await loadUsers(companies);
      }
    }
  };


  const getRoleLabel = (role: UserRole) => {
    const roleLabels = {
      [UserRole.SUPER_ADMIN]: 'Administrador',
      [UserRole.SAFETY_STAFF]: 'Personal de Safety',
      [UserRole.CLIENT_SUPERVISOR]: 'Supervisores',
      [UserRole.CLIENT_APPROVER]: 'Verificadores',
      [UserRole.CLIENT_STAFF]: 'Internos',
      [UserRole.VALIDADORES_OPS]: 'Verificadores',
      [UserRole.CONTRATISTA_ADMIN]: 'Contratista Admin',
      [UserRole.CONTRATISTA_SUBALTERNOS]: 'Contratista Subalterno',
      [UserRole.CONTRATISTA_HUERFANO]: 'Contratista Particular'
    };
    return roleLabels[role] || role;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Nunca';
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      
      const filters = {
        role: exportRole !== 'all' ? exportRole as UserRole : undefined,
        isActive: exportStatus === 'active' ? true : exportStatus === 'inactive' ? false : undefined,
        search: exportSearch || undefined,
        companyId: exportCompany !== 'all' ? exportCompany : undefined,
        limit: exportLimit ? Number(exportLimit) : undefined,
        format: exportFormat
      };
      
      const blob = await userApi.exportUsers(filters);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = `usuarios_${new Date().toISOString().split('T')[0]}.${exportFormat === 'csv' ? 'csv' : 'xlsx'}`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setExportDialogOpen(false);
      // Reset export filters
      setExportRole('all');
      setExportStatus('all');
      setExportCompany('all');
      setExportSearch('');
      setExportLimit('');
      
      setSnackbar({
        open: true,
        message: 'Exportación completada exitosamente',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error al exportar los usuarios',
        severity: 'error'
      });
    } finally {
      setExportLoading(false);
    }
  };

  // Solo CLIENT_SUPERVISOR puede acceder
  if (user?.role !== UserRole.CLIENT_SUPERVISOR) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tiene permisos para acceder a esta sección.
        </Alert>
      </Box>
    );
  }

  // Filter companies for stats (only own and supervised, excluding contractors)
  const supervisionCompanies = companies.filter(comp => 
    comp.relationship === 'own_company' || comp.relationship === 'supervised_company'
  );
  
  // Calcular usuarios válidos (excluyendo "otros roles")
  const validUsers = filteredUsers.filter(u => 
    u.role === UserRole.CLIENT_SUPERVISOR || 
    u.role === UserRole.CLIENT_APPROVER || 
    u.role === UserRole.CLIENT_STAFF ||
    u.role === UserRole.VALIDADORES_OPS
  );

  const companyStats = {
    total: validUsers.length, // Solo contar usuarios con roles válidos
    active: validUsers.filter(u => u.isActive).length,
    inactive: validUsers.filter(u => !u.isActive).length,
    supervisors: validUsers.filter(u => u.role === UserRole.CLIENT_SUPERVISOR).length,
    approvers: validUsers.filter(u => u.role === UserRole.CLIENT_APPROVER).length,
    staff: validUsers.filter(u => u.role === UserRole.CLIENT_STAFF).length,
    validadores: validUsers.filter(u => u.role === UserRole.VALIDADORES_OPS).length,
    others: filteredUsers.filter(u => 
      u.role !== UserRole.CLIENT_SUPERVISOR && 
      u.role !== UserRole.CLIENT_APPROVER && 
      u.role !== UserRole.CLIENT_STAFF &&
      u.role !== UserRole.VALIDADORES_OPS
    ).length,
    companies: supervisionCompanies.length,
    ownCompany: supervisionCompanies.filter(c => c.relationship === 'own_company').length,
    supervisedCompanies: supervisionCompanies.filter(c => c.relationship === 'supervised_company').length
  };

  // Verificación de estadísticas
  if (process.env.NODE_ENV === 'development') {
    const sumByStatus = companyStats.active + companyStats.inactive;
    const sumByRole = companyStats.supervisors + companyStats.approvers + companyStats.staff + companyStats.validadores + companyStats.others;
    
    if (sumByStatus !== companyStats.total) {
      console.warn('Inconsistencia en estadísticas por estado:', {
        total: companyStats.total,
        active: companyStats.active,
        inactive: companyStats.inactive,
        suma: sumByStatus
      });
    }
    
    if (sumByRole !== companyStats.total) {
      console.warn('Inconsistencia en estadísticas por rol:', {
        total: companyStats.total,
        supervisors: companyStats.supervisors,
        approvers: companyStats.approvers,
        staff: companyStats.staff,
        suma: sumByRole,
        // Mostrar usuarios con otros roles
        otherRoles: filteredUsers.filter(u => 
          u.role !== UserRole.CLIENT_SUPERVISOR && 
          u.role !== UserRole.CLIENT_APPROVER && 
          u.role !== UserRole.CLIENT_STAFF
        ).map(u => ({ email: u.email, role: u.role }))
      });
    }
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
              Gestione los usuarios de todas los espacios de trabajo bajo su supervisión
            </Typography>
          </Box>
          
          {/* Desktop Actions - Primary */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={handleCreateUser}
                sx={{ 
                  px: 3,
                  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                  }
                }}
              >
                Crear Usuario
              </Button>
              <Button
                variant="contained"
                size="large"
                startIcon={<CodeIcon />}
                onClick={() => navigate('/company-users/invitation-codes')}
                sx={{ 
                  px: 3,
                  background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1b5e20 0%, #1b5e20 100%)',
                  }
                }}
              >
                Invitaciones
              </Button>
            </Box>
          )}
        </Box>

        {/* Action Buttons Row */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: { 
            xs: '1fr 1fr',
            sm: 'repeat(4, 1fr)',
            md: !isMobile ? 'repeat(3, minmax(150px, 200px))' : 'repeat(4, 1fr)'
          },
          gap: { xs: 1, sm: 2 },
          ...(isMobile && { width: '100%' })
        }}>
          {/* Mobile Primary Actions */}
          {isMobile && (
            <>
              <Button
                variant="contained"
                onClick={handleCreateUser}
                sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  py: 2,
                  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                  }
                }}
              >
                <AddIcon sx={{ mb: 0.5, fontSize: 24 }} />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  Crear Usuario
                </Typography>
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/company-users/invitation-codes')}
                sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  py: 2,
                  background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1b5e20 0%, #1b5e20 100%)',
                  }
                }}
              >
                <CodeIcon sx={{ mb: 0.5, fontSize: 24 }} />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  Invitaciones
                </Typography>
              </Button>
            </>
          )}

          {/* Secondary Actions - Both Mobile and Desktop */}
          <Button
            variant="outlined"
            onClick={() => setStatsDrawerOpen(true)}
            sx={{ 
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              justifyContent: 'center',
              py: { xs: 2, sm: 1 },
              px: { xs: 1, sm: 2 },
              borderColor: 'divider',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'primary.50'
              }
            }}
          >
            <BusinessIcon sx={{ 
              mb: { xs: 0.5, sm: 0 }, 
              mr: { xs: 0, sm: 1 },
              fontSize: { xs: 24, sm: 20 },
              color: 'primary.main'
            }} />
            <Typography variant={isMobile ? "caption" : "button"} sx={{ fontWeight: { xs: 600, sm: 500 } }}>
              Estadísticas
            </Typography>
          </Button>
          
          <Button
            variant="outlined"
            onClick={() => setFilterDrawerOpen(true)}
            sx={{ 
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              justifyContent: 'center',
              py: { xs: 2, sm: 1 },
              px: { xs: 1, sm: 2 },
              position: 'relative',
              borderColor: 'divider',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'primary.50'
              }
            }}
          >
            <FilterAltIcon sx={{ 
              mb: { xs: 0.5, sm: 0 }, 
              mr: { xs: 0, sm: 1 },
              fontSize: { xs: 24, sm: 20 },
              color: 'primary.main'
            }} />
            <Typography variant={isMobile ? "caption" : "button"} sx={{ fontWeight: { xs: 600, sm: 500 } }}>
              Filtros
            </Typography>
            {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all' || selectedCompany !== 'all') && (
              <Box sx={{
                position: 'absolute',
                top: { xs: 4, sm: 6 },
                right: { xs: 4, sm: 6 },
                width: 10,
                height: 10,
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
            sx={{ 
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              justifyContent: 'center',
              py: { xs: 2, sm: 1 },
              px: { xs: 1, sm: 2 },
              borderColor: 'divider',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'primary.50'
              }
            }}
          >
            <DownloadIcon sx={{ 
              mb: { xs: 0.5, sm: 0 }, 
              mr: { xs: 0, sm: 1 },
              fontSize: { xs: 24, sm: 20 },
              color: 'primary.main'
            }} />
            <Typography variant={isMobile ? "caption" : "button"} sx={{ fontWeight: { xs: 600, sm: 500 } }}>
              Exportar
            </Typography>
          </Button>
        </Box>
      </Box>



      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
          <Button 
            variant="outlined" 
            size="small" 
            onClick={reloadData}
            sx={{ ml: 2 }}
          >
            Reintentar
          </Button>
        </Alert>
      )}

      {/* Tabla de Usuarios - Desktop */}
      {!isMobile ? (
        <Card>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Espacios de Trabajo</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Último Acceso</TableCell>
                  <TableCell>Fecha de Registro</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      {loadingProgress ? (
                        <Box sx={{ py: 4 }}>
                          <CircularProgress sx={{ mb: 2 }} />
                          <Typography variant="body1">
                            {loadingProgress}
                          </Typography>
                        </Box>
                      ) : (
                        <SkeletonLoader variant="table" rows={rowsPerPage} />
                      )}
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Box sx={{ py: 4 }}>
                      <Typography variant="h6" color="textSecondary" gutterBottom>
                        No se encontraron usuarios
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {users.length === 0 
                          ? 'No hay usuarios en las empresas supervisadas'
                          : 'No hay usuarios que coincidan con los filtros seleccionados'
                        }
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((userItem) => (
                    <TableRow key={userItem._id || userItem.id} hover>
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
                            {getInitials(`${userItem.firstName} ${userItem.lastName}`)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="medium">
                              {userItem.firstName} {userItem.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {userItem.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {(userItem as any).companyInfo?.name || userItem.company?.name || 'Sin empresa'}
                          </Typography>
                          <Chip
                            label={(userItem as any).companyInfo?.relationship === 'own_company' ? 'Propia' : 'Supervisada'}
                            size="small"
                            color={(userItem as any).companyInfo?.relationship === 'own_company' ? 'primary' : 'secondary'}
                            variant="outlined"
                            sx={{ fontSize: '0.65rem' }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getRoleLabel(userItem.role)}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={userItem.isActive ? 'Activo' : 'Inactivo'}
                          color={userItem.isActive ? 'success' : 'default'}
                          size="small"
                          icon={userItem.isActive ? <ActiveIcon /> : undefined}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(userItem.lastLogin ? new Date(userItem.lastLogin) : null)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(new Date(userItem.createdAt))}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Ver detalles">
                          <IconButton
                            size="small"
                            onClick={() => handleViewUser(userItem)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar usuario">
                          <IconButton
                            size="small"
                            onClick={() => handleEditUser(userItem)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={userItem.isActive ? 'Desactivar usuario' : 'Activar usuario'}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleUserStatus(userItem)}
                            disabled={actionLoading}
                            color={userItem.isActive ? 'warning' : 'success'}
                          >
                            {userItem.isActive ? <ToggleOffIcon /> : <ToggleOnIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar usuario">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteUser(userItem)}
                            disabled={actionLoading}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
              )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredUsers.length}
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
      ) : (
        // Vista de Cards - Mobile
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {loading ? (
            <SkeletonLoader variant="cards" rows={rowsPerPage} />
          ) : filteredUsers.length === 0 ? (
            <Card>
              <CardContent>
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    No se encontraron usuarios
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {users.length === 0 
                      ? 'No hay usuarios en las empresas supervisadas'
                      : 'No hay usuarios que coincidan con los filtros seleccionados'
                    }
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ) : (
            filteredUsers
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((userItem) => (
                <Card key={userItem._id || userItem.id} sx={{ position: 'relative' }}>
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
                          {getInitials(`${userItem.firstName} ${userItem.lastName}`)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {userItem.firstName} {userItem.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {userItem.email}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                            <Chip
                              label={getRoleLabel(userItem.role)}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                            <Chip
                              label={userItem.isActive ? 'Activo' : 'Inactivo'}
                              color={userItem.isActive ? 'success' : 'default'}
                              size="small"
                              icon={userItem.isActive ? <ActiveIcon /> : undefined}
                            />
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Grid container spacing={1}>
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" color="text.secondary">
                          Espacios de Trabajo
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight="medium">
                            {(userItem as any).companyInfo?.name || userItem.company?.name || 'Sin empresa'}
                          </Typography>
                          <Chip
                            label={(userItem as any).companyInfo?.relationship === 'own_company' ? 'Propia' : 'Supervisada'}
                            size="small"
                            color={(userItem as any).companyInfo?.relationship === 'own_company' ? 'primary' : 'secondary'}
                            variant="outlined"
                            sx={{ fontSize: '0.65rem' }}
                          />
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">
                          Último Acceso
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(userItem.lastLogin ? new Date(userItem.lastLogin) : null)}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">
                          Registrado
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(new Date(userItem.createdAt))}
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleViewUser(userItem)}
                        title="Ver detalles"
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEditUser(userItem)}
                        title="Editar usuario"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleUserStatus(userItem)}
                        disabled={actionLoading}
                        color={userItem.isActive ? 'warning' : 'success'}
                        title={userItem.isActive ? 'Desactivar usuario' : 'Activar usuario'}
                      >
                        {userItem.isActive ? <ToggleOffIcon /> : <ToggleOnIcon />}
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteUser(userItem)}
                        disabled={actionLoading}
                        color="error"
                        title="Eliminar usuario"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              ))
          )}
          
          {/* Mobile Pagination */}
          {filteredUsers.length > 0 && (
            <Paper sx={{ mt: 2 }}>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredUsers.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Por página:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              />
            </Paper>
          )}
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          {userToDelete && (
            <>
              <Typography>
                ¿Está seguro que desea eliminar al usuario "{userToDelete.firstName} {userToDelete.lastName}"?
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Esta acción no se puede deshacer y eliminará todos los datos asociados del usuario.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            disabled={actionLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? 'Eliminando...' : 'Eliminar'}
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
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      {/* Filter Drawer */}
      <Drawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '80vw', sm: 350 },
              p: 0,
            }
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">Filtros</Typography>
          <IconButton onClick={() => setFilterDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Campo de búsqueda */}
            <TextField
              fullWidth
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchTerm('')}
                      edge="end"
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <FormControl fullWidth>
              <InputLabel>Filtrar por Rol</InputLabel>
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                label="Filtrar por Rol"
              >
                <MenuItem value="all">Todos los roles</MenuItem>
                <MenuItem value={UserRole.CLIENT_SUPERVISOR}>Supervisores</MenuItem>
                <MenuItem value={UserRole.CLIENT_APPROVER}>Verificadores</MenuItem>
                <MenuItem value={UserRole.CLIENT_STAFF}>Internos</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Filtrar por Estado</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Filtrar por Estado"
              >
                <MenuItem value="all">Todos los estados</MenuItem>
                <MenuItem value="active">Activos</MenuItem>
                <MenuItem value="inactive">Inactivos</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Filtrar por Espacios de Trabajo</InputLabel>
              <Select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                label="Filtrar por Espacios de Trabajo"
              >
                <MenuItem value="all">Todas las empresas</MenuItem>
                {supervisionCompanies.map((company) => (
                  <MenuItem key={company._id} value={company._id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <Typography variant="body2" noWrap sx={{ mr: 1 }}>
                        {company.name}
                      </Typography>
                      <Chip 
                        label={company.relationship === 'own_company' ? 'Propia' : 'Supervisada'} 
                        size="small" 
                        color={company.relationship === 'own_company' ? 'primary' : 'secondary'}
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Divider />
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<ClearIcon />}
                onClick={() => {
                  handleClearFilters();
                  setFilterDrawerOpen(false);
                }}
              >
                Limpiar Filtros
              </Button>
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {filteredUsers.length} usuarios encontrados
                </Typography>
                {filteredUsers.length !== users.length && (
                  <Typography variant="caption" color="text.secondary">
                    (de {users.length} total)
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Drawer>

      {/* Stats Drawer */}
      <Drawer
        anchor="right"
        open={statsDrawerOpen}
        onClose={() => setStatsDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '85%', sm: 400 },
            p: 2
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
          
          <Grid container spacing={2}>
            <Grid size={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PeopleIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h4">{companyStats.total}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Usuarios
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ActiveIcon color="success" sx={{ mr: 2, fontSize: 40 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h4">{companyStats.active}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Usuarios Activos
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BusinessIcon color="info" sx={{ mr: 2, fontSize: 40 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h4">{companyStats.companies}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Espacios de Trabajos Supervisados
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {companyStats.ownCompany} propia + {companyStats.supervisedCompanies} adicionales
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SupervisorIcon color="secondary" sx={{ mr: 2, fontSize: 40 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h4">{companyStats.supervisors + companyStats.approvers}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Supervisores y Aprobadores
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {companyStats.supervisors} supervisores, {companyStats.approvers} aprobadores
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BusinessIcon color="warning" sx={{ mr: 2, fontSize: 40 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h4">{companyStats.staff}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Personal Interno
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BlockIcon color="error" sx={{ mr: 2, fontSize: 40 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h4">{companyStats.inactive}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Usuarios Inactivos
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Mostrar validadores si existen */}
            {companyStats.validadores > 0 && (
              <Grid size={12}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <VerifiedUser color="info" sx={{ mr: 2, fontSize: 40 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h4">{companyStats.validadores}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Validadores Ops
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
            
          </Grid>
        </Box>
      </Drawer>

      {/* Export Dialog */}
      <Dialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DownloadIcon />
            <Typography>Exportar Usuarios</Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert severity="info">
              Exporta los usuarios de los espacios de trabajo supervisados aplicando filtros opcionales.
            </Alert>
            
            {/* Role and Status */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={exportRole}
                  onChange={(e) => setExportRole(e.target.value)}
                  label="Rol"
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value={UserRole.CLIENT_SUPERVISOR}>Supervisor</MenuItem>
                  <MenuItem value={UserRole.CLIENT_APPROVER}>Verificador</MenuItem>
                  <MenuItem value={UserRole.CLIENT_STAFF}>Personal</MenuItem>
                  <MenuItem value={UserRole.VALIDADORES_OPS}>Validador</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={exportStatus}
                  onChange={(e) => setExportStatus(e.target.value)}
                  label="Estado"
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="active">Activo</MenuItem>
                  <MenuItem value="inactive">Inactivo</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            {/* Company and Search */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Empresa</InputLabel>
                <Select
                  value={exportCompany}
                  onChange={(e) => setExportCompany(e.target.value)}
                  label="Empresa"
                >
                  <MenuItem value="all">Todas</MenuItem>
                  {supervisionCompanies.map(company => (
                    <MenuItem key={company._id} value={company._id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                label="Búsqueda"
                value={exportSearch}
                onChange={(e) => setExportSearch(e.target.value)}
                fullWidth
                placeholder="Buscar por nombre, email, etc."
              />
            </Box>
            
            {/* Format and Limit */}
            <Box sx={{ display: 'flex', gap: 2 }}>
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
              
              <TextField
                label="Límite de registros"
                type="number"
                value={exportLimit}
                onChange={(e) => setExportLimit(e.target.value ? parseInt(e.target.value) : '')}
                fullWidth
                placeholder="Dejar vacío para exportar todos"
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Box>
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
    </Box>
  );
};