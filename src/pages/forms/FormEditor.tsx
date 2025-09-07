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
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  IconButton,
  CircularProgress,
  Snackbar,
  Select,
  MenuItem,
  InputLabel,
  FormHelperText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormGroup,
  Checkbox as MuiCheckbox,
  FormLabel,
  Chip,
  Autocomplete,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Preview as PreviewIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { formsApi, FormCreateData, FormSection, FormField } from '../../services/formsApi';
import { SignatureField } from '../../components/SignatureField';

const categories = [
  { value: 'analisis_riesgo', label: 'Análisis de Riesgo' },
  { value: 'verificacion_trabajo', label: 'Verificación Pre-trabajo' },
  { value: 'control_seguridad', label: 'Control de Seguridad' },
  { value: 'equipos_herramientas', label: 'Equipos y Herramientas' },
  { value: 'condiciones_ambientales', label: 'Condiciones Ambientales' },
  { value: 'procedimientos', label: 'Procedimientos Específicos' },
  { value: 'emergencias', label: 'Emergencias' },
  { value: 'otros', label: 'Otros' }
];

const workPermitCategories = [
  { value: 'trabajo_altura', label: 'Trabajo en Altura' },
  { value: 'trabajo_caliente', label: 'Trabajo en Caliente' },
  { value: 'espacio_confinado', label: 'Espacio Confinado' },
  { value: 'trabajo_electrico', label: 'Trabajo Eléctrico' },
  { value: 'excavacion', label: 'Excavación' },
  { value: 'izaje', label: 'Izaje y Grúas' },
  { value: 'quimicos', label: 'Manejo de Químicos' },
  { value: 'general', label: 'General' }
];

const fieldTypes = [
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Fecha' },
  { value: 'select', label: 'Selección única' },
  { value: 'multiselect', label: 'Selección múltiple' },
  { value: 'textarea', label: 'Área de texto' },
  { value: 'radio', label: 'Radio buttons' },
  { value: 'signature', label: 'Firma' },
  { value: 'file', label: 'Archivo' }
];

const approvalRoles = [
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'hse', label: 'Verificador' },
  { value: 'client_supervisor', label: 'Supervisor Cliente' },
  { value: 'safety_staff', label: 'Personal de Seguridad' }
];

interface FormData {
  name: string;
  description: string;
  category: string;
  requiredFor: string[];
  tags: string[];
  metadata: {
    estimatedCompletionTime: number;
    requiresApproval: boolean;
    approvalRoles: string[];
    attachmentRequired: boolean;
    expirationDays: number;
  };
  sections: FormSection[];
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const initialFormData: FormData = {
  name: '',
  description: '',
  category: '',
  requiredFor: [],
  tags: [],
  metadata: {
    estimatedCompletionTime: 15,
    requiresApproval: false,
    approvalRoles: [],
    attachmentRequired: false,
    expirationDays: 1
  },
  sections: [
    {
      id: generateId(),
      title: 'Información General',
      description: '',
      order: 1,
      fields: [
        {
          id: generateId(),
          label: '¿Se ha realizado la evaluación de riesgos?',
          name: 'riskAssessment',
          type: 'checkbox',
          required: true,
          order: 1
        }
      ]
    }
  ]
};

export const FormEditor: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [newTag, setNewTag] = useState('');
  
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const loadForm = useCallback(async (formId: string) => {
    try {
      setLoadingData(true);
      const response = await formsApi.getFormById(formId);
      
      if (response.success && response.data) {
        const form = response.data;
        setFormData({
          name: form.name,
          description: form.description || '',
          category: form.category,
          requiredFor: form.requiredFor || [],
          tags: form.tags || [],
          metadata: {
            estimatedCompletionTime: form.metadata?.estimatedCompletionTime || initialFormData.metadata.estimatedCompletionTime,
            requiresApproval: form.metadata?.requiresApproval || initialFormData.metadata.requiresApproval,
            approvalRoles: form.metadata?.approvalRoles || initialFormData.metadata.approvalRoles,
            attachmentRequired: form.metadata?.attachmentRequired || initialFormData.metadata.attachmentRequired,
            expirationDays: form.metadata?.expirationDays || initialFormData.metadata.expirationDays
          },
          sections: form.sections
        });
        showSnackbar('Formulario cargado', 'info');
      }
    } catch (error) {
      console.error('Error loading form:', error);
      setSubmitError('Error al cargar el formulario');
      showSnackbar('Error al cargar el formulario', 'error');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      loadForm(id);
    }
  }, [isEdit, id, loadForm]);

  const handleInputChange = (field: keyof FormData) => (
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

  const handleMetadataChange = (field: keyof FormData['metadata']) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [field]: event.target.type === 'number' ? Number(value) : value
      }
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAddSection = () => {
    setFormData(prev => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id: generateId(),
          title: `Sección ${prev.sections.length + 1}`,
          description: '',
          order: prev.sections.length + 1,
          fields: []
        }
      ]
    }));
  };

  const handleRemoveSection = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index)
    }));
  };

  const handleSectionChange = (index: number, field: keyof FormSection, value: any) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === index ? { ...section, [field]: value } : section
      )
    }));
  };

  const handleAddField = (sectionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === sectionIndex 
          ? { 
              ...section, 
              fields: [
                ...section.fields, 
                {
                  id: generateId(),
                  label: '',
                  name: `field_${generateId().substring(0, 8)}`,
                  type: 'text',
                  required: false,
                  order: section.fields.length + 1
                }
              ] 
            }
          : section
      )
    }));
  };

  const handleRemoveField = (sectionIndex: number, fieldIndex: number) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === sectionIndex 
          ? { 
              ...section, 
              fields: section.fields.filter((_, j) => j !== fieldIndex) 
            }
          : section
      )
    }));
  };

  const handleFieldChange = (
    sectionIndex: number, 
    fieldIndex: number, 
    fieldProp: keyof FormField, 
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === sectionIndex 
          ? {
              ...section,
              fields: section.fields.map((field, j) => 
                j === fieldIndex 
                  ? { ...field, [fieldProp]: value }
                  : field
              )
            }
          : section
      )
    }));
  };

  const handleAddOption = (sectionIndex: number, fieldIndex: number) => {
    const field = formData.sections[sectionIndex].fields[fieldIndex];
    const currentOptions = Array.isArray(field.options) ? field.options : [];
    
    handleFieldChange(sectionIndex, fieldIndex, 'options', [
      ...currentOptions,
      { value: `option_${currentOptions.length + 1}`, label: '' }
    ]);
  };

  const handleOptionChange = (
    sectionIndex: number,
    fieldIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const field = formData.sections[sectionIndex].fields[fieldIndex];
    const currentOptions = Array.isArray(field.options) ? [...field.options] : [];
    
    if (typeof currentOptions[optionIndex] === 'object' && currentOptions[optionIndex] !== null) {
      currentOptions[optionIndex] = { ...(currentOptions[optionIndex] as { value: string; label: string }), label: value };
    }
    
    handleFieldChange(sectionIndex, fieldIndex, 'options', currentOptions);
  };

  const handleRemoveOption = (
    sectionIndex: number,
    fieldIndex: number,
    optionIndex: number
  ) => {
    const field = formData.sections[sectionIndex].fields[fieldIndex];
    const currentOptions = Array.isArray(field.options) ? [...field.options] : [];
    
    handleFieldChange(
      sectionIndex, 
      fieldIndex, 
      'options', 
      currentOptions.filter((_, i) => i !== optionIndex)
    );
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'El nombre es obligatorio';
    if (!formData.category) newErrors.category = 'Debe seleccionar una categoría';
    
    // Validar que haya al menos una sección con campos
    const hasValidSection = formData.sections.some(section => 
      section.title.trim() && section.fields.length > 0
    );
    
    if (!hasValidSection) {
      newErrors.sections = 'Debe tener al menos una sección con campos';
    }

    // Validar que los campos tengan label
    let hasEmptyFields = false;
    formData.sections.forEach(section => {
      section.fields.forEach(field => {
        if (!field.label.trim()) hasEmptyFields = true;
      });
    });
    
    if (hasEmptyFields) {
      newErrors.fields = 'Todos los campos deben tener una etiqueta';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setSubmitError('');

    try {
      const submitData: FormCreateData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        requiredFor: formData.requiredFor,
        tags: formData.tags,
        metadata: formData.metadata,
        sections: formData.sections
      };

      let response;
      if (isEdit && id) {
        response = await formsApi.updateForm(id, submitData);
      } else {
        response = await formsApi.createForm(submitData);
      }

      if (response.success) {
        showSnackbar(
          isEdit ? 'Formulario actualizado exitosamente' : 'Formulario creado exitosamente',
          'success'
        );
        
        setTimeout(() => {
          navigate('/work-permits/forms');
        }, 2000);
      } else {
        throw new Error(response.message || 'Error al procesar el formulario');
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      const errorMessage = error.message || 'Error al procesar el formulario';
      setSubmitError(errorMessage);
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/work-permits/forms');
  };

  if (loadingData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
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
          {isEdit ? 'Editar' : 'Nuevo'}
        </Typography>
      </Breadcrumbs>

      <Typography variant={isXs ? "h5" : "h4"} gutterBottom>
        {isEdit ? 'Editar Formulario' : 'Crear Nuevo Formulario'}
      </Typography>

      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError('')}>
          {submitError}
        </Alert>
      )}

      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Grid container spacing={3}>
          {/* Información Básica */}
          <Grid size={{ xs: 12 }}>
            <Typography variant={isXs ? "subtitle1" : "h6"} gutterBottom>
              Información Básica
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Nombre del Formulario"
              value={formData.name}
              onChange={handleInputChange('name')}
              error={!!errors.name}
              helperText={errors.name}
              required
            />
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
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
              rows={2}
              helperText="Descripción opcional del formulario"
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Autocomplete
              multiple
              options={workPermitCategories}
              getOptionLabel={(option) => option.label}
              value={workPermitCategories.filter(cat => formData.requiredFor.includes(cat.value))}
              onChange={(_, newValue) => {
                setFormData(prev => ({
                  ...prev,
                  requiredFor: newValue.map(v => v.value)
                }));
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option.label}
                    {...getTagProps({ index })}
                    key={option.value}
                    size="small"
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Requerido para tipos de permiso"
                  helperText="Seleccione los tipos de permiso que requieren este formulario"
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Etiquetas (Tags)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                {formData.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    size="small"
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  size="small"
                  fullWidth={isXs}
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder="Agregar etiqueta"
                />
                <Button onClick={handleAddTag} size="small" fullWidth={isXs}>
                  Agregar
                </Button>
              </Box>
            </Box>
          </Grid>

          {/* Metadatos */}
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 2 }} />
            <Typography variant={isXs ? "subtitle1" : "h6"} gutterBottom>
              Configuración
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              type="number"
              label="Tiempo estimado de completado (minutos)"
              value={formData.metadata.estimatedCompletionTime}
              onChange={handleMetadataChange('estimatedCompletionTime')}
              inputProps={{ min: 1 }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              type="number"
              label="Días de validez"
              value={formData.metadata.expirationDays}
              onChange={handleMetadataChange('expirationDays')}
              inputProps={{ min: 1 }}
              helperText="Días que el formulario completado será válido"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.metadata.requiresApproval}
                  onChange={handleMetadataChange('requiresApproval')}
                />
              }
              label="Requiere aprobación"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.metadata.attachmentRequired}
                  onChange={handleMetadataChange('attachmentRequired')}
                />
              }
              label="Requiere adjuntos"
            />
          </Grid>

          {formData.metadata.requiresApproval && (
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Roles que pueden aprobar</InputLabel>
                <Select
                  multiple
                  value={formData.metadata.approvalRoles}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    metadata: {
                      ...prev.metadata,
                      approvalRoles: e.target.value as string[]
                    }
                  }))}
                  label="Roles que pueden aprobar"
                >
                  {approvalRoles.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Secciones y Campos */}
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between', 
              alignItems: { xs: 'stretch', sm: 'center' }, 
              gap: { xs: 1, sm: 0 },
              mb: 2 
            }}>
              <Typography variant={isXs ? "subtitle1" : "h6"}>
                Secciones y Campos
              </Typography>
              <Button
                startIcon={!isXs && <AddIcon />}
                onClick={handleAddSection}
                variant="outlined"
                size={isXs ? "small" : "medium"}
                fullWidth={isXs}
              >
                {isXs ? 'Agregar Sección' : 'Agregar Sección'}
              </Button>
            </Box>
            
            {errors.sections && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.sections}
              </Alert>
            )}
            
            {errors.fields && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.fields}
              </Alert>
            )}

            {formData.sections.map((section, sectionIndex) => (
              <Card key={section.id} sx={{ mb: 3 }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box sx={{ 
                    display: 'flex', 
                    gap: { xs: 1, sm: 2 }, 
                    mb: 2, 
                    alignItems: 'center'
                  }}>
                    {!isXs && <DragIcon sx={{ color: 'text.secondary' }} />}
                    <TextField
                      fullWidth
                      label="Título de la Sección"
                      value={section.title}
                      onChange={(e) => handleSectionChange(sectionIndex, 'title', e.target.value)}
                      size="small"
                      error={!section.title.trim() && formData.sections.length > 0}
                    />
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveSection(sectionIndex)}
                      disabled={formData.sections.length === 1}
                      size={isXs ? "small" : "medium"}
                    >
                      <DeleteIcon fontSize={isXs ? "small" : "medium"} />
                    </IconButton>
                  </Box>

                  <TextField
                    fullWidth
                    label="Descripción de la sección (opcional)"
                    value={section.description}
                    onChange={(e) => handleSectionChange(sectionIndex, 'description', e.target.value)}
                    size="small"
                    sx={{ mb: 2 }}
                  />

                  <Box sx={{ ml: { xs: 0, sm: 4 } }}>
                    {section.fields.map((field, fieldIndex) => (
                      <Box key={field.id} sx={{ 
                        mb: 2, 
                        p: { xs: 1.5, sm: 2 }, 
                        bgcolor: 'grey.50', 
                        borderRadius: 1 
                      }}>
                        <Grid container spacing={{ xs: 1.5, sm: 2 }} alignItems="flex-start">
                          <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                              fullWidth
                              label="Etiqueta del campo"
                              value={field.label}
                              onChange={(e) => handleFieldChange(sectionIndex, fieldIndex, 'label', e.target.value)}
                              size="small"
                              error={!field.label.trim()}
                              required
                            />
                          </Grid>

                          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <TextField
                              fullWidth
                              label="Nombre (ID)"
                              value={field.name}
                              onChange={(e) => handleFieldChange(sectionIndex, fieldIndex, 'name', e.target.value)}
                              size="small"
                              helperText={!isXs && "Identificador único"}
                            />
                          </Grid>
                          
                          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Tipo</InputLabel>
                              <Select
                                value={field.type}
                                onChange={(e) => handleFieldChange(sectionIndex, fieldIndex, 'type', e.target.value)}
                                label="Tipo"
                              >
                                {fieldTypes.map((type) => (
                                  <MenuItem key={type.value} value={type.value}>
                                    {type.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          
                          <Grid size={{ xs: 6, md: 1 }}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={field.required}
                                  onChange={(e) => handleFieldChange(sectionIndex, fieldIndex, 'required', e.target.checked)}
                                  size="small"
                                />
                              }
                              label={isXs ? "Req." : "Req."}
                            />
                          </Grid>
                          
                          <Grid size={{ xs: 6, md: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: isXs ? 'flex-end' : 'center' }}>
                              <IconButton
                                color="error"
                                onClick={() => handleRemoveField(sectionIndex, fieldIndex)}
                                size="small"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Grid>

                          {(field.type === 'select' || field.type === 'multiselect' || field.type === 'radio') && (
                            <Grid size={{ xs: 12 }}>
                              <Box sx={{ mt: 1, ml: { xs: 0, sm: 2 } }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Opciones
                                </Typography>
                                {(Array.isArray(field.options) ? field.options : []).map((option, optionIndex) => (
                                  <Box key={optionIndex} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                    <TextField
                                      fullWidth
                                      value={typeof option === 'object' ? option.label : option}
                                      onChange={(e) => handleOptionChange(sectionIndex, fieldIndex, optionIndex, e.target.value)}
                                      placeholder="Texto de la opción"
                                      size="small"
                                    />
                                    <IconButton
                                      color="error"
                                      onClick={() => handleRemoveOption(sectionIndex, fieldIndex, optionIndex)}
                                      size="small"
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                ))}
                                <Button
                                  startIcon={!isXs && <AddIcon />}
                                  onClick={() => handleAddOption(sectionIndex, fieldIndex)}
                                  size="small"
                                  variant="text"
                                  fullWidth={isXs}
                                >
                                  {isXs ? 'Agregar Opción' : 'Agregar Opción'}
                                </Button>
                              </Box>
                            </Grid>
                          )}

                          {field.type === 'text' && (
                            <Grid size={{ xs: 12 }}>
                              <TextField
                                fullWidth
                                label="Texto de ayuda (opcional)"
                                value={field.helperText || ''}
                                onChange={(e) => handleFieldChange(sectionIndex, fieldIndex, 'helperText', e.target.value)}
                                size="small"
                              />
                            </Grid>
                          )}
                        </Grid>
                      </Box>
                    ))}
                    
                    <Button
                      startIcon={!isXs && <AddIcon />}
                      onClick={() => handleAddField(sectionIndex)}
                      size="small"
                      variant="outlined"
                      sx={{ mt: 1 }}
                      fullWidth={isXs}
                    >
                      {isXs ? 'Agregar Campo' : 'Agregar Campo'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Grid>
        </Grid>

        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          gap: 2,
          mt: 4 
        }}>
          <Button
            variant="outlined"
            startIcon={!isXs && <PreviewIcon />}
            onClick={() => setPreviewOpen(true)}
            fullWidth={isXs}
            size={isXs ? "small" : "medium"}
          >
            {isXs ? 'Vista Previa' : 'Vista Previa'}
          </Button>
          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            flexDirection: { xs: 'column', sm: 'row' },
            width: { xs: '100%', sm: 'auto' }
          }}>
            <Button 
              variant="outlined" 
              onClick={handleCancel}
              fullWidth={isXs}
              size={isXs ? "small" : "medium"}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              fullWidth={isXs}
              size={isXs ? "small" : "medium"}
            >
              {loading ? <CircularProgress size={isXs ? 20 : 24} /> : (isEdit ? 'Actualizar' : 'Crear')}
            </Button>
          </Box>
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
            snackbar.severity === 'error' ? <ErrorIcon /> : undefined
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
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Dialog de Preview */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isXs}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Vista Previa: {formData.name || 'Formulario sin nombre'}
            </Typography>
            <IconButton
              edge="end"
              color="inherit"
              onClick={() => setPreviewOpen(false)}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ p: 2 }}>
            {formData.description && (
              <Alert severity="info" sx={{ mb: 3 }}>
                {formData.description}
              </Alert>
            )}

            {formData.metadata.estimatedCompletionTime && (
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                Tiempo estimado: {formData.metadata.estimatedCompletionTime} minutos
              </Typography>
            )}
            
            {formData.sections.length === 0 ? (
              <Typography color="text.secondary" textAlign="center">
                No hay secciones definidas en este formulario
              </Typography>
            ) : (
              formData.sections.map((section, sectionIndex) => (
                <Box key={section.id} sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    {section.title || `Sección ${sectionIndex + 1}`}
                  </Typography>
                  {section.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {section.description}
                    </Typography>
                  )}
                  
                  {section.fields.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                      No hay campos en esta sección
                    </Typography>
                  ) : (
                    <Box sx={{ ml: 2 }}>
                      {section.fields.map((field) => (
                        <Box key={field.id} sx={{ mb: 2 }}>
                          {/* Renderizar según el tipo de campo */}
                          {field.type === 'checkbox' && (
                            <FormControlLabel
                              control={<MuiCheckbox disabled />}
                              label={
                                <Box>
                                  <Typography variant="body1">
                                    {field.label}
                                    {field.required && <Typography component="span" color="error"> *</Typography>}
                                  </Typography>
                                </Box>
                              }
                            />
                          )}
                          
                          {field.type === 'text' && (
                            <TextField
                              fullWidth
                              label={field.label}
                              required={field.required}
                              disabled
                              variant="outlined"
                              size="small"
                              helperText={field.helperText}
                              sx={{ mb: 1 }}
                            />
                          )}
                          
                          {field.type === 'number' && (
                            <TextField
                              fullWidth
                              type="number"
                              label={field.label}
                              required={field.required}
                              disabled
                              variant="outlined"
                              size="small"
                              sx={{ mb: 1 }}
                            />
                          )}
                          
                          {field.type === 'date' && (
                            <TextField
                              fullWidth
                              type="date"
                              label={field.label}
                              required={field.required}
                              disabled
                              variant="outlined"
                              size="small"
                              slotProps={{ inputLabel: { shrink: true } }}
                              sx={{ mb: 1 }}
                            />
                          )}
                          
                          {field.type === 'textarea' && (
                            <TextField
                              fullWidth
                              multiline
                              rows={3}
                              label={field.label}
                              required={field.required}
                              disabled
                              variant="outlined"
                              size="small"
                              sx={{ mb: 1 }}
                            />
                          )}
                          
                          {field.type === 'select' && (
                            <FormControl fullWidth disabled size="small" sx={{ mb: 1 }}>
                              <InputLabel>{field.label} {field.required && '*'}</InputLabel>
                              <Select label={field.label}>
                                {(Array.isArray(field.options) ? field.options : []).map((option, optIndex) => (
                                  <MenuItem 
                                    key={optIndex} 
                                    value={typeof option === 'object' ? option.value : option}
                                  >
                                    {typeof option === 'object' ? option.label : option}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}
                          
                          {field.type === 'multiselect' && (
                            <FormControl component="fieldset" sx={{ mb: 1 }}>
                              <FormLabel component="legend">
                                {field.label}
                                {field.required && <Typography component="span" color="error"> *</Typography>}
                              </FormLabel>
                              <FormGroup>
                                {(Array.isArray(field.options) ? field.options : []).map((option, optIndex) => (
                                  <FormControlLabel
                                    key={optIndex}
                                    control={<MuiCheckbox disabled />}
                                    label={typeof option === 'object' ? option.label : option}
                                  />
                                ))}
                              </FormGroup>
                            </FormControl>
                          )}

                          {field.type === 'signature' && (
                            <SignatureField
                              label={field.label}
                              required={field.required}
                              disabled={true}
                              width={300}
                              height={150}
                            />
                          )}

                          {field.type === 'file' && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" gutterBottom>
                                {field.label}
                                {field.required && <Typography component="span" color="error"> *</Typography>}
                              </Typography>
                              <Button
                                variant="outlined"
                                disabled
                                fullWidth
                                sx={{ justifyContent: 'flex-start' }}
                              >
                                Seleccionar archivo...
                              </Button>
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              ))
            )}
            
            {formData.sections.some(s => s.fields.some(f => f.required)) && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                * Campos requeridos
              </Typography>
            )}

            {formData.metadata.attachmentRequired && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Este formulario requiere adjuntar documentos
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};