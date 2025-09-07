import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Autocomplete,
  Stepper,
  Step,
  StepLabel,
  Paper
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Publish as PublishIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { WorkRequestApi, WorkRequest } from '../../services/workRequestApi';
import { ServicesApi, Service } from '../../services/servicesApi';
import { CompanyService } from '../../services/companyService';
import { Company } from '../../types';
import { LocationPicker } from '../../components/marketplace/LocationPicker';
import { PriorityIndicator } from '../../components/marketplace/PriorityIndicator';

interface WorkRequestFormData {
  title: string;
  description: string;
  serviceId: string;
  companyId: string;
  priority: 'baja' | 'media' | 'alta' | 'urgente';
  requestedDate: string;
  timeWindow: {
    start: string;
    end: string;
  };
  location: {
    address: string;
    coordinates?: { lat: number; lng: number };
  };
  budget: number;
  currency: string;
  requirements: string[];
}

const steps = ['Basic Info', 'Location & Schedule', 'Budget & Requirements', 'Review'];

export const WorkRequestForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isEditing = Boolean(id);

  // State
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<WorkRequestFormData>({
    title: '',
    description: '',
    serviceId: '',
    companyId: user?.companyId || user?.company?._id || '',
    priority: 'media',
    requestedDate: '',
    timeWindow: { start: '08:00', end: '17:00' },
    location: { address: '' },
    budget: 0,
    currency: 'USD',
    requirements: []
  });
  const [services, setServices] = useState<Service[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Permissions
  const canCreateRequests = useCallback(() => {
    return ['super_admin', 'safety_staff', 'client_supervisor', 'client_approver'].includes(user?.role || '');
  }, [user?.role]);

  const loadServices = useCallback(async () => {
    try {
      const response = await ServicesApi.getServices({ isActive: true });
      setServices(response.services);
    } catch (err) {
      console.error('Error loading services:', err);
      setError('Error loading services');
    }
  }, []);

  const loadCompanies = useCallback(async () => {
    try {
      const companiesData = await CompanyService.getCompanies({ status: 'active' });
      setCompanies(companiesData);
    } catch (err) {
      console.error('Error loading companies:', err);
    }
  }, []);

  const loadWorkRequest = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const workRequest = await WorkRequestApi.getWorkRequest(id);
      
      // Extract time from ISO datetime strings preserving local time
      const extractTime = (isoString: string) => {
        const date = new Date(isoString);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      };
      

      setFormData({
        title: workRequest.title,
        description: workRequest.description,
        serviceId: workRequest.service?._id || workRequest.serviceId || '',
        companyId: workRequest.company?._id || workRequest.clientCompanyId || '',
        priority: workRequest.priority as 'baja' | 'media' | 'alta' | 'urgente',
        requestedDate: workRequest.requestedDate ? workRequest.requestedDate.split('T')[0] : 
                      workRequest.requestedStartDate ? workRequest.requestedStartDate.split('T')[0] : '',
        timeWindow: {
          start: workRequest.timeWindow?.start ? extractTime(workRequest.timeWindow.start) : '08:00',
          end: workRequest.timeWindow?.end ? extractTime(workRequest.timeWindow.end) : '17:00'
        },
        location: {
          address: typeof workRequest.location === 'string' ? workRequest.location : workRequest.location?.address || '',
          coordinates: workRequest.location?.coordinates
        },
        budget: workRequest.budget || workRequest.estimatedBudget?.max || workRequest.estimatedBudget?.min || 0,
        currency: workRequest.currency || workRequest.estimatedBudget?.currency || 'USD',
        requirements: workRequest.requirements || []
      });
    } catch (err) {
      console.error('Error loading work request:', err);
      setError('Error loading work request');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Load data
  useEffect(() => {
    if (!canCreateRequests()) {
      navigate('/unauthorized');
      return;
    }

    loadServices();
    loadCompanies();
    if (isEditing) {
      loadWorkRequest();
    }
  }, [id, isEditing, canCreateRequests, navigate, loadServices, loadCompanies, loadWorkRequest]);

  // Handlers
  const handleInputChange = (field: keyof WorkRequestFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handleLocationChange = (location: { address: string; coordinates?: { lat: number; lng: number } }) => {
    setFormData(prev => ({
      ...prev,
      location
    }));
  };

  const handleRequirementsChange = (event: React.SyntheticEvent, value: string[]) => {
    setFormData(prev => ({
      ...prev,
      requirements: value
    }));
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        if (!formData.title.trim()) {
          setError('Title is required');
          return false;
        }
        if (!formData.serviceId) {
          setError('Service is required');
          return false;
        }
        if (!formData.companyId) {
          setError('Company is required');
          return false;
        }
        break;
      case 1:
        if (!formData.location.address.trim()) {
          setError('Location is required');
          return false;
        }
        if (!formData.requestedDate) {
          setError('Requested date is required');
          return false;
        }
        if (!formData.timeWindow.start) {
          setError('Start time is required');
          return false;
        }
        if (!formData.timeWindow.end) {
          setError('End time is required');
          return false;
        }
        // Convert time strings to comparable numbers (minutes since midnight)
        const timeToMinutes = (time: string) => {
          const [hours, minutes] = time.split(':').map(Number);
          return hours * 60 + minutes;
        };
        
        if (timeToMinutes(formData.timeWindow.start) >= timeToMinutes(formData.timeWindow.end)) {
          setError('End time must be after start time');
          return false;
        }
        break;
      case 2:
        if (formData.budget <= 0) {
          setError('Budget must be greater than 0');
          return false;
        }
        break;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (publish: boolean = false) => {
    if (!validateStep(activeStep)) return;

    try {
      setLoading(true);
      setError(null);

      // Create full ISO datetime strings for the time window
      const requestDate = formData.requestedDate;
      const startTime = formData.timeWindow.start;
      const endTime = formData.timeWindow.end;
      
      // Convert to full datetime strings
      const startDateTime = new Date(`${requestDate}T${startTime}:00`).toISOString();
      const endDateTime = new Date(`${requestDate}T${endTime}:00`).toISOString();

      // Base request data
      const baseData: any = {
        title: formData.title,
        description: formData.description,
        service: formData.serviceId, // Backend expects 'service' not 'serviceId'
        company: formData.companyId || null, // Use company from form
        priority: formData.priority,
        requestedDate: formData.requestedDate,
        timeWindow: {
          start: startDateTime,
          end: endDateTime
        },
        location: {
          address: formData.location.address,
          coordinates: formData.location.coordinates
        },
        estimatedBudget: {
          min: formData.budget,
          max: formData.budget,
          currency: formData.currency
        },
        requirements: formData.requirements
      };

      // Only add these fields for new requests
      const requestData: any = isEditing ? baseData : {
        ...baseData,
        client: user?._id || user?.id || '',
        attachments: [],
        requestNumber: `WR-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
      };

      console.log('Request data being sent:', requestData);
      console.log('Is editing:', isEditing);
      console.log('Work request ID:', id);

      let savedRequest: WorkRequest;

      if (isEditing && id) {
        console.log('Updating work request with ID:', id);
        savedRequest = await WorkRequestApi.updateWorkRequest(id, requestData);
      } else {
        savedRequest = await WorkRequestApi.createWorkRequest(requestData);
      }

      if (publish && (savedRequest._id || savedRequest.id)) {
        const requestId = savedRequest._id || savedRequest.id;
        if (requestId) {
          // Direct publish - the work request already has its biddingDeadline set
          await WorkRequestApi.publishWorkRequest(requestId);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/marketplace/work-requests');
      }, 1500);

    } catch (err: any) {
      console.error('Error saving work request:', err);
      setError(err.message || 'Error saving work request');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedService = () => {
    return services.find(s => s._id === formData.serviceId);
  };

  const getSelectedCompany = () => {
    return companies.find(c => c._id === formData.companyId);
  };

  const priorities = [
    { value: 'baja', label: 'Baja', color: 'success' },
    { value: 'media', label: 'Media', color: 'info' },
    { value: 'alta', label: 'Alta', color: 'warning' },
    { value: 'urgente', label: 'Urgente', color: 'error' }
  ] as const;

  const currencies = ['USD', 'EUR', 'CRC'];

  if (loading && !formData.title) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Request Title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
                placeholder="e.g., Electrical outlet installation in office building"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth required>
                <InputLabel>Service Type</InputLabel>
                <Select
                  value={formData.serviceId}
                  label="Service Type"
                  onChange={(e) => handleInputChange('serviceId', e.target.value)}
                  renderValue={(selected) => {
                    if (!selected) return '';
                    const service = services.find(s => s._id === selected);
                    return service ? service.name : '';
                  }}
                >
                  {services.map((service) => (
                    <MenuItem key={service._id} value={service._id}>
                      <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {service.name}
                          </Typography>
                          <Chip 
                            label={`$${service.basePrice}/${service.billingUnit}`}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {service.category?.name || 'No Category'}
                          </Typography>
                          <Chip 
                            label={service.riskLevel}
                            size="small"
                            color={
                              service.riskLevel === 'bajo' ? 'success' :
                              service.riskLevel === 'medio' ? 'warning' :
                              service.riskLevel === 'alto' || service.riskLevel === 'crítico' ? 'error' : 'default'
                            }
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          {service.description.length > 100 
                            ? `${service.description.substring(0, 100)}...` 
                            : service.description
                          }
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth required>
                <InputLabel>Company</InputLabel>
                <Select
                  value={formData.companyId}
                  label="Company"
                  onChange={(e) => handleInputChange('companyId', e.target.value)}
                >
                  {companies.map((company) => (
                    <MenuItem key={company._id} value={company._id}>
                      <Box sx={{ width: '100%' }}>
                        <Typography variant="body1">{company.name}</Typography>
                        {company.ruc && (
                          <Typography variant="caption" color="text.secondary">
                            RUC: {company.ruc}
                          </Typography>
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  label="Priority"
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  renderValue={(value) => (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PriorityIndicator priority={value as any} />
                    </Box>
                  )}
                >
                  {priorities.map((priority) => (
                    <MenuItem key={priority.value} value={priority.value}>
                      <PriorityIndicator priority={priority.value} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                multiline
                rows={4}
                required
                placeholder="Provide detailed description of the work needed..."
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationIcon sx={{ mr: 1 }} />
                Work Location
              </Typography>
              <LocationPicker
                value={formData.location}
                onChange={handleLocationChange}
                withMap
                withCurrentLocation
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Requested Date"
                type="date"
                value={formData.requestedDate}
                onChange={(e) => handleInputChange('requestedDate', e.target.value)}
                required
                slotProps={{ 
                  inputLabel: { shrink: true },
                  htmlInput: { min: new Date().toISOString().split('T')[0] }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Start Time"
                type="time"
                value={formData.timeWindow.start}
                onChange={(e) => handleInputChange('timeWindow', { ...formData.timeWindow, start: e.target.value })}
                required
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="End Time"
                type="time"
                value={formData.timeWindow.end}
                onChange={(e) => handleInputChange('timeWindow', { ...formData.timeWindow, end: e.target.value })}
                required
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <MoneyIcon sx={{ mr: 1 }} />
                Budget & Requirements
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                fullWidth
                label="Budget"
                type="number"
                value={formData.budget}
                onChange={(e) => handleInputChange('budget', parseFloat(e.target.value) || 0)}
                required
                slotProps={{
                  htmlInput: { min: 0, step: 0.01 }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={formData.currency}
                  label="Currency"
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                >
                  {currencies.map((currency) => (
                    <MenuItem key={currency} value={currency}>
                      {currency}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Autocomplete
                multiple
                freeSolo
                options={[
                  'Certified electrician required',
                  'Safety equipment must be provided',
                  'Work during business hours only',
                  'Material approval needed',
                  'Testing and certification required'
                ]}
                value={formData.requirements}
                onChange={handleRequirementsChange}
                renderTags={(value: readonly string[], getTagProps) =>
                  value.map((option: string, index: number) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip
                        variant="outlined"
                        label={option}
                        key={key}
                        {...tagProps}
                      />
                    );
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Special Requirements"
                    placeholder="Add requirements (press Enter to add)"
                    helperText="Specify any special requirements or constraints"
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 3:
        const selectedService = getSelectedService();
        const selectedCompany = getSelectedCompany();
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>
                Review Work Request
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6">{formData.title}</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  {formData.description}
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                  <Chip label={`Service: ${selectedService?.name}`} />
                  <Chip label={`Company: ${selectedCompany?.name}`} />
                  <PriorityIndicator priority={formData.priority} />
                  <Chip label={`${formData.currency} ${formData.budget.toFixed(2)}`} />
                </Box>

                <Typography variant="subtitle2" gutterBottom>
                  Location: {formData.location.address}
                </Typography>
                <Typography variant="subtitle2" gutterBottom>
                  Schedule: {formData.requestedDate} from {formData.timeWindow.start} to {formData.timeWindow.end}
                </Typography>

                {formData.requirements.length > 0 && (
                  <>
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                      Requirements:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {formData.requirements.map((req, index) => (
                        <Chip key={index} label={req} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </>
                )}
              </Paper>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/marketplace/work-requests')}
          sx={{ mr: 2 }}
        >
          Back to Work Requests
        </Button>
        <Typography variant="h4">
          {isEditing ? 'Edit Work Request' : 'Create Work Request'}
        </Typography>
      </Box>

      {/* Stepper */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Work request saved successfully!
            </Alert>
          )}

          {renderStepContent(activeStep)}

          {/* Navigation */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0 || loading}
            >
              Back
            </Button>

            <Box sx={{ display: 'flex', gap: 1 }}>
              {activeStep === steps.length - 1 ? (
                <>
                  <Button
                    variant="outlined"
                    onClick={() => handleSubmit(false)}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  >
                    {isEditing ? 'Update' : 'Save Draft'}
                  </Button>
                  {!isEditing && (
                    <Button
                      variant="contained"
                      onClick={() => handleSubmit(true)}
                      disabled={loading}
                      startIcon={<PublishIcon />}
                    >
                      Save & Publish
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={loading}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};