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
  Toolbar,
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
  Clear as ClearIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Company, UserRole } from '../types';
import { companyApi } from '../services/companyApi';
import { useAuth } from '../contexts/AuthContext';

export const Companies: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
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
  }>({ total: 0, active: 0, inactive: 0, suspended: 0 });

  useEffect(() => {
    loadCompanies(page, rowsPerPage);
    loadStats();
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
      const response = await companyApi.getAll();
      if (response.success && response.data) {
        const filteredCompanies = response.data.filter((company: Company) => 
          company.name.toLowerCase() !== 'particular'
        );
        const total = filteredCompanies.length;
        const active = filteredCompanies.filter((c: Company) => c.status === 'active').length;
        const inactive = filteredCompanies.filter((c: Company) => c.status === 'inactive').length;
        const suspended = filteredCompanies.filter((c: Company) => c.status === 'suspended').length;
        
        setStats({ total, active, inactive, suspended });
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
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page when changing page size
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setPage(0);
    setSearchLoading(false);
  };

  const handleClearStatusFilter = () => {
    setStatusFilter('all');
    setPage(0);
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
    return hasRole([UserRole.SAFETY_STAFF]);
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Cargando empresas...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Espacios de Trabajos
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total
                  </Typography>
                  <Typography variant="h4">
                    {stats.total}
                  </Typography>
                </Box>
                <BusinessIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Activas
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {stats.active}
                  </Typography>
                </Box>
                <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Inactivas
                  </Typography>
                  <Typography variant="h4" color="text.secondary">
                    {stats.inactive}
                  </Typography>
                </Box>
                <CancelIcon color="disabled" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Suspendidas
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {stats.suspended}
                  </Typography>
                </Box>
                <PauseIcon color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Actions */}
      <Paper sx={{ mb: 2 }}>
        <Toolbar sx={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Buscar empresas..."
              value={searchTerm}
              onChange={handleSearch}
              size="small"
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
              sx={{ minWidth: 250 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
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
            
            <TextField
              placeholder="Industria..."
              value={industryFilter}
              onChange={handleIndustryFilter}
              size="small"
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
              sx={{ minWidth: 150 }}
            />
            
            {/* Clear All Filters Button */}
            {(searchTerm || statusFilter !== 'all' || industryFilter) && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<ClearIcon />}
                onClick={handleClearAllFilters}
                color="secondary"
              >
                Limpiar Filtros
              </Button>
            )}
          </Box>
          
          {canManageCompanies() && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddNew}
            >
              Agregar Espacio de Trabajo
            </Button>
          )}
        </Toolbar>
      </Paper>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Espacios de Trabajo</TableCell>
              <TableCell>Identificación Fiscal</TableCell>
              <TableCell>Industria</TableCell>
              <TableCell>Empleados</TableCell>
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
                <TableCell>{company.taxId}</TableCell>
                <TableCell>{company.industry}</TableCell>
                <TableCell>{company.userCount}</TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      {company.contactPerson?.name || 'No especificado'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {company.contactPerson?.position || 'No especificado'}
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
    </Box>
  );
};