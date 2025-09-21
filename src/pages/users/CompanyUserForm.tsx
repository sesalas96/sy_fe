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
  IconButton
} from '@mui/material';
import {
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { UserRole } from '../../types';
import { userApi, UserFormData } from '../../services/userApi';
import { useAuth } from '../../contexts/AuthContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/material.css';

export const CompanyUserForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isEdit = !!id;

  usePageTitle(
    isEdit ? 'Editar Usuario' : 'Nuevo Usuario de Espacios de Trabajo',
    isEdit ? 'Editar información del usuario de empresa supervisada' : 'Crear nuevo usuario para empresas supervisadas'
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [supervisedCompanies, setSupervisedCompanies] = useState<{_id: string; name: string; relationship: string}[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: UserRole.CLIENT_STAFF,
    company: '',
    isActive: true
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSupervisedCompanies();
    if (isEdit && id) {
      loadUser();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, id]);

  const loadSupervisedCompanies = async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://sybe-production.up.railway.app/api';
      const response = await fetch(`${API_BASE_URL}/api/companies/supervised`, {
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
      
      if (result.success && result.data) {
        // Filter to get only own and supervised companies (not contractors)
        const filteredCompanies = result.data.companies.filter((comp: any) => 
          comp.relationship === 'own_company' || comp.relationship === 'supervised_company'
        );
        setSupervisedCompanies(filteredCompanies);
      }
    } catch (err) {
      console.error('Error loading supervised companies:', err);
      setError('Error al cargar las empresas supervisadas');
    }
  };

  const loadUser = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await userApi.getById(id);
      if (response.success && response.data) {
        const userData = response.data;
        setFormData({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.profile?.phone || '',
          role: userData.role,
          company: userData.company?._id || '',
          isActive: userData.isActive
        });
      } else {
        setError(response.message || 'Error al cargar el usuario');
      }
    } catch (err) {
      setError('Error al cargar el usuario');
      console.error('Error loading user:', err);
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
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'El apellido es requerido';
    }

    if (!formData.company) {
      errors.company = 'Debe seleccionar una empresa';
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

      const submitData: UserFormData = {
        ...formData,
        ...(isEdit && !formData.password && { password: undefined })
      };

      // Para edición, necesitamos enviar el phone dentro de profile
      const dataToSend = isEdit ? {
        email: submitData.email,
        firstName: submitData.firstName,
        lastName: submitData.lastName,
        role: submitData.role,
        company: submitData.company,
        isActive: submitData.isActive,
        ...(submitData.password && { password: submitData.password }),
        ...(submitData.phone && { profile: { phone: submitData.phone } })
      } : submitData;

      let response;
      if (isEdit && id) {
        response = await userApi.update(id, dataToSend as any);
      } else {
        response = await userApi.create(submitData);
      }

      if (response.success) {
        setSuccess(isEdit ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente');
        setTimeout(() => {
          navigate('/company-users');
        }, 2000);
      } else {
        setError(response.message || 'Error al guardar el usuario');
      }
    } catch (err) {
      setError(isEdit ? 'Error al actualizar el usuario' : 'Error al crear el usuario');
      console.error('Error saving user:', err);
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

  // Only CLIENT_SUPERVISOR can access this
  if (user?.role !== UserRole.CLIENT_SUPERVISOR) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tiene permisos para {isEdit ? 'editar' : 'crear'} Usuarios.
        </Alert>
      </Box>
    );
  }

  // Get available roles for company users (only client roles)
  const availableRoles = [
    UserRole.CLIENT_SUPERVISOR,
    UserRole.CLIENT_APPROVER,
    UserRole.CLIENT_STAFF
  ];

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          color="inherit"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('/company-users');
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
            onClick={() => navigate('/company-users')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">
            <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            {isEdit ? 'Editar Usuario' : 'Nuevo Usuario de Espacios de Trabajo'}
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
        <CardContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSubmit}>
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
                  helperText={validationErrors.firstName}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Apellido"
                  value={formData.lastName}
                  onChange={handleInputChange('lastName')}
                  error={!!validationErrors.lastName}
                  helperText={validationErrors.lastName}
                  required
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
                    }
                  }}
                />
              </Grid>

              {/* Información de Rol y Espacios de Trabajo */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Rol y Espacios de Trabajo
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Rol</InputLabel>
                  <Select
                    value={formData.role}
                    onChange={handleInputChange('role')}
                    label="Rol"
                  >
                    {availableRoles.map((role) => (
                      <MenuItem key={role} value={role}>
                        {getRoleLabel(role)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  options={supervisedCompanies}
                  getOptionLabel={(option) => option.name}
                  value={supervisedCompanies.find(c => c._id === formData.company) || null}
                  onChange={(_, newValue) => {
                    setFormData(prev => ({
                      ...prev,
                      company: newValue?._id || ''
                    }));
                    // Clear validation error
                    if (validationErrors.company) {
                      setValidationErrors(prev => ({
                        ...prev,
                        company: ''
                      }));
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Espacios de Trabajo"
                      placeholder="Seleccionar empresa supervisada"
                      required
                      error={!!validationErrors.company}
                      helperText={validationErrors.company}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2">
                          {option.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.relationship === 'own_company' ? 'Espacios de Trabajo Propia' : 'Espacios de Trabajo Supervisada'}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                />
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

              {/* Información adicional */}
              <Grid size={{ xs: 12 }}>
                <Alert severity="info" sx={{ mt: 2 }}>
                  Este usuario será creado para una empresa supervisada. Solo podrá acceder a los recursos de su empresa asignada.
                </Alert>
              </Grid>

              {/* Botones */}
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={() => navigate('/company-users')}
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
    </Box>
  );
};