import React, { useState, useEffect } from 'react';
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
  Alert,
  useTheme,
  useMediaQuery,
  TablePagination,
  Drawer,
  Divider,
  Avatar,
  AvatarGroup,
  Tooltip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as HourglassIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as AccessTimeIcon,
  ErrorOutline as ErrorOutlineIcon,
  FilterList as FilterIcon,
  Analytics as StatsIcon,
  Close as CloseIcon,
  ClearAll as ClearIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Warning as RiskIcon,
  GroupAdd as GroupAddIcon,
  Group as GroupIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  AdminPanelSettings as AdminIcon,
  HowToReg as ApproverIcon,
  RemoveRedEye as ReviewerIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { WorkPermit, UserRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import WorkPermitApi, { WorkPermitFilters, WorkPermitStats } from '../../services/workPermitApi';
import { CompanyService } from '../../services/companyService';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { usePageTitle } from '../../hooks/usePageTitle';

export const WorkPermits: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm')); // < 600px
  const isSm = useMediaQuery(theme.breakpoints.down('md')); // < 900px
  const isMd = useMediaQuery(theme.breakpoints.down('lg')); // < 1200px
  const isMobile = isSm; // For backward compatibility
  
  usePageTitle('Permisos de Trabajo', 'Gestión de permisos de trabajo');
  
  const [workPermits, setWorkPermits] = useState<WorkPermit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [permitToDelete, setPermitToDelete] = useState<WorkPermit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  
  // Export state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv'>('excel');
  const [exportLoading, setExportLoading] = useState(false);
  const [exportDepartment, setExportDepartment] = useState('');
  const [exportSearch, setExportSearch] = useState('');
  const [exportStatus, setExportStatus] = useState<string>('all');
  const [exportCompany, setExportCompany] = useState<string>('all');
  const [exportLimit, setExportLimit] = useState<number | ''>('');
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarContent, setSidebarContent] = useState<'filters' | 'stats'>('filters');
  
  // User management state
  const [userManagementOpen, setUserManagementOpen] = useState(false);
  const [selectedPermitForUsers, setSelectedPermitForUsers] = useState<WorkPermit | null>(null);
  const [userSelectionOpen, setUserSelectionOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'approver' | 'reviewer'>('reviewer');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [permitUsers, setPermitUsers] = useState<Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'admin' | 'approver' | 'reviewer';
  }>>([]);
  const [availableUsers] = useState<Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: string;
  }>>([
    { _id: '4', firstName: 'Ana', lastName: 'Martínez', email: 'ana.martinez@example.com', department: 'Seguridad' },
    { _id: '5', firstName: 'Roberto', lastName: 'Sánchez', email: 'roberto.sanchez@example.com', department: 'HSE' },
    { _id: '6', firstName: 'Laura', lastName: 'Rodríguez', email: 'laura.rodriguez@example.com', department: 'Operaciones' },
    { _id: '7', firstName: 'Diego', lastName: 'Fernández', email: 'diego.fernandez@example.com', department: 'Seguridad' },
    { _id: '8', firstName: 'Patricia', lastName: 'García', email: 'patricia.garcia@example.com', department: 'HSE' },
  ]);
  
  // Stats
  const [stats, setStats] = useState<WorkPermitStats>({
    summary: {
      total: 0,
      recent: 0,
      activePermits: 0,
      pendingApprovals: 0,
      expiringSoon: 0,
      avgApprovalTimeHours: 0
    },
    byStatus: {
      borrador: 0,
      pendiente: 0,
      aprobado: 0,
      rechazado: 0,
      expirado: 0,
      cancelado: 0
    },
    byDepartment: [],
    timeline: [],
    topContractors: [],
    topRisks: [],
    alerts: {
      expiringSoon: 0,
      pendingApprovals: 0,
      overduePermits: 0
    }
  });

  useEffect(() => {
    loadWorkPermits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm, statusFilter, companyFilter, rowsPerPage]);

  useEffect(() => {
    loadStats();
    loadCompanies();
  }, []);


  const loadWorkPermits = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: WorkPermitFilters = {
        page: page + 1, // API expects 1-based page numbers
        limit: rowsPerPage,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter as any : undefined,
        companyId: companyFilter !== 'all' ? companyFilter : undefined
      };
      
      const response = await WorkPermitApi.getWorkPermits(filters);
      
      const permits = response.permits || [];
      
      // Filter out any invalid permits
      const validPermits = permits.filter(permit => {
        return permit && permit._id && permit.status;
      });
      
      setWorkPermits(validPermits);
      setTotalCount(response.total || validPermits.length);
    } catch (err) {
      setError('Error al cargar los permisos de trabajo');
      console.error('Error loading work permits:', err);
      // Ensure workPermits is always an array, even on error
      setWorkPermits([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await WorkPermitApi.getWorkPermitStats();
      if (response) {
        setStats(response);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
      // Fallback a stats vacías en caso de error
      setStats({
        summary: {
          total: 0,
          recent: 0,
          activePermits: 0,
          pendingApprovals: 0,
          expiringSoon: 0,
          avgApprovalTimeHours: 0
        },
        byStatus: {
          borrador: 0,
          pendiente: 0,
          aprobado: 0,
          rechazado: 0,
          expirado: 0,
          cancelado: 0
        },
        byDepartment: [],
        timeline: [],
        topContractors: [],
        topRisks: [],
        alerts: {
          expiringSoon: 0,
          pendingApprovals: 0,
          overduePermits: 0
        }
      });
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleStatusFilter = (event: { target: { value: string } }) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleCompanyFilter = (event: { target: { value: string } }) => {
    setCompanyFilter(event.target.value);
    setPage(0);
  };

  const loadCompanies = async () => {
    try {
      const companiesList = await CompanyService.getCompaniesForSelect();
      
      if (!companiesList || !Array.isArray(companiesList)) {
        console.error('Invalid companies response:', companiesList);
        setCompanies([]);
        return;
      }
      
      setCompanies(companiesList);
    } catch (error) {
      console.error('Error loading companies:', error);
      setCompanies([]);
    }
  };

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

  const handleView = (permit: WorkPermit) => {
    navigate(`/work-permits/${permit._id}`);
  };

  const handleEdit = (permit: WorkPermit) => {
    navigate(`/work-permits/${permit._id}/edit`);
  };

  const handleDeleteClick = (permit: WorkPermit) => {
    setPermitToDelete(permit);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (permitToDelete) {
      try {
        await WorkPermitApi.deleteWorkPermit(permitToDelete._id);
        loadWorkPermits();
        loadStats();
        setDeleteDialogOpen(false);
        setPermitToDelete(null);
      } catch (err) {
        console.error('Error deleting permit:', err);
        setError('Error al eliminar el permiso');
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setPermitToDelete(null);
  };

  const handleAddNew = () => {
    navigate('/work-permits/new');
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('es-CR');
  };

  const getStatusChip = (status: string) => {
    const statusConfig: { [key: string]: { label: string; color: 'warning' | 'success' | 'error' | 'default' | 'info' } } = {
      borrador: { label: 'Borrador', color: 'default' },
      pendiente: { label: 'Pendiente', color: 'warning' },
      aprobado: { label: 'Aprobado', color: 'success' },
      rechazado: { label: 'Rechazado', color: 'error' },
      expirado: { label: 'Expirado', color: 'default' },
      cancelado: { label: 'Cancelado', color: 'info' }
    };

    // Ensure status is defined and handle unexpected values
    if (!status) {
      return (
        <Chip
          label="Desconocido"
          color="default"
          size="small"
        />
      );
    }

    const config = statusConfig[status] || { label: status, color: 'default' as const };
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
      />
    );
  };


  const canEdit = (permit: WorkPermit) => {
    // Solo admin, staff y supervisores pueden editar permisos
    if (!hasRole([UserRole.SUPER_ADMIN, UserRole.SAFETY_STAFF, UserRole.CLIENT_SUPERVISOR])) {
      return false;
    }
    
    // Allow editing draft permits
    if (permit.status === 'borrador') return true;
    
    // Allow editing pending permits
    if (permit.status === 'pendiente') {
      return true;
    }
    
    return false;
  };

  const canDelete = (permit: WorkPermit) => {
    // Solo admin, staff y supervisores pueden eliminar permisos
    if (!hasRole([UserRole.SUPER_ADMIN, UserRole.SAFETY_STAFF, UserRole.CLIENT_SUPERVISOR])) {
      return false;
    }
    
    // Can only delete draft and pending permits
    return permit.status === 'borrador' || permit.status === 'pendiente';
  };

  const canApprove = () => {
    // Supervisors and safety staff can approve
    return hasRole([UserRole.CLIENT_SUPERVISOR, UserRole.SAFETY_STAFF]);
  };

  const canCreatePermit = () => {
    // Solo admin, staff y supervisores pueden crear permisos de trabajo
    return hasRole([UserRole.SUPER_ADMIN, UserRole.SAFETY_STAFF, UserRole.CLIENT_SUPERVISOR]);
  };

  const canViewStats = () => {
    // VALIDADORES_OPS (guardias) no necesitan ver estadísticas de gestión
    return !hasRole([UserRole.VALIDADORES_OPS]);
  };

  const canFilterByCompany = () => {
    // Solo super admin y staff pueden filtrar por empresa
    return hasRole([UserRole.SUPER_ADMIN, UserRole.SAFETY_STAFF]);
  };

  const getApprovalSummary = (approvals: any[]) => {
    const approved = approvals.filter(a => a.status === 'aprobado').length;
    const total = approvals.length;
    return `${approved}/${total}`;
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCompanyFilter('all');
    setPage(0);
  };

  const hasActiveFilters = () => {
    return searchTerm || statusFilter !== 'all' || companyFilter !== 'all';
  };

  const openSidebar = (content: 'filters' | 'stats') => {
    setSidebarContent(content);
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleOpenUserManagement = (permit: WorkPermit) => {
    setSelectedPermitForUsers(permit);
    // Mock data for users - in real implementation, fetch from API
    setPermitUsers([
      {
        _id: '1',
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@example.com',
        role: 'approver'
      },
      {
        _id: '2',
        firstName: 'María',
        lastName: 'González',
        email: 'maria.gonzalez@example.com',
        role: 'reviewer'
      }
    ]);
    setUserManagementOpen(true);
  };

  const handleCloseUserManagement = () => {
    setUserManagementOpen(false);
    setSelectedPermitForUsers(null);
  };

  const handleAddUser = (userId: string) => {
    const user = availableUsers.find(u => u._id === userId);
    if (user && !permitUsers.some(pu => pu._id === userId)) {
      setPermitUsers([...permitUsers, { ...user, role: selectedRole }]);
    }
  };

  const handleOpenUserSelection = () => {
    setUserSelectionOpen(true);
    setUserSearchTerm('');
    setSelectedRole('reviewer');
  };

  const handleCloseUserSelection = () => {
    setUserSelectionOpen(false);
    setUserSearchTerm('');
  };

  const getFilteredUsers = () => {
    const existingUserIds = permitUsers.map(u => u._id);
    return availableUsers.filter(user => 
      !existingUserIds.includes(user._id) &&
      (user.firstName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
       user.lastName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
       user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
       (user.department && user.department.toLowerCase().includes(userSearchTerm.toLowerCase())))
    );
  };

  const handleRemoveUser = (userId: string) => {
    // In real implementation, this would call an API
    setPermitUsers(permitUsers.filter(u => u._id !== userId));
  };

  const handleChangeUserRole = (userId: string, newRole: 'admin' | 'approver' | 'reviewer') => {
    // In real implementation, this would call an API
    setPermitUsers(permitUsers.map(u => 
      u._id === userId ? { ...u, role: newRole } : u
    ));
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      
      const filters: WorkPermitFilters & { format?: 'csv' | 'excel' } = {
        search: exportSearch || undefined,
        status: exportStatus !== 'all' ? exportStatus as any : undefined,
        companyId: exportCompany !== 'all' ? exportCompany : undefined,
        department: exportDepartment || undefined,
        startDate: exportStartDate || undefined,
        endDate: exportEndDate || undefined,
        limit: exportLimit ? Number(exportLimit) : undefined,
        format: exportFormat
      };
      
      const blob = await WorkPermitApi.exportWorkPermits(filters);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = `permisos_trabajo_${new Date().toISOString().split('T')[0]}.${exportFormat === 'csv' ? 'csv' : 'xlsx'}`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setExportDialogOpen(false);
      // Reset export filters
      setExportStartDate('');
      setExportEndDate('');
      setExportDepartment('');
      setExportSearch('');
      setExportStatus('all');
      setExportCompany('all');
      setExportLimit('');
    } catch (err) {
      setError('Error al exportar los permisos de trabajo');
    } finally {
      setExportLoading(false);
    }
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
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AssignmentIcon sx={{ mr: 1, fontSize: { xs: 28, sm: 32 }, color: 'primary.main' }} />
            <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ fontWeight: 600 }}>
              Permisos de Trabajo
            </Typography>
          </Box>
          
          {/* Desktop Primary Action */}
          {!isMobile && canCreatePermit() && (
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
              Nuevo Permiso
            </Button>
          )}
        </Box>

        {/* Action Buttons Grid */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: { 
            xs: canCreatePermit() ? '1fr' : '1fr 1fr',
            sm: canViewStats() && canCreatePermit() ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)',
            md: !isMobile ? 'repeat(3, minmax(150px, 200px))' : 'repeat(4, 1fr)'
          },
          gap: { xs: 1, sm: 2 },
          ...(isMobile && { width: '100%' })
        }}>
          {/* Mobile Primary Action */}
          {isMobile && canCreatePermit() && (
            <Button
              variant="contained"
              onClick={handleAddNew}
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: 1.5,
                gridColumn: { xs: '1 / -1', sm: 'auto' },
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                }
              }}
            >
              <AddIcon sx={{ mr: 1 }} />
              <Typography variant="button" sx={{ fontWeight: 600 }}>
                Nuevo Permiso
              </Typography>
            </Button>
          )}

          {/* Secondary Actions */}
          {canViewStats() && (
            <Button
              variant="outlined"
              onClick={() => openSidebar('stats')}
              sx={{ 
                display: 'flex',
                flexDirection: { xs: 'row', sm: 'row' },
                alignItems: 'center',
                justifyContent: 'center',
                py: 1.5,
                px: 2,
                borderColor: 'divider',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'primary.50'
                }
              }}
            >
              <StatsIcon sx={{ 
                mr: 1,
                fontSize: 20,
                color: 'primary.main'
              }} />
              <Typography variant="button" sx={{ fontWeight: 500 }}>
                Estadísticas
              </Typography>
            </Button>
          )}
          
          <Button
            variant="outlined"
            onClick={() => openSidebar('filters')}
            sx={{ 
              display: 'flex',
              flexDirection: { xs: 'row', sm: 'row' },
              alignItems: 'center',
              justifyContent: 'center',
              py: 1.5,
              px: 2,
              position: 'relative',
              borderColor: 'divider',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'primary.50'
              }
            }}
          >
            <FilterIcon sx={{ 
              mr: 1,
              fontSize: 20,
              color: 'primary.main'
            }} />
            <Typography variant="button" sx={{ fontWeight: 500 }}>
              Filtros
            </Typography>
            {hasActiveFilters() && (
              <Box sx={{
                position: 'absolute',
                top: 6,
                right: 6,
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
              flexDirection: { xs: 'row', sm: 'row' },
              alignItems: 'center',
              justifyContent: 'center',
              py: 1.5,
              px: 2,
              borderColor: 'divider',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'primary.50'
              }
            }}
          >
            <DownloadIcon sx={{ 
              mr: 1,
              fontSize: 20,
              color: 'primary.main'
            }} />
            <Typography variant="button" sx={{ fontWeight: 500 }}>
              Exportar
            </Typography>
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {isMobile ? (
        // Mobile Card View
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {workPermits.filter(permit => permit && permit._id).map((permit) => (
            <Card key={permit._id} sx={{ position: 'relative' }}>
              <CardContent sx={{ p: isXs ? 2 : 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Header */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography 
                        variant={isXs ? "body1" : "h6"} 
                        fontWeight="medium" 
                        sx={{ flex: 1, mr: 1 }}
                      >
                        {permit.workDescription.length > (isXs ? 30 : 40) 
                          ? `${permit.workDescription.substring(0, isXs ? 30 : 40)}...` 
                          : permit.workDescription}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: isXs ? 'column' : 'row', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleView(permit)}
                          title="Ver detalles"
                        >
                          <ViewIcon fontSize={isXs ? "small" : "medium"} />
                        </IconButton>
                        {canEdit(permit) && (
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(permit)}
                            title="Editar"
                          >
                            <EditIcon fontSize={isXs ? "small" : "medium"} />
                          </IconButton>
                        )}
                        {canDelete(permit) && (
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(permit)}
                            title="Eliminar"
                            color="error"
                          >
                            <DeleteIcon fontSize={isXs ? "small" : "medium"} />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      #{permit.permitNumber}
                    </Typography>
                  </Box>

                  {/* Status */}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {getStatusChip(permit.status)}
                    {canApprove() && (
                      <Chip
                        label={`${getApprovalSummary(permit.approvals)} aprobado`}
                        size="small"
                        variant="outlined"
                        color="info"
                      />
                    )}
                  </Box>

                  {/* Details Grid */}
                  <Grid container spacing={1} sx={{ fontSize: '0.875rem' }}>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">
                      Ubicación
                    </Typography>
                    <Typography variant="body2">
                      {permit.location}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Fecha Inicio
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(permit.startDate)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Fecha Fin
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(permit.endDate)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">
                      Espacio de trabajo
                    </Typography>
                    <Typography variant="body2">
                      {permit.company?.name || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">
                      Usuarios Asignados
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <AvatarGroup max={4} sx={{ mr: 1 }}>
                        <Tooltip title="Juan Pérez - Aprobador">
                          <Avatar sx={{ width: 24, height: 24 }}>JP</Avatar>
                        </Tooltip>
                        <Tooltip title="María González - Revisor">
                          <Avatar sx={{ width: 24, height: 24 }}>MG</Avatar>
                        </Tooltip>
                      </AvatarGroup>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenUserManagement(permit)}
                      >
                        <GroupAddIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        // Desktop Table View
        <TableContainer component={Paper}>
          <Table size={isXs ? 'small' : 'medium'}>
            <TableHead>
              <TableRow>
                <TableCell>Descripción</TableCell>
                {!isMd && <TableCell>Espacio de trabajo</TableCell>}
                {!isSm && <TableCell>Usuarios</TableCell>}
                {!isMd && <TableCell>Ubicación</TableCell>}
                {!isSm && <TableCell>Fecha Inicio</TableCell>}
                {!isMd && <TableCell>Fecha Fin</TableCell>}
                <TableCell>Estado</TableCell>
                {canApprove() && !isSm && <TableCell>Aprobaciones</TableCell>}
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workPermits.filter(permit => permit && permit._id).map((permit) => (
                <TableRow key={permit._id} hover>
                  <TableCell>
                    <Typography 
                      variant={isXs ? "body2" : "body1"} 
                      fontWeight="medium"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      {permit.workDescription.length > (isXs ? 30 : 50) 
                        ? `${permit.workDescription.substring(0, isXs ? 30 : 50)}...` 
                        : permit.workDescription}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {permit.permitNumber}
                    </Typography>
                    {isXs && (
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Inicio: {formatDate(permit.startDate)}
                        </Typography>
                      </Box>
                    )}
                  </TableCell>
                  {!isMd && (
                    <TableCell>
                      <Typography variant="body2">
                        {permit.company?.name || 'N/A'}
                      </Typography>
                    </TableCell>
                  )}
                  {!isSm && (
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AvatarGroup 
                          max={isXs ? 2 : 3} 
                          sx={{ 
                            mr: 1,
                            '& .MuiAvatar-root': {
                              width: isXs ? 24 : 32,
                              height: isXs ? 24 : 32,
                              fontSize: isXs ? '0.75rem' : '1rem'
                            }
                          }}
                        >
                          <Tooltip title="Juan Pérez - Aprobador">
                            <Avatar>JP</Avatar>
                          </Tooltip>
                          <Tooltip title="María González - Revisor">
                            <Avatar>MG</Avatar>
                          </Tooltip>
                          <Tooltip title="Carlos López - Admin">
                            <Avatar>CL</Avatar>
                          </Tooltip>
                        </AvatarGroup>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenUserManagement(permit)}
                          sx={{ ml: 0.5, padding: isXs ? 0.5 : 1 }}
                        >
                          <GroupAddIcon fontSize={isXs ? "small" : "medium"} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  )}
                  {!isMd && <TableCell>{permit.location}</TableCell>}
                  {!isSm && <TableCell>{formatDate(permit.startDate)}</TableCell>}
                  {!isMd && <TableCell>{formatDate(permit.endDate)}</TableCell>}
                  <TableCell>{getStatusChip(permit.status)}</TableCell>
                  {canApprove() && !isSm && (
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {getApprovalSummary(permit.approvals)} aprobado
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', flexDirection: isXs ? 'column' : 'row', gap: 0.5 }}>
                      <IconButton
                        size={isXs ? "small" : "medium"}
                        onClick={() => handleView(permit)}
                        title="Ver detalles"
                      >
                        <ViewIcon fontSize={isXs ? "small" : "medium"} />
                      </IconButton>
                      {canEdit(permit) && (
                        <IconButton
                          size={isXs ? "small" : "medium"}
                          onClick={() => handleEdit(permit)}
                          title="Editar"
                        >
                          <EditIcon fontSize={isXs ? "small" : "medium"} />
                        </IconButton>
                      )}
                      {canDelete(permit) && (
                        <IconButton
                          size={isXs ? "small" : "medium"}
                          onClick={() => handleDeleteClick(permit)}
                          title="Eliminar"
                          color="error"
                        >
                          <DeleteIcon fontSize={isXs ? "small" : "medium"} />
                        </IconButton>
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

      {workPermits.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="textSecondary">
            {searchTerm || statusFilter !== 'all' || companyFilter !== 'all'
              ? 'No se encontraron permisos que coincidan con los filtros.' 
              : 'No hay permisos de trabajo registrados.'}
          </Typography>
        </Box>
      )}

      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar este permiso de trabajo?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

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
                      startIcon={<ClearIcon />}
                      onClick={clearAllFilters}
                    >
                      Limpiar Todo
                    </Button>
                  )}
                </Box>
                <Divider sx={{ mb: 2 }} />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Search Filter */}
                <TextField
                  fullWidth
                  label="Búsqueda"
                  placeholder="Buscar por descripción o contratista..."
                  value={searchTerm}
                  onChange={handleSearch}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      )
                    }
                  }}
                />

                {/* Status Filter */}
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={handleStatusFilter}
                    label="Estado"
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="borrador">Borradores</MenuItem>
                    <MenuItem value="pendiente">Pendientes</MenuItem>
                    <MenuItem value="aprobado">Aprobados</MenuItem>
                    <MenuItem value="rechazado">Rechazados</MenuItem>
                    <MenuItem value="expirado">Expirados</MenuItem>
                    <MenuItem value="cancelado">Cancelados</MenuItem>
                  </Select>
                </FormControl>

                {/* Company Filter */}
                {canFilterByCompany() && (
                  <FormControl fullWidth>
                    <InputLabel>Espacios de Trabajo</InputLabel>
                    <Select
                      value={companyFilter}
                      onChange={handleCompanyFilter}
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
                    {totalCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    permisos encontrados
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
                      <AssignmentIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
                      <Box>
                        <Typography variant="h5">{stats.summary.total}</Typography>
                        <Typography variant="body2" color="text.secondary">Total Permisos</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                      <TrendingUpIcon sx={{ fontSize: 32, color: 'success.main', mr: 2 }} />
                      <Box>
                        <Typography variant="h5">{stats.summary.activePermits}</Typography>
                        <Typography variant="body2" color="text.secondary">Activos</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                      <ScheduleIcon sx={{ fontSize: 32, color: 'warning.main', mr: 2 }} />
                      <Box>
                        <Typography variant="h5">{stats.summary.pendingApprovals}</Typography>
                        <Typography variant="body2" color="text.secondary">Pendientes Aprobación</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                      <ErrorOutlineIcon sx={{ fontSize: 32, color: 'error.main', mr: 2 }} />
                      <Box>
                        <Typography variant="h5">{stats.alerts.expiringSoon}</Typography>
                        <Typography variant="body2" color="text.secondary">Expiran Pronto</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                      <CheckCircleIcon sx={{ fontSize: 32, color: 'success.main', mr: 2 }} />
                      <Box>
                        <Typography variant="h5">{stats.byStatus.aprobado}</Typography>
                        <Typography variant="body2" color="text.secondary">Aprobados</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                      <CancelIcon sx={{ fontSize: 32, color: 'error.main', mr: 2 }} />
                      <Box>
                        <Typography variant="h5">{stats.byStatus.rechazado}</Typography>
                        <Typography variant="body2" color="text.secondary">Rechazados</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                      <AccessTimeIcon sx={{ fontSize: 32, color: 'text.secondary', mr: 2 }} />
                      <Box>
                        <Typography variant="h5">{stats.byStatus.expirado}</Typography>
                        <Typography variant="body2" color="text.secondary">Expirados</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                      <HourglassIcon sx={{ fontSize: 32, color: 'info.main', mr: 2 }} />
                      <Box>
                        <Typography variant="h6">{Math.abs(stats.summary.avgApprovalTimeHours).toFixed(1)}h</Typography>
                        <Typography variant="body2" color="text.secondary">Tiempo Promedio Aprobación</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Departments Section */}
                {stats.byDepartment && stats.byDepartment.length > 0 && (
                  <>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="h6" sx={{ mt: 3, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon />
                        Por Departamento
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Card variant="outlined">
                        <CardContent>
                          {stats.byDepartment.slice(0, 5).map((dept) => (
                            <Box key={dept.department} sx={{ mb: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" fontWeight="medium" sx={{ textTransform: 'capitalize' }}>
                                  {dept.department}
                                </Typography>
                                <Typography variant="body2">{dept.total} permisos</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Tasa aprobación: {dept.approvalRate}%
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Tiempo resp: {Math.abs(dept.avgResponseHours).toFixed(1)}h
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                        </CardContent>
                      </Card>
                    </Grid>
                  </>
                )}

                {/* Top Contractors Section */}
                {stats.topContractors && stats.topContractors.length > 0 && (
                  <>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="h6" sx={{ mt: 3, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon />
                        Top Contratistas
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Card variant="outlined">
                        <CardContent>
                          {stats.topContractors.slice(0, 5).map((contractor) => (
                            <Box key={contractor._id} sx={{ mb: 1.5 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" fontWeight="medium">
                                  {contractor.cedula}
                                </Typography>
                                <Typography variant="body2">{contractor.permitCount} permisos</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption" color="text.secondary">
                                  Aprobados: {contractor.approvedCount}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Tasa: {contractor.approvalRate.toFixed(0)}%
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                        </CardContent>
                      </Card>
                    </Grid>
                  </>
                )}

                {/* Top Risks Section */}
                {stats.topRisks && stats.topRisks.length > 0 && (
                  <>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="h6" sx={{ mt: 3, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <RiskIcon />
                        Riesgos Más Frecuentes
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Card variant="outlined">
                        <CardContent>
                          {stats.topRisks.slice(0, 8).map((risk, index) => (
                            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" noWrap sx={{ maxWidth: '250px' }}>
                                {risk.risk}
                              </Typography>
                              <Typography variant="body2" fontWeight="medium" color="primary.main">
                                {risk.frequency}
                              </Typography>
                            </Box>
                          ))}
                        </CardContent>
                      </Card>
                    </Grid>
                  </>
                )}

                {/* Alerts Summary */}
                {stats.alerts && (
                  <>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="h6" sx={{ mt: 3, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ErrorOutlineIcon />
                        Alertas
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Expiran Pronto</Typography>
                            <Typography variant="body2" fontWeight="medium" color="error.main">
                              {stats.alerts.expiringSoon}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Pendientes Aprobación</Typography>
                            <Typography variant="body2" fontWeight="medium" color="warning.main">
                              {stats.alerts.pendingApprovals}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">Permisos Vencidos</Typography>
                            <Typography variant="body2" fontWeight="medium" color="error.main">
                              {stats.alerts.overduePermits}
                            </Typography>
                          </Box>
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

      {/* User Management Dialog */}
      <Dialog
        open={userManagementOpen}
        onClose={handleCloseUserManagement}
        maxWidth="md"
        fullWidth
        fullScreen={isXs}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GroupIcon />
            <Typography variant="h6">
              Gestión de Usuarios - Permiso #{selectedPermitForUsers?.permitNumber}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseUserManagement} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Usuarios asignados a este permiso
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Los usuarios pueden tener diferentes roles: Administradores pueden gestionar el permiso,
              Aprobadores pueden aprobar/rechazar, y Revisores solo pueden ver y comentar.
            </Typography>
          </Box>

          <List>
            {permitUsers.map((user) => (
              <ListItem
                key={user._id}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <ListItemAvatar>
                  <Avatar>{getInitials(user.firstName, user.lastName)}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${user.firstName} ${user.lastName}`}
                  secondary={user.email}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={user.role}
                      onChange={(e) => handleChangeUserRole(user._id, e.target.value as any)}
                    >
                      <MenuItem value="admin">Admin</MenuItem>
                      <MenuItem value="approver">Aprobador</MenuItem>
                      <MenuItem value="reviewer">Revisor</MenuItem>
                    </Select>
                  </FormControl>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemoveUser(user._id)}
                  >
                    <PersonRemoveIcon />
                  </IconButton>
                </Box>
              </ListItem>
            ))}
          </List>

          {permitUsers.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body2" color="text.secondary">
                No hay usuarios asignados a este permiso
              </Typography>
            </Box>
          )}

          <Button
            variant="outlined"
            startIcon={<PersonAddIcon />}
            fullWidth
            sx={{ mt: 2 }}
            onClick={handleOpenUserSelection}
          >
            Agregar Usuario
          </Button>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseUserManagement}>
            Cerrar
          </Button>
          <Button variant="contained" onClick={handleCloseUserManagement}>
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Selection Dialog */}
      <Dialog
        open={userSelectionOpen}
        onClose={handleCloseUserSelection}
        maxWidth="sm"
        fullWidth
        fullScreen={isXs}
      >
        <DialogTitle>
          <Typography variant="h6">
            Seleccionar Usuario
          </Typography>
        </DialogTitle>
        
        <DialogContent dividers>
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Buscar por nombre, email o departamento..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }
              }}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth size="small">
              <InputLabel>Rol del Usuario</InputLabel>
              <Select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                label="Rol del Usuario"
              >
                <MenuItem value="admin">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AdminIcon fontSize="small" />
                    Administrador
                  </Box>
                </MenuItem>
                <MenuItem value="approver">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ApproverIcon fontSize="small" />
                    Aprobador
                  </Box>
                </MenuItem>
                <MenuItem value="reviewer">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ReviewerIcon fontSize="small" />
                    Revisor
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>

          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {getFilteredUsers().map((user) => (
              <ListItemButton
                key={user._id}
                onClick={() => {
                  handleAddUser(user._id);
                  handleCloseUserSelection();
                }}
                sx={{
                  borderRadius: 1,
                  mb: 1
                }}
              >
                <ListItemAvatar>
                  <Avatar>{getInitials(user.firstName, user.lastName)}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${user.firstName} ${user.lastName}`}
                  secondary={
                    <Box>
                      <Typography variant="body2" component="span">
                        {user.email}
                      </Typography>
                      {user.department && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          {user.department}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItemButton>
            ))}
          </List>

          {getFilteredUsers().length === 0 && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body2" color="text.secondary">
                {userSearchTerm 
                  ? 'No se encontraron usuarios que coincidan con la búsqueda'
                  : 'No hay usuarios disponibles para agregar'}
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseUserSelection}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

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
            <Typography>Exportar Permisos de Trabajo</Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert severity="info">
              Configura los filtros para exportar los permisos de trabajo. Todos los campos son opcionales.
            </Alert>
            
            {/* Date Range */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Fecha Inicio"
                type="date"
                value={exportStartDate}
                onChange={(e) => setExportStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Fecha Fin"
                type="date"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Box>
            
            {/* Status and Company */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={exportStatus}
                  onChange={(e) => setExportStatus(e.target.value)}
                  label="Estado"
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="borrador">Borrador</MenuItem>
                  <MenuItem value="pendiente">Pendiente</MenuItem>
                  <MenuItem value="aprobado">Aprobado</MenuItem>
                  <MenuItem value="rechazado">Rechazado</MenuItem>
                  <MenuItem value="expirado">Expirado</MenuItem>
                  <MenuItem value="cancelado">Cancelado</MenuItem>
                </Select>
              </FormControl>
              
              {canFilterByCompany() && (
                <FormControl fullWidth>
                  <InputLabel>Empresa</InputLabel>
                  <Select
                    value={exportCompany}
                    onChange={(e) => setExportCompany(e.target.value)}
                    label="Empresa"
                  >
                    <MenuItem value="all">Todas</MenuItem>
                    {companies.map(company => (
                      <MenuItem key={company.id} value={company.id}>
                        {company.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
            
            {/* Department and Search */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Departamento"
                value={exportDepartment}
                onChange={(e) => setExportDepartment(e.target.value)}
                fullWidth
                placeholder="Ej: Seguridad, HSE, Operaciones"
              />
              <TextField
                label="Búsqueda"
                value={exportSearch}
                onChange={(e) => setExportSearch(e.target.value)}
                fullWidth
                placeholder="Buscar en descripción, ubicación, etc."
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
            startIcon={exportLoading ? <HourglassIcon /> : <DownloadIcon />}
          >
            {exportLoading ? 'Exportando...' : 'Exportar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};