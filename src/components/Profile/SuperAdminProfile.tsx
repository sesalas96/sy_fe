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
  IconButton,
  Badge,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon,
  Storage as StorageIcon,
  Analytics as AnalyticsIcon,
  Edit as EditIcon,
  Photo as PhotoIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useContractorFiles } from '../../hooks/useContractorFiles';
import { AvatarEditModal } from './AvatarEditModal';

export const SuperAdminProfile: React.FC = () => {
  const { user, userAvatarUrl } = useAuth();
  const { loading } = useContractorFiles();
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    debugMode: false,
    auditLogging: true,
    apiRateLimit: '1000',
    maxFileSize: '50',
    backupFrequency: 'daily'
  });

  const adminPrivileges = [
    { icon: <SecurityIcon />, title: 'Gestión de Seguridad del Sistema', description: 'Control total sobre configuraciones de seguridad' },
    { icon: <AdminIcon />, title: 'Administración de Usuarios', description: 'Crear, modificar y eliminar cuentas de usuario' },
    { icon: <StorageIcon />, title: 'Gestión de Base de Datos', description: 'Respaldos, migraciones y optimización' },
    { icon: <AnalyticsIcon />, title: 'Analytics y Reportes', description: 'Acceso a métricas completas del sistema' }
  ];

  return (
    <Box>
      {/* Admin Identity Section */}
      <Grid container spacing={3}>
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
                          bgcolor: 'error.main',
                          color: 'white',
                          width: 28,
                          height: 28,
                          '&:hover': {
                            bgcolor: 'error.dark',
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
                          bgcolor: userAvatarUrl ? 'transparent' : 'error.main',
                          transition: 'opacity 0.2s',
                          border: !userAvatarUrl ? '2px dashed' : 'none',
                          borderColor: 'action.disabled'
                        }}
                        src={userAvatarUrl || undefined}
                      >
                        {!userAvatarUrl && (userAvatarUrl ? 'SA' : <PhotoIcon sx={{ fontSize: 40 }} />)}
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
                  <Typography variant="h6" color="error">
                    {user?.name}
                  </Typography>
                  <Chip 
                    label="Administrador" 
                    color="error" 
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="textSecondary">
                    Acceso completo al sistema
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Nombre de Administrador"
                    value={user?.name || ''}
                    disabled
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Email Administrativo"
                    value={user?.email || ''}
                    disabled
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="ID de Sesión Admin"
                    value="SA-2024-001"
                    disabled
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* System Control Settings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="error">
                Configuraciones del Sistema
              </Typography>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <InputLabel>Límite de API (req/min)</InputLabel>
                    <Select
                      value={systemSettings.apiRateLimit}
                      onChange={(e) => setSystemSettings(prev => ({...prev, apiRateLimit: e.target.value}))}
                      label="Límite de API (req/min)"
                    >
                      <MenuItem value="500">500 requests/min</MenuItem>
                      <MenuItem value="1000">1,000 requests/min</MenuItem>
                      <MenuItem value="5000">5,000 requests/min</MenuItem>
                      <MenuItem value="unlimited">Sin límite</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <InputLabel>Tamaño Máximo de Archivo (MB)</InputLabel>
                    <Select
                      value={systemSettings.maxFileSize}
                      onChange={(e) => setSystemSettings(prev => ({...prev, maxFileSize: e.target.value}))}
                      label="Tamaño Máximo de Archivo (MB)"
                    >
                      <MenuItem value="10">10 MB</MenuItem>
                      <MenuItem value="50">50 MB</MenuItem>
                      <MenuItem value="100">100 MB</MenuItem>
                      <MenuItem value="500">500 MB</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <InputLabel>Frecuencia de Respaldo</InputLabel>
                    <Select
                      value={systemSettings.backupFrequency}
                      onChange={(e) => setSystemSettings(prev => ({...prev, backupFrequency: e.target.value}))}
                      label="Frecuencia de Respaldo"
                    >
                      <MenuItem value="hourly">Cada hora</MenuItem>
                      <MenuItem value="daily">Diario</MenuItem>
                      <MenuItem value="weekly">Semanal</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={systemSettings.maintenanceMode}
                          onChange={(e) => setSystemSettings(prev => ({...prev, maintenanceMode: e.target.checked}))}
                          color="warning"
                        />
                      }
                      label="Modo Mantenimiento"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={systemSettings.debugMode}
                          onChange={(e) => setSystemSettings(prev => ({...prev, debugMode: e.target.checked}))}
                          color="info"
                        />
                      }
                      label="Modo Debug"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={systemSettings.auditLogging}
                          onChange={(e) => setSystemSettings(prev => ({...prev, auditLogging: e.target.checked}))}
                          color="success"
                        />
                      }
                      label="Registro de Auditoría"
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Admin Privileges */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="error">
                Privilegios de Administrador
              </Typography>
              <List>
                {adminPrivileges.map((privilege, index) => (
                  <ListItem key={index}>
                    <ListItemIcon sx={{ color: 'error.main' }}>
                      {privilege.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={privilege.title}
                      secondary={privilege.description}
                    />
                    <Chip label="ACTIVO" color="success" size="small" />
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