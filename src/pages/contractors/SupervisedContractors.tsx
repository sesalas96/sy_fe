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
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
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
  Warning as WarningIcon,
  Add as AddIcon,
  Clear as ClearIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  FilterAlt as FilterAltIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { usePageTitle } from '../../hooks/usePageTitle';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import {
  supervisedContractorApi,
  SupervisedContractor,
  SupervisedContractorStats,
  SupervisedContractorFilters
} from '../../services/supervisedContractorApi';
import { contractorApi } from '../../services/contractorApi';

export const SupervisedContractors: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const hasLoadedRef = useRef(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  usePageTitle(
    'Contratistas',
    'Gestión de contratistas de espacios de trabajo supervisados'
  );

  const [contractors, setContractors] = useState<SupervisedContractor[]>([]);
  const [filteredContractors, setFilteredContractors] = useState<SupervisedContractor[]>([]);
  const [stats, setStats] = useState<SupervisedContractorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [, setLoadingProgress] = useState<string>('');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [, setSearchLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [expiringDocsFilter, setExpiringDocsFilter] = useState(false);

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalContractors, setTotalContractors] = useState(0);

  // Delete dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contractorToDelete, setContractorToDelete] = useState<SupervisedContractor | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'success' });
  
  // Drawer states for mobile
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [statsDrawerOpen, setStatsDrawerOpen] = useState(false);
  
  // Export state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv'>('excel');
  const [exportLoading, setExportLoading] = useState(false);
  const [exportStatus, setExportStatus] = useState<string>('all');
  const [exportCompany, setExportCompany] = useState<string>('all');
  const [exportSearch, setExportSearch] = useState('');
  const [exportLimit, setExportLimit] = useState<number | ''>('');
  const [exportExpiringDocs, setExportExpiringDocs] = useState(false);

  const loadSupervisedContractors = useCallback(async () => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    try {
      setLoading(true);
      setError('');
      setLoadingProgress('Cargando Contratistas...');

      const filters: SupervisedContractorFilters = {
        page: page + 1,
        limit: rowsPerPage,
        ...(statusFilter !== 'all' && { status: statusFilter as 'activo' | 'inactivo' | 'baja' }),
        ...(companyFilter !== 'all' && { companyId: companyFilter }),
        ...(searchTerm && { search: searchTerm }),
        ...(expiringDocsFilter && { expiringDocs: true })
      };

      const response = await supervisedContractorApi.getAll(filters);

      if (response.success && response.data) {
        // Extract contractors from the nested structure
        const contractorsData = response.data.contractors || [];
        setContractors(contractorsData);
        setFilteredContractors(contractorsData);
        
        // Transform summary data to match our stats interface
        if (response.data.summary) {
          const summary = response.data.summary;
          setStats({
            total: summary.totalContractors,
            active: summary.activeContractors,
            inactive: summary.inactiveContractors,
            suspended: 0, // Not in the payload
            expiringDocuments: summary.expiringDocuments,
            companiesCount: summary.companiesSupervised,
            byCompany: summary.contractorsByCompany.map(company => ({
              _id: company.companyId,
              name: company.companyName,
              count: company.totalContractors,
              active: company.activeContractors,
              inactive: company.totalContractors - company.activeContractors
            }))
          });
        }
        
        setTotalContractors(response.data.pagination?.total || contractorsData.length);
        setLoadingProgress('');
      } else {
        throw new Error(response.message || 'Error al cargar contratistas');
      }
    } catch (err) {
      console.error('Error loading supervised contractors:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los contratistas');
    } finally {
      setLoading(false);
      setLoadingProgress('');
    }
  }, [page, rowsPerPage, statusFilter, companyFilter, searchTerm, expiringDocsFilter]);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (user && user.role === UserRole.CLIENT_SUPERVISOR) {
      hasLoadedRef.current = false; // Reset to allow reload with new filters
      loadSupervisedContractors();
    }
  }, [user, loadSupervisedContractors]);

  // Apply client-side filtering for immediate feedback
  useEffect(() => {
    // Ensure contractors is an array before filtering
    if (!Array.isArray(contractors)) {
      setFilteredContractors([]);
      return;
    }

    let filtered = contractors;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(contractor => {
        const name = getContractorName(contractor).toLowerCase();
        const companyName = contractor.company?.name?.toLowerCase() || '';
        return name.includes(search) ||
               contractor.cedula.includes(search) ||
               companyName.includes(search);
      });
    }

    setFilteredContractors(filtered);
  }, [searchTerm, contractors]);

  // Debounce search term
  useEffect(() => {
    if (searchTerm) {
      setSearchLoading(true);
      const debounceTimer = setTimeout(() => {
        setSearchLoading(false);
      }, 300);

      return () => {
        clearTimeout(debounceTimer);
        setSearchLoading(false);
      };
    } else {
      setSearchLoading(false);
    }
  }, [searchTerm]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
    hasLoadedRef.current = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    hasLoadedRef.current = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterChange = () => {
    setPage(0);
    hasLoadedRef.current = false;
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSearchLoading(false);
    setStatusFilter('all');
    setCompanyFilter('all');
    setExpiringDocsFilter(false);
    setPage(0);
    hasLoadedRef.current = false;
  };

  const handleViewContractor = (contractor: SupervisedContractor) => {
    navigate(`/supervised-contractors/${contractor._id}`);
  };

  const handleEditContractor = (contractor: SupervisedContractor) => {
    navigate(`/supervised-contractors/${contractor._id}/edit`);
  };

  const handleDeleteClick = (contractor: SupervisedContractor) => {
    if (contractor.status === 'baja') {
      setSnackbar({
        open: true,
        message: 'No se puede eliminar un contratista que ya está de baja',
        severity: 'warning'
      });
      return;
    }
    setContractorToDelete(contractor);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!contractorToDelete) return;

    try {
      setActionLoading(true);
      const response = await contractorApi.delete(contractorToDelete._id, 'Eliminado por supervisor');

      if (response.success) {
        // Remove contractor from local state
        setContractors(prev => prev.filter(c => c._id !== contractorToDelete._id));
        setFilteredContractors(prev => prev.filter(c => c._id !== contractorToDelete._id));
        setTotalContractors(prev => prev - 1);

        setSnackbar({
          open: true,
          message: `Contratista ${getContractorName(contractorToDelete)} eliminado exitosamente`,
          severity: 'success'
        });
      } else {
        throw new Error(response.message || 'Error al eliminar el contratista');
      }
    } catch (err) {
      console.error('Error deleting contractor:', err);
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Error al eliminar el contratista',
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
      setDeleteDialogOpen(false);
      setContractorToDelete(null);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };


  const getContractorName = (contractor: SupervisedContractor) => {
    if (contractor.fullName) {
      return contractor.fullName;
    }
    if (contractor.firstName && contractor.lastName) {
      return `${contractor.firstName} ${contractor.lastName}`;
    }
    return 'Sin nombre';
  };

  const getInitials = (contractor: SupervisedContractor) => {
    const name = getContractorName(contractor);
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusChip = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    
    if (normalizedStatus === 'active' || normalizedStatus === 'activo') {
      return (
        <Chip
          label="Activo"
          color="success"
          size="small"
          icon={<ActiveIcon />}
        />
      );
    } else if (normalizedStatus === 'inactive' || normalizedStatus === 'inactivo') {
      return (
        <Chip
          label="Inactivo"
          color="default"
          size="small"
        />
      );
    } else if (normalizedStatus === 'suspended' || normalizedStatus === 'suspendido' || normalizedStatus === 'baja') {
      return (
        <Chip
          label={normalizedStatus === 'baja' ? "Baja" : "Suspendido"}
          color="error"
          size="small"
          icon={<WarningIcon />}
        />
      );
    }
    
    return (
      <Chip
        label={status}
        color="default"
        size="small"
      />
    );
  };

  const getRoleLabel = (role: string | undefined) => {
    if (!role) return 'Sin rol';
    
    const roleLabels: Record<string, string> = {
      'contratista_admin': 'Contratista Admin',
      'contratista_subalternos': 'Contratista Subalterno',
      'contratista_huerfano': 'Contratista Particular'
    };
    
    return roleLabels[role.toLowerCase()] || role;
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      
      const filters = {
        status: exportStatus !== 'all' ? exportStatus : undefined,
        companyId: exportCompany !== 'all' ? exportCompany : undefined,
        search: exportSearch || undefined,
        limit: exportLimit ? Number(exportLimit) : undefined,
        format: exportFormat
      };
      
      const blob = await contractorApi.exportContractors(filters);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = `contratistas_${new Date().toISOString().split('T')[0]}.${exportFormat === 'csv' ? 'csv' : 'xlsx'}`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setExportDialogOpen(false);
      // Reset export filters
      setExportStatus('all');
      setExportCompany('all');
      setExportSearch('');
      setExportLimit('');
      setExportExpiringDocs(false);
      
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

  // Only CLIENT_SUPERVISOR can access
  if (user?.role !== UserRole.CLIENT_SUPERVISOR && user?.role !== UserRole.CLIENT_APPROVER) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tiene permisos para acceder a esta sección.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        {/* Title Section */}
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
              Gestione los contratistas de todas los espacios de trabajo bajo su supervisión
            </Typography>
          </Box>
          
          {/* Desktop Primary Action */}
          {!isMobile && (
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => navigate('/supervised-contractors/new')}
              sx={{ 
                px: 3,
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                }
              }}
            >
              Crear Contratista
            </Button>
          )}
        </Box>

        {/* Action Buttons Grid */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: { 
            xs: '1fr',
            sm: 'repeat(3, 1fr)',
            md: !isMobile ? 'repeat(3, minmax(150px, 200px))' : 'repeat(3, 1fr)'
          },
          gap: { xs: 1, sm: 2 },
          ...(isMobile && { width: '100%' })
        }}>
          {/* Mobile Primary Action */}
          {isMobile && (
            <Button
              variant="contained"
              onClick={() => navigate('/supervised-contractors/new')}
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
                Crear Contratista
              </Typography>
            </Button>
          )}

          {/* Secondary Actions */}
          <Button
            variant="outlined"
            onClick={() => setStatsDrawerOpen(true)}
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
            <BusinessIcon sx={{ 
              mr: 1,
              fontSize: 20,
              color: 'primary.main'
            }} />
            <Typography variant="button" sx={{ fontWeight: 500 }}>
              Estadísticas
            </Typography>
          </Button>
          
          <Button
            variant="outlined"
            onClick={() => setFilterDrawerOpen(true)}
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
            <FilterAltIcon sx={{ 
              mr: 1,
              fontSize: 20,
              color: 'primary.main'
            }} />
            <Typography variant="button" sx={{ fontWeight: 500 }}>
              Filtros
            </Typography>
            {(searchTerm || statusFilter !== 'all' || companyFilter !== 'all' || expiringDocsFilter) && (
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



      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
          <Button 
            variant="outlined" 
            size="small" 
            onClick={() => {
              hasLoadedRef.current = false;
              loadSupervisedContractors();
            }}
            sx={{ ml: 2 }}
          >
            Reintentar
          </Button>
        </Alert>
      )}

      {/* Contractors Table/Cards */}
      <Card>
        {loading ? (
          <SkeletonLoader variant={isMobile ? 'cards' : 'table'} rows={rowsPerPage} />
        ) : filteredContractors.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No se encontraron contratistas
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {contractors.length === 0 
                ? 'No hay contratistas en los espacios supervisados'
                : 'No hay contratistas que coincidan con los filtros seleccionados'
              }
            </Typography>
          </Box>
        ) : isMobile ? (
          // Mobile Cards View
          <Box sx={{ p: 2 }}>
            {(Array.isArray(filteredContractors) ? filteredContractors : []).map((contractor) => (
              <Card key={contractor._id} sx={{ mb: 2, boxShadow: 1 }}>
                <CardContent>
                  {/* Header with Avatar and Actions */}
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
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Espacios de Trabajo
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {contractor.company?.name || 'Sin espacios de trabajo'}
                    </Typography>
                    {contractor.company?.industry && (
                      <Typography variant="caption" color="text.secondary">
                        {contractor.company.industry}
                      </Typography>
                    )}
                    {contractor.company?.employeeCount && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {contractor.company.employeeCount} empleados
                      </Typography>
                    )}
                  </Box>
                  
                  {/* Contact Info */}
                  {(contractor.email || contractor.phone) && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Contacto
                      </Typography>
                      {contractor.email && (
                        <Typography variant="body2" sx={{ display: 'block' }}>
                          📧 {contractor.email}
                        </Typography>
                      )}
                      {contractor.phone && (
                        <Typography variant="body2" sx={{ display: 'block' }}>
                          📞 {contractor.phone}
                        </Typography>
                      )}
                    </Box>
                  )}
                  
                  {/* Supervisor Info */}
                  {contractor.supervisor && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Supervisor
                      </Typography>
                      <Typography variant="body2">
                        {contractor.supervisor.firstName} {contractor.supervisor.lastName}
                      </Typography>
                    </Box>
                  )}

                  {/* Info Grid */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ width: '100%', mb: 0.5 }}>
                        Rol & Verificación
                      </Typography>
                      <Chip
                        label={getRoleLabel(contractor.role)}
                        size="small"
                        variant="outlined"
                        color="info"
                      />
                      <Chip
                        label="Pendiente verif."
                        size="small"
                        color="default"
                        variant="outlined"
                      />
                      {contractor.polizaINS?.number && (
                        <Chip
                          label="Póliza INS"
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                      )}
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ width: '100%', mb: 0.5 }}>
                        Certificaciones
                      </Typography>
                      {contractor.certifications && contractor.certifications.length > 0 ? (
                        <>
                          <Chip
                            label={`${contractor.certifications.length} total`}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                          {contractor.certifications.filter(cert => cert.status === 'valid').length > 0 && (
                            <Chip
                              label={`${contractor.certifications.filter(cert => cert.status === 'valid').length} válidas`}
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          )}
                          {contractor.certifications.filter(cert => cert.status === 'expiring_soon' || cert.status === 'expired').length > 0 && (
                            <Chip
                              label={`${contractor.certifications.filter(cert => cert.status === 'expiring_soon' || cert.status === 'expired').length} vencidas`}
                              size="small"
                              color="warning"
                              variant="outlined"
                            />
                          )}
                        </>
                      ) : (
                        <Chip
                          label="Sin certificaciones"
                          size="small"
                          variant="outlined"
                          color="default"
                        />
                      )}
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ width: '100%', mb: 0.5 }}>
                        Cursos
                      </Typography>
                      {contractor.courses && contractor.courses.length > 0 ? (
                        <>
                          <Chip
                            label={`${contractor.courses.length} cursos`}
                            size="small"
                            variant="outlined"
                            color="info"
                          />
                          <Chip
                            label={`Prom: ${Math.round(contractor.courses.reduce((acc, course) => acc + (course.score || 0), 0) / contractor.courses.length)}%`}
                            size="small"
                            variant="outlined"
                            color="info"
                          />
                        </>
                      ) : (
                        <Chip
                          label="Sin cursos"
                          size="small"
                          variant="outlined"
                          color="default"
                        />
                      )}
                    </Box>
                  </Box>
                  
                  {/* Actions */}
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleViewContractor(contractor)}
                    >
                      Ver
                    </Button>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleEditContractor(contractor)}
                    >
                      Editar
                    </Button>
                    {contractor.status !== 'baja' && (
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteClick(contractor)}
                      >
                        Eliminar
                      </Button>
                    )}
                  </Box>
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
                  <TableCell>Contratista</TableCell>
                  <TableCell>Espacios de Trabajo</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Estado & Verificación</TableCell>
                  <TableCell>Certificaciones</TableCell>
                  <TableCell>Cursos</TableCell>
                  <TableCell>Contacto</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(Array.isArray(filteredContractors) ? filteredContractors : []).map((contractor) => (
                  <TableRow key={contractor._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          sx={{ 
                            width: 40, 
                            height: 40, 
                            mr: 2, 
                            bgcolor: contractor.status === 'active' ? 'success.main' : 
                                     contractor.status === 'inactive' ? 'warning.main' : 'error.main',
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
                            Cédula: {contractor.cedula}
                          </Typography>
                          {contractor.supervisor && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              Supervisor: {contractor.supervisor.firstName} {contractor.supervisor.lastName}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {contractor.company?.name || 'Sin espacios de trabajo'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {contractor.company?.industry || ''}
                        </Typography>
                        {contractor.company?.employeeCount && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {contractor.company.employeeCount} empleados
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getRoleLabel(contractor.role)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {getStatusChip(contractor.status)}
                        <Chip
                          label="Pendiente verif."
                          size="small"
                          color="default"
                          variant="outlined"
                        />
                        {contractor.polizaINS?.number && (
                          <Chip
                            label="Póliza INS"
                            size="small"
                            color="info"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {contractor.certifications && contractor.certifications.length > 0 ? (
                          <>
                            <Chip
                              label={`${contractor.certifications.length} certificaciones`}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {contractor.certifications.filter(cert => cert.status === 'valid').length > 0 && (
                                <Chip
                                  label={`${contractor.certifications.filter(cert => cert.status === 'valid').length} válidas`}
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                />
                              )}
                              {contractor.certifications.filter(cert => cert.status === 'expiring_soon' || cert.status === 'expired').length > 0 && (
                                <Chip
                                  label={`${contractor.certifications.filter(cert => cert.status === 'expiring_soon' || cert.status === 'expired').length} vencidas`}
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          </>
                        ) : (
                          <Chip
                            label="Sin certificaciones"
                            size="small"
                            variant="outlined"
                            color="default"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {contractor.courses && contractor.courses.length > 0 ? (
                          <>
                            <Chip
                              label={`${contractor.courses.length} cursos`}
                              size="small"
                              variant="outlined"
                              color="info"
                            />
                            {contractor.courses.length > 0 && (
                              <Typography variant="caption" color="text.secondary">
                                Promedio: {Math.round(contractor.courses.reduce((acc, course) => acc + (course.score || 0), 0) / contractor.courses.length)}%
                              </Typography>
                            )}
                          </>
                        ) : (
                          <Chip
                            label="Sin cursos"
                            size="small"
                            variant="outlined"
                            color="default"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {contractor.email && (
                          <Typography variant="caption" color="text.secondary" sx={{ 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis',
                            maxWidth: '150px'
                          }}>
                            📧 {contractor.email}
                          </Typography>
                        )}
                        {contractor.phone && (
                          <Typography variant="caption" color="text.secondary">
                            📞 {contractor.phone}
                          </Typography>
                        )}
                        {!contractor.email && !contractor.phone && (
                          <Typography variant="caption" color="text.secondary">
                            Sin contacto
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ver detalles">
                        <IconButton
                          size="small"
                          onClick={() => handleViewContractor(contractor)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar contratista">
                        <IconButton
                          size="small"
                          onClick={() => handleEditContractor(contractor)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      {contractor.status !== 'baja' && (
                        <Tooltip title="Eliminar contratista">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(contractor)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            m: { xs: 1, sm: 2 },
            width: { xs: '95%', sm: '600px' }
          }
        }}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea eliminar al contratista{' '}
            <strong>{contractorToDelete ? getContractorName(contractorToDelete) : ''}</strong>?
            <br />
            <br />
            Esta acción marcará al contratista como eliminado (soft delete) y no podrá ser revertida.
          </DialogContentText>
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
            startIcon={actionLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {actionLoading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mobile Stats Drawer */}
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
          
          {stats && (
            <Box>
              <Grid container spacing={2}>
                <Grid size={12}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PeopleIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h4">{stats.total}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Contratistas
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
                          <Typography variant="h4">{stats.active}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Contratistas Activos
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
                        <Badge color="error">
                          <WarningIcon color="warning" sx={{ mr: 2, fontSize: 40 }} />
                        </Badge>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h4">{stats.expiringDocuments}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Documentos por Vencer
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
                          <Typography variant="h4">{stats.companiesCount}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Espacios de Trabajos Supervisados
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* By Company Stats */}
                {stats.byCompany && stats.byCompany.length > 0 && (
                  <Grid size={12}>
                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                      Por Espacios de Trabajo
                    </Typography>
                    {stats.byCompany.map((company) => (
                      <Card key={company._id} sx={{ mb: 1 }}>
                        <CardContent sx={{ py: 1.5 }}>
                          <Typography variant="subtitle2">
                            {company.name}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Total: {company.count}
                            </Typography>
                            <Typography variant="caption" color="success.main">
                              Activos: {company.active}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Inactivos: {company.inactive}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </Box>
      </Drawer>

      {/* Mobile Filter Drawer */}
      <Drawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '85%', sm: 400 },
            p: 2
          }
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Filtros</Typography>
            <IconButton onClick={() => setFilterDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Search Field */}
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Buscar por nombre o cédula..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleFilterChange();
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        onClick={() => {
                          setSearchTerm('');
                          handleFilterChange();
                        }}
                        size="small"
                      >
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
                  handleFilterChange();
                }}
                label="Estado"
              >
                <MenuItem value="all">Todos los estados</MenuItem>
                <MenuItem value="activo">Activos</MenuItem>
                <MenuItem value="inactivo">Inactivos</MenuItem>
                <MenuItem value="baja">Baja</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Espacios de Trabajo</InputLabel>
              <Select
                value={companyFilter}
                onChange={(e) => {
                  setCompanyFilter(e.target.value);
                  handleFilterChange();
                }}
                label="Espacios de Trabajo"
              >
                <MenuItem value="all">Todas los espacios de trabajo</MenuItem>
                {(stats?.byCompany || []).map((company) => (
                  <MenuItem key={company._id} value={company._id}>
                    {company.name} ({company.count})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Documentos</InputLabel>
              <Select
                value={expiringDocsFilter ? 'expiring' : 'all'}
                onChange={(e) => {
                  setExpiringDocsFilter(e.target.value === 'expiring');
                  handleFilterChange();
                }}
                label="Documentos"
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="expiring">Por vencer</MenuItem>
              </Select>
            </FormControl>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
              <Typography variant="body2" color="text.secondary" align="center">
                {totalContractors} contratistas encontrados
              </Typography>
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
              <Button
                variant="contained"
                fullWidth
                onClick={() => setFilterDrawerOpen(false)}
              >
                Aplicar Filtros
              </Button>
            </Box>
          </Box>
        </Box>
      </Drawer>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
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

      {/* Export Dialog */}
      <Dialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            maxHeight: { xs: '90vh', sm: '80vh' },
            m: { xs: 1, sm: 2 }
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DownloadIcon />
            <Typography variant="h6">Exportar Contratistas</Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers sx={{ 
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 3 }
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 3 } }}>
            <Alert severity="info" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              Exporta todos los contratistas de los espacios de trabajo supervisados con filtros opcionales.
            </Alert>
            
            {/* Status and Company */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2 
            }}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={exportStatus}
                  onChange={(e) => setExportStatus(e.target.value)}
                  label="Estado"
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="activo">Activo</MenuItem>
                  <MenuItem value="inactivo">Inactivo</MenuItem>
                  <MenuItem value="baja">Baja</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>Espacio de Trabajo</InputLabel>
                <Select
                  value={exportCompany}
                  onChange={(e) => setExportCompany(e.target.value)}
                  label="Espacio de Trabajo"
                >
                  <MenuItem value="all">Todas</MenuItem>
                  {stats?.byCompany.map(company => (
                    <MenuItem key={company._id} value={company._id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            {/* Search and Expiring Docs */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              alignItems: { xs: 'stretch', sm: 'center' }
            }}>
              <TextField
                label="Búsqueda"
                value={exportSearch}
                onChange={(e) => setExportSearch(e.target.value)}
                fullWidth
                placeholder="Buscar por nombre, cédula, email, etc."
                size={isMobile ? 'small' : 'medium'}
              />
              
              <FormControl sx={{ minWidth: { xs: '100%', sm: 150 } }}>
                <InputLabel shrink={!isMobile}>Documentos</InputLabel>
                <Select
                  value={exportExpiringDocs ? 'expiring' : 'all'}
                  onChange={(e) => setExportExpiringDocs(e.target.value === 'expiring')}
                  label="Documentos"
                  size={isMobile ? 'small' : 'medium'}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="expiring">Por vencer</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            {/* Format and Limit */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2 
            }}>
              <FormControl fullWidth>
                <InputLabel>Formato</InputLabel>
                <Select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as 'excel' | 'csv')}
                  label="Formato"
                  size={isMobile ? 'small' : 'medium'}
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
                placeholder="Vacío = todos"
                size={isMobile ? 'small' : 'medium'}
                slotProps={{ 
                  input: { 
                    inputProps: { min: 1 } 
                  } 
                }}
              />
            </Box>
            
            {/* Current filters info */}
            {(searchTerm || statusFilter !== 'all' || companyFilter !== 'all' || expiringDocsFilter) && (
              <Alert severity="warning">
                <Typography variant="body2" gutterBottom>
                  <strong>Nota:</strong> Los filtros de exportación son independientes de los filtros actuales de la vista.
                </Typography>
              </Alert>
            )}
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