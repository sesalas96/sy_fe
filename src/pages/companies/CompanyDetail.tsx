import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Chip,
  Button,
  Breadcrumbs,
  Link,
  Divider,
  Card,
  CardContent,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  IconButton
} from '@mui/material';
import {
  Edit as EditIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Language as WebsiteIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pause as PauseIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { Company, UserRole } from '../../types';
import { companyApi } from '../../services/companyApi';
import { useAuth } from '../../contexts/AuthContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import CompanyDepartments from './CompanyDepartments';
import { CompanyVerifications } from '../../components/verifications/CompanyVerifications';

export const CompanyDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { hasRole } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  usePageTitle('Detalle de Espacios de Trabajo', 'Información detallada de la empresa');
  
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [tabValue, setTabValue] = useState(0);
  
  // Status change dialog
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<'active' | 'inactive' | 'suspended'>('active');

  useEffect(() => {
    if (id) {
      loadCompany(id);
    } else {
      setError('ID de empresa no válido');
      setLoading(false);
    }
  }, [id]);

  const loadCompany = async (companyId: string) => {
    try {
      setLoading(true);
      const response = await companyApi.getById(companyId);
      
      if (response.success && response.data) {
        setCompany(response.data);
      } else {
        setError('Espacios de Trabajo no encontrada');
      }
    } catch (err) {
      setError('Error al cargar la información de la empresa');
      console.error('Error loading company:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/companies/${id}/edit`);
  };

  const handleStatusChange = async () => {
    if (!company) return;

    try {
      const response = await companyApi.updateStatus(company._id, newStatus);
      if (response.success && response.data) {
        setCompany(response.data);
        setStatusDialogOpen(false);
      }
    } catch (err) {
      console.error('Error updating company status:', err);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-CR');
  };

  // const formatDateTime = (date: Date) => {
  //   return date.toLocaleString('es-CR');
  // };

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
        size="medium"
        icon={config.icon}
      />
    );
  };


  const getInsuranceExpiryWarning = (expiryDate: Date) => {
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
    
    if (daysUntilExpiry < 0) {
      return { severity: 'error' as const, message: `Seguro vencido hace ${Math.abs(daysUntilExpiry)} días` };
    } else if (daysUntilExpiry <= 30) {
      return { severity: 'warning' as const, message: `Seguro vence en ${daysUntilExpiry} días` };
    }
    
    return null;
  };

  const canManageCompanies = () => {
    return hasRole([UserRole.SUPER_ADMIN, UserRole.SAFETY_STAFF]);
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Cargando información de la empresa...</Typography>
      </Box>
    );
  }

  if (error || !company) {
    return (
      <Box>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link 
            color="inherit" 
            href="#" 
            onClick={(e) => { e.preventDefault(); navigate('/companies'); }}
          >
            Espacios de Trabajos
          </Link>
          <Typography color="textPrimary">Detalle</Typography>
        </Breadcrumbs>
        
        <Alert severity="error">
          {error || 'Espacios de Trabajo no encontrada'}
        </Alert>
      </Box>
    );
  }

  const insuranceWarning = company.insuranceInfo?.expiryDate ? 
    getInsuranceExpiryWarning(new Date(company.insuranceInfo.expiryDate)) : null;

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link 
          color="inherit" 
          href="#" 
          onClick={(e) => { e.preventDefault(); navigate('/companies'); }}
          sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
        >
          Espacios de Trabajos
        </Link>
        <Typography 
          color="textPrimary"
          sx={{ 
            fontSize: { xs: '0.875rem', sm: '1rem' },
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: { xs: '200px', sm: 'none' }
          }}
        >
          {company.name}
        </Typography>
      </Breadcrumbs>

      <Box sx={{ mb: 3 }}>
        <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom>
          <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          {company.name}
        </Typography>
        {getStatusChip(company.status)}
      </Box>

      {/* Alerts for important information */}
      {insuranceWarning && (
        <Alert severity={insuranceWarning.severity} sx={{ mb: 3 }}>
          <strong>Atención:</strong> {insuranceWarning.message}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ 
        bgcolor: 'background.paper',
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: 1
      }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          allowScrollButtonsMobile
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            minHeight: { xs: 48, sm: 64 },
            '& .MuiTabs-indicator': {
              height: { xs: 3, sm: 4 },
              backgroundColor: 'primary.main'
            },
            '& .MuiTabs-scroller': {
              flexGrow: 0
            },
            '& .MuiTabs-flexContainer': {
              justifyContent: 'flex-start'
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: { xs: '0.8rem', sm: '1rem' },
              minHeight: { xs: 48, sm: 64 },
              px: { xs: 1.5, sm: 3 },
              minWidth: { xs: 90, sm: 160 },
              flex: isMobile ? 'none' : undefined,
              '&:not(:last-child)': {
                marginRight: { xs: 0, sm: 1 }
              }
            },
            '& .Mui-selected': {
              fontWeight: 600,
              color: 'primary.main'
            },
            '& .MuiTabs-scrollButtons': {
              '&.Mui-disabled': {
                opacity: 0.3
              }
            }
          }}
        >
          <Tab 
            label="Información" 
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
              '& .MuiTab-iconWrapper': { display: 'none' }
            }}
          />
          <Tab 
            label="Departamentos"
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
              '& .MuiTab-iconWrapper': { display: 'none' }
            }}
          />
          <Tab 
            label="Verificaciones"
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
              '& .MuiTab-iconWrapper': { display: 'none' }
            }}
          />
        </Tabs>
        
        {/* Tab Content */}
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {tabValue === 0 && (
        isMobile ? (
        // Mobile Card-Based Layout
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Basic Information Card */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon />
                  Información General
                </Typography>
                {canManageCompanies() && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton 
                      onClick={handleEdit} 
                      color="primary"
                      size="small"
                      title="Editar"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      onClick={() => setStatusDialogOpen(true)}
                      color="secondary"
                      size="small"
                      title="Cambiar Estado"
                    >
                      <SettingsIcon />
                    </IconButton>
                  </Box>
                )}
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Identificación Fiscal
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {company.ruc || company.taxId || 'No especificado'}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Industria
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {company.industry || 'No especificada'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Número de Empleados
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {company.employeeCount || 'No especificado'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Fecha de Registro
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {company.createdAt ? formatDate(company.createdAt) : 'No disponible'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    <LocationIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                    Dirección
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {company.address}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      <PhoneIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                      Teléfono
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {company.phone}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      <EmailIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                      Email
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {company.email}
                    </Typography>
                  </Box>
                </Box>

                {company.website && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      <WebsiteIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                      Sitio Web
                    </Typography>
                    <Link href={company.website} target="_blank" rel="noopener noreferrer">
                      <Typography variant="body2" fontWeight="medium">
                        {company.website}
                      </Typography>
                    </Link>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Contact Information Card */}
          {(company.contactPerson || company.legalRepresentative) && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon />
                  Contacto
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {company.contactPerson && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Persona de Contacto
                      </Typography>
                      <Typography variant="body2"><strong>Nombre:</strong> {company.contactPerson.name || 'No especificado'}</Typography>
                      <Typography variant="body2"><strong>Posición:</strong> {company.contactPerson.position || 'No especificada'}</Typography>
                      <Typography variant="body2"><strong>Email:</strong> {company.contactPerson.email || 'No especificado'}</Typography>
                      <Typography variant="body2"><strong>Teléfono:</strong> {company.contactPerson.phone || 'No especificado'}</Typography>
                    </Box>
                  )}

                  {company.legalRepresentative && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Representante Legal
                      </Typography>
                      <Typography variant="body2"><strong>Nombre:</strong> {company.legalRepresentative.name || 'No especificado'}</Typography>
                      <Typography variant="body2"><strong>Cédula:</strong> {company.legalRepresentative.cedula || 'No especificada'}</Typography>
                      <Typography variant="body2"><strong>Posición:</strong> {company.legalRepresentative.position || 'No especificada'}</Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Insurance Information Card */}
          {company.insuranceInfo && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SecurityIcon />
                  Seguro
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Proveedor
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {company.insuranceInfo.provider}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Número de Póliza
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {company.insuranceInfo.policyNumber}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Fecha de Vencimiento
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formatDate(company.insuranceInfo.expiryDate)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Cobertura
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {company.insuranceInfo.coverage}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

        </Box>
      ) : (
        // Desktop Grid Layout
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon />
                  Información General
                </Typography>
                {canManageCompanies() && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={handleEdit}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setStatusDialogOpen(true)}
                    >
                      Cambiar Estado
                    </Button>
                  </Box>
                )}
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Identificación Fiscal:
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {company.ruc || company.taxId || 'No especificado'}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Industria:
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {company.industry || 'No especificada'}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Número de Empleados:
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {company.employeeCount || 'No especificado'}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Fecha de Registro:
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {company.createdAt ? formatDate(company.createdAt) : 'No disponible'}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Última Actualización:
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {company.updatedAt ? formatDate(company.updatedAt) : 'No disponible'}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Estado Activo:
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {company.isActive ? 'Sí' : 'No'}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    <LocationIcon sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: 'small' }} />
                    Dirección:
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {company.address}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    <PhoneIcon sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: 'small' }} />
                    Teléfono:
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {company.phone}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    <EmailIcon sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: 'small' }} />
                    Email:
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {company.email}
                  </Typography>
                </Grid>

                {company.website && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      <WebsiteIcon sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: 'small' }} />
                      Sitio Web:
                    </Typography>
                    <Typography variant="body1">
                      <Link href={company.website} target="_blank" rel="noopener noreferrer">
                        {company.website}
                      </Link>
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Contact Information - Solo mostrar si hay datos disponibles */}
          {(company.contactPerson || company.legalRepresentative) && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant={isMobile ? 'subtitle1' : 'h6'} gutterBottom>
                  <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Información de Contacto
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={3}>
                  {company.contactPerson && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Persona de Contacto
                      </Typography>
                      <Typography variant="body2">
                        <strong>Nombre:</strong> {company.contactPerson.name || 'No especificado'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Posición:</strong> {company.contactPerson.position || 'No especificada'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Email:</strong> {company.contactPerson.email || 'No especificado'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Teléfono:</strong> {company.contactPerson.phone || 'No especificado'}
                      </Typography>
                    </Grid>
                  )}

                  {company.legalRepresentative && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Representante Legal
                      </Typography>
                      <Typography variant="body2">
                        <strong>Nombre:</strong> {company.legalRepresentative.name || 'No especificado'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Cédula:</strong> {company.legalRepresentative.cedula || 'No especificada'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Posición:</strong> {company.legalRepresentative.position || 'No especificada'}
                      </Typography>
                    </Grid>
                  )}
                  
                  {!company.contactPerson && !company.legalRepresentative && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                        No hay información de contacto registrada
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Insurance Information */}
          {company.insuranceInfo && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant={isMobile ? 'subtitle1' : 'h6'} gutterBottom>
                  <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Información del Seguro
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Proveedor:
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {company.insuranceInfo.provider}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Número de Póliza:
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {company.insuranceInfo.policyNumber}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Fecha de Vencimiento:
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {formatDate(company.insuranceInfo.expiryDate)}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Cobertura:
                    </Typography>
                    <Typography variant="body1">
                      {company.insuranceInfo.coverage}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
          </Grid>
        </Grid>
      )
      )}

      {/* Tab 2: Departamentos */}
      {tabValue === 1 && canManageCompanies() && (
        <CompanyDepartments companyId={company._id} companyName={company.name} />
      )}

      {/* Tab 3: Verificaciones */}
      {tabValue === 2 && (
        <CompanyVerifications companyId={company._id} companyName={company.name} />
      )}
        </Box>
      </Box>

      {/* Status Change Dialog */}
      <Dialog 
        open={statusDialogOpen} 
        onClose={() => setStatusDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isXs}
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: 0, sm: '32px' },
            width: { xs: '100%', sm: 'auto' },
            maxHeight: { xs: '100%', sm: '90vh' }
          }
        }}
      >
        <DialogTitle>Cambiar Estado de la Espacios de Trabajo</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            ¿Está seguro que desea cambiar el estado de "{company.name}"?
          </Typography>
          
          <FormControl fullWidth>
            <InputLabel>Nuevo Estado</InputLabel>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as any)}
              label="Nuevo Estado"
            >
              <MenuItem value="active">Activa</MenuItem>
              <MenuItem value="inactive">Inactiva</MenuItem>
              <MenuItem value="suspended">Suspendida</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          gap: { xs: 1, sm: 0 },
          p: { xs: 2, sm: 1 }
        }}>
          <Button 
            onClick={() => setStatusDialogOpen(false)}
            fullWidth={isXs}
            size={isMobile ? 'medium' : 'large'}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleStatusChange} 
            variant="contained"
            fullWidth={isXs}
            size={isMobile ? 'medium' : 'large'}
          >
            Cambiar Estado
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};