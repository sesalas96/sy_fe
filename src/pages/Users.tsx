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
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

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

// Mock data - en producción esto vendría de una API
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
    },
    {
      id: '10',
      name: 'Usuario Inactivo',
      email: 'inactivo@test.com',
      role: UserRole.CLIENT_STAFF,
      status: 'inactive',
      company: 'Test Company',
      lastLogin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date('2024-01-20'),
      permissions: ['view_own_data']
    }
  ];

export const Users: React.FC = () => {
  const { user } = useAuth();
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

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      let availableUsers = mockUsers;
      
      // Filtrar usuarios según el scope del rol actual
      if (user?.role === UserRole.CLIENT_SUPERVISOR || user?.role === UserRole.CONTRATISTA_ADMIN) {
        // Solo mostrar usuarios de la misma empresa y subordinados
        const userCompanyName = typeof user.company === 'string' ? user.company : user.company?.name;
        availableUsers = mockUsers.filter(u => {
          // Mostrar usuarios de la misma empresa
          if (u.company === userCompanyName) {
            return true;
          }
          return false;
        });
      }
      // SUPER_ADMIN y SAFETY_STAFF ven todos los usuarios
      // No necesitan filtrado adicional
      
      setUsers(availableUsers);
      setFilteredUsers(availableUsers);
      setLoading(false);
    }, 1000);
  }, [user]);

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
    setPage(0); // Reset to first page when filtering
  }, [searchTerm, roleFilter, statusFilter, companyFilter, users]);

  // Obtener lista única de empresas para el filtro
  const uniqueCompanies = Array.from(new Set(users.map(u => u.company))).sort();

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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

  const isAuthorized = user?.role === UserRole.SUPER_ADMIN || 
                        user?.role === UserRole.SAFETY_STAFF ||
                        user?.role === UserRole.CLIENT_SUPERVISOR || 
                        user?.role === UserRole.CONTRATISTA_ADMIN;

  if (!isAuthorized) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tiene permisos para acceder a esta sección.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {user?.role === UserRole.CONTRATISTA_ADMIN ? 'Mi Equipo' : 'Gestión de Usuarios'}
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.SAFETY_STAFF) && 'Administre todos los usuarios del sistema'}
        {user?.role === UserRole.CLIENT_SUPERVISOR && 'Consulte los usuarios de su empresa y subordinados (solo lectura)'}
        {user?.role === UserRole.CONTRATISTA_ADMIN && 'Gestione los miembros de su equipo de trabajo'}
      </Typography>

      {/* Filtros y Búsqueda */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                placeholder="Buscar por nombre, email o empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2.25 }}>
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
            </Grid>
            <Grid size={{ xs: 12, md: 2.25 }}>
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
            </Grid>
            <Grid size={{ xs: 12, md: 2.25 }}>
              <FormControl fullWidth>
                <InputLabel>Filtrar por Espacios de Trabajo</InputLabel>
                <Select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  label="Filtrar por Espacios de Trabajo"
                >
                  <MenuItem value="all">Todas las empresas</MenuItem>
                  {uniqueCompanies.map((company) => (
                    <MenuItem key={company} value={company}>
                      {company}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 2.25 }}>
              <Typography variant="body2" color="text.secondary" align="center">
                {filteredUsers.length} usuarios encontrados
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabla de Usuarios */}
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography>Cargando usuarios...</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers
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
                        {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.SAFETY_STAFF) && (
                          <>
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
                          </>
                        )}
                        {(user?.role === UserRole.CLIENT_SUPERVISOR || user?.role === UserRole.CONTRATISTA_ADMIN) && (
                          <Tooltip title="Solo lectura - Sin permisos de edición">
                            <IconButton size="small" disabled>
                              <EditIcon />
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
                  <Typography variant="body2" paragraph>
                    <strong>Espacios de Trabajo:</strong> {selectedUser.company}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Estado:</strong> {getStatusLabel(selectedUser.status)}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Último acceso:</strong> {formatDate(selectedUser.lastLogin)}
                  </Typography>
                  <Typography variant="body2" paragraph>
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
    </Box>
  );
};