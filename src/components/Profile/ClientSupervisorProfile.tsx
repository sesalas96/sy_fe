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
  Tooltip
} from '@mui/material';
import {
  Business as CompanyIcon,
  SupervisorAccount as SupervisorIcon,
  Assessment as ReportsIcon,
  People as TeamIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { AvatarEditModal } from './AvatarEditModal';

export const ClientSupervisorProfile: React.FC = () => {
  const { user, userAvatarUrl } = useAuth();
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [supervisorSettings, setSupervisorSettings] = useState({
    reportFrequency: 'weekly',
    autoApproval: false,
    teamNotifications: true,
    budgetAlerts: true,
    companySize: 'medium',
    industry: 'construction'
  });

  const companyInfo = {
    name: 'TechCorp S.A.',
    industry: 'Tecnología y Construcción',
    employeeCount: 245,
    contractorsCount: 45,
    activeProjects: 8,
    complianceScore: 96.2
  };

  const supervisoryAreas = [
    { icon: <CompanyIcon />, title: 'Gestión de Espacios de Trabajo', description: 'Supervisión de 245 empleados y 45 contratistas' },
    { icon: <SupervisorIcon />, title: 'Aprobaciones de Supervisor', description: 'Autorización de permisos y certificaciones' },
    { icon: <ReportsIcon />, title: 'Reportes Ejecutivos', description: 'Generación de reportes de cumplimiento y progreso' },
    { icon: <TeamIcon />, title: 'Gestión de Equipos', description: 'Coordinación de departamentos y proyectos' }
  ];

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Supervisor Identity & Company Info */}
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
                        src={userAvatarUrl || undefined}
                        sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}
                      >
                        {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                      </Avatar>
                    </Box>
                  </Badge>
                </Tooltip>
                <Box>
                  <Typography variant="h6" color="primary">
                    {user?.firstName} {user?.lastName}
                  </Typography>
                  <Chip 
                    label="Supervisor" 
                    color="primary" 
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="textSecondary">
                    Gerente General - {companyInfo.name}
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Nombre del Supervisor"
                    value={`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Email Corporativo"
                    value={user?.email || ''}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Espacios de Trabajo"
                    value={companyInfo.name}
                    disabled
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Posición"
                    value="Gerente General / Supervisor"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Company Statistics */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Información de la Espacios de Trabajo
              </Typography>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="primary">
                      {companyInfo.employeeCount}
                    </Typography>
                    <Typography variant="caption">
                      Empleados
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="secondary">
                      {companyInfo.contractorsCount}
                    </Typography>
                    <Typography variant="caption">
                      Contratistas
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="success.main">
                      {companyInfo.activeProjects}
                    </Typography>
                    <Typography variant="caption">
                      Proyectos Activos
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="warning.main">
                      {companyInfo.complianceScore}%
                    </Typography>
                    <Typography variant="caption">
                      Cumplimiento
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <InputLabel>Industria</InputLabel>
                    <Select
                      value={supervisorSettings.industry}
                      onChange={(e) => setSupervisorSettings(prev => ({...prev, industry: e.target.value}))}
                      label="Industria"
                    >
                      <MenuItem value="construction">Construcción</MenuItem>
                      <MenuItem value="manufacturing">Manufactura</MenuItem>
                      <MenuItem value="technology">Tecnología</MenuItem>
                      <MenuItem value="energy">Energía</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        {/* Supervisory Responsibilities */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Responsabilidades de Supervisión
              </Typography>
              <List>
                {supervisoryAreas.map((area, index) => (
                  <ListItem key={index}>
                    <ListItemIcon sx={{ color: 'primary.main' }}>
                      {area.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={area.title}
                      secondary={area.description}
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
      />
    </Box>
  );
};