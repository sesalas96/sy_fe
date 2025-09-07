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
  CircularProgress,
} from '@mui/material';
import {
  VerifiedUser as ApproverIcon,
  CheckCircle as ApprovalIcon,
  Schedule as PendingIcon,
  Assessment as ReviewIcon,
  Edit as EditIcon,
  Photo as PhotoIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useContractorFiles } from '../../hooks/useContractorFiles';
import { AvatarEditModal } from './AvatarEditModal';

export const ClientApproverProfile: React.FC = () => {
  const { user } = useAuth();
  const { loading, filesData, refetch } = useContractorFiles();
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [approverSettings, setApproverSettings] = useState({
    autoNotifications: true,
    urgentOnlyMode: false,
    approvalReminders: true,
    delegationEnabled: false,
    workingHours: '8to5',
    approvalThreshold: 'standard'
  });

  const approverStats = {
    pendingApprovals: 8,
    approvedToday: 12,
    rejectedToday: 2,
    totalThisMonth: 156,
    avgResponseTime: '2.5h',
    approvalRate: 94
  };

  const approvalAreas = [
    { icon: <ApprovalIcon />, title: 'Permisos de Trabajo', description: 'Autorización de permisos de alto riesgo', count: 5 },
    { icon: <ReviewIcon />, title: 'Certificaciones de Contratistas', description: 'Validación de documentos y credenciales', count: 2 },
    { icon: <ApproverIcon />, title: 'Procedimientos de Seguridad', description: 'Aprobación de protocolos especiales', count: 1 },
    { icon: <PendingIcon />, title: 'Modificaciones de Proyecto', description: 'Cambios en alcance y metodología', count: 0 }
  ];

  const recentApprovals = [
    { type: 'Permiso de Trabajo', item: 'Trabajo en Alturas - Torre Norte', applicant: 'Juan Pérez', status: 'approved', date: '2024-01-20' },
    { type: 'Certificación', item: 'Validación Soldador Certificado', applicant: 'María González', status: 'approved', date: '2024-01-20' },
    { type: 'Procedimiento', item: 'Protocolo Espacio Confinado', applicant: 'Carlos López', status: 'pending', date: '2024-01-19' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Approver Identity */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Tooltip title={filesData.selfieUrl ? "Clic para editar foto" : "Agregar foto de perfil"}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      <IconButton
                        sx={{
                          bgcolor: 'primary.main',
                          color: 'white',
                          width: 28,
                          height: 28,
                          '&:hover': {
                            bgcolor: 'primary.dark',
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
                          bgcolor: filesData.selfieUrl ? 'transparent' : 'secondary.main',
                          transition: 'opacity 0.2s',
                          border: !filesData.selfieUrl ? '2px dashed' : 'none',
                          borderColor: 'action.disabled'
                        }}
                        src={filesData.selfieUrl}
                      >
                        {!filesData.selfieUrl && <PhotoIcon sx={{ fontSize: 40 }} />}
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
                  <Typography variant="h6" color="secondary.main">
                    {user?.name}
                  </Typography>
                  <Chip 
                    label="VERIFICADORES" 
                    color="secondary" 
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="textSecondary">
                    Especialista en Aprobaciones de Seguridad
                  </Typography>
                  {!filesData.selfieUrl && (
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
                    label="Nombre del Aprobador"
                    value={user?.name || ''}
                    disabled
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Email de Aprobaciones"
                    value={user?.email || ''}
                    disabled
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Código de Aprobador"
                    value="APR-HSE-2024-015"
                    disabled
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <InputLabel>Nivel de Aprobación</InputLabel>
                    <Select
                      value={approverSettings.approvalThreshold}
                      onChange={(e) => setApproverSettings(prev => ({...prev, approvalThreshold: e.target.value}))}
                      label="Nivel de Aprobación"
                    >
                      <MenuItem value="basic">Básico</MenuItem>
                      <MenuItem value="standard">Estándar</MenuItem>
                      <MenuItem value="advanced">Avanzado</MenuItem>
                      <MenuItem value="executive">Ejecutivo</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Approval Statistics */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="secondary.main">
                Estadísticas de Aprobación
              </Typography>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 4 }}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="h5" color="warning.main">
                      {approverStats.pendingApprovals}
                    </Typography>
                    <Typography variant="caption">
                      Pendientes
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="h5" color="success.main">
                      {approverStats.approvedToday}
                    </Typography>
                    <Typography variant="caption">
                      Aprobadas Hoy
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="h5" color="error.main">
                      {approverStats.rejectedToday}
                    </Typography>
                    <Typography variant="caption">
                      Rechazadas Hoy
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="h6" color="primary.main">
                      {approverStats.avgResponseTime}
                    </Typography>
                    <Typography variant="caption">
                      Tiempo Promedio de Respuesta
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'success.50', borderRadius: 1 }}>
                    <Typography variant="h6" color="success.main">
                      {approverStats.approvalRate}%
                    </Typography>
                    <Typography variant="caption">
                      Tasa de Aprobación
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <InputLabel>Horario de Aprobaciones</InputLabel>
                    <Select
                      value={approverSettings.workingHours}
                      onChange={(e) => setApproverSettings(prev => ({...prev, workingHours: e.target.value}))}
                      label="Horario de Aprobaciones"
                    >
                      <MenuItem value="8to5">8:00 AM - 5:00 PM</MenuItem>
                      <MenuItem value="9to6">9:00 AM - 6:00 PM</MenuItem>
                      <MenuItem value="24x7">24/7 Disponible</MenuItem>
                      <MenuItem value="custom">Personalizado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Approval Settings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="secondary.main">
                Configuraciones de Aprobación
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={approverSettings.autoNotifications}
                      onChange={(e) => setApproverSettings(prev => ({...prev, autoNotifications: e.target.checked}))}
                      color="secondary"
                    />
                  }
                  label="Notificaciones automáticas de solicitudes"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={approverSettings.urgentOnlyMode}
                      onChange={(e) => setApproverSettings(prev => ({...prev, urgentOnlyMode: e.target.checked}))}
                      color="error"
                    />
                  }
                  label="Solo notificaciones urgentes"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={approverSettings.approvalReminders}
                      onChange={(e) => setApproverSettings(prev => ({...prev, approvalReminders: e.target.checked}))}
                      color="warning"
                    />
                  }
                  label="Recordatorios de aprobaciones pendientes"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={approverSettings.delegationEnabled}
                      onChange={(e) => setApproverSettings(prev => ({...prev, delegationEnabled: e.target.checked}))}
                      color="info"
                    />
                  }
                  label="Permitir delegación de aprobaciones"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Approval Areas */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="secondary.main">
                Áreas de Aprobación
              </Typography>
              <List>
                {approvalAreas.map((area, index) => (
                  <ListItem key={index}>
                    <ListItemIcon sx={{ color: 'secondary.main' }}>
                      {area.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={area.title}
                      secondary={area.description}
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Typography variant="h6" color="primary">
                        {area.count}
                      </Typography>
                      <Typography variant="caption">
                        Pendientes
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Approvals */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="secondary.main">
                Aprobaciones Recientes
              </Typography>
              <List>
                {recentApprovals.map((approval, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <ApprovalIcon color={getStatusColor(approval.status) as any} />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${approval.type}: ${approval.item}`}
                      secondary={`Solicitante: ${approval.applicant} | ${approval.date}`}
                    />
                    <Chip 
                      label={approval.status.toUpperCase()} 
                      color={getStatusColor(approval.status) as any}
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
        currentAvatarUrl={filesData.selfieUrl}
        onAvatarUpdated={() => {
          refetch(); // Refresh the files data
        }}
      />
    </Box>
  );
};