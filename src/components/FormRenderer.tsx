import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Select,
  MenuItem,
  InputLabel,
  FormGroup,
  FormLabel,
  Typography,
  Button,
  FormHelperText,
  Alert
} from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';
import { SignatureField, SignatureFieldRef } from './SignatureField';
import { Form, FormField } from '../services/formsApi';

interface FormResponse {
  fieldId: string;
  fieldName: string;
  value: any;
}

interface FormRendererProps {
  form: Form;
  onSubmit?: (responses: FormResponse[]) => void;
  onChange?: (responses: FormResponse[]) => void;
  initialValues?: Record<string, any>;
  disabled?: boolean;
  showSubmitButton?: boolean;
}

export const FormRenderer: React.FC<FormRendererProps> = ({
  form,
  onSubmit,
  onChange,
  initialValues = {},
  disabled = false,
  showSubmitButton = true
}) => {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [signatureRefs] = useState<Record<string, React.RefObject<SignatureFieldRef | null>>>({});

  useEffect(() => {
    // Inicializar con valores por defecto
    const defaultValues: Record<string, any> = {};
    (form?.sections || []).forEach(section => {
      (section?.fields || []).forEach(field => {
        if (field && initialValues[field.name]) {
          defaultValues[field.name] = initialValues[field.name];
        } else if (field && (field.type === 'checkbox' || field.type === 'multiselect')) {
          defaultValues[field.name] = [];
        } else if (field) {
          defaultValues[field.name] = '';
        }
      });
    });
    setResponses(defaultValues);
  }, [form, initialValues]);

  const handleFieldChange = (field: FormField, value: any) => {
    const newResponses = { ...responses, [field.name]: value };
    setResponses(newResponses);
    
    // Limpiar error del campo
    if (errors[field.name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field.name];
        return newErrors;
      });
    }

    // Notificar cambios
    if (onChange) {
      const formattedResponses = Object.entries(newResponses).map(([fieldName, value]) => {
        const field = (form?.sections || [])
          .flatMap(s => s?.fields || [])
          .find(f => f && f.name === fieldName);
        
        return {
          fieldId: field?.id || '',
          fieldName,
          value
        };
      });
      onChange(formattedResponses);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    (form?.sections || []).forEach(section => {
      (section?.fields || []).forEach(field => {
        if (field && field.required) {
          const value = responses[field.name];
          
          if (!value || (Array.isArray(value) && value.length === 0)) {
            newErrors[field.name] = `${field.label} es requerido`;
          }
          
          // Validaciones específicas
          if (field.validation) {
            if (field.type === 'number' && value) {
              const numValue = Number(value);
              if (field.validation.min !== undefined && numValue < field.validation.min) {
                newErrors[field.name] = `El valor mínimo es ${field.validation.min}`;
              }
              if (field.validation.max !== undefined && numValue > field.validation.max) {
                newErrors[field.name] = `El valor máximo es ${field.validation.max}`;
              }
            }
            
            if (field.type === 'text' && value) {
              if (field.validation.minLength && value.length < field.validation.minLength) {
                newErrors[field.name] = `Mínimo ${field.validation.minLength} caracteres`;
              }
              if (field.validation.maxLength && value.length > field.validation.maxLength) {
                newErrors[field.name] = `Máximo ${field.validation.maxLength} caracteres`;
              }
              if (field.validation.pattern) {
                const regex = new RegExp(field.validation.pattern);
                if (!regex.test(value)) {
                  newErrors[field.name] = `Formato inválido`;
                }
              }
            }
          }
        }
      });
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    
    if (onSubmit) {
      const formattedResponses = Object.entries(responses).map(([fieldName, value]) => {
        const field = (form?.sections || [])
          .flatMap(s => s?.fields || [])
          .find(f => f && f.name === fieldName);
        
        return {
          fieldId: field?.id || '',
          fieldName,
          value
        };
      });
      onSubmit(formattedResponses);
    }
  };

  const shouldShowField = (field: FormField): boolean => {
    if (!field || !field.conditional) return true;
    
    const { showIf } = field.conditional;
    if (!showIf) return true;
    
    const dependentValue = responses[showIf.field];
    
    switch (showIf.operator) {
      case 'equals':
        return dependentValue === showIf.value;
      case 'notEquals':
        return dependentValue !== showIf.value;
      case 'greaterThan':
        return Number(dependentValue) > Number(showIf.value);
      case 'lessThan':
        return Number(dependentValue) < Number(showIf.value);
      default:
        return true;
    }
  };

  const renderField = (field: FormField, sectionIndex: number, fieldIndex: number) => {
    if (!field || !shouldShowField(field)) return null;
    
    const value = responses[field.name];
    const error = errors[field.name];
    const fieldKey = `${sectionIndex}-${fieldIndex}-${field.id || field.name || `field-${fieldIndex}`}`;

    switch (field.type) {
      case 'text':
        return (
          <TextField
            key={fieldKey}
            fullWidth
            label={field.label}
            value={value || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            required={field.required}
            error={!!error}
            helperText={error || field.helperText}
            disabled={disabled}
            placeholder={field.placeholder}
            sx={{ mb: 2 }}
          />
        );

      case 'number':
        return (
          <TextField
            key={fieldKey}
            fullWidth
            type="number"
            label={field.label}
            value={value || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            required={field.required}
            error={!!error}
            helperText={error || field.helperText}
            disabled={disabled}
            slotProps={{
              htmlInput: {
                min: field.validation?.min,
                max: field.validation?.max
              }
            }}
            sx={{ mb: 2 }}
          />
        );

      case 'date':
        return (
          <TextField
            key={fieldKey}
            fullWidth
            type="date"
            label={field.label}
            value={value || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            required={field.required}
            error={!!error}
            helperText={error}
            disabled={disabled}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ mb: 2 }}
          />
        );

      case 'textarea':
        return (
          <TextField
            key={fieldKey}
            fullWidth
            multiline
            rows={4}
            label={field.label}
            value={value || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            required={field.required}
            error={!!error}
            helperText={error || field.helperText}
            disabled={disabled}
            placeholder={field.placeholder}
            sx={{ mb: 2 }}
          />
        );

      case 'checkbox':
        return (
          <FormControl key={fieldKey} error={!!error} sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!value}
                  onChange={(e) => handleFieldChange(field, e.target.checked)}
                  disabled={disabled}
                />
              }
              label={
                <Box>
                  {field.label}
                  {field.required && <Typography component="span" color="error"> *</Typography>}
                </Box>
              }
            />
            {error && <FormHelperText>{error}</FormHelperText>}
          </FormControl>
        );

      case 'radio':
        return (
          <FormControl key={fieldKey} error={!!error} sx={{ mb: 2 }}>
            <FormLabel>
              {field.label}
              {field.required && <Typography component="span" color="error"> *</Typography>}
            </FormLabel>
            <RadioGroup
              value={value || ''}
              onChange={(e) => handleFieldChange(field, e.target.value)}
            >
              {(Array.isArray(field.options) ? field.options : []).map((option, idx) => (
                <FormControlLabel
                  key={idx}
                  value={typeof option === 'object' ? option.value : option}
                  control={<Radio disabled={disabled} />}
                  label={typeof option === 'object' ? option.label : option}
                />
              ))}
            </RadioGroup>
            {error && <FormHelperText>{error}</FormHelperText>}
          </FormControl>
        );

      case 'select':
        return (
          <FormControl key={fieldKey} fullWidth error={!!error} sx={{ mb: 2 }}>
            <InputLabel>
              {field.label} {field.required && '*'}
            </InputLabel>
            <Select
              value={value || ''}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              label={field.label}
              disabled={disabled}
            >
              {(Array.isArray(field.options) ? field.options : []).map((option, idx) => (
                <MenuItem 
                  key={idx} 
                  value={typeof option === 'object' ? option.value : option}
                >
                  {typeof option === 'object' ? option.label : option}
                </MenuItem>
              ))}
            </Select>
            {error && <FormHelperText>{error}</FormHelperText>}
          </FormControl>
        );

      case 'multiselect':
        return (
          <FormControl key={fieldKey} component="fieldset" error={!!error} sx={{ mb: 2 }}>
            <FormLabel component="legend">
              {field.label}
              {field.required && <Typography component="span" color="error"> *</Typography>}
            </FormLabel>
            <FormGroup>
              {(Array.isArray(field.options) ? field.options : []).map((option, idx) => {
                const optionValue = typeof option === 'object' ? option.value : option;
                const optionLabel = typeof option === 'object' ? option.label : option;
                
                return (
                  <FormControlLabel
                    key={idx}
                    control={
                      <Checkbox
                        checked={(value || []).includes(optionValue)}
                        onChange={(e) => {
                          const currentValues = value || [];
                          if (e.target.checked) {
                            handleFieldChange(field, [...currentValues, optionValue]);
                          } else {
                            handleFieldChange(field, currentValues.filter((v: any) => v !== optionValue));
                          }
                        }}
                        disabled={disabled}
                      />
                    }
                    label={optionLabel}
                  />
                );
              })}
            </FormGroup>
            {error && <FormHelperText>{error}</FormHelperText>}
          </FormControl>
        );

      case 'signature':
        if (!signatureRefs[field.name]) {
          signatureRefs[field.name] = React.createRef<SignatureFieldRef>();
        }
        
        return (
          <Box key={fieldKey} sx={{ mb: 2 }}>
            <SignatureField
              ref={signatureRefs[field.name]}
              label={field.label}
              required={field.required}
              disabled={disabled}
              value={value}
              onChange={(dataUrl) => handleFieldChange(field, dataUrl)}
              width={400}
              height={200}
            />
            {error && (
              <Typography variant="caption" color="error">
                {error}
              </Typography>
            )}
          </Box>
        );

      case 'file':
        return (
          <Box key={fieldKey} sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              {field.label}
              {field.required && <Typography component="span" color="error"> *</Typography>}
            </Typography>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              disabled={disabled}
              fullWidth
              sx={{ justifyContent: 'flex-start' }}
            >
              {value ? `Archivo seleccionado: ${value}` : 'Seleccionar archivo...'}
              <input
                type="file"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFieldChange(field, file.name);
                  }
                }}
              />
            </Button>
            {error && (
              <Typography variant="caption" color="error">
                {error}
              </Typography>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  // Early return if form is not provided or invalid
  if (!form) {
    return (
      <Alert severity="error">
        Formulario no disponible
      </Alert>
    );
  }

  return (
    <Box>
      {form.description && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {form.description}
        </Alert>
      )}

      {form.metadata?.estimatedCompletionTime && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          Tiempo estimado: {form.metadata.estimatedCompletionTime} minutos
        </Typography>
      )}

      {(form?.sections || []).map((section, sectionIndex) => {
        if (!section) return null;
        
        return (
          <Box key={section.id || `section-${sectionIndex}`} sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
              {section.title || `Sección ${sectionIndex + 1}`}
            </Typography>
            {section.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {section.description}
              </Typography>
            )}
            
            <Box sx={{ ml: { xs: 0, sm: 2 } }}>
              {(section?.fields || [])
                .filter(field => field != null)
                .sort((a, b) => (a?.order || 0) - (b?.order || 0))
                .map((field, fieldIndex) => renderField(field, sectionIndex, fieldIndex))}
            </Box>
          </Box>
        );
      })}

      {(form?.sections || []).some(s => (s?.fields || []).some(f => f && f.required)) && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          * Campos requeridos
        </Typography>
      )}

      {form.metadata?.attachmentRequired && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Este formulario requiere adjuntar documentos adicionales
        </Alert>
      )}

      {showSubmitButton && onSubmit && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={disabled}
            size="large"
          >
            Enviar Formulario
          </Button>
        </Box>
      )}
    </Box>
  );
};