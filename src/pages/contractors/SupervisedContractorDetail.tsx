import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  Breadcrumbs,
  Link,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  CircularProgress,
  Avatar,
  IconButton,
  useTheme,
  useMediaQuery,
  Stack,
  Paper,
  CardHeader,
  Grid
} from '@mui/material';
import {
  Edit as EditIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  Security as SecurityIcon,
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as ActiveIcon,
  Warning as WarningIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { contractorApi, Contractor } from '../../services/contractorApi';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { usePageTitle } from '../../hooks/usePageTitle';

const getContractorName = (contractor: Contractor) => {
  if (contractor.fullName) {
    return contractor.fullName;
  }
  if (contractor.firstName && contractor.lastName) {
    return `${contractor.firstName} ${contractor.lastName}`;
  }
  return 'Sin nombre';
};

export const SupervisedContractorDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  usePageTitle(
    contractor ? `${getContractorName(contractor)}` : 'Detalle del Contratista',
    'Información detallada del contratista'
  );

  const loadContractor = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError('');
      
      const response = await contractorApi.getById(id);
      
      if (response.success && response.data) {
        setContractor(response.data);
      } else {
        setError(response.message || 'Contratista no encontrado');
      }
    } catch (err) {
      console.error('Error loading contractor:', err);
      setError('Error al cargar la información del contratista');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadContractor();
    } else {
      setError('ID de contratista no válido');
      setLoading(false);
    }
  }, [id, loadContractor]);

  const handleEdit = () => {
    navigate(`/supervised-contractors/${id}/edit`);
  };

  const handleBack = () => {
    navigate('/supervised-contractors');
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'No registrada';
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };


  const getInitials = (contractor: Contractor) => {
    const name = getContractorName(contractor);
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusChip = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    
    if (normalizedStatus === 'active' || normalizedStatus === 'activo') {
      return (
        <Chip
          label="Activo"
          color="success"
          size="small"
          icon={<ActiveIcon />}
        />
      );
    } else if (normalizedStatus === 'inactive' || normalizedStatus === 'inactivo') {
      return (
        <Chip
          label="Inactivo"
          color="default"
          size="small"
        />
      );
    } else if (normalizedStatus === 'suspended' || normalizedStatus === 'suspendido' || normalizedStatus === 'baja') {
      return (
        <Chip
          label="Suspendido"
          color="error"
          size="small"
          icon={<WarningIcon />}
        />
      );
    }
    
    return (
      <Chip
        label={status}
        color="default"
        size="small"
      />
    );
  };


  // Only CLIENT_SUPERVISOR can access
  if (user?.role !== UserRole.CLIENT_SUPERVISOR) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tiene permisos para acceder a esta sección.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography>Cargando información del contratista...</Typography>
      </Box>
    );
  }

  if (error || !contractor) {
    return (
      <Box>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link 
            color="inherit" 
            href="#" 
            onClick={(e) => { 
              e.preventDefault(); 
              handleBack(); 
            }}
          >
            Contratistas
          </Link>
          <Typography color="textPrimary">Detalle</Typography>
        </Breadcrumbs>
        
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Contratista no encontrado'}
        </Alert>

        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Volver a Contratistas
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
            handleBack(); 
          }}
        >
          Contratistas
        </Link>
        <Typography color="textPrimary">
          {getContractorName(contractor)}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}10 100%)` }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <IconButton
              onClick={handleBack}
              sx={{ mr: 2 }}
              size={isMobile ? 'small' : 'medium'}
            >
              <ArrowBackIcon />
            </IconButton>
            <Avatar
              sx={{ 
                width: { xs: 48, md: 64 }, 
                height: { xs: 48, md: 64 }, 
                mr: { xs: 2, md: 3 }, 
                bgcolor: contractor.status === 'active' ? 'success.main' : 
                         contractor.status === 'inactive' ? 'warning.main' : 'error.main',
                fontSize: { xs: '1rem', md: '1.5rem' },
                border: '3px solid white',
                boxShadow: theme.shadows[3]
              }}
            >
              {getInitials(contractor)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ fontWeight: 600 }}>
                {getContractorName(contractor)}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
                Cédula: {contractor.cedula}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                {getStatusChip(contractor.status)}
                {contractor.company && (
                  <Chip 
                    label={contractor.company.name} 
                    size="small" 
                    variant="outlined" 
                    icon={<BusinessIcon />}
                  />
                )}
                {contractor.supervisor && (
                  <Chip 
                    label={`Sup: ${contractor.supervisor.firstName} ${contractor.supervisor.lastName}`} 
                    size="small" 
                    variant="outlined" 
                    icon={<GroupIcon />}
                    color="info"
                  />
                )}
              </Box>
            </Box>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            gap: 1, 
            width: { xs: '100%', md: 'auto' },
            justifyContent: { xs: 'stretch', md: 'flex-end' }
          }}>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEdit}
              fullWidth={isMobile}
              size={isMobile ? 'medium' : 'large'}
            >
              {isMobile ? 'Editar' : 'Editar Contratista'}
            </Button>
          </Box>
        </Box>
      </Paper>

      <Stack spacing={3}>
        {/* Summary Stats */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr 1fr' },
          gap: 2 
        }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                {contractor.certifications?.length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Certificaciones
              </Typography>
              {contractor.certifications && contractor.certifications.length > 0 && (
                <Typography variant="caption" color="success.main">
                  {contractor.certifications.filter(c => c.status === 'valid').length} válidas
                </Typography>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="info.main" sx={{ fontWeight: 700 }}>
                {contractor.courses?.length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cursos
              </Typography>
              {contractor.courses && contractor.courses.length > 0 && (
                <Typography variant="caption" color="info.main">
                  Prom: {Math.round(contractor.courses.reduce((acc, course) => acc + (course.score || 0), 0) / contractor.courses.length)}%
                </Typography>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
                {contractor.reviewStats?.averageRating?.toFixed(1) || '0.0'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Evaluación
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {contractor.reviewStats?.totalReviews || 0} evaluaciones
              </Typography>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                {contractor.reviewStats?.wouldHireAgainPercentage || 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Recomendación
              </Typography>
            </CardContent>
          </Card>
        </Box>
        
        {/* Main Content Grid */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3 
        }}>
          {/* Basic Information */}
          <Box>
            <Card>
              <CardHeader 
                avatar={<PersonIcon />}
                title="Información Personal"
                titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
              />
              <Divider />
              <CardContent>
              
              <List dense>
                <ListItem>
                  <ListItemText primary="Nombre Completo" secondary={getContractorName(contractor)} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Cédula" secondary={contractor.cedula} />
                </ListItem>
                {contractor.email && (
                  <ListItem>
                    <ListItemText primary="Email" secondary={contractor.email} />
                  </ListItem>
                )}
                {contractor.phone && (
                  <ListItem>
                    <ListItemText primary="Teléfono" secondary={contractor.phone} />
                  </ListItem>
                )}
                <ListItem>
                  <ListItemText primary="Estado" secondary={getStatusChip(contractor.status)} />
                </ListItem>
                {contractor.createdAt && (
                  <ListItem>
                    <ListItemText 
                      primary="Fecha de registro" 
                      secondary={formatDate(contractor.createdAt)} 
                    />
                  </ListItem>
                )}
                {contractor.updatedAt && (
                  <ListItem>
                    <ListItemText 
                      primary="Última actualización" 
                      secondary={formatDate(contractor.updatedAt)} 
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Box>

          {/* Company & Documentation */}
          <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Espacios de Trabajo y Documentación
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Espacios de Trabajo" 
                    secondary={
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {contractor.company?.name || 'Sin empresa'}
                        </Typography>
                        {contractor.company?.industry && (
                          <Typography variant="caption" color="text.secondary">
                            {contractor.company.industry}
                          </Typography>
                        )}
                      </Box>
                    } 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Póliza INS" 
                    secondary={
                      contractor.polizaINS?.number ? 
                        `${contractor.polizaINS.number} (vence: ${formatDate(contractor.polizaINS.expiryDate)})` : 
                        'No registrada'
                    } 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Orden Patronal" 
                    secondary={
                      contractor.ordenPatronal?.number ? 
                        `${contractor.ordenPatronal.number} (vence: ${formatDate(contractor.ordenPatronal.expiryDate || null)})` : 
                        'No registrada'
                    } 
                  />
                </ListItem>
                {contractor.supervisor && (
                  <ListItem>
                    <ListItemText 
                      primary="Supervisor Asignado" 
                      secondary={`${contractor.supervisor.firstName || ''} ${contractor.supervisor.lastName || ''}`.trim() || contractor.supervisor.email} 
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Box>
      </Box>

        {/* Certifications */}
        {contractor.certifications && contractor.certifications.length > 0 && (
          <Box>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <BadgeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Certificaciones
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <List dense>
                  {contractor.certifications.map((cert) => (
                    <ListItem key={cert._id}>
                      <ListItemIcon>
                        <SecurityIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary={cert.name}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <CalendarIcon fontSize="small" />
                            <Typography variant="caption">
                              Emitida: {formatDate(cert.issuedDate)} | Vence: {formatDate(cert.expiryDate)}
                            </Typography>
                            <Chip
                              label={cert.status === 'valid' ? 'Válida' : cert.status}
                              color={cert.status === 'valid' ? 'success' : 'default'}
                              size="small"
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Completed Courses */}
        {contractor.courses && contractor.courses.length > 0 && (
          <Box>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Cursos Completados
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <List dense>
                  {contractor.courses.map((course) => (
                    <ListItem key={course._id}>
                      <ListItemIcon>
                        <AssignmentIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary={course.courseName}
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="caption" display="block">
                              Completado: {formatDate(course.completedDate)}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Typography variant="caption">
                                Puntaje: {course.score}/100
                              </Typography>
                              <Chip
                                label={course.status === 'completed' ? 'Completado' : course.status}
                                color={course.status === 'completed' ? 'success' : 'default'}
                                size="small"
                              />
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Initial Courses */}
        {contractor.initialCourses && contractor.initialCourses.length > 0 && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Cursos Iniciales
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <List dense>
                  {contractor.initialCourses.map((course, index) => (
                    <ListItem key={course._id || index}>
                      <ListItemIcon>
                        <AssignmentIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary={course.name}
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="caption" display="block">
                              Completado: {formatDate(course.completionDate)}
                            </Typography>
                            {course.certificateUrl && (
                              <Typography variant="caption" color="primary">
                                Certificado disponible
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Additional Courses */}
        {contractor.additionalCourses && contractor.additionalCourses.length > 0 && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Cursos Adicionales
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <List dense>
                  {contractor.additionalCourses.map((course, index) => (
                    <ListItem key={course._id || index}>
                      <ListItemIcon>
                        <AssignmentIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary={course.name}
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="caption" display="block">
                              Completado: {formatDate(course.completionDate)}
                            </Typography>
                            {course.expiryDate && (
                              <Typography variant="caption" display="block">
                                Vence: {formatDate(course.expiryDate)}
                              </Typography>
                            )}
                            {course.certificateUrl && (
                              <Typography variant="caption" color="primary">
                                Certificado disponible
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Review Stats */}
        {contractor.reviewStats && contractor.reviewStats.totalReviews > 0 && (
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <BadgeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Estadísticas de Evaluaciones
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {contractor.reviewStats.averageRating.toFixed(1)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Calificación Promedio
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {contractor.reviewStats.totalReviews}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total de Evaluaciones
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {contractor.reviewStats.wouldHireAgainPercentage}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Recomendación
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Box textAlign="center">
                      <Typography variant="body2" color="text.secondary">
                        Última Evaluación
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(contractor.reviewStats.lastReviewDate || null)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Stack>
    </Box>
  );
};