import React, { useState, useEffect, useCallback } from 'react';
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
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Drawer,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Check as CompleteIcon,
  Cancel as CancelIcon,
  Assignment as TaskIcon,
  Construction as ProgressIcon,
  CheckCircle as DoneIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  FilterList as FilterIcon,
  Analytics as StatsIcon,
  Close as CloseIcon,
  ClearAll as ClearIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { WorkOrderApi, WorkOrder, WorkOrderFilters, WorkOrderStats } from '../../services/workOrderApi';
import { StatusBadge } from '../../components/marketplace/StatusBadge';
import { PriorityIndicator } from '../../components/marketplace/PriorityIndicator';
import { formatCurrency, formatDate, truncateText } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { usePageTitle } from '../../hooks/usePageTitle';

export const WorkOrders: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { user } = useAuth();
  
  usePageTitle('Órdenes de Trabajo', 'Gestión de órdenes de trabajo del marketplace');

  // State
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [stats, setStats] = useState<WorkOrderStats>({
    total: 0,
    pending: 0,
    assigned: 0,
    inProgress: 0,
    onHold: 0,
    completed: 0,
    cancelled: 0,
    averageDuration: 0,
    totalCost: 0,
    byStatus: [],
    byPriority: [],
    byContractor: [],
    monthlyTrend: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarContent, setSidebarContent] = useState<'filters' | 'stats'>('filters');

  // Filters
  const [filters, setFilters] = useState<WorkOrderFilters>({
    search: '',
    status: '',
    priority: '',
    page: 1,
    limit: 10
  });

  // Pagination
  const [totalOrders, setTotalOrders] = useState(0);

  // Permissions

  const canUpdateStatus = (workOrder: WorkOrder) => {
    if (user?.role === 'super_admin') return true;
    if (user?.role?.startsWith('contratista_') && workOrder.contractorId === user?.id) return true;
    return false;
  };

  const canViewStats = useCallback(() => {
    return user?.role !== 'validadores_ops';
  }, [user?.role]);

  const clearAllFilters = () => {
    setFilters({
      search: '',
      status: '',
      priority: '',
      page: 1,
      limit: 10
    });
  };

  const hasActiveFilters = () => {
    return filters.search || filters.status || filters.priority;
  };

  const openSidebar = (content: 'filters' | 'stats') => {
    setSidebarContent(content);
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Data loading
  const loadWorkOrders = useCallback(async () => {
    try {
      setLoading(true);
      
      // Add role-based filtering
      const roleFilters = { ...filters };
      if (user?.role?.startsWith('client_')) {
        roleFilters.companyId = user?.companyId;
      } else if (user?.role?.startsWith('contratista_')) {
        roleFilters.contractor = user?.id;
      }
      
      const response = await WorkOrderApi.getWorkOrders(roleFilters);
      setWorkOrders(response.workOrders);
      setTotalOrders(response.total);
    } catch (err) {
      setError('Error loading work orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters, user?.role, user?.companyId, user?.id]);

  const loadStats = useCallback(async () => {
    if (!canViewStats()) return;
    
    try {
      const response = await WorkOrderApi.getWorkOrderStats();
      if (response.stats) {
        // Map the response structure to our expected format
        const mappedStats = {
          total: response.stats.total || 0,
          pending: response.stats.pending || 0,
          assigned: response.stats.assigned || 0,
          inProgress: response.stats.inProgress || 0,
          onHold: response.stats.onHold || 0,
          completed: response.stats.completed || 0,
          cancelled: response.stats.cancelled || 0,
          averageDuration: response.stats.averageDuration || 0,
          totalCost: response.stats.totalCost || 0,
          byStatus: response.stats.byStatus || [],
          byPriority: response.stats.byPriority || [],
          byContractor: response.stats.byContractor || [],
          monthlyTrend: response.stats.monthlyTrend || []
        };
        setStats(mappedStats);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, [canViewStats]);

  useEffect(() => {
    loadWorkOrders();
  }, [filters, loadWorkOrders]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Handlers
  const handleFilterChange = (key: keyof WorkOrderFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handlePageChange = (_: unknown, newPage: number) => {
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

  const handleStatusChange = async (workOrder: WorkOrder, newStatus: WorkOrder['status']) => {
    if (!canUpdateStatus(workOrder)) return;
    
    try {
      await WorkOrderApi.updateWorkOrderStatus(workOrder._id || workOrder.id || '', newStatus);
      loadWorkOrders();
      loadStats();
    } catch (err) {
      console.error('Error updating work order status:', err);
    }
  };

  const calculateMilestoneProgress = (milestones?: Array<{ completed: boolean }>): number => {
    if (!milestones || !Array.isArray(milestones) || milestones.length === 0) return 0;
    const completed = milestones.filter(m => m && m.completed).length;
    return Math.round((completed / milestones.length) * 100);
  };


  const getStatusActions = (workOrder: WorkOrder) => {
    if (!canUpdateStatus(workOrder)) return [];
    
    const actions = [];
    
    switch (workOrder.status) {
      case 'assigned':
        actions.push({
          icon: <StartIcon />,
          label: 'Iniciar Trabajo',
          action: () => handleStatusChange(workOrder, 'in_progress'),
          color: 'primary' as const
        });
        actions.push({
          icon: <CancelIcon />,
          label: 'Cancelar',
          action: () => handleStatusChange(workOrder, 'cancelled'),
          color: 'error' as const
        });
        break;
      case 'in_progress':
        actions.push({
          icon: <PauseIcon />,
          label: 'Poner en Espera',
          action: () => handleStatusChange(workOrder, 'on_hold'),
          color: 'warning' as const
        });
        actions.push({
          icon: <CompleteIcon />,
          label: 'Completar',
          action: () => handleStatusChange(workOrder, 'completed'),
          color: 'success' as const
        });
        break;
      case 'on_hold':
        actions.push({
          icon: <StartIcon />,
          label: 'Reanudar',
          action: () => handleStatusChange(workOrder, 'in_progress'),
          color: 'primary' as const
        });
        break;
    }
    
    return actions;
  };

  if (loading && workOrders.length === 0) {
    return <SkeletonLoader variant={isMobile ? 'cards' : 'table'} rows={filters.limit || 10} />;
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, gap: 2 }}>
        <Typography variant={isMobile ? 'h5' : 'h4'}>Órdenes de Trabajo</Typography>
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
          {loading && workOrders.length === 0 ? (
            <SkeletonLoader variant="cards" rows={filters.limit || 10} />
          ) : workOrders.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No se encontraron órdenes de trabajo
              </Typography>
            </Box>
          ) : (
            (workOrders || []).map((workOrder) => {
              const progress = calculateMilestoneProgress(workOrder.milestones);
              const actions = getStatusActions(workOrder);
              
              return (
                <Card key={workOrder._id || workOrder.id} sx={{ position: 'relative' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="h6" 
                          fontWeight="medium" 
                          sx={{ mb: 0.5 }}
                        >
                          {workOrder.orderNumber}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {workOrder.workRequest?.title || 'N/A'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                          <StatusBadge 
                            status={workOrder.status} 
                            statusType="workOrder"
                          />
                          <PriorityIndicator priority={workOrder.priority} />
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/marketplace/work-orders/${workOrder._id || workOrder.id}`)}
                          title="Ver detalles"
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedOrder(workOrder);
                            setMilestoneDialogOpen(true);
                          }}
                          title="Ver hitos"
                        >
                          <TaskIcon />
                        </IconButton>
                        {actions.map((action, index) => (
                          <IconButton
                            key={index}
                            size="small"
                            color={action.color}
                            onClick={action.action}
                            title={action.label}
                          >
                            {action.icon}
                          </IconButton>
                        ))}
                      </Box>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">Progreso: {workOrder.progress || progress}%</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(workOrder.milestones || []).filter(m => m && m.completed).length}/
                          {(workOrder.milestones || []).length} hitos
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={workOrder.progress || progress} 
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    
                    <Grid container spacing={1} sx={{ fontSize: '0.875rem' }}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">
                          Valor Total
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(workOrder.totalCost || 0, workOrder.currency || 'USD')}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">
                          Ubicación
                        </Typography>
                        <Typography variant="body2">
                          {truncateText(workOrder.location.address, 25)}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">
                          Programado
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(workOrder.scheduledStartDate)}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">
                          Fin Programado
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(workOrder.scheduledEndDate)}
                        </Typography>
                      </Grid>
                      {workOrder.actualStartDate && (
                        <Grid size={{ xs: 12 }}>
                          <Typography variant="caption" color="text.secondary">
                            Iniciado: {formatDate(workOrder.actualStartDate)}
                          </Typography>
                        </Grid>
                      )}
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" color="text.secondary">
                          Creado: {formatDate(workOrder.createdAt)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              );
            })
          )}
        </Box>
      ) : (
        // Desktop Table View
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Orden de Trabajo</TableCell>
                  <TableCell>Ubicación</TableCell>
                  <TableCell>Progreso</TableCell>
                  <TableCell>Valor</TableCell>
                  <TableCell>Prioridad</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Programación</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && workOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : workOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body1" color="text.secondary">
                        No se encontraron órdenes de trabajo
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  (workOrders || []).map((workOrder) => {
                    const progress = calculateMilestoneProgress(workOrder.milestones);
                    const actions = getStatusActions(workOrder);
                    
                    return (
                      <TableRow key={workOrder._id || workOrder.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2">
                              {workOrder.orderNumber}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {workOrder.workRequest?.title || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(workOrder.createdAt)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LocationIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {truncateText(workOrder.location.address, 25)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ minWidth: 100 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2">{workOrder.progress || progress}%</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {(workOrder.milestones || []).filter(m => m && m.completed).length}/
                                {(workOrder.milestones || []).length}
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={workOrder.progress || progress} 
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(workOrder.totalCost || 0, workOrder.currency || 'USD')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <PriorityIndicator priority={workOrder.priority} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge 
                            status={workOrder.status} 
                            statusType="workOrder"
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                              <ScheduleIcon sx={{ fontSize: 14, mr: 0.5 }} />
                              {formatDate(workOrder.scheduledStartDate)} - {formatDate(workOrder.scheduledEndDate)}
                            </Typography>
                            {workOrder.actualStartDate && (
                              <Typography variant="caption" color="text.secondary">
                                Iniciado: {formatDate(workOrder.actualStartDate)}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Ver Detalles">
                            <IconButton 
                              size="small" 
                              onClick={() => navigate(`/marketplace/work-orders/${workOrder._id || workOrder.id}`)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Ver Hitos">
                            <IconButton 
                              size="small" 
                              onClick={() => {
                                setSelectedOrder(workOrder);
                                setMilestoneDialogOpen(true);
                              }}
                            >
                              <TaskIcon />
                            </IconButton>
                          </Tooltip>
                          
                          {actions.map((action, index) => (
                            <Tooltip key={index} title={action.label}>
                              <IconButton 
                                size="small" 
                                color={action.color}
                                onClick={action.action}
                              >
                                {action.icon}
                              </IconButton>
                            </Tooltip>
                          ))}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            component="div"
            count={totalOrders}
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
            count={totalOrders}
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

      {/* Milestone Dialog */}
      <Dialog 
        open={milestoneDialogOpen} 
        onClose={() => setMilestoneDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Hitos - {selectedOrder?.orderNumber}
        </DialogTitle>
        <DialogContent>
          {selectedOrder?.milestones && Array.isArray(selectedOrder.milestones) && selectedOrder.milestones.length > 0 ? (
            <List>
              {(selectedOrder.milestones || []).map((milestone, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {milestone.completed ? <DoneIcon color="success" /> : <TaskIcon color="disabled" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={milestone.name}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {milestone.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Vence: {formatDate(milestone.dueDate)}
                          {milestone.completedAt && ` | Completado: ${formatDate(milestone.completedAt)}`}
                        </Typography>
                      </Box>
                    }
                  />
                  <Box sx={{ ml: 2 }}>
                    <Chip 
                      label={milestone.completed ? 'Completado' : 'Pendiente'} 
                      color={milestone.completed ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 3 }}>
              No se han definido hitos para esta orden de trabajo
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMilestoneDialogOpen(false)}>Cerrar</Button>
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
                  placeholder="Buscar órdenes de trabajo..."
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

                {/* Status Filter */}
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filters.status || ''}
                    label="Estado"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="">Todos los Estados</MenuItem>
                    <MenuItem value="pending">Pendiente</MenuItem>
                    <MenuItem value="assigned">Asignado</MenuItem>
                    <MenuItem value="in_progress">En Progreso</MenuItem>
                    <MenuItem value="on_hold">En Espera</MenuItem>
                    <MenuItem value="completed">Completado</MenuItem>
                    <MenuItem value="cancelled">Cancelado</MenuItem>
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
                    <MenuItem value="urgente">Urgente</MenuItem>
                    <MenuItem value="alta">Alta</MenuItem>
                    <MenuItem value="media">Media</MenuItem>
                    <MenuItem value="baja">Baja</MenuItem>
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
                      <TaskIcon sx={{ fontSize: 32, color: theme.palette.primary.main, mr: 2 }} />
                      <Box>
                        <Typography variant="h5">{stats.total}</Typography>
                        <Typography variant="body2" color="text.secondary">Total de Órdenes</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                      <ProgressIcon sx={{ fontSize: 32, color: theme.palette.warning.main, mr: 2 }} />
                      <Box>
                        <Typography variant="h5">{stats.pending}</Typography>
                        <Typography variant="body2" color="text.secondary">Pendientes</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                      <StartIcon sx={{ fontSize: 32, color: theme.palette.info.main, mr: 2 }} />
                      <Box>
                        <Typography variant="h5">{stats.inProgress}</Typography>
                        <Typography variant="body2" color="text.secondary">En Progreso</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                      <DoneIcon sx={{ fontSize: 32, color: theme.palette.success.main, mr: 2 }} />
                      <Box>
                        <Typography variant="h5">{stats.completed}</Typography>
                        <Typography variant="body2" color="text.secondary">Completadas</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                      <CancelIcon sx={{ fontSize: 32, color: theme.palette.error.main, mr: 2 }} />
                      <Box>
                        <Typography variant="h5">{stats.cancelled}</Typography>
                        <Typography variant="body2" color="text.secondary">Canceladas</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Additional Stats */}
              {stats.byStatus && stats.byStatus.length > 0 && (
                <>
                  <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Distribución por Estado</Typography>
                  <Card variant="outlined">
                    <CardContent>
                      {(stats.byStatus || []).map((status) => {
                        const percentage = stats.total > 0 
                          ? (status.count / stats.total * 100).toFixed(1)
                          : 0;
                        return (
                          <Box key={status._id} sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <StatusBadge 
                                status={status._id} 
                                statusType="workOrder"
                              />
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
                </>
              )}

              {/* Note: Priority Distribution not available in current API */}

              {/* Top Contractors */}
              {stats.byContractor && stats.byContractor.length > 0 && (
                <>
                  <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Principales Contratistas</Typography>
                  <Card variant="outlined">
                    <CardContent>
                      {(stats.byContractor || []).slice(0, 5).map((contractor) => (
                        <Box key={contractor._id} sx={{ mb: 1.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {contractor.contractor.firstName} {contractor.contractor.lastName}
                            </Typography>
                            <Typography variant="body2">{contractor.count}</Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {contractor.contractor.company?.name || 'Independiente'}
                          </Typography>
                          {contractor.totalCost && (
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              • {formatCurrency(contractor.totalCost)}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};