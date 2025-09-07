import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  NotificationsActive as PushIcon,
  Save as SaveIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { NotificationSettings as NotificationSettingsType } from '../../types';

export const NotificationSettings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [settings, setSettings] = useState<NotificationSettingsType>({
    email: true,
    push: true,
    sms: false,
    courseExpiring: true,
    documentExpiring: true,
    permitExpiring: true,
    workReminders: true,
    systemAlerts: true,
    dailyDigest: false
  });

  const [deliveryTimes, setDeliveryTimes] = useState({
    dailyDigestTime: '08:00',
    workRemindersTime: '07:00',
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00'
  });

  const [frequency, setFrequency] = useState({
    courseExpiring: 'weekly',
    documentExpiring: 'daily',
    permitExpiring: 'immediate'
  });

  const handleSettingChange = (field: keyof NotificationSettingsType) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSettings(prev => ({
      ...prev,
      [field]: event.target.checked
    }));
  };

  const handleDeliveryTimeChange = (field: string, value: string) => {
    setDeliveryTimes(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFrequencyChange = (field: string, value: string) => {
    setFrequency(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Implement actual API call
      // const notificationConfig = {
      //   settings,
      //   deliveryTimes,
      //   frequency
      // };
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const notificationTypes = [
    {
      key: 'courseExpiring',
      title: 'Cursos por Vencer',
      description: 'Notificaciones cuando los cursos están próximos a expirar',
      icon: <ScheduleIcon color="warning" />
    },
    {
      key: 'documentExpiring',
      title: 'Documentos por Vencer',
      description: 'Alertas sobre documentos próximos a expirar',
      icon: <ScheduleIcon color="error" />
    },
    {
      key: 'permitExpiring',
      title: 'Permisos por Vencer',
      description: 'Avisos sobre permisos de trabajo que expiran pronto',
      icon: <ScheduleIcon color="info" />
    },
    {
      key: 'workReminders',
      title: 'Recordatorios de Trabajo',
      description: 'Recordatorios diarios sobre tareas pendientes',
      icon: <NotificationsIcon color="primary" />
    },
    {
      key: 'systemAlerts',
      title: 'Alertas del Sistema',
      description: 'Notificaciones importantes del sistema',
      icon: <NotificationsIcon color="secondary" />
    },
    {
      key: 'dailyDigest',
      title: 'Resumen Diario',
      description: 'Resumen diario de actividades y estadísticas',
      icon: <EmailIcon color="info" />
    }
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Configuración de Notificaciones
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Configuración de notificaciones guardada correctamente
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Delivery Methods */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Métodos de Entrega
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.email}
                      onChange={handleSettingChange('email')}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EmailIcon sx={{ mr: 1 }} />
                      Correo Electrónico
                    </Box>
                  }
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.push}
                      onChange={handleSettingChange('push')}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PushIcon sx={{ mr: 1 }} />
                      Notificaciones Push
                    </Box>
                  }
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.sms}
                      onChange={handleSettingChange('sms')}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <SmsIcon sx={{ mr: 1 }} />
                      SMS (Solo emergencias)
                    </Box>
                  }
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Types */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tipos de Notificaciones
              </Typography>
              
              <List>
                {notificationTypes.map((type, index) => (
                  <React.Fragment key={type.key}>
                    <ListItem>
                      <Box sx={{ mr: 2 }}>
                        {type.icon}
                      </Box>
                      <ListItemText
                        primary={type.title}
                        secondary={type.description}
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {['courseExpiring', 'documentExpiring', 'permitExpiring'].includes(type.key) && (
                            <FormControl size="small" sx={{ minWidth: 100 }}>
                              <Select
                                value={frequency[type.key as keyof typeof frequency]}
                                onChange={(e) => handleFrequencyChange(type.key, e.target.value)}
                                size="small"
                              >
                                <MenuItem value="immediate">Inmediato</MenuItem>
                                <MenuItem value="daily">Diario</MenuItem>
                                <MenuItem value="weekly">Semanal</MenuItem>
                              </Select>
                            </FormControl>
                          )}
                          <Switch
                            checked={settings[type.key as keyof NotificationSettingsType] as boolean}
                            onChange={handleSettingChange(type.key as keyof NotificationSettingsType)}
                            color="primary"
                          />
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < notificationTypes.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Delivery Schedule */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Horarios de Entrega
              </Typography>
              
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel>Resumen Diario</InputLabel>
                    <Select
                      value={deliveryTimes.dailyDigestTime}
                      onChange={(e) => handleDeliveryTimeChange('dailyDigestTime', e.target.value)}
                      label="Resumen Diario"
                      disabled={!settings.dailyDigest}
                    >
                      <MenuItem value="06:00">6:00 AM</MenuItem>
                      <MenuItem value="07:00">7:00 AM</MenuItem>
                      <MenuItem value="08:00">8:00 AM</MenuItem>
                      <MenuItem value="09:00">9:00 AM</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel>Recordatorios</InputLabel>
                    <Select
                      value={deliveryTimes.workRemindersTime}
                      onChange={(e) => handleDeliveryTimeChange('workRemindersTime', e.target.value)}
                      label="Recordatorios"
                      disabled={!settings.workReminders}
                    >
                      <MenuItem value="06:00">6:00 AM</MenuItem>
                      <MenuItem value="07:00">7:00 AM</MenuItem>
                      <MenuItem value="08:00">8:00 AM</MenuItem>
                      <MenuItem value="09:00">9:00 AM</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel>Silencio desde</InputLabel>
                    <Select
                      value={deliveryTimes.quietHoursStart}
                      onChange={(e) => handleDeliveryTimeChange('quietHoursStart', e.target.value)}
                      label="Silencio desde"
                    >
                      <MenuItem value="21:00">9:00 PM</MenuItem>
                      <MenuItem value="22:00">10:00 PM</MenuItem>
                      <MenuItem value="23:00">11:00 PM</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel>Silencio hasta</InputLabel>
                    <Select
                      value={deliveryTimes.quietHoursEnd}
                      onChange={(e) => handleDeliveryTimeChange('quietHoursEnd', e.target.value)}
                      label="Silencio hasta"
                    >
                      <MenuItem value="06:00">6:00 AM</MenuItem>
                      <MenuItem value="07:00">7:00 AM</MenuItem>
                      <MenuItem value="08:00">8:00 AM</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Durante las horas de silencio solo se enviarán notificaciones críticas de seguridad.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Preview */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ bgcolor: 'grey.50' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resumen de Configuración
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {settings.email && <Chip icon={<EmailIcon />} label="Email" color="primary" />}
                {settings.push && <Chip icon={<PushIcon />} label="Push" color="primary" />}
                {settings.sms && <Chip icon={<SmsIcon />} label="SMS" color="primary" />}
              </Box>

              <Typography variant="body2" color="textSecondary">
                Recibirás notificaciones de: {Object.entries(settings)
                  .filter(([key, value]) => value && !['email', 'push', 'sms'].includes(key))
                  .map(([key]) => notificationTypes.find(type => type.key === key)?.title)
                  .filter(Boolean)
                  .join(', ')}
              </Typography>
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