import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  FormControlLabel,
  Switch,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  Avatar,
  IconButton
} from '@mui/material';
import {
  Business as BusinessIcon,
  Save as SaveIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Palette as PaletteIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { BrandingSettings, FeatureSettings } from '../../types';

const daysOfWeek = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' }
];

export const CompanySettings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>('');

  const [companyInfo, setCompanyInfo] = useState({
    name: 'Constructora ABC S.A.',
    address: 'San José, Costa Rica',
    phone: '+506 2234-5678',
    email: 'info@constructoraabc.com',
    website: 'https://www.constructoraabc.com'
  });

  const [branding, setBranding] = useState<BrandingSettings>({
    primaryColor: '#3462C7',
    secondaryColor: '#678966',
    companyName: 'Constructora ABC',
    customCSS: ''
  });

  const [features, setFeatures] = useState<FeatureSettings>({
    enableContractors: true,
    enableWorkPermits: true,
    enableCourses: true,
    enableReports: true,
    enableNotifications: true,
    enableAuditLog: true,
    enableDataExport: false,
    maxFileUploadSize: 10,
    allowedFileTypes: ['pdf', 'jpg', 'png', 'doc', 'docx']
  });

  const [businessHours, setBusinessHours] = useState({
    monday: { start: '08:00', end: '17:00', enabled: true },
    tuesday: { start: '08:00', end: '17:00', enabled: true },
    wednesday: { start: '08:00', end: '17:00', enabled: true },
    thursday: { start: '08:00', end: '17:00', enabled: true },
    friday: { start: '08:00', end: '17:00', enabled: true },
    saturday: { start: '08:00', end: '12:00', enabled: false },
    sunday: { start: '08:00', end: '12:00', enabled: false }
  });

  const handleCompanyInfoChange = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCompanyInfo(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleBrandingChange = (field: keyof BrandingSettings) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setBranding(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleFeatureChange = (field: keyof FeatureSettings) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFeatures(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBusinessHourChange = (day: string, field: string, value: any) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleFileTypeChange = (newFileTypes: string[]) => {
    setFeatures(prev => ({
      ...prev,
      allowedFileTypes: newFileTypes
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // const companySettings = {
      //   companyInfo,
      //   branding,
      //   features,
      //   businessHours
      // };

      // TODO: Implement actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Error al guardar la configuración de la empresa. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const fileTypeOptions = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'doc', 'docx', 'xls', 'xlsx', 'txt'];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Configuración de Espacios de Trabajo
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Configuración de empresa guardada correctamente
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Company Information */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Información de la Espacios de Trabajo
              </Typography>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Nombre de la Espacios de Trabajo"
                    value={companyInfo.name}
                    onChange={handleCompanyInfoChange('name')}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Dirección"
                    value={companyInfo.address}
                    onChange={handleCompanyInfoChange('address')}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Teléfono"
                    value={companyInfo.phone}
                    onChange={handleCompanyInfoChange('phone')}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={companyInfo.email}
                    onChange={handleCompanyInfoChange('email')}
                    type="email"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Sitio Web"
                    value={companyInfo.website}
                    onChange={handleCompanyInfoChange('website')}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Branding */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <PaletteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Marca y Diseño
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  sx={{ width: 80, height: 80, mr: 2 }}
                  src={branding.logo}
                >
                  <BusinessIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1">Logo de la Espacios de Trabajo</Typography>
                  <Button
                    size="small"
                    startIcon={<UploadIcon />}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Subir Logo
                  </Button>
                  {branding.logo && (
                    <IconButton size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Nombre para Mostrar"
                    value={branding.companyName}
                    onChange={handleBrandingChange('companyName')}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Color Primario"
                    type="color"
                    value={branding.primaryColor}
                    onChange={handleBrandingChange('primaryColor')}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Color Secundario"
                    type="color"
                    value={branding.secondaryColor}
                    onChange={handleBrandingChange('secondaryColor')}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Features */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Funcionalidades
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={features.enableContractors}
                      onChange={handleFeatureChange('enableContractors')}
                    />
                  }
                  label="Gestión de Contratistas"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={features.enableWorkPermits}
                      onChange={handleFeatureChange('enableWorkPermits')}
                    />
                  }
                  label="Permisos de Trabajo"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={features.enableCourses}
                      onChange={handleFeatureChange('enableCourses')}
                    />
                  }
                  label="Gestión de Cursos"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={features.enableReports}
                      onChange={handleFeatureChange('enableReports')}
                    />
                  }
                  label="Reportes y Estadísticas"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={features.enableNotifications}
                      onChange={handleFeatureChange('enableNotifications')}
                    />
                  }
                  label="Sistema de Notificaciones"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={features.enableAuditLog}
                      onChange={handleFeatureChange('enableAuditLog')}
                    />
                  }
                  label="Auditoría y Logs"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={features.enableDataExport}
                      onChange={handleFeatureChange('enableDataExport')}
                    />
                  }
                  label="Exportación de Datos"
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography gutterBottom>
                  Tamaño máximo de archivo: {features.maxFileUploadSize} MB
                </Typography>
                <Slider
                  value={features.maxFileUploadSize}
                  onChange={(_, value) => setFeatures(prev => ({ ...prev, maxFileUploadSize: value as number }))}
                  min={1}
                  max={50}
                  step={1}
                  marks
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Tipos de archivo permitidos:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                  {features.allowedFileTypes.map((type) => (
                    <Chip
                      key={type}
                      label={type.toUpperCase()}
                      size="small"
                      onDelete={() => handleFileTypeChange(features.allowedFileTypes.filter(t => t !== type))}
                    />
                  ))}
                </Box>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Agregar Tipo</InputLabel>
                  <Select
                    value=""
                    onChange={(e) => {
                      const newType = e.target.value as string;
                      if (newType && !features.allowedFileTypes.includes(newType)) {
                        handleFileTypeChange([...features.allowedFileTypes, newType]);
                      }
                    }}
                    label="Agregar Tipo"
                  >
                    {fileTypeOptions
                      .filter(type => !features.allowedFileTypes.includes(type))
                      .map((type) => (
                        <MenuItem key={type} value={type}>
                          {type.toUpperCase()}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Business Hours */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Horarios de Trabajo
              </Typography>
              
              {daysOfWeek.map((day) => (
                <Box key={day.key} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={businessHours[day.key as keyof typeof businessHours].enabled}
                        onChange={(e) => handleBusinessHourChange(day.key, 'enabled', e.target.checked)}
                      />
                    }
                    label={day.label}
                    sx={{ minWidth: 100 }}
                  />
                  {businessHours[day.key as keyof typeof businessHours].enabled && (
                    <>
                      <TextField
                        type="time"
                        size="small"
                        value={businessHours[day.key as keyof typeof businessHours].start}
                        onChange={(e) => handleBusinessHourChange(day.key, 'start', e.target.value)}
                        sx={{ mx: 1 }}
                      />
                      <Typography variant="body2" sx={{ mx: 1 }}>a</Typography>
                      <TextField
                        type="time"
                        size="small"
                        value={businessHours[day.key as keyof typeof businessHours].end}
                        onChange={(e) => handleBusinessHourChange(day.key, 'end', e.target.value)}
                        sx={{ mx: 1 }}
                      />
                    </>
                  )}
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={loading}
          size="large"
        >
          {loading ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </Box>
    </Box>
  );
};