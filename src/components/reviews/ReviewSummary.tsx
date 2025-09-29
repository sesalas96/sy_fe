import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Rating,
  LinearProgress,
  Stack,
  Chip,
  Divider
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { ReviewSummary as ReviewSummaryType } from '../../types';

interface ReviewSummaryProps {
  summary: ReviewSummaryType | null;
  loading?: boolean;
  error?: string;
}

interface MetricRowProps {
  label: string;
  value: number;
}

const MetricRow: React.FC<MetricRowProps> = ({ label, value }) => (
  <Box sx={{ mb: 1.5 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight="medium">
        {value.toFixed(1)}
      </Typography>
    </Box>
    <LinearProgress
      variant="determinate"
      value={(value / 5) * 100}
      sx={{
        height: 6,
        borderRadius: 1,
        backgroundColor: 'action.hover',
        '& .MuiLinearProgress-bar': {
          borderRadius: 1,
          backgroundColor: value >= 4 ? 'success.main' : value >= 3 ? 'warning.main' : 'error.main'
        }
      }}
    />
  </Box>
);

interface RatingDistributionProps {
  distribution: ReviewSummaryType['ratingDistribution'];
  total: number;
}

const RatingDistribution: React.FC<RatingDistributionProps> = ({ distribution, total }) => (
  <Box>
    {[5, 4, 3, 2, 1].map((stars) => {
      const count = distribution[stars.toString() as keyof typeof distribution];
      const percentage = total > 0 ? (count / total) * 100 : 0;

      return (
        <Box key={stars} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <Typography variant="body2" sx={{ minWidth: 20 }}>
            {stars}
          </Typography>
          <StarIcon sx={{ fontSize: 16, color: 'warning.main', mx: 0.5 }} />
          <Box sx={{ flex: 1, mx: 1 }}>
            <LinearProgress
              variant="determinate"
              value={percentage}
              sx={{
                height: 6,
                borderRadius: 1,
                backgroundColor: 'action.hover',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 1,
                  backgroundColor: 'warning.main'
                }
              }}
            />
          </Box>
          <Typography variant="body2" sx={{ minWidth: 30, textAlign: 'right' }}>
            {count}
          </Typography>
        </Box>
      );
    })}
  </Box>
);

export const ReviewSummary: React.FC<ReviewSummaryProps> = ({ summary, loading, error }) => {
  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <Typography>Cargando resumen...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  if (!summary || summary.totalReviews === 0) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="h6" gutterBottom>
              Sin Evaluaciones
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Este contratista aún no ha recibido evaluaciones
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Grid container spacing={3}>
          {/* Resumen principal */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight="bold">
                {summary.averageRating.toFixed(1)}
              </Typography>
              <Rating
                value={summary.averageRating}
                readOnly
                precision={0.1}
                size="large"
                sx={{ my: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                Basado en {summary.totalReviews} evaluación{summary.totalReviews !== 1 ? 'es' : ''}
              </Typography>

              {summary.wouldHireAgainPercentage > 0 && (
                <Chip
                  icon={<CheckCircleIcon />}
                  label={`${Math.round(summary.wouldHireAgainPercentage)}% lo contrataría nuevamente`}
                  color="success"
                  variant="outlined"
                  sx={{ mt: 2 }}
                />
              )}
            </Box>
          </Grid>

          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

          {/* Métricas detalladas */}
          <Grid size={{ xs: 12, md: 3.5 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon fontSize="small" />
              Métricas de Desempeño
            </Typography>
            <Box sx={{ mt: 2 }}>
              <MetricRow label="Puntualidad" value={summary.metrics.punctuality} />
              <MetricRow label="Calidad" value={summary.metrics.quality} />
              <MetricRow label="Seguridad" value={summary.metrics.safety} />
              <MetricRow label="Comunicación" value={summary.metrics.communication} />
              <MetricRow label="Profesionalismo" value={summary.metrics.professionalBehavior} />
            </Box>
          </Grid>

          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

          {/* Distribución de calificaciones */}
          <Grid size={{ xs: 12, md: 3.5 }}>
            <Typography variant="subtitle2" gutterBottom>
              Distribución de Calificaciones
            </Typography>
            <Box sx={{ mt: 2 }}>
              <RatingDistribution distribution={summary.ratingDistribution} total={summary.totalReviews} />
            </Box>
          </Grid>
        </Grid>

        {/* Estadísticas adicionales */}
        <Divider sx={{ my: 3 }} />
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Chip
            label={`Calificación promedio: ${summary.averageRating.toFixed(1)}`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`Total de evaluaciones: ${summary.totalReviews}`}
            size="small"
            variant="outlined"
          />
          {summary.metrics.safety >= 4.5 && (
            <Chip
              label="Excelente en seguridad"
              size="small"
              color="success"
              variant="outlined"
            />
          )}
          {summary.metrics.punctuality >= 4.5 && (
            <Chip
              label="Muy puntual"
              size="small"
              color="success"
              variant="outlined"
            />
          )}
          {summary.averageRating >= 4.5 && (
            <Chip
              label="Altamente recomendado"
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};