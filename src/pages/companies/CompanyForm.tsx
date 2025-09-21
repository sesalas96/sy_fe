import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  Breadcrumbs,
  Link,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery,
  FormHelperText,
  Snackbar
} from '@mui/material';
import {
  Business as BusinessIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { CompanyFormData as CompanyFormType } from '../../types';
import { companyApi } from '../../services/companyApi';
import { usePageTitle } from '../../hooks/usePageTitle';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/material.css';

interface CompanyFormDataLocal {
  name: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  industry: string;
  contactPerson: {
    name: string;
    position: string;
    email: string;
    phone: string;
  };
  legalRepresentative: {
    name: string;
    cedula: string;
    position: string;
  };
  status: 'active' | 'inactive' | 'suspended';
}

const initialFormData: CompanyFormDataLocal = {
  name: '',
  taxId: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  industry: '',
  contactPerson: {
    name: '',
    position: '',
    email: '',
    phone: ''
  },
  legalRepresentative: {
    name: '',
    cedula: '',
    position: ''
  },
  status: 'active'
};

const steps = [
  'Información Básica',
  'Contacto y Representación',
  'Revisión Final'
];

const industries = [
  'Construcción',
  'Desarrollo Inmobiliario',
  'Ingeniería y Consultoría',
  'Mantenimiento Industrial',
  'Demolición y Excavación',
  'Servicios Generales',
  'Manufactura',
  'Transporte y Logística',
  'Tecnología',
  'Otro'
];


export const CompanyForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isEditing = Boolean(id);
  usePageTitle(isEditing ? 'Editar Espacio de Trabajo' : 'Nuevo Espacio de Trabajo', isEditing ? 'Modificar información de la empresa' : 'Registrar nueva empresa en el sistema');

  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<CompanyFormDataLocal>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    if (isEditing && id) {
      loadCompany(id);
    }
  }, [id, isEditing]);

  const loadCompany = async (companyId: string) => {
    try {
      setLoading(true);
      const response = await companyApi.getById(companyId);
      
      if (response.success && response.data) {
        const company = response.data;
        console.log('Loading company data:', company); // Debug log
        console.log('Legal Representative from API:', company.legalRepresentative); // Debug specific field
        
        const newFormData = {
          name: company.name || '',
          taxId: company.ruc || company.taxId || '',
          address: company.address || '',
          phone: company.phone || '',
          email: company.email || '',
          website: company.website || '',
          industry: company.industry || '',
          contactPerson: company.contactPerson || {
            name: '',
            position: '',
            email: '',
            phone: ''
          },
          legalRepresentative: company.legalRepresentative || {
            name: '',
            cedula: '',
            position: ''
          },
          status: company.status || 'active'
        };
        
        console.log('Setting form data:', newFormData); // Debug log
        setFormData(newFormData);
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

  const handleInputChange = (field: string, value: any) => {
    const fieldPath = field.split('.');
    
    if (fieldPath.length === 1) {
      setFormData(prev => ({ ...prev, [field]: value }));
    } else if (fieldPath.length === 2) {
      setFormData(prev => {
        // Ensure the nested object exists
        const nestedObject = (prev as any)[fieldPath[0]] || {};
        return {
          ...prev,
          [fieldPath[0]]: {
            ...nestedObject,
            [fieldPath[1]]: value
          }
        };
      });
    }
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };


  const formatCedula = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 1) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 1)}-${digits.slice(1)}`;
    return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5, 9)}`;
  };


  const isValidUrl = (url: string): boolean => {
    if (!url.trim()) return true; // Optional field
    
    // Regular expression for URL validation
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
    
    // Check if it matches basic URL pattern
    if (urlPattern.test(url)) {
      return true;
    }
    
    // Also try to validate with URL constructor for more complex cases
    try {
      const urlToTest = url.startsWith('http://') || url.startsWith('https://') 
        ? url 
        : `https://${url}`;
      const urlObj = new URL(urlToTest);
      
      // Additional validation: must have a valid domain
      const domain = urlObj.hostname;
      if (!domain || domain.split('.').length < 2) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // Información Básica
        if (!formData.name.trim()) newErrors.name = 'Nombre es requerido';
        if (!formData.taxId.trim()) newErrors.taxId = 'Identificación fiscal es requerida';
        if (formData.taxId.length < 9 || formData.taxId.length > 12) {
          newErrors.taxId = 'Debe tener entre 9 y 12 dígitos';
        }
        if (!formData.address.trim()) newErrors.address = 'Dirección es requerida';
        if (!formData.phone || formData.phone.trim() === '+') newErrors.phone = 'Teléfono es requerido';
        if (!formData.email.trim()) newErrors.email = 'Email es requerido';
        if (formData.website && !isValidUrl(formData.website)) {
          newErrors.website = 'URL no válida. Use formato: www.ejemplo.com o https://www.ejemplo.com';
        }
        if (!formData.industry.trim()) newErrors.industry = 'Industria es requerida';
        break;

      case 1: // Contacto y Representación
        if (!formData.contactPerson?.name?.trim()) newErrors['contactPerson.name'] = 'Nombre del contacto es requerido';
        if (!formData.contactPerson?.position?.trim()) newErrors['contactPerson.position'] = 'Posición del contacto es requerida';
        if (!formData.contactPerson?.email?.trim()) newErrors['contactPerson.email'] = 'Email del contacto es requerido';
        if (!formData.contactPerson?.phone || formData.contactPerson?.phone?.trim() === '+') newErrors['contactPerson.phone'] = 'Teléfono del contacto es requerido';
        if (!formData.legalRepresentative?.name?.trim()) newErrors['legalRepresentative.name'] = 'Nombre del representante legal es requerido';
        if (!formData.legalRepresentative?.cedula?.trim()) newErrors['legalRepresentative.cedula'] = 'Cédula del representante legal es requerida';
        if (!formData.legalRepresentative?.position?.trim()) newErrors['legalRepresentative.position'] = 'Posición del representante legal es requerida';
        break;

    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) {
      return;
    }

    try {
      setLoading(true);
      
      // Normalize website URL
      let websiteUrl = formData.website?.trim();
      if (websiteUrl && !websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
        websiteUrl = `https://${websiteUrl}`;
      }

      const companyData: CompanyFormType = {
        ...formData,
        // Asegurar que taxId solo contenga dígitos
        taxId: formData.taxId.replace(/\D/g, ''),
        website: websiteUrl || undefined
        // Insurance info removed - no longer part of the form
      };

      if (isEditing && id) {
        await companyApi.update(id, companyData);
        setSnackbar({
          open: true,
          message: 'Espacio de trabajo actualizado exitosamente',
          severity: 'success'
        });
      } else {
        await companyApi.create(companyData);
        setSnackbar({
          open: true,
          message: 'Espacio de trabajo creado exitosamente',
          severity: 'success'
        });
      }

      setTimeout(() => {
        navigate('/companies');
      }, 1500);
    } catch (err: any) {
      console.error('Error saving company:', err);
      
      // Handle specific API errors
      if (err.response?.data?.details) {
        const apiErrors: Record<string, string> = {};
        err.response.data.details.forEach((detail: any) => {
          if (detail.field === 'website') {
            apiErrors.website = detail.message;
          } else {
            apiErrors[detail.field] = detail.message;
          }
        });
        setErrors(apiErrors);
        setError('Por favor corrige los errores en el formulario');
      } else if (err.response?.data?.error) {
        // Handle specific error messages
        const errorMessage = err.response.data.error;
        if (errorMessage === 'Tax ID already exists') {
          setErrors({ taxId: 'Esta identificación fiscal ya está registrada en el sistema' });
          setError('Ya existe una empresa con esta identificación fiscal');
          setSnackbar({
            open: true,
            message: 'Ya existe una empresa con esta identificación fiscal',
            severity: 'error'
          });
          setActiveStep(0); // Go back to first step where taxId is
        } else if (errorMessage === 'Company name already exists') {
          setErrors({ name: 'Este nombre de empresa ya está registrado en el sistema' });
          setError('Ya existe una empresa con este nombre');
          setSnackbar({
            open: true,
            message: 'Ya existe una empresa con este nombre',
            severity: 'error'
          });
          setActiveStep(0); // Go back to first step where name is
        } else {
          setError(errorMessage);
          setSnackbar({
            open: true,
            message: errorMessage,
            severity: 'error'
          });
        }
      } else {
        const errorMessage = err.response?.data?.message || 'Error al guardar la empresa';
        setError(errorMessage);
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/companies');
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };


  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Nombre de la Espacios de Trabajo"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Identificación Fiscal"
                value={formData.taxId}
                onChange={(e) => handleInputChange('taxId', e.target.value.replace(/\D/g, ''))}
                error={!!errors.taxId}
                helperText={errors.taxId || 'Solo números, entre 9-12 dígitos'}
                placeholder="20123456789"
                required
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Dirección"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                error={!!errors.address}
                helperText={errors.address}
                multiline
                rows={2}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Box>
                <PhoneInput
                  country={'cr'}
                  value={formData.phone}
                  onChange={(phone) => handleInputChange('phone', '+' + phone)}
                  inputStyle={{
                    width: '100%',
                    height: '56px',
                    fontSize: '16px',
                    fontFamily: 'inherit',
                    borderColor: errors.phone ? '#d32f2f' : 'rgba(0, 0, 0, 0.23)',
                    borderRadius: '4px'
                  }}
                  containerStyle={{
                    width: '100%'
                  }}
                  buttonStyle={{
                    borderColor: errors.phone ? '#d32f2f' : 'rgba(0, 0, 0, 0.23)',
                    borderRadius: '4px 0 0 4px'
                  }}
                  dropdownStyle={{
                    zIndex: 1300
                  }}
                  enableSearch
                  searchPlaceholder="Buscar país..."
                  preferredCountries={['cr', 'us', 'mx', 'gt', 'sv', 'hn', 'ni', 'pa']}
                  placeholder="2234-5678"
                />
                {errors.phone && (
                  <FormHelperText error sx={{ mt: 0.5 }}>
                    {errors.phone}
                  </FormHelperText>
                )}
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Sitio Web"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="www.empresa.com"
                error={!!errors.website}
                helperText={errors.website || 'Ejemplo: www.empresa.com o https://www.empresa.com'}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required error={!!errors.industry}>
                <InputLabel>Industria</InputLabel>
                <Select
                  value={formData.industry}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  label="Industria"
                >
                  {industries.map((industry) => (
                    <MenuItem key={industry} value={industry}>
                      {industry}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  label="Estado"
                >
                  <MenuItem value="active">Activa</MenuItem>
                  <MenuItem value="inactive">Inactiva</MenuItem>
                  <MenuItem value="suspended">Suspendida</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant={isMobile ? 'subtitle1' : 'h6'} gutterBottom>
                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Persona de Contacto
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Nombre Completo"
                value={formData.contactPerson?.name || ''}
                onChange={(e) => handleInputChange('contactPerson.name', e.target.value)}
                error={!!errors['contactPerson.name']}
                helperText={errors['contactPerson.name']}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Posición"
                value={formData.contactPerson?.position || ''}
                onChange={(e) => handleInputChange('contactPerson.position', e.target.value)}
                error={!!errors['contactPerson.position']}
                helperText={errors['contactPerson.position']}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.contactPerson?.email || ''}
                onChange={(e) => handleInputChange('contactPerson.email', e.target.value)}
                error={!!errors['contactPerson.email']}
                helperText={errors['contactPerson.email']}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Box>
                <PhoneInput
                  country={'cr'}
                  value={formData.contactPerson?.phone || ''}
                  onChange={(phone) => handleInputChange('contactPerson.phone', '+' + phone)}
                  inputStyle={{
                    width: '100%',
                    height: '56px',
                    fontSize: '16px',
                    fontFamily: 'inherit',
                    borderColor: errors['contactPerson.phone'] ? '#d32f2f' : 'rgba(0, 0, 0, 0.23)',
                    borderRadius: '4px'
                  }}
                  containerStyle={{
                    width: '100%'
                  }}
                  buttonStyle={{
                    borderColor: errors['contactPerson.phone'] ? '#d32f2f' : 'rgba(0, 0, 0, 0.23)',
                    borderRadius: '4px 0 0 4px'
                  }}
                  dropdownStyle={{
                    zIndex: 1300
                  }}
                  enableSearch
                  searchPlaceholder="Buscar país..."
                  preferredCountries={['cr', 'us', 'mx', 'gt', 'sv', 'hn', 'ni', 'pa']}
                  placeholder="8765-4321"
                />
                {errors['contactPerson.phone'] && (
                  <FormHelperText error sx={{ mt: 0.5 }}>
                    {errors['contactPerson.phone']}
                  </FormHelperText>
                )}
              </Box>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant={isMobile ? 'subtitle1' : 'h6'} gutterBottom sx={{ mt: 3 }}>
                <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Representante Legal
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Nombre Completo"
                value={formData.legalRepresentative?.name || ''}
                onChange={(e) => handleInputChange('legalRepresentative.name', e.target.value)}
                error={!!errors['legalRepresentative.name']}
                helperText={errors['legalRepresentative.name']}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Cédula"
                value={formData.legalRepresentative?.cedula || ''}
                onChange={(e) => handleInputChange('legalRepresentative.cedula', formatCedula(e.target.value))}
                error={!!errors['legalRepresentative.cedula']}
                helperText={errors['legalRepresentative.cedula']}
                placeholder="1-2345-6789"
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Posición"
                value={formData.legalRepresentative?.position || ''}
                onChange={(e) => handleInputChange('legalRepresentative.position', e.target.value)}
                error={!!errors['legalRepresentative.position']}
                helperText={errors['legalRepresentative.position']}
                required
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant={isMobile ? 'subtitle1' : 'h6'} gutterBottom>
                Revisión de Información
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Información Básica
                  </Typography>
                  <Typography variant="body2"><strong>Nombre:</strong> {formData.name}</Typography>
                  <Typography variant="body2"><strong>ID Fiscal:</strong> {formData.taxId}</Typography>
                  <Typography variant="body2"><strong>Dirección:</strong> {formData.address}</Typography>
                  <Typography variant="body2"><strong>Teléfono:</strong> {formData.phone}</Typography>
                  <Typography variant="body2"><strong>Email:</strong> {formData.email}</Typography>
                  {formData.website && (
                    <Typography variant="body2"><strong>Sitio Web:</strong> {formData.website}</Typography>
                  )}
                  <Typography variant="body2"><strong>Industria:</strong> {formData.industry}</Typography>
                  <Typography variant="body2"><strong>Estado:</strong> {formData.status}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Contacto
                  </Typography>
                  <Typography variant="body2"><strong>Persona:</strong> {formData.contactPerson?.name || 'No especificado'}</Typography>
                  <Typography variant="body2"><strong>Posición:</strong> {formData.contactPerson?.position || 'No especificado'}</Typography>
                  <Typography variant="body2"><strong>Email:</strong> {formData.contactPerson?.email || 'No especificado'}</Typography>
                  <Typography variant="body2"><strong>Teléfono:</strong> {formData.contactPerson?.phone || 'No especificado'}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Representante Legal
                  </Typography>
                  <Typography variant="body2"><strong>Nombre:</strong> {formData.legalRepresentative?.name || 'No especificado'}</Typography>
                  <Typography variant="body2"><strong>Cédula:</strong> {formData.legalRepresentative?.cedula || 'No especificado'}</Typography>
                  <Typography variant="body2"><strong>Posición:</strong> {formData.legalRepresentative?.position || 'No especificado'}</Typography>
                </CardContent>
              </Card>
            </Grid>


          </Grid>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Cargando...</Typography>
      </Box>
    );
  }

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
        <Typography color="textPrimary">
          {isEditing ? 'Editar Espacio de Trabajo' : 'Nuevo Espacio de Trabajo'}
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton 
          onClick={() => navigate('/companies')}
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant={isMobile ? 'h5' : 'h4'}>
          <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          {isEditing ? 'Editar Espacio de Trabajo' : 'Nuevo Espacio de Trabajo'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Stepper 
          activeStep={activeStep} 
          sx={{ mb: 4 }}
          orientation={isXs ? 'vertical' : 'horizontal'}
          alternativeLabel={!isXs}
        >
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel 
                sx={{
                  '& .MuiStepLabel-label': {
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    fontWeight: activeStep === index ? 600 : 400
                  }
                }}
              >
                {isXs ? label.replace(' ', '\n') : label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent(activeStep)}

        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          gap: { xs: 2, sm: 0 },
          mt: 4 
        }}>
          <Box sx={{ order: { xs: 2, sm: 1 } }}>
            <Button 
              onClick={handleCancel} 
              startIcon={!isXs ? <CancelIcon /> : undefined}
              fullWidth={isXs}
              size={isMobile ? 'medium' : 'large'}
            >
              Cancelar
            </Button>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            order: { xs: 1, sm: 2 },
            flexDirection: { xs: 'column-reverse', sm: 'row' }
          }}>
            {activeStep > 0 && (
              <Button 
                onClick={handleBack}
                fullWidth={isXs}
                size={isMobile ? 'medium' : 'large'}
              >
                Anterior
              </Button>
            )}
            
            {activeStep < steps.length - 1 ? (
              <Button 
                variant="contained" 
                onClick={handleNext}
                fullWidth={isXs}
                size={isMobile ? 'medium' : 'large'}
              >
                Siguiente
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
                startIcon={!isXs ? <SaveIcon /> : undefined}
                disabled={loading}
                fullWidth={isXs}
                size={isMobile ? 'medium' : 'large'}
              >
                {isEditing ? 'Actualizar' : 'Crear'} Espacios de Trabajo
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};