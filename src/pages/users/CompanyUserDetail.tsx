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
  Link,
  Paper,
  Tab,
  Tabs,
  LinearProgress,
  Stack,
  useTheme,
  useMediaQuery
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
  CalendarToday as CalendarIcon,
  Verified as VerifiedIcon,
  Badge as BadgeIcon,
  Security as SecurityIcon,
  History as HistoryIcon,
  School as SchoolIcon,
  Folder as FolderIcon,
  AccessTime as AccessTimeIcon,
  Description as DescriptionIcon,
  Visibility as VisibilityIcon,
  Login as LoginIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { User, UserRole } from '../../types';
import { userApi } from '../../services/userApi';
import { useAuth } from '../../contexts/AuthContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { UserCompanyVerificationsManager } from '../../components/verifications/UserCompanyVerificationsManager';

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
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const CompanyUserDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, impersonateUser, hasRole } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [tabValue, setTabValue] = useState(0);
  const [courseProgress, setCourseProgress] = useState<any>(null);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [userDocuments, setUserDocuments] = useState<any[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [accessHistory, setAccessHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [impersonating, setImpersonating] = useState(false);

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

  const loadCourseProgress = async () => {
    if (!user?._id && !user?.id) return;
    
    try {
      setCoursesLoading(true);
      // const userId = user._id || user.id || '';
      // For now, we'll simulate the course progress since the API might not be available for company users
      // In a real implementation, you would call the appropriate API endpoint
      const response = { success: false, data: null };
      
      if (response.success && response.data) {
        setCourseProgress(response.data);
      }
    } catch (err) {
      console.error('Error loading course progress:', err);
    } finally {
      setCoursesLoading(false);
    }
  };

  const loadAccessHistory = async () => {
    // Simulate loading access history
    setHistoryLoading(true);
    try {
      // In a real implementation, you would fetch this from an API
      setAccessHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadDocuments = async () => {
    // Simulate loading documents
    setDocumentsLoading(true);
    try {
      // In a real implementation, you would fetch this from an API
      setUserDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  // Load data when tab changes
  useEffect(() => {
    if (user) {
      switch (tabValue) {
        case 1: // Historial
          loadAccessHistory();
          break;
        case 2: // Cursos
          loadCourseProgress();
          break;
        case 3: // Documentos
          loadDocuments();
          break;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabValue, user]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEdit = () => {
    if (user) {
      navigate(`/company-users/${user._id || user.id}/edit`);
    }
  };

  const handleImpersonate = async () => {
    if (!user || !impersonateUser) return;
    
    try {
      setImpersonating(true);
      await impersonateUser(user._id || user.id || '');
      // Navigate to dashboard after successful impersonation
      navigate('/dashboard');
    } catch (error) {
      console.error('Error impersonating user:', error);
      setError('Error al impersonar usuario');
    } finally {
      setImpersonating(false);
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

  const tabLabels = ['Información General', 'Historial', 'Cursos', 'Documentos'];
  
  // Add Company Verifications tab if user has appropriate permissions
  const canViewCompanyVerifications = currentUser?.role === UserRole.CLIENT_SUPERVISOR && 
    (user?.role === UserRole.CLIENT_APPROVER || user?.role === UserRole.CLIENT_STAFF);
  
  if (canViewCompanyVerifications) {
    tabLabels.push('Verificaciones');
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, overflow: 'hidden' }}>
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
      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
        <Grid container spacing={{ xs: 2, md: 3 }} alignItems={isMobile ? 'flex-start' : 'center'}>
          <Grid size={{ xs: 12, md: 'auto' }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: isMobile ? 'center' : 'flex-start',
              mb: isMobile ? 2 : 0 
            }}>
              <Avatar
                sx={{
                  width: { xs: 80, md: 100 },
                  height: { xs: 80, md: 100 },
                  bgcolor: 'primary.main',
                  fontSize: { xs: '1.5rem', md: '2rem' }
                }}
              >
                {getInitials(user.firstName, user.lastName)}
              </Avatar>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 'grow' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <Typography 
                  variant={isMobile ? 'h5' : 'h4'} 
                  gutterBottom
                  align={isMobile ? 'center' : 'left'}
                >
                  {user.firstName} {user.lastName}
                </Typography>
                {!isMobile && (
                  <>
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 1, 
                      flexWrap: 'wrap', 
                      mb: 2,
                      justifyContent: 'flex-start'
                    }}>
                      <Chip
                        icon={<SecurityIcon />}
                        label={getRoleLabel(user.role)}
                        color="primary"
                        variant="outlined"
                        size="medium"
                      />
                      <Chip
                        icon={user.isActive ? <CheckCircleIcon /> : <CancelIcon />}
                        label={user.isActive ? 'Activo' : 'Inactivo'}
                        color={user.isActive ? 'success' : 'default'}
                        size="medium"
                      />
                      {user.verificationData?.verified && (
                        <Chip
                          icon={<VerifiedIcon />}
                          label="Verificado"
                          color="success"
                          size="medium"
                        />
                      )}
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 2, 
                      flexWrap: 'wrap',
                      flexDirection: 'row',
                      alignItems: 'flex-start'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {user.email}
                        </Typography>
                      </Box>
                      {user.profile?.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PhoneIcon fontSize="small" color="action" />
                          <Typography variant="body2">{user.profile.phone}</Typography>
                        </Box>
                      )}
                      {((user as any).companyInfo?.name || user.company?.name) && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <BusinessIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {(user as any).companyInfo?.name || user.company?.name}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </>
                )}
                {isMobile && (
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2 }}>
                    <Chip
                      label={getRoleLabel(user.role)}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                    <Chip
                      label={user.isActive ? 'Activo' : 'Inactivo'}
                      color={user.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                )}
              </Box>
              <Box sx={{ ml: 2, display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                  size={isMobile ? 'small' : 'medium'}
                >
                  Editar
                </Button>
                {/* Show impersonate button for SUPER_ADMIN, SAFETY_STAFF, and CLIENT_SUPERVISOR */}
                {hasRole && hasRole([UserRole.SUPER_ADMIN, UserRole.SAFETY_STAFF, UserRole.CLIENT_SUPERVISOR]) && 
                 user && user._id !== currentUser?._id && (() => {
                   // Apply role-based restrictions
                   const currentRole = currentUser?.role as UserRole;
                   const targetRole = user.role;
                   
                   if (currentRole === UserRole.SUPER_ADMIN) {
                     // SUPER_ADMIN can impersonate anyone except other SUPER_ADMINs
                     return targetRole !== UserRole.SUPER_ADMIN;
                   } else if (currentRole === UserRole.SAFETY_STAFF) {
                     // SAFETY_STAFF can't impersonate SUPER_ADMIN or other SAFETY_STAFF
                     return targetRole !== UserRole.SUPER_ADMIN && targetRole !== UserRole.SAFETY_STAFF;
                   } else if (currentRole === UserRole.CLIENT_SUPERVISOR) {
                     // CLIENT_SUPERVISOR can only impersonate users from same company with basic roles
                     const allowedRoles = [UserRole.CLIENT_STAFF, UserRole.CONTRATISTA_ADMIN, 
                                         UserRole.CONTRATISTA_SUBALTERNOS, UserRole.CONTRATISTA_HUERFANO,
                                         UserRole.VALIDADORES_OPS];
                     // Check both possible company ID fields
                     const userCompanyId = (user as any).companyInfo?.id || (user as any).company?._id || (user as any).company?.id;
                     const currentUserCompanyId = (currentUser as any).company?._id || (currentUser as any).company?.id;
                     
                     return userCompanyId && currentUserCompanyId && 
                            userCompanyId === currentUserCompanyId && 
                            allowedRoles.includes(targetRole);
                   }
                   return false;
                 })() && (
                  <Button
                    variant="outlined"
                    startIcon={<LoginIcon />}
                    onClick={handleImpersonate}
                    disabled={impersonating}
                    size={isMobile ? 'small' : 'medium'}
                  >
                    {impersonating ? 'Impersonando...' : 'Impersonar'}
                  </Button>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ 
        mb: 3,
        ...(isMobile && {
          mx: -2,
          width: 'calc(100vw)',
          borderRadius: 0
        })
      }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons={isMobile ? false : "auto"}
          sx={{
            '& .MuiTabs-scrollableX': {
              overflowX: 'auto',
              '&::-webkit-scrollbar': {
                display: 'none'
              }
            },
            '& .MuiTab-root': {
              minWidth: isMobile ? 'auto' : 160,
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              px: isMobile ? 2 : 3
            }
          }}
        >
          {tabLabels.map((label, index) => (
            <Tab key={index} label={label} />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        {/* Información General */}
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
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Historial */}
        <Grid container spacing={3}>
          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HistoryIcon color="primary" />
                  Historial de Acceso
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {historyLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : accessHistory.length > 0 ? (
                  <List>
                    {accessHistory.map((access: any, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <AccessTimeIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={access.action}
                          secondary={formatDate(access.timestamp)}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Alert severity="info">
                    No hay registros de acceso disponibles
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Cursos */}
        <Grid container spacing={3}>
          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SchoolIcon color="primary" />
                  Cursos y Capacitaciones
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {coursesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : courseProgress ? (
                  <>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.50', borderRadius: 2 }}>
                          <Typography variant="h4" color="success.main">
                            {courseProgress.completedCourses || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">Cursos Completados</Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.50', borderRadius: 2 }}>
                          <Typography variant="h4" color="warning.main">
                            {courseProgress.inProgressCourses || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">En Progreso</Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.50', borderRadius: 2 }}>
                          <Typography variant="h4" color="info.main">
                            {courseProgress.overallProgress || 0}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">Tasa de Completación</Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {courseProgress.courses && courseProgress.courses.length > 0 && (
                      <Stack spacing={2}>
                        {courseProgress.courses.map((course: any) => (
                          <Card key={course.id} variant="outlined">
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="h6">
                                    {course.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    ID: {course.id}
                                  </Typography>
                                  <Box sx={{ mt: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                      <Typography variant="body2">Progreso</Typography>
                                      <Typography variant="body2" fontWeight="medium">{course.completionPercentage}%</Typography>
                                    </Box>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={course.completionPercentage} 
                                      sx={{ height: 8, borderRadius: 4 }}
                                      color={course.status === 'completed' ? 'success' : 'primary'}
                                    />
                                  </Box>
                                </Box>
                                <Box sx={{ ml: 2, textAlign: 'right' }}>
                                  <Chip 
                                    label={
                                      course.status === 'completed' ? 'Completado' : 
                                      course.status === 'not_started' ? 'No iniciado' : 
                                      'En Progreso'
                                    } 
                                    color={
                                      course.status === 'completed' ? 'success' : 
                                      course.status === 'not_started' ? 'default' : 
                                      'warning'
                                    } 
                                    size="small"
                                    sx={{ mb: 1 }}
                                  />
                                  <Typography variant="caption" display="block" color="text.secondary">
                                    {course.enrollmentDate && `Inscrito: ${formatDate(course.enrollmentDate)}`}
                                  </Typography>
                                  {course.completionDate && (
                                    <Typography variant="caption" display="block" color="text.secondary">
                                      Completado: {formatDate(course.completionDate)}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    )}
                  </>
                ) : (
                  <Alert severity="info">
                    No hay datos de cursos disponibles.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {/* Documentos */}
        <Grid container spacing={3}>
          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FolderIcon color="primary" />
                  Documentos del Usuario
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {documentsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : userDocuments.length > 0 ? (
                  <List>
                    {userDocuments.map((doc: any, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <DescriptionIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={doc.name}
                          secondary={`Subido el ${formatDate(doc.uploadedAt)}`}
                        />
                        <Button
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => {/* Handle document view */}}
                        >
                          Ver
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Alert severity="info">
                    No hay documentos disponibles
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {canViewCompanyVerifications && (
        <TabPanel value={tabValue} index={4}>
          {/* Verificaciones */}
          <UserCompanyVerificationsManager 
            userId={user._id || user.id || ''}
          />
        </TabPanel>
      )}
    </Box>
  );
};