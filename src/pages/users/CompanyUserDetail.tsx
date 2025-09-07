import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  SupervisorAccount as SupervisorIcon,
  CalendarToday as CalendarIcon,
  Verified as VerifiedIcon,
  Badge as BadgeIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { User, UserRole } from '../../types';
import { userApi } from '../../services/userApi';
import { useAuth } from '../../contexts/AuthContext';
import { usePageTitle } from '../../hooks/usePageTitle';

export const CompanyUserDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  usePageTitle(
    user ? `${user.firstName} ${user.lastName}` : 'Detalle de Usuario',
    'Información detallada del usuario de empresa supervisada'
  );

  useEffect(() => {
    if (id) {
      loadUser();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadUser = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await userApi.getById(id);
      if (response.success && response.data) {
        setUser(response.data);
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

  const handleEdit = () => {
    if (user) {
      navigate(`/company-users/${user._id || user.id}/edit`);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-CR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.CLIENT_SUPERVISOR:
      case UserRole.CLIENT_APPROVER:
        return <SupervisorIcon color="primary" />;
      case UserRole.CLIENT_STAFF:
        return <BusinessIcon color="info" />;
      default:
        return <PersonIcon color="secondary" />;
    }
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

  const getStatusChip = (isActive: boolean) => {
    return (
      <Chip
        label={isActive ? 'Activo' : 'Inactivo'}
        color={isActive ? 'success' : 'default'}
        icon={isActive ? <CheckCircleIcon /> : <CancelIcon />}
        variant="outlined"
      />
    );
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getCompanyRelationshipLabel = (companyInfo: any) => {
    if (!companyInfo) return 'Sin empresa';
    
    const relationship = companyInfo.relationship;
    if (relationship === 'own_company') return 'Espacios de Trabajo Propia';
    if (relationship === 'supervised_company') return 'Espacios de Trabajo Supervisada';
    return 'Espacios de Trabajo';
  };

  const getCompanyRelationshipColor = (companyInfo: any) => {
    if (!companyInfo) return 'default';
    
    const relationship = companyInfo.relationship;
    if (relationship === 'own_company') return 'primary';
    if (relationship === 'supervised_company') return 'secondary';
    return 'default';
  };

  // Only CLIENT_SUPERVISOR can access this
  if (currentUser?.role !== UserRole.CLIENT_SUPERVISOR) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tiene permisos para ver detalles de Usuarios.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/company-users')}
        >
          Volver a Usuarios
        </Button>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="h6">Usuario no encontrado</Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/company-users')}
          sx={{ mt: 2 }}
        >
          Volver a Usuarios
        </Button>
      </Box>
    );
  }

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
          {user.firstName} {user.lastName}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'start', sm: 'start' },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 },
        mb: 3 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              mr: 2,
              bgcolor: 'primary.main',
              fontSize: '1.5rem'
            }}
          >
            {getInitials(user.firstName, user.lastName)}
          </Avatar>
          <Box>
            <Typography variant="h4" gutterBottom>
              {user.firstName} {user.lastName}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {getRoleIcon(user.role)}
              <Chip
                label={getRoleLabel(user.role)}
                variant="outlined"
                size="small"
              />
              {getStatusChip(user.isActive)}
            </Box>
            {/* Company relationship chip */}
            <Chip
              label={getCompanyRelationshipLabel((user as any).companyInfo)}
              color={getCompanyRelationshipColor((user as any).companyInfo)}
              size="small"
              variant="filled"
            />
          </Box>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          gap: 1,
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' }
        }}>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={handleEdit}
            size="small"
          >
            Editar
          </Button>
        </Box>
      </Box>

      {/* Information Cards */}
      <Grid container spacing={3}>
        {/* Información Personal */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Información Personal
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <List dense>
                <ListItem disablePadding>
                  <ListItemIcon>
                    <EmailIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email"
                    secondary={user.email}
                  />
                </ListItem>
                
                {user.profile?.phone && (
                  <ListItem disablePadding>
                    <ListItemIcon>
                      <PhoneIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Teléfono"
                      secondary={user.profile.phone}
                    />
                  </ListItem>
                )}
                
                <ListItem disablePadding>
                  <ListItemIcon>
                    <BusinessIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Espacios de Trabajo"
                    secondary={
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="body2">
                          {(user as any).companyInfo?.name || user.company?.name || 'Sin empresa'}
                        </Typography>
                        <Chip
                          label={getCompanyRelationshipLabel((user as any).companyInfo)}
                          color={getCompanyRelationshipColor((user as any).companyInfo)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    }
                  />
                </ListItem>
                
                <ListItem disablePadding>
                  <ListItemIcon>
                    <CalendarIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Fecha de Registro"
                    secondary={formatDate(user.createdAt)}
                  />
                </ListItem>
                
                {user.lastLogin && (
                  <ListItem disablePadding>
                    <ListItemIcon>
                      <CalendarIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Último Acceso"
                      secondary={formatDate(user.lastLogin)}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Verificación y Estado */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <VerifiedIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Estado y Verificación
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {/* Estado del Usuario */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Estado del Usuario
                </Typography>
                {getStatusChip(user.isActive)}
              </Box>

              {/* Estado de Verificación */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Estado de Verificación
                </Typography>
                <Chip
                  label={user.verificationData?.verified ? 'Verificado' : 'Sin Verificar'}
                  color={user.verificationData?.verified ? 'success' : 'warning'}
                  icon={user.verificationData?.verified ? <CheckCircleIcon /> : <CancelIcon />}
                  size="small"
                />
              </Box>

              {/* Términos y Políticas */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Aceptación de Términos
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label="Términos y Condiciones"
                    color={user.acceptedTerms ? 'success' : 'error'}
                    size="small"
                    icon={user.acceptedTerms ? <CheckCircleIcon /> : <CancelIcon />}
                  />
                  <Chip
                    label="Política de Privacidad"
                    color={user.acceptedPrivacyPolicy ? 'success' : 'error'}
                    size="small"
                    icon={user.acceptedPrivacyPolicy ? <CheckCircleIcon /> : <CancelIcon />}
                  />
                </Box>
              </Box>

              {/* Certificaciones */}
              {user.profile?.certifications && user.profile.certifications.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    <BadgeIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 16 }} />
                    Certificaciones
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {user.profile.certifications.map((cert, index) => (
                      <Chip
                        key={index}
                        label={cert}
                        variant="outlined"
                        size="small"
                        color="primary"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Información Adicional */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información Adicional
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="h6" color="primary">
                      {getRoleLabel(user.role)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Rol Asignado
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="h6" color={user.isActive ? 'success.main' : 'error.main'}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Estado
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="h6" color="info.main">
                      {user.profile?.certifications?.length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Certificaciones
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="h6" color={user.verificationData?.verified ? 'success.main' : 'warning.main'}>
                      {user.verificationData?.verified ? 'Verificado' : 'Pendiente'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Verificación
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};