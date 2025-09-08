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
  InputAdornment,
  Drawer,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Category as CategoryIcon,
  AttachMoney as PriceIcon,
  Schedule as SlaIcon,
  Build as ServiceIcon,
  FilterAlt as FilterIcon,
  Clear as ClearIcon,
  Analytics as StatsIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { ServicesApi, Service, ServiceCategory, ServiceFilters, ServiceStats } from '../../services/servicesApi';
import { StatusBadge } from '../../components/marketplace/StatusBadge';
import { formatCurrency } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { usePageTitle } from '../../hooks/usePageTitle';

export const Services: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { user } = useAuth();
  
  usePageTitle('Catálogo de Servicios', 'Gestión de servicios del marketplace');

  // State
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [stats, setStats] = useState<ServiceStats>({
    services: {
      total: 0,
      active: 0,
      inactive: 0
    },
    categories: {
      total: 0,
      active: 0
    },
    breakdown: {
      byCategory: [],
      byRiskLevel: [],
      byBillingUnit: []
    },
    averages: {
      _id: null,
      avgPrice: 0,
      avgDuration: null,
      minPrice: 0,
      maxPrice: 0,
      minDuration: { value: 0, unit: 'horas' },
      maxDuration: { value: 0, unit: 'horas' }
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<'filters' | 'stats'>('filters');

  // Filters
  const [filters, setFilters] = useState<ServiceFilters>({
    search: '',
    categoryId: '',
    billingUnit: undefined,
    riskLevel: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    isActive: undefined,
    requiresCertification: undefined,
    page: 1,
    limit: 10
  });

  // Pagination
  const [totalServices, setTotalServices] = useState(0);
  const [, setTotalPages] = useState(0);

  // Permissions
  const canCreateServices = () => {
    return user?.role === 'super_admin' || user?.role === 'safety_staff';
  };

  const canEditServices = () => {
    return user?.role === 'super_admin' || user?.role === 'safety_staff';
  };

  const canDeleteServices = () => {
    return user?.role === 'super_admin';
  };

  const canViewStats = useCallback(() => {
    return user?.role !== 'validadores_ops';
  }, [user?.role]);

  // Data loading
  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ServicesApi.getServices(filters);
      setServices(response.services);
      setTotalServices(response.total);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError('Error loading services');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadCategories = useCallback(async () => {
    try {
      const categoriesData = await ServicesApi.getServiceCategories();
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err) {
      console.error('Error loading categories:', err);
      setCategories([]);
    }
  }, []);

  const loadStats = useCallback(async () => {
    if (!canViewStats()) return;
    
    try {
      const statsData = await ServicesApi.getServicesStats();
      console.log('Stats response:', statsData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, [canViewStats]);

  useEffect(() => {
    loadServices();
  }, [filters, loadServices]);

  useEffect(() => {
    loadCategories();
    loadStats();
  }, [loadCategories, loadStats]);

  // Handlers
  const handleFilterChange = (key: keyof ServiceFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (event: unknown, newPage: number) => {
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

  const handleClearFilters = () => {
    setFilters({
      search: '',
      categoryId: '',
      billingUnit: undefined,
      riskLevel: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      isActive: undefined,
      requiresCertification: undefined,
      page: 1,
      limit: 10
    });
  };

  // Sidebar handlers
  const openSidebar = (mode: 'filters' | 'stats') => {
    setSidebarMode(mode);
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este servicio?')) return;
    
    try {
      await ServicesApi.deleteService(id);
      loadServices();
      loadStats();
    } catch (err) {
      console.error('Error deleting service:', err);
    }
  };


  if (loading && services.length === 0) {
    return <SkeletonLoader variant={isMobile ? 'cards' : 'table'} rows={filters.limit || 10} />;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
      {/* Main Content */}
      <Box sx={{ flexGrow: 1, p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant={isMobile ? 'h5' : 'h4'}>
            <ServiceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Catálogo de Servicios
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size={isMobile ? 'small' : 'medium'}
              startIcon={!isXs ? <FilterIcon /> : undefined}
              onClick={() => openSidebar('filters')}
              color={Object.values(filters).some(f => f !== '' && f !== undefined && f !== 1 && f !== 10) ? 'primary' : 'inherit'}
            >
              {isXs ? 'Filtros' : 'Filtros'}
            </Button>
            {canViewStats() && (
              <Button
                variant="outlined"
                size={isMobile ? 'small' : 'medium'}
                startIcon={!isXs ? <StatsIcon /> : undefined}
                onClick={() => openSidebar('stats')}
              >
                {isXs ? 'Estad.' : 'Estadísticas'}
              </Button>
            )}
            {canCreateServices() && (
              <Button
                variant="contained"
                size={isMobile ? 'small' : 'medium'}
                startIcon={!isXs ? <AddIcon /> : undefined}
                onClick={() => navigate('/marketplace/services/new')}
              >
                {isXs ? 'Agregar' : 'Agregar Servicio'}
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
          {services.map((service) => (
            <Card key={service._id} sx={{ position: 'relative' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="medium" sx={{ mb: 0.5 }}>
                      {service.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {service.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                      <Chip 
                        label={service.category?.name || 'Sin categoría'}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                      <StatusBadge 
                        status={service.isActive ? 'active' : 'inactive'} 
                      />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/marketplace/services/${service._id}`)}
                      title="Ver detalles"
                    >
                      <ViewIcon />
                    </IconButton>
                    {canEditServices() && (
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/marketplace/services/${service._id}/edit`)}
                        title="Editar"
                      >
                        <EditIcon />
                      </IconButton>
                    )}
                    {canDeleteServices() && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteService(service._id)}
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
                      Precio Base
                    </Typography>
                    <Typography variant="body2">
                      {formatCurrency(service.basePrice)} / {service.billingUnit}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      SLA
                    </Typography>
                    <Typography variant="body2">
                      {service.sla.resolutionTime.value || '-'} {service.sla.resolutionTime.unit}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Nivel de Riesgo
                    </Typography>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                      {service.riskLevel}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Certificación
                    </Typography>
                    <Typography variant="body2">
                      {service.riskLevel === 'alto' || service.riskLevel === 'crítico' ? 'Requerida' : 'No Requerida'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        // Desktop Table View
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Servicio</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell>Precio</TableCell>
                  <TableCell>SLA</TableCell>
                  <TableCell>Certificación</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {services.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body1" color="text.secondary">
                        No se encontraron servicios
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  services.map((service) => (
                    <TableRow key={service._id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {service.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {service.description}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={service.category?.name || 'Sin categoría'}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatCurrency(service.basePrice)} / {service.billingUnit}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <SlaIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          {service.sla.resolutionTime.value || '-'} {service.sla.resolutionTime.unit}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {service.riskLevel === 'alto' || service.riskLevel === 'crítico' ? (
                          <Chip label="Requerida" size="small" color="warning" />
                        ) : (
                          <Chip label="No Requerida" size="small" color="default" />
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge 
                          status={service.isActive ? 'active' : 'inactive'} 
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton 
                          size="small" 
                          onClick={() => navigate(`/marketplace/services/${service._id}`)}
                          title="Ver detalles"
                        >
                          <ViewIcon />
                        </IconButton>
                        {canEditServices() && (
                          <IconButton 
                            size="small" 
                            onClick={() => navigate(`/marketplace/services/${service._id}/edit`)}
                            title="Editar"
                          >
                            <EditIcon />
                          </IconButton>
                        )}
                        {canDeleteServices() && (
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteService(service._id)}
                            title="Eliminar"
                          >
                            <DeleteIcon />
                          </IconButton>
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
            count={totalServices}
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
            count={totalServices}
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

      {services.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="textSecondary">
            {Object.values(filters).some(f => f !== '' && f !== undefined && f !== 1 && f !== 10)
              ? 'No se encontraron servicios que coincidan con los filtros.' 
              : 'No hay servicios registrados.'}
          </Typography>
        </Box>
      )}

    </Box>

    {/* Right Sidebar */}
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
      <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Sidebar Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {sidebarMode === 'filters' ? (
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
          <IconButton onClick={closeSidebar}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Sidebar Content */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
          {sidebarMode === 'filters' ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Filters Header */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2">Filtros Activos</Typography>
                  {Object.values(filters).some(f => f !== '' && f !== undefined && f !== 1 && f !== 10) && (
                    <Button
                      size="small"
                      startIcon={<ClearIcon />}
                      onClick={handleClearFilters}
                    >
                      Limpiar Todo
                    </Button>
                  )}
                </Box>
                <Divider sx={{ mb: 2 }} />
              </Box>

              {/* Search Field */}
              <TextField
                fullWidth
                placeholder="Buscar servicios..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: filters.search && (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => handleFilterChange('search', '')}
                          edge="end"
                          title="Limpiar búsqueda"
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                }}
              />

              {/* Category Filter */}
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={filters.categoryId || ''}
                  label="Categoría"
                  onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                >
                  <MenuItem value="">Todas las Categorías</MenuItem>
                  {Array.isArray(categories) && categories.map((category) => (
                    <MenuItem key={category._id || category.id} value={category._id || category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Status Filter */}
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filters.isActive === undefined ? '' : filters.isActive.toString()}
                  label="Estado"
                  onChange={(e) => handleFilterChange('isActive', e.target.value === '' ? undefined : e.target.value === 'true')}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="true">Activos</MenuItem>
                  <MenuItem value="false">Inactivos</MenuItem>
                </Select>
              </FormControl>

              {/* Billing Unit Filter */}
              <FormControl fullWidth>
                <InputLabel>Unidad de Facturación</InputLabel>
                <Select
                  value={filters.billingUnit || ''}
                  label="Unidad de Facturación"
                  onChange={(e) => handleFilterChange('billingUnit', e.target.value || undefined)}
                >
                  <MenuItem value="">Todas las Unidades</MenuItem>
                  <MenuItem value="m2">m²</MenuItem>
                  <MenuItem value="pieza">Pieza</MenuItem>
                  <MenuItem value="hora">Hora</MenuItem>
                  <MenuItem value="día">Día</MenuItem>
                  <MenuItem value="visita">Visita</MenuItem>
                  <MenuItem value="km">Kilómetro</MenuItem>
                  <MenuItem value="unidad">Unidad</MenuItem>
                </Select>
              </FormControl>

              {/* Risk Level Filter */}
              <FormControl fullWidth>
                <InputLabel>Nivel de Riesgo</InputLabel>
                <Select
                  value={filters.riskLevel || ''}
                  label="Nivel de Riesgo"
                  onChange={(e) => handleFilterChange('riskLevel', e.target.value || undefined)}
                >
                  <MenuItem value="">Todos los Niveles</MenuItem>
                  <MenuItem value="bajo">Bajo</MenuItem>
                  <MenuItem value="medio">Medio</MenuItem>
                  <MenuItem value="alto">Alto</MenuItem>
                  <MenuItem value="crítico">Crítico</MenuItem>
                </Select>
              </FormControl>

              {/* Price Range */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Precio Mín"
                  type="number"
                  value={filters.minPrice || ''}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                  fullWidth
                  slotProps={{
                    input: {
                      inputProps: { min: 0, step: 0.01 }
                    }
                  }}
                />
                <TextField
                  label="Precio Máx"
                  type="number"
                  value={filters.maxPrice || ''}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                  fullWidth
                  slotProps={{
                    input: {
                      inputProps: { min: 0, step: 0.01 }
                    }
                  }}
                />
              </Box>

              {/* Certification Filter */}
              <FormControl fullWidth>
                <InputLabel>Certificación Requerida</InputLabel>
                <Select
                  value={filters.requiresCertification === undefined ? '' : filters.requiresCertification.toString()}
                  label="Certificación Requerida"
                  onChange={(e) => handleFilterChange('requiresCertification', e.target.value === '' ? undefined : e.target.value === 'true')}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="true">Requerida</MenuItem>
                  <MenuItem value="false">No Requerida</MenuItem>
                </Select>
              </FormControl>

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
                  {services.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  servicios encontrados
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Statistics Cards */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                      <ServiceIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
                      <Box>
                        <Typography variant="h5">{stats.services?.total || 0}</Typography>
                        <Typography variant="body2" color="text.secondary">Total Servicios</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                      <CheckCircleIcon sx={{ fontSize: 32, color: 'success.main', mr: 2 }} />
                      <Box>
                        <Typography variant="h5">{stats.services?.active || 0}</Typography>
                        <Typography variant="body2" color="text.secondary">Servicios Activos</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                      <CategoryIcon sx={{ fontSize: 32, color: 'info.main', mr: 2 }} />
                      <Box>
                        <Typography variant="h5">{stats.categories?.total || 0}</Typography>
                        <Typography variant="body2" color="text.secondary">Categorías</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                      <PriceIcon sx={{ fontSize: 32, color: 'warning.main', mr: 2 }} />
                      <Box>
                        <Typography variant="h5">{formatCurrency(stats.averages?.avgPrice || 0)}</Typography>
                        <Typography variant="body2" color="text.secondary">Precio Promedio</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Risk Level Breakdown */}
                {stats.breakdown.byRiskLevel && stats.breakdown.byRiskLevel.length > 0 && (
                  <>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Servicios por Nivel de Riesgo</Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Card variant="outlined">
                        <CardContent>
                          {stats.breakdown.byRiskLevel.map((item) => (
                            <Box key={item._id} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                              <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                {item._id}
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {item.count}
                              </Typography>
                            </Box>
                          ))}
                        </CardContent>
                      </Card>
                    </Grid>
                  </>
                )}

                {/* Top Categories */}
                {stats.breakdown.byCategory && stats.breakdown.byCategory.length > 0 && (
                  <>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Principales Categorías</Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Card variant="outlined">
                        <CardContent>
                          {stats.breakdown.byCategory.slice(0, 5).map((item) => (
                            <Box key={item._id} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                              <Typography variant="body2" noWrap>
                                {item.categoryCode}
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {item.count}
                              </Typography>
                            </Box>
                          ))}
                        </CardContent>
                      </Card>
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>
          )}
        </Box>
      </Box>
    </Drawer>
  </Box>
  );
};