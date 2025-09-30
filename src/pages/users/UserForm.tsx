import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
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
  Switch,
  FormControlLabel,
  Autocomplete,
  Tooltip,
  FormHelperText,
  InputAdornment,
  IconButton,
  Snackbar,
  Alert as MuiAlert,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  RemoveCircleOutline as RemoveCircleOutlineIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { UserRole, User } from '../../types';
import { userApi, UserFormData, ApiResponse } from '../../services/userApi';
import { companyApi } from '../../services/companyApi';
import { DepartmentService, Department } from '../../services/departmentService';
import { useAuth } from '../../contexts/AuthContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/material.css';

interface Company {
  _id: string;
  name: string;
}

export const UserForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  const isEdit = !!id;

  usePageTitle(
    isEdit ? 'Editar Usuario' : 'Nuevo Usuario',
    isEdit ? 'Editar información del usuario' : 'Crear nuevo usuario del sistema'
  );

  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [companyInputValue, setCompanyInputValue] = useState<Company | null>(null);
  const [departmentsByCompany, setDepartmentsByCompany] = useState<Record<string, Department[]>>({});
  const [loadingDepartments, setLoadingDepartments] = useState<Record<string, boolean>>({});
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: UserRole.CLIENT_STAFF,
    company: '',
    isActive: true,
    cedula: '',
    companies: []
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCompanies();
    if (isEdit && id) {
      loadUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, id]);

  const loadCompanies = async () => {
    try {
      const response = await companyApi.getAll({ limit: 100 });
      if (response.success && response.data) {
        setCompanies(response.data);
      }
    } catch (err) {
      console.error('Error loading companies:', err);
    }
  };

  const loadDepartmentsByCompany = async (companyId: string) => {
    if (!companyId) return;

    try {
      setLoadingDepartments(prev => ({ ...prev, [companyId]: true }));
      const departmentsList = await DepartmentService.getDepartments({ 
        companyId,
        isActive: true 
      });
      // Store departments by company
      setDepartmentsByCompany(prev => ({
        ...prev,
        [companyId]: departmentsList
      }));
    } catch (err) {
      console.error('Error loading departments:', err);
      setSnackbar({
        open: true,
        message: 'Error al cargar los departamentos',
        severity: 'error'
      });
    } finally {
      setLoadingDepartments(prev => ({ ...prev, [companyId]: false }));
    }
  };

  const loadUser = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await userApi.getById(id);
      if (response.success && response.data) {
        const user = response.data;
        setFormData({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone || user.profile?.phone || '',
          role: user.role,
          company: user.company?._id || '',
          isActive: user.isActive,
          cedula: user.cedula || '',
          companies: user.companies && user.companies.length > 0 
            ? user.companies.map(uc => {
                // Get departments for this company
                const companyDepartments = user.departments
                  ?.filter(dept => dept.company && dept.company._id === uc.companyId)
                  ?.map(dept => dept._id) || [];
                
                return {
                  companyId: uc.companyId || '',
                  departments: companyDepartments,
                  role: uc.role || user.role,
                  isPrimary: uc.isPrimary || false,
                  position: '',
                  department: ''
                };
              })
            : user.company?._id 
              ? [{
                  companyId: user.company._id,
                  departments: user.departments
                    ?.filter(dept => dept.company && dept.company._id === user.company?._id)
                    ?.map(dept => dept._id) || [],
                  role: user.role,
                  isPrimary: true,
                  position: '',
                  department: ''
                }]
              : []
        });
        
        // Load departments for the user's company and existing assignments
        if (user.company?._id) {
          loadDepartmentsByCompany(user.company._id);
        }
        
        // Load departments for all user companies if they have multiple
        if (user.companies && user.companies.length > 0) {
          // Load departments for all companies
          user.companies.forEach(uc => {
            if (uc.companyId) {
              loadDepartmentsByCompany(uc.companyId);
            }
          });
        }
      } else {
        setSnackbar({
          open: true,
          message: response.message || 'Error al cargar el usuario',
          severity: 'error'
        });
      }
    } catch (err) {
      console.error('Error loading user:', err);
      setSnackbar({
        open: true,
        message: 'Error al cargar el usuario',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'El formato del email no es válido';
    }

    if (!formData.firstName.trim()) {
      errors.firstName = 'El nombre es requerido';
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = 'El nombre debe tener al menos 2 caracteres';
    } else if (formData.firstName.trim().length > 50) {
      errors.firstName = 'El nombre no puede tener más de 50 caracteres';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'El apellido es requerido';
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = 'El apellido debe tener al menos 2 caracteres';
    } else if (formData.lastName.trim().length > 50) {
      errors.lastName = 'El apellido no puede tener más de 50 caracteres';
    }

    // Cédula validation - required for creation
    if (!formData.cedula?.trim()) {
      errors.cedula = 'La cédula es requerida';
    } else if (!/^\d{9,12}$/.test(formData.cedula.trim())) {
      errors.cedula = 'La cédula debe contener entre 9 y 12 dígitos';
    }

    if (!isEdit && !formData.password) {
      errors.password = 'La contraseña es requerida';
    }

    // Password validation for both create and edit (when password is provided)
    if (formData.password) {
      if (formData.password.length < 8) {
        errors.password = 'La contraseña debe tener al menos 8 caracteres';
      } else if (!/(?=.*[a-z])/.test(formData.password)) {
        errors.password = 'La contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial';
      } else if (!/(?=.*[A-Z])/.test(formData.password)) {
        errors.password = 'La contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial';
      } else if (!/(?=.*\d)/.test(formData.password)) {
        errors.password = 'La contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial';
      } else if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(formData.password)) {
        errors.password = 'La contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial';
      }
    }

    if (formData.phone) {
      // Validar que el número tenga formato internacional válido
      const cleanPhone = formData.phone.replace(/[\s-()]/g, ''); // Eliminar espacios, guiones y paréntesis

      if (!cleanPhone.startsWith('+')) {
        errors.phone = 'El número debe incluir el código de país (ej: +506 para Costa Rica)';
      } else if (cleanPhone.length < 8) { // Mínimo +X XXXX (código país + 4 dígitos)
        errors.phone = 'Número de teléfono demasiado corto';
      } else if (cleanPhone.length > 20) { // Máximo razonable para números internacionales
        errors.phone = 'Número de teléfono demasiado largo';
      }
    }

    // Validate companies assignment
    if (!formData.companies || formData.companies.length === 0) {
      errors.companies = 'Debe asignar al menos una empresa al usuario';
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

      const submitData: UserFormData = {
        ...formData,
        ...(isEdit && !formData.password && { password: undefined }),
        // If we have companies array, don't send the single company field
        ...(formData.companies && formData.companies.length > 0 && { company: undefined })
      };

      let response: ApiResponse<User>;
      if (isEdit && id) {
        response = await userApi.update(id, submitData);
      } else {
        response = await userApi.create(submitData);
      }

      if (response.success) {
        setSnackbar({
          open: true,
          message: response.message || (isEdit ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente'),
          severity: 'success'
        });
        setTimeout(() => {
          navigate('/system-users');
        }, 1500);
      } else {
        // Handle error response from the API using normalized structure
        let errorMessage = response.error || response.message || 'Error al guardar el usuario';
        
        // Handle details - can be string or array of field errors
        if (response.details) {
          if (typeof response.details === 'string') {
            errorMessage = `${errorMessage}. ${response.details}`;
          } else if (Array.isArray(response.details)) {
            // Process array of field errors
            const fieldErrors: Record<string, string> = {};
            const errorMessages: string[] = [];
            
            response.details.forEach((detail: any) => {
              if (detail.field && detail.message) {
                // Map English field names to Spanish labels
                const fieldLabels: Record<string, string> = {
                  firstName: 'Nombre',
                  lastName: 'Apellido',
                  email: 'Email',
                  cedula: 'Cédula',
                  phone: 'Teléfono',
                  password: 'Contraseña'
                };
                
                const fieldLabel = fieldLabels[detail.field] || detail.field;
                
                // Set validation error for the field
                fieldErrors[detail.field] = typeof detail.message === 'string' ? detail.message : 'Error en este campo';
                
                // Add to error messages list
                errorMessages.push(`${fieldLabel}: ${detail.message}`);
              }
            });
            
            // Update validation errors
            setValidationErrors(prev => ({
              ...prev,
              ...fieldErrors
            }));
            
            // Add field errors to main message
            if (errorMessages.length > 0) {
              errorMessage = `${errorMessage}\n${errorMessages.join('\n')}`;
            }
          }
        }
        
        // Also highlight single field with error if specified
        if (response.field && typeof response.field === 'string') {
          const errorText = typeof response.error === 'string' ? response.error : 'Error en este campo';
          setValidationErrors(prev => ({
            ...prev,
            [response.field as string]: errorText
          }));
        }
        
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error'
        });
      }
    } catch (err: any) {
      // Handle network or other errors
      let errorMessage = 'Error de conexión. Por favor, verifique su conexión a internet.';
      
      if (err.response?.data) {
        const errorData = err.response.data;
        // Use normalized error structure from backend
        errorMessage = errorData.error || errorData.message || 'Error al procesar la solicitud';
        
        // Handle details - can be string or array of field errors
        if (errorData.details) {
          if (typeof errorData.details === 'string') {
            errorMessage = `${errorMessage}. ${errorData.details}`;
          } else if (Array.isArray(errorData.details)) {
            // Process array of field errors
            const fieldErrors: Record<string, string> = {};
            const errorMessages: string[] = [];
            
            errorData.details.forEach((detail: any) => {
              if (detail.field && detail.message) {
                // Map English field names to Spanish labels
                const fieldLabels: Record<string, string> = {
                  firstName: 'Nombre',
                  lastName: 'Apellido',
                  email: 'Email',
                  cedula: 'Cédula',
                  phone: 'Teléfono',
                  password: 'Contraseña'
                };
                
                const fieldLabel = fieldLabels[detail.field] || detail.field;
                
                // Set validation error for the field
                fieldErrors[detail.field] = typeof detail.message === 'string' ? detail.message : 'Error en este campo';
                
                // Add to error messages list
                errorMessages.push(`${fieldLabel}: ${detail.message}`);
              }
            });
            
            // Update validation errors
            setValidationErrors(prev => ({
              ...prev,
              ...fieldErrors
            }));
            
            // Add field errors to main message
            if (errorMessages.length > 0) {
              errorMessage = `${errorMessage}\n${errorMessages.join('\n')}`;
            }
          }
        }
        
        // Also highlight single field with error if specified
        if (errorData.field && typeof errorData.field === 'string') {
          const errorText = typeof errorData.error === 'string' ? errorData.error : 'Error en este campo';
          setValidationErrors(prev => ({
            ...prev,
            [errorData.field as string]: errorText
          }));
        }
      }
      
      console.error('Error saving user:', err);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UserFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSwitchChange = (field: keyof UserFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.checked
    }));
  };

  const getRoleLabel = (role: UserRole) => {
    const roleLabels: Record<UserRole, string> = {
      [UserRole.SUPER_ADMIN]: 'Administrador',
      [UserRole.SAFETY_STAFF]: 'Personal de Safety',
      [UserRole.CLIENT_SUPERVISOR]: 'Supervisores',
      [UserRole.CLIENT_APPROVER]: 'Verificadores',
      [UserRole.CLIENT_STAFF]: 'Interno',
      [UserRole.VALIDADORES_OPS]: 'Validador Operaciones',
      [UserRole.CONTRATISTA_ADMIN]: 'Contratista Admin',
      [UserRole.CONTRATISTA_SUBALTERNOS]: 'Contratista Subalterno',
      [UserRole.CONTRATISTA_HUERFANO]: 'Contratista Particular'
    };
    return roleLabels[role] || role;
  };

  const canManageUser = () => {
    return hasRole([UserRole.SUPER_ADMIN, UserRole.SAFETY_STAFF]);
  };

  if (!canManageUser()) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error">
          No tienes permisos para {isEdit ? 'editar' : 'crear'} usuarios.
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
            navigate('/system-users');
          }}
        >
          Usuarios
        </Link>
        <Typography color="textPrimary">
          {isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            onClick={() => navigate('/system-users')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">
            <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            {isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
          </Typography>
        </Box>
      </Box>


      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSubmit} autoComplete="off">
            <Grid container spacing={3}>
              {/* Información Personal */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom>
                  Información Personal
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Nombre"
                  value={formData.firstName}
                  onChange={handleInputChange('firstName')}
                  error={!!validationErrors.firstName}
                  helperText={validationErrors.firstName || `${formData.firstName.length}/50 caracteres`}
                  required
                  autoComplete="off"
                  slotProps={{
                    htmlInput: {
                      maxLength: 50,
                      minLength: 2,
                      autoComplete: 'new-password'
                    }
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Apellido"
                  value={formData.lastName}
                  onChange={handleInputChange('lastName')}
                  error={!!validationErrors.lastName}
                  helperText={validationErrors.lastName || `${formData.lastName.length}/50 caracteres`}
                  required
                  autoComplete="off"
                  slotProps={{
                    htmlInput: {
                      maxLength: 50,
                      minLength: 2,
                      autoComplete: 'new-password'
                    }
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  error={!!validationErrors.email}
                  helperText={validationErrors.email}
                  required
                  autoComplete="off"
                  slotProps={{
                    htmlInput: {
                      autoComplete: 'new-password'
                    }
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Cédula"
                  value={formData.cedula}
                  onChange={handleInputChange('cedula')}
                  error={!!validationErrors.cedula}
                  helperText={validationErrors.cedula || 'Número de identificación nacional (9-12 dígitos)'}
                  required
                  autoComplete="off"
                  slotProps={{
                    htmlInput: {
                      maxLength: 12,
                      pattern: '[0-9]*',
                      autoComplete: 'new-password'
                    }
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Box>
                  <PhoneInput
                    country={'cr'} // Default to Costa Rica, but user can change
                    value={formData.phone}
                    onChange={(phone) => {
                      const phoneWithPrefix = '+' + phone;
                      setFormData(prev => ({
                        ...prev,
                        phone: phoneWithPrefix
                      }));
                      // Clear validation error when user starts typing
                      if (validationErrors.phone) {
                        setValidationErrors(prev => ({
                          ...prev,
                          phone: ''
                        }));
                      }
                    }}
                    inputStyle={{
                      width: '100%',
                      height: '56px',
                      fontSize: '16px',
                      fontFamily: 'inherit',
                      borderColor: validationErrors.phone ? '#d32f2f' : 'rgba(0, 0, 0, 0.23)',
                      borderRadius: '4px'
                    }}
                    containerStyle={{
                      width: '100%'
                    }}
                    buttonStyle={{
                      borderColor: validationErrors.phone ? '#d32f2f' : 'rgba(0, 0, 0, 0.23)',
                      borderRadius: '4px 0 0 4px'
                    }}
                    dropdownStyle={{
                      zIndex: 1300
                    }}
                    enableSearch
                    searchPlaceholder="Buscar país..."
                    preferredCountries={['cr', 'us', 'mx', 'gt', 'sv', 'hn', 'ni', 'pa']}
                    placeholder="8888-8888"
                  />
                  {validationErrors.phone && (
                    <FormHelperText error sx={{ mt: 0.5 }}>
                      {validationErrors.phone}
                    </FormHelperText>
                  )}
                </Box>
              </Grid>

              {/* Contraseña (solo para crear o cambiar) */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label={isEdit ? "Nueva Contraseña (opcional)" : "Contraseña"}
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  error={!!validationErrors.password}
                  helperText={validationErrors.password || (isEdit ? "Dejar vacío para mantener la actual" : "Mínimo 8 caracteres con 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial")}
                  required={!isEdit}
                  autoComplete="new-password"
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                    htmlInput: {
                      autoComplete: 'new-password'
                    }
                  }}
                />
              </Grid>

              {/* Información de Rol y Espacios de Trabajo */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Espacios de Trabajo y Roles
                </Typography>
              </Grid>

              {/* Only show global role selector when no companies are assigned */}
              {(!formData.companies || formData.companies.length === 0) && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth required>
                    <InputLabel>Rol por defecto</InputLabel>
                    <Select
                      value={formData.role}
                      onChange={handleInputChange('role')}
                      label="Rol por defecto"
                    >
                      {Object.values(UserRole).map((role) => (
                        <MenuItem key={role} value={role}>
                          {getRoleLabel(role)}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      Este rol se aplicará cuando se asigne una empresa
                    </FormHelperText>
                  </FormControl>
                </Grid>
              )}

              {/* Multiple Companies Management */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 1 }}>
                  Asignación de Empresas
                </Typography>
                
                {/* Company assignments list */}
                {formData.companies && formData.companies.length > 0 ? (
                  <Box sx={{ mb: 2 }}>
                    {formData.companies.map((companyAssignment, index) => {
                      const company = companies.find(c => c._id === companyAssignment.companyId);
                      return (
                        <Card key={index} sx={{ mb: 1, p: 2, backgroundColor: 'background.paper' }}>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body1" fontWeight="medium">
                                  {company?.name || 'Empresa no encontrada'}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
                                  {companyAssignment.isPrimary && (
                                    <Chip
                                      size="small"
                                      label="Principal"
                                      color="success"
                                    />
                                  )}
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                {!companyAssignment.isPrimary && formData.companies && formData.companies.length > 1 && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => {
                                      setFormData(prev => ({
                                        ...prev,
                                        companies: prev.companies?.map((c, i) => ({
                                          ...c,
                                          isPrimary: i === index
                                        }))
                                      }));
                                    }}
                                  >
                                    Hacer Principal
                                  </Button>
                                )}
                                <IconButton
                                  color="error"
                                  onClick={() => {
                                    setFormData(prev => {
                                      const updatedCompanies = prev.companies?.filter((_, i) => i !== index) || [];
                                      // If we removed the primary company and there are still companies, make the first one primary
                                      if (companyAssignment.isPrimary && updatedCompanies.length > 0) {
                                        updatedCompanies[0].isPrimary = true;
                                      }
                                      return {
                                        ...prev,
                                        companies: updatedCompanies
                                      };
                                    });
                                  }}
                                >
                                  <RemoveCircleOutlineIcon />
                                </IconButton>
                              </Box>
                            </Box>
                            {/* Role selector for this company */}
                            <FormControl fullWidth size="small">
                              <InputLabel>Rol en esta empresa</InputLabel>
                              <Select
                                value={companyAssignment.role || formData.role}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    companies: prev.companies?.map((c, i) => 
                                      i === index ? { ...c, role: e.target.value as UserRole } : c
                                    )
                                  }));
                                }}
                                label="Rol en esta empresa"
                              >
                                {Object.values(UserRole).map((role) => (
                                  <MenuItem key={role} value={role}>
                                    {getRoleLabel(role)}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            
                            {/* Department selection for this company */}
                            {departmentsByCompany[companyAssignment.companyId] && departmentsByCompany[companyAssignment.companyId].length > 0 && (
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Departamentos
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                  {departmentsByCompany[companyAssignment.companyId].map(dept => {
                                    const isSelected = companyAssignment.departments?.includes(dept._id);
                                    return (
                                      <Chip
                                        key={dept._id}
                                        label={dept.name}
                                        onClick={() => {
                                          setFormData(prev => ({
                                            ...prev,
                                            companies: prev.companies?.map((c, i) => {
                                              if (i === index) {
                                                const currentDepts = c.departments || [];
                                                return {
                                                  ...c,
                                                  departments: isSelected 
                                                    ? currentDepts.filter(d => d !== dept._id)
                                                    : [...currentDepts, dept._id]
                                                };
                                              }
                                              return c;
                                            })
                                          }));
                                        }}
                                        color={isSelected ? "primary" : "default"}
                                        variant={isSelected ? "filled" : "outlined"}
                                        size="small"
                                      />
                                    );
                                  })}
                                </Box>
                              </Box>
                            )}
                            {!departmentsByCompany[companyAssignment.companyId] && loadingDepartments[companyAssignment.companyId] && (
                              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                  Cargando departamentos...
                                </Typography>
                                <CircularProgress size={16} />
                              </Box>
                            )}
                            {!departmentsByCompany[companyAssignment.companyId] && !loadingDepartments[companyAssignment.companyId] && (
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                  No hay departamentos disponibles
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Card>
                      );
                    })}
                  </Box>
                ) : (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    No hay empresas asignadas al usuario.
                  </Alert>
                )}
                
                {/* Add company selector */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Autocomplete
                    sx={{ flex: 1 }}
                    options={companies.filter(c => 
                      !formData.companies?.some(ca => ca.companyId === c._id)
                    )}
                    getOptionLabel={(option) => option.name}
                    value={companyInputValue}
                    onChange={(_, newValue) => {
                      if (newValue) {
                        const isFirst = !formData.companies || formData.companies.length === 0;
                        setFormData(prev => ({
                          ...prev,
                          companies: [
                            ...(prev.companies || []),
                            {
                              companyId: newValue._id,
                              departments: [],
                              role: prev.role,
                              isPrimary: isFirst,
                              position: '',
                              department: ''
                            }
                          ]
                        }));
                        // Clear companies validation error
                        if (validationErrors.companies) {
                          setValidationErrors(prev => ({
                            ...prev,
                            companies: ''
                          }));
                        }
                        // Load departments for this company
                        loadDepartmentsByCompany(newValue._id);
                        // Clear the input
                        setCompanyInputValue(null);
                      }
                    }}
                    inputValue=""
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Agregar Empresa"
                        placeholder="Seleccionar empresa"
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        <Typography variant="body2">
                          {option.name}
                        </Typography>
                      </Box>
                    )}
                  />
                </Box>
                {validationErrors.companies && (
                  <FormHelperText error sx={{ mt: 1 }}>
                    {validationErrors.companies}
                  </FormHelperText>
                )}
              </Grid>


              {/* Estado */}
              {isEdit && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Estado del Usuario
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 300 }}>
                    <Typography variant="subtitle2">
                      Estado
                    </Typography>
                    <Tooltip title={formData.isActive ? 'Desactivar usuario' : 'Activar usuario'}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.isActive ?? true}
                            onChange={handleSwitchChange('isActive')}
                            color={formData.isActive ? 'success' : 'default'}
                          />
                        }
                        label={formData.isActive ? 'Activo' : 'Inactivo'}
                        sx={{
                          m: 0,
                          '& .MuiFormControlLabel-label': {
                            fontSize: '0.875rem',
                            color: formData.isActive ? 'success.main' : 'text.secondary'
                          }
                        }}
                      />
                    </Tooltip>
                  </Box>
                </Grid>
              )}

              {/* Botones */}
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={() => navigate('/system-users')}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={loading}
                  >
                    {loading ? 'Guardando...' : (isEdit ? 'Actualizar Usuario' : 'Crear Usuario')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MuiAlert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          variant="filled"
          elevation={6}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};