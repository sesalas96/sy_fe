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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Business as BusinessIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Assignment as AssignmentIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { CompanyCertification, CompanyFormData as CompanyFormType } from '../../types';
import { companyApi } from '../../services/companyApi';
import { usePageTitle } from '../../hooks/usePageTitle';

interface CompanyFormDataLocal {
  name: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  industry: string;
  employeeCount: number;
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
  insuranceInfo: {
    provider: string;
    policyNumber: string;
    expiryDate: string;
    coverage: string;
  };
  status: 'active' | 'inactive' | 'suspended';
}

const initialFormData: CompanyFormDataLocal = {
  name: 'Constructora Test S.A.',
  taxId: '20123456789',
  address: 'Av. Central 123, San José, Costa Rica',
  phone: '+506 2234-5678',
  email: 'contacto@test.com',
  website: 'https://www.test.com',
  industry: 'Construcción',
  employeeCount: 50,
  contactPerson: {
    name: 'Juan Pérez González',
    position: 'Gerente General',
    email: 'juan.perez@test.com',
    phone: '+506 8765-4321'
  },
  legalRepresentative: {
    name: 'Juan Pérez González',
    cedula: '1-1234-5678',
    position: 'Gerente General'
  },
  insuranceInfo: {
    provider: 'INS',
    policyNumber: 'POL-TEST-2024-001',
    expiryDate: '2025-12-31',
    coverage: 'Responsabilidad civil y riesgos del trabajo'
  },
  status: 'active'
};

const steps = [
  'Información Básica',
  'Contacto y Representación',
  'Seguro y Certificaciones',
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

const insuranceProviders = [
  'INS',
  'Mapfre',
  'BCR Seguros',
  'Mutual Cartago',
  'Pan-American Life',
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
  const [certifications, setCertifications] = useState<CompanyCertification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Certification dialog
  const [certDialogOpen, setCertDialogOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<CompanyCertification | null>(null);
  const [certForm, setCertForm] = useState({
    name: '',
    issuedBy: '',
    issueDate: '',
    expiryDate: '',
    status: 'valid' as 'valid' | 'expired' | 'pending'
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
        setFormData({
          name: company.name,
          taxId: company.ruc || company.taxId || '',
          address: company.address,
          phone: company.phone,
          email: company.email,
          website: company.website || '',
          industry: company.industry,
          employeeCount: company.employeeCount,
          contactPerson: company.contactPerson,
          legalRepresentative: company.legalRepresentative,
          insuranceInfo: {
            provider: company.insuranceInfo?.provider || '',
            policyNumber: company.insuranceInfo?.policyNumber || '',
            expiryDate: company.insuranceInfo?.expiryDate ? 
              new Date(company.insuranceInfo.expiryDate).toISOString().split('T')[0] : '',
            coverage: company.insuranceInfo?.coverage || ''
          },
          status: company.status
        });
        
        setCertifications(company.certifications || []);
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
      setFormData(prev => ({
        ...prev,
        [fieldPath[0]]: {
          ...(prev as any)[fieldPath[0]],
          [fieldPath[1]]: value
        }
      }));
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

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 4) return digits;
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}`;
  };

  const isValidUrl = (url: string): boolean => {
    if (!url.trim()) return true; // Optional field
    try {
      new URL(url);
      return true;
    } catch {
      // Try with https:// prefix
      try {
        new URL(`https://${url}`);
        return true;
      } catch {
        return false;
      }
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
        if (!formData.phone.trim()) newErrors.phone = 'Teléfono es requerido';
        if (!formData.email.trim()) newErrors.email = 'Email es requerido';
        if (formData.website && !isValidUrl(formData.website)) {
          newErrors.website = 'URL del sitio web no es válida';
        }
        if (!formData.industry.trim()) newErrors.industry = 'Industria es requerida';
        if (formData.employeeCount <= 0) newErrors.employeeCount = 'Número de empleados debe ser mayor a 0';
        break;

      case 1: // Contacto y Representación
        if (!formData.contactPerson.name.trim()) newErrors['contactPerson.name'] = 'Nombre del contacto es requerido';
        if (!formData.contactPerson.position.trim()) newErrors['contactPerson.position'] = 'Posición del contacto es requerida';
        if (!formData.contactPerson.email.trim()) newErrors['contactPerson.email'] = 'Email del contacto es requerido';
        if (!formData.contactPerson.phone.trim()) newErrors['contactPerson.phone'] = 'Teléfono del contacto es requerido';
        if (!formData.legalRepresentative.name.trim()) newErrors['legalRepresentative.name'] = 'Nombre del representante legal es requerido';
        if (!formData.legalRepresentative.cedula.trim()) newErrors['legalRepresentative.cedula'] = 'Cédula del representante legal es requerida';
        if (!formData.legalRepresentative.position.trim()) newErrors['legalRepresentative.position'] = 'Posición del representante legal es requerida';
        break;

      case 2: // Seguro y Certificaciones
        if (!formData.insuranceInfo.provider.trim()) newErrors['insuranceInfo.provider'] = 'Proveedor de seguro es requerido';
        if (!formData.insuranceInfo.policyNumber.trim()) newErrors['insuranceInfo.policyNumber'] = 'Número de póliza es requerido';
        if (!formData.insuranceInfo.expiryDate.trim()) newErrors['insuranceInfo.expiryDate'] = 'Fecha de vencimiento es requerida';
        if (!formData.insuranceInfo.coverage.trim()) newErrors['insuranceInfo.coverage'] = 'Cobertura es requerida';
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
        website: websiteUrl || undefined,
        insuranceInfo: formData.insuranceInfo.expiryDate ? {
          ...formData.insuranceInfo,
          expiryDate: new Date(formData.insuranceInfo.expiryDate)
        } : undefined,
        certifications: certifications.map(cert => ({
          ...cert,
          issueDate: new Date(cert.issueDate),
          expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : undefined
        }))
      };

      if (isEditing && id) {
        await companyApi.update(id, companyData);
      } else {
        await companyApi.create(companyData);
      }

      navigate('/companies');
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
          setActiveStep(0); // Go back to first step where taxId is
        } else {
          setError(errorMessage);
        }
      } else {
        setError(err.response?.data?.message || 'Error al guardar la empresa');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/companies');
  };

  // Certification management
  const handleAddCertification = () => {
    setCertForm({
      name: '',
      issuedBy: '',
      issueDate: '',
      expiryDate: '',
      status: 'valid'
    });
    setEditingCert(null);
    setCertDialogOpen(true);
  };

  const handleEditCertification = (cert: CompanyCertification) => {
    setCertForm({
      name: cert.name,
      issuedBy: cert.issuedBy,
      issueDate: new Date(cert.issueDate).toISOString().split('T')[0],
      expiryDate: cert.expiryDate ? new Date(cert.expiryDate).toISOString().split('T')[0] : '',
      status: cert.status
    });
    setEditingCert(cert);
    setCertDialogOpen(true);
  };

  const handleSaveCertification = () => {
    if (!certForm.name || !certForm.issuedBy || !certForm.issueDate) {
      return;
    }

    const newCert: CompanyCertification = {
      name: certForm.name,
      issuedBy: certForm.issuedBy,
      issueDate: new Date(certForm.issueDate),
      expiryDate: certForm.expiryDate ? new Date(certForm.expiryDate) : undefined,
      status: certForm.status
    };

    if (editingCert) {
      setCertifications(prev => prev.map(cert => 
        cert === editingCert ? newCert : cert
      ));
    } else {
      setCertifications(prev => [...prev, newCert]);
    }

    setCertDialogOpen(false);
  };

  const handleDeleteCertification = (certToDelete: CompanyCertification) => {
    setCertifications(prev => prev.filter(cert => cert !== certToDelete));
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
              <TextField
                fullWidth
                label="Teléfono"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', `+506 ${formatPhone(e.target.value.replace('+506 ', ''))}`)}
                error={!!errors.phone}
                helperText={errors.phone}
                placeholder="+506 2234-5678"
                required
              />
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
                placeholder="https://www.empresa.com"
                error={!!errors.website}
                helperText={errors.website}
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
              <TextField
                fullWidth
                label="Número de Empleados"
                type="number"
                value={formData.employeeCount}
                onChange={(e) => handleInputChange('employeeCount', parseInt(e.target.value) || 0)}
                error={!!errors.employeeCount}
                helperText={errors.employeeCount}
                required
              />
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
                value={formData.contactPerson.name}
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
                value={formData.contactPerson.position}
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
                value={formData.contactPerson.email}
                onChange={(e) => handleInputChange('contactPerson.email', e.target.value)}
                error={!!errors['contactPerson.email']}
                helperText={errors['contactPerson.email']}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Teléfono"
                value={formData.contactPerson.phone}
                onChange={(e) => handleInputChange('contactPerson.phone', `+506 ${formatPhone(e.target.value.replace('+506 ', ''))}`)}
                error={!!errors['contactPerson.phone']}
                helperText={errors['contactPerson.phone']}
                placeholder="+506 8765-4321"
                required
              />
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
                value={formData.legalRepresentative.name}
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
                value={formData.legalRepresentative.cedula}
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
                value={formData.legalRepresentative.position}
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
                <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Información del Seguro
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required error={!!errors['insuranceInfo.provider']}>
                <InputLabel>Proveedor de Seguro</InputLabel>
                <Select
                  value={formData.insuranceInfo.provider}
                  onChange={(e) => handleInputChange('insuranceInfo.provider', e.target.value)}
                  label="Proveedor de Seguro"
                >
                  {insuranceProviders.map((provider) => (
                    <MenuItem key={provider} value={provider}>
                      {provider}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Número de Póliza"
                value={formData.insuranceInfo.policyNumber}
                onChange={(e) => handleInputChange('insuranceInfo.policyNumber', e.target.value)}
                error={!!errors['insuranceInfo.policyNumber']}
                helperText={errors['insuranceInfo.policyNumber']}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Fecha de Vencimiento"
                type="date"
                value={formData.insuranceInfo.expiryDate}
                onChange={(e) => handleInputChange('insuranceInfo.expiryDate', e.target.value)}
                error={!!errors['insuranceInfo.expiryDate']}
                helperText={errors['insuranceInfo.expiryDate']}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Cobertura"
                value={formData.insuranceInfo.coverage}
                onChange={(e) => handleInputChange('insuranceInfo.coverage', e.target.value)}
                error={!!errors['insuranceInfo.coverage']}
                helperText={errors['insuranceInfo.coverage']}
                multiline
                rows={2}
                required
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between', 
                alignItems: { xs: 'stretch', sm: 'center' }, 
                gap: { xs: 2, sm: 0 },
                mt: 3, 
                mb: 2 
              }}>
                <Typography variant={isMobile ? 'subtitle1' : 'h6'}>
                  Certificaciones
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={!isXs ? <AddIcon /> : undefined}
                  onClick={handleAddCertification}
                  size={isMobile ? 'medium' : 'large'}
                  fullWidth={isXs}
                >
                  {isXs ? 'Agregar' : 'Agregar Certificación'}
                </Button>
              </Box>
              
              {certifications.length > 0 ? (
                <List>
                  {certifications.map((cert, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={cert.name}
                        secondary={`${cert.issuedBy} - Vence: ${cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString('es-CR') : 'Sin vencimiento'}`}
                      />
                      <ListItemSecondaryAction>
                        <Chip
                          label={cert.status === 'valid' ? 'Válida' : cert.status === 'expired' ? 'Vencida' : 'Pendiente'}
                          color={cert.status === 'valid' ? 'success' : cert.status === 'expired' ? 'error' : 'warning'}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <IconButton onClick={() => handleEditCertification(cert)} size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteCertification(cert)} size="small" color="error">
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                  No hay certificaciones agregadas
                </Typography>
              )}
            </Grid>
          </Grid>
        );

      case 3:
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
                  <Typography variant="body2"><strong>Industria:</strong> {formData.industry}</Typography>
                  <Typography variant="body2"><strong>Empleados:</strong> {formData.employeeCount}</Typography>
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
                  <Typography variant="body2"><strong>Persona:</strong> {formData.contactPerson.name}</Typography>
                  <Typography variant="body2"><strong>Posición:</strong> {formData.contactPerson.position}</Typography>
                  <Typography variant="body2"><strong>Email:</strong> {formData.contactPerson.email}</Typography>
                  <Typography variant="body2"><strong>Teléfono:</strong> {formData.contactPerson.phone}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Representante Legal
                  </Typography>
                  <Typography variant="body2"><strong>Nombre:</strong> {formData.legalRepresentative.name}</Typography>
                  <Typography variant="body2"><strong>Cédula:</strong> {formData.legalRepresentative.cedula}</Typography>
                  <Typography variant="body2"><strong>Posición:</strong> {formData.legalRepresentative.position}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Seguro
                  </Typography>
                  <Typography variant="body2"><strong>Proveedor:</strong> {formData.insuranceInfo.provider}</Typography>
                  <Typography variant="body2"><strong>Póliza:</strong> {formData.insuranceInfo.policyNumber}</Typography>
                  <Typography variant="body2"><strong>Vencimiento:</strong> {formData.insuranceInfo.expiryDate}</Typography>
                </CardContent>
              </Card>
            </Grid>

            {certifications.length > 0 && (
              <Grid size={{ xs: 12 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Certificaciones ({certifications.length})
                    </Typography>
                    {certifications.map((cert, index) => (
                      <Typography key={index} variant="body2">
                        • {cert.name} - {cert.issuedBy}
                      </Typography>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            )}
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

      <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom>
        <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        {isEditing ? 'Editar Espacio de Trabajo' : 'Nuevo Espacio de Trabajo'}
      </Typography>

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

      {/* Certification Dialog */}
      <Dialog 
        open={certDialogOpen} 
        onClose={() => setCertDialogOpen(false)} 
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
        <DialogTitle>
          {editingCert ? 'Editar Certificación' : 'Nueva Certificación'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Nombre de la Certificación"
                value={certForm.name}
                onChange={(e) => setCertForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Emisor"
                value={certForm.issuedBy}
                onChange={(e) => setCertForm(prev => ({ ...prev, issuedBy: e.target.value }))}
                required
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Fecha de Emisión"
                type="date"
                value={certForm.issueDate}
                onChange={(e) => setCertForm(prev => ({ ...prev, issueDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Fecha de Vencimiento"
                type="date"
                value={certForm.expiryDate}
                onChange={(e) => setCertForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={certForm.status}
                  onChange={(e) => setCertForm(prev => ({ ...prev, status: e.target.value as any }))}
                  label="Estado"
                >
                  <MenuItem value="valid">Válida</MenuItem>
                  <MenuItem value="expired">Vencida</MenuItem>
                  <MenuItem value="pending">Pendiente</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ 
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          gap: { xs: 1, sm: 0 },
          p: { xs: 2, sm: 1 }
        }}>
          <Button 
            onClick={() => setCertDialogOpen(false)}
            fullWidth={isXs}
            size={isMobile ? 'medium' : 'large'}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveCertification} 
            variant="contained"
            fullWidth={isXs}
            size={isMobile ? 'medium' : 'large'}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};