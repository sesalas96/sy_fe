import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Rating,
  Chip,
  Avatar,
  Stack,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Alert
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Flag as FlagIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Review } from '../../types';

interface ReviewListProps {
  reviews: Review[];
  loading?: boolean;
  error?: string;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
  onFlag?: (reviewId: string) => void;
  showActions?: boolean;
  currentUserId?: string;
}

interface MetricItemProps {
  label: string;
  value: number;
}

const MetricItem: React.FC<MetricItemProps> = ({ label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
    <Typography variant="body2" color="text.secondary">
      {label}:
    </Typography>
    <Rating value={value} readOnly size="small" precision={0.1} />
  </Box>
);

export const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  loading,
  error,
  onEdit,
  onDelete,
  onFlag,
  showActions = false,
  currentUserId
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedReview, setSelectedReview] = React.useState<Review | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, review: Review) => {
    setAnchorEl(event.currentTarget);
    setSelectedReview(review);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedReview(null);
  };

  const handleEdit = () => {
    if (selectedReview && onEdit) {
      onEdit(selectedReview);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedReview && onDelete) {
      onDelete(selectedReview._id);
    }
    handleMenuClose();
  };

  const handleFlag = () => {
    if (selectedReview && onFlag) {
      onFlag(selectedReview._id);
    }
    handleMenuClose();
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Cargando evaluaciones...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">
          No hay evaluaciones disponibles
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Stack spacing={2}>
        {reviews.map((review) => {
          const isOwnReview = currentUserId && review.reviewer?._id === currentUserId;

          return (
            <Card key={review._id} variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ width: 48, height: 48 }}>
                      {review.reviewer?.firstName?.[0] || ''}{review.reviewer?.lastName?.[0] || ''}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {review.reviewer?.firstName || ''} {review.reviewer?.lastName || ''}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {review.reviewer.company?.name || 'Sin empresa'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Box sx={{ textAlign: 'right' }}>
                      <Rating value={review.rating} readOnly precision={0.1} />
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(review.createdAt), 'dd MMM yyyy', { locale: es })}
                      </Typography>
                    </Box>
                    {showActions && (isOwnReview || onFlag) && (
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, review)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    )}
                  </Box>
                </Box>

                {review.projectName && (
                  <Typography variant="body2" color="primary" gutterBottom>
                    Proyecto: {review.projectName}
                  </Typography>
                )}

                {review.workType && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Tipo de trabajo: {review.workType}
                  </Typography>
                )}

                <Typography variant="body1" sx={{ my: 2 }}>
                  {review.comment}
                </Typography>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <MetricItem label="Puntualidad" value={review.punctuality} />
                    <MetricItem label="Calidad" value={review.quality} />
                    <MetricItem label="Seguridad" value={review.safety} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <MetricItem label="Comunicación" value={review.communication} />
                    <MetricItem label="Comportamiento Profesional" value={review.professionalBehavior} />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {review.wouldHireAgain ? (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="Lo contrataría nuevamente"
                        color="success"
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      <Chip
                        icon={<CancelIcon />}
                        label="No lo contrataría nuevamente"
                        color="error"
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  {review.tags && review.tags.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {review.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  )}
                </Box>

                {review.flagged?.isFlagged && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Esta evaluación ha sido marcada como inapropiada
                    </Typography>
                  </Alert>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedReview && currentUserId && selectedReview.reviewer?._id === currentUserId && (
          <>
            {onEdit && (
              <MenuItem onClick={handleEdit}>
                Editar evaluación
              </MenuItem>
            )}
            {onDelete && (
              <MenuItem onClick={handleDelete}>
                Eliminar evaluación
              </MenuItem>
            )}
          </>
        )}
        {onFlag && (
          <MenuItem onClick={handleFlag}>
            <FlagIcon sx={{ mr: 1, fontSize: 20 }} />
            Marcar como inapropiada
          </MenuItem>
        )}
      </Menu>
    </>
  );
};