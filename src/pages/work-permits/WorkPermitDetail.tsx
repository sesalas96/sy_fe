import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Chip,
  Button,
  Breadcrumbs,
  Link,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Stack,
  CircularProgress,
  IconButton,
  Snackbar,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  Avatar,
  Select,
  MenuItem,
  ListItemAvatar,
  InputAdornment,
  InputLabel,
  ListItemButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Edit as EditIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  Build as BuildIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Schedule as ScheduleIcon,
  Comment as CommentIcon,
  Close as CloseIcon,
  LocationOn as LocationIcon,
  Check as CheckIcon,
  ChevronRight as ChevronRightIcon,
  ContentCopy as ContentCopyIcon,
  Send as SendIcon,
  Info as InfoIcon,
  AttachFile as DocumentIcon,
  History as HistoryIcon,
  CheckBox as ApprovalIcon,
  Business as BusinessIcon,
  AdminPanelSettings as AdminIcon,
  HowToReg as ApproverIcon,
  RemoveRedEye as ReviewerIcon,
  GroupAdd as GroupAddIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { WorkPermit, UserRole, AssociatedForm, FormResponse } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import WorkPermitApi, { ApprovalData } from '../../services/workPermitApi';
import { formsApi, Form } from '../../services/formsApi';
import { FormRenderer } from '../../components/FormRenderer';

export const WorkPermitDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, hasRole } = useAuth();
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm')); // < 600px
  const isSm = useMediaQuery(theme.breakpoints.down('md')); // < 900px
  const isMobile = isSm; // For backward compatibility
  
  const [workPermit, setWorkPermit] = useState<WorkPermit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [approvalComments, setApprovalComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<'supervisor' | 'hse' | 'seguridad' | null>(null);
  const [copySnackbar, setCopySnackbar] = useState(false);
  const [signingPermit, setSigningPermit] = useState(false);
  
  // User management state
  const [userManagementOpen, setUserManagementOpen] = useState(false);
  const [userSelectionOpen, setUserSelectionOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'approver' | 'reviewer'>('reviewer');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [permitUsers, setPermitUsers] = useState<Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'admin' | 'approver' | 'reviewer';
  }>>([]);
  const [availableUsers] = useState<Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: string;
  }>>([
    { _id: '4', firstName: 'Ana', lastName: 'Martínez', email: 'ana.martinez@example.com', department: 'Seguridad' },
    { _id: '5', firstName: 'Roberto', lastName: 'Sánchez', email: 'roberto.sanchez@example.com', department: 'Verificadores' },
    { _id: '6', firstName: 'Laura', lastName: 'Rodríguez', email: 'laura.rodriguez@example.com', department: 'Operaciones' },
    { _id: '7', firstName: 'Diego', lastName: 'Fernández', email: 'diego.fernandez@example.com', department: 'Seguridad' },
    { _id: '8', firstName: 'Patricia', lastName: 'García', email: 'patricia.garcia@example.com', department: 'Verificadores' },
  ]);

  // Forms management state
  const [availableForms, setAvailableForms] = useState<Form[]>([]);
  const [loadingForms, setLoadingForms] = useState(false);
  const [formsDialogOpen, setFormsDialogOpen] = useState(false);
  const [expandedForm, setExpandedForm] = useState<string | false>(false);
  const [formResponses, setFormResponses] = useState<Record<string, any>>({});
  const [savingForm, setSavingForm] = useState<string | null>(null);
  const [formsSearchTerm, setFormsSearchTerm] = useState('');

  useEffect(() => {
    const loadWorkPermit = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const permit = await WorkPermitApi.getWorkPermit(id!);
        
        // Debug: log the permit to see the structure
        console.log('Loaded work permit:', permit);
        
        // Ensure arrays are initialized
        if (permit) {
          const safePermit = {
            ...permit,
            identifiedRisks: permit.identifiedRisks || [],
            toolsToUse: permit.toolsToUse || [],
            requiredPPE: permit.requiredPPE || [],
            safetyControls: permit.safetyControls || [],
            approvals: permit.approvals || [],
            associatedForms: permit.associatedForms || []
          };
          setWorkPermit(safePermit);
          
          // Load forms if there are associated forms
          if (safePermit.associatedForms.length > 0) {
            await loadAvailableForms();
          }
        } else {
          setWorkPermit(permit);
        }
        
        // Contractor details are already embedded in the permit object
      } catch (err: any) {
        setError(err.message || 'Error al cargar el permiso de trabajo');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadWorkPermit();
    }
  }, [id]);

  const handleEdit = () => {
    navigate(`/work-permits/${id}/edit`);
  };

  const handleBack = () => {
    navigate('/work-permits');
  };

  const handleCopyId = async () => {
    const permitId = workPermit?.permitNumber || workPermit?._id;
    if (permitId) {
      try {
        await navigator.clipboard.writeText(permitId);
        setCopySnackbar(true);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleSignPermit = async () => {
    if (!workPermit) return;
    
    setSigningPermit(true);
    setError(null);
    
    try {
      await WorkPermitApi.signWorkPermit(workPermit._id);
      // Reload the permit data to get updated status
      const updatedPermit = await WorkPermitApi.getWorkPermit(id!);
      
      if (updatedPermit) {
        const safeUpdatedPermit = {
          ...updatedPermit,
          identifiedRisks: updatedPermit.identifiedRisks || [],
          toolsToUse: updatedPermit.toolsToUse || [],
          requiredPPE: updatedPermit.requiredPPE || [],
          safetyControls: updatedPermit.safetyControls || [],
          approvals: updatedPermit.approvals || [],
          associatedForms: updatedPermit.associatedForms || []
        };
        setWorkPermit(safeUpdatedPermit);
      }
    } catch (err: any) {
      setError(err.message || 'Error al firmar el permiso de trabajo');
    } finally {
      setSigningPermit(false);
    }
  };

  const getStatusChip = (status: string) => {
    const statusConfig: { [key: string]: { label: string; color: 'warning' | 'success' | 'error' | 'default' | 'info'; icon: React.ReactElement } } = {
      borrador: { label: 'Borrador', color: 'default', icon: <EditIcon /> },
      pendiente: { label: 'Pendiente', color: 'warning', icon: <PendingIcon /> },
      aprobado: { label: 'Aprobado', color: 'success', icon: <CheckCircleIcon /> },
      rechazado: { label: 'Rechazado', color: 'error', icon: <CancelIcon /> },
      expirado: { label: 'Expirado', color: 'default', icon: <ScheduleIcon /> },
      cancelado: { label: 'Cancelado', color: 'info', icon: <CloseIcon /> }
    };

    const config = statusConfig[status] || statusConfig.pendiente;
    return (
      <Chip
        label={config.label}
        color={config.color}
        icon={config.icon}
        size="medium"
      />
    );
  };


  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-CR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString('es-CR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canApprove = () => {
    if (!workPermit || workPermit.status !== 'pendiente') return false;
    
    // Check user role and pending approvals
    const userDepartments: { [key in UserRole]?: Array<'supervisor' | 'hse' | 'seguridad'> } = {
      [UserRole.CLIENT_SUPERVISOR]: ['supervisor'],
      [UserRole.CLIENT_APPROVER]: ['hse'],
      [UserRole.SAFETY_STAFF]: ['seguridad']
    };

    const allowedDepartments = userDepartments[user?.role as UserRole] || [];
    
    // Check if there are pending approvals for user's departments
    return workPermit.approvals.some(approval => 
      allowedDepartments.includes(approval.department) && 
      approval.status === 'pendiente'
    );
  };

  const getUserDepartments = (): Array<'supervisor' | 'hse' | 'seguridad'> => {
    const userDepartments: { [key in UserRole]?: Array<'supervisor' | 'hse' | 'seguridad'> } = {
      [UserRole.CLIENT_SUPERVISOR]: ['supervisor'],
      [UserRole.CLIENT_APPROVER]: ['hse'],
      [UserRole.SAFETY_STAFF]: ['seguridad']
    };

    return userDepartments[user?.role as UserRole] || [];
  };

  const handleApprovalClick = (action: 'approve' | 'reject') => {
    setApprovalAction(action);
    setApprovalComments('');
    setSelectedDepartment(null);
    setApprovalDialogOpen(true);
  };

  const handleApprovalSubmit = async () => {
    if (!selectedDepartment) {
      setError('Debe seleccionar un departamento');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const approvalData: ApprovalData = {
        action: approvalAction,
        department: selectedDepartment,
        comments: approvalComments || undefined
      };

      await WorkPermitApi.approveWorkPermit(id!, approvalData);
      // Reload the permit data
      const updatedPermit = await WorkPermitApi.getWorkPermit(id!);
      
      // Ensure arrays are initialized for updated permit
      if (updatedPermit) {
        const safeUpdatedPermit = {
          ...updatedPermit,
          identifiedRisks: updatedPermit.identifiedRisks || [],
          toolsToUse: updatedPermit.toolsToUse || [],
          requiredPPE: updatedPermit.requiredPPE || [],
          safetyControls: updatedPermit.safetyControls || [],
          approvals: updatedPermit.approvals || [],
          associatedForms: updatedPermit.associatedForms || []
        };
        setWorkPermit(safeUpdatedPermit);
      } else {
        setWorkPermit(updatedPermit);
      }
      setApprovalDialogOpen(false);
    } catch (err: any) {
      setError(err.message || 'Error al procesar la aprobación');
    } finally {
      setSubmitting(false);
    }
  };

  const getSafetyControlsDisplay = () => {
    if (!workPermit || !workPermit.safetyControls) return [];
    
    return (workPermit.safetyControls || []).map(control => ({
      label: control?.item || '',
      checked: control?.checked || false,
      notes: control?.notes || ''
    }));
  };

  const handleOpenUserManagement = () => {
    // Mock data for users - in real implementation, fetch from API
    setPermitUsers([
      {
        _id: '1',
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@example.com',
        role: 'admin'
      },
      {
        _id: '2',
        firstName: 'María',
        lastName: 'González',
        email: 'maria.gonzalez@example.com',
        role: 'approver'
      },
      {
        _id: '3',
        firstName: 'Carlos',
        lastName: 'López',
        email: 'carlos.lopez@example.com',
        role: 'reviewer'
      }
    ]);
    setUserManagementOpen(true);
  };

  const handleCloseUserManagement = () => {
    setUserManagementOpen(false);
  };

  const handleAddUser = (userId: string) => {
    const user = availableUsers.find(u => u._id === userId);
    if (user && !permitUsers.some(pu => pu._id === userId)) {
      setPermitUsers([...permitUsers, { ...user, role: selectedRole }]);
    }
  };

  const handleOpenUserSelection = () => {
    setUserSelectionOpen(true);
    setUserSearchTerm('');
    setSelectedRole('reviewer');
  };

  const handleCloseUserSelection = () => {
    setUserSelectionOpen(false);
    setUserSearchTerm('');
  };

  const getFilteredUsers = () => {
    const existingUserIds = (permitUsers || []).map(u => u._id);
    return (availableUsers || []).filter(user => 
      user && !existingUserIds.includes(user._id) &&
      ((user.firstName || '').toLowerCase().includes(userSearchTerm.toLowerCase()) ||
       (user.lastName || '').toLowerCase().includes(userSearchTerm.toLowerCase()) ||
       (user.email || '').toLowerCase().includes(userSearchTerm.toLowerCase()) ||
       (user.department && user.department.toLowerCase().includes(userSearchTerm.toLowerCase())))
    );
  };

  const handleRemoveUser = (userId: string) => {
    setPermitUsers((permitUsers || []).filter(u => u && u._id !== userId));
  };

  const handleChangeUserRole = (userId: string, newRole: 'admin' | 'approver' | 'reviewer') => {
    setPermitUsers((permitUsers || []).map(u => 
      u && u._id === userId ? { ...u, role: newRole } : u
    ).filter(Boolean));
  };

  const getInitials = (firstName: string, lastName: string) => {
    const first = (firstName || '').charAt(0);
    const last = (lastName || '').charAt(0);
    return `${first}${last}`.toUpperCase() || 'NN';
  };

  const getRoleColor = (role: 'admin' | 'approver' | 'reviewer') => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'approver':
        return 'primary';
      case 'reviewer':
        return 'success';
      default:
        return 'default';
    }
  };

  const getRoleIcon = (role: 'admin' | 'approver' | 'reviewer') => {
    switch (role) {
      case 'admin':
        return <AdminIcon fontSize="small" />;
      case 'approver':
        return <ApproverIcon fontSize="small" />;
      case 'reviewer':
        return <ReviewerIcon fontSize="small" />;
    }
  };

  // Form management functions
  const loadAvailableForms = async () => {
    setLoadingForms(true);
    try {
      const response = await formsApi.getAllForms({ limit: 100, isActive: true });
      if (response.success && response.data) {
        setAvailableForms(response.data);
      }
    } catch (error) {
      console.error('Error loading forms:', error);
    } finally {
      setLoadingForms(false);
    }
  };

  const handleOpenFormsDialog = async () => {
    setFormsDialogOpen(true);
    if (availableForms.length === 0) {
      await loadAvailableForms();
    }
  };

  const handleAddForm = async (formId: string) => {
    if (!workPermit || !user) return;
    
    const form = availableForms.find(f => f._id === formId);
    if (!form) return;

    // Create new associated form
    const newAssociatedForm: AssociatedForm = {
      formId: form._id,
      formName: form.name,
      formCategory: form.category,
      addedAt: new Date().toISOString(),
      addedBy: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName
      },
      status: 'pending'
    };

    // Update local state
    const updatedPermit = {
      ...workPermit,
      associatedForms: [...(workPermit.associatedForms || []), newAssociatedForm]
    };
    setWorkPermit(updatedPermit);

    // TODO: Call API to save the associated form
    // await WorkPermitApi.addAssociatedForm(workPermit._id, newAssociatedForm);
  };

  const handleRemoveForm = async (formId: string) => {
    if (!workPermit) return;

    // Update local state
    const updatedPermit = {
      ...workPermit,
      associatedForms: workPermit.associatedForms?.filter(f => f.formId !== formId) || []
    };
    setWorkPermit(updatedPermit);

    // TODO: Call API to remove the associated form
    // await WorkPermitApi.removeAssociatedForm(workPermit._id, formId);
  };

  const handleSaveFormResponse = async (formId: string, responses: any) => {
    if (!workPermit || !user) return;
    
    setSavingForm(formId);
    try {
      // Update local state
      const updatedAssociatedForms = workPermit.associatedForms?.map(form => {
        if (form.formId === formId) {
          const formResponses: FormResponse[] = Object.entries(responses).map(([fieldId, value]) => ({
            fieldId,
            fieldName: fieldId, // This should come from the actual field data
            fieldType: 'text', // This should come from the actual field data
            value,
            answeredAt: new Date().toISOString(),
            answeredBy: {
              _id: user._id,
              firstName: user.firstName,
              lastName: user.lastName
            }
          }));

          return {
            ...form,
            responses: formResponses,
            status: 'completed' as const,
            completedAt: new Date().toISOString(),
            completedBy: {
              _id: user._id,
              firstName: user.firstName,
              lastName: user.lastName
            }
          };
        }
        return form;
      });

      const updatedPermit = {
        ...workPermit,
        associatedForms: updatedAssociatedForms
      };
      setWorkPermit(updatedPermit);

      // TODO: Call API to save form responses
      // await WorkPermitApi.saveFormResponses(workPermit._id, formId, responses);
    } catch (error) {
      console.error('Error saving form responses:', error);
    } finally {
      setSavingForm(null);
    }
  };

  const getFilteredForms = () => {
    const associatedFormIds = (workPermit?.associatedForms || []).map(f => f?.formId).filter(Boolean) || [];
    return (availableForms || []).filter(form => 
      form && !associatedFormIds.includes(form._id) &&
      ((form.name || '').toLowerCase().includes(formsSearchTerm.toLowerCase()) ||
       (form.description || '').toLowerCase().includes(formsSearchTerm.toLowerCase()) ||
       (form.category || '').toLowerCase().includes(formsSearchTerm.toLowerCase()))
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !workPermit) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={handleBack}>
          Volver
        </Button>
      </Box>
    );
  }

  if (!workPermit) {
    return null;
  }

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          variant="body1"
          onClick={handleBack}
          sx={{ textDecoration: 'none' }}
        >
          Permisos de Trabajo
        </Link>
        <Typography color="text.primary">Detalle del Permiso</Typography>
      </Breadcrumbs>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {workPermit.status === 'rechazado' && (() => {
        const rejectedApproval = workPermit.approvals.find(a => a.status === 'rechazado');
        return rejectedApproval?.comments ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Motivo de Rechazo:
            </Typography>
            <Typography variant="body2">
              {rejectedApproval.comments}
            </Typography>
          </Alert>
        ) : null;
      })()}

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant={isMobile ? "h5" : "h4"} sx={{ mb: 0.5 }}>
              <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Permiso de Trabajo
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant={isMobile ? "h6" : "h5"} color="primary" fontWeight="bold">
                #{workPermit.permitNumber || workPermit._id}
              </Typography>
              <IconButton 
                size="small" 
                onClick={handleCopyId}
                title="Copiar ID"
                sx={{ color: 'primary.main' }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            {getStatusChip(workPermit.status)}
            {workPermit.status === 'borrador' && (
              <Button
                variant="contained"
                color="primary"
                startIcon={signingPermit ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                onClick={handleSignPermit}
                disabled={signingPermit}
                size={isMobile ? "small" : "medium"}
              >
                {signingPermit ? 'Enviando...' : 'Firmar y Enviar'}
              </Button>
            )}
            {(workPermit.status === 'borrador' || 
              (workPermit.status === 'pendiente' && hasRole([UserRole.CLIENT_SUPERVISOR, UserRole.CLIENT_APPROVER, UserRole.SAFETY_STAFF]))) && (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEdit}
                size={isMobile ? "small" : "medium"}
              >
                Editar
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider', 
        mb: 3,
        mx: { xs: -2, sm: -3, md: -4 }, // Negative margins to extend to screen edges
        px: { xs: 2, sm: 3, md: 4 } // Add padding back inside
      }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{

            '& .MuiTabs-scroller': {
              overflow: 'auto !important'
            },
            '& .MuiTab-root': {
              minWidth: { xs: 'auto', sm: 160 },
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              padding: { xs: '6px 8px', sm: '12px 16px' },
              '& .MuiTab-iconWrapper': {
                fontSize: { xs: '1.2rem', sm: '1.5rem' }
              }
            },
            '& .MuiTabScrollButton-root': {
              width: { xs: 32, sm: 40 },
              '&.Mui-disabled': {
                opacity: 0.3
              }
            }
          }}
        >
          <Tab 
            icon={<InfoIcon />} 
            label={isXs ? "Info" : "Información General"}
            iconPosition="start"
            sx={{ minHeight: { xs: 48, sm: 64 } }}
          />
          <Tab 
            icon={<ApprovalIcon />} 
            label={isXs ? "Aprob." : "Aprobaciones"}
            iconPosition="start"
            sx={{ minHeight: { xs: 48, sm: 64 } }}
          />
          <Tab 
            icon={<DocumentIcon />} 
            label={isXs ? "Docs" : "Documentos"}
            iconPosition="start"
            sx={{ minHeight: { xs: 48, sm: 64 } }}
          />
          <Tab 
            icon={<HistoryIcon />} 
            label={isXs ? "Hist." : "Historial"}
            iconPosition="start"
            sx={{ minHeight: { xs: 48, sm: 64 } }}
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Información Principal */}
          <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información General
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" color="text.secondary">
                    Descripción del Trabajo
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {workPermit.workDescription}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Usuarios Asignados
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={handleOpenUserManagement}
                        sx={{ ml: 1 }}
                      >
                        <GroupAddIcon />
                      </IconButton>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {/* Mock users - in real implementation, these would come from the permit data */}
                      <Chip
                        avatar={<Avatar sx={{ 
                          bgcolor: getRoleColor('admin'),
                          width: isXs ? 24 : 32,
                          height: isXs ? 24 : 32,
                          fontSize: isXs ? '0.75rem' : '0.875rem'
                        }}>JP</Avatar>}
                        label={isXs ? "J. Pérez" : "Juan Pérez"}
                        color={getRoleColor('admin')}
                        icon={getRoleIcon('admin')}
                        size={isXs ? "small" : "medium"}
                        sx={{ 
                          '& .MuiChip-icon': { 
                            ml: 0.5, 
                            mr: -0.5,
                            fontSize: isXs ? '1rem' : '1.25rem'
                          },
                          fontWeight: 500
                        }}
                      />
                      <Chip
                        avatar={<Avatar sx={{ 
                          bgcolor: getRoleColor('approver'),
                          width: isXs ? 24 : 32,
                          height: isXs ? 24 : 32,
                          fontSize: isXs ? '0.75rem' : '0.875rem'
                        }}>MG</Avatar>}
                        label={isXs ? "M. González" : "María González"}
                        color={getRoleColor('approver')}
                        icon={getRoleIcon('approver')}
                        size={isXs ? "small" : "medium"}
                        sx={{ 
                          '& .MuiChip-icon': { 
                            ml: 0.5, 
                            mr: -0.5,
                            fontSize: isXs ? '1rem' : '1.25rem'
                          },
                          fontWeight: 500
                        }}
                      />
                      <Chip
                        avatar={<Avatar sx={{ 
                          bgcolor: getRoleColor('reviewer'),
                          width: isXs ? 24 : 32,
                          height: isXs ? 24 : 32,
                          fontSize: isXs ? '0.75rem' : '0.875rem'
                        }}>CL</Avatar>}
                        label={isXs ? "C. López" : "Carlos López"}
                        color={getRoleColor('reviewer')}
                        icon={getRoleIcon('reviewer')}
                        size={isXs ? "small" : "medium"}
                        sx={{ 
                          '& .MuiChip-icon': { 
                            ml: 0.5, 
                            mr: -0.5,
                            fontSize: isXs ? '1rem' : '1.25rem'
                          },
                          fontWeight: 500
                        }}
                      />
                    </Box>
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AdminIcon fontSize="small" sx={{ color: 'error.main' }} />
                            Admin
                          </Box>
                          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ApproverIcon fontSize="small" sx={{ color: 'primary.main' }} />
                            Aprobador
                          </Box>
                          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ReviewerIcon fontSize="small" sx={{ color: 'success.main' }} />
                            Revisor
                          </Box>
                        </Box>
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Espacio de trabajo
                      </Typography>
                      <Typography variant="body1">
                        {workPermit.company?.name || 'No especificada'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Ubicación
                      </Typography>
                      <Typography variant="body1">
                        {workPermit.location}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Fecha de Inicio
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(workPermit.startDate)}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Fecha de Fin
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(workPermit.endDate)}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Horario
                  </Typography>
                  <Typography variant="body1">
                    {workPermit.workHours?.start && workPermit.workHours?.end 
                      ? `${workPermit.workHours.start} - ${workPermit.workHours.end}`
                      : typeof workPermit.workHours === 'string' ? workPermit.workHours : 'No especificado'
                    }
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Riesgos y Controles */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Riesgos y Controles de Seguridad
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Riesgos Identificados
                  </Typography>
                  <List dense>
                    {(workPermit.identifiedRisks || []).map((risk, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <ChevronRightIcon />
                        </ListItemIcon>
                        <ListItemText primary={risk} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Controles de Seguridad
                  </Typography>
                  <List dense>
                    {getSafetyControlsDisplay().map((control, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckIcon color="success" />
                        </ListItemIcon>
                        <ListItemText primary={control.label} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Herramientas y EPP */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Herramientas y Equipo de Protección Personal
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    <BuildIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Herramientas a Utilizar
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {(workPermit.toolsToUse || []).map((tool, index) => (
                      <Chip key={index} label={tool} variant="outlined" />
                    ))}
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    EPP Requerido
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {(workPermit.requiredPPE || []).map((epp, index) => (
                      <Chip key={index} label={epp} variant="outlined" color="primary" />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Formularios Asociados */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Formularios Asociados
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleOpenFormsDialog}
                  size="small"
                >
                  Agregar Formulario
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {workPermit?.associatedForms && Array.isArray(workPermit.associatedForms) && workPermit.associatedForms.length > 0 ? (
                <Box>
                  {workPermit.associatedForms.map((associatedForm) => (
                    <Accordion
                      key={associatedForm.formId}
                      expanded={expandedForm === associatedForm.formId}
                      onChange={(_, isExpanded) => setExpandedForm(isExpanded ? associatedForm.formId : false)}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1">{associatedForm.formName}</Typography>
                            <Chip
                              label={associatedForm.formCategory}
                              size="small"
                              variant="outlined"
                            />
                            {associatedForm.status === 'completed' ? (
                              <Chip
                                label="Completado"
                                size="small"
                                color="success"
                                icon={<CheckCircleIcon />}
                              />
                            ) : associatedForm.status === 'in_progress' ? (
                              <Chip
                                label="En Progreso"
                                size="small"
                                color="warning"
                                icon={<PendingIcon />}
                              />
                            ) : (
                              <Chip
                                label="Pendiente"
                                size="small"
                                color="default"
                                icon={<PendingIcon />}
                              />
                            )}
                          </Box>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveForm(associatedForm.formId);
                            }}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Agregado por {associatedForm.addedBy.firstName} {associatedForm.addedBy.lastName} el {formatDateTime(associatedForm.addedAt)}
                          </Typography>
                          {associatedForm.completedAt && associatedForm.completedBy && (
                            <Typography variant="body2" color="text.secondary">
                              Completado por {associatedForm.completedBy.firstName} {associatedForm.completedBy.lastName} el {formatDateTime(associatedForm.completedAt)}
                            </Typography>
                          )}
                        </Box>
                        
                        {/* Form Renderer */}
                        {(() => {
                          const foundForm = availableForms.find(f => f && f._id === associatedForm.formId);
                          return foundForm ? (
                            <Box>
                              <FormRenderer
                                form={foundForm}
                                initialValues={formResponses[associatedForm.formId] || {}}
                              onChange={(responses) => {
                                // FormRenderer passes FormResponse[], but we need to convert to Record<string, any>
                                const values = (responses || []).reduce((acc, response) => ({
                                  ...acc,
                                  [response?.fieldId || '']: response?.value
                                }), {});
                                setFormResponses({ ...formResponses, [associatedForm.formId]: values });
                              }}
                              disabled={associatedForm.status === 'completed'}
                              showSubmitButton={associatedForm.status !== 'completed'}
                              onSubmit={() => handleSaveFormResponse(associatedForm.formId, formResponses[associatedForm.formId])}
                            />
                            {associatedForm.status !== 'completed' && savingForm === associatedForm.formId && (
                              <Box sx={{ mt: 2, textAlign: 'center' }}>
                                <CircularProgress size={20} />
                              </Box>
                            )}
                          </Box>
                          ) : (
                            <Alert severity="warning">
                              Formulario no encontrado o no disponible
                            </Alert>
                          );
                        })()}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              ) : (
                <Alert severity="info">
                  No hay formularios asociados a este permiso de trabajo. Haga clic en "Agregar Formulario" para asociar formularios.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Estado de Aprobaciones
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List>
              {(workPermit.approvals || []).map((approval, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {approval.status === 'aprobado' ? (
                      <CheckCircleIcon color="success" />
                    ) : approval.status === 'rechazado' ? (
                      <CancelIcon color="error" />
                    ) : (
                      <PendingIcon color="warning" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={approval.department.toUpperCase()}
                    secondary={
                      <>
                        {approval.approver && (
                          <Typography variant="body2">
                            {approval.status === 'aprobado' ? 'Aprobado' : 'Rechazado'} por: {approval.approver.firstName} {approval.approver.lastName}
                          </Typography>
                        )}
                        {approval.approvedAt && (
                          <Typography variant="body2">
                            {formatDateTime(approval.approvedAt)}
                          </Typography>
                        )}
                        {approval.comments && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <CommentIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                            {approval.comments}
                          </Typography>
                        )}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>

            {canApprove() && (
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  onClick={() => handleApprovalClick('approve')}
                >
                  Aprobar
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  fullWidth
                  onClick={() => handleApprovalClick('reject')}
                >
                  Rechazar
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Documentos Adjuntos
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Alert severity="info">
              Próximamente: Gestión de documentos adjuntos al permiso de trabajo.
            </Alert>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Esta sección permitirá:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <DocumentIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Adjuntar documentos relacionados"
                    secondary="PDFs, imágenes, certificados, etc."
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <DocumentIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Visualizar y descargar archivos"
                    secondary="Acceso rápido a todos los documentos del permiso"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <DocumentIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Gestionar versiones"
                    secondary="Historial de cambios en documentos"
                  />
                </ListItem>
              </List>
            </Box>
          </CardContent>
        </Card>
      )}

      {activeTab === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Historial de Actividades
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Fecha de Creación
                </Typography>
                <Typography variant="body1">
                  {formatDateTime(workPermit.createdAt)}
                </Typography>
              </Box>
              
              {workPermit.updatedAt && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Última Actualización
                  </Typography>
                  <Typography variant="body1">
                    {formatDateTime(workPermit.updatedAt)}
                  </Typography>
                </Box>
              )}

              {workPermit.contractorSignature?.signed && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Firma del Contratista
                  </Typography>
                  <Typography variant="body1">
                    Firmado el {formatDateTime(workPermit.contractorSignature.signedAt)}
                  </Typography>
                </Box>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Alert severity="info">
                Próximamente: Historial completo de cambios y actividades del permiso.
              </Alert>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Aprobación */}
      <Dialog open={approvalDialogOpen} onClose={() => setApprovalDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {approvalAction === 'approve' ? 'Aprobar' : 'Rechazar'} Permiso de Trabajo
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <FormControl component="fieldset">
              <Typography variant="subtitle2" gutterBottom>
                Seleccione el departamento:
              </Typography>
              <RadioGroup
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value as any)}
              >
                {(getUserDepartments() || []).map((dept) => (
                  <FormControlLabel
                    key={dept}
                    value={dept}
                    control={<Radio />}
                    label={dept.toUpperCase()}
                    disabled={(workPermit.approvals || []).find(a => a.department === dept)?.status !== 'pendiente'}
                  />
                ))}
              </RadioGroup>
            </FormControl>

            <TextField
              label="Comentarios"
              multiline
              rows={4}
              value={approvalComments}
              onChange={(e) => setApprovalComments(e.target.value)}
              fullWidth
              placeholder={approvalAction === 'reject' ? 'Razón del rechazo (requerido)' : 'Comentarios adicionales (opcional)'}
              required={approvalAction === 'reject'}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialogOpen(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleApprovalSubmit}
            variant="contained"
            color={approvalAction === 'approve' ? 'success' : 'error'}
            disabled={submitting || !selectedDepartment || (approvalAction === 'reject' && !approvalComments)}
          >
            {submitting ? <CircularProgress size={24} /> : (approvalAction === 'approve' ? 'Aprobar' : 'Rechazar')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Copy Success Snackbar */}
      <Snackbar
        open={copySnackbar}
        autoHideDuration={2000}
        onClose={() => setCopySnackbar(false)}
        message="ID copiado al portapapeles"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      {/* User Management Dialog */}
      <Dialog
        open={userManagementOpen}
        onClose={handleCloseUserManagement}
        maxWidth="md"
        fullWidth
        fullScreen={isXs}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 0 },
          pb: { xs: 1, sm: 2 }
        }}>
          <Typography 
            variant={isXs ? "h6" : "h5"} 
            sx={{ 
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              textAlign: { xs: 'center', sm: 'left' },
              pr: { xs: 0, sm: 2 }
            }}
          >
            {isXs ? `Usuarios - #${workPermit?.permitNumber}` : `Gestión de Usuarios - Permiso #${workPermit?.permitNumber}`}
          </Typography>
          <IconButton 
            onClick={handleCloseUserManagement} 
            size={isXs ? "medium" : "small"}
            sx={{ 
              position: { xs: 'absolute', sm: 'relative' },
              top: { xs: 8, sm: 'auto' },
              right: { xs: 8, sm: 'auto' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent 
          dividers 
          sx={{ 
            px: { xs: 2, sm: 3 },
            py: { xs: 2, sm: 3 }
          }}
        >
          <Box sx={{ mb: { xs: 2, sm: 3 } }}>
            <Typography 
              variant="subtitle2" 
              color="text.secondary" 
              gutterBottom
              sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
            >
              Usuarios asignados a este permiso
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.8rem' },
                lineHeight: { xs: 1.3, sm: 1.4 },
                display: 'block'
              }}
            >
              {isXs 
                ? "Los usuarios tienen diferentes roles: Admin (gestiona), Aprobador (aprueba/rechaza), Revisor (ve y comenta)."
                : "Los usuarios pueden tener diferentes roles: Administradores pueden gestionar el permiso completo, Aprobadores pueden aprobar/rechazar, y Revisores solo pueden ver y comentar."
              }
            </Typography>
          </Box>

          <List sx={{ px: 0 }}>
            {permitUsers.map((user) => (
              <ListItem
                key={user._id}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'action.hover' },
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'stretch', sm: 'center' },
                  py: { xs: 2, sm: 1 },
                  px: { xs: 1, sm: 2 },
                  gap: { xs: 1, sm: 0 }
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  flex: 1,
                  gap: 2
                }}>
                  <ListItemAvatar sx={{ minWidth: { xs: 40, sm: 56 } }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: getRoleColor(user.role),
                        width: { xs: 32, sm: 40 },
                        height: { xs: 32, sm: 40 },
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }}
                    >
                      {getInitials(user.firstName, user.lastName)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        flexWrap: { xs: 'wrap', sm: 'nowrap' }
                      }}>
                        <Typography 
                          variant={isXs ? "body2" : "body1"}
                          sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                        >
                          {`${user.firstName} ${user.lastName}`}
                        </Typography>
                        {getRoleIcon(user.role)}
                      </Box>
                    }
                    secondary={
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ 
                          fontSize: { xs: '0.75rem', sm: '0.8rem' },
                          display: 'block',
                          mt: 0.5
                        }}
                      >
                        {user.email}
                      </Typography>
                    }
                  />
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  justifyContent: { xs: 'space-between', sm: 'flex-end' },
                  width: { xs: '100%', sm: 'auto' }
                }}>
                  <FormControl 
                    size="small" 
                    sx={{ 
                      minWidth: { xs: 100, sm: 120 },
                      flex: { xs: 1, sm: 'none' }
                    }}
                  >
                    <Select
                      value={user.role}
                      onChange={(e) => handleChangeUserRole(user._id, e.target.value as any)}
                      sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                    >
                      <MenuItem value="admin">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AdminIcon fontSize="small" />
                          {isXs ? "Admin" : "Admin"}
                        </Box>
                      </MenuItem>
                      <MenuItem value="approver">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ApproverIcon fontSize="small" />
                          {isXs ? "Aprob." : "Aprobador"}
                        </Box>
                      </MenuItem>
                      <MenuItem value="reviewer">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ReviewerIcon fontSize="small" />
                          {isXs ? "Rev." : "Revisor"}
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                  <IconButton
                    size={isXs ? "medium" : "small"}
                    color="error"
                    onClick={() => handleRemoveUser(user._id)}
                    sx={{ 
                      flexShrink: 0,
                      p: { xs: 1, sm: 0.5 }
                    }}
                  >
                    <PersonRemoveIcon fontSize={isXs ? "small" : "medium"} />
                  </IconButton>
                </Box>
              </ListItem>
            ))}
          </List>

          {permitUsers.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body2" color="text.secondary">
                No hay usuarios asignados a este permiso
              </Typography>
            </Box>
          )}

          <Button
            variant="outlined"
            startIcon={<PersonAddIcon />}
            fullWidth
            sx={{ 
              mt: 2,
              py: { xs: 1.5, sm: 1 },
              fontSize: { xs: '0.9rem', sm: '0.875rem' }
            }}
            onClick={handleOpenUserSelection}
          >
            {isXs ? "Agregar" : "Agregar Usuario"}
          </Button>
        </DialogContent>

        <DialogActions sx={{ 
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 1.5 },
          gap: { xs: 1, sm: 0 },
          flexDirection: { xs: 'column-reverse', sm: 'row' }
        }}>
          <Button 
            onClick={handleCloseUserManagement}
            fullWidth={isXs}
            sx={{ 
              py: { xs: 1.5, sm: 1 },
              fontSize: { xs: '0.9rem', sm: '0.875rem' }
            }}
          >
            Cerrar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCloseUserManagement}
            fullWidth={isXs}
            sx={{ 
              py: { xs: 1.5, sm: 1 },
              fontSize: { xs: '0.9rem', sm: '0.875rem' }
            }}
          >
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Selection Dialog */}
      <Dialog
        open={userSelectionOpen}
        onClose={handleCloseUserSelection}
        maxWidth="sm"
        fullWidth
        fullScreen={isXs}
      >
        <DialogTitle sx={{ 
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 2 }
        }}>
          <Typography 
            variant={isXs ? "h6" : "h5"}
            sx={{ 
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              textAlign: { xs: 'center', sm: 'left' }
            }}
          >
            {isXs ? "Seleccionar" : "Seleccionar Usuario"}
          </Typography>
        </DialogTitle>
        
        <DialogContent dividers>
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Buscar por nombre, email o departamento..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }
              }}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth size="small">
              <InputLabel>Rol del Usuario</InputLabel>
              <Select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                label="Rol del Usuario"
              >
                <MenuItem value="admin">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AdminIcon fontSize="small" />
                    Administrador
                  </Box>
                </MenuItem>
                <MenuItem value="approver">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ApproverIcon fontSize="small" />
                    Aprobador
                  </Box>
                </MenuItem>
                <MenuItem value="reviewer">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ReviewerIcon fontSize="small" />
                    Revisor
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>

          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {getFilteredUsers().map((user) => (
              <ListItemButton
                key={user._id}
                onClick={() => {
                  handleAddUser(user._id);
                  handleCloseUserSelection();
                }}
                sx={{
                  borderRadius: 1,
                  mb: 1
                }}
              >
                <ListItemAvatar>
                  <Avatar>{getInitials(user.firstName, user.lastName)}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${user.firstName} ${user.lastName}`}
                  secondary={
                    <Box>
                      <Typography variant="body2" component="span">
                        {user.email}
                      </Typography>
                      {user.department && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          {user.department}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItemButton>
            ))}
          </List>

          {getFilteredUsers().length === 0 && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body2" color="text.secondary">
                {userSearchTerm 
                  ? 'No se encontraron usuarios que coincidan con la búsqueda'
                  : 'No hay usuarios disponibles para agregar'}
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseUserSelection}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Forms Selection Dialog */}
      <Dialog
        open={formsDialogOpen}
        onClose={() => setFormsDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isXs}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Seleccionar Formulario</Typography>
            <IconButton
              edge="end"
              color="inherit"
              onClick={() => setFormsDialogOpen(false)}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Buscar formularios..."
              value={formsSearchTerm}
              onChange={(e) => setFormsSearchTerm(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: formsSearchTerm && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setFormsSearchTerm('')}
                      >
                        <CloseIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />
          </Box>

          {loadingForms ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {getFilteredForms().map((form) => (
                <ListItem
                  key={form._id}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <ListItemButton
                    onClick={() => {
                      handleAddForm(form._id);
                      setFormsDialogOpen(false);
                      setFormsSearchTerm('');
                    }}
                    sx={{ flexGrow: 1, py: 2 }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.light' }}>
                        <AssignmentIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" fontWeight="medium">
                            {form.name}
                          </Typography>
                          <Chip
                            label={form.category}
                            size="small"
                            variant="outlined"
                          />
                          {form.code && (
                            <Chip
                              label={form.code}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          {form.description && (
                            <Typography variant="body2" color="text.secondary">
                              {form.description}
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {(form.sections || []).length} secciones
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {(form.sections || []).reduce((acc, section) => acc + ((section?.fields || []).length), 0)} campos
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}

          {!loadingForms && getFilteredForms().length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                {formsSearchTerm 
                  ? 'No se encontraron formularios que coincidan con la búsqueda'
                  : 'No hay formularios disponibles para agregar'}
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => {
            setFormsDialogOpen(false);
            setFormsSearchTerm('');
          }}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};