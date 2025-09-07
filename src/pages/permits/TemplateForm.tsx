import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  Alert,
  Breadcrumbs,
  Link,
  Chip,
  Autocomplete,
  Card,
  CardContent,
  Tabs,
  Tab,
  FormControlLabel,
  Checkbox,
  Switch,
  FormGroup,
  FormLabel,
  CircularProgress,
  Snackbar,
  IconButton,
  Select,
  MenuItem,
  InputLabel,
  FormHelperText,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { workPermitTemplateApi, WorkPermitTemplateFormData, TemplateField } from '../../services/workPermitTemplateApi';
import { formsApi, Form } from '../../services/formsApi';

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
      id={`template-tabpanel-${index}`}
      aria-labelledby={`template-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const categories = [
  { value: 'trabajo_altura', label: 'Trabajo en Altura' },
  { value: 'espacio_confinado', label: 'Espacios Confinados' },
  { value: 'trabajo_caliente', label: 'Trabajo en Caliente' },
  { value: 'excavacion', label: 'Excavaciones' },
  { value: 'electrico', label: 'Trabajo Eléctrico' },
  { value: 'quimico', label: 'Químicos Peligrosos' },
  { value: 'izaje', label: 'Izaje y Grúas' },
  { value: 'demolicion', label: 'Demolición' },
  { value: 'general', label: 'General' },
  { value: 'otro', label: 'Otros' }
];

const commonRisks = [
  'Riesgo eléctrico',
  'Trabajo en altura',
  'Espacios confinados',
  'Caída en altura',
  'Golpes por objetos',
  'Cortes',
  'Quemaduras',
  'Inhalación de humos',
  'Incendio',
  'Asfixia',
  'Intoxicación',
  'Derrumbe',
  'Caída de objetos',
  'Electrocución',
  'Ruido excesivo',
  'Exposición a químicos',
  'Radiación',
  'Vibraciones'
];

const commonTools = [
  'Multímetro',
  'Escalera',
  'Herramientas aisladas',
  'Andamios',
  'Arnés de seguridad',
  'Equipo de soldadura',
  'Herramientas eléctricas',
  'Maquinaria pesada',
  'Detector de gases',
  'Equipo de rescate',
  'Ventiladores',
  'Extintores',
  'Grúa',
  'Montacargas',
  'Taladros',
  'Cortadoras',
  'Compresores'
];

const commonPPE = [
  'Casco',
  'Guantes dieléctricos',
  'Arnés de seguridad',
  'Botas de seguridad',
  'Chaleco reflectivo',
  'Gafas de seguridad',
  'Máscara de soldar',
  'Protección auditiva',
  'Respirador',
  'Equipo autónomo',
  'Delantal de cuero',
  'Rodilleras',
  'Protección facial'
];

const safetyControlsOptions = [
  'Bloqueo y Etiquetado (LOTO)',
  'Entrada a Espacios Confinados',
  'Permiso de Trabajo en Caliente',
  'Trabajo en Altura',
  'Trabajo Eléctrico',
  'Excavación',
  'Manejo de Químicos'
];

interface FormSelection {
  form: string;
  mandatory: boolean;
  order: number;
  condition?: {
    field: string;
    operator: string;
    value: any;
  };
}

interface TemplateFormData extends Omit<WorkPermitTemplateFormData, 'safetyControls'> {
  identifiedRisks: string[];
  toolsToUse: string[];
  requiredPPE: string[];
  safetyControls: string[];
  requiredDocuments: {
    name: string;
    required: boolean;
    description?: string;
  }[];
  selectedFormTemplates: FormSelection[]; // Formularios seleccionados con configuración
  checklistItems: {
    section: string;
    items: {
      text: string;
      required: boolean;
    }[];
  }[];
  location?: string;
}

const initialFormData: TemplateFormData = {
  name: '',
  description: '',
  category: '',
  fields: [],
  identifiedRisks: [],
  toolsToUse: [],
  requiredPPE: [],
  safetyControls: [],
  requiredDocuments: [
    { name: 'ATS (Análisis de Trabajo Seguro)', required: true },
    { name: 'Certificado de aptitud médica', required: false },
    { name: 'Certificación de equipos', required: false }
  ],
  selectedFormTemplates: [],
  checklistItems: [
    {
      section: 'Verificación Pre-trabajo',
      items: [
        { text: 'Área de trabajo señalizada y delimitada', required: true },
        { text: 'Personal con EPP completo', required: true },
        { text: 'Herramientas en buen estado', required: true }
      ]
    },
    {
      section: 'Control de Riesgos',
      items: [
        { text: 'Riesgos identificados y comunicados', required: true },
        { text: 'Medidas de control implementadas', required: true }
      ]
    }
  ]
};

export const TemplateForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState<TemplateFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [availableForms, setAvailableForms] = useState<Form[]>([]);
  const [loadingForms, setLoadingForms] = useState(false);
  
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
    details?: string;
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error' | 'warning' | 'info', details?: string) => {
    setSnackbar({ open: true, message, severity, details });
  }, []);

  const loadTemplate = useCallback(async (templateId: string) => {
    try {
      setLoadingData(true);
      const [templateResponse, formsResponse] = await Promise.all([
        workPermitTemplateApi.getTemplateById(templateId),
        workPermitTemplateApi.getTemplateForms(templateId)
      ]);
      
      if (templateResponse.success && templateResponse.data) {
        const template = templateResponse.data;
        
        // Extraer datos de los campos predefinidos
        const extractedData: Partial<TemplateFormData> = {
          name: template.name,
          description: template.description,
          category: template.category,
          fields: template.fields || [],
          identifiedRisks: [],
          toolsToUse: [],
          requiredPPE: [],
          safetyControls: [],
          requiredDocuments: initialFormData.requiredDocuments,
          selectedFormTemplates: [],
          checklistItems: initialFormData.checklistItems
        };
        
        // Extraer información de campos predefinidos
        template.fields?.forEach((field: TemplateField) => {
          if (field.name === 'identifiedRisks' && field.defaultValue) {
            extractedData.identifiedRisks = field.defaultValue;
          } else if (field.name === 'toolsToUse' && field.defaultValue) {
            extractedData.toolsToUse = field.defaultValue;
          } else if (field.name === 'requiredPPE' && field.defaultValue) {
            extractedData.requiredPPE = field.defaultValue;
          } else if (field.name === 'safetyControls' && field.defaultValue) {
            extractedData.safetyControls = field.defaultValue;
          } else if (field.name === 'requiredDocuments' && field.defaultValue) {
            // Reconstruir el array de documentos desde los nombres guardados
            const savedDocNames = field.defaultValue as string[];
            extractedData.requiredDocuments = initialFormData.requiredDocuments.map(doc => ({
              ...doc,
              required: savedDocNames.includes(doc.name)
            }));
            // Añadir documentos adicionales que no estén en la lista inicial
            savedDocNames.forEach(docName => {
              if (!extractedData.requiredDocuments!.find(d => d.name === docName)) {
                extractedData.requiredDocuments!.push({
                  name: docName,
                  required: true
                });
              }
            });
          } else if (field.name === 'checklistItems' && field.defaultValue) {
            // Parsear el JSON del checklist guardado
            try {
              extractedData.checklistItems = JSON.parse(field.defaultValue as string);
            } catch (e) {
              console.error('Error parsing checklist items:', e);
              extractedData.checklistItems = initialFormData.checklistItems;
            }
          }
        });
        
        // Cargar formularios asociados si existen
        if (formsResponse.success && formsResponse.data) {
          extractedData.selectedFormTemplates = formsResponse.data;
        }
        
        setFormData({ ...initialFormData, ...extractedData });
        showSnackbar('Template cargado', 'info', 'Se han cargado los datos del template para edición.');
      }
    } catch (error) {
      console.error('Error loading template:', error);
      setSubmitError('Error al cargar el template');
      showSnackbar('Error al cargar el template', 'error');
    } finally {
      setLoadingData(false);
    }
  }, [showSnackbar]);

  const loadFormTemplates = useCallback(async () => {
    try {
      setLoadingForms(true);
      const response = await formsApi.getAllForms({ isActive: true });
      if (response.success && response.data) {
        setAvailableForms(response.data);
      }
    } catch (error) {
      console.error('Error loading form templates:', error);
      showSnackbar('Error al cargar los formularios disponibles', 'error');
    } finally {
      setLoadingForms(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    loadFormTemplates();
    if (isEdit && id) {
      loadTemplate(id);
    }
  }, [isEdit, id, loadFormTemplates, loadTemplate]);

  const handleInputChange = (field: keyof TemplateFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const validateTab = (tab: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (tab) {
      case 0: // Información General
        if (!formData.name.trim()) newErrors.name = 'El nombre es obligatorio';
        if (!formData.category) newErrors.category = 'Debe seleccionar una categoría';
        if (formData.identifiedRisks.length === 0) newErrors.identifiedRisks = 'Debe identificar al menos un riesgo';
        if (formData.toolsToUse.length === 0) newErrors.toolsToUse = 'Debe especificar al menos una herramienta';
        if (formData.requiredPPE.length === 0) newErrors.requiredPPE = 'Debe seleccionar al menos un EPP';
        if (formData.safetyControls.length === 0) newErrors.safetyControls = 'Debe seleccionar al menos un control de seguridad';
        break;
      case 1: // Formulario
        // Los formularios son opcionales, no se requiere validación
        // Los templates pueden no tener formularios asociados
        break;
      case 2: // Documentos
        // Los documentos son opcionales, no se requiere validación
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddDocument = () => {
    setFormData(prev => ({
      ...prev,
      requiredDocuments: [
        ...prev.requiredDocuments,
        { name: '', required: false }
      ]
    }));
  };

  const handleRemoveDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requiredDocuments: prev.requiredDocuments.filter((_, i) => i !== index)
    }));
  };

  const handleDocumentChange = (index: number, field: 'name' | 'required' | 'description', value: any) => {
    setFormData(prev => ({
      ...prev,
      requiredDocuments: prev.requiredDocuments.map((doc, i) => 
        i === index ? { ...doc, [field]: value } : doc
      )
    }));
  };

  // const handleAddChecklistSection = () => {
  //   setFormData(prev => ({
  //     ...prev,
  //     checklistItems: [
  //       ...prev.checklistItems,
  //       { section: '', items: [] }
  //     ]
  //   }));
  // };

  const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleSubmit = async () => {
    // Validar todas las tabs
    let hasErrors = false;
    for (let i = 0; i <= 2; i++) {
      if (!validateTab(i)) {
        hasErrors = true;
        setActiveTab(i); // Ir a la primera tab con errores
        break;
      }
    }
    
    if (hasErrors) return;

    setLoading(true);
    setSubmitError('');

    try {
      // Construir campos del template
      // Solo crear fields que son configurables en el template
      const templateFields: TemplateField[] = [
        {
          name: 'workDescription',
          type: 'text',
          label: 'Descripción del Trabajo',
          required: true
        },
        {
          name: 'location',
          type: 'text',
          label: 'Ubicación',
          required: true
        }
      ];

      const submitData: WorkPermitTemplateFormData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        fields: templateFields,
        isActive: true,
        requiredForms: formData.selectedFormTemplates,
        workDescription: formData.workDescription,
        defaultLocation: formData.location || formData.defaultLocation,
        identifiedRisks: formData.identifiedRisks,
        toolsToUse: formData.toolsToUse,
        requiredPPE: formData.requiredPPE,
        safetyControls: formData.safetyControls.map(control => ({
          item: control,
          description: control,
          checked: true
        })),
        requiredApprovals: formData.requiredApprovals,
        requiredDocuments: formData.requiredDocuments.length > 0 ? formData.requiredDocuments : undefined
      };
      
      // Debug: Log completo de datos a enviar
      console.log('=== Datos del Template a Crear/Actualizar ===');
      console.log('Tab 1 - Información General:', {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        identifiedRisks: formData.identifiedRisks,
        toolsToUse: formData.toolsToUse,
        requiredPPE: formData.requiredPPE,
        safetyControls: formData.safetyControls
      });
      console.log('Tab 2 - Formularios:', {
        selectedFormTemplates: formData.selectedFormTemplates
      });
      console.log('Tab 3 - Documentos:', {
        requiredDocuments: formData.requiredDocuments,
        requiredApprovals: formData.requiredApprovals
      });
      console.log('Datos finales a enviar:', submitData);
      console.log('JSON stringified:', JSON.stringify(submitData, null, 2));

      let response;
      if (isEdit && id) {
        response = await workPermitTemplateApi.updateTemplate(id, submitData);
      } else {
        response = await workPermitTemplateApi.createTemplate(submitData);
      }
      
      // Si se creó/actualizó exitosamente, procesar los datos adicionales
      if (response.success && response.data) {
        // const templateId = response.data._id;
        let allSuccessful = true;
        
        // Los formularios ahora se envían como parte del template principal
        // ya no es necesario hacer una llamada separada
        
        // 2. TODO: Guardar documentos requeridos (cuando se implemente el endpoint)
        // Los documentos requeridos se están guardando como parte de los campos
        // pero podrían tener su propia tabla/endpoint en el futuro
        
        // 3. TODO: Guardar checklist items (cuando se implemente el endpoint)
        // Los checklist items se están guardando como JSON en los campos
        // pero podrían tener su propia tabla/endpoint en el futuro
        
        if (!allSuccessful) {
          showSnackbar(
            isEdit 
              ? 'Template actualizado con algunas advertencias' 
              : 'Template creado con algunas advertencias',
            'warning'
          );
        }
      }

      if (response.success) {
        showSnackbar(
          isEdit ? 'Template actualizado exitosamente' : 'Template creado exitosamente',
          'success'
        );
        
        setTimeout(() => {
          navigate('/work-permits/templates');
        }, 2000);
      } else {
        throw new Error(response.message || 'Error al procesar el template');
      }
    } catch (error: any) {
      console.error('Error submitting template:', error);
      const errorMessage = error.message || 'Error al procesar el template';
      setSubmitError(errorMessage);
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/work-permits/templates');
  };

  if (loadingData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate('/work-permits/templates')}
          sx={{ textDecoration: 'none' }}
        >
          Catálogo de Templates
        </Link>
        <Typography color="text.primary">
          {isEdit ? 'Editar Template' : 'Nuevo Template'}
        </Typography>
      </Breadcrumbs>

      <Typography variant="h4" gutterBottom>
        {isEdit ? 'Editar Template de Permiso' : 'Crear Nuevo Template de Permiso'}
      </Typography>

      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError('')}>
          {submitError}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Información General" />
          <Tab label="Formulario" />
          <Tab label="Documentos" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                fullWidth
                label="Nombre del Template"
                value={formData.name}
                onChange={handleInputChange('name')}
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth error={!!errors.category}>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  label="Categoría"
                  required
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                  ))}
                </Select>
                {errors.category && <FormHelperText>{errors.category}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Descripción"
                value={formData.description}
                onChange={handleInputChange('description')}
                multiline
                rows={3}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Configuración Predeterminada
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Autocomplete
                multiple
                options={commonRisks}
                value={formData.identifiedRisks}
                onChange={(_, newValue) => {
                  setFormData(prev => ({ ...prev, identifiedRisks: newValue }));
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                      key={option}
                      size="small"
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Riesgos Identificados Predeterminados"
                    error={!!errors.identifiedRisks}
                    helperText={errors.identifiedRisks || 'Estos riesgos se preseleccionarán al usar este template'}
                    required
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Autocomplete
                multiple
                options={commonTools}
                value={formData.toolsToUse}
                onChange={(_, newValue) => {
                  setFormData(prev => ({ ...prev, toolsToUse: newValue }));
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                      key={option}
                      size="small"
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Herramientas Predeterminadas"
                    error={!!errors.toolsToUse}
                    helperText={errors.toolsToUse || 'Estas herramientas se preseleccionarán al usar este template'}
                    required
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Autocomplete
                multiple
                options={commonPPE}
                value={formData.requiredPPE}
                onChange={(_, newValue) => {
                  setFormData(prev => ({ ...prev, requiredPPE: newValue }));
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      color="primary"
                      label={option}
                      {...getTagProps({ index })}
                      key={option}
                      size="small"
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="EPP Requerido Predeterminado"
                    error={!!errors.requiredPPE}
                    helperText={errors.requiredPPE || 'Estos EPPs se preseleccionarán al usar este template'}
                    required
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormControl component="fieldset" error={!!errors.safetyControls}>
                <FormLabel component="legend">Controles de Seguridad Predeterminados</FormLabel>
                <FormGroup>
                  {safetyControlsOptions.map((control) => (
                    <FormControlLabel
                      key={control}
                      control={
                        <Checkbox
                          checked={formData.safetyControls.includes(control)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                safetyControls: [...prev.safetyControls, control]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                safetyControls: prev.safetyControls.filter(c => c !== control)
                              }));
                            }
                          }}
                        />
                      }
                      label={control}
                    />
                  ))}
                </FormGroup>
                {errors.safetyControls && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.safetyControls}
                  </Typography>
                )}
              </FormControl>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Alert severity="info" sx={{ mb: 3 }}>
                Seleccione los formularios que serán requeridos para este tipo de permiso de trabajo
              </Alert>
              
              <Typography variant="h6" sx={{ mb: 2 }}>
                Formularios Disponibles
              </Typography>
              
              <Autocomplete
                multiple
                options={availableForms}
                getOptionLabel={(option) => option.name}
                groupBy={(option) => {
                  // Mapear categorías a español
                  const categoryLabels: Record<string, string> = {
                    'analisis_riesgo': 'Análisis de Riesgo',
                    'verificacion_trabajo': 'Verificación Pre-trabajo',
                    'control_seguridad': 'Control de Seguridad',
                    'equipos_herramientas': 'Equipos y Herramientas',
                    'condiciones_ambientales': 'Condiciones Ambientales',
                    'procedimientos': 'Procedimientos Específicos',
                    'emergencias': 'Emergencias',
                    'otros': 'Otros'
                  };
                  return categoryLabels[option.category] || option.category;
                }}
                value={availableForms.filter(f => 
                  formData.selectedFormTemplates.some(sf => sf.form === f._id)
                )}
                onChange={(_, newValue) => {
                  setFormData(prev => ({
                    ...prev,
                    selectedFormTemplates: newValue.map((form, index) => ({
                      form: form._id,
                      mandatory: true,
                      order: index + 1
                    }))
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Buscar y seleccionar formularios"
                    placeholder="Escriba para buscar formularios..."
                    helperText={`${formData.selectedFormTemplates.length} formulario(s) seleccionado(s)`}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body1" fontWeight="medium">
                          {option.name}
                        </Typography>
                        {option.code && (
                          <Chip label={option.code} size="small" variant="outlined" />
                        )}
                      </Box>
                      {option.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {option.description}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                        {option.sections && (
                          <>
                            <Typography variant="caption" color="text.secondary">
                              {option.sections.length} secciones
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {option.sections.reduce((acc, s) => acc + (s.fields?.length || 0), 0)} campos
                            </Typography>
                          </>
                        )}
                        {option.metadata?.estimatedCompletionTime && (
                          <Typography variant="caption" color="text.secondary">
                            ⏱ {option.metadata.estimatedCompletionTime} min
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                )}
                loading={loadingForms}
                noOptionsText="No hay formularios disponibles"
                sx={{ mb: 4 }}
              />
              
              {formData.selectedFormTemplates.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Formularios Seleccionados ({formData.selectedFormTemplates.length})
                  </Typography>
                  
                  {formData.selectedFormTemplates.map((templateForm, index) => {
                    const form = availableForms.find(f => f._id === templateForm.form);
                    if (!form) return null;
                    
                    return (
                      <Card key={templateForm.form} variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle1" fontWeight="medium">
                                {index + 1}. {form.name}
                              </Typography>
                              {form.description && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                  {form.description}
                                </Typography>
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={templateForm.mandatory}
                                    onChange={(e) => {
                                      setFormData(prev => ({
                                        ...prev,
                                        selectedFormTemplates: prev.selectedFormTemplates.map(sf =>
                                          sf.form === templateForm.form
                                            ? { ...sf, mandatory: e.target.checked }
                                            : sf
                                        )
                                      }));
                                    }}
                                  />
                                }
                                label="Obligatorio"
                              />
                              <IconButton
                                color="error"
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    selectedFormTemplates: prev.selectedFormTemplates
                                      .filter(sf => sf.form !== templateForm.form)
                                      .map((sf, idx) => ({ ...sf, order: idx + 1 }))
                                  }));
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Los formularios marcados como "Obligatorio" deberán ser completados al crear un permiso.
                    Los formularios opcionales podrán ser agregados según sea necesario.
                  </Alert>
                </Box>
              )}
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Documentos Requeridos
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddDocument}
                  size="small"
                >
                  Agregar Documento
                </Button>
              </Box>

              {errors.documents && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errors.documents}
                </Alert>
              )}

              {formData.requiredDocuments.map((doc, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid size={{ xs: 12, md: 5 }}>
                        <TextField
                          fullWidth
                          label="Nombre del Documento"
                          value={doc.name}
                          onChange={(e) => handleDocumentChange(index, 'name', e.target.value)}
                          size="small"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 5 }}>
                        <TextField
                          fullWidth
                          label="Descripción (opcional)"
                          value={doc.description || ''}
                          onChange={(e) => handleDocumentChange(index, 'description', e.target.value)}
                          size="small"
                        />
                      </Grid>
                      <Grid size={{ xs: 6, md: 1 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={doc.required}
                              onChange={(e) => handleDocumentChange(index, 'required', e.target.checked)}
                            />
                          }
                          label="Requerido"
                        />
                      </Grid>
                      <Grid size={{ xs: 6, md: 1 }}>
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveDocument(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}

              <Box sx={{ mt: 3 }}>
                <Alert severity="info">
                  Los documentos marcados como requeridos deberán ser adjuntados obligatoriamente al crear un permiso de trabajo con este template.
                </Alert>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Resumen antes de crear */}
        <Box sx={{ mt: 3, mb: 2 }}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Resumen del Template
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 1 }}>
            <Chip
              icon={<InfoIcon />}
              label={`${formData.identifiedRisks.length} riesgos identificados`}
              size="small"
              variant="outlined"
            />
            <Chip
              icon={<InfoIcon />}
              label={`${formData.toolsToUse.length} herramientas`}
              size="small"
              variant="outlined"
            />
            <Chip
              icon={<InfoIcon />}
              label={`${formData.requiredPPE.length} EPP requeridos`}
              size="small"
              variant="outlined"
            />
            <Chip
              icon={<InfoIcon />}
              label={`${formData.safetyControls.length} controles de seguridad`}
              size="small"
              variant="outlined"
            />
            <Chip
              icon={<InfoIcon />}
              label={`${formData.selectedFormTemplates.length} formularios asociados`}
              size="small"
              variant="outlined"
              color={formData.selectedFormTemplates.length > 0 ? "primary" : "default"}
            />
            <Chip
              icon={<InfoIcon />}
              label={`${formData.requiredDocuments.filter(d => d.required).length} documentos obligatorios`}
              size="small"
              variant="outlined"
              color={formData.requiredDocuments.filter(d => d.required).length > 0 ? "primary" : "default"}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4, gap: 1 }}>
          <Button variant="outlined" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : (isEdit ? 'Actualizar' : 'Crear Template')}
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === 'success' ? 4000 : 6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
          icon={
            snackbar.severity === 'success' ? <CheckCircleIcon /> :
            snackbar.severity === 'error' ? <ErrorIcon /> :
            snackbar.severity === 'warning' ? <WarningIcon /> : undefined
          }
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleCloseSnackbar}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          <Box>
            <Typography variant="body2" component="div" sx={{ fontWeight: 600 }}>
              {snackbar.message}
            </Typography>
            {snackbar.details && (
              <Typography variant="caption" component="div" sx={{ mt: 0.5, opacity: 0.9 }}>
                {snackbar.details}
              </Typography>
            )}
          </Box>
        </Alert>
      </Snackbar>
    </Box>
  );
};