import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Chip,
  Avatar,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Paper,
  Fade,
  Zoom,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  School as SchoolIcon,
  Visibility as VisibilityIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Security as SecurityIcon,
  Badge as BadgeIcon,
  Business as BusinessIcon,
  ArrowBack as ArrowBackIcon,
  Clear as ClearIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

interface ContractorInfo {
  _id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  cedula: string;
  email?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended' | 'activo' | 'inactivo' | 'baja';
  company?: {
    _id: string;
    name: string;
    industry?: string;
  };
  polizaINS?: {
    number: string;
    expiryDate: string;
  } | string;
  ordenPatronal?: {
    number?: string;
    expiryDate?: string;
  } | string;
  supervisor?: {
    firstName: string;
    lastName: string;
  };
  certifications?: Array<{
    name: string;
    status: string;
  }>;
  courses?: Array<{
    courseName: string;
    status: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export const ContractorSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [contractors, setContractors] = useState<ContractorInfo[]>([]);
  const [selectedContractor, setSelectedContractor] = useState<ContractorInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accessDialogOpen, setAccessDialogOpen] = useState(false);
  const [accessType] = useState<'entry' | 'exit'>('entry');
  const [accessArea, setAccessArea] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const getContractorName = (contractor: ContractorInfo): string => {
    if (contractor.fullName) return contractor.fullName;
    if (contractor.firstName && contractor.lastName) {
      return `${contractor.firstName} ${contractor.lastName}`;
    }
    return contractor.firstName || contractor.lastName || 'Sin nombre';
  };

  const getPolizaNumber = (contractor: ContractorInfo): string | null => {
    if (!contractor.polizaINS) return null;
    if (typeof contractor.polizaINS === 'string') return contractor.polizaINS;
    return contractor.polizaINS.number;
  };

  const getPolizaExpiry = (contractor: ContractorInfo): string | null => {
    if (!contractor.polizaINS || typeof contractor.polizaINS === 'string') return null;
    return contractor.polizaINS.expiryDate;
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Por favor ingrese una cédula, nombre o número de póliza');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');
    setShowDetails(false);
    setSelectedContractor(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'https://sybe-production.up.railway.app/api'}/contractors?search=${encodeURIComponent(searchTerm.trim())}`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Error al buscar contratistas');
      }

      const data = await response.json();
      const contractorsList = data.contractors || data.data || [];

      if (contractorsList.length === 0) {
        setContractors([]);
        setError('No se encontraron contratistas con ese criterio de búsqueda');
      } else if (contractorsList.length === 1) {
        // Si solo hay un resultado, seleccionarlo automáticamente
        setContractors(contractorsList);
        setSelectedContractor(contractorsList[0]);
        setTimeout(() => setShowDetails(true), 100);
      } else {
        // Si hay múltiples resultados, mostrar lista
        setContractors(contractorsList);
        setError(`Se encontraron ${contractorsList.length} contratistas. Seleccione uno para ver detalles.`);
      }
    } catch (err) {
      setError('Error al buscar contratistas. Por favor intente nuevamente.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };


  const handleAccessSubmit = () => {
    if (!selectedContractor || !accessArea) return;

    // Simular registro de acceso
    const contractorName = getContractorName(selectedContractor);

    setAccessDialogOpen(false);
    setAccessArea('');
    setSuccessMessage(
      `✅ ${accessType === 'entry' ? 'INGRESO' : 'SALIDA'} registrado correctamente para ${contractorName}`
    );

    // Limpiar mensaje después de 5 segundos
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleSelectContractor = (contractor: ContractorInfo) => {
    setSelectedContractor(contractor);
    setShowDetails(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'activo': return 'success';
      case 'inactive':
      case 'inactivo': return 'warning';
      case 'suspended':
      case 'baja': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
      case 'activo': return 'Activo';
      case 'inactive':
      case 'inactivo': return 'Inactivo';
      case 'suspended':
      case 'baja': return 'Suspendido';
      default: return status;
    }
  };

  const isDocumentExpiring = (expiryDate?: string): boolean => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  };

  const isDocumentExpired = (expiryDate?: string): boolean => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry < today;
  };

  const hasRole = (roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role as UserRole) : false;
  };

  const isGuard = user?.role === UserRole.VALIDADORES_OPS;
  const canViewDetails = hasRole([UserRole.SUPER_ADMIN, UserRole.SAFETY_STAFF, UserRole.CLIENT_SUPERVISOR, UserRole.CLIENT_APPROVER]);


  const formatShortDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getInitials = (contractor: ContractorInfo): string => {
    const name = getContractorName(contractor);
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Validación de contratistas
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {isGuard
            ? 'Sistema de validación de contratistas'
            : 'Consulte el estado y la información de los contratistas'
          }
        </Typography>
      </Box>
      {/* Búsqueda */}
      <Card sx={{ mb: 3 }} elevation={2}>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
            <Box sx={{ flex: { xs: '1', md: '2' } }}>
              <TextField
                fullWidth
                label="Buscar por cédula, nombre o número de póliza"
                placeholder="Ej: 12345678, Juan Pérez, INS-001"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
                          size="small"
                          onClick={() => {
                            setSearchTerm('');
                            setContractors([]);
                            setSelectedContractor(null);
                            setError('');
                          }}
                        >
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                size="medium"
                autoFocus
              />
            </Box>
            <Box sx={{ flex: { xs: '1', md: '0.5' } }}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleSearch}
                disabled={loading}
                startIcon={loading ? null : <SearchIcon />}
                sx={{ height: 56 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Buscar'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
        </Box>
      )}

      {/* Error */}
      {error && (
        <Zoom in={true}>
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        </Zoom>
      )}

      {/* Success */}
      {successMessage && (
        <Zoom in={true}>
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage('')}>
            {successMessage}
          </Alert>
        </Zoom>
      )}

      {/* Lista de resultados cuando hay múltiples */}
      {contractors.length > 1 && !selectedContractor && (
        <Card sx={{ mb: 3 }} elevation={2}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Resultados encontrados ({contractors.length})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {contractors.map((contractor) => (
                <Paper
                  key={contractor._id}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      transform: 'translateX(4px)',
                    },
                  }}
                  onClick={() => handleSelectContractor(contractor)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: getStatusColor(contractor.status) + '.main',
                        width: 48,
                        height: 48,
                      }}
                    >
                      {getInitials(contractor)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {getContractorName(contractor)}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body2" color="text.secondary">
                          <BadgeIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                          {contractor.cedula}
                        </Typography>
                        {contractor.company && (
                          <Typography variant="body2" color="text.secondary">
                            <BusinessIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                            {contractor.company.name}
                          </Typography>
                        )}
                        {getPolizaNumber(contractor) && (
                          <Typography variant="body2" color="text.secondary">
                            <SecurityIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                            Póliza: {getPolizaNumber(contractor)}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <Chip
                      label={getStatusLabel(contractor.status)}
                      color={getStatusColor(contractor.status) as any}
                      size="small"
                    />
                  </Box>
                </Paper>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Detalle del contratista seleccionado */}
      {selectedContractor && (
        <Fade in={showDetails}>
          <Card elevation={3}>
            <CardContent>
              {/* Botón para volver cuando hay un contratista seleccionado */}
              {contractors.length > 1 && (
                <Button
                  startIcon={<ArrowBackIcon />}
                  onClick={() => {
                    setSelectedContractor(null);
                    setShowDetails(false);
                  }}
                  sx={{ mb: 2 }}
                >
                  Volver a resultados
                </Button>
              )}

              {/* Header del Contratista */}
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3, mb: 3, alignItems: { sm: 'center' } }}>
                <Box>
                  <Avatar
                    sx={{
                      width: { xs: 80, sm: 100 },
                      height: { xs: 80, sm: 100 },
                      bgcolor: getStatusColor(selectedContractor.status) + '.main',
                      fontSize: { xs: '1.5rem', sm: '2rem' }
                    }}
                  >
                    {getInitials(selectedContractor)}
                  </Avatar>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" fontWeight="bold">
                    {getContractorName(selectedContractor)}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    <BadgeIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                    Cédula: {selectedContractor.cedula}
                  </Typography>
                  {selectedContractor.company && (
                    <Typography variant="body2" color="text.secondary">
                      <BusinessIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      {selectedContractor.company.name}
                    </Typography>
                  )}
                  {selectedContractor.email && (
                    <Typography variant="body2" color="text.secondary">
                      📧 {selectedContractor.email}
                    </Typography>
                  )}
                  {selectedContractor.phone && (
                    <Typography variant="body2" color="text.secondary">
                      📞 {selectedContractor.phone}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={getStatusLabel(selectedContractor.status)}
                      color={getStatusColor(selectedContractor.status) as any}
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignSelf: { xs: 'stretch', sm: 'center' } }}>
                  {canViewDetails && (
                    <Button
                      variant="outlined"
                      startIcon={<VisibilityIcon />}
                      onClick={() => navigate(`/supervised-contractors/${selectedContractor._id}`)}
                      size="small"
                      fullWidth
                    >
                      Ver Perfil Completo
                    </Button>
                  )}
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Información importante */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Documentos y Pólizas */}
                <Box>
                  <Typography variant="h6" gutterBottom>
                    <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Documentos y Pólizas
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Póliza INS */}
                    {getPolizaNumber(selectedContractor) && (
                      <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                              Póliza INS
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {getPolizaNumber(selectedContractor)}
                            </Typography>
                          </Box>
                          {getPolizaExpiry(selectedContractor) && (
                            <Chip
                              label={`Vence: ${formatShortDate(getPolizaExpiry(selectedContractor)!)}`}
                              color={
                                isDocumentExpired(getPolizaExpiry(selectedContractor)!) ? 'error' :
                                  isDocumentExpiring(getPolizaExpiry(selectedContractor)!) ? 'warning' :
                                    'success'
                              }
                              size="small"
                            />
                          )}
                        </Box>
                      </Paper>
                    )}

                    {/* Orden Patronal */}
                    {selectedContractor.ordenPatronal && (
                      <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                              Orden Patronal
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {typeof selectedContractor.ordenPatronal === 'object' ?
                                selectedContractor.ordenPatronal.number :
                                selectedContractor.ordenPatronal
                              }
                            </Typography>
                          </Box>
                          {typeof selectedContractor.ordenPatronal === 'object' && selectedContractor.ordenPatronal.expiryDate && (
                            <Chip
                              label={`Vence: ${formatShortDate(selectedContractor.ordenPatronal.expiryDate)}`}
                              color={
                                isDocumentExpired(selectedContractor.ordenPatronal.expiryDate) ? 'error' :
                                  isDocumentExpiring(selectedContractor.ordenPatronal.expiryDate) ? 'warning' :
                                    'success'
                              }
                              size="small"
                            />
                          )}
                        </Box>
                      </Paper>
                    )}
                  </Box>
                </Box>

                {/* Supervisor */}
                {selectedContractor.supervisor && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      <GroupIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Supervisor Asignado
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Typography variant="body1">
                        {selectedContractor.supervisor.firstName} {selectedContractor.supervisor.lastName}
                      </Typography>
                    </Paper>
                  </Box>
                )}

                {/* Certificaciones */}
                {selectedContractor.certifications && selectedContractor.certifications.length > 0 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Certificaciones ({selectedContractor.certifications.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedContractor.certifications.map((cert, index) => (
                        <Chip
                          key={index}
                          label={cert.name}
                          color={
                            cert.status === 'valid' ? 'success' :
                              cert.status === 'expiring_soon' ? 'warning' :
                                'error'
                          }
                          size="small"
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Cursos */}
                {selectedContractor.courses && selectedContractor.courses.length > 0 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Cursos ({selectedContractor.courses.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedContractor.courses.map((course, index) => (
                        <Chip
                          key={index}
                          label={course.courseName}
                          color={
                            course.status === 'valid' ? 'success' :
                              course.status === 'expiring' ? 'warning' :
                                'error'
                          }
                          size="small"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
                {/* Decisión de acceso */}
                <Box>
                  <Typography variant="h6" gutterBottom>
                    <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Decisión de Acceso
                  </Typography>
                  <Paper
                    sx={{
                      p: 3,
                      bgcolor: selectedContractor.status === 'active' || selectedContractor.status === 'activo' ?
                        'success.lighter' : 'error.lighter',
                      textAlign: 'center'
                    }}
                  >
                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      color={selectedContractor.status === 'active' || selectedContractor.status === 'activo' ?
                        'success.main' : 'error.main'
                      }
                    >
                      {selectedContractor.status === 'active' || selectedContractor.status === 'activo' ?
                        '✅ ACCESO PERMITIDO' : '❌ ACCESO DENEGADO'
                      }
                    </Typography>
                    {(selectedContractor.status === 'inactive' || selectedContractor.status === 'inactivo' ||
                      selectedContractor.status === 'suspended' || selectedContractor.status === 'baja') && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Motivo: Contratista {getStatusLabel(selectedContractor.status)}
                        </Typography>
                      )}
                  </Paper>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Fade>
      )}

      {/* Diálogo de Control de Acceso */}
      {isGuard && selectedContractor && (
        <Dialog open={accessDialogOpen} onClose={() => setAccessDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {accessType === 'entry' ? (
                <>
                  <LoginIcon color="success" sx={{ mr: 1 }} />
                  Registrar Entrada
                </>
              ) : (
                <>
                  <LogoutIcon color="error" sx={{ mr: 1 }} />
                  Registrar Salida
                </>
              )}
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ width: 60, height: 60, bgcolor: getStatusColor(selectedContractor.status) + '.main' }}>
                    {getInitials(selectedContractor)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {getContractorName(selectedContractor)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Cédula: {selectedContractor.cedula}
                    </Typography>
                    {selectedContractor.company && (
                      <Typography variant="body2" color="text.secondary">
                        {selectedContractor.company.name}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Paper>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Área de {accessType === 'entry' ? 'Ingreso' : 'Salida'}</InputLabel>
                <Select
                  value={accessArea}
                  onChange={(e) => setAccessArea(e.target.value)}
                  label={`Área de ${accessType === 'entry' ? 'Ingreso' : 'Salida'}`}
                >
                  <MenuItem value="Entrada Principal">Entrada Principal</MenuItem>
                  <MenuItem value="Entrada Secundaria">Entrada Secundaria</MenuItem>
                  <MenuItem value="Entrada de Vehículos">Entrada de Vehículos</MenuItem>
                </Select>
              </FormControl>

              <Alert severity="info" sx={{ mb: 2 }}>
                {accessType === 'entry'
                  ? 'Al registrar el ingreso, el contratista quedará marcado como "En Sitio"'
                  : 'Al registrar la salida, el contratista quedará marcado como "Fuera del Sitio"'
                }
              </Alert>

              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Registrado por:</strong> {user?.name || user?.firstName + ' ' + user?.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Fecha y hora:</strong> {new Date().toLocaleString('es-ES')}
                </Typography>
              </Paper>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setAccessDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAccessSubmit}
              variant="contained"
              disabled={!accessArea}
              color={accessType === 'entry' ? 'success' : 'error'}
              startIcon={accessType === 'entry' ? <LoginIcon /> : <LogoutIcon />}
            >
              Confirmar {accessType === 'entry' ? 'Entrada' : 'Salida'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};