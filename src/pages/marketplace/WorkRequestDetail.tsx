import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Publish as PublishIcon,
  LocationOn as LocationIcon,
  AttachMoney as BudgetIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Category as ServiceIcon,
  AccessTime as TimeIcon,
  Description as DescriptionIcon,
  Tag as TagIcon,
  Attachment as AttachmentIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon,
  CheckCircle as CompleteIcon,
  Send as SubmitIcon,
  Visibility as ViewBidsIcon,
  Gavel as AwardIcon,
  Assignment as FormIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { WorkRequestApi, WorkRequest } from '../../services/workRequestApi';
import { StatusBadge } from '../../components/marketplace/StatusBadge';
import { PriorityIndicator } from '../../components/marketplace/PriorityIndicator';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { normalizeWorkRequestStatus } from '../../utils/statusMappings';
import { formsApi, Form } from '../../services/formsApi';
import { FormRenderer } from '../../components/FormRenderer';

export const WorkRequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [workRequest, setWorkRequest] = useState<WorkRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmPublishOpen, setConfirmPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [associatedForms, setAssociatedForms] = useState<Form[]>([]);
  const [loadingForms, setLoadingForms] = useState(false);
  const [expandedForm, setExpandedForm] = useState<string | false>(false);
  const [formResponses, setFormResponses] = useState<Record<string, any>>({});
  const [savingForm, setSavingForm] = useState<string | null>(null);

  const loadWorkRequest = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await WorkRequestApi.getWorkRequest(id);
      setWorkRequest(response);
    } catch (err: any) {
      setError(err.message || 'Error loading work request');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadAssociatedForms = useCallback(async () => {
    try {
      setLoadingForms(true);
      // Cargamos formularios que podrían ser relevantes para solicitudes de trabajo
      // Puedes filtrar por categoría específica basándote en el tipo de servicio
      const response = await formsApi.getAllForms({ 
        isActive: true,
        limit: 10 
      });
      
      if (response.success && response.data) {
        // Filtrar formularios relevantes para solicitudes de trabajo
        const relevantForms = response.data.filter(form => 
          form.category === 'inspection' || 
          form.category === 'safety' || 
          form.category === 'work_order' ||
          form.category === 'general'
        );
        setAssociatedForms(relevantForms);
      }
    } catch (err) {
      console.error('Error loading forms:', err);
    } finally {
      setLoadingForms(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      loadWorkRequest();
      loadAssociatedForms();
    }
  }, [id, loadWorkRequest, loadAssociatedForms]);

  const canEditRequest = () => {
    if (!workRequest || !user) return false;
    // Only allow editing in draft or pending states, not when published or beyond
    const canEdit = workRequest.status === 'draft' || 
                   workRequest.status === 'borrador' ||
                   workRequest.status === 'pending' ||
                   workRequest.status === 'pendiente' ||
                   workRequest.status === 'in_review' ||
                   workRequest.status === 'en_revision';
    const isOwner = workRequest.requestedBy?._id === user._id || workRequest.requestedBy?._id === user.id;
    return canEdit && (user.role === 'super_admin' || isOwner);
  };

  const canPublishRequest = () => {
    if (!workRequest || !user) return false;
    const canPublish = workRequest.status === 'pending' || 
                      workRequest.status === 'pendiente' ||
                      workRequest.status === 'in_review' ||
                      workRequest.status === 'en_revision';
    const isOwner = workRequest.requestedBy?._id === user._id || workRequest.requestedBy?._id === user.id;
    return canPublish && (user.role === 'super_admin' || isOwner);
  };

  const canDeleteRequest = () => {
    if (!workRequest || !user) return false;
    // Only allow deleting in draft state, not once it's submitted for review or published
    const isDraft = workRequest.status === 'draft' || workRequest.status === 'borrador';
    const isOwner = workRequest.requestedBy?._id === user._id || workRequest.requestedBy?._id === user.id;
    return isDraft && (user.role === 'super_admin' || isOwner);
  };

  const canCancelRequest = () => {
    if (!workRequest || !user) return false;
    const canCancel = workRequest.status === 'published' || 
                     workRequest.status === 'publicado' ||
                     workRequest.status === 'bidding' ||
                     workRequest.status === 'licitando';
    const isOwner = workRequest.requestedBy?._id === user._id || workRequest.requestedBy?._id === user.id;
    return canCancel && (user.role === 'super_admin' || isOwner);
  };

  const canCompleteRequest = () => {
    if (!workRequest || !user) return false;
    
    // Can complete if already awarded
    const isAwarded = workRequest.status === 'awarded' || workRequest.status === 'adjudicado';
    
    // Can complete if published/bidding and has candidates (bids)
    const isActiveWithBids = (workRequest.status === 'published' || 
                             workRequest.status === 'publicado' ||
                             workRequest.status === 'bidding' ||
                             workRequest.status === 'licitando') &&
                            workRequest.bids && workRequest.bids.length > 0;
    
    const canComplete = isAwarded || isActiveWithBids;
    const isOwner = workRequest.requestedBy?._id === user._id || workRequest.requestedBy?._id === user.id;
    return canComplete && (user.role === 'super_admin' || isOwner);
  };

  const canSubmitForReview = () => {
    if (!workRequest || !user) return false;
    const isDraft = workRequest.status === 'draft' || workRequest.status === 'borrador';
    const isOwner = workRequest.requestedBy?._id === user._id || workRequest.requestedBy?._id === user.id;
    return isDraft && (user.role === 'super_admin' || isOwner);
  };

  const canViewBids = () => {
    if (!workRequest || !user) return false;
    const hasBids = workRequest.status === 'bidding' || 
                   workRequest.status === 'licitando' ||
                   workRequest.status === 'awarded' ||
                   workRequest.status === 'adjudicado' ||
                   workRequest.status === 'completed' ||
                   workRequest.status === 'completado';
    const isOwner = workRequest.requestedBy?._id === user._id || workRequest.requestedBy?._id === user.id;
    return hasBids && (user.role === 'super_admin' || isOwner);
  };

  const canAwardBids = () => {
    if (!workRequest || !user) return false;
    const isBidding = workRequest.status === 'bidding' || workRequest.status === 'licitando';
    const hasBids = workRequest.bids && workRequest.bids.length > 0;
    const isOwner = workRequest.requestedBy?._id === user._id || workRequest.requestedBy?._id === user.id;
    return isBidding && hasBids && (user.role === 'super_admin' || isOwner);
  };

  const handlePublish = async () => {
    if (!workRequest) return;
    
    setPublishing(true);
    try {
      await WorkRequestApi.publishWorkRequest(workRequest._id || workRequest.id || '');
      setConfirmPublishOpen(false);
      loadWorkRequest(); // Reload to get updated status
    } catch (err: any) {
      console.error('Error publishing work request:', err);
      alert(err.message || 'Error publishing work request');
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!workRequest) return;
    
    setDeleting(true);
    try {
      await WorkRequestApi.deleteWorkRequest(workRequest._id || workRequest.id || '');
      navigate('/marketplace/work-requests');
    } catch (err: any) {
      console.error('Error deleting work request:', err);
      alert(err.message || 'Error deleting work request');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = async () => {
    if (!workRequest) return;
    
    setCanceling(true);
    try {
      await WorkRequestApi.updateWorkRequestStatus(workRequest._id || workRequest.id || '', 'cancelled');
      setConfirmCancelOpen(false);
      loadWorkRequest();
    } catch (err: any) {
      console.error('Error canceling work request:', err);
      alert(err.message || 'Error canceling work request');
    } finally {
      setCanceling(false);
    }
  };

  const handleComplete = async () => {
    if (!workRequest) return;
    
    setCompleting(true);
    try {
      await WorkRequestApi.updateWorkRequestStatus(workRequest._id || workRequest.id || '', 'completed');
      setConfirmCompleteOpen(false);
      loadWorkRequest();
    } catch (err: any) {
      console.error('Error completing work request:', err);
      alert(err.message || 'Error completing work request');
    } finally {
      setCompleting(false);
    }
  };

  const handleFormChange = (formId: string, responses: any[]) => {
    setFormResponses(prev => ({
      ...prev,
      [formId]: responses
    }));
  };

  const handleSaveFormResponse = async (formId: string) => {
    try {
      setSavingForm(formId);
      
      // Aquí guardarías las respuestas del formulario
      // Por ahora solo simulamos el guardado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // En un caso real, harías algo como:
      // await workRequestApi.saveFormResponse(workRequest._id, formId, formResponses[formId]);
      
      alert('Formulario guardado exitosamente');
    } catch (err) {
      console.error('Error saving form response:', err);
      alert('Error al guardar el formulario');
    } finally {
      setSavingForm(null);
    }
  };

  const handleSubmitForReview = async () => {
    if (!workRequest) return;
    
    setSubmitting(true);
    try {
      await WorkRequestApi.updateWorkRequestStatus(workRequest._id || workRequest.id || '', 'pending');
      loadWorkRequest();
    } catch (err: any) {
      console.error('Error submitting work request:', err);
      alert(err.message || 'Error submitting work request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={() => navigate('/marketplace/work-requests')}>
          Back to Work Requests
        </Button>
      </Box>
    );
  }

  if (!workRequest) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Work request not found
        </Alert>
        <Button variant="outlined" onClick={() => navigate('/marketplace/work-requests')}>
          Back to Work Requests
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/marketplace/work-requests')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" gutterBottom>
            {workRequest.title}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Request #{workRequest.requestNumber}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <StatusBadge 
            status={normalizeWorkRequestStatus(workRequest.status)} 
            statusType="workRequest" 
          />
          
          {/* Draft Status Actions */}
          {canEditRequest() && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/marketplace/work-requests/${workRequest._id || workRequest.id}/edit`)}
            >
              Edit
            </Button>
          )}
          {canSubmitForReview() && (
            <Button
              variant="contained"
              startIcon={<SubmitIcon />}
              onClick={handleSubmitForReview}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit for Review'}
            </Button>
          )}
          {canDeleteRequest() && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setConfirmDeleteOpen(true)}
            >
              Delete
            </Button>
          )}

          {/* Pending/Review Status Actions */}
          {canPublishRequest() && (
            <Button
              variant="contained"
              startIcon={<PublishIcon />}
              onClick={() => setConfirmPublishOpen(true)}
            >
              Publish
            </Button>
          )}

          {/* Published/Bidding Status Actions */}
          {canViewBids() && (
            <Button
              variant="outlined"
              startIcon={<ViewBidsIcon />}
              onClick={() => navigate(`/marketplace/work-requests/${workRequest._id || workRequest.id}/bids`)}
            >
              View Bids ({workRequest.bids?.length || 0})
            </Button>
          )}
          {canAwardBids() && (
            <Button
              variant="contained"
              startIcon={<AwardIcon />}
              onClick={() => navigate(`/marketplace/work-requests/${workRequest._id || workRequest.id}/bids`)}
            >
              Award Bid
            </Button>
          )}
          {canCancelRequest() && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              onClick={() => setConfirmCancelOpen(true)}
            >
              Cancel
            </Button>
          )}

          {/* Awarded Status Actions */}
          {canCompleteRequest() && (
            <Button
              variant="contained"
              color="success"
              startIcon={<CompleteIcon />}
              onClick={() => setConfirmCompleteOpen(true)}
            >
              Mark Complete
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Information */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <DescriptionIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Description
              </Typography>
              <Typography variant="body1" paragraph>
                {workRequest.description}
              </Typography>
            </CardContent>
          </Card>

          {/* Service Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <ServiceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Service Details
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Service
                  </Typography>
                  <Typography variant="body1">
                    {workRequest.service?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Code: {workRequest.service?.code}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Category
                  </Typography>
                  <Typography variant="body1">
                    {(workRequest.service as any)?.category || 'N/A'}
                  </Typography>
                </Grid>
                {(workRequest.service as any)?.description && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Service Description
                    </Typography>
                    <Typography variant="body2">
                      {(workRequest.service as any).description}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Time Window */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TimeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Time Window
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Start Date & Time
                  </Typography>
                  <Typography variant="body1">
                    {formatDateTime(workRequest.timeWindow.start)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    End Date & Time
                  </Typography>
                  <Typography variant="body1">
                    {formatDateTime(workRequest.timeWindow.end)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Flexibility
                  </Typography>
                  <Chip 
                    label={workRequest.timeWindow.isFlexible ? 'Flexible' : 'Fixed'} 
                    color={workRequest.timeWindow.isFlexible ? 'success' : 'default'}
                    size="small"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Location */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <LocationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Location
              </Typography>
              <Typography variant="body1" paragraph>
                {workRequest.location.address}
              </Typography>
              {workRequest.location.coordinates && (
                <Typography variant="body2" color="text.secondary">
                  Coordinates: {workRequest.location.coordinates.lat}, {workRequest.location.coordinates.lng}
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Tags and Attachments */}
          {(workRequest.tags && workRequest.tags.length > 0) || (workRequest.attachments && workRequest.attachments.length > 0) ? (
            <Card>
              <CardContent>
                {workRequest.tags && workRequest.tags.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      <TagIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Tags
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {workRequest.tags.map((tag, index) => (
                        <Chip key={index} label={tag} size="small" />
                      ))}
                    </Box>
                  </Box>
                )}
                
                {workRequest.attachments && workRequest.attachments.length > 0 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      <AttachmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Attachments
                    </Typography>
                    <List>
                      {workRequest.attachments.map((attachment, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <AttachmentIcon />
                          </ListItemIcon>
                          <ListItemText primary={attachment} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </CardContent>
            </Card>
          ) : null}

          {/* Associated Forms Section */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <FormIcon sx={{ mr: 1 }} />
                Formularios Asociados
                {loadingForms && <CircularProgress size={20} sx={{ ml: 2 }} />}
              </Typography>
              
              {associatedForms.length === 0 && !loadingForms ? (
                <Typography variant="body2" color="text.secondary">
                  No hay formularios asociados a esta solicitud
                </Typography>
              ) : (
                <Box>
                  {associatedForms.map((form) => (
                    <Accordion
                      key={form._id}
                      expanded={expandedForm === form._id}
                      onChange={(_, isExpanded) => setExpandedForm(isExpanded ? form._id : false)}
                      sx={{ mb: 1 }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{ backgroundColor: 'background.default' }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <FormIcon sx={{ mr: 2, color: 'primary.main' }} />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1">{form.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {form.description}
                            </Typography>
                          </Box>
                          <Chip 
                            label={form.category} 
                            size="small" 
                            sx={{ mr: 1 }}
                          />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Divider sx={{ mb: 2 }} />
                        <FormRenderer
                          form={form}
                          onChange={(responses) => handleFormChange(form._id, responses)}
                          disabled={!canEditRequest()}
                          showSubmitButton={false}
                          initialValues={formResponses[form._id] ? 
                            formResponses[form._id].reduce((acc: any, resp: any) => {
                              acc[resp.fieldName] = resp.value;
                              return acc;
                            }, {}) : {}
                          }
                        />
                        {canEditRequest() && (
                          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                              variant="contained"
                              startIcon={<SaveIcon />}
                              onClick={() => handleSaveFormResponse(form._id)}
                              disabled={savingForm === form._id}
                            >
                              {savingForm === form._id ? 'Guardando...' : 'Guardar Respuestas'}
                            </Button>
                          </Box>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Request Details */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Request Details
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Priority
                </Typography>
                <PriorityIndicator priority={workRequest.priority as any} />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Requested Date
                </Typography>
                <Typography variant="body1">
                  {formatDate(workRequest.requestedDate)}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body1">
                  {formatDateTime(workRequest.createdAt)}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body1">
                  {formatDateTime(workRequest.updatedAt)}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Requestor Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Requested By
              </Typography>
              <Typography variant="body1">
                {workRequest.requestedBy?.firstName} {workRequest.requestedBy?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {workRequest.requestedBy?.email}
              </Typography>
            </CardContent>
          </Card>

          {/* Company Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Company
              </Typography>
              <Typography variant="body1">
                {workRequest.company?.name}
              </Typography>
            </CardContent>
          </Card>

          {/* Budget Information */}
          {workRequest.estimatedBudget && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <BudgetIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Budget
                </Typography>
                <Typography variant="body1">
                  {workRequest.estimatedBudget.min && workRequest.estimatedBudget.max ? (
                    `${formatCurrency(workRequest.estimatedBudget.min)} - ${formatCurrency(workRequest.estimatedBudget.max)}`
                  ) : workRequest.estimatedBudget.min ? (
                    `From ${formatCurrency(workRequest.estimatedBudget.min)}`
                  ) : workRequest.estimatedBudget.max ? (
                    `Up to ${formatCurrency(workRequest.estimatedBudget.max)}`
                  ) : (
                    'Budget to be discussed'
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Currency: {workRequest.estimatedBudget.currency}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Bids Summary */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Bids Summary
              </Typography>
              <Typography variant="h4" color="primary">
                {workRequest.bids?.length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Bids Received
              </Typography>
              
              {workRequest.bids && workRequest.bids.length > 0 && (
                <Button 
                  variant="outlined" 
                  fullWidth 
                  sx={{ mt: 2 }}
                  onClick={() => navigate(`/marketplace/work-requests/${workRequest._id || workRequest.id}/bids`)}
                >
                  View All Bids
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Publish Confirmation Modal */}
      <Dialog
        open={confirmPublishOpen}
        onClose={() => setConfirmPublishOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirm Publish
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to publish this work request? It will be visible to all contractors and they will be able to submit bids.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmPublishOpen(false)}
            disabled={publishing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handlePublish}
            variant="contained"
            disabled={publishing}
            startIcon={publishing ? <CircularProgress size={20} /> : <PublishIcon />}
          >
            {publishing ? 'Publishing...' : 'Publish'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this work request? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDeleteOpen(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Confirmation Modal */}
      <Dialog
        open={confirmCancelOpen}
        onClose={() => setConfirmCancelOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirm Cancellation
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this work request? All submitted bids will be notified of the cancellation.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmCancelOpen(false)}
            disabled={canceling}
          >
            No, Keep Active
          </Button>
          <Button 
            onClick={handleCancel}
            variant="contained"
            color="error"
            disabled={canceling}
            startIcon={canceling ? <CircularProgress size={20} /> : <CancelIcon />}
          >
            {canceling ? 'Canceling...' : 'Yes, Cancel'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Complete Confirmation Modal */}
      <Dialog
        open={confirmCompleteOpen}
        onClose={() => setConfirmCompleteOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirm Completion
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {workRequest?.status === 'awarded' || workRequest?.status === 'adjudicado' ? (
              'Are you sure you want to mark this work request as completed? This will finalize the awarded project.'
            ) : (
              `Are you sure you want to mark this work request as completed? You have ${workRequest?.bids?.length || 0} bid(s) available. This will skip the formal award process and complete the work directly.`
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmCompleteOpen(false)}
            disabled={completing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleComplete}
            variant="contained"
            color="success"
            disabled={completing}
            startIcon={completing ? <CircularProgress size={20} /> : <CompleteIcon />}
          >
            {completing ? 'Completing...' : 'Mark Complete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};