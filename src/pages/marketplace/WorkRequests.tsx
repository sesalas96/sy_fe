import React, { useState, useEffect, useCallback } from 'react';
import { normalizeWorkRequestStatus } from '../../utils/statusMappings';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  IconButton,
  Chip,
  useTheme,
  useMediaQuery,
  Alert,
  CircularProgress,
  InputAdornment,
  Tooltip,
  Drawer,
  Divider,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Publish as PublishIcon,
  Gavel as AwardIcon,
  LocationOn as LocationIcon,
  RequestPage as RequestIcon,
  AttachMoney as BudgetIcon,
  Assignment as BidsIcon,
  FilterList as FilterIcon,
  Analytics as StatsIcon,
  Close as CloseIcon,
  ClearAll as ClearIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { WorkRequestApi, WorkRequest, WorkRequestFilters, WorkRequestStats, WorkRequestStatsResponse } from '../../services/workRequestApi';
import { ServicesApi, Service } from '../../services/servicesApi';
import { StatusBadge } from '../../components/marketplace/StatusBadge';
import { PriorityIndicator } from '../../components/marketplace/PriorityIndicator';
import { formatCurrency, formatDate, truncateText } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { usePageTitle } from '../../hooks/usePageTitle';
// Removed date-fns import as it's no longer needed

export const WorkRequests: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { user } = useAuth();
  
  usePageTitle('Solicitudes de Trabajo', 'Gestión de solicitudes del marketplace');

  // State
  const [workRequests, setWorkRequests] = useState<WorkRequest[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [stats, setStats] = useState<WorkRequestStats>({
    totalRequests: 0,
    publishedRequests: 0,
    biddingRequests: 0,
    awardedRequests: 0,
    avgBudget: 0,
    avgBidsPerRequest: 0
  });
  const [fullStats, setFullStats] = useState<WorkRequestStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState<WorkRequestFilters>({
    search: '',
    serviceId: '',
    priority: '',
    status: '',
    page: 1,
    limit: 10
  });

  // Pagination
  const [totalRequests, setTotalRequests] = useState(0);
  // Removed totalPages as it's not used

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarContent, setSidebarContent] = useState<'filters' | 'stats'>('filters');
  
  // Publish confirmation modal state
  const [confirmPublishOpen, setConfirmPublishOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  // Permissions
  const canCreateRequests = () => {
    return ['super_admin', 'safety_staff', 'client_supervisor', 'client_approver'].includes(user?.role || '');
  };

  const canEditRequests = (request: WorkRequest) => {
    // Only allow editing in draft, pending, or review states - not when published or beyond
    const canEdit = request.status === 'draft' || 
                   request.status === 'borrador' ||
                   request.status === 'pending' ||
                   request.status === 'pendiente' ||
                   request.status === 'in_review' ||
                   request.status === 'en_revision';
    const isOwner = request.requestedBy?._id === user?._id || request.requestedBy?._id === user?.id || request.clientId === user?.id;
    return canEdit && (user?.role === 'super_admin' || isOwner);
  };

  const canDeleteRequests = (request: WorkRequest) => {
    if (user?.role === 'super_admin') return true;
    const isDraft = request.status === 'draft' || request.status === 'borrador';
    const isOwner = request.requestedBy?._id === user?._id || request.requestedBy?._id === user?.id || request.clientId === user?.id;
    if (isDraft && isOwner) return true;
    return false;
  };

  const canPublishRequests = (request: WorkRequest) => {
    // Only allow publishing for pending/in review status, NOT for draft/borrador
    const canPublish = request.status === 'pending' || 
                      request.status === 'pendiente' ||
                      request.status === 'in_review' ||
                      request.status === 'en_revision';
    const isOwner = request.requestedBy?._id === user?._id || request.requestedBy?._id === user?.id || request.clientId === user?.id;
    return canPublish && (user?.role === 'super_admin' || isOwner);
  };

  const canAwardBids = (request: WorkRequest) => {
    const isBidding = request.status === 'bidding' || request.status === 'licitando';
    const isOwner = request.requestedBy?._id === user?._id || request.requestedBy?._id === user?.id || request.clientId === user?.id;
    return isBidding && (user?.role === 'super_admin' || isOwner);
  };

  const canViewStats = useCallback(() => {
    return user?.role !== 'validadores_ops';
  }, [user?.role]);

  // Data loading
  const loadWorkRequests = useCallback(async () => {
    try {
      setLoading(true);
      
      // Add role-based filtering
      const roleFilters = { ...filters };
      if (user?.role?.startsWith('client_')) {
        roleFilters.clientCompanyId = user?.companyId;
      }
      
      const response = await WorkRequestApi.getWorkRequests(roleFilters);
      setWorkRequests(response.requests);
      setTotalRequests(response.total);
      // setTotalPages(response.totalPages); // Not needed as we calculate pages from total and limit
    } catch (err) {
      setError('Error loading work requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters, user?.role, user?.companyId]);

  const loadServices = useCallback(async () => {
    try {
      const response = await ServicesApi.getServices({ isActive: true });
      setServices(response.services);
    } catch (err) {
      console.error('Error loading services:', err);
    }
  }, []);

  const loadStats = useCallback(async () => {
    if (!canViewStats()) return;
    
    try {
      const response = await WorkRequestApi.getWorkRequestStats();
      setFullStats(response);
      
      if (response.stats) {
        const { summary, byStatus } = response.stats;
        
        // Count statuses from byStatus array
        const statusCounts = byStatus.reduce((acc: any, item: any) => {
          const normalizedStatus = normalizeWorkRequestStatus(item._id);
          acc[normalizedStatus] = item.count;
          return acc;
        }, {});
        
        setStats({
          totalRequests: summary.total || 0,
          publishedRequests: statusCounts.published || 0,
          biddingRequests: statusCounts.bidding || 0,
          awardedRequests: statusCounts.awarded || 0,
          avgBudget: summary.avgBudgetMax || 0,
          avgBidsPerRequest: 0 // This would need to be calculated from bid data
        });
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, [canViewStats]);

  useEffect(() => {
    loadWorkRequests();
  }, [filters, loadWorkRequests]);

  useEffect(() => {
    loadServices();
    loadStats();
  }, [loadServices, loadStats]);

  // Handlers
  const handleFilterChange = (key: keyof WorkRequestFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage + 1
    }));
    
    // Scroll up to show the new page content
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({
      ...prev,
      limit: parseInt(event.target.value, 10),
      page: 1
    }));
    
    // Scroll up to show the new page content
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleDeleteRequest = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this work request?')) return;
    
    try {
      await WorkRequestApi.deleteWorkRequest(id);
      loadWorkRequests();
      loadStats();
    } catch (err) {
      console.error('Error deleting work request:', err);
    }
  };

  const handlePublishRequest = (id: string) => {
    const request = workRequests.find(r => r._id === id || r.id === id);
    console.log('Publishing request with status:', request?.status);
    
    setSelectedRequestId(id);
    setConfirmPublishOpen(true);
  };

  const confirmPublish = async () => {
    if (!selectedRequestId) return;
    
    setPublishing(true);
    
    try {
      await WorkRequestApi.publishWorkRequest(selectedRequestId);
      setConfirmPublishOpen(false);
      loadWorkRequests();
      loadStats();
    } catch (err: any) {
      console.error('Error publishing work request:', err);
      let errorMessage = 'Error publishing work request';
      
      if (err.message?.includes('pendiente') || err.message?.includes('pending')) {
        errorMessage = 'Work request must be in pending or review status to be published. Current status may not allow publishing.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      alert(errorMessage);
    } finally {
      setPublishing(false);
    }
  };


  const getServiceName = (serviceId: string) => {
    if (!services || services.length === 0) return 'Unknown Service';
    const service = services.find(s => s._id === serviceId || s.id === serviceId);
    return service?.name || 'Unknown Service';
  };

  // Removed getStatusColor as StatusBadge handles colors internally

  const clearAllFilters = () => {
    setFilters({
      search: '',
      serviceId: '',
      priority: '',
      status: '',
      page: 1,
      limit: 10
    });
  };

  const hasActiveFilters = () => {
    return filters.search || filters.serviceId || filters.priority || filters.status;
  };

  const openSidebar = (content: 'filters' | 'stats') => {
    setSidebarContent(content);
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  if (loading && (!workRequests || workRequests.length === 0)) {
    return <SkeletonLoader variant={isMobile ? 'cards' : 'table'} rows={filters.limit || 10} />;
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, gap: 2 }}>
        <Typography variant={isMobile ? 'h5' : 'h4'}>Solicitudes de Trabajo</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
          <Button
            variant="outlined"
            size={isMobile ? 'small' : 'medium'}
            startIcon={!isXs ? <FilterIcon /> : undefined}
            onClick={() => openSidebar('filters')}
            color={hasActiveFilters() ? 'primary' : 'inherit'}
          >
            {isXs ? 'Filtros' : `Filtros ${hasActiveFilters() ? `(${Object.values(filters).filter(v => v && v !== '' && v !== 1 && v !== 10).length})` : ''}`}
          </Button>
          {canViewStats() && (
            <Button
              variant="outlined"
              size={isMobile ? 'small' : 'medium'}
              startIcon={!isXs ? <StatsIcon /> : undefined}
              onClick={() => openSidebar('stats')}
            >
              {isXs ? 'Stats' : 'Estadísticas'}
            </Button>
          )}
          {canCreateRequests() && (
            <Button
              variant="contained"
              size={isMobile ? 'small' : 'medium'}
              startIcon={!isXs ? <AddIcon /> : undefined}
              onClick={() => navigate('/marketplace/work-requests/new')}
            >
              {isXs ? 'Crear' : 'Crear Solicitud'}
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}



      {isMobile ? (
        // Mobile Card View
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {loading && (!workRequests || workRequests.length === 0) ? (
            <SkeletonLoader variant="cards" rows={filters.limit || 10} />
          ) : (!workRequests || workRequests.length === 0) ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No se encontraron solicitudes de trabajo
              </Typography>
            </Box>
          ) : (
            workRequests.map((request) => (
              <Card key={request._id || request.id} sx={{ position: 'relative' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        variant="h6" 
                        fontWeight="medium" 
                        sx={{ 
                          cursor: 'pointer', 
                          color: 'primary.main',
                          '&:hover': { textDecoration: 'underline' },
                          mb: 0.5
                        }}
                        onClick={() => navigate(`/marketplace/work-requests/${request._id || request.id}`)}
                      >
                        {request.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {truncateText(request.description, 100)}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                        <Chip 
                          label={request.service?.name || getServiceName(request.serviceId || '')}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                        <StatusBadge 
                          status={normalizeWorkRequestStatus(request.status)} 
                          statusType="workRequest"
                        />
                        <PriorityIndicator priority={request.priority} />
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/marketplace/work-requests/${request._id || request.id}`)}
                        title="Ver detalles"
                      >
                        <ViewIcon />
                      </IconButton>
                      {canEditRequests(request) && (
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/marketplace/work-requests/${request._id || request.id}/edit`)}
                          title="Editar"
                        >
                          <EditIcon />
                        </IconButton>
                      )}
                      {canPublishRequests(request) && (
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handlePublishRequest(request._id || request.id || '')}
                          title="Publicar para Licitación"
                        >
                          <PublishIcon />
                        </IconButton>
                      )}
                      {canAwardBids(request) && request.bidCount && request.bidCount > 0 && (
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => navigate(`/marketplace/work-requests/${request._id || request.id}/award`)}
                          title="Adjudicar Licitación"
                        >
                          <AwardIcon />
                        </IconButton>
                      )}
                      {canDeleteRequests(request) && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteRequest(request._id || request.id || '')}
                          title="Eliminar"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                  
                  <Grid container spacing={1} sx={{ fontSize: '0.875rem' }}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Espacios de Trabajo
                      </Typography>
                      <Typography variant="body2">
                        {request.company?.name || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Presupuesto
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(
                          request.budget || request.estimatedBudget?.max || request.estimatedBudget?.min || 0, 
                          request.currency || request.estimatedBudget?.currency || 'USD'
                        )}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Ubicación
                      </Typography>
                      <Typography variant="body2">
                        {truncateText(
                          typeof request.location === 'string' 
                            ? request.location 
                            : request.location?.address || 'N/A', 
                          25
                        )}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Propuestas
                      </Typography>
                      <Typography variant="body2">
                        {request.bidCount || 0} propuestas
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                        Detalles de la Solicitud
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="caption" color="text.secondary">
                          #{request.requestNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">•</Typography>
                        <Typography variant="caption" color="text.secondary">
                          por {request.requestedBy?.firstName} {request.requestedBy?.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">•</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(request.createdAt)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      ) : (
        // Desktop Table View
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Solicitud</TableCell>
                  <TableCell>Espacios de Trabajo</TableCell>
                  <TableCell>Servicio</TableCell>
                  <TableCell>Ubicación</TableCell>
                  <TableCell>Presupuesto</TableCell>
                  <TableCell>Prioridad</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Propuestas</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && (!workRequests || workRequests.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : (!workRequests || workRequests.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography variant="body1" color="text.secondary">
                        No se encontraron solicitudes de trabajo
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  workRequests && workRequests.map((request) => (
                    <TableRow key={request._id || request.id} hover>
                      <TableCell>
                        <Box>
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              cursor: 'pointer', 
                              color: 'primary.main',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                            onClick={() => navigate(`/marketplace/work-requests/${request._id || request.id}`)}
                          >
                            {request.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {truncateText(request.description, 60)}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {request.requestNumber}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">•</Typography>
                            <Typography variant="caption" color="text.secondary">
                              por {request.requestedBy?.firstName} {request.requestedBy?.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">•</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(request.createdAt)}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {request.company?.name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={request.service?.name || getServiceName(request.serviceId || '')}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocationIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {truncateText(
                              typeof request.location === 'string' 
                                ? request.location 
                                : request.location?.address || '', 
                              30
                            )}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(
                            request.budget || request.estimatedBudget?.max || request.estimatedBudget?.min || 0, 
                            request.currency || request.estimatedBudget?.currency || 'USD'
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <PriorityIndicator priority={request.priority} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge 
                          status={normalizeWorkRequestStatus(request.status)} 
                          statusType="workRequest"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={request.bidCount || 0}
                          size="small"
                          color={request.bidCount && request.bidCount > 0 ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Ver Detalles">
                          <IconButton 
                            size="small" 
                            onClick={() => navigate(`/marketplace/work-requests/${request._id || request.id}`)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {canEditRequests(request) && (
                          <Tooltip title="Editar">
                            <IconButton 
                              size="small" 
                              onClick={() => navigate(`/marketplace/work-requests/${request._id || request.id}/edit`)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {canPublishRequests(request) && (
                          <Tooltip title="Publicar para Licitación">
                            <IconButton 
                              size="small" 
                              color="info"
                              onClick={() => handlePublishRequest(request._id || request.id || '')}
                            >
                              <PublishIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {canAwardBids(request) && request.bidCount && request.bidCount > 0 && (
                          <Tooltip title="Adjudicar Licitación">
                            <IconButton 
                              size="small" 
                              color="success"
                              onClick={() => navigate(`/marketplace/work-requests/${request._id || request.id}/award`)}
                            >
                              <AwardIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {canDeleteRequests(request) && (
                          <Tooltip title="Eliminar">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteRequest(request._id || request.id || '')}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            component="div"
            count={totalRequests}
            page={(filters.page || 1) - 1}
            onPageChange={handlePageChange}
            rowsPerPage={filters.limit || 10}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
          />
        </Paper>
      )}
      
      {/* Mobile Pagination */}
      {isMobile && (
        <Paper sx={{ mt: 2 }}>
          <TablePagination
            component="div"
            count={totalRequests}
            page={(filters.page || 1) - 1}
            onPageChange={handlePageChange}
            rowsPerPage={filters.limit || 10}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage="Por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </Paper>
      )}

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
                  placeholder="Buscar solicitudes..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
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

                {/* Service Filter */}
                <FormControl fullWidth>
                  <InputLabel>Servicio</InputLabel>
                  <Select
                    value={filters.serviceId || ''}
                    label="Servicio"
                    onChange={(e) => handleFilterChange('serviceId', e.target.value)}
                  >
                    <MenuItem value="">Todos los Servicios</MenuItem>
                    {services && services.map((service) => (
                      <MenuItem key={service._id} value={service._id}>
                        {service.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Priority Filter */}
                <FormControl fullWidth>
                  <InputLabel>Prioridad</InputLabel>
                  <Select
                    value={filters.priority || ''}
                    label="Prioridad"
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                  >
                    <MenuItem value="">Todas las Prioridades</MenuItem>
                    <MenuItem value="urgent">Urgente</MenuItem>
                    <MenuItem value="high">Alta</MenuItem>
                    <MenuItem value="medium">Media</MenuItem>
                    <MenuItem value="low">Baja</MenuItem>
                  </Select>
                </FormControl>

                {/* Status Filter */}
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filters.status || ''}
                    label="Estado"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="">Todos los Estados</MenuItem>
                    <MenuItem value="draft">Borrador</MenuItem>
                    <MenuItem value="published">Publicado</MenuItem>
                    <MenuItem value="bidding">En Licitación</MenuItem>
                    <MenuItem value="awarded">Adjudicado</MenuItem>
                    <MenuItem value="completed">Completado</MenuItem>
                    <MenuItem value="cancelled">Cancelado</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </>
          ) : (
            <>
              {/* Stats Content */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                      <RequestIcon sx={{ fontSize: 32, color: theme.palette.primary.main, mr: 2 }} />
                      <Box>
                        <Typography variant="h5">{stats.totalRequests}</Typography>
                        <Typography variant="body2" color="text.secondary">Total de Solicitudes</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                      <PublishIcon sx={{ fontSize: 32, color: theme.palette.info.main, mr: 2 }} />
                      <Box>
                        <Typography variant="h5">{stats.publishedRequests}</Typography>
                        <Typography variant="body2" color="text.secondary">Publicadas</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                      <BidsIcon sx={{ fontSize: 32, color: theme.palette.warning.main, mr: 2 }} />
                      <Box>
                        <Typography variant="h5">{stats.biddingRequests}</Typography>
                        <Typography variant="body2" color="text.secondary">En Licitación</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                      <AwardIcon sx={{ fontSize: 32, color: theme.palette.success.main, mr: 2 }} />
                      <Box>
                        <Typography variant="h5">{stats.awardedRequests}</Typography>
                        <Typography variant="body2" color="text.secondary">Adjudicadas</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                      <BudgetIcon sx={{ fontSize: 32, color: theme.palette.secondary.main, mr: 2 }} />
                      <Box>
                        <Typography variant="h5">{formatCurrency(stats.avgBudget)}</Typography>
                        <Typography variant="body2" color="text.secondary">Presupuesto Promedio</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                      <BidsIcon sx={{ fontSize: 32, color: theme.palette.info.main, mr: 2 }} />
                      <Box>
                        <Typography variant="h5">{stats.avgBidsPerRequest.toFixed(1)}</Typography>
                        <Typography variant="body2" color="text.secondary">Propuestas Promedio</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Additional Stats */}
              {fullStats?.stats && (
                <>
                  {/* Status Distribution */}
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Distribución por Estado</Typography>
                    <Card variant="outlined">
                      <CardContent>
                        {fullStats.stats.byStatus.map((status) => {
                          const normalizedStatus = normalizeWorkRequestStatus(status._id);
                          const percentage = fullStats.stats.summary.total > 0 
                            ? (status.count / fullStats.stats.summary.total * 100).toFixed(1)
                            : 0;
                          return (
                            <Box key={status._id} sx={{ mb: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <StatusBadge status={normalizedStatus} statusType="workRequest" />
                                <Typography variant="body2">
                                  {status.count} ({percentage}%)
                                </Typography>
                              </Box>
                              <LinearProgress 
                                variant="determinate" 
                                value={Number(percentage)} 
                                sx={{ height: 6, borderRadius: 1 }}
                              />
                            </Box>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Priority Distribution */}
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Distribución por Prioridad</Typography>
                    <Card variant="outlined">
                      <CardContent>
                        {fullStats.stats.byPriority.map((priority) => (
                          <Box key={priority._id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <PriorityIndicator priority={priority._id as any} />
                            <Typography variant="body2">{priority.count} solicitudes</Typography>
                          </Box>
                        ))}
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Service Distribution */}
                  {fullStats.stats.byService.length > 0 && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Principales Servicios</Typography>
                      <Card variant="outlined">
                        <CardContent>
                          {fullStats.stats.byService.slice(0, 5).map((service) => (
                            <Box key={service._id} sx={{ mb: 1.5 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" fontWeight="medium">
                                  {service.serviceName}
                                </Typography>
                                <Typography variant="body2">{service.count}</Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {service.serviceCode}
                              </Typography>
                            </Box>
                          ))}
                        </CardContent>
                      </Card>
                    </Grid>
                  )}

                  {/* Recent Activity */}
                  {fullStats.stats.recentRequests.length > 0 && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Actividad Reciente</Typography>
                      <Card variant="outlined">
                        <CardContent sx={{ p: 0 }}>
                          {fullStats.stats.recentRequests.slice(0, 3).map((request) => (
                            <Box 
                              key={request._id} 
                              sx={{ 
                                p: 2, 
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                '&:last-child': { borderBottom: 'none' }
                              }}
                            >
                              <Typography variant="body2" fontWeight="medium" noWrap>
                                {request.title}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center' }}>
                                <StatusBadge 
                                  status={normalizeWorkRequestStatus(request.status)} 
                                  statusType="workRequest"
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(request.createdAt)}
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </>
              )}
            </>
          )}
        </Box>
      </Drawer>

      {/* Publish Confirmation Modal */}
      <Dialog
        open={confirmPublishOpen}
        onClose={() => setConfirmPublishOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirmar Publicación
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea publicar esta solicitud de trabajo? Será visible para todos los contratistas y podrán enviar propuestas.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmPublishOpen(false)}
            disabled={publishing}
          >
            Cancelar
          </Button>
          <Button 
            onClick={confirmPublish}
            variant="contained"
            disabled={publishing}
            startIcon={publishing ? <CircularProgress size={20} /> : <PublishIcon />}
          >
            {publishing ? 'Publicando...' : 'Publicar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};