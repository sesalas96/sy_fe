import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Alert,
  Breadcrumbs,
  Link,
  IconButton,
  Autocomplete,
  useTheme,
  useMediaQuery,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Fab
} from '@mui/material';
import {
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  School as SchoolIcon,
  VerifiedUser as CertificateIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { UserRole } from '../../types';
import { contractorApi, ContractorFormData, ContractorInitialCourse, ContractorAdditionalCourse } from '../../services/contractorApi';
import { useAuth } from '../../contexts/AuthContext';
import { usePageTitle } from '../../hooks/usePageTitle';

interface Company {
  _id: string;
  name: string;
  industry?: string;
}

type DialogType = 'initial-course' | 'additional-course' | 'certification' | null;

export const SupervisedContractorForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isEdit = !!id;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  usePageTitle(
    isEdit ? 'Editar Contratista' : 'Nuevo Contratista',
    isEdit ? 'Editar información del contratista' : 'Crear nuevo contratista'
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [supervisedCompanies, setSupervisedCompanies] = useState<Company[]>([]);
  const [availableSupervisors, setAvailableSupervisors] = useState<any[]>([]);

  const [formData, setFormData] = useState<ContractorFormData>({
    firstName: '',
    lastName: '',
    cedula: '',
    email: '',
    phone: '',
    companyId: '',
    status: 'active'
  });

  // Additional state for course and certification management
  const [initialCourses, setInitialCourses] = useState<ContractorInitialCourse[]>([]);
  const [additionalCourses, setAdditionalCourses] = useState<ContractorAdditionalCourse[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [newItem, setNewItem] = useState<any>({});

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const loadSupervisedCompanies = async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://sybe-production.up.railway.app/api';
      const response = await fetch(`${API_BASE_URL}/companies/supervised`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener empresas supervisadas');
      }

      const result = await response.json();
      
      if (result.success && result.data && result.data.companies) {
        // Filter to get only own and supervised companies (not contractors)
        const filteredCompanies = result.data.companies.filter((comp: any) => 
          comp.relationship === 'own_company' || comp.relationship === 'supervised_company'
        );
        setSupervisedCompanies(filteredCompanies.map((comp: any) => ({
          _id: comp._id,
          name: comp.name,
          industry: comp.industry
        })));
      }
    } catch (err) {
      console.error('Error loading supervised companies:', err);
      setError('Error al cargar las empresas supervisadas');
    }
  };

  const loadAvailableSupervisors = async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://sybe-production.up.railway.app/api';
      const response = await fetch(`${API_BASE_URL}/users?role=CLIENT_SUPERVISOR&isActive=true`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener supervisores');
      }

      const result = await response.json();
      
      if (result.success && result.data && result.data.users) {
        setAvailableSupervisors(result.data.users.map((sup: any) => ({
          _id: sup._id,
          firstName: sup.firstName,
          lastName: sup.lastName,
          email: sup.email,
          fullName: `${sup.firstName} ${sup.lastName}`
        })));
      }
    } catch (err) {
      console.error('Error loading supervisors:', err);
      // Don't show error for this - it's optional
    }
  };

  const loadContractor = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await contractorApi.getById(id);
      if (response.success && response.data) {
        const contractor = response.data;
        // Map Spanish status to English if needed
        let status = contractor.status;
        if (status === 'activo') status = 'active';
        else if (status === 'inactivo') status = 'inactive';
        else if (status === 'baja') status = 'suspended';
        
        setFormData({
          firstName: contractor.firstName,
          lastName: contractor.lastName,
          fullName: contractor.fullName || (contractor.firstName && contractor.lastName ? `${contractor.firstName} ${contractor.lastName}` : ''),
          cedula: contractor.cedula,
          email: contractor.email || '',
          phone: contractor.phone || '',
          companyId: contractor.company?._id || '',
          status: status as 'active' | 'inactive' | 'suspended',
          polizaINS: contractor.polizaINS,
          ordenPatronal: contractor.ordenPatronal
        });
        
        // Load existing courses and certifications
        setInitialCourses(contractor.initialCourses || []);
        setAdditionalCourses(contractor.additionalCourses || []);
        setCertifications(contractor.certifications || []);
      } else {
        setError(response.message || 'Error al cargar el contratista');
      }
    } catch (err) {
      setError('Error al cargar el contratista');
      console.error('Error loading contractor:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSupervisedCompanies();
    loadAvailableSupervisors();
    if (isEdit && id) {
      loadContractor();
    }
  }, [isEdit, id, loadContractor]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.firstName?.trim()) {
      errors.firstName = 'El nombre es requerido';
    }

    if (!formData.lastName?.trim()) {
      errors.lastName = 'El apellido es requerido';
    }

    if (!formData.cedula.trim()) {
      errors.cedula = 'La cédula es requerida';
    } else if (!/^\d{9}$/.test(formData.cedula.replace(/-/g, ''))) {
      errors.cedula = 'La cédula debe tener 9 dígitos';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'El email no es válido';
    }

    if (!formData.companyId) {
      errors.companyId = 'Debe seleccionar una empresa';
    }

    // polizaINS validation - only validate if number is provided
    if (formData.polizaINS?.number?.trim() && !formData.polizaINS?.expiryDate) {
      errors.polizaINSExpiry = 'Debe especificar la fecha de vencimiento de la póliza INS';
    }

    if (formData.ordenPatronal?.number && !formData.ordenPatronal?.expiryDate) {
      errors.ordenPatronalExpiry = 'Debe especificar la fecha de vencimiento de la orden patronal';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      let response;
      if (isEdit && id) {
        response = await contractorApi.update(id, formData);
      } else {
        response = await contractorApi.create(formData);
      }

      if (response.success) {
        setSuccess(isEdit ? 'Contratista actualizado exitosamente' : 'Contratista creado exitosamente');
        setTimeout(() => {
          navigate('/supervised-contractors');
        }, 2000);
      } else {
        setError(response.message || 'Error al guardar el contratista');
      }
    } catch (err) {
      setError(isEdit ? 'Error al actualizar el contratista' : 'Error al crear el contratista');
      console.error('Error saving contractor:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ContractorFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.value;
    setFormData(prev => {
      // If changing fullName, update firstName and lastName
      if (field === 'fullName') {
        const names = value.split(' ');
        return {
          ...prev,
          fullName: value,
          firstName: names[0] || '',
          lastName: names.slice(1).join(' ') || ''
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handlePolizaChange = (field: 'number' | 'expiryDate') => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      polizaINS: {
        number: prev.polizaINS?.number || '',
        expiryDate: prev.polizaINS?.expiryDate || '',
        ...prev.polizaINS,
        [field]: value
      }
    }));
  };

  const handleOrdenPatronalChange = (field: 'number' | 'expiryDate') => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      ordenPatronal: {
        ...prev.ordenPatronal,
        [field]: value
      } as any
    }));
  };

  // Dialog handling
  const openDialog = (type: DialogType, item?: any) => {
    setDialogType(type);
    setEditingItem(item || null);
    setNewItem(item || getDefaultItem(type));
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setDialogType(null);
    setEditingItem(null);
    setNewItem({});
  };

  const getDefaultItem = (type: DialogType) => {
    switch (type) {
      case 'initial-course':
      case 'additional-course':
        return { name: '', completionDate: '', certificateUrl: '' };
      case 'certification':
        return { 
          type: '', 
          name: '', 
          issuedBy: '', 
          issueDate: '', 
          expiryDate: '', 
          certificateNumber: '' 
        };
      default:
        return {};
    }
  };

  const handleSaveItem = async () => {
    if (!id || !isEdit) {
      // For new contractors, just update local state
      switch (dialogType) {
        case 'initial-course':
          if (editingItem) {
            setInitialCourses(prev => prev.map(course => 
              course._id === editingItem._id ? { ...editingItem, ...newItem } : course
            ));
          } else {
            setInitialCourses(prev => [...prev, { ...newItem, _id: Date.now().toString() }]);
          }
          break;
        case 'additional-course':
          if (editingItem) {
            setAdditionalCourses(prev => prev.map(course => 
              course._id === editingItem._id ? { ...editingItem, ...newItem } : course
            ));
          } else {
            setAdditionalCourses(prev => [...prev, { ...newItem, _id: Date.now().toString() }]);
          }
          break;
        case 'certification':
          if (editingItem) {
            setCertifications(prev => prev.map(cert => 
              cert._id === editingItem._id ? { ...editingItem, ...newItem } : cert
            ));
          } else {
            setCertifications(prev => [...prev, { ...newItem, _id: Date.now().toString() }]);
          }
          break;
      }
      closeDialog();
      return;
    }

    try {
      setLoading(true);
      let response;

      switch (dialogType) {
        case 'initial-course':
          if (editingItem) {
            response = await contractorApi.updateInitialCourse(id, editingItem._id, newItem);
          } else {
            response = await contractorApi.addInitialCourse(id, newItem);
          }
          break;
        case 'additional-course':
          if (editingItem) {
            response = await contractorApi.updateAdditionalCourse(id, editingItem._id, newItem);
          } else {
            response = await contractorApi.addAdditionalCourse(id, newItem);
          }
          break;
        case 'certification':
          response = await contractorApi.addCertification(id, newItem);
          break;
      }

      if (response?.success) {
        // Reload contractor data to get updated courses/certifications
        await loadContractor();
        setSuccess(`${getItemTypeName(dialogType)} ${editingItem ? 'actualizado' : 'agregado'} exitosamente`);
      } else {
        setError(response?.message || 'Error al guardar');
      }
    } catch (err) {
      setError('Error al guardar el elemento');
      console.error('Error saving item:', err);
    } finally {
      setLoading(false);
      closeDialog();
    }
  };

  const handleDeleteItem = async (type: DialogType, itemId: string) => {
    if (!id || !isEdit) {
      // For new contractors, just update local state
      switch (type) {
        case 'initial-course':
          setInitialCourses(prev => prev.filter(course => course._id !== itemId));
          break;
        case 'additional-course':
          setAdditionalCourses(prev => prev.filter(course => course._id !== itemId));
          break;
        case 'certification':
          setCertifications(prev => prev.filter(cert => cert._id !== itemId));
          break;
      }
      return;
    }

    try {
      setLoading(true);
      let response;

      switch (type) {
        case 'initial-course':
          response = await contractorApi.deleteInitialCourse(id, itemId);
          break;
        case 'additional-course':
          response = await contractorApi.deleteAdditionalCourse(id, itemId);
          break;
      }

      if (response?.success) {
        await loadContractor();
        setSuccess(`${getItemTypeName(type)} eliminado exitosamente`);
      } else {
        setError(response?.message || 'Error al eliminar');
      }
    } catch (err) {
      setError('Error al eliminar el elemento');
      console.error('Error deleting item:', err);
    } finally {
      setLoading(false);
    }
  };

  const getItemTypeName = (type: DialogType) => {
    switch (type) {
      case 'initial-course': return 'Curso inicial';
      case 'additional-course': return 'Curso adicional';
      case 'certification': return 'Certificación';
      default: return 'Elemento';
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-ES');
  };

  // Only CLIENT_SUPERVISOR can access this
  if (user?.role !== UserRole.CLIENT_SUPERVISOR) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tiene permisos para {isEdit ? 'editar' : 'crear'} contratistas.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          color="inherit"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('/supervised-contractors');
          }}
        >
          Contratistas
        </Link>
        <Typography color="textPrimary">
          {isEdit ? 'Editar Contratista' : 'Nuevo Contratista'}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: 3,
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          <IconButton
            onClick={() => navigate('/supervised-contractors')}
            sx={{ mr: { xs: 1, sm: 2 } }}
            size={isMobile ? 'small' : 'medium'}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <PersonIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: isMobile ? '1.5rem' : '2rem' }} />
            {isEdit ? 'Editar Contratista' : 'Nuevo Contratista'}
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={{ xs: 2, sm: 3 }}>
              {/* Información Personal */}
              <Box>
                <Typography variant={isMobile ? 'subtitle1' : 'h6'} gutterBottom sx={{ fontWeight: 600 }}>
                  Información Personal
                </Typography>
              </Box>

              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' }, 
                gap: { xs: 2, sm: 3 } 
              }}>
                <TextField
                  fullWidth
                  label="Nombre Completo"
                  value={formData.fullName}
                  onChange={handleInputChange('fullName')}
                  error={!!validationErrors.fullName}
                  helperText={validationErrors.fullName || 'Ingrese el nombre completo del contratista'}
                  required
                  size={isMobile ? 'small' : 'medium'}
                />
                <TextField
                  fullWidth
                  label="Cédula"
                  value={formData.cedula}
                  onChange={handleInputChange('cedula')}
                  error={!!validationErrors.cedula}
                  helperText={validationErrors.cedula}
                  required
                  placeholder="123456789"
                  size={isMobile ? 'small' : 'medium'}
                />
              </Box>

              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' }, 
                gap: { xs: 2, sm: 3 } 
              }}>
                <TextField
                  fullWidth
                  label="Correo Electrónico"
                  type="email"
                  value={formData.email || ''}
                  onChange={handleInputChange('email')}
                  error={!!validationErrors.email}
                  helperText={validationErrors.email}
                  placeholder="ejemplo@correo.com"
                  size={isMobile ? 'small' : 'medium'}
                />
                <TextField
                  fullWidth
                  label="Teléfono"
                  value={formData.phone || ''}
                  onChange={handleInputChange('phone')}
                  placeholder="8888-8888"
                  size={isMobile ? 'small' : 'medium'}
                />
              </Box>

              {/* Espacios de Trabajo y Estado */}
              <Box>
                <Typography variant={isMobile ? 'subtitle1' : 'h6'} gutterBottom sx={{ mt: 2, fontWeight: 600 }}>
                  Espacios de Trabajo y Estado
                </Typography>
              </Box>

              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' }, 
                gap: { xs: 2, sm: 3 } 
              }}>
                <Autocomplete
                  options={supervisedCompanies}
                  getOptionLabel={(option) => option.name}
                  value={supervisedCompanies.find(c => c._id === formData.companyId) || null}
                  onChange={(_, newValue) => {
                    setFormData(prev => ({
                      ...prev,
                      companyId: newValue?._id || ''
                    }));
                    // Clear validation error
                    if (validationErrors.companyId) {
                      setValidationErrors(prev => ({
                        ...prev,
                        companyId: ''
                      }));
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Espacios de Trabajo"
                      placeholder="Seleccionar empresa supervisada"
                      required
                      error={!!validationErrors.companyId}
                      helperText={validationErrors.companyId}
                      size={isMobile ? 'small' : 'medium'}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant={isMobile ? 'caption' : 'body2'}>
                          {option.name}
                        </Typography>
                        {option.industry && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: isMobile ? '0.625rem' : '0.75rem' }}>
                            {option.industry}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                />
                <FormControl fullWidth required size={isMobile ? 'small' : 'medium'}>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={handleInputChange('status')}
                    label="Estado"
                  >
                    <MenuItem value="active">Activo</MenuItem>
                    <MenuItem value="inactive">Inactivo</MenuItem>
                    <MenuItem value="suspended">Suspendido</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Supervisor Assignment */}
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' }, 
                gap: { xs: 2, sm: 3 } 
              }}>
                <Autocomplete
                  options={availableSupervisors}
                  getOptionLabel={(option) => option.fullName}
                  value={availableSupervisors.find(s => s._id === formData.supervisorId) || null}
                  onChange={(_, newValue) => {
                    setFormData(prev => ({
                      ...prev,
                      supervisorId: newValue?._id || ''
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Supervisor Asignado (Opcional)"
                      placeholder="Seleccionar supervisor"
                      size={isMobile ? 'small' : 'medium'}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant={isMobile ? 'caption' : 'body2'}>
                          {option.fullName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: isMobile ? '0.625rem' : '0.75rem' }}>
                          {option.email}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  fullWidth
                />
              </Box>

              {/* Documentos */}
              <Box>
                <Typography variant={isMobile ? 'subtitle1' : 'h6'} gutterBottom sx={{ mt: 2, fontWeight: 600 }}>
                  Documentos
                </Typography>
              </Box>

              {/* Póliza INS */}
              <Box>
                <Typography variant={isMobile ? 'body2' : 'subtitle1'} gutterBottom sx={{ color: 'text.secondary' }}>
                  Póliza INS (Opcional)
                </Typography>
              </Box>

              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' }, 
                gap: { xs: 2, sm: 3 } 
              }}>
                <TextField
                  fullWidth
                  label="Número de Póliza INS"
                  value={formData.polizaINS?.number || ''}
                  onChange={handlePolizaChange('number')}
                  error={!!validationErrors.polizaINSNumber}
                  helperText={validationErrors.polizaINSNumber}
                  placeholder="POL-2024-001"
                  size={isMobile ? 'small' : 'medium'}
                />
                <TextField
                  fullWidth
                  label="Fecha de Vencimiento"
                  type="date"
                  value={formData.polizaINS?.expiryDate ? formData.polizaINS.expiryDate.split('T')[0] : ''}
                  onChange={handlePolizaChange('expiryDate')}
                  error={!!validationErrors.polizaINSExpiry}
                  helperText={validationErrors.polizaINSExpiry}
                  slotProps={{
                    inputLabel: { shrink: true }
                  }}
                  size={isMobile ? 'small' : 'medium'}
                />
              </Box>

              {/* Orden Patronal */}
              <Box>
                <Typography variant={isMobile ? 'body2' : 'subtitle1'} gutterBottom sx={{ mt: 1, color: 'text.secondary' }}>
                  Orden Patronal (Opcional)
                </Typography>
              </Box>

              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' }, 
                gap: { xs: 2, sm: 3 } 
              }}>
                <TextField
                  fullWidth
                  label="Número de Orden Patronal"
                  value={formData.ordenPatronal?.number || ''}
                  onChange={handleOrdenPatronalChange('number')}
                  placeholder="ORD-2024-001"
                  size={isMobile ? 'small' : 'medium'}
                />
                <TextField
                  fullWidth
                  label="Fecha de Vencimiento"
                  type="date"
                  value={formData.ordenPatronal?.expiryDate ? formData.ordenPatronal.expiryDate.split('T')[0] : ''}
                  onChange={handleOrdenPatronalChange('expiryDate')}
                  error={!!validationErrors.ordenPatronalExpiry}
                  helperText={validationErrors.ordenPatronalExpiry}
                  slotProps={{
                    inputLabel: { shrink: true }
                  }}
                  size={isMobile ? 'small' : 'medium'}
                />
              </Box>

              {/* Initial Courses Section */}
              {isEdit && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                        <SchoolIcon sx={{ mr: 1 }} />
                        Cursos Iniciales
                      </Typography>
                      <Fab
                        size="small"
                        color="primary"
                        onClick={() => openDialog('initial-course')}
                        sx={{ boxShadow: 2 }}
                      >
                        <AddIcon />
                      </Fab>
                    </Box>
                    
                    {initialCourses.length > 0 ? (
                      <List dense>
                        {initialCourses.map((course) => (
                          <ListItem key={course._id} divider>
                            <ListItemText
                              primary={course.name}
                              secondary={`Completado: ${formatDate(course.completionDate)}`}
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                onClick={() => openDialog('initial-course', course)}
                                sx={{ mr: 1 }}
                                size="small"
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                edge="end"
                                onClick={() => handleDeleteItem('initial-course', course._id!)}
                                color="error"
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                        No hay cursos iniciales registrados
                      </Typography>
                    )}
                  </Box>

                  {/* Additional Courses Section */}
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                        <AssignmentIcon sx={{ mr: 1 }} />
                        Cursos Adicionales
                      </Typography>
                      <Fab
                        size="small"
                        color="secondary"
                        onClick={() => openDialog('additional-course')}
                        sx={{ boxShadow: 2 }}
                      >
                        <AddIcon />
                      </Fab>
                    </Box>
                    
                    {additionalCourses.length > 0 ? (
                      <List dense>
                        {additionalCourses.map((course) => (
                          <ListItem key={course._id} divider>
                            <ListItemText
                              primary={course.name}
                              secondary={
                                <Box>
                                  <Typography variant="caption" display="block">
                                    Completado: {formatDate(course.completionDate)}
                                  </Typography>
                                  {course.expiryDate && (
                                    <Typography variant="caption" display="block">
                                      Vence: {formatDate(course.expiryDate)}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                onClick={() => openDialog('additional-course', course)}
                                sx={{ mr: 1 }}
                                size="small"
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                edge="end"
                                onClick={() => handleDeleteItem('additional-course', course._id!)}
                                color="error"
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                        No hay cursos adicionales registrados
                      </Typography>
                    )}
                  </Box>

                  {/* Certifications Section */}
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                        <CertificateIcon sx={{ mr: 1 }} />
                        Certificaciones
                      </Typography>
                      <Fab
                        size="small"
                        color="success"
                        onClick={() => openDialog('certification')}
                        sx={{ boxShadow: 2 }}
                      >
                        <AddIcon />
                      </Fab>
                    </Box>
                    
                    {certifications.length > 0 ? (
                      <List dense>
                        {certifications.map((cert) => (
                          <ListItem key={cert._id} divider>
                            <ListItemText
                              primary={cert.name}
                              secondary={
                                <Box>
                                  <Typography variant="caption" display="block">
                                    Emitido por: {cert.issuedBy}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    Fecha de emisión: {formatDate(cert.issueDate)}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    Vence: {formatDate(cert.expiryDate)}
                                  </Typography>
                                  <Chip
                                    label={cert.status === 'valid' ? 'Válida' : cert.status}
                                    color={cert.status === 'valid' ? 'success' : 'default'}
                                    size="small"
                                    sx={{ mt: 0.5 }}
                                  />
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                onClick={() => openDialog('certification', cert)}
                                sx={{ mr: 1 }}
                                size="small"
                              >
                                <EditIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                        No hay certificaciones registradas
                      </Typography>
                    )}
                  </Box>
                </>
              )}

              {/* Información adicional */}
              <Box>
                <Alert severity="info" sx={{ mt: 2, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  {isEdit 
                    ? 'Puede gestionar cursos y certificaciones del contratista utilizando los botones de agregar (+) en cada sección.'
                    : 'Este contratista será asignado a la empresa supervisada seleccionada. Los cursos iniciales y adicionales se pueden gestionar después de crear el contratista.'
                  }
                </Alert>
              </Box>

              {/* Botones */}
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                justifyContent: { xs: 'center', sm: 'flex-end' }, 
                mt: 3,
                flexDirection: { xs: 'column', sm: 'row' }
              }}>
                <Button
                  variant="outlined"
                  startIcon={!isMobile && <CancelIcon />}
                  onClick={() => navigate('/supervised-contractors')}
                  disabled={loading}
                  fullWidth={isMobile}
                  size={isMobile ? 'medium' : 'large'}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={!isMobile && <SaveIcon />}
                  disabled={loading}
                  fullWidth={isMobile}
                  size={isMobile ? 'medium' : 'large'}
                >
                  {loading ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Crear')}
                </Button>
              </Box>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* Dialog for adding/editing items */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingItem ? 'Editar' : 'Agregar'} {getItemTypeName(dialogType)}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {dialogType === 'initial-course' || dialogType === 'additional-course' ? (
              <>
                <TextField
                  fullWidth
                  label="Nombre del Curso"
                  value={newItem.name || ''}
                  onChange={(e) => setNewItem((prev: any) => ({ ...prev, name: e.target.value }))}
                  required
                />
                <TextField
                  fullWidth
                  label="Fecha de Finalización"
                  type="date"
                  value={newItem.completionDate || ''}
                  onChange={(e) => setNewItem((prev: any) => ({ ...prev, completionDate: e.target.value }))}
                  slotProps={{ inputLabel: { shrink: true } }}
                  required
                />
                {dialogType === 'additional-course' && (
                  <TextField
                    fullWidth
                    label="Fecha de Vencimiento (Opcional)"
                    type="date"
                    value={newItem.expiryDate || ''}
                    onChange={(e) => setNewItem((prev: any) => ({ ...prev, expiryDate: e.target.value }))}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                )}
                <TextField
                  fullWidth
                  label="URL del Certificado (Opcional)"
                  value={newItem.certificateUrl || ''}
                  onChange={(e) => setNewItem((prev: any) => ({ ...prev, certificateUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </>
            ) : dialogType === 'certification' ? (
              <>
                <TextField
                  fullWidth
                  label="Tipo de Certificación"
                  value={newItem.type || ''}
                  onChange={(e) => setNewItem((prev: any) => ({ ...prev, type: e.target.value }))}
                  required
                />
                <TextField
                  fullWidth
                  label="Nombre de la Certificación"
                  value={newItem.name || ''}
                  onChange={(e) => setNewItem((prev: any) => ({ ...prev, name: e.target.value }))}
                  required
                />
                <TextField
                  fullWidth
                  label="Emitido por"
                  value={newItem.issuedBy || ''}
                  onChange={(e) => setNewItem((prev: any) => ({ ...prev, issuedBy: e.target.value }))}
                  required
                />
                <TextField
                  fullWidth
                  label="Fecha de Emisión"
                  type="date"
                  value={newItem.issueDate || ''}
                  onChange={(e) => setNewItem((prev: any) => ({ ...prev, issueDate: e.target.value }))}
                  slotProps={{ inputLabel: { shrink: true } }}
                  required
                />
                <TextField
                  fullWidth
                  label="Fecha de Vencimiento"
                  type="date"
                  value={newItem.expiryDate || ''}
                  onChange={(e) => setNewItem((prev: any) => ({ ...prev, expiryDate: e.target.value }))}
                  slotProps={{ inputLabel: { shrink: true } }}
                  required
                />
                <TextField
                  fullWidth
                  label="Número de Certificado"
                  value={newItem.certificateNumber || ''}
                  onChange={(e) => setNewItem((prev: any) => ({ ...prev, certificateNumber: e.target.value }))}
                  required
                />
                <TextField
                  fullWidth
                  label="URL del Documento (Opcional)"
                  value={newItem.documentUrl || ''}
                  onChange={(e) => setNewItem((prev: any) => ({ ...prev, documentUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveItem} 
            variant="contained" 
            disabled={loading || !newItem.name}
          >
            {loading ? 'Guardando...' : (editingItem ? 'Actualizar' : 'Agregar')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};