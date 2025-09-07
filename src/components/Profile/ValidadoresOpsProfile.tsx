import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Card,
  CardContent,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Security as SecurityIcon,
  Shield as ShieldIcon,
  Visibility as InspectionIcon,
  AccessTime as ShiftIcon,
  Edit as EditIcon,
  Photo as PhotoIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useContractorFiles } from '../../hooks/useContractorFiles';
import { AvatarEditModal } from './AvatarEditModal';

export const ValidadoresOpsProfile: React.FC = () => {
  const { user, userAvatarUrl } = useAuth();
  const { loading } = useContractorFiles();
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [securitySettings, setSecuritySettings] = useState({
    alertLevel: 'medium',
    autoVerification: false,
    emergencyResponse: true,
    shiftSchedule: 'rotating',
    accessLevel: 'standard',
    communicationChannel: 'radio'
  });

  const securityStats = {
    verificationsToday: 15,
    accessesGranted: 23,
    incidentsHandled: 2,
    shiftsCompleted: 145,
    responseTime: '2.3 min',
    accuracyRate: 98
  };

  const responsibilities = [
    { icon: <SecurityIcon />, title: 'Control de Acceso', description: 'Verificación de personal y visitantes', status: 'active' },
    { icon: <InspectionIcon />, title: 'Inspección de Herramientas', description: 'Registro de entrada y salida de equipos', status: 'active' },
    { icon: <ShieldIcon />, title: 'Monitoreo de Seguridad', description: 'Vigilancia de áreas restringidas', status: 'active' },
    { icon: <ShiftIcon />, title: 'Registro de Actividades', description: 'Documentación de eventos y reportes', status: 'active' }
  ];

  const recentVerifications = [
    { type: 'Acceso', contractor: 'Juan Pérez', area: 'Zona Industrial A', time: '08:30', status: 'approved' },
    { type: 'Herramienta', contractor: 'María González', item: 'Taladro Industrial', time: '09:15', status: 'verified' },
    { type: 'Acceso', contractor: 'Carlos López', area: 'Oficinas Admin', time: '10:00', status: 'approved' }
  ];

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Security Officer Identity */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Tooltip title={userAvatarUrl ? "Clic para editar foto" : "Agregar foto de perfil"}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      <IconButton
                        sx={{
                          bgcolor: 'success.main',
                          color: 'white',
                          width: 28,
                          height: 28,
                          '&:hover': {
                            bgcolor: 'success.dark',
                          }
                        }}
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAvatarModalOpen(true);
                        }}
                      >
                        <EditIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    }
                  >
                    <Box 
                      sx={{ 
                        position: 'relative', 
                        mr: 2,
                        cursor: 'pointer',
                        '&:hover': {
                          '& .MuiAvatar-root': {
                            opacity: 0.8
                          }
                        }
                      }}
                      onClick={() => setAvatarModalOpen(true)}
                    >
                      <Avatar
                        sx={{ 
                          width: 80, 
                          height: 80, 
                          bgcolor: userAvatarUrl ? 'transparent' : 'success.main',
                          transition: 'opacity 0.2s',
                          border: !userAvatarUrl ? '2px dashed' : 'none',
                          borderColor: 'action.disabled'
                        }}
                        src={userAvatarUrl || undefined}
                      >
                        {!userAvatarUrl && <PhotoIcon sx={{ fontSize: 40 }} />}
                      </Avatar>
                      {loading && (
                        <Box sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'rgba(255,255,255,0.8)',
                          borderRadius: '50%'
                        }}>
                          <CircularProgress size={24} />
                        </Box>
                      )}
                    </Box>
                  </Badge>
                </Tooltip>
                <Box>
                  <Typography variant="h6" color="success.main">
                    {user?.name}
                  </Typography>
                  <Chip 
                    label="Verificadores" 
                    color="success" 
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="textSecondary">
                    Oficial de Seguridad y Control
                  </Typography>
                  {!userAvatarUrl && (
                    <Typography 
                      variant="caption" 
                      color="primary" 
                      sx={{ 
                        mt: 0.5, 
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        '&:hover': {
                          textDecoration: 'none'
                        }
                      }}
                      onClick={() => setAvatarModalOpen(true)}
                    >
                      Agregar foto
                    </Typography>
                  )}
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Nombre del Oficial"
                    value={user?.name || ''}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Email de Seguridad"
                    value={user?.email || ''}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Número de Placa"
                    value="SEC-2024-089"
                    disabled
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <InputLabel>Nivel de Acceso</InputLabel>
                    <Select
                      value={securitySettings.accessLevel}
                      onChange={(e) => setSecuritySettings(prev => ({...prev, accessLevel: e.target.value}))}
                      label="Nivel de Acceso"
                    >
                      <MenuItem value="basic">Básico</MenuItem>
                      <MenuItem value="standard">Estándar</MenuItem>
                      <MenuItem value="advanced">Avanzado</MenuItem>
                      <MenuItem value="supervisor">Supervisor</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Statistics */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="success.main">
                Estadísticas de Seguridad
              </Typography>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 4 }}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="h5" color="primary.main">
                      {securityStats.verificationsToday}
                    </Typography>
                    <Typography variant="caption">
                      Verificaciones Hoy
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="h5" color="success.main">
                      {securityStats.accessesGranted}
                    </Typography>
                    <Typography variant="caption">
                      Accesos Autorizados
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="h5" color="warning.main">
                      {securityStats.incidentsHandled}
                    </Typography>
                    <Typography variant="caption">
                      Incidentes Atendidos
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="h6" color="info.main">
                      {securityStats.responseTime}
                    </Typography>
                    <Typography variant="caption">
                      Tiempo de Respuesta Promedio
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'success.50', borderRadius: 1 }}>
                    <Typography variant="h6" color="success.main">
                      {securityStats.accuracyRate}%
                    </Typography>
                    <Typography variant="caption">
                      Tasa de Precisión
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <InputLabel>Horario de Turno</InputLabel>
                    <Select
                      value={securitySettings.shiftSchedule}
                      onChange={(e) => setSecuritySettings(prev => ({...prev, shiftSchedule: e.target.value}))}
                      label="Horario de Turno"
                    >
                      <MenuItem value="morning">Matutino (6:00 AM - 2:00 PM)</MenuItem>
                      <MenuItem value="afternoon">Vespertino (2:00 PM - 10:00 PM)</MenuItem>
                      <MenuItem value="night">Nocturno (10:00 PM - 6:00 AM)</MenuItem>
                      <MenuItem value="rotating">Rotativo</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="success.main">
                Configuraciones de Seguridad
              </Typography>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <InputLabel>Nivel de Alerta</InputLabel>
                    <Select
                      value={securitySettings.alertLevel}
                      onChange={(e) => setSecuritySettings(prev => ({...prev, alertLevel: e.target.value}))}
                      label="Nivel de Alerta"
                    >
                      <MenuItem value="low">Bajo</MenuItem>
                      <MenuItem value="medium">Medio</MenuItem>
                      <MenuItem value="high">Alto</MenuItem>
                      <MenuItem value="critical">Crítico</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <InputLabel>Canal de Comunicación</InputLabel>
                    <Select
                      value={securitySettings.communicationChannel}
                      onChange={(e) => setSecuritySettings(prev => ({...prev, communicationChannel: e.target.value}))}
                      label="Canal de Comunicación"
                    >
                      <MenuItem value="radio">Radio</MenuItem>
                      <MenuItem value="phone">Teléfono</MenuItem>
                      <MenuItem value="app">Aplicación Móvil</MenuItem>
                      <MenuItem value="all">Todos los Canales</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={securitySettings.autoVerification}
                          onChange={(e) => setSecuritySettings(prev => ({...prev, autoVerification: e.target.checked}))}
                          color="success"
                        />
                      }
                      label="Verificación automática rutinaria"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={securitySettings.emergencyResponse}
                          onChange={(e) => setSecuritySettings(prev => ({...prev, emergencyResponse: e.target.checked}))}
                          color="error"
                        />
                      }
                      label="Respuesta de emergencia activa"
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Verifications */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="success.main">
                Verificaciones Recientes
              </Typography>
              <List>
                {recentVerifications.map((verification, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Badge 
                        badgeContent={verification.status === 'approved' ? '✓' : '!'} 
                        color={verification.status === 'approved' ? 'success' : 'warning'}
                      >
                        <SecurityIcon />
                      </Badge>
                    </ListItemIcon>
                    <ListItemText
                      primary={`${verification.type} - ${verification.contractor}`}
                      secondary={`${verification.area || verification.item} - ${verification.time}`}
                    />
                    <Chip 
                      label={verification.status.toUpperCase()} 
                      color={verification.status === 'approved' || verification.status === 'verified' ? 'success' : 'warning'}
                      size="small" 
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Responsibilities */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="success.main">
                Responsabilidades de Seguridad
              </Typography>
              <List>
                {responsibilities.map((responsibility, index) => (
                  <ListItem key={index}>
                    <ListItemIcon sx={{ color: 'success.main' }}>
                      {responsibility.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={responsibility.title}
                      secondary={responsibility.description}
                    />
                    <Chip 
                      label={responsibility.status.toUpperCase()} 
                      color="success" 
                      size="small" 
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Avatar Edit Modal */}
      <AvatarEditModal
        open={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        currentAvatarUrl={userAvatarUrl}
        onAvatarUpdated={() => {
          // Avatar will be refreshed automatically via AuthContext
        }}
      />
    </Box>
  );
};