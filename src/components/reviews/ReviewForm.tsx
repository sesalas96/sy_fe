import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Rating,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  Stack,
  Alert,
  Autocomplete
} from '@mui/material';
import { Grid } from '@mui/material';
import { CreateReviewInput, UpdateReviewInput, Review } from '../../types';

interface ReviewFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateReviewInput | UpdateReviewInput) => Promise<void>;
  contractorId?: string;
  contractorName?: string;
  editingReview?: Review | null;
}

const COMMON_TAGS = [
  'profesional',
  'puntual',
  'seguro',
  'eficiente',
  'comunicativo',
  'confiable',
  'limpio',
  'organizado',
  'proactivo',
  'colaborativo'
];

const WORK_TYPES = [
  'Instalación',
  'Mantenimiento',
  'Reparación',
  'Construcción',
  'Electricidad',
  'Plomería',
  'Pintura',
  'Carpintería',
  'Jardinería',
  'Limpieza',
  'Seguridad',
  'Otro'
];

export const ReviewForm: React.FC<ReviewFormProps> = ({
  open,
  onClose,
  onSubmit,
  contractorId,
  contractorName,
  editingReview
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    rating: editingReview?.rating || 0,
    punctuality: editingReview?.punctuality || 0,
    quality: editingReview?.quality || 0,
    safety: editingReview?.safety || 0,
    communication: editingReview?.communication || 0,
    professionalBehavior: editingReview?.professionalBehavior || 0,
    comment: editingReview?.comment || '',
    wouldHireAgain: editingReview?.wouldHireAgain ?? true,
    projectName: editingReview?.projectName || '',
    workType: editingReview?.workType || '',
    tags: editingReview?.tags || []
  });

  const handleSubmit = async () => {
    // Validaciones
    if (formData.rating === 0) {
      setError('Por favor, proporciona una calificación general');
      return;
    }

    if (!formData.comment.trim()) {
      setError('Por favor, escribe un comentario');
      return;
    }

    if (formData.comment.length < 10) {
      setError('El comentario debe tener al menos 10 caracteres');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (editingReview) {
        // Update review
        const updateData: UpdateReviewInput = { ...formData };
        await onSubmit(updateData);
      } else {
        // Create review
        if (!contractorId) {
          throw new Error('No se especificó el ID del contratista');
        }
        const createData: CreateReviewInput = {
          ...formData,
          contractorId
        };
        await onSubmit(createData);
      }
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la evaluación');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      rating: 0,
      punctuality: 0,
      quality: 0,
      safety: 0,
      communication: 0,
      professionalBehavior: 0,
      comment: '',
      wouldHireAgain: true,
      projectName: '',
      workType: '',
      tags: []
    });
    setError(null);
    onClose();
  };

  const updateRating = (field: string, value: number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value || 0
    }));
  };

  // Calcular el promedio de las métricas
  const calculateAverageRating = () => {
    const metrics = [
      formData.punctuality,
      formData.quality,
      formData.safety,
      formData.communication,
      formData.professionalBehavior
    ];
    const validMetrics = metrics.filter(m => m > 0);
    if (validMetrics.length === 0) return 0;
    return validMetrics.reduce((a, b) => a + b, 0) / validMetrics.length;
  };

  // Actualizar rating general cuando cambian las métricas
  React.useEffect(() => {
    if (!editingReview && formData.rating === 0) {
      const avg = calculateAverageRating();
      if (avg > 0) {
        setFormData(prev => ({ ...prev, rating: Math.round(avg * 2) / 2 }));
      }
    }
  }, [
    formData.punctuality,
    formData.quality,
    formData.safety,
    formData.communication,
    formData.professionalBehavior
  ]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: { sx: { maxHeight: '90vh' } }
      }}
    >
      <DialogTitle>
        {editingReview ? 'Editar Evaluación' : 'Nueva Evaluación'}
        {contractorName && (
          <Typography variant="subtitle1" color="text.secondary">
            Evaluando a: {contractorName}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <FormLabel component="legend" sx={{ mb: 1 }}>
            Calificación General *
          </FormLabel>
          <Rating
            value={formData.rating}
            onChange={(_, newValue) => updateRating('rating', newValue)}
            size="large"
            precision={0.5}
          />
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box>
              <Typography variant="body2" gutterBottom>
                Puntualidad
              </Typography>
              <Rating
                value={formData.punctuality}
                onChange={(_, newValue) => updateRating('punctuality', newValue)}
                precision={0.5}
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box>
              <Typography variant="body2" gutterBottom>
                Calidad del Trabajo
              </Typography>
              <Rating
                value={formData.quality}
                onChange={(_, newValue) => updateRating('quality', newValue)}
                precision={0.5}
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box>
              <Typography variant="body2" gutterBottom>
                Seguridad
              </Typography>
              <Rating
                value={formData.safety}
                onChange={(_, newValue) => updateRating('safety', newValue)}
                precision={0.5}
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box>
              <Typography variant="body2" gutterBottom>
                Comunicación
              </Typography>
              <Rating
                value={formData.communication}
                onChange={(_, newValue) => updateRating('communication', newValue)}
                precision={0.5}
              />
            </Box>
          </Grid>
          <Grid size={12}>
            <Box>
              <Typography variant="body2" gutterBottom>
                Comportamiento Profesional
              </Typography>
              <Rating
                value={formData.professionalBehavior}
                onChange={(_, newValue) => updateRating('professionalBehavior', newValue)}
                precision={0.5}
              />
            </Box>
          </Grid>
        </Grid>

        <TextField
          fullWidth
          label="Nombre del Proyecto"
          value={formData.projectName}
          onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
          sx={{ mb: 2 }}
        />

        <Autocomplete
          value={formData.workType}
          onChange={(_, newValue) => setFormData(prev => ({ ...prev, workType: newValue || '' }))}
          options={WORK_TYPES}
          renderInput={(params) => (
            <TextField {...params} label="Tipo de Trabajo" />
          )}
          sx={{ mb: 2 }}
          freeSolo
        />

        <TextField
          fullWidth
          multiline
          rows={4}
          label="Comentario *"
          value={formData.comment}
          onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
          placeholder="Describe tu experiencia trabajando con este contratista..."
          sx={{ mb: 2 }}
          helperText={`${formData.comment.length}/500 caracteres`}
          slotProps={{
            htmlInput: { maxLength: 500 }
          }}
        />

        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <FormLabel component="legend">
            ¿Contratarías nuevamente a este profesional?
          </FormLabel>
          <RadioGroup
            row
            value={formData.wouldHireAgain ? 'yes' : 'no'}
            onChange={(e) => setFormData(prev => ({ ...prev, wouldHireAgain: e.target.value === 'yes' }))}
          >
            <FormControlLabel value="yes" control={<Radio />} label="Sí" />
            <FormControlLabel value="no" control={<Radio />} label="No" />
          </RadioGroup>
        </FormControl>

        <Box>
          <Typography variant="body2" gutterBottom>
            Etiquetas (opcional)
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {COMMON_TAGS.map(tag => (
              <Chip
                key={tag}
                label={tag}
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    tags: prev.tags.includes(tag)
                      ? prev.tags.filter(t => t !== tag)
                      : [...prev.tags, tag]
                  }));
                }}
                color={formData.tags.includes(tag) ? 'primary' : 'default'}
                variant={formData.tags.includes(tag) ? 'filled' : 'outlined'}
                sx={{ mb: 1 }}
              />
            ))}
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || formData.rating === 0 || !formData.comment.trim()}
        >
          {loading ? 'Guardando...' : (editingReview ? 'Actualizar' : 'Enviar Evaluación')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};