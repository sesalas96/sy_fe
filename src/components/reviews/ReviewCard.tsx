import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  Chip,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Alert
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  AccessTime as PunctualityIcon,
  HighQuality as QualityIcon,
  Security as SafetyIcon,
  Forum as CommunicationIcon,
  Psychology as BehaviorIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Reply as ReplyIcon,
  Flag as FlagIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as CompanyIcon,
  Engineering as WorkIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { StarRating } from './StarRating';
import { Review } from '../../services/reviewsApi';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

interface ReviewCardProps {
  review: Review;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
  onFlag?: (reviewId: string, reason: string, description: string) => void;
  onRespond?: (reviewId: string, response: string) => void;
  showActions?: boolean;
  isContractorView?: boolean;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  onEdit,
  onDelete,
  onFlag,
  onRespond,
  showActions = true,
  isContractorView = false
}) => {
  const { user, hasRole } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [flagDescription, setFlagDescription] = useState('');
  const [responseText, setResponseText] = useState('');

  const canEdit = user?._id === review.reviewer._id && 
    new Date(review.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000; // 24 hours
  
  const canDelete = hasRole([UserRole.SUPER_ADMIN, UserRole.SAFETY_STAFF]) ||
    user?._id === review.reviewer._id;

  const canRespond = isContractorView && 
    user?._id === review.contractor._id && 
    !review.response;

  const metrics = [
    { label: 'Puntualidad', value: review.punctuality, icon: <PunctualityIcon /> },
    { label: 'Calidad', value: review.quality, icon: <QualityIcon /> },
    { label: 'Seguridad', value: review.safety, icon: <SafetyIcon /> },
    { label: 'Comunicación', value: review.communication, icon: <CommunicationIcon /> },
    { label: 'Comportamiento', value: review.professionalBehavior, icon: <BehaviorIcon /> }
  ];

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleFlag = () => {
    handleMenuClose();
    setFlagDialogOpen(true);
  };

  const handleFlagSubmit = () => {
    if (flagReason && flagDescription && onFlag) {
      onFlag(review._id, flagReason, flagDescription);
      setFlagDialogOpen(false);
      setFlagReason('');
      setFlagDescription('');
    }
  };

  const handleResponse = () => {
    if (responseText.trim() && onRespond) {
      onRespond(review._id, responseText);
      setResponseDialogOpen(false);
      setResponseText('');
    }
  };

  return (
    <>
      <Card variant="outlined">
        <CardContent>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                {review.reviewer.firstName.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="medium">
                  {review.reviewer.firstName} {review.reviewer.lastName}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {review.reviewer.company && (
                    <>
                      <CompanyIcon fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        {review.reviewer.company.name}
                      </Typography>
                    </>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    • {format(new Date(review.createdAt), 'dd MMM yyyy', { locale: es })}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {showActions && (
              <IconButton size="small" onClick={handleMenuOpen}>
                <MoreIcon />
              </IconButton>
            )}
          </Box>

          {/* Project Info */}
          {(review.projectName || review.workType) && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
              {review.projectName && (
                <Typography variant="body2" fontWeight="medium">
                  {review.projectName}
                </Typography>
              )}
              {review.workType && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <WorkIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">
                    {review.workType}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Overall Rating */}
          <Box sx={{ mb: 2 }}>
            <StarRating 
              value={review.rating} 
              showLabel 
              showNumeric 
              size="medium"
            />
          </Box>

          {/* Metrics Grid */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {metrics.map((metric) => (
              <Grid size={{ xs: 6, sm: 4, md: 2.4 }} key={metric.label}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <Box sx={{ color: 'text.secondary', mb: 0.5 }}>
                    {metric.icon}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {metric.label}
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {metric.value}/5
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Would Hire Again */}
          <Box sx={{ mb: 2 }}>
            <Chip
              icon={review.wouldHireAgain ? <ThumbUpIcon /> : <ThumbDownIcon />}
              label={review.wouldHireAgain ? 'Lo contrataría de nuevo' : 'No lo contrataría de nuevo'}
              color={review.wouldHireAgain ? 'success' : 'default'}
              variant={review.wouldHireAgain ? 'filled' : 'outlined'}
              size="small"
            />
          </Box>

          {/* Comment */}
          <Typography variant="body2" sx={{ mb: 2 }}>
            {review.comment}
          </Typography>

          {/* Tags */}
          {review.tags && review.tags.length > 0 && (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
              {review.tags.map((tag: string) => (
                <Chip key={tag} label={tag} size="small" variant="outlined" />
              ))}
            </Stack>
          )}

          {/* Contractor Response */}
          {review.response && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ReplyIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" color="primary">
                  Respuesta del Contratista
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  • {format(new Date(review.response.date), 'dd MMM yyyy', { locale: es })}
                </Typography>
              </Box>
              <Typography variant="body2">
                {review.response.text}
              </Typography>
            </Box>
          )}

          {/* Flagged Warning */}
          {review.flagged && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Esta evaluación ha sido marcada para revisión
            </Alert>
          )}

          {/* Actions for Contractor */}
          {canRespond && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                size="small"
                startIcon={<ReplyIcon />}
                onClick={() => setResponseDialogOpen(true)}
              >
                Responder
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {canEdit && onEdit && (
          <MenuItem onClick={() => { handleMenuClose(); onEdit(review); }}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Editar
          </MenuItem>
        )}
        {canDelete && onDelete && (
          <MenuItem onClick={() => { handleMenuClose(); onDelete(review._id); }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Eliminar
          </MenuItem>
        )}
        <MenuItem onClick={handleFlag}>
          <FlagIcon fontSize="small" sx={{ mr: 1 }} />
          Reportar
        </MenuItem>
      </Menu>

      {/* Flag Dialog */}
      <Dialog open={flagDialogOpen} onClose={() => setFlagDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reportar Evaluación</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Motivo"
            value={flagReason}
            onChange={(e) => setFlagReason(e.target.value)}
            margin="normal"
            select
          >
            <MenuItem value="inappropriate">Contenido inapropiado</MenuItem>
            <MenuItem value="false">Información falsa</MenuItem>
            <MenuItem value="spam">Spam</MenuItem>
            <MenuItem value="other">Otro</MenuItem>
          </TextField>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Descripción"
            value={flagDescription}
            onChange={(e) => setFlagDescription(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFlagDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleFlagSubmit} variant="contained" disabled={!flagReason || !flagDescription}>
            Reportar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onClose={() => setResponseDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Responder a la Evaluación</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Tu respuesta será visible públicamente. Sé profesional y constructivo.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Tu respuesta"
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="Agradezco el feedback..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResponseDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleResponse} variant="contained" disabled={!responseText.trim()}>
            Enviar Respuesta
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};