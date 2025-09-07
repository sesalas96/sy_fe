import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  Button,
  Divider,
  IconButton,
  Paper,
  Fade,
  Collapse
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Badge as BadgeIcon,
  Policy as PolicyIcon
} from '@mui/icons-material';
import { contractorApi, Contractor } from '../../services/contractorApi';
import { usePageTitle } from '../../hooks/usePageTitle';

export const AccessControl: React.FC = () => {
  usePageTitle(
    'Control de Acceso',
    'Búsqueda y verificación de contratistas'
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      setError('Por favor ingrese un término de búsqueda');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setContractors([]);
      setSelectedContractor(null);
      setSearchPerformed(true);

      const response = await contractorApi.getAll({
        search: searchTerm.trim()
      });

      if (response.success && response.data) {
        setContractors(response.data);
        if (response.data.length === 1) {
          setSelectedContractor(response.data[0]);
        }
      } else {
        throw new Error(response.message || 'Error al buscar contratistas');
      }
    } catch (err) {
      console.error('Error searching contractors:', err);
      setError(err instanceof Error ? err.message : 'Error al buscar contratistas');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  const handleClearSearch = () => {
    setSearchTerm('');
    setContractors([]);
    setSearchPerformed(false);
    setSelectedContractor(null);
    setError('');
  };

  const handleSelectContractor = (contractor: Contractor) => {
    setSelectedContractor(contractor);
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus === 'active' || normalizedStatus === 'activo') return 'success';
    if (normalizedStatus === 'inactive' || normalizedStatus === 'inactivo') return 'warning';
    if (normalizedStatus === 'suspended' || normalizedStatus === 'suspendido' || normalizedStatus === 'baja') return 'error';
    return 'default';
  };

  const getStatusIcon = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus === 'active' || normalizedStatus === 'activo') return <CheckCircleIcon />;
    if (normalizedStatus === 'inactive' || normalizedStatus === 'inactivo') return <WarningIcon />;
    return <ErrorIcon />;
  };

  const getStatusLabel = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus === 'active' || normalizedStatus === 'activo') return 'Activo';
    if (normalizedStatus === 'inactive' || normalizedStatus === 'inactivo') return 'Inactivo';
    if (normalizedStatus === 'suspended' || normalizedStatus === 'suspendido') return 'Suspendido';
    if (normalizedStatus === 'baja') return 'Baja';
    return status;
  };

  const getContractorName = (contractor: Contractor) => {
    if (contractor.fullName) return contractor.fullName;
    if (contractor.firstName && contractor.lastName) {
      return `${contractor.firstName} ${contractor.lastName}`;
    }
    return 'Sin nombre';
  };

  const getInitials = (contractor: Contractor) => {
    const name = getContractorName(contractor);
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isDocumentExpiring = (expiryDate: string | undefined) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiry <= thirtyDaysFromNow;
  };

  const isDocumentExpired = (expiryDate: string | undefined) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry < today;
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Control de Acceso
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Busque contratistas por cédula, nombre completo o número de póliza INS
        </Typography>
      </Box>

      {/* Search Section */}
      <Card sx={{ mb: 4, overflow: 'visible' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Buscar por cédula, nombre o número de póliza INS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              disabled={loading}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        onClick={handleClearSearch}
                        size="small"
                        disabled={loading}
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: { xs: '1rem', sm: '1.125rem' }
                }
              }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={loading || !searchTerm.trim()}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
              sx={{ 
                minWidth: { xs: '100%', sm: 150 },
                height: 56
              }}
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Fade in={true}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        </Fade>
      )}

      {/* Results */}
      {searchPerformed && !loading && (
        <Fade in={true}>
          <Box>
            {contractors.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No se encontraron resultados
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No hay contratistas que coincidan con "{searchTerm}"
                </Typography>
              </Paper>
            ) : contractors.length === 1 || selectedContractor ? (
              /* Single Contractor Detail View */
              <Card>
                <CardContent sx={{ p: 0 }}>
                  {selectedContractor && (
                    <Box>
                      {/* Header with Avatar and Basic Info */}
                      <Box sx={{ 
                        p: 3, 
                        background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
                        borderBottom: 1,
                        borderColor: 'divider'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
                          <Avatar
                            sx={{ 
                              width: 80, 
                              height: 80, 
                              bgcolor: getStatusColor(selectedContractor.status) + '.main',
                              fontSize: '1.5rem'
                            }}
                          >
                            {getInitials(selectedContractor)}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h5" gutterBottom>
                              {getContractorName(selectedContractor)}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <BadgeIcon fontSize="small" color="action" />
                              <Typography variant="subtitle1">
                                Cédula: {selectedContractor.cedula}
                              </Typography>
                            </Box>
                            <Chip
                              icon={getStatusIcon(selectedContractor.status)}
                              label={getStatusLabel(selectedContractor.status)}
                              color={getStatusColor(selectedContractor.status)}
                              size="medium"
                            />
                          </Box>
                        </Box>

                        {/* Quick Stats */}
                        {contractors.length > 1 && (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setSelectedContractor(null)}
                          >
                            Ver todos los resultados ({contractors.length})
                          </Button>
                        )}
                      </Box>

                      {/* Detailed Information */}
                      <Box sx={{ p: 3 }}>
                        {/* Company Information */}
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <BusinessIcon color="primary" />
                            Información de Empresa
                          </Typography>
                          <Box sx={{ pl: 4 }}>
                            <Typography variant="body1" gutterBottom>
                              <strong>Empresa:</strong> {selectedContractor.company?.name || 'Sin empresa'}
                            </Typography>
                            {selectedContractor.company?.industry && (
                              <Typography variant="body2" color="text.secondary">
                                <strong>Industria:</strong> {selectedContractor.company.industry}
                              </Typography>
                            )}
                          </Box>
                        </Box>

                        <Divider sx={{ my: 3 }} />

                        {/* Contact Information */}
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon color="primary" />
                            Información de Contacto
                          </Typography>
                          <Box sx={{ pl: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {selectedContractor.email && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EmailIcon fontSize="small" color="action" />
                                <Typography variant="body2">{selectedContractor.email}</Typography>
                              </Box>
                            )}
                            {selectedContractor.phone && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PhoneIcon fontSize="small" color="action" />
                                <Typography variant="body2">{selectedContractor.phone}</Typography>
                              </Box>
                            )}
                            {!selectedContractor.email && !selectedContractor.phone && (
                              <Typography variant="body2" color="text.secondary">
                                No hay información de contacto disponible
                              </Typography>
                            )}
                          </Box>
                        </Box>

                        <Divider sx={{ my: 3 }} />

                        {/* Insurance Information */}
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PolicyIcon color="primary" />
                            Información de Seguros
                          </Typography>
                          <Box sx={{ pl: 4 }}>
                            {selectedContractor.polizaINS ? (
                              <Box>
                                <Typography variant="body1" gutterBottom>
                                  <strong>Póliza INS:</strong> {selectedContractor.polizaINS.number}
                                </Typography>
                                <Typography 
                                  variant="body2" 
                                  color={
                                    isDocumentExpired(selectedContractor.polizaINS.expiryDate) 
                                      ? 'error' 
                                      : isDocumentExpiring(selectedContractor.polizaINS.expiryDate) 
                                        ? 'warning.main' 
                                        : 'text.secondary'
                                  }
                                >
                                  <strong>Vencimiento:</strong> {formatDate(selectedContractor.polizaINS.expiryDate)}
                                  {isDocumentExpired(selectedContractor.polizaINS.expiryDate) && ' (VENCIDA)'}
                                  {!isDocumentExpired(selectedContractor.polizaINS.expiryDate) && 
                                   isDocumentExpiring(selectedContractor.polizaINS.expiryDate) && ' (POR VENCER)'}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No tiene póliza INS registrada
                              </Typography>
                            )}
                            
                            {selectedContractor.ordenPatronal && selectedContractor.ordenPatronal.number && (
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="body1" gutterBottom>
                                  <strong>Orden Patronal:</strong> {selectedContractor.ordenPatronal.number}
                                </Typography>
                                {selectedContractor.ordenPatronal.expiryDate && (
                                  <Typography 
                                    variant="body2" 
                                    color={
                                      isDocumentExpired(selectedContractor.ordenPatronal.expiryDate) 
                                        ? 'error' 
                                        : isDocumentExpiring(selectedContractor.ordenPatronal.expiryDate) 
                                          ? 'warning.main' 
                                          : 'text.secondary'
                                    }
                                  >
                                    <strong>Vencimiento:</strong> {formatDate(selectedContractor.ordenPatronal.expiryDate)}
                                    {isDocumentExpired(selectedContractor.ordenPatronal.expiryDate) && ' (VENCIDA)'}
                                    {!isDocumentExpired(selectedContractor.ordenPatronal.expiryDate) && 
                                     isDocumentExpiring(selectedContractor.ordenPatronal.expiryDate) && ' (POR VENCER)'}
                                  </Typography>
                                )}
                              </Box>
                            )}
                          </Box>
                        </Box>

                        <Divider sx={{ my: 3 }} />

                        {/* Certifications and Courses */}
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AssignmentIcon color="primary" />
                            Certificaciones y Cursos
                          </Typography>
                          <Box sx={{ pl: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Chip
                              label={`${selectedContractor.certifications?.length || 0} certificaciones`}
                              variant="outlined"
                              color="primary"
                            />
                            <Chip
                              label={`${selectedContractor.initialCourses?.length || 0} cursos iniciales`}
                              variant="outlined"
                              color="info"
                            />
                            <Chip
                              label={`${selectedContractor.additionalCourses?.length || 0} cursos adicionales`}
                              variant="outlined"
                              color="info"
                            />
                          </Box>
                        </Box>

                        {/* Access Decision */}
                        <Box sx={{ 
                          mt: 4, 
                          p: 3, 
                          borderRadius: 2,
                          bgcolor: selectedContractor.status.toLowerCase() === 'active' || 
                                   selectedContractor.status.toLowerCase() === 'activo' 
                                   ? 'success.50' 
                                   : 'error.50',
                          border: 1,
                          borderColor: selectedContractor.status.toLowerCase() === 'active' || 
                                      selectedContractor.status.toLowerCase() === 'activo' 
                                      ? 'success.main' 
                                      : 'error.main'
                        }}>
                          <Typography 
                            variant="h6" 
                            color={selectedContractor.status.toLowerCase() === 'active' || 
                                  selectedContractor.status.toLowerCase() === 'activo' 
                                  ? 'success.dark' 
                                  : 'error.dark'}
                            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                          >
                            {selectedContractor.status.toLowerCase() === 'active' || 
                             selectedContractor.status.toLowerCase() === 'activo' ? (
                              <>
                                <CheckCircleIcon />
                                Acceso Permitido
                              </>
                            ) : (
                              <>
                                <ErrorIcon />
                                Acceso Denegado
                              </>
                            )}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ mt: 1 }}
                            color={selectedContractor.status.toLowerCase() === 'active' || 
                                  selectedContractor.status.toLowerCase() === 'activo' 
                                  ? 'success.dark' 
                                  : 'error.dark'}
                          >
                            {selectedContractor.status.toLowerCase() === 'active' || 
                             selectedContractor.status.toLowerCase() === 'activo' 
                              ? 'El contratista está activo y puede ingresar a las instalaciones.'
                              : `El contratista está ${getStatusLabel(selectedContractor.status).toLowerCase()} y NO puede ingresar.`}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ) : (
              /* Multiple Results List */
              <Box>
                <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                  {contractors.length} contratistas encontrados
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {contractors.map((contractor) => (
                    <Card 
                      key={contractor._id} 
                      sx={{ 
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          boxShadow: 3,
                          transform: 'translateY(-2px)'
                        }
                      }}
                      onClick={() => handleSelectContractor(contractor)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              sx={{ 
                                bgcolor: getStatusColor(contractor.status) + '.main',
                                width: 56,
                                height: 56
                              }}
                            >
                              {getInitials(contractor)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle1" fontWeight="medium">
                                {getContractorName(contractor)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Cédula: {contractor.cedula}
                              </Typography>
                              {contractor.polizaINS?.number && (
                                <Typography variant="body2" color="text.secondary">
                                  Póliza INS: {contractor.polizaINS.number}
                                </Typography>
                              )}
                              <Typography variant="body2" color="text.secondary">
                                Empresa: {contractor.company?.name || 'Sin empresa'}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                            <Chip
                              icon={getStatusIcon(contractor.status)}
                              label={getStatusLabel(contractor.status)}
                              color={getStatusColor(contractor.status)}
                              size="small"
                            />
                            <Typography variant="caption" color="primary">
                              Click para ver detalles
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Fade>
      )}
    </Box>
  );
};