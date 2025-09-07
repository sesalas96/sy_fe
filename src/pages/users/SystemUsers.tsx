import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Drawer,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon,
  Add as AddIcon,
  FilterAlt as FilterIcon,
  Analytics as StatsIcon,
  Close as CloseIcon,
  Clear as ClearIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { userApi } from '../../services/userApi';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'blocked';
  company: string;
  lastLogin: Date | null;
  createdAt: Date;
  permissions: string[];
}

// Mock data - En producción vendrá del endpoint /api/users
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Admin Principal',
    email: 'admin@safety.com',
    role: UserRole.SUPER_ADMIN,
    status: 'active',
    company: 'Safety Corp',
    lastLogin: new Date(),
    createdAt: new Date('2024-01-01'),
    permissions: ['all']
  },
  {
    id: '2',
    name: 'Juan Supervisor',
    email: 'juan.supervisor@empresa.com',
    role: UserRole.CLIENT_SUPERVISOR,
    status: 'active',
    company: 'Espacios de Trabajo Cliente ABC',
    lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000),
    createdAt: new Date('2024-01-15'),
    permissions: ['view_contractors', 'manage_team', 'approve_permits']
  },
  {
    id: '3',
    name: 'María Seguridad',
    email: 'maria.safety@safety.com',
    role: UserRole.SAFETY_STAFF,
    status: 'active',
    company: 'Safety Corp',
    lastLogin: new Date(Date.now() - 30 * 60 * 1000),
    createdAt: new Date('2024-01-10'),
    permissions: ['manage_contractors', 'safety_oversight', 'training_management']
  },
  {
    id: '4',
    name: 'Carlos Aprobador',
    email: 'carlos.aprob@empresa.com',
    role: UserRole.CLIENT_APPROVER,
    status: 'active',
    company: 'Espacios de Trabajo Cliente ABC',
    lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000),
    createdAt: new Date('2024-02-01'),
    permissions: ['approve_permits', 'review_documents', 'hse_oversight']
  },
  {
    id: '5',
    name: 'Ana Personal',
    email: 'ana.personal@empresa.com',
    role: UserRole.CLIENT_STAFF,
    status: 'active',
    company: 'Espacios de Trabajo Cliente ABC',
    lastLogin: new Date(Date.now() - 3 * 60 * 60 * 1000),
    createdAt: new Date('2024-02-15'),
    permissions: ['view_own_data', 'training_access']
  },
  {
    id: '6',
    name: 'Pedro Guardia',
    email: 'pedro.guardia@security.com',
    role: UserRole.VALIDADORES_OPS,
    status: 'active',
    company: 'Security Solutions',
    lastLogin: new Date(Date.now() - 15 * 60 * 1000),
    createdAt: new Date('2024-03-01'),
    permissions: ['access_control', 'contractor_validation']
  },
  {
    id: '7',
    name: 'Luis Contratista Admin',
    email: 'luis.admin@constructora.com',
    role: UserRole.CONTRATISTA_ADMIN,
    status: 'active',
    company: 'Constructora XYZ',
    lastLogin: new Date(Date.now() - 45 * 60 * 1000),
    createdAt: new Date('2024-03-10'),
    permissions: ['manage_team', 'submit_permits', 'training_oversight']
  },
  {
    id: '8',
    name: 'Roberto Técnico',
    email: 'roberto.tecnico@constructora.com',
    role: UserRole.CONTRATISTA_SUBALTERNOS,
    status: 'active',
    company: 'Constructora XYZ',
    lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000),
    createdAt: new Date('2024-03-15'),
    permissions: ['view_assignments', 'submit_reports']
  },
  {
    id: '9',
    name: 'Elena Independiente',
    email: 'elena.indep@freelance.com',
    role: UserRole.CONTRATISTA_HUERFANO,
    status: 'active',
    company: 'Independiente',
    lastLogin: new Date(Date.now() - 4 * 60 * 60 * 1000),
    createdAt: new Date('2024-04-01'),
    permissions: ['self_management', 'submit_permits']
  }
];

export const SystemUsers: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarContent, setSidebarContent] = useState<'filters' | 'stats'>('filters');
  
  // Export state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv'>('excel');
  const [exportLoading, setExportLoading] = useState(false);
  const [exportRole, setExportRole] = useState<string>('all');
  const [exportStatus, setExportStatus] = useState<string>('all');
  const [exportCompany, setExportCompany] = useState<string>('all');
  const [exportSearch, setExportSearch] = useState('');
  const [exportLimit, setExportLimit] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simular carga de datos desde /api/users
    setTimeout(() => {
      setUsers(mockUsers);
      setFilteredUsers(mockUsers);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = users.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           u.company.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
      const matchesCompany = companyFilter === 'all' || u.company === companyFilter;
      
      return matchesSearch && matchesRole && matchesStatus && matchesCompany;
    });

    setFilteredUsers(filtered);
    setPage(0);
  }, [searchTerm, roleFilter, statusFilter, companyFilter, users]);

  const uniqueCompanies = Array.from(new Set(users.map(u => u.company))).sort();

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

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      case 'blocked': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      case 'blocked': return 'Bloqueado';
      default: return status;
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

  const clearAllFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
    setCompanyFilter('all');
  };

  const hasActiveFilters = () => {
    return searchTerm || roleFilter !== 'all' || statusFilter !== 'all' || companyFilter !== 'all';
  };

  const openSidebar = (content: 'filters' | 'stats') => {
    setSidebarContent(content);
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const getStats = () => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'active').length;
    const inactiveUsers = users.filter(u => u.status === 'inactive').length;
    const blockedUsers = users.filter(u => u.status === 'blocked').length;
    
    const roleStats = Object.values(UserRole).map(role => ({
      role,
      count: users.filter(u => u.role === role).length,
      label: getRoleLabel(role)
    })).filter(stat => stat.count > 0);
    
    const companyStats = uniqueCompanies.map(company => ({
      company,
      count: users.filter(u => u.company === company).length
    }));
    
    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      blockedUsers,
      roleStats,
      companyStats
    };
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

  const getRoleDisplay = (role: UserRole): string => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'Super Administrador';
      case UserRole.SAFETY_STAFF:
        return 'Personal de Seguridad';
      case UserRole.CLIENT_SUPERVISOR:
        return 'Supervisor de Cliente';
      case UserRole.CLIENT_APPROVER:
        return 'Verificador';
      case UserRole.CLIENT_STAFF:
        return 'Personal de Cliente';
      case UserRole.VALIDADORES_OPS:
        return 'Validador';
      case UserRole.CONTRATISTA_ADMIN:
        return 'Admin. Contratista';
      case UserRole.CONTRATISTA_SUBALTERNOS:
        return 'Técnico Contratista';
      case UserRole.CONTRATISTA_HUERFANO:
        return 'Contratista Independiente';
      default:
        return role;
    }
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
        company: exportCompany !== 'all' ? exportCompany : undefined,
        limit: exportLimit ? Number(exportLimit) : undefined,
        format: exportFormat
      };
      
      const blob = await userApi.exportUsers(filters);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = `usuarios_sistema_${new Date().toISOString().split('T')[0]}.${exportFormat === 'csv' ? 'csv' : 'xlsx'}`;
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
    } catch (err) {
      setError('Error al exportar los usuarios');
    } finally {
      setExportLoading(false);
    }
  };

  // Solo SUPER_ADMIN, SAFETY_STAFF y CLIENT_SUPERVISOR pueden acceder
  if (user?.role !== UserRole.SUPER_ADMIN && user?.role !== UserRole.SAFETY_STAFF && user?.role !== UserRole.CLIENT_SUPERVISOR) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tiene permisos para acceder a esta sección.
        </Alert>
      </Box>
    );
  }

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
              Usuarios del Sistema
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Administre todos los usuarios del sistema de seguridad
            </Typography>
          </Box>
          
          {/* Desktop Actions - Primary */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
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
          display: 'grid',
          gridTemplateColumns: { 
            xs: isMobile ? '1fr 1fr 1fr' : '1fr',
            sm: 'repeat(4, 1fr)',
            md: !isMobile ? 'repeat(3, minmax(150px, 200px))' : 'repeat(4, 1fr)'
          },
          gap: { xs: 1, sm: 2 },
          ...(isMobile && { width: '100%' })
        }}>
          {/* Mobile Primary Action */}
          {isMobile && (
            <Button
              variant="contained"
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
                Nuevo
              </Typography>
            </Button>
          )}

          {/* Secondary Actions - Both Mobile and Desktop */}
          <Button
            variant="outlined"
            onClick={() => openSidebar('stats')}
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
            <StatsIcon sx={{ 
              mb: { xs: 0.5, sm: 0 }, 
              mr: { xs: 0, sm: 1 },
              fontSize: { xs: 24, sm: 20 },
              color: 'primary.main'
            }} />
            <Typography variant={isMobile ? "caption" : "button"} sx={{ fontWeight: { xs: 600, sm: 500 } }}>
              {isMobile ? 'Estad.' : 'Estadísticas'}
            </Typography>
          </Button>
          
          <Button
            variant="outlined"
            onClick={() => openSidebar('filters')}
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
            <FilterIcon sx={{ 
              mb: { xs: 0.5, sm: 0 }, 
              mr: { xs: 0, sm: 1 },
              fontSize: { xs: 24, sm: 20 },
              color: 'primary.main'
            }} />
            <Typography variant={isMobile ? "caption" : "button"} sx={{ fontWeight: { xs: 600, sm: 500 } }}>
              Filtros
            </Typography>
            {hasActiveFilters() && (
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
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}


      {isMobile ? (
        // Mobile Card View
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredUsers
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((userItem) => (
            <Card key={userItem.id} sx={{ position: 'relative' }}>
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
                      {getInitials(userItem.name)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight="medium" sx={{ mb: 0.5 }}>
                        {userItem.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {userItem.email}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={getRoleLabel(userItem.role)}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                        <Chip
                          label={getStatusLabel(userItem.status)}
                          color={getStatusColor(userItem.status) as any}
                          size="small"
                          icon={userItem.status === 'active' ? <ActiveIcon /> : undefined}
                        />
                      </Box>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Ver detalles">
                      <IconButton
                        size="small"
                        onClick={() => handleViewUser(userItem)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar usuario">
                      <IconButton size="small" color="primary">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Bloquear usuario">
                      <IconButton size="small" color="error">
                        <BlockIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                
                <Grid container spacing={1} sx={{ fontSize: '0.875rem' }}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Espacios de Trabajo
                    </Typography>
                    <Typography variant="body2">
                      {userItem.company}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Último Acceso
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(userItem.lastLogin)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">
                      Fecha de Registro
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(userItem.createdAt)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        // Desktop Table View
        <Card>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Espacios de Trabajo</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Último Acceso</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((userItem) => (
                    <TableRow key={userItem.id} hover>
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
                            {getInitials(userItem.name)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="medium">
                              {userItem.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {userItem.email}
                            </Typography>
                          </Box>
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
                        <Typography variant="body2">
                          {userItem.company}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(userItem.status)}
                          color={getStatusColor(userItem.status) as any}
                          size="small"
                          icon={userItem.status === 'active' ? <ActiveIcon /> : undefined}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(userItem.lastLogin)}
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
                          <IconButton size="small" color="primary">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Bloquear usuario">
                          <IconButton size="small" color="error">
                            <BlockIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
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
      )}

      {/* Mobile Pagination */}
      {isMobile && (
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

      {filteredUsers.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="textSecondary">
            {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' || companyFilter !== 'all'
              ? 'No se encontraron usuarios que coincidan con los filtros.' 
              : 'No hay usuarios registrados.'}
          </Typography>
        </Box>
      )}

      {/* Diálogo de Detalles del Usuario */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Detalles del Usuario
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar
                      sx={{ 
                        width: 80, 
                        height: 80, 
                        mr: 2, 
                        bgcolor: 'primary.main',
                        fontSize: '1.5rem'
                      }}
                    >
                      {getInitials(selectedUser.name)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {selectedUser.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedUser.email}
                      </Typography>
                      <Chip
                        label={getRoleLabel(selectedUser.role)}
                        size="small"
                        color="primary"
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Información General
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Espacios de Trabajo:</strong> {selectedUser.company}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Estado:</strong> {getStatusLabel(selectedUser.status)}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Último acceso:</strong> {formatDate(selectedUser.lastLogin)}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Fecha de registro:</strong> {formatDate(selectedUser.createdAt)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Permisos del Usuario
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedUser.permissions.map((permission, index) => (
                      <Chip
                        key={index}
                        label={permission}
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cerrar
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
                  placeholder="Buscar por nombre, email o espacio de trabajo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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

                {/* Role Filter */}
                <FormControl fullWidth>
                  <InputLabel>Filtrar por Rol</InputLabel>
                  <Select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    label="Filtrar por Rol"
                  >
                    <MenuItem value="all">Todos los roles</MenuItem>
                    <MenuItem value={UserRole.SUPER_ADMIN}>Administrador</MenuItem>
                    <MenuItem value={UserRole.SAFETY_STAFF}>Personal de Safety</MenuItem>
                    <MenuItem value={UserRole.CLIENT_SUPERVISOR}>Supervisores</MenuItem>
                    <MenuItem value={UserRole.CLIENT_APPROVER}>Verificadores</MenuItem>
                    <MenuItem value={UserRole.CLIENT_STAFF}>Internos</MenuItem>
                    <MenuItem value={UserRole.VALIDADORES_OPS}>Verificadores</MenuItem>
                    <MenuItem value={UserRole.CONTRATISTA_ADMIN}>Contratista Admin</MenuItem>
                    <MenuItem value={UserRole.CONTRATISTA_SUBALTERNOS}>Contratista</MenuItem>
                    <MenuItem value={UserRole.CONTRATISTA_HUERFANO}>Independiente</MenuItem>
                  </Select>
                </FormControl>

                {/* Status Filter */}
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
                    <MenuItem value="blocked">Bloqueados</MenuItem>
                  </Select>
                </FormControl>

                {/* Company Filter */}
                <FormControl fullWidth>
                  <InputLabel>Filtrar por Espacios de Trabajo</InputLabel>
                  <Select
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    label="Filtrar por Espacios de Trabajo"
                  >
                    <MenuItem value="all">Todos los espacios</MenuItem>
                    {uniqueCompanies.map((company) => (
                      <MenuItem key={company} value={company}>
                        {company}
                      </MenuItem>
                    ))}
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
                    {filteredUsers.length}
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
              {(() => {
                const stats = getStats();
                return (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <Card variant="outlined">
                        <CardContent sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                          <PeopleIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
                          <Box>
                            <Typography variant="h5">{stats.totalUsers}</Typography>
                            <Typography variant="body2" color="text.secondary">Total Usuarios</Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Card variant="outlined">
                        <CardContent sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                          <ActiveIcon sx={{ fontSize: 32, color: 'success.main', mr: 2 }} />
                          <Box>
                            <Typography variant="h5">{stats.activeUsers}</Typography>
                            <Typography variant="body2" color="text.secondary">Usuarios Activos</Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Card variant="outlined">
                        <CardContent sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                          <BlockIcon sx={{ fontSize: 32, color: 'warning.main', mr: 2 }} />
                          <Box>
                            <Typography variant="h5">{stats.inactiveUsers}</Typography>
                            <Typography variant="body2" color="text.secondary">Usuarios Inactivos</Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Card variant="outlined">
                        <CardContent sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                          <BlockIcon sx={{ fontSize: 32, color: 'error.main', mr: 2 }} />
                          <Box>
                            <Typography variant="h5">{stats.blockedUsers}</Typography>
                            <Typography variant="body2" color="text.secondary">Usuarios Bloqueados</Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Role Distribution */}
                    {stats.roleStats.length > 0 && (
                      <>
                        <Grid size={{ xs: 12 }}>
                          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Distribución por Rol</Typography>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Card variant="outlined">
                            <CardContent>
                              {stats.roleStats.map((roleStat) => (
                                <Box key={roleStat.role} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body2">
                                    {roleStat.label}
                                  </Typography>
                                  <Typography variant="body2" fontWeight="medium">
                                    {roleStat.count}
                                  </Typography>
                                </Box>
                              ))}
                            </CardContent>
                          </Card>
                        </Grid>
                      </>
                    )}

                    {/* Company Distribution */}
                    {stats.companyStats.length > 0 && (
                      <>
                        <Grid size={{ xs: 12 }}>
                          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Usuarios por Espacio de Trabajo</Typography>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Card variant="outlined">
                            <CardContent>
                              {stats.companyStats.slice(0, 5).map((companyStat) => (
                                <Box key={companyStat.company} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body2" noWrap sx={{ maxWidth: '200px' }}>
                                    {companyStat.company}
                                  </Typography>
                                  <Typography variant="body2" fontWeight="medium">
                                    {companyStat.count}
                                  </Typography>
                                </Box>
                              ))}
                            </CardContent>
                          </Card>
                        </Grid>
                      </>
                    )}
                  </Grid>
                );
              })()}
            </>
          )}
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
            <Typography>Exportar Usuarios del Sistema</Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert severity="info">
              Exporta los usuarios del sistema aplicando filtros opcionales.
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
                  {Object.values(UserRole).map(role => (
                    <MenuItem key={role} value={role}>
                      {getRoleDisplay(role)}
                    </MenuItem>
                  ))}
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
                  <MenuItem value="blocked">Bloqueado</MenuItem>
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
                  {uniqueCompanies.map(company => (
                    <MenuItem key={company} value={company}>
                      {company}
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
            startIcon={exportLoading ? <CloseIcon /> : <DownloadIcon />}
          >
            {exportLoading ? 'Exportando...' : 'Exportar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};