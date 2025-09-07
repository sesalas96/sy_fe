import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Snackbar,
  Grid,
  Breadcrumbs,
  Link,
  Avatar,
  Stack,
  TextField,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as CopyIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Category as CategoryIcon,
  Tag as TagIcon,
  Timer as TimerIcon,
  Security as ApprovalIcon,
  Preview as PreviewIcon,
  CalendarToday as DateIcon
} from '@mui/icons-material';
import { formsApi, Form } from '../../services/formsApi';
import { FormRenderer } from '../../components/FormRenderer';
import { usePageTitle } from '../../hooks/usePageTitle';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';

// Categories mapping
const categoryLabels: Record<string, string> = {
  analisis_riesgo: 'Análisis de Riesgo',
  verificacion_trabajo: 'Verificación Pre-trabajo',
  control_seguridad: 'Control de Seguridad',
  equipos_herramientas: 'Equipos y Herramientas',
  condiciones_ambientales: 'Condiciones Ambientales',
  procedimientos: 'Procedimientos Específicos',
  emergencias: 'Emergencias',
  inspeccion: 'Inspección',
  certificacion: 'Certificación',
  salud: 'Salud',
  ambiental: 'Ambiental',
  general: 'General',
  otros: 'Otros'
};

export const FormDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  usePageTitle('Detalle de Formulario', 'Información del formulario');

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [newFormName, setNewFormName] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const loadForm = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await formsApi.getFormById(id);
      
      if (response.success && response.data) {
        setForm(response.data);
        setNewFormName(`${response.data.name} (Copia)`);
      } else {
        setError('Formulario no encontrado');
      }
    } catch (err) {
      console.error('Error loading form:', err);
      setError('Error al cargar el formulario');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadForm();
  }, [loadForm]);

  const handleEdit = () => {
    navigate(`/work-permits/forms/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!form) return;
    
    try {
      const response = await formsApi.deleteForm(form._id);
      
      if (response.success) {
        setNotification({
          open: true,
          message: 'Formulario eliminado exitosamente',
          severity: 'success'
        });
        setTimeout(() => navigate('/work-permits/forms'), 1500);
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      console.error('Error deleting form:', err);
      setNotification({
        open: true,
        message: 'Error al eliminar el formulario',
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleClone = async () => {
    if (!form || !newFormName.trim()) return;
    
    try {
      const response = await formsApi.duplicateForm(form._id, newFormName.trim());
      
      if (response.success && response.data) {
        setNotification({
          open: true,
          message: 'Formulario clonado exitosamente',
          severity: 'success'
        });
        navigate(`/work-permits/forms/${response.data._id}`);
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      console.error('Error cloning form:', err);
      setNotification({
        open: true,
        message: 'Error al clonar el formulario',
        severity: 'error'
      });
    } finally {
      setCloneDialogOpen(false);
    }
  };

  const getTotalFields = () => {
    if (!form) return 0;
    return form.sections.reduce((acc, section) => acc + section.fields.length, 0);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <SkeletonLoader />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => navigate('/work-permits/forms')}
        >
          Volver al Catálogo
        </Button>
      </Box>
    );
  }

  if (!form) {
    return null;
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate('/work-permits/forms')}
          sx={{ textDecoration: 'none', fontSize: 'inherit' }}
        >
          {isXs ? 'Formularios' : 'Catálogo de Formularios'}
        </Link>
        <Typography color="text.primary" sx={{ fontSize: 'inherit' }}>
          {isXs && form.name.length > 20 ? form.name.substring(0, 20) + '...' : form.name}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', md: 'flex-start' }, 
        gap: 2,
        mb: 3 
      }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant={isXs ? "h5" : "h4"} gutterBottom>
            {form.name}
          </Typography>
          <Typography variant={isXs ? "body2" : "body1"} color="text.secondary" paragraph>
            {form.description}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              icon={form.isActive ? <ActiveIcon /> : <InactiveIcon />}
              label={form.isActive ? 'Activo' : 'Inactivo'}
              color={form.isActive ? 'success' : 'default'}
              size={isXs ? "small" : "medium"}
            />
            <Chip
              icon={<CategoryIcon />}
              label={categoryLabels[form.category] || form.category}
              size={isXs ? "small" : "medium"}
              variant="outlined"
            />
            {form.code && (
              <Chip
                label={`Código: ${form.code}`}
                size={isXs ? "small" : "medium"}
                variant="outlined"
              />
            )}
            {form.metadata?.requiresApproval && (
              <Chip
                icon={<ApprovalIcon />}
                label="Requiere aprobación"
                size={isXs ? "small" : "medium"}
                color="warning"
              />
            )}
          </Stack>
        </Box>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={1}
          sx={{ 
            alignSelf: { xs: 'stretch', md: 'flex-start' },
            mt: { xs: 2, md: 0 }
          }}
        >
          <Button
            variant="contained"
            startIcon={!isXs && <EditIcon />}
            onClick={handleEdit}
            fullWidth={isXs}
            size={isXs ? "small" : "medium"}
          >
            {isXs ? <EditIcon /> : 'Editar'}
          </Button>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: isXs ? 'center' : 'flex-start' }}>
            <IconButton 
              onClick={() => setCloneDialogOpen(true)} 
              title="Clonar"
              size={isXs ? "small" : "medium"}
            >
              <CopyIcon fontSize={isXs ? "small" : "medium"} />
            </IconButton>
            <IconButton 
              onClick={() => setDeleteDialogOpen(true)} 
              title="Eliminar" 
              color="error"
              size={isXs ? "small" : "medium"}
            >
              <DeleteIcon fontSize={isXs ? "small" : "medium"} />
            </IconButton>
          </Box>
        </Stack>
      </Box>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Main Content - Order 2 on mobile, 1 on desktop */}
        <Grid size={{ xs: 12, md: 8 }} order={{ xs: 2, md: 1 }}>
          {/* Form Information */}
          <Card sx={{ mb: { xs: 2, sm: 3 } }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant={isXs ? "subtitle1" : "h6"} gutterBottom>
                Información del Formulario
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Categoría
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {categoryLabels[form.category] || form.category}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Código
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {form.code || 'Sin código'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Secciones
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {form.sections.length}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total de Campos
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {getTotalFields()}
                  </Typography>
                </Grid>
                {form.metadata?.estimatedCompletionTime && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Tiempo Estimado
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <TimerIcon sx={{ fontSize: 20 }} />
                      <Typography variant="body1">
                        {form.metadata.estimatedCompletionTime} minutos
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Sections Details */}
          <Card sx={{ mb: { xs: 2, sm: 3 } }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant={isXs ? "subtitle1" : "h6"} gutterBottom>
                Secciones del Formulario
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                {form.sections.map((section, index) => (
                  <ListItem key={index} sx={{ pl: 0 }}>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}>
                        {index + 1}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={section.title}
                      secondary={
                        <Box>
                          {section.description && (
                            <Typography variant="body2" color="text.secondary">
                              {section.description}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.secondary">
                            {section.fields.length} campo{section.fields.length !== 1 ? 's' : ''}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Form Preview */}
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between', 
                alignItems: { xs: 'stretch', sm: 'center' }, 
                gap: { xs: 2, sm: 0 },
                mb: 2 
              }}>
                <Typography variant={isXs ? "subtitle1" : "h6"}>
                  Vista Previa del Formulario
                </Typography>
                <Button
                  startIcon={!isXs && <PreviewIcon />}
                  onClick={() => setShowPreview(!showPreview)}
                  size={isXs ? "small" : "medium"}
                  variant={isXs ? "outlined" : "text"}
                  fullWidth={isXs}
                >
                  {isXs ? (showPreview ? 'Ocultar' : 'Ver') : (showPreview ? 'Ocultar' : 'Mostrar')} Vista Previa
                </Button>
              </Box>
              {showPreview && (
                <>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ maxHeight: '600px', overflow: 'auto' }}>
                    <FormRenderer
                      form={form}
                      disabled={true}
                      showSubmitButton={false}
                    />
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar - Order 1 on mobile, 2 on desktop */}
        <Grid size={{ xs: 12, md: 4 }} order={{ xs: 1, md: 2 }}>
          {/* Metadata */}
          <Card sx={{ mb: { xs: 2, sm: 3 } }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant={isXs ? "subtitle1" : "h6"} gutterBottom>
                Metadatos
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                {form.tags && form.tags.length > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Etiquetas
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {form.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          icon={<TagIcon />}
                          label={tag}
                          size="small"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Fecha de Creación
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <DateIcon sx={{ fontSize: 20 }} />
                    <Typography variant="body1">
                      {new Date(form.createdAt).toLocaleDateString('es-ES')}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Última Actualización
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <DateIcon sx={{ fontSize: 20 }} />
                    <Typography variant="body1">
                      {new Date(form.updatedAt).toLocaleDateString('es-ES')}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant={isXs ? "subtitle1" : "h6"} gutterBottom>
                Acciones
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<BackIcon />}
                  onClick={() => navigate('/work-permits/forms')}
                  size={isXs ? "small" : "medium"}
                >
                  Volver al Catálogo
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                  size={isXs ? "small" : "medium"}
                >
                  Editar Formulario
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<CopyIcon />}
                  onClick={() => setCloneDialogOpen(true)}
                  size={isXs ? "small" : "medium"}
                >
                  Clonar Formulario
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteDialogOpen(true)}
                  size={isXs ? "small" : "medium"}
                >
                  Eliminar Formulario
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        fullScreen={isXs}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea eliminar el formulario "{form.name}"?
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clone Dialog */}
      <Dialog
        open={cloneDialogOpen}
        onClose={() => setCloneDialogOpen(false)}
        fullScreen={isXs}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Clonar Formulario</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Ingrese el nombre para el nuevo formulario clonado
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            label="Nombre del nuevo formulario"
            value={newFormName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFormName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloneDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleClone}
            variant="contained"
            disabled={!newFormName.trim()}
          >
            Clonar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};