import React, { useState, useEffect, Fragment, useCallback } from 'react';
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
  Tooltip,
  Avatar,
  useTheme,
  useMediaQuery,
  Stack,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  Tabs,
  Tab,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Switch,
  FormControlLabel,
  Paper,
  ListItemAvatar,
  Badge,
  Checkbox
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as CloneIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Category as CategoryIcon,
  Description as TemplateIcon,
  CalendarToday as DateIcon,
  Update as UpdateIcon,
  Assessment as StatsIcon,
  Star as RequiredIcon,
  Info as InfoIcon,
  Article as FormIcon,
  AttachFile as DocumentIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  DeleteOutline as DeleteOutlineIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Description as FileIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  MoveUp as MoveUpIcon,
  MoveDown as MoveDownIcon,
  Save as SaveIcon,
  Timer as TimerIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  VerifiedUser as VerifiedIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { workPermitTemplateApi, WorkPermitTemplate, TemplateForm } from '../../services/workPermitTemplateApi';
import { formsApi, Form } from '../../services/formsApi';
import { templateDocumentApi, TemplateDocument } from '../../services/templateDocumentApi';
import { usePageTitle } from '../../hooks/usePageTitle';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';

// Categories mapping for display
const categoryLabels: Record<string, string> = {
  trabajo_altura: 'Trabajo en Altura',
  espacio_confinado: 'Espacios Confinados',
  trabajo_caliente: 'Trabajo en Caliente',
  excavacion: 'Excavaciones',
  electrico: 'Trabajo Eléctrico',
  quimico: 'Químicos Peligrosos',
  izaje: 'Izaje y Grúas',
  demolicion: 'Demolición',
  general: 'General',
  otro: 'Otros'
};

// Form category labels
const formCategoryLabels: Record<string, string> = {
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

// Role labels

export const TemplateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));

  const [template, setTemplate] = useState<WorkPermitTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  // Forms state
  const [availableForms, setAvailableForms] = useState<Form[]>([]);
  const [templateForms, setTemplateForms] = useState<TemplateForm[]>([]);
  const [formsLoading, setFormsLoading] = useState(false);
  const [formSearchTerm, setFormSearchTerm] = useState('');
  const [selectedFormCategory, setSelectedFormCategory] = useState<string>('');
  const [addFormDialog, setAddFormDialog] = useState(false);
  const [editingForm, setEditingForm] = useState<TemplateForm | null>(null);
  const [selectedFormsToAdd, setSelectedFormsToAdd] = useState<string[]>([]);
  const [loadingAvailableForms, setLoadingAvailableForms] = useState(false);
  const [addingForms, setAddingForms] = useState(false);

  // Documents state
  const [documents, setDocuments] = useState<TemplateDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploadData, setUploadData] = useState({
    description: '',
    documentType: 'requirement' as 'requirement' | 'example' | 'instruction' | 'other',
    file: null as File | null
  });
  const [documentToDelete, setDocumentToDelete] = useState<TemplateDocument | null>(null);

  // Dialogs
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [cloneDialog, setCloneDialog] = useState<{ open: boolean; newName: string }>({
    open: false,
    newName: ''
  });
  const [formToRemove, setFormToRemove] = useState<TemplateForm | null>(null);

  // Notifications
  const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const loadTemplate = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await workPermitTemplateApi.getTemplateById(id);
      
      if (response.success && response.data) {
        setTemplate(response.data);
        setCloneDialog(prev => ({ ...prev, newName: `${response.data!.name} (Copia)` }));
      } else {
        setError(response.message || 'Error al cargar el template');
      }
    } catch (err) {
      setError('Error al cargar el template');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadTemplateForms = useCallback(async () => {
    if (!id) return;
    
    setFormsLoading(true);
    try {
      const response = await workPermitTemplateApi.getTemplateForms(id);
      
      if (response.success && response.data) {
        setTemplateForms(response.data);
      }
    } catch (error) {
      console.error('Error loading template forms:', error);
    } finally {
      setFormsLoading(false);
    }
  }, [id]);

  const loadAvailableForms = useCallback(async () => {
    setLoadingAvailableForms(true);
    try {
      const response = await formsApi.getAllForms({ 
        limit: 100, 
        isActive: true 
      });
      
      if (response.success && response.data) {
        setAvailableForms(response.data);
      }
    } catch (error) {
      console.error('Error loading available forms:', error);
      setNotification({
        open: true,
        message: 'Error al cargar los formularios disponibles',
        severity: 'error'
      });
    } finally {
      setLoadingAvailableForms(false);
    }
  }, []);

  const loadDocuments = useCallback(async () => {
    if (!id) return;
    
    setDocumentsLoading(true);
    try {
      const response = await templateDocumentApi.getDocuments(id);
      
      if (response.success && response.data) {
        setDocuments(response.data);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      setDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  }, [id]);

  usePageTitle(
    template ? template.name : 'Cargando...',
    template ? `Template de ${categoryLabels[template.category] || template.category}` : ''
  );

  useEffect(() => {
    if (id) {
      loadTemplate();
    }
  }, [id, loadTemplate]);

  useEffect(() => {
    if (id && activeTab === 1) {
      loadTemplateForms();
      loadAvailableForms();
    }
  }, [id, activeTab, loadTemplateForms, loadAvailableForms]);

  useEffect(() => {
    if (id && activeTab === 2) {
      loadDocuments();
    }
  }, [id, activeTab, loadDocuments]);


  const handleDelete = async () => {
    if (!template) return;

    try {
      const response = await workPermitTemplateApi.deleteTemplate(template._id);
      
      if (response.success) {
        setNotification({
          open: true,
          message: 'Template eliminado exitosamente',
          severity: 'success'
        });
        setTimeout(() => navigate('/work-permits/templates'), 1500);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      setNotification({
        open: true,
        message: 'Error al eliminar el template',
        severity: 'error'
      });
    } finally {
      setDeleteDialog(false);
    }
  };

  const handleClone = async () => {
    if (!template || !cloneDialog.newName.trim()) return;

    try {
      const response = await workPermitTemplateApi.cloneTemplate(
        template._id,
        cloneDialog.newName
      );
      
      if (response.success && response.data) {
        setNotification({
          open: true,
          message: 'Template clonado exitosamente',
          severity: 'success'
        });
        navigate(`/work-permits/templates/${response.data._id}`);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      setNotification({
        open: true,
        message: 'Error al clonar el template',
        severity: 'error'
      });
    } finally {
      setCloneDialog({ open: false, newName: '' });
    }
  };

  const handleToggleStatus = async () => {
    if (!template) return;
    
    try {
      const response = await workPermitTemplateApi.toggleTemplateStatus(template._id);
      
      if (response.success) {
        setNotification({
          open: true,
          message: `Template ${template.isActive ? 'desactivado' : 'activado'} exitosamente`,
          severity: 'success'
        });
        loadTemplate();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      setNotification({
        open: true,
        message: 'Error al cambiar el estado del template',
        severity: 'error'
      });
    }
  };

  // Form management functions
  const handleAddForms = async () => {
    if (!id || selectedFormsToAdd.length === 0) return;

    setAddingForms(true);
    try {
      const newForms: TemplateForm[] = selectedFormsToAdd.map((formId, index) => ({
        form: formId,
        mandatory: true,
        order: templateForms.length + index + 1
      }));

      const response = await workPermitTemplateApi.updateTemplateForms(
        id,
        [...templateForms, ...newForms]
      );

      if (response.success) {
        setNotification({
          open: true,
          message: `${selectedFormsToAdd.length} formulario${selectedFormsToAdd.length > 1 ? 's' : ''} agregado${selectedFormsToAdd.length > 1 ? 's' : ''} exitosamente`,
          severity: 'success'
        });
        loadTemplateForms();
        setAddFormDialog(false);
        setSelectedFormsToAdd([]);
        setFormSearchTerm('');
        setSelectedFormCategory('');
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      setNotification({
        open: true,
        message: 'Error al agregar formularios',
        severity: 'error'
      });
    } finally {
      setAddingForms(false);
    }
  };

  const handleUpdateForm = async (updatedForm: TemplateForm) => {
    if (!id) return;

    try {
      const updatedForms = templateForms.map(f => 
        f.form === updatedForm.form ? updatedForm : f
      );

      const response = await workPermitTemplateApi.updateTemplateForms(id, updatedForms);

      if (response.success) {
        setNotification({
          open: true,
          message: 'Formulario actualizado exitosamente',
          severity: 'success'
        });
        loadTemplateForms();
        setEditingForm(null);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      setNotification({
        open: true,
        message: 'Error al actualizar formulario',
        severity: 'error'
      });
    }
  };

  const handleRemoveForm = async () => {
    if (!id || !formToRemove) return;

    try {
      const updatedForms = templateForms.filter(f => 
        (typeof f.form === 'string' ? f.form : f.form._id) !== 
        (typeof formToRemove.form === 'string' ? formToRemove.form : formToRemove.form._id)
      );

      // Reorder remaining forms
      updatedForms.forEach((form, index) => {
        form.order = index + 1;
      });

      const response = await workPermitTemplateApi.updateTemplateForms(id, updatedForms);

      if (response.success) {
        setNotification({
          open: true,
          message: 'Formulario removido exitosamente',
          severity: 'success'
        });
        loadTemplateForms();
        setFormToRemove(null);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      setNotification({
        open: true,
        message: 'Error al remover formulario',
        severity: 'error'
      });
    }
  };

  const handleReorderForm = async (fromIndex: number, toIndex: number) => {
    if (!id) return;

    try {
      const reorderedForms = [...templateForms];
      const [movedForm] = reorderedForms.splice(fromIndex, 1);
      reorderedForms.splice(toIndex, 0, movedForm);

      // Update order
      reorderedForms.forEach((form, index) => {
        form.order = index + 1;
      });

      const response = await workPermitTemplateApi.updateTemplateForms(id, reorderedForms);

      if (response.success) {
        loadTemplateForms();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      setNotification({
        open: true,
        message: 'Error al reordenar formularios',
        severity: 'error'
      });
    }
  };

  // Document functions
  const handleUploadDocument = async () => {
    if (!id || !uploadData.file) return;

    try {
      const response = await templateDocumentApi.uploadDocument(
        id,
        uploadData.file,
        {
          description: uploadData.description,
          documentType: uploadData.documentType
        }
      );
      
      if (response.success) {
        setNotification({
          open: true,
          message: 'Documento subido exitosamente',
          severity: 'success'
        });
        setUploadDialog(false);
        setUploadData({
          description: '',
          documentType: 'requirement',
          file: null
        });
        loadDocuments();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      setNotification({
        open: true,
        message: 'Error al subir el documento',
        severity: 'error'
      });
    }
  };

  const handleDeleteDocument = async () => {
    if (!id || !documentToDelete) return;

    try {
      const response = await templateDocumentApi.deleteDocument(id, documentToDelete._id);
      
      if (response.success) {
        setNotification({
          open: true,
          message: 'Documento eliminado exitosamente',
          severity: 'success'
        });
        setDocumentToDelete(null);
        loadDocuments();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      setNotification({
        open: true,
        message: 'Error al eliminar el documento',
        severity: 'error'
      });
    }
  };

  const handleDownloadDocument = async (document: TemplateDocument) => {
    if (!id) return;
    
    try {
      await templateDocumentApi.downloadDocument(id, document._id);
    } catch (error) {
      setNotification({
        open: true,
        message: 'Error al descargar el documento',
        severity: 'error'
      });
    }
  };

  const handleViewDocument = async (document: TemplateDocument) => {
    if (!id) return;
    
    try {
      await templateDocumentApi.downloadDocument(id, document._id, true);
    } catch (error) {
      setNotification({
        open: true,
        message: 'Error al visualizar el documento',
        severity: 'error'
      });
    }
  };

  // Helper functions

  const getDocumentIcon = (mimetype: string) => {
    if (mimetype.includes('pdf')) return <PdfIcon />;
    if (mimetype.includes('image')) return <ImageIcon />;
    return <FileIcon />;
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      requirement: 'Requisito',
      example: 'Ejemplo',
      instruction: 'Instrucción',
      other: 'Otro'
    };
    return labels[type] || type;
  };

  const getFormCategoryColor = (category: string) => {
    const colors: Record<string, any> = {
      analisis_riesgo: 'error',
      verificacion_trabajo: 'warning',
      control_seguridad: 'info',
      equipos_herramientas: 'primary',
      condiciones_ambientales: 'secondary',
      procedimientos: 'success',
      emergencias: 'error',
      inspeccion: 'warning',
      certificacion: 'info',
      salud: 'success',
      ambiental: 'secondary',
      general: 'default'
    };
    return colors[category] || 'default';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'trabajo_altura': return <WarningIcon />;
      case 'trabajo_caliente': return <WarningIcon />;
      case 'espacio_confinado': return <ErrorIcon />;
      case 'trabajo_electrico': return <WarningIcon />;
      default: return <CategoryIcon />;
    }
  };

  const getFormDetails = (form: any): Form | null => {
    if (!form) return null;
    
    // If form is a string (ID), find it in available forms
    if (typeof form === 'string') {
      return availableForms.find(f => f._id === form) || null;
    }
    
    // Otherwise, it's already a form object
    return form as Form;
  };

  // Filter available forms for adding
  const filteredAvailableForms = availableForms.filter(form => {
    // Filter out forms already in template
    const isAlreadyAdded = templateForms.some(tf => {
      const formId = typeof tf.form === 'string' ? tf.form : tf.form._id;
      return formId === form._id;
    });

    if (isAlreadyAdded) return false;

    // Apply search filter
    const matchesSearch = form.name.toLowerCase().includes(formSearchTerm.toLowerCase()) ||
                         (form.description?.toLowerCase().includes(formSearchTerm.toLowerCase()) ?? false);

    // Apply category filter
    const matchesCategory = !selectedFormCategory || form.category === selectedFormCategory;

    return matchesSearch && matchesCategory;
  });

  // Get unique categories from available forms
  const formCategories = Array.from(new Set(availableForms.map(f => f.category))).filter(Boolean).sort();

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error || !template) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Alert severity="error" sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
          {error || 'Template no encontrado'}
        </Alert>
        <Button
          variant="contained"
          startIcon={<BackIcon />}
          onClick={() => navigate('/work-permits/templates')}
        >
          Volver al Catálogo
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <IconButton 
              onClick={() => navigate('/work-permits/templates')}
              size={isMobile ? 'small' : 'medium'}
            >
              <BackIcon />
            </IconButton>
            <Typography variant={isMobile ? 'body2' : 'body1'} color="textSecondary">
              Volver al catálogo
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
              <Avatar sx={{ 
                bgcolor: 'primary.main', 
                width: { xs: 48, sm: 56 }, 
                height: { xs: 48, sm: 56 } 
              }}>
                <TemplateIcon />
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography 
                  variant={isMobile ? 'h5' : 'h4'} 
                  gutterBottom
                  sx={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  {template.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    icon={template.isActive ? <ActiveIcon /> : <InactiveIcon />}
                    label={template.isActive ? 'Activo' : 'Inactivo'}
                    color={template.isActive ? 'success' : 'default'}
                    size={isMobile ? 'small' : 'medium'}
                  />
                  <Chip
                    icon={getCategoryIcon(template.category)}
                    label={categoryLabels[template.category] || template.category}
                    variant="outlined"
                    size={isMobile ? 'small' : 'medium'}
                  />
                  {template.requiredForms && template.requiredForms.length > 0 && (
                    <Chip
                      icon={<FormIcon />}
                      label={`${template.requiredForms.length} formularios`}
                      color="primary"
                      variant="outlined"
                      size={isMobile ? 'small' : 'medium'}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Action buttons */}
          <Box sx={{ mt: 3 }}>
            {isMobile ? (
              // Mobile view - 2x2 grid
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 1.5
              }}>
                <Button
                  variant="contained"
                  onClick={() => navigate(`/work-permits/templates/${template._id}/edit`)}
                  fullWidth
                  sx={{ 
                    flexDirection: 'column',
                    py: 2
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <EditIcon sx={{ mb: 0.5 }} />
                    <Typography variant="caption">Editar</Typography>
                  </Box>
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={() => setCloneDialog({ open: true, newName: `${template.name} (Copia)` })}
                  fullWidth
                  sx={{ 
                    flexDirection: 'column',
                    py: 2
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <CloneIcon sx={{ mb: 0.5 }} />
                    <Typography variant="caption">Clonar</Typography>
                  </Box>
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={handleToggleStatus}
                  color={template.isActive ? 'inherit' : 'success'}
                  fullWidth
                  sx={{ 
                    flexDirection: 'column',
                    py: 2
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {template.isActive ? <InactiveIcon sx={{ mb: 0.5 }} /> : <ActiveIcon sx={{ mb: 0.5 }} />}
                    <Typography variant="caption">
                      {template.isActive ? 'Desactivar' : 'Activar'}
                    </Typography>
                  </Box>
                </Button>
                
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setDeleteDialog(true)}
                  fullWidth
                  sx={{ 
                    flexDirection: 'column',
                    py: 2
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <DeleteIcon sx={{ mb: 0.5 }} />
                    <Typography variant="caption">Eliminar</Typography>
                  </Box>
                </Button>
              </Box>
            ) : (
              // Desktop view - horizontal row
              <Stack 
                direction="row" 
                spacing={1}
              >
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/work-permits/templates/${template._id}/edit`)}
                >
                  Editar
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CloneIcon />}
                  onClick={() => setCloneDialog({ open: true, newName: `${template.name} (Copia)` })}
                >
                  Clonar
                </Button>
                <Button
                  variant="outlined"
                  startIcon={template.isActive ? <InactiveIcon /> : <ActiveIcon />}
                  onClick={handleToggleStatus}
                  color={template.isActive ? 'inherit' : 'success'}
                >
                  {template.isActive ? 'Desactivar' : 'Activar'}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteDialog(true)}
                >
                  Eliminar
                </Button>
              </Stack>
            )}
          </Box>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider', 
        mb: 3,
        mx: { xs: -2, sm: 0 },
        px: { xs: 2, sm: 0 }
      }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            '& .MuiTab-root': {
              minHeight: { xs: 48, sm: 64 },
              fontSize: { xs: '0.875rem', sm: '0.875rem' },
              px: { xs: 2, sm: 3 },
              py: { xs: 1, sm: 1.5 },
              minWidth: { xs: 'auto', sm: 160 }
            },
            '& .MuiTabs-scrollButtons': {
              '&.Mui-disabled': {
                opacity: 0.3
              }
            },
            '& .MuiTab-iconWrapper': {
              mb: { xs: 0, sm: 0.5 }
            }
          }}
        >
          <Tab 
            icon={<InfoIcon fontSize={isXs ? "small" : "medium"} />} 
            label="Información General" 
            iconPosition="start"
          />
          <Tab 
            icon={<FormIcon fontSize={isXs ? "small" : "medium"} />} 
            label="Formularios" 
            iconPosition="start"
          />
          <Tab 
            icon={<DocumentIcon fontSize={isXs ? "small" : "medium"} />} 
            label="Documentos" 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Box>
          {/* Basic Info */}
          <Box>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <InfoIcon color="primary" />
                  <Typography variant={isXs ? "subtitle1" : "h6"}>Información General</Typography>
                </Box>
                
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <TemplateIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Nombre"
                      secondary={template.name}
                    />
                  </ListItem>
                  
                  {template.description && (
                    <ListItem>
                      <ListItemIcon>
                        <TemplateIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Descripción"
                        secondary={template.description}
                      />
                    </ListItem>
                  )}
                  
                  <ListItem>
                    <ListItemIcon>
                      {getCategoryIcon(template.category)}
                    </ListItemIcon>
                    <ListItemText
                      primary="Categoría"
                      secondary={categoryLabels[template.category] || template.category}
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <DateIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Fecha de Creación"
                      secondary={new Date(template.createdAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <UpdateIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Última Actualización"
                      secondary={new Date(template.updatedAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <StatsIcon color="primary" />
                  <Typography variant={isXs ? "subtitle1" : "h6"}>Estadísticas</Typography>
                </Box>

                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant={isXs ? "h5" : "h4"} color="primary">
                    {template.requiredForms?.length || 0}
                  </Typography>
                  <Typography variant={isXs ? "caption" : "body2"} color="text.secondary">
                    Formularios
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <VerifiedIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Estado"
                      secondary={template.isActive ? 'Activo' : 'Inactivo'}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Box>

          {/* Additional Information */}
          <Box>
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <InfoIcon color="primary" />
                  <Typography variant="h6">Información Adicional</Typography>
                </Box>

                <Box>
                  <Box>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <FormIcon color="action" />
                        <Typography variant="subtitle2" color="text.secondary">
                          Formularios Requeridos
                        </Typography>
                      </Box>
                      <Typography variant="h5">
                        {template.requiredForms?.filter(f => f.mandatory).length || 0} obligatorios
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        De {template.requiredForms?.length || 0} formularios totales
                      </Typography>
                    </Paper>
                  </Box>

                  <Box>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <DocumentIcon color="action" />
                        <Typography variant="subtitle2" color="text.secondary">
                          Documentos
                        </Typography>
                      </Box>
                      <Typography variant="h5">
                        {documents.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Archivos asociados
                      </Typography>
                    </Paper>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          <Card>
            <CardContent>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between', 
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: { xs: 2, sm: 0 },
                mb: 3 
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <FormIcon color="primary" />
                  <Typography variant={isXs ? "subtitle1" : "h6"}>Formularios del Template</Typography>
                  <Chip 
                    label={`${templateForms.length}`} 
                    size="small" 
                    color="primary"
                  />
                </Box>
                <Button
                  variant="contained"
                  startIcon={!isXs && <AddIcon />}
                  onClick={() => setAddFormDialog(true)}
                  size={isXs ? 'small' : 'medium'}
                  fullWidth={isXs}
                >
                  {isXs ? 'Agregar' : 'Agregar Formulario'}
                </Button>
              </Box>
              
              {formsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : templateForms.length === 0 ? (
                <Alert severity="info" icon={<InfoIcon />}>
                  No hay formularios asociados a este template. Agrega formularios del catálogo para completar la configuración.
                </Alert>
              ) : (
                <Box>
                  <List>
                    {templateForms.sort((a, b) => a.order - b.order).map((templateForm, index) => {
                      const formDetails = getFormDetails(templateForm.form);
                      const isEditing = editingForm?.form === templateForm.form;

                      return (
                        <Fragment key={index}>
                          <ListItem
                            sx={{
                              bgcolor: isEditing ? 'action.selected' : 'transparent',
                              borderRadius: 1
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'grey.200' }}>
                                <Badge badgeContent={templateForm.order} color="primary">
                                  <FormIcon />
                                </Badge>
                              </Avatar>
                            </ListItemAvatar>
                            
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="subtitle1">
                                    {formDetails?.name || 'Formulario no encontrado'}
                                  </Typography>
                                  {formDetails?.code && (
                                    <Chip
                                      label={formDetails.code}
                                      size="small"
                                      variant="outlined"
                                    />
                                  )}
                                  <Chip
                                    label={templateForm.mandatory ? 'Obligatorio' : 'Opcional'}
                                    size="small"
                                    color={templateForm.mandatory ? 'error' : 'default'}
                                    icon={templateForm.mandatory ? <RequiredIcon /> : undefined}
                                  />
                                  {formDetails && (
                                    <Chip
                                      label={formCategoryLabels[formDetails.category] || formDetails.category}
                                      size="small"
                                      color={getFormCategoryColor(formDetails.category)}
                                      variant="outlined"
                                    />
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box>
                                  {formDetails?.description && (
                                    <Typography variant="body2" color="text.secondary">
                                      {formDetails.description}
                                    </Typography>
                                  )}
                                  {formDetails?.metadata && (
                                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                                      {formDetails.metadata.estimatedCompletionTime && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                          <TimerIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                          <Typography variant="caption" color="text.secondary">
                                            {formDetails.metadata.estimatedCompletionTime} min
                                          </Typography>
                                        </Box>
                                      )}
                                      {formDetails.metadata.requiresApproval && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                          <SecurityIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                          <Typography variant="caption" color="text.secondary">
                                            Requiere aprobación
                                          </Typography>
                                        </Box>
                                      )}
                                      {formDetails.metadata.expirationDays && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                          <DateIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                          <Typography variant="caption" color="text.secondary">
                                            Vence en {formDetails.metadata.expirationDays} días
                                          </Typography>
                                        </Box>
                                      )}
                                    </Box>
                                  )}
                                  {templateForm.condition && (
                                    <Alert severity="info" sx={{ mt: 1, py: 0 }}>
                                      <Typography variant="caption">
                                        Condicional: {templateForm.condition.field} {templateForm.condition.operator} {templateForm.condition.value}
                                      </Typography>
                                    </Alert>
                                  )}
                                </Box>
                              }
                            />

                            {isEditing ? (
                              <Box sx={{ 
                                display: 'flex', 
                                gap: 1,
                                flexDirection: { xs: 'column', sm: 'row' }
                              }}>
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={!isXs && <SaveIcon />}
                                  onClick={() => editingForm && handleUpdateForm(editingForm)}
                                  fullWidth={isXs}
                                >
                                  {isXs ? <SaveIcon fontSize="small" /> : 'Guardar'}
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => setEditingForm(null)}
                                  fullWidth={isXs}
                                >
                                  Cancelar
                                </Button>
                              </Box>
                            ) : (
                                <Box sx={{ 
                                  display: 'flex', 
                                  gap: 0.5,
                                  flexDirection: { xs: 'column', sm: 'row' }
                                }}>
                                  {!isXs && (
                                    <>
                                      {index > 0 && (
                                        <Tooltip title="Mover arriba">
                                          <IconButton
                                            size="small"
                                            onClick={() => handleReorderForm(index, index - 1)}
                                          >
                                            <MoveUpIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                      {index < templateForms.length - 1 && (
                                        <Tooltip title="Mover abajo">
                                          <IconButton
                                            size="small"
                                            onClick={() => handleReorderForm(index, index + 1)}
                                          >
                                            <MoveDownIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                    </>
                                  )}
                                  <Tooltip title="Editar">
                                    <IconButton
                                      size="small"
                                      onClick={() => setEditingForm(templateForm)}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Remover">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => setFormToRemove(templateForm)}
                                    >
                                      <RemoveIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                            )}
                          </ListItem>

                          {/* Edit form */}
                          {isEditing && (
                            <Box sx={{ 
                              pl: { xs: 2, sm: 9 }, 
                              pr: 2, 
                              pb: 2 
                            }}>
                              <Box sx={{ 
                                display: 'grid', 
                                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                                gap: 2 
                              }}>
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={editingForm?.mandatory || false}
                                      onChange={(e) => setEditingForm(editingForm ? {
                                        ...editingForm,
                                        mandatory: e.target.checked
                                      } : null)}
                                      size={isXs ? "small" : "medium"}
                                    />
                                  }
                                  label="Formulario obligatorio"
                                />
                                <TextField
                                  fullWidth
                                  type="number"
                                  label="Orden"
                                  size={isXs ? "small" : "medium"}
                                  value={editingForm?.order || 1}
                                  onChange={(e) => setEditingForm(editingForm ? {
                                    ...editingForm,
                                    order: parseInt(e.target.value) || 1
                                  } : null)}
                                  slotProps={{ 
                                    htmlInput: { min: 1, max: templateForms.length }
                                  }}
                                />
                              </Box>
                            </Box>
                          )}

                          {index < templateForms.length - 1 && <Divider />}
                        </Fragment>
                      );
                    })}
                  </List>
                </Box>
              )}

              {/* Form Statistics */}
              {templateForms.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 3 }} />
                  <Typography variant="subtitle2" gutterBottom color="text.secondary">
                    Resumen de Formularios
                  </Typography>
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                    gap: { xs: 1.5, sm: 2 } 
                  }}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant={isXs ? "h5" : "h4"} color="primary">
                        {templateForms.length}
                      </Typography>
                      <Typography variant={isXs ? "caption" : "body2"} color="text.secondary">
                        Total
                      </Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant={isXs ? "h5" : "h4"} color="error">
                        {templateForms.filter(f => f.mandatory).length}
                      </Typography>
                      <Typography variant={isXs ? "caption" : "body2"} color="text.secondary">
                        Obligatorios
                      </Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant={isXs ? "h5" : "h4"} color="text.secondary">
                        {templateForms.filter(f => !f.mandatory).length}
                      </Typography>
                      <Typography variant={isXs ? "caption" : "body2"} color="text.secondary">
                        Opcionales
                      </Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant={isXs ? "h5" : "h4"} color="warning.main">
                        {templateForms.filter(f => f.condition).length}
                      </Typography>
                      <Typography variant={isXs ? "caption" : "body2"} color="text.secondary">
                        Condicionales
                      </Typography>
                    </Paper>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          <Card>
            <CardContent>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between', 
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: { xs: 2, sm: 0 },
                mb: 3 
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <DocumentIcon color="primary" />
                  <Typography variant={isXs ? "subtitle1" : "h6"}>Documentos del Template</Typography>
                  <Chip 
                    label={`${documents.length}`} 
                    size="small" 
                    color="primary"
                  />
                </Box>
                <Button
                  variant="contained"
                  startIcon={!isXs && <UploadIcon />}
                  onClick={() => setUploadDialog(true)}
                  size={isXs ? 'small' : 'medium'}
                  fullWidth={isXs}
                >
                  {isXs ? 'Subir' : 'Subir Documento'}
                </Button>
              </Box>
              
              {documentsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : documents.length === 0 ? (
                <Alert severity="info" icon={<InfoIcon />}>
                  No hay documentos asociados a este template. Sube documentos de ejemplo, instrucciones o requisitos para facilitar el uso del template.
                </Alert>
              ) : (
                <Box>
                  {/* Document type summary */}
                  <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {['requirement', 'example', 'instruction', 'other'].map((type) => {
                      const count = documents.filter(d => d.documentType === type).length;
                      if (count === 0) return null;
                      
                      return (
                        <Chip
                          key={type}
                          label={`${getDocumentTypeLabel(type)} (${count})`}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      );
                    })}
                  </Box>

                  {isMobile ? (
                    // Mobile view - Cards
                    <Stack spacing={2}>
                      {documents.map((doc) => (
                        <Card key={doc._id} variant="outlined">
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                              <Avatar sx={{ bgcolor: 'grey.200' }}>
                                {getDocumentIcon(doc.mimetype)}
                              </Avatar>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="subtitle2" noWrap>
                                  {doc.originalName}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  {doc.description || 'Sin descripción'}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                                  <Chip 
                                    label={getDocumentTypeLabel(doc.documentType)} 
                                    size="small" 
                                    color="primary"
                                    variant="outlined"
                                  />
                                  <Chip 
                                    label={`${(doc.size / 1024).toFixed(1)} KB`} 
                                    size="small" 
                                    variant="outlined"
                                  />
                                </Box>
                                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                                  Subido por {doc.uploadedBy.nombre} {doc.uploadedBy.apellido}
                                  <br />
                                  {new Date(doc.uploadedAt).toLocaleDateString('es-ES')}
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                              <Button
                                size="small"
                                startIcon={<ViewIcon />}
                                onClick={() => handleViewDocument(doc)}
                              >
                                Ver
                              </Button>
                              <Button
                                size="small"
                                startIcon={<DownloadIcon />}
                                onClick={() => handleDownloadDocument(doc)}
                              >
                                Descargar
                              </Button>
                              <Button
                                size="small"
                                color="error"
                                startIcon={<DeleteOutlineIcon />}
                                onClick={() => setDocumentToDelete(doc)}
                              >
                                Eliminar
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  ) : (
                    // Desktop view - Table
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Documento</TableCell>
                            <TableCell>Tipo</TableCell>
                            <TableCell>Tamaño</TableCell>
                            <TableCell>Subido por</TableCell>
                            <TableCell>Fecha</TableCell>
                            <TableCell align="right">Acciones</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {documents.map((doc) => (
                            <TableRow key={doc._id} hover>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {getDocumentIcon(doc.mimetype)}
                                  <Box>
                                    <Typography variant="body2">
                                      {doc.originalName}
                                    </Typography>
                                    {doc.description && (
                                      <Typography variant="caption" color="textSecondary">
                                        {doc.description}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={getDocumentTypeLabel(doc.documentType)} 
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>{(doc.size / 1024).toFixed(1)} KB</TableCell>
                              <TableCell>
                                {doc.uploadedBy.nombre} {doc.uploadedBy.apellido}
                              </TableCell>
                              <TableCell>
                                {new Date(doc.uploadedAt).toLocaleDateString('es-ES')}
                              </TableCell>
                              <TableCell align="right">
                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                  <Tooltip title="Ver">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleViewDocument(doc)}
                                    >
                                      <ViewIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Descargar">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDownloadDocument(doc)}
                                    >
                                      <DownloadIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Eliminar">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => setDocumentToDelete(doc)}
                                    >
                                      <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}

                  {/* Total size */}
                  <Box sx={{ mt: 2, textAlign: 'right' }}>
                    <Typography variant="body2" color="text.secondary">
                      Tamaño total: {(documents.reduce((acc, doc) => acc + doc.size, 0) / 1024).toFixed(1)} KB
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Delete Dialog */}
      <Dialog 
        open={deleteDialog} 
        onClose={() => setDeleteDialog(false)}
        fullScreen={isXs}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea eliminar el template "{template.name}"?
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clone Dialog */}
      <Dialog 
        open={cloneDialog.open} 
        onClose={() => setCloneDialog({ ...cloneDialog, open: false })}
        fullScreen={isXs}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Clonar Template</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Ingrese el nombre para el nuevo template clonado
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            label="Nombre del nuevo template"
            value={cloneDialog.newName}
            onChange={(e) => setCloneDialog({ ...cloneDialog, newName: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloneDialog({ ...cloneDialog, open: false })}>
            Cancelar
          </Button>
          <Button 
            onClick={handleClone} 
            variant="contained"
            disabled={!cloneDialog.newName.trim()}
          >
            Clonar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Forms Dialog */}
      <Dialog 
        open={addFormDialog} 
        onClose={() => {
          setAddFormDialog(false);
          setSelectedFormsToAdd([]);
          setFormSearchTerm('');
          setSelectedFormCategory('');
        }}
        maxWidth="md"
        fullWidth
        fullScreen={isXs}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormIcon color="primary" />
            <Typography variant="h6">Agregar Formularios al Template</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Search and filters */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 2,
              mb: 2 
            }}>
              <TextField
                fullWidth
                label="Buscar formularios"
                value={formSearchTerm}
                onChange={(e) => setFormSearchTerm(e.target.value)}
                size={isXs ? "small" : "medium"}
                slotProps={{
                  input: {
                    startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                  }
                }}
              />
              <FormControl fullWidth size={isXs ? "small" : "medium"}>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={selectedFormCategory}
                  onChange={(e) => setSelectedFormCategory(e.target.value)}
                  label="Categoría"
                >
                  <MenuItem value="">
                    <em>Todas las categorías</em>
                  </MenuItem>
                  {formCategories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {formCategoryLabels[cat] || cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Available forms */}
            {loadingAvailableForms ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredAvailableForms.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                {availableForms.length === 0 
                  ? 'No hay formularios activos disponibles'
                  : formSearchTerm || selectedFormCategory
                    ? 'No se encontraron formularios que coincidan con los filtros'
                    : 'Todos los formularios ya han sido agregados a este template'
                }
              </Alert>
            ) : (
              <Box>
                {/* Summary */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {filteredAvailableForms.length} formulario{filteredAvailableForms.length !== 1 ? 's' : ''} disponible{filteredAvailableForms.length !== 1 ? 's' : ''}
                  </Typography>
                  {selectedFormsToAdd.length > 0 && (
                    <Chip
                      label={`${selectedFormsToAdd.length} seleccionado${selectedFormsToAdd.length !== 1 ? 's' : ''}`}
                      color="primary"
                      size="small"
                    />
                  )}
                </Box>
                
                {/* Forms list */}
                <Box sx={{ maxHeight: 400, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <List sx={{ py: 0 }}>
                    {filteredAvailableForms.map((form, index) => (
                      <Fragment key={form._id}>
                        <ListItem 
                          sx={{ 
                            py: 2,
                            '&:hover': { bgcolor: 'action.hover' },
                            bgcolor: selectedFormsToAdd.includes(form._id) ? 'action.selected' : 'transparent'
                          }}
                        >
                          <Checkbox
                            edge="start"
                            checked={selectedFormsToAdd.includes(form._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFormsToAdd([...selectedFormsToAdd, form._id]);
                              } else {
                                setSelectedFormsToAdd(selectedFormsToAdd.filter(id => id !== form._id));
                              }
                            }}
                            sx={{ mr: 2 }}
                          />
                          <ListItemText
                            primary={
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                    {form.name}
                                  </Typography>
                                  {form.code && (
                                    <Chip 
                                      label={form.code} 
                                      size="small" 
                                      variant="outlined"
                                      sx={{ height: 20 }}
                                    />
                                  )}
                                </Box>
                                <Chip
                                  label={formCategoryLabels[form.category] || form.category}
                                  size="small"
                                  color={getFormCategoryColor(form.category)}
                                  sx={{ mb: 0.5 }}
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                {form.description && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    {form.description}
                                  </Typography>
                                )}
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    {form.sections?.length || 0} secciones
                                  </Typography>
                                  {form.sections && (
                                    <Typography variant="caption" color="text.secondary">
                                      • {form.sections.reduce((acc, s) => acc + (s.fields?.length || 0), 0)} campos
                                    </Typography>
                                  )}
                                  {form.metadata?.estimatedCompletionTime && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <TimerIcon sx={{ fontSize: 14 }} color="action" />
                                      <Typography variant="caption" color="text.secondary">
                                        {form.metadata.estimatedCompletionTime} min
                                      </Typography>
                                    </Box>
                                  )}
                                  {form.metadata?.requiresApproval && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <VerifiedIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                                      <Typography variant="caption" color="warning.main">
                                        Requiere aprobación
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < filteredAvailableForms.length - 1 && <Divider />}
                      </Fragment>
                    ))}
                  </List>
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setAddFormDialog(false);
              setSelectedFormsToAdd([]);
              setFormSearchTerm('');
              setSelectedFormCategory('');
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleAddForms}
            variant="contained"
            disabled={selectedFormsToAdd.length === 0 || addingForms}
            startIcon={addingForms ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
          >
            {addingForms 
              ? 'Agregando...'
              : `Agregar ${selectedFormsToAdd.length > 0 ? `(${selectedFormsToAdd.length})` : ''}`
            }
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog 
        open={uploadDialog} 
        onClose={() => setUploadDialog(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isXs}
      >
        <DialogTitle>Subir Documento</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Descripción"
              value={uploadData.description}
              onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={2}
              helperText="Describe brevemente el contenido del documento"
            />
            
            <FormControl fullWidth>
              <InputLabel>Tipo de Documento</InputLabel>
              <Select
                value={uploadData.documentType}
                onChange={(e) => setUploadData(prev => ({ ...prev, documentType: e.target.value as any }))}
                label="Tipo de Documento"
              >
                <MenuItem value="requirement">Requisito</MenuItem>
                <MenuItem value="example">Ejemplo</MenuItem>
                <MenuItem value="instruction">Instrucción</MenuItem>
                <MenuItem value="other">Otro</MenuItem>
              </Select>
              <FormHelperText>Selecciona el tipo de documento</FormHelperText>
            </FormControl>
            
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              fullWidth
              sx={{ py: 2 }}
            >
              {uploadData.file ? uploadData.file.name : 'Seleccionar Archivo'}
              <input
                type="file"
                hidden
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setUploadData(prev => ({ ...prev, file }));
                  }
                }}
              />
            </Button>
            
            {uploadData.file && (
              <Alert severity="info" sx={{ py: 0.5 }}>
                <Typography variant="caption">
                  Archivo: {uploadData.file.name} ({(uploadData.file.size / 1024).toFixed(1)} KB)
                </Typography>
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setUploadDialog(false);
            setUploadData({
              description: '',
              documentType: 'requirement',
              file: null
            });
          }}>
            Cancelar
          </Button>
          <Button 
            onClick={handleUploadDocument} 
            variant="contained"
            disabled={!uploadData.file}
          >
            Subir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Document Dialog */}
      <Dialog 
        open={!!documentToDelete} 
        onClose={() => setDocumentToDelete(null)}
        fullScreen={isXs}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea eliminar el documento "{documentToDelete?.originalName}"?
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocumentToDelete(null)}>
            Cancelar
          </Button>
          <Button onClick={handleDeleteDocument} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Form Dialog */}
      <Dialog 
        open={!!formToRemove} 
        onClose={() => setFormToRemove(null)}
        fullScreen={isXs}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea remover el formulario "{getFormDetails(formToRemove?.form)?.name}" del template?
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormToRemove(null)}>
            Cancelar
          </Button>
          <Button onClick={handleRemoveForm} color="error" variant="contained">
            Remover
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          severity={notification.severity}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};