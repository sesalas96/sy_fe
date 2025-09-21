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
  TablePagination,
  CircularProgress,
  Drawer,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pause as PauseIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  Analytics as StatsIcon,
  Close as CloseIcon,
  ClearAll as ClearAllIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Company, UserRole } from '../../types';
import { companyApi } from '../../services/companyApi';
import { useAuth } from '../../contexts/AuthContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';

export const Companies: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  usePageTitle('Espacios de Trabajos', 'Gestión de empresas del sistema');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [industryLoading, setIndustryLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [totalCount, setTotalCount] = useState(0);
  
  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [industryFilter, setIndustryFilter] = useState('');
  
  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  
  // Stats
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    byIndustry?: Record<string, number>;
  }>({ total: 0, active: 0, inactive: 0, suspended: 0 });

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarContent, setSidebarContent] = useState<'filters' | 'stats'>('filters');

  useEffect(() => {
    loadCompanies(page, rowsPerPage);
    loadStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced filter effect for search
  useEffect(() => {
    if (searchTerm) {
      setSearchLoading(true);
    }
    
    const timeoutId = setTimeout(() => {
      applyFilters();
    }, 500); // 500ms debounce delay

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Debounced filter effect for industry
  useEffect(() => {
    if (industryFilter) {
      setIndustryLoading(true);
    }
    
    const timeoutId = setTimeout(() => {
      applyFilters();
    }, 500); // 500ms debounce delay

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industryFilter]);

  // Immediate effect for non-text filters and pagination
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page, rowsPerPage]);

  const loadCompanies = async (pageNum = 0, pageSize = 10) => {
    try {
      setLoading(true);
      const params = {
        page: pageNum + 1, // API expects 1-based pagination
        limit: pageSize
      };
      
      const response = await companyApi.getAll(params);
      if (response.success) {
        const companiesData = response.data || [];
        
        // Filter out "Particular" company
        const filteredCompanies = companiesData.filter((company: Company) => 
          company.name.toLowerCase() !== 'particular'
        );
        
        setCompanies(filteredCompanies);
        
        if (response.pagination) {
          setTotalCount(response.pagination.total || 0);
        } else {
          setTotalCount(filteredCompanies.length || 0);
        }

        // Calcular estadísticas locales si no tenemos datos del API
        if (stats.total === 0 && filteredCompanies.length > 0) {
          const localStats = {
            total: filteredCompanies.length,
            active: filteredCompanies.filter((c: Company) => c.status === 'active').length,
            inactive: filteredCompanies.filter((c: Company) => c.status === 'inactive').length,
            suspended: filteredCompanies.filter((c: Company) => c.status === 'suspended').length
          };
          setStats(prev => ({ ...prev, ...localStats }));
        }
      }
    } catch (err) {
      setError('Error al cargar las empresas');
      console.error('Error loading companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await companyApi.getGeneralStats();
      if (response.success && response.data) {
        setStats({
          total: response.data.total || 0,
          active: response.data.active || 0,
          inactive: response.data.inactive || 0,
          suspended: response.data.suspended || 0,
          byIndustry: response.data.byIndustry || {}
        });
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const applyFilters = async () => {
    try {
      const params: any = {
        page: page + 1, // API expects 1-based pagination
        limit: rowsPerPage
      };
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      if (industryFilter) {
        params.industry = industryFilter;
      }

      const response = await companyApi.getAll(params);
      if (response.success) {
        const companiesData = response.data || [];
        
        // Filter out "Particular" company
        const filteredCompanies = companiesData.filter((company: Company) => 
          company.name.toLowerCase() !== 'particular'
        );
        
        setCompanies(filteredCompanies);
        
        if (response.pagination) {
          setTotalCount(response.pagination.total || 0);
        } else {
          setTotalCount(filteredCompanies.length || 0);
        }
      }
    } catch (err) {
      console.error('Error applying filters:', err);
    } finally {
      setSearchLoading(false);
      setIndustryLoading(false);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset to first page when searching
  };

  const handleStatusFilter = (event: any) => {
    setStatusFilter(event.target.value);
    setPage(0); // Reset to first page when filtering
  };

  const handleIndustryFilter = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIndustryFilter(event.target.value);
    setPage(0); // Reset to first page when filtering
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
    setPage(0); // Reset to first page when changing page size
    
    // Scroll up to show the new page content
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setPage(0);
    setSearchLoading(false);
  };

  const handleClearIndustryFilter = () => {
    setIndustryFilter('');
    setPage(0);
    setIndustryLoading(false);
  };

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setIndustryFilter('');
    setPage(0);
    setSearchLoading(false);
    setIndustryLoading(false);
  };

  const hasActiveFilters = () => {
    return searchTerm || statusFilter !== 'all' || industryFilter;
  };

  const openSidebar = (content: 'filters' | 'stats') => {
    setSidebarContent(content);
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleEdit = (company: Company) => {
    navigate(`/companies/${company._id || company.id}/edit`);
  };

  const handleView = (company: Company) => {
    navigate(`/companies/${company._id || company.id}`);
  };

  const handleDeleteClick = (company: Company) => {
    setCompanyToDelete(company);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (companyToDelete) {
      try {
        await companyApi.delete(companyToDelete._id || companyToDelete.id || '');
        await loadCompanies(page, rowsPerPage);
        await loadStats();
        setDeleteDialogOpen(false);
        setCompanyToDelete(null);
      } catch (err) {
        console.error('Error deleting company:', err);
        setError('Error al eliminar la empresa');
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setCompanyToDelete(null);
  };

  const handleAddNew = () => {
    navigate('/companies/new');
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-CR');
  };

  const getStatusChip = (status: 'active' | 'inactive' | 'suspended') => {
    const statusConfig = {
      active: { label: 'Activa', color: 'success' as const, icon: <CheckCircleIcon /> },
      inactive: { label: 'Inactiva', color: 'default' as const, icon: <CancelIcon /> },
      suspended: { label: 'Suspendida', color: 'warning' as const, icon: <PauseIcon /> }
    };

    const config = statusConfig[status];
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        icon={config.icon}
      />
    );
  };


  const canManageCompanies = () => {
    return hasRole([UserRole.SUPER_ADMIN, UserRole.SAFETY_STAFF]);
  };

  if (loading) {
    return <SkeletonLoader variant={isMobile ? 'cards' : 'table'} rows={rowsPerPage} />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant={isMobile ? 'h5' : 'h4'}>
          <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Espacios de Trabajos
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size={isMobile ? 'small' : 'medium'}
            startIcon={!isXs ? <FilterIcon /> : undefined}
            onClick={() => openSidebar('filters')}
            color={hasActiveFilters() ? 'primary' : 'inherit'}
          >
            {isXs ? 'Filtros' : `Filtros ${hasActiveFilters() ? `(${[searchTerm, statusFilter !== 'all', industryFilter].filter(Boolean).length})` : ''}`}
          </Button>
          <Button
            variant="outlined"
            size={isMobile ? 'small' : 'medium'}
            startIcon={!isXs ? <StatsIcon /> : undefined}
            onClick={() => openSidebar('stats')}
          >
            {isXs ? 'Stats' : 'Estadísticas'}
          </Button>
          {canManageCompanies() && (
            <Button
              variant="contained"
              size={isMobile ? 'small' : 'medium'}
              startIcon={!isXs ? <AddIcon /> : undefined}
              onClick={handleAddNew}
            >
              {isXs ? 'Agregar' : 'Agregar Espacio de Trabajo'}
            </Button>
          )}
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
          {companies.map((company) => (
            <Card key={company._id || company.id} sx={{ position: 'relative' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="medium" sx={{ mb: 0.5 }}>
                      {company.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {company.address}
                    </Typography>
                    {getStatusChip(company.status)}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleView(company)}
                      title="Ver detalles"
                    >
                      <ViewIcon />
                    </IconButton>
                    {canManageCompanies() && (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(company)}
                          title="Editar"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(company)}
                          title="Eliminar"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </>
                    )}
                  </Box>
                </Box>
                
                <Grid container spacing={1} sx={{ fontSize: '0.875rem' }}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      RUC/ID Fiscal
                    </Typography>
                    <Typography variant="body2">
                      {company.ruc || company.taxId || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Industria
                    </Typography>
                    <Typography variant="body2">
                      {company.industry || 'No especificada'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Empleados
                    </Typography>
                    <Typography variant="body2">
                      {company.employeeCount || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Contacto
                    </Typography>
                    <Typography variant="body2">
                      {company.contactPerson?.name || 'No especificado'}
                    </Typography>
                    {company.contactPerson?.position && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {company.contactPerson.position}
                      </Typography>
                    )}
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">
                      Fecha de Registro
                    </Typography>
                    <Typography variant="body2">
                      {company.createdAt ? formatDate(company.createdAt) : 'N/A'}
                    </Typography>
                  </Grid>
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
              <TableCell>Espacio de Trabajo</TableCell>
              <TableCell>Identificación Fiscal</TableCell>
              <TableCell>Industria</TableCell>
              <TableCell>Contacto</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Fecha Registro</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {companies.map((company) => (
              <TableRow key={company._id || company.id} hover>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {company.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {company.address}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{company.ruc || company.taxId}</TableCell>
                <TableCell>{company.industry || 'No especificada'}</TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      {company.contactPerson?.name || 'No especificado'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {company.contactPerson?.position || ''}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{getStatusChip(company.status)}</TableCell>
                <TableCell>{company.createdAt ? formatDate(company.createdAt) : 'N/A'}</TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => handleView(company)}
                    title="Ver detalles"
                  >
                    <ViewIcon />
                  </IconButton>
                  {canManageCompanies() && (
                    <>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(company)}
                        title="Editar"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(company)}
                        title="Eliminar"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
          
          {/* Pagination */}
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

      {companies.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="textSecondary">
            {searchTerm || statusFilter !== 'all' || industryFilter 
              ? 'No se encontraron empresas que coincidan con los filtros.' 
              : 'No hay empresas registradas.'}
          </Typography>
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar la empresa "{companyToDelete?.name}"?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer y eliminará todos los datos asociados.
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
                {/* Search Filter */}
                <TextField
                  fullWidth
                  label="Búsqueda"
                  placeholder="Buscar empresas..."
                  value={searchTerm}
                  onChange={handleSearch}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                      endAdornment: (searchTerm || searchLoading) && (
                        <InputAdornment position="end">
                          {searchLoading ? (
                            <CircularProgress size={16} />
                          ) : searchTerm && (
                            <IconButton
                              size="small"
                              onClick={handleClearSearch}
                              edge="end"
                              title="Limpiar búsqueda"
                            >
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          )}
                        </InputAdornment>
                      ),
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
                    <MenuItem value="active">Activas</MenuItem>
                    <MenuItem value="inactive">Inactivas</MenuItem>
                    <MenuItem value="suspended">Suspendidas</MenuItem>
                  </Select>
                </FormControl>

                {/* Industry Filter */}
                <TextField
                  fullWidth
                  label="Industria"
                  placeholder="Buscar por industria..."
                  value={industryFilter}
                  onChange={handleIndustryFilter}
                  slotProps={{
                    input: {
                      endAdornment: (industryFilter || industryLoading) && (
                        <InputAdornment position="end">
                          {industryLoading ? (
                            <CircularProgress size={16} />
                          ) : industryFilter && (
                            <IconButton
                              size="small"
                              onClick={handleClearIndustryFilter}
                              edge="end"
                              title="Limpiar filtro de industria"
                            >
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          )}
                        </InputAdornment>
                      ),
                    }
                  }}
                />

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
                    {companies.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    empresas encontradas
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
                      <BusinessIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
                      <Box>
                        <Typography variant="h5">{stats.total}</Typography>
                        <Typography variant="body2" color="text.secondary">Total Espacios de Trabajos</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                      <CheckCircleIcon sx={{ fontSize: 32, color: 'success.main', mr: 2 }} />
                      <Box>
                        <Typography variant="h5">{stats.active}</Typography>
                        <Typography variant="body2" color="text.secondary">Espacios de Trabajos Activas</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                      <CancelIcon sx={{ fontSize: 32, color: 'default', mr: 2 }} />
                      <Box>
                        <Typography variant="h5">{stats.inactive}</Typography>
                        <Typography variant="body2" color="text.secondary">Espacios de Trabajos Inactivas</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                      <PauseIcon sx={{ fontSize: 32, color: 'warning.main', mr: 2 }} />
                      <Box>
                        <Typography variant="h5">{stats.suspended}</Typography>
                        <Typography variant="body2" color="text.secondary">Espacios de Trabajos Suspendidas</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Industry Distribution */}
                {stats.byIndustry && Object.keys(stats.byIndustry).length > 0 && (
                  <>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Distribución por Industria</Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Card variant="outlined">
                        <CardContent>
                          {Object.entries(stats.byIndustry)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 10)
                            .map(([industry, count]) => (
                              <Box key={industry} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">
                                  {industry || 'No especificada'}
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
    </Box>
  );
};