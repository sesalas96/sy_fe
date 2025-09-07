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
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Security as SecurityIcon,
  Save as SaveIcon,
  Lock as LockIcon,
  Schedule as ScheduleIcon,
  History as HistoryIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { PolicySettings, AuditLog } from '../../types';

// Mock audit log data
const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    userId: 'user1',
    action: 'LOGIN',
    resourceType: 'AUTH',
    details: { success: true },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0...',
    timestamp: new Date('2024-07-14T09:30:00')
  },
  {
    id: '2',
    userId: 'user2',
    action: 'CREATE_PERMIT',
    resourceType: 'WORK_PERMIT',
    resourceId: 'permit-123',
    details: { description: 'Trabajo en altura' },
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0...',
    timestamp: new Date('2024-07-14T10:15:00')
  },
  {
    id: '3',
    userId: 'user3',
    action: 'UPDATE_CONTRACTOR',
    resourceType: 'CONTRACTOR',
    resourceId: 'contractor-456',
    details: { field: 'status', oldValue: 'inactive', newValue: 'active' },
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0...',
    timestamp: new Date('2024-07-14T11:00:00')
  }
];

export const SecuritySettings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>('');

  const [policies, setPolicies] = useState<PolicySettings>({
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: false,
    sessionTimeout: 480, // 8 hours
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    requireTwoFactor: false,
    allowRememberMe: true
  });

  const [securitySettings, setSecuritySettings] = useState({
    enableAuditLog: true,
    logRetention: 90,
    enableRateLimiting: true,
    allowConcurrentSessions: false,
    requireHttps: true,
    enableSessionTimeout: true,
    enableIPWhitelist: false,
    enableDeviceTracking: true
  });

  const handlePolicyChange = (field: keyof PolicySettings) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : 
                  event.target.type === 'number' ? parseInt(event.target.value) : event.target.value;
    setPolicies(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSecuritySettingChange = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : 
                  event.target.type === 'number' ? parseInt(event.target.value) : event.target.value;
    setSecuritySettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // const securityConfig = {
      //   policies,
      //   securitySettings
      // };

      // TODO: Implement actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Error al guardar la configuración de seguridad. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthText = () => {
    const requirements = [];
    if (policies.passwordMinLength >= 8) requirements.push('longitud mínima');
    if (policies.passwordRequireUppercase) requirements.push('mayúsculas');
    if (policies.passwordRequireLowercase) requirements.push('minúsculas');
    if (policies.passwordRequireNumbers) requirements.push('números');
    if (policies.passwordRequireSpecialChars) requirements.push('caracteres especiales');
    
    return `Las contraseñas deben tener al menos ${policies.passwordMinLength} caracteres` +
           (requirements.length > 0 ? ` e incluir: ${requirements.join(', ')}` : '');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString('es-CR');
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Configuración de Seguridad
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Configuración de seguridad guardada correctamente
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Password Policies */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <LockIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Políticas de Contraseñas
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom>
                  Longitud mínima: {policies.passwordMinLength} caracteres
                </Typography>
                <Slider
                  value={policies.passwordMinLength}
                  onChange={(_, value) => setPolicies(prev => ({ ...prev, passwordMinLength: value as number }))}
                  min={6}
                  max={20}
                  step={1}
                  marks
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={policies.passwordRequireUppercase}
                      onChange={handlePolicyChange('passwordRequireUppercase')}
                    />
                  }
                  label="Requerir letras mayúsculas"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={policies.passwordRequireLowercase}
                      onChange={handlePolicyChange('passwordRequireLowercase')}
                    />
                  }
                  label="Requerir letras minúsculas"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={policies.passwordRequireNumbers}
                      onChange={handlePolicyChange('passwordRequireNumbers')}
                    />
                  }
                  label="Requerir números"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={policies.passwordRequireSpecialChars}
                      onChange={handlePolicyChange('passwordRequireSpecialChars')}
                    />
                  }
                  label="Requerir caracteres especiales"
                />
              </Box>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  {getPasswordStrengthText()}
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* Session and Authentication */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Sesiones y Autenticación
              </Typography>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Tiempo de sesión (minutos)"
                    type="number"
                    value={policies.sessionTimeout}
                    onChange={handlePolicyChange('sessionTimeout')}
                    inputProps={{ min: 15, max: 1440 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Intentos máximos de login"
                    type="number"
                    value={policies.maxLoginAttempts}
                    onChange={handlePolicyChange('maxLoginAttempts')}
                    inputProps={{ min: 3, max: 10 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Bloqueo temporal (minutos)"
                    type="number"
                    value={policies.lockoutDuration}
                    onChange={handlePolicyChange('lockoutDuration')}
                    inputProps={{ min: 5, max: 120 }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={policies.requireTwoFactor}
                      onChange={handlePolicyChange('requireTwoFactor')}
                    />
                  }
                  label="Requerir autenticación de dos factores"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={policies.allowRememberMe}
                      onChange={handlePolicyChange('allowRememberMe')}
                    />
                  }
                  label="Permitir 'Recordarme'"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.allowConcurrentSessions}
                      onChange={handleSecuritySettingChange('allowConcurrentSessions')}
                    />
                  }
                  label="Permitir sesiones concurrentes"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* System Security */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Seguridad del Sistema
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.enableAuditLog}
                      onChange={handleSecuritySettingChange('enableAuditLog')}
                    />
                  }
                  label="Habilitar registro de auditoría"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.enableRateLimiting}
                      onChange={handleSecuritySettingChange('enableRateLimiting')}
                    />
                  }
                  label="Limitar velocidad de requests"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.requireHttps}
                      onChange={handleSecuritySettingChange('requireHttps')}
                    />
                  }
                  label="Requerir HTTPS"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.enableIPWhitelist}
                      onChange={handleSecuritySettingChange('enableIPWhitelist')}
                    />
                  }
                  label="Lista blanca de IPs"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.enableDeviceTracking}
                      onChange={handleSecuritySettingChange('enableDeviceTracking')}
                    />
                  }
                  label="Rastreo de dispositivos"
                />
              </Box>

              {securitySettings.enableAuditLog && (
                <Box sx={{ mb: 2 }}>
                  <Typography gutterBottom>
                    Retención de logs: {securitySettings.logRetention} días
                  </Typography>
                  <Slider
                    value={securitySettings.logRetention}
                    onChange={(_, value) => setSecuritySettings(prev => ({ ...prev, logRetention: value as number }))}
                    min={30}
                    max={365}
                    step={30}
                    marks={[
                      { value: 30, label: '30d' },
                      { value: 90, label: '90d' },
                      { value: 180, label: '6m' },
                      { value: 365, label: '1a' }
                    ]}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Audit Log */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Registro de Auditoría Reciente
              </Typography>
              
              {securitySettings.enableAuditLog ? (
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Acción</TableCell>
                        <TableCell>Usuario</TableCell>
                        <TableCell>Hora</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mockAuditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Chip
                                size="small"
                                label={log.action}
                                color={log.action.includes('DELETE') ? 'error' : 
                                       log.action.includes('CREATE') ? 'success' : 'primary'}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>{log.userId}</TableCell>
                          <TableCell>{formatDate(log.timestamp)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="warning" icon={<WarningIcon />}>
                  El registro de auditoría está deshabilitado
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Security Status */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ bgcolor: 'grey.50' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Estado de Seguridad
              </Typography>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {policies.passwordMinLength >= 8 && policies.passwordRequireUppercase ? '✓' : '⚠'}
                    </Typography>
                    <Typography variant="body2">
                      Políticas de Contraseña
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {securitySettings.requireHttps ? '✓' : '⚠'}
                    </Typography>
                    <Typography variant="body2">
                      Conexión Segura
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {securitySettings.enableAuditLog ? '✓' : '⚠'}
                    </Typography>
                    <Typography variant="body2">
                      Auditoría Activa
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {policies.maxLoginAttempts <= 5 ? '✓' : '⚠'}
                    </Typography>
                    <Typography variant="body2">
                      Protección Brute Force
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
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