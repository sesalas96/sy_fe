import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  FormControlLabel,
  Switch,
  Autocomplete,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { ArrowBack as BackIcon, Save as SaveIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ServicesApi, ServiceCategory, ServiceCreateData } from '../../services/servicesApi';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { usePageTitle } from '../../hooks/usePageTitle';

interface ServiceFormData {
  name: string;
  code: string;
  description: string;
  categoryId: string;
  billingUnit: string;
  estimatedDuration: number;
  basePrice: number;
  slaResponseTime: number;
  slaResolutionTime: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  isActive: boolean;
}

export const ServiceForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isEditing = Boolean(id);
  
  usePageTitle(
    isEditing ? 'Editar Servicio' : 'Nuevo Servicio',
    isEditing ? 'Edición de servicio del marketplace' : 'Creación de nuevo servicio'
  );

  // State
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    code: '',
    description: '',
    categoryId: '',
    billingUnit: 'pieza',
    estimatedDuration: 1,
    basePrice: 0,
    slaResponseTime: 4,
    slaResolutionTime: 8,
    riskLevel: 'medium',
    tags: [],
    isActive: true
  });
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Permissions
  const canManageServices = useCallback(() => {
    return user?.role === 'super_admin' || user?.role === 'safety_staff';
  }, [user?.role]);

  const loadCategories = useCallback(async () => {
    try {
      const categoriesData = await ServicesApi.getServiceCategories();
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Error loading categories');
      setCategories([]);
    }
  }, []);

  const loadService = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      console.log('Loading service with ID:', id);
      
      const service = await ServicesApi.getService(id);
      console.log('Loaded service:', service);
      
      setFormData({
        name: service.name,
        code: service.code,
        description: service.description,
        categoryId: service.category?._id || '',
        billingUnit: service.billingUnit,
        estimatedDuration: service.estimatedDuration.value,
        basePrice: service.basePrice,
        slaResponseTime: service.sla.responseTime.value || 4,
        slaResolutionTime: service.sla.resolutionTime.value || 8,
        riskLevel: service.riskLevel === 'bajo' ? 'low' : service.riskLevel === 'medio' ? 'medium' : service.riskLevel === 'alto' ? 'high' : 'critical',
        tags: service.tags || [],
        isActive: service.isActive
      });
    } catch (err: any) {
      console.error('Error loading service:', err);
      setError(err.message || 'Error loading service');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Load data
  useEffect(() => {
    if (!canManageServices()) {
      navigate('/unauthorized');
      return;
    }

    loadCategories();
    if (isEditing) {
      loadService();
    }
  }, [id, isEditing, canManageServices, navigate, loadService, loadCategories]);

  // Handlers
  const handleInputChange = (field: keyof ServiceFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handleTagsChange = (event: React.SyntheticEvent, value: string[]) => {
    setFormData(prev => ({
      ...prev,
      tags: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      const riskLevelMap: Record<string, 'bajo' | 'medio' | 'alto' | 'crítico'> = {
        'low': 'bajo',
        'medium': 'medio', 
        'high': 'alto',
        'critical': 'crítico'
      };

      const serviceData: ServiceCreateData = {
        name: formData.name,
        code: formData.code,
        description: formData.description,
        category: formData.categoryId, // Backend expects 'category', not 'categoryId'
        billingUnit: formData.billingUnit,
        basePrice: formData.basePrice,
        currency: 'USD',
        estimatedDuration: {
          value: formData.estimatedDuration,
          unit: 'horas'
        },
        sla: {
          responseTime: {
            value: formData.slaResponseTime,
            unit: 'horas'
          },
          resolutionTime: {
            value: formData.slaResolutionTime,
            unit: 'horas'
          }
        },
        leadTime: {
          unit: 'dias'
        },
        riskLevel: riskLevelMap[formData.riskLevel],
        commonRisks: [],
        requiredTools: [],
        requiredCertifications: [],
        requiredPPE: [],
        tags: formData.tags,
        relatedServices: [],
        isActive: formData.isActive
      };

      if (isEditing && id) {
        await ServicesApi.updateService(id, serviceData);
      } else {
        await ServicesApi.createService(serviceData);
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/marketplace/services');
      }, 1500);

    } catch (err: any) {
      console.error('Error saving service:', err);
      setError(err.message || 'Error saving service');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('El nombre del servicio es requerido');
      return false;
    }
    if (!formData.categoryId) {
      setError('La categoría es requerida');
      return false;
    }
    if (formData.basePrice < 0) {
      setError('El precio base no puede ser negativo');
      return false;
    }
    if (formData.estimatedDuration < 0.1) {
      setError('La duración estimada debe ser al menos 0.1 horas');
      return false;
    }
    return true;
  };

  const billingUnits = [
    'm2',
    'pieza',
    'hora',
    'día', 
    'visita',
    'km',
    'proyecto'
  ];

  const riskLevels = [
    { value: 'low', label: 'Bajo' },
    { value: 'medium', label: 'Medio' },
    { value: 'high', label: 'Alto' },
    { value: 'critical', label: 'Crítico' }
  ];

  if (loading && !formData.name) {
    return <SkeletonLoader variant="cards" rows={1} />;
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, gap: 2 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/marketplace/services')}
          size={isMobile ? 'small' : 'medium'}
        >
          {isXs ? 'Volver' : 'Volver a Servicios'}
        </Button>
        <Typography variant={isMobile ? 'h5' : 'h4'}>
          {isEditing ? 'Editar Servicio' : 'Crear Nuevo Servicio'}
        </Typography>
      </Box>

      {/* Form */}
      <Card>
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
              {isEditing && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  ID del Servicio: {id}
                </Typography>
              )}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              ¡Servicio guardado exitosamente!
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom>
                  Información Básica
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Nombre del Servicio"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  placeholder="ej., Instalación de Toma Eléctrica"
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Código del Servicio"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  placeholder="ej., ELEC-TOMA"
                  helperText="Identificador único para el servicio"
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Descripción"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  multiline
                  rows={isMobile ? 2 : 3}
                  required
                  placeholder="Descripción detallada del servicio..."
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Categoría</InputLabel>
                  <Select
                    value={formData.categoryId}
                    label="Categoría"
                    onChange={(e) => handleInputChange('categoryId', e.target.value)}
                  >
                    {Array.isArray(categories) && categories.map((category) => (
                      <MenuItem key={category._id || category.id} value={category._id || category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Nivel de Riesgo</InputLabel>
                  <Select
                    value={formData.riskLevel}
                    label="Nivel de Riesgo"
                    onChange={(e) => handleInputChange('riskLevel', e.target.value)}
                  >
                    {riskLevels.map((level) => (
                      <MenuItem key={level.value} value={level.value}>
                        {level.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Pricing & Duration */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Precios y Duración
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Precio Base"
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) => handleInputChange('basePrice', parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0, step: 0.01 }}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Unidad de Facturación</InputLabel>
                  <Select
                    value={formData.billingUnit}
                    label="Unidad de Facturación"
                    onChange={(e) => handleInputChange('billingUnit', e.target.value)}
                  >
                    {billingUnits.map((unit) => (
                      <MenuItem key={unit} value={unit}>
                        {unit}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Duración Estimada (horas)"
                  type="number"
                  value={formData.estimatedDuration}
                  onChange={(e) => handleInputChange('estimatedDuration', parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0.1, step: 0.1 }}
                  required
                />
              </Grid>

              {/* SLA */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Acuerdo de Nivel de Servicio (SLA)
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Tiempo de Respuesta (horas)"
                  type="number"
                  value={formData.slaResponseTime}
                  onChange={(e) => handleInputChange('slaResponseTime', parseInt(e.target.value) || 0)}
                  inputProps={{ min: 1 }}
                  helperText="Tiempo para respuesta inicial"
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Tiempo de Resolución (horas)"
                  type="number"
                  value={formData.slaResolutionTime}
                  onChange={(e) => handleInputChange('slaResolutionTime', parseInt(e.target.value) || 0)}
                  inputProps={{ min: 1 }}
                  helperText="Tiempo para completar el servicio"
                />
              </Grid>

              {/* Tags */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Etiquetas y Clasificación
                </Typography>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={formData.tags}
                  onChange={handleTagsChange}
                  renderTags={(value: string[], getTagProps) =>
                    value.map((option: string, index: number) => (
                      <Chip
                        variant="outlined"
                        label={option}
                        {...getTagProps({ index })}
                        key={index}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Etiquetas"
                      placeholder="Agregar etiquetas (presiona Enter para añadir)"
                      helperText="Las etiquetas ayudan con el descubrimiento y categorización del servicio"
                    />
                  )}
                />
              </Grid>

              {/* Status */}
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    />
                  }
                  label="Servicio Activo"
                />
              </Grid>

              {/* Actions */}
              <Grid size={{ xs: 12 }} sx={{ pt: 3 }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2, 
                  justifyContent: { xs: 'stretch', sm: 'flex-end' }
                }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/marketplace/services')}
                    disabled={loading}
                    size={isMobile ? 'medium' : 'large'}
                    fullWidth={isXs}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={loading}
                    size={isMobile ? 'medium' : 'large'}
                    fullWidth={isXs}
                  >
                    {loading ? 'Guardando...' : isEditing ? 'Actualizar Servicio' : 'Crear Servicio'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};