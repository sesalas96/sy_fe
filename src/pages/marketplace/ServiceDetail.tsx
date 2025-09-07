import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert,
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Category as CategoryIcon,
  AttachMoney as PriceIcon,
  Schedule as ScheduleIcon,
  Warning as RiskIcon,
  Build as ToolIcon,
  Security as PPEIcon,
  Assignment as RequirementIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ServicesApi, Service } from '../../services/servicesApi';
import { StatusBadge } from '../../components/marketplace/StatusBadge';
import { formatCurrency } from '../../utils/formatters';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { usePageTitle } from '../../hooks/usePageTitle';

export const ServiceDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  
  usePageTitle('Detalle del Servicio', 'Información detallada del servicio');

  // State
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Permissions
  const canEditService = () => {
    return user?.role === 'super_admin' || user?.role === 'safety_staff';
  };

  // Load service data
  const loadService = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const serviceData = await ServicesApi.getService(id);
      setService(serviceData);
    } catch (err: any) {
      console.error('Error loading service:', err);
      setError(err.message || 'Error loading service');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadService();
    }
  }, [id, loadService]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'bajo': return 'success';
      case 'medio': return 'warning';
      case 'alto': return 'error';
      case 'crítico': return 'error';
      default: return 'default';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    return <RiskIcon color={getRiskColor(riskLevel) as any} />;
  };

  if (loading) {
    return <SkeletonLoader variant="cards" rows={1} />;
  }

  if (error || !service) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Servicio no encontrado'}
        </Alert>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/marketplace/services')}
        >
          Volver a Servicios
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', mb: 3, gap: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, width: { xs: '100%', sm: 'auto' } }}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/marketplace/services')}
            size={isMobile ? 'small' : 'medium'}
          >
            {isXs ? 'Volver' : 'Volver a Servicios'}
          </Button>
          <Typography variant={isMobile ? 'h5' : 'h4'} component="h1">
            {service.name}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
          <StatusBadge status={service.isActive ? 'active' : 'inactive'} />
          {canEditService() && (
            <Button
              variant="contained"
              size={isMobile ? 'small' : 'medium'}
              startIcon={!isXs ? <EditIcon /> : undefined}
              onClick={() => navigate(`/marketplace/services/${service._id}/edit`)}
            >
              {isXs ? 'Editar' : 'Editar Servicio'}
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Information */}
        <Grid size={{ xs: 12, lg: 8 }}>
          {/* Service Overview */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información General
              </Typography>
              
              {isMobile ? (
                // Mobile Layout - Stacked Information
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CategoryIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Categoría
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {service.category?.name || 'Sin Categoría'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PriceIcon sx={{ mr: 2, color: 'success.main' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Precio Base
                      </Typography>
                      <Typography variant="h6">
                        {formatCurrency(service.basePrice)} / {service.billingUnit}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ScheduleIcon sx={{ mr: 2, color: 'info.main' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Duración Estimada
                      </Typography>
                      <Typography variant="body1">
                        {service.estimatedDuration.value} {service.estimatedDuration.unit}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {getRiskIcon(service.riskLevel)}
                    <Box sx={{ ml: 2, flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Nivel de Riesgo
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip 
                          label={service.riskLevel.toUpperCase()}
                          color={getRiskColor(service.riskLevel) as any}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </Box>
                </Box>
              ) : (
                // Desktop Layout - Grid
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CategoryIcon sx={{ mr: 2, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Categoría
                        </Typography>
                        <Typography variant="body1">
                          {service.category?.name || 'Sin Categoría'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <PriceIcon sx={{ mr: 2, color: 'success.main' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Precio Base
                        </Typography>
                        <Typography variant="h6">
                          {formatCurrency(service.basePrice)} / {service.billingUnit}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <ScheduleIcon sx={{ mr: 2, color: 'info.main' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Duración Estimada
                        </Typography>
                        <Typography variant="body1">
                          {service.estimatedDuration.value} {service.estimatedDuration.unit}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {getRiskIcon(service.riskLevel)}
                      <Box sx={{ ml: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Nivel de Riesgo
                        </Typography>
                        <Chip 
                          label={service.riskLevel.toUpperCase()}
                          color={getRiskColor(service.riskLevel) as any}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              )}

              <Divider sx={{ my: 2 }} />
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Descripción
              </Typography>
              <Typography variant="body1" paragraph>
                {service.description}
              </Typography>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                Código del Servicio
              </Typography>
              <Typography variant="body1">
                {service.code}
              </Typography>
            </CardContent>
          </Card>

          {/* SLA Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Acuerdo de Nivel de Servicio (SLA)
              </Typography>
              <Grid container spacing={isMobile ? 2 : 3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant={isMobile ? "h5" : "h4"} color="primary.main">
                      {service.sla.responseTime.value || '-'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tiempo de Respuesta ({service.sla.responseTime.unit})
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant={isMobile ? "h5" : "h4"} color="success.main">
                      {service.sla.resolutionTime.value || '-'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tiempo de Resolución ({service.sla.resolutionTime.unit})
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tags */}
          {service.tags && service.tags.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Etiquetas
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {service.tags.map((tag, index) => (
                    <Chip key={index} label={tag} variant="outlined" size="small" />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, lg: 4 }}>
          {/* Required Tools */}
          {service.requiredTools && service.requiredTools.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <ToolIcon sx={{ mr: 1 }} />
                  Herramientas Requeridas
                </Typography>
                <List dense>
                  {service.requiredTools.map((tool) => (
                    <ListItem key={tool._id} disablePadding>
                      <ListItemText
                        primary={tool.name}
                        secondary={
                          <>
                            <Typography variant="body2" component="span">
                              {tool.description}
                            </Typography>
                            <br />
                            <Chip 
                              label={`Proporcionado por: ${tool.whoProvides}`}
                              size="small"
                              variant="outlined"
                              sx={{ mt: 0.5 }}
                            />
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}

          {/* Common Risks */}
          {service.commonRisks && service.commonRisks.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <RiskIcon sx={{ mr: 1 }} />
                  Riesgos Comunes
                </Typography>
                <List dense>
                  {service.commonRisks.map((risk) => (
                    <ListItem key={risk._id} disablePadding>
                      <ListItemText
                        primary={risk.description}
                        secondary={
                          <Typography variant="body2" color="success.main">
                            Prevención: {risk.preventiveMeasure}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}

          {/* Required PPE - Show service-level or category-level */}
          {((service.requiredPPE && service.requiredPPE.length > 0) || 
            (service.category?.requiredPPE && service.category.requiredPPE.length > 0)) && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <PPEIcon sx={{ mr: 1 }} />
                  EPP Requerido
                  {service.requiredPPE?.length === 0 && service.category?.requiredPPE && (
                    <Chip label="De la Categoría" size="small" />
                  )}
                </Typography>
                {service.requiredPPE && service.requiredPPE.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {service.requiredPPE.map((ppe, index) => (
                      <Chip key={index} label={ppe} color="warning" size="small" />
                    ))}
                  </Box>
                ) : (
                  <List dense>
                    {service.category?.requiredPPE?.map((ppe) => (
                      <ListItem key={ppe._id} disablePadding>
                        <ListItemText
                          primary={ppe.name}
                          secondary={ppe.description}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          )}

          {/* Required Certifications - Show service-level or category-level */}
          {((service.requiredCertifications && service.requiredCertifications.length > 0) || 
            (service.category?.requiredCertifications && service.category.requiredCertifications.length > 0)) && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <RequirementIcon sx={{ mr: 1 }} />
                  Certificaciones Requeridas
                  {service.requiredCertifications?.length === 0 && service.category?.requiredCertifications && (
                    <Chip label="De la Categoría" size="small" />
                  )}
                </Typography>
                {service.requiredCertifications && service.requiredCertifications.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {service.requiredCertifications.map((cert, index) => (
                      <Chip key={index} label={cert} color="info" size="small" />
                    ))}
                  </Box>
                ) : (
                  <List dense>
                    {service.category?.requiredCertifications?.map((cert) => (
                      <ListItem key={cert._id} disablePadding>
                        <ListItemText
                          primary={cert.name}
                          secondary={
                            <>
                              <Typography variant="body2" component="span">
                                {cert.description}
                              </Typography>
                              <br />
                              <Chip 
                                label={`Válido por: ${cert.validityDays} días`}
                                size="small"
                                variant="outlined"
                                sx={{ mt: 0.5 }}
                              />
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};