import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Stack,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  AccessTime as PunctualityIcon,
  HighQuality as QualityIcon,
  Security as SafetyIcon,
  Forum as CommunicationIcon,
  Psychology as BehaviorIcon,
  ThumbUp as ThumbUpIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import { StarRating } from './StarRating';
import { ReviewSummary } from '../../services/reviewsApi';

interface ReviewMetricsSummaryProps {
  summary: ReviewSummary;
  showTrends?: boolean;
  previousSummary?: ReviewSummary;
}

interface MetricData {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

export const ReviewMetricsSummary: React.FC<ReviewMetricsSummaryProps> = ({
  summary,
  showTrends = false,
  previousSummary
}) => {
  const theme = useTheme();

  const getMetricColor = (value: number): string => {
    if (value >= 4.5) return theme.palette.success.main;
    if (value >= 3.5) return theme.palette.info.main;
    if (value >= 2.5) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getTrendIcon = (current: number, previous?: number) => {
    if (!previous || current === previous) return null;
    
    const diff = current - previous;
    const percentage = ((diff / previous) * 100).toFixed(1);
    
    if (diff > 0) {
      return (
        <Tooltip title={`+${percentage}% desde la última evaluación`}>
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}>
            <TrendingUpIcon fontSize="small" />
            <Typography variant="caption">+{diff.toFixed(1)}</Typography>
          </Box>
        </Tooltip>
      );
    } else {
      return (
        <Tooltip title={`${percentage}% desde la última evaluación`}>
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
            <TrendingDownIcon fontSize="small" />
            <Typography variant="caption">{diff.toFixed(1)}</Typography>
          </Box>
        </Tooltip>
      );
    }
  };

  const metrics: MetricData[] = [
    {
      label: 'Puntualidad',
      value: summary.metrics.punctuality,
      icon: <PunctualityIcon />,
      color: getMetricColor(summary.metrics.punctuality)
    },
    {
      label: 'Calidad',
      value: summary.metrics.quality,
      icon: <QualityIcon />,
      color: getMetricColor(summary.metrics.quality)
    },
    {
      label: 'Seguridad',
      value: summary.metrics.safety,
      icon: <SafetyIcon />,
      color: getMetricColor(summary.metrics.safety)
    },
    {
      label: 'Comunicación',
      value: summary.metrics.communication,
      icon: <CommunicationIcon />,
      color: getMetricColor(summary.metrics.communication)
    },
    {
      label: 'Comportamiento',
      value: summary.metrics.professionalBehavior,
      icon: <BehaviorIcon />,
      color: getMetricColor(summary.metrics.professionalBehavior)
    }
  ];

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Overall Rating Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Calificación General
              </Typography>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h2" color="primary" fontWeight="bold">
                  {summary.averageRating.toFixed(1)}
                </Typography>
                <StarRating 
                  value={summary.averageRating} 
                  size="large" 
                  showLabel 
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Basado en {summary.totalReviews} evaluaciones
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Would Hire Again Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Lo Contrataría de Nuevo
              </Typography>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <Typography variant="h2" color="primary" fontWeight="bold">
                    {summary.wouldHireAgainPercentage.toFixed(0)}%
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <ThumbUpIcon color="primary" sx={{ fontSize: 40 }} />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  De los supervisores lo recomiendan
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Rating Distribution Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Distribución de Calificaciones
              </Typography>
              <Stack spacing={1} sx={{ mt: 2 }}>
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = summary.ratingDistribution[rating.toString() as keyof typeof summary.ratingDistribution];
                  const percentage = summary.totalReviews > 0 
                    ? (count / summary.totalReviews) * 100 
                    : 0;
                  
                  return (
                    <Box key={rating} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ minWidth: 20 }}>
                        {rating}★
                      </Typography>
                      <Box sx={{ flexGrow: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={percentage} 
                          sx={{ height: 8, borderRadius: 4 }}
                          color={rating >= 4 ? 'success' : rating >= 3 ? 'warning' : 'error'}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'right' }}>
                        {count}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Detailed Metrics */}
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Métricas Detalladas
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {metrics.map((metric, index) => (
                  <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={metric.label}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Box sx={{ color: metric.color, mb: 1 }}>
                        {metric.icon}
                      </Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        {metric.label}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                        <Typography variant="h4" sx={{ color: metric.color }}>
                          {metric.value.toFixed(1)}
                        </Typography>
                        {showTrends && previousSummary && getTrendIcon(
                          metric.value,
                          previousSummary.metrics[
                            Object.keys(summary.metrics)[index] as keyof typeof summary.metrics
                          ]
                        )}
                      </Box>
                      <StarRating 
                        value={metric.value} 
                        size="small" 
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};