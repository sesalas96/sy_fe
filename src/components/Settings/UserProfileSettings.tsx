import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  Card,
  CardContent,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import {
  Save as SaveIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { UserSettings, UserRole } from '../../types';

// Import role-specific profiles
import {
  SuperAdminProfile,
  SafetyStaffProfile,
  ClientSupervisorProfile,
  ClientApproverProfile,
  ClientStaffProfile,
  ValidadoresOpsProfile,
  ContratistaProfile
} from '../Profile';

interface ProfileFormData {
  name: string;
  email: string;
  language: 'es' | 'en';
  timezone: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
}

const timezones = [
  { value: 'America/Costa_Rica', label: 'Costa Rica (GMT-6)' },
  { value: 'America/New_York', label: 'Eastern Time (GMT-5)' },
  { value: 'America/Chicago', label: 'Central Time (GMT-6)' },
  { value: 'America/Denver', label: 'Mountain Time (GMT-7)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (GMT-8)' },
  { value: 'Europe/London', label: 'London (GMT+0)' },
  { value: 'Europe/Madrid', label: 'Madrid (GMT+1)' }
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const UserProfileSettings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>('');
  const [tabValue, setTabValue] = useState(0);
  
  const [profileData, setProfileData] = useState<ProfileFormData>({
    name: user?.name || '',
    email: user?.email || '',
    language: 'es',
    timezone: 'America/Costa_Rica',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h'
  });

  const [userSettings, setUserSettings] = useState<Partial<UserSettings>>({
    theme: 'light',
    language: 'es',
    timezone: 'America/Costa_Rica',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    dashboard: {
      defaultView: 'overview',
      refreshInterval: 5,
      showWelcomeMessage: true,
      compactMode: false,
      widgetOrder: ['stats', 'activities', 'notifications'],
      hideCompletedTasks: false
    }
  });

  useEffect(() => {
    // TODO: Load user settings from API
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      // TODO: Implement actual API call
      // const settings = await SettingsService.getUserSettings();
      // setUserSettings(settings);
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  const handleProfileChange = (field: keyof ProfileFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setProfileData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSettingChange = (field: string, value: any) => {
    setUserSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDashboardSettingChange = (field: string, value: any) => {
    setUserSettings(prev => ({
      ...prev,
      dashboard: {
        ...prev.dashboard!,
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // TODO: Implement actual API calls
      // await UserService.updateProfile(profileData);
      // await SettingsService.updateUserSettings(userSettings);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Error al guardar la configuración. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const renderRoleSpecificProfile = () => {
    if (!user) return null;

    switch (user.role) {
      case UserRole.SUPER_ADMIN:
        return <SuperAdminProfile />;
      case UserRole.SAFETY_STAFF:
        return <SafetyStaffProfile />;
      case UserRole.CLIENT_SUPERVISOR:
        return <ClientSupervisorProfile />;
      case UserRole.CLIENT_APPROVER:
        return <ClientApproverProfile />;
      case UserRole.CLIENT_STAFF:
        return <ClientStaffProfile />;
      case UserRole.VALIDADORES_OPS:
        return <ValidadoresOpsProfile />;
      case UserRole.CONTRATISTA_ADMIN:
      case UserRole.CONTRATISTA_SUBALTERNOS:
      case UserRole.CONTRATISTA_HUERFANO:
        return <ContratistaProfile />;
      default:
        return (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="error">
              Perfil no disponible para este rol
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Configuración de Perfil
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="profile tabs">
          <Tab icon={<PersonIcon />} label="Mi Perfil" />
          <Tab icon={<SettingsIcon />} label="Configuraciones" />
        </Tabs>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Configuración guardada correctamente
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TabPanel value={tabValue} index={0}>
        {renderRoleSpecificProfile()}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Configuraciones Generales
          </Typography>
          <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  sx={{ width: 80, height: 80, mr: 2, bgcolor: 'primary.main' }}
                >
                  {user?.name ? getInitials(user.name) : <PersonIcon />}
                </Avatar>
                <Box>
                  <Typography variant="h6">{user?.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {user?.role}
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    sx={{ mt: 1 }}
                  >
                    Cambiar Foto
                  </Button>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Nombre Completo"
                    value={profileData.name}
                    onChange={handleProfileChange('name')}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Correo Electrónico"
                    value={profileData.email}
                    onChange={handleProfileChange('email')}
                    type="email"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Regional Settings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Configuración Regional
              </Typography>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <InputLabel>Idioma</InputLabel>
                    <Select
                      value={userSettings.language}
                      onChange={(e) => handleSettingChange('language', e.target.value)}
                      label="Idioma"
                    >
                      <MenuItem value="es">Español</MenuItem>
                      <MenuItem value="en">English</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <InputLabel>Zona Horaria</InputLabel>
                    <Select
                      value={userSettings.timezone}
                      onChange={(e) => handleSettingChange('timezone', e.target.value)}
                      label="Zona Horaria"
                    >
                      {timezones.map((tz) => (
                        <MenuItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Formato de Fecha</InputLabel>
                    <Select
                      value={userSettings.dateFormat}
                      onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
                      label="Formato de Fecha"
                    >
                      <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                      <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                      <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Formato de Hora</InputLabel>
                    <Select
                      value={userSettings.timeFormat}
                      onChange={(e) => handleSettingChange('timeFormat', e.target.value)}
                      label="Formato de Hora"
                    >
                      <MenuItem value="12h">12 horas (AM/PM)</MenuItem>
                      <MenuItem value="24h">24 horas</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Dashboard Preferences */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Preferencias del Dashboard
              </Typography>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel>Vista Predeterminada</InputLabel>
                    <Select
                      value={userSettings.dashboard?.defaultView}
                      onChange={(e) => handleDashboardSettingChange('defaultView', e.target.value)}
                      label="Vista Predeterminada"
                    >
                      <MenuItem value="overview">Resumen</MenuItem>
                      <MenuItem value="detailed">Detallada</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel>Intervalo de Actualización</InputLabel>
                    <Select
                      value={userSettings.dashboard?.refreshInterval}
                      onChange={(e) => handleDashboardSettingChange('refreshInterval', e.target.value)}
                      label="Intervalo de Actualización"
                    >
                      <MenuItem value={1}>1 minuto</MenuItem>
                      <MenuItem value={5}>5 minutos</MenuItem>
                      <MenuItem value={10}>10 minutos</MenuItem>
                      <MenuItem value={30}>30 minutos</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={userSettings.dashboard?.showWelcomeMessage}
                          onChange={(e) => handleDashboardSettingChange('showWelcomeMessage', e.target.checked)}
                        />
                      }
                      label="Mostrar mensaje de bienvenida"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={userSettings.dashboard?.compactMode}
                          onChange={(e) => handleDashboardSettingChange('compactMode', e.target.checked)}
                        />
                      }
                      label="Modo compacto"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={userSettings.dashboard?.hideCompletedTasks}
                          onChange={(e) => handleDashboardSettingChange('hideCompletedTasks', e.target.checked)}
                        />
                      }
                      label="Ocultar tareas completadas"
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={loading}
          size="large"
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </Box>
        </Box>
      </TabPanel>
    </Box>
  );
};