import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  Clear as ClearIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { companyApi } from '../../services/companyApi';
import { UserRole } from '../../types';

interface CompanyUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  departments: Array<{
    _id: string;
    name: string;
    code: string;
  }>;
  isActive: boolean;
  status: string;
  phone?: string;
  cedula?: string;
}

interface CompanyUsersProps {
  companyId: string;
  companyName: string;
}

const CompanyUsers: React.FC<CompanyUsersProps> = ({ companyId, companyName }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  useEffect(() => {
    loadCompanyUsers();
  }, [companyId]);
  
  const loadCompanyUsers = async () => {
    try {
      setLoading(true);
      const response = await companyApi.getById(companyId);
      
      if (response.success && response.data?.users) {
        setUsers(response.data.users);
      } else {
        setError('No se pudieron cargar los usuarios');
      }
    } catch (err) {
      console.error('Error loading company users:', err);
      setError('Error al cargar los usuarios de la empresa');
    } finally {
      setLoading(false);
    }
  };
  
  const getRoleLabel = (role: string): string => {
    const roleLabels: Record<string, string> = {
      [UserRole.SUPER_ADMIN]: 'Administrador',
      [UserRole.SAFETY_STAFF]: 'Personal de Safety',
      [UserRole.CLIENT_SUPERVISOR]: 'Supervisor',
      [UserRole.CLIENT_APPROVER]: 'Verificador',
      [UserRole.CLIENT_STAFF]: 'Interno',
      [UserRole.VALIDADORES_OPS]: 'Validador Operaciones',
      [UserRole.CONTRATISTA_ADMIN]: 'Contratista Admin',
      [UserRole.CONTRATISTA_SUBALTERNOS]: 'Contratista Subalterno',
      [UserRole.CONTRATISTA_HUERFANO]: 'Contratista Particular',
      'client_admin': 'Cliente Admin',
      'admin': 'Admin'
    };
    return roleLabels[role] || role;
  };
  
  const getStatusChip = (user: CompanyUser) => {
    const isActive = user.isActive;
    return (
      <Chip
        label={isActive ? 'Activo' : 'Inactivo'}
        color={isActive ? 'success' : 'default'}
        size="small"
        icon={isActive ? <CheckCircleIcon /> : <CancelIcon />}
      />
    );
  };
  
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      (user.cedula && user.cedula.toLowerCase().includes(searchLower)) ||
      (user.phone && user.phone.includes(searchTerm))
    );
  });
  
  const paginatedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }
  
  return (
    <Box>
      {/* Header con búsqueda */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Usuarios de {companyName} ({users.length} total)
        </Typography>
        
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar por nombre, email, cédula o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ maxWidth: 600, mt: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm('')}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Box>
      
      {isMobile ? (
        // Vista móvil - Cards
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {paginatedUsers.map((user) => (
            <Card key={user._id}>
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {user.firstName} {user.lastName}
                  </Typography>
                  {getStatusChip(user)}
                </Box>
                
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="body2">{user.email}</Typography>
                    </Box>
                  </Grid>
                  
                  {user.phone && (
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">{user.phone}</Typography>
                      </Box>
                    </Grid>
                  )}
                  
                  {user.cedula && (
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BadgeIcon fontSize="small" color="action" />
                        <Typography variant="body2">{user.cedula}</Typography>
                      </Box>
                    </Grid>
                  )}
                  
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Rol:</Typography>
                    <Typography variant="body2">{getRoleLabel(user.role)}</Typography>
                  </Grid>
                  
                  {user.departments.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Departamentos:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {user.departments.map((dept) => (
                          <Chip
                            key={dept._id}
                            label={`${dept.name} (${dept.code})`}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        // Vista desktop - Tabla
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Cédula</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Departamentos</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow key={user._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {user.firstName} {user.lastName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{user.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {user.cedula || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {user.phone || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getRoleLabel(user.role)}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>
                    {user.departments.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {user.departments.slice(0, 2).map((dept) => (
                          <Chip
                            key={dept._id}
                            label={`${dept.name} (${dept.code})`}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {user.departments.length > 2 && (
                          <Tooltip 
                            title={
                              <Box>
                                {user.departments.slice(2).map((dept) => (
                                  <Typography key={dept._id} variant="body2">
                                    • {dept.name} ({dept.code})
                                  </Typography>
                                ))}
                              </Box>
                            }
                          >
                            <Typography variant="caption" color="text.secondary">
                              +{user.departments.length - 2} más
                            </Typography>
                          </Tooltip>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Sin departamentos
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{getStatusChip(user)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredUsers.length}
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
      
      {filteredUsers.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            {searchTerm 
              ? 'No se encontraron usuarios que coincidan con la búsqueda.'
              : 'No hay usuarios registrados en esta empresa.'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CompanyUsers;