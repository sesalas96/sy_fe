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
  LinearProgress,
  IconButton,
  Badge,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Engineering as SafetyIcon,
  Assignment as CertificationIcon,
  Group as TeamIcon,
  Notifications as AlertIcon,
  Edit as EditIcon,
  Photo as PhotoIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useContractorFiles } from '../../hooks/useContractorFiles';
import { AvatarEditModal } from './AvatarEditModal';

export const SafetyStaffProfile: React.FC = () => {
  const { user, userAvatarUrl } = useAuth();
  const { loading } = useContractorFiles();
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [operationalSettings, setOperationalSettings] = useState({
    autoNotifications: true,
    urgentAlerts: true,
    complianceReminders: true,
    notificationFrequency: 'immediate',
    workingHours: '8to5',
    specialtyArea: 'general_safety'
  });

  const certifications = [
    { name: 'Especialista en Seguridad Industrial', issuer: 'INTECO', expiry: '2025-06-15', status: 'vigente' },
    { name: 'Auditor Interno ISO 45001', issuer: 'SGS', expiry: '2024-12-20', status: 'vigente' },
    { name: 'Instructor Autorizado OSHA', issuer: 'OSHA', expiry: '2025-03-10', status: 'vigente' }
  ];

  const responsibilities = [
    { icon: <SafetyIcon />, title: 'Gestión de Contratistas', description: 'Supervisión de cumplimiento de 156 contratistas activos' },
    { icon: <CertificationIcon />, title: 'Validación de Certificaciones', description: 'Revisión y aprobación de documentos de seguridad' },
    { icon: <TeamIcon />, title: 'Coordinación Operativa', description: 'Gestión de equipos de trabajo y protocolos' },
    { icon: <AlertIcon />, title: 'Sistema de Alertas', description: 'Monitoreo de alertas críticas y notificaciones' }
  ];

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Safety Staff Identity */}
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
                          bgcolor: 'warning.main',
                          color: 'white',
                          width: 28,
                          height: 28,
                          '&:hover': {
                            bgcolor: 'warning.dark',
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
                          bgcolor: userAvatarUrl ? 'transparent' : 'warning.main',
                          transition: 'opacity 0.2s',
                          border: !userAvatarUrl ? '2px dashed' : 'none',
                          borderColor: 'action.disabled'
                        }}
                        src={userAvatarUrl || undefined}
                      >
                        {!userAvatarUrl && (userAvatarUrl ? 'SS' : <PhotoIcon sx={{ fontSize: 40 }} />)}
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
                  <Typography variant="h6" color="warning.dark">
                    {user?.name}
                  </Typography>
                  <Chip 
                    label="SAFETY STAFF" 
                    color="warning" 
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="textSecondary">
                    Especialista en Seguridad Operacional
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Nombre del Especialista"
                    value={user?.name || ''}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Email Operacional"
                    value={user?.email || ''}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Número de Licencia"
                    value="SS-2024-0234"
                    disabled
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <InputLabel>Área de Especialidad</InputLabel>
                    <Select
                      value={operationalSettings.specialtyArea}
                      onChange={(e) => setOperationalSettings(prev => ({...prev, specialtyArea: e.target.value}))}
                      label="Área de Especialidad"
                    >
                      <MenuItem value="general_safety">Seguridad General</MenuItem>
                      <MenuItem value="industrial_safety">Seguridad Industrial</MenuItem>
                      <MenuItem value="construction_safety">Seguridad en Construcción</MenuItem>
                      <MenuItem value="chemical_safety">Seguridad Química</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Operational Settings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="warning.dark">
                Configuraciones Operacionales
              </Typography>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <InputLabel>Frecuencia de Notificaciones</InputLabel>
                    <Select
                      value={operationalSettings.notificationFrequency}
                      onChange={(e) => setOperationalSettings(prev => ({...prev, notificationFrequency: e.target.value}))}
                      label="Frecuencia de Notificaciones"
                    >
                      <MenuItem value="immediate">Inmediata</MenuItem>
                      <MenuItem value="hourly">Cada hora</MenuItem>
                      <MenuItem value="daily">Diaria</MenuItem>
                      <MenuItem value="weekly">Semanal</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <InputLabel>Horario de Trabajo</InputLabel>
                    <Select
                      value={operationalSettings.workingHours}
                      onChange={(e) => setOperationalSettings(prev => ({...prev, workingHours: e.target.value}))}
                      label="Horario de Trabajo"
                    >
                      <MenuItem value="24x7">24/7 Disponible</MenuItem>
                      <MenuItem value="8to5">8:00 AM - 5:00 PM</MenuItem>
                      <MenuItem value="6to6">6:00 AM - 6:00 PM</MenuItem>
                      <MenuItem value="custom">Personalizado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={operationalSettings.autoNotifications}
                          onChange={(e) => setOperationalSettings(prev => ({...prev, autoNotifications: e.target.checked}))}
                          color="warning"
                        />
                      }
                      label="Notificaciones Automáticas"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={operationalSettings.urgentAlerts}
                          onChange={(e) => setOperationalSettings(prev => ({...prev, urgentAlerts: e.target.checked}))}
                          color="error"
                        />
                      }
                      label="Alertas Urgentes"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={operationalSettings.complianceReminders}
                          onChange={(e) => setOperationalSettings(prev => ({...prev, complianceReminders: e.target.checked}))}
                          color="success"
                        />
                      }
                      label="Recordatorios de Cumplimiento"
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Professional Certifications */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="warning.dark">
                Certificaciones Profesionales
              </Typography>
              <List>
                {certifications.map((cert, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={cert.name}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            {cert.issuer} | Vence: {cert.expiry}
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={85} 
                            color="success"
                            sx={{ mt: 1, height: 4, borderRadius: 2 }}
                          />
                        </Box>
                      }
                    />
                    <Chip 
                      label={cert.status.toUpperCase()} 
                      color="success" 
                      size="small" 
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Operational Responsibilities */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="warning.dark">
                Responsabilidades Operacionales
              </Typography>
              <List>
                {responsibilities.map((responsibility, index) => (
                  <ListItem key={index}>
                    <ListItemIcon sx={{ color: 'warning.main' }}>
                      {responsibility.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={responsibility.title}
                      secondary={responsibility.description}
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