import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  Alert,
  Breadcrumbs,
  Link,
  Chip,
  Autocomplete,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  FormControlLabel,
  Checkbox,
  FormGroup,
  FormLabel,
  CircularProgress,
  Snackbar,
  IconButton,
  LinearProgress,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Select,
  MenuItem,
  InputLabel,
  FormHelperText,
  Avatar,
  ListItemAvatar,
  ListItemButton,
  InputAdornment
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  LocationOn as LocationOnIcon,
  Route as RouteIcon,
  MyLocation as MyLocationIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import WorkPermitApi, { WorkPermitCreateData } from '../../services/workPermitApi';
import { CompanyService } from '../../services/companyService';
import { DepartmentService } from '../../services/departmentService';
import { workPermitTemplateApi, WorkPermitTemplate, TemplateForm } from '../../services/workPermitTemplateApi';
import { formsApi, Form } from '../../services/formsApi';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

interface LocationPoint {
  name: string;
  description?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  floor?: string;
  area?: string;
  reference?: string;
}

interface LocationData {
  type: 'point' | 'route' | 'area';
  generalArea?: string;
  point?: LocationPoint;
  route?: {
    name: string;
    description?: string;
    distance?: number;
    estimatedTime?: number;
    points: LocationPoint[];
  };
  notes?: string;
}

interface WorkPermitFormData {
  templateId?: string;
  category: string;
  companyId: string;
  contractorId?: string; // Opcional, se deriva del primer linkedUser
  linkedUsers: Array<{
    userId: string;
    role: 'principal' | 'support' | 'observer';
    firstName?: string;
    lastName?: string;
    email?: string;
  }>;
  workDescription: string;
  location: LocationData;
  startDate: string;
  endDate: string;
  workHoursStart: string;
  workHoursEnd: string;
  identifiedRisks: string[];
  toolsToUse: string[];
  requiredPPE: string[];
  safetyControls: {
    item: string;
    checked: boolean;
    notes?: string;
  }[];
  additionalControls: string;
  requiredApprovals: string[];
  templateForms: TemplateForm[];
  formResponses: Record<string, any[]>; // formId -> responses
}

const initialFormData: WorkPermitFormData = {
  templateId: '',
  category: '',
  companyId: '',
  contractorId: '',
  linkedUsers: [],
  workDescription: '',
  location: {
    type: 'area',
    generalArea: '',
    notes: ''
  },
  startDate: '',
  endDate: '',
  workHoursStart: '08:00',
  workHoursEnd: '17:00',
  identifiedRisks: [],
  toolsToUse: [],
  requiredPPE: [],
  safetyControls: [
    { item: 'Bloqueo y Etiquetado (LOTO)', checked: false, notes: '' },
    { item: 'Entrada a Espacios Confinados', checked: false, notes: '' },
    { item: 'Permiso de Trabajo en Caliente', checked: false, notes: '' },
    { item: 'Trabajo en Altura', checked: false, notes: '' },
    { item: 'Trabajo Eléctrico', checked: false, notes: '' },
    { item: 'Excavación', checked: false, notes: '' },
    { item: 'Manejo de Químicos', checked: false, notes: '' }
  ],
  additionalControls: '',
  requiredApprovals: [], // Las aprobaciones vendrán del template
  templateForms: [],
  formResponses: {}
};

const commonRisks = [
  'Riesgo eléctrico',
  'Trabajo en altura',
  'Espacios confinados',
  'Caída en altura',
  'Golpes por objetos',
  'Cortes',
  'Quemaduras',
  'Inhalación de humos',
  'Incendio',
  'Asfixia',
  'Intoxicación',
  'Derrumbe',
  'Caída de objetos',
  'Electrocución',
  'Ruido excesivo',
  'Exposición a químicos',
  'Radiación',
  'Vibraciones'
];

const commonTools = [
  'Multímetro',
  'Escalera',
  'Herramientas aisladas',
  'Andamios',
  'Arnés de seguridad',
  'Equipo de soldadura',
  'Herramientas eléctricas',
  'Maquinaria pesada',
  'Detector de gases',
  'Equipo de rescate',
  'Ventiladores',
  'Extintores',
  'Grúa',
  'Montacargas',
  'Taladros',
  'Cortadoras',
  'Compresores'
];

const commonPPE = [
  'Casco',
  'Guantes dieléctricos',
  'Arnés de seguridad',
  'Botas de seguridad',
  'Chaleco reflectivo',
  'Gafas de seguridad',
  'Máscara de soldar',
  'Protección auditiva',
  'Respirador',
  'Equipo autónomo',
  'Delantal de cuero',
  'Rodilleras',
  'Protección facial'
];

const categories = [
  { value: 'trabajo_altura', label: 'Trabajo en Altura' },
  { value: 'espacio_confinado', label: 'Espacios Confinados' },
  { value: 'trabajo_caliente', label: 'Trabajo en Caliente' },
  { value: 'excavacion', label: 'Excavaciones' },
  { value: 'electrico', label: 'Trabajo Eléctrico' },
  { value: 'quimico', label: 'Químicos Peligrosos' },
  { value: 'izaje', label: 'Izaje y Grúas' },
  { value: 'demolicion', label: 'Demolición' },
  { value: 'general', label: 'General' },
  { value: 'otro', label: 'Otros' }
];

const steps = [
  'Información General',
  'Riesgos y Herramientas',
  'EPP y Controles de Seguridad',
  'Formularios',
  'Aprobaciones Requeridas',
  'Resumen'
];

const stepsMobile = [
  'General',
  'Riesgos',
  'EPP',
  'Forms',
  'Aprobaciones',
  'Resumen'
];

export const WorkPermitForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { hasRole, user } = useAuth();
  const isEdit = Boolean(id);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Verificar permisos para crear/editar permisos de trabajo
  const canCreateOrEditPermit = () => {
    // VALIDADORES_OPS (guardias) no pueden crear ni editar permisos de trabajo
    return !hasRole([UserRole.VALIDADORES_OPS]);
  };

  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<WorkPermitFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [templates, setTemplates] = useState<WorkPermitTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateFormsDetail, setTemplateFormsDetail] = useState<Form[]>([]);
  const [loadingForms, setLoadingForms] = useState(false);
  const [addFormDialog, setAddFormDialog] = useState(false);
  const [availableForms, setAvailableForms] = useState<Form[]>([]);
  const [selectedFormsToAdd, setSelectedFormsToAdd] = useState<string[]>([]);

  // User selection state
  const [userSelectionOpen, setUserSelectionOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: string;
  }>>([]);
  const [selectedUserRole, setSelectedUserRole] = useState<'principal' | 'support' | 'observer'>('support');
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
    details?: string;
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const loadAvailableForms = async () => {
    try {
      const response = await formsApi.getAllForms({ isActive: true });
      if (response.success && response.data) {
        setAvailableForms(response.data);
      }
    } catch (error) {
      console.error('Error loading available forms:', error);
    }
  };

  useEffect(() => {
    loadCompanies();
    loadTemplates();
    loadAvailableForms();
    if (isEdit && id) {
      loadWorkPermit(id);
    }
  }, [isEdit, id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (formData.companyId) {
      loadDepartmentsByCompany(formData.companyId);
    } else {
      setDepartments([]);
      setFormData(prev => ({ ...prev, requiredApprovals: [] }));
    }
  }, [formData.companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCompanies = async () => {
    try {
      const companiesList = await CompanyService.getCompaniesForSelect();
      setCompanies(companiesList);
    } catch (error) {
      console.error('Error loading companies:', error);
      showSnackbar('Error al cargar las empresas', 'error');
    }
  };

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const response = await workPermitTemplateApi.getAllTemplates({ isActive: true });
      if (response.success && response.data) {
        setTemplates(response.data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      showSnackbar('Error al cargar los templates', 'error');
    } finally {
      setLoadingTemplates(false);
    }
  };


  const loadDepartmentsByCompany = async (companyId: string) => {
    try {
      const departmentsList = await DepartmentService.getApprovalDepartments(companyId);
      setDepartments(departmentsList.map(d => ({
        id: d._id,
        name: d.name,
        code: d.code
      })));
    } catch (error) {
      console.error('Error loading departments:', error);
      showSnackbar('Error al cargar los departamentos', 'error');
    }
  };

  const loadWorkPermit = async (permitId: string) => {
    try {
      setLoadingData(true);
      const permit = await WorkPermitApi.getWorkPermit(permitId);
      
      if (permit) {
        setFormData({
          templateId: '',
          category: permit.category || '',
          companyId: permit.company?._id || '',
          contractorId: permit.contractor?._id || '',
          linkedUsers: (permit as any).linkedUsers?.map((lu: any) => ({
            userId: typeof lu.user === 'string' ? lu.user : lu.user._id,
            role: lu.role,
            firstName: typeof lu.user === 'object' ? lu.user.firstName : '',
            lastName: typeof lu.user === 'object' ? lu.user.lastName : '',
            email: typeof lu.user === 'object' ? lu.user.email : ''
          })) || [],
          workDescription: permit.workDescription,
          location: (() => {
            // Convertir location string legacy a objeto
            if (typeof permit.location === 'string') {
              return { type: 'area' as const, generalArea: permit.location, notes: '' };
            }
            // Convertir location con type 'simple' a 'area'
            if (permit.location && permit.location.type === 'simple') {
              return {
                type: 'area' as const,
                generalArea: (permit.location as any).simpleLocation || permit.location.generalArea || '',
                notes: permit.location.notes || ''
              };
            }
            // Usar location object tal como está
            return permit.location || { type: 'area' as const, generalArea: '', notes: '' };
          })(),
          startDate: new Date(permit.startDate).toISOString().split('T')[0],
          endDate: new Date(permit.endDate).toISOString().split('T')[0],
          workHoursStart: permit.workHours?.start || '08:00',
          workHoursEnd: permit.workHours?.end || '17:00',
          identifiedRisks: permit.identifiedRisks || [],
          toolsToUse: permit.toolsToUse || [],
          requiredPPE: permit.requiredPPE || [],
          safetyControls: permit.safetyControls || initialFormData.safetyControls,
          additionalControls: permit.additionalControls || '',
          requiredApprovals: ['supervisor', 'hse', 'seguridad'],
          templateForms: [],
          formResponses: {}
        });
        
        showSnackbar(
          'Permiso de trabajo cargado',
          'info',
          'Se han cargado exitosamente los datos del permiso para edición.'
        );
      }
    } catch (error: any) {
      console.error('Error loading work permit:', error);
      const errorMessage = 'Error al cargar el permiso de trabajo';
      let errorDetails = '';
      
      if (error.response?.status === 404) {
        errorDetails = 'El permiso de trabajo no existe o ha sido eliminado.';
      } else if (error.response?.status === 403) {
        errorDetails = 'No tiene permisos para acceder a este permiso de trabajo.';
      } else {
        errorDetails = 'No se pudieron cargar los datos del permiso. Intente recargar la página.';
      }
      
      setSubmitError(errorMessage + ': ' + errorDetails);
      showSnackbar(errorMessage, 'error', errorDetails);
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (field: keyof WorkPermitFormData) => (
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

  const applyTemplate = async (templateId: string) => {
    try {
      const response = await workPermitTemplateApi.getTemplateById(templateId);
      
      if (response.success && response.data) {
        const template = response.data;
        const newFormData: Partial<WorkPermitFormData> = {};
        
        // Cargar categoría del template
        if (template.category) {
          newFormData.category = template.category;
        }
        
        // Cargar campos directos del template
        if (template.workDescription) {
          newFormData.workDescription = template.workDescription;
        }
        
        if (template.defaultLocation) {
          newFormData.location = typeof template.defaultLocation === 'string'
            ? { type: 'area', generalArea: template.defaultLocation, notes: '' }
            : template.defaultLocation;
        }
        
        if (template.identifiedRisks && Array.isArray(template.identifiedRisks)) {
          newFormData.identifiedRisks = template.identifiedRisks;
        }
        
        if (template.toolsToUse && Array.isArray(template.toolsToUse)) {
          newFormData.toolsToUse = template.toolsToUse;
        }
        
        if (template.requiredPPE && Array.isArray(template.requiredPPE)) {
          newFormData.requiredPPE = template.requiredPPE;
        }
        
        // Procesar safetyControls del template
        if (template.safetyControls && Array.isArray(template.safetyControls)) {
          newFormData.safetyControls = initialFormData.safetyControls.map(control => {
            // Buscar si este control está en el template
            const templateControl = template.safetyControls?.find((tc: any) => 
              tc.item.toLowerCase().includes(control.item.toLowerCase()) ||
              control.item.toLowerCase().includes(tc.item.toLowerCase())
            );
            
            if (templateControl) {
              return {
                ...control,
                checked: true,
                notes: templateControl.description || 'Requerido por template'
              };
            }
            
            return control;
          });
        }
        
        // Cargar aprobaciones requeridas
        if (template.requiredApprovals && Array.isArray(template.requiredApprovals)) {
          newFormData.requiredApprovals = template.requiredApprovals;
        }
        
        // Cargar formularios del template
        if (template.requiredForms && template.requiredForms.length > 0) {
          newFormData.templateForms = template.requiredForms;
          // Cargar los detalles de los formularios
          loadTemplateForms(template.requiredForms);
        }
        
        // Aplicar los cambios
        setFormData(prev => ({
          ...prev,
          templateId,
          ...newFormData
        }));
        
        // Crear un resumen de los campos cargados
        const camposCargados = [];
        if (newFormData.workDescription) camposCargados.push('Descripción del trabajo');
        if (newFormData.location) camposCargados.push('Ubicación');
        if (newFormData.identifiedRisks?.length) camposCargados.push(`${newFormData.identifiedRisks.length} riesgos`);
        if (newFormData.toolsToUse?.length) camposCargados.push(`${newFormData.toolsToUse.length} herramientas`);
        if (newFormData.requiredPPE?.length) camposCargados.push(`${newFormData.requiredPPE.length} EPP`);
        if (newFormData.safetyControls?.some(c => c.checked)) {
          const controlsCount = newFormData.safetyControls.filter(c => c.checked).length;
          camposCargados.push(`${controlsCount} controles de seguridad`);
        }
        if (newFormData.requiredApprovals?.length) camposCargados.push(`${newFormData.requiredApprovals.length} aprobaciones`);
        if (newFormData.templateForms?.length) camposCargados.push(`${newFormData.templateForms.length} formularios`);
        
        // Log para debug
        console.log('Template cargado:', template);
        console.log('Datos aplicados:', newFormData);
        
        showSnackbar(
          `Template "${template.name}" aplicado`,
          'success',
          camposCargados.length > 0 
            ? `Se cargaron: ${camposCargados.join(', ')}`
            : 'Los valores predeterminados del template han sido cargados.'
        );
      }
    } catch (error) {
      console.error('Error applying template:', error);
      showSnackbar('Error al aplicar el template', 'error');
    }
  };
  
  const loadTemplateForms = async (templateForms: TemplateForm[]) => {
    try {
      setLoadingForms(true);
      const formIds = templateForms.map(tf => typeof tf.form === 'string' ? tf.form : tf.form._id);
      const formDetails: Form[] = [];
      
      // Cargar detalles de cada formulario
      for (const formId of formIds) {
        const response = await formsApi.getFormById(formId);
        if (response.success && response.data) {
          formDetails.push(response.data);
        }
      }
      
      setTemplateFormsDetail(formDetails);
    } catch (error) {
      console.error('Error loading template forms:', error);
      showSnackbar('Error al cargar los formularios del template', 'error');
    } finally {
      setLoadingForms(false);
    }
  };
  
  // TODO: Implementar cuando se agregue la funcionalidad de responder formularios
  // const handleFormResponse = (formId: string, responses: any[]) => {
  //   setFormData(prev => ({
  //     ...prev,
  //     formResponses: {
  //       ...prev.formResponses,
  //       [formId]: responses
  //     }
  //   }));
  // };

  const handleSafetyControlChange = (index: number) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, checked } = event.target;
    
    setFormData(prev => ({
      ...prev,
      safetyControls: prev.safetyControls.map((control, i) => 
        i === index 
          ? {
              ...control,
              [name]: name === 'checked' ? checked : value
            }
          : control
      )
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // Información General
        if (!formData.companyId) newErrors.companyId = 'Debe seleccionar una empresa';
        if (formData.linkedUsers.length === 0) newErrors.linkedUsers = 'Debe agregar al menos un usuario al permiso';
        if (!formData.category) newErrors.category = 'Debe seleccionar una categoría de trabajo';
        if (!formData.workDescription.trim()) newErrors.workDescription = 'La descripción es obligatoria';
        if (formData.workDescription.length < 10) newErrors.workDescription = 'La descripción debe tener al menos 10 caracteres';
        if (formData.workDescription.length > 500) newErrors.workDescription = 'La descripción no puede exceder 500 caracteres';

        // Validar ubicación según el tipo
        if (formData.location.type === 'area' && !formData.location.generalArea?.trim()) {
          newErrors.location = 'El área general es obligatoria';
        } else if (formData.location.type === 'point' && !formData.location.point?.name?.trim()) {
          newErrors.location = 'Debe especificar el nombre del punto';
        } else if (formData.location.type === 'route' && (!formData.location.route?.name?.trim() || !formData.location.route?.points || formData.location.route.points.length === 0)) {
          newErrors.location = 'Debe especificar el nombre de la ruta y al menos un punto';
        }

        if (!formData.startDate) newErrors.startDate = 'La fecha de inicio es obligatoria';
        if (!formData.endDate) newErrors.endDate = 'La fecha de fin es obligatoria';
        
        // Validar que las fechas sean futuras
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        
        if (formData.startDate && startDate <= today) {
          newErrors.startDate = 'La fecha de inicio debe ser futura';
        }
        
        if (formData.endDate && endDate <= today) {
          newErrors.endDate = 'La fecha de fin debe ser futura';
        }
        
        if (!formData.workHoursStart.trim()) newErrors.workHoursStart = 'La hora de inicio es obligatoria';
        if (!formData.workHoursEnd.trim()) newErrors.workHoursEnd = 'La hora de fin es obligatoria';
        if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
          newErrors.endDate = 'La fecha de fin debe ser posterior a la fecha de inicio';
        }
        break;
      case 1: // Riesgos y Herramientas
        if (formData.identifiedRisks.length === 0) newErrors.identifiedRisks = 'Debe identificar al menos un riesgo';
        if (formData.toolsToUse.length === 0) newErrors.toolsToUse = 'Debe especificar al menos una herramienta';
        break;
      case 2: // EPP y Controles
        if (formData.requiredPPE.length === 0) newErrors.requiredPPE = 'Debe seleccionar al menos un EPP';
        const hasCheckedControl = formData.safetyControls.some(control => control.checked);
        if (!hasCheckedControl && !formData.additionalControls.trim()) {
          newErrors.safetyControls = 'Debe seleccionar al menos un control de seguridad o agregar controles adicionales';
        }
        break;
      case 3: // Formularios
        // No validar en este paso, solo es para mostrar y gestionar la lista de formularios
        break;
      case 4: // Aprobaciones Requeridas
        // Solo validar si hay departamentos disponibles
        if (departments.length > 0 && (!formData.requiredApprovals || formData.requiredApprovals.length === 0)) {
          newErrors.requiredApprovals = 'Debe seleccionar al menos una aprobación requerida';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info', details?: string) => {
    setSnackbar({ open: true, message, severity, details });
  };

  const handleAddForms = async () => {
    const newForms: TemplateForm[] = selectedFormsToAdd.map((formId, index) => ({
      form: formId,
      mandatory: false,
      order: formData.templateForms.length + index + 1
    }));

    setFormData(prev => ({
      ...prev,
      templateForms: [...prev.templateForms, ...newForms]
    }));

    // Cargar los detalles de los nuevos formularios
    const newFormsToLoad = availableForms.filter(f => selectedFormsToAdd.includes(f._id));
    setTemplateFormsDetail(prev => [...prev, ...newFormsToLoad]);

    // Si no hay template, asegurarse de que los formularios se muestren correctamente
    if (!formData.templateId && newFormsToLoad.length > 0) {
      // Los formularios ya están cargados desde availableForms
      console.log('Formularios agregados manualmente:', newFormsToLoad);
    }

    showSnackbar(`${selectedFormsToAdd.length} formulario(s) agregado(s)`, 'success');
    setAddFormDialog(false);
    setSelectedFormsToAdd([]);
  };

  const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // User management functions
  const handleOpenUserSelection = async () => {
    setUserSelectionOpen(true);
    setUserSearchTerm('');
    setSelectedUserRole('support');

    // Load available users if company is selected
    if (formData.companyId) {
      try {
        const response = await WorkPermitApi.getAvailableUsersByCompany(formData.companyId);
        const users = response.data.map((u: any) => ({
          _id: u._id || u.userId,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          department: u.department?.name || u.role
        }));
        setAvailableUsers(users);
      } catch (error: any) {
        console.error('Error loading available users:', error);
        showSnackbar('Error al cargar los usuarios disponibles', 'error');
      }
    }
  };

  const handleCloseUserSelection = () => {
    setUserSelectionOpen(false);
    setUserSearchTerm('');
  };

  const handleAddUser = (userId: string) => {
    const user = availableUsers.find(u => u._id === userId);
    if (user && !formData.linkedUsers.some(u => u.userId === userId)) {
      setFormData(prev => ({
        ...prev,
        linkedUsers: [
          ...prev.linkedUsers,
          {
            userId: user._id,
            role: selectedUserRole,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
          }
        ]
      }));
      handleCloseUserSelection();
    }
  };

  const handleRemoveUser = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      linkedUsers: prev.linkedUsers.filter(u => u.userId !== userId)
    }));
  };

  const handleChangeUserRole = (userId: string, newRole: 'principal' | 'support' | 'observer') => {
    setFormData(prev => ({
      ...prev,
      linkedUsers: prev.linkedUsers.map(u =>
        u.userId === userId ? { ...u, role: newRole } : u
      )
    }));
  };

  const getFilteredUsers = () => {
    const existingUserIds = formData.linkedUsers.map(u => u.userId);
    return availableUsers.filter(user =>
      !existingUserIds.includes(user._id) &&
      (user.firstName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
       user.lastName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
       user.email.toLowerCase().includes(userSearchTerm.toLowerCase()))
    );
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;

    setLoading(true);
    setSubmitError('');

    try {
      // Usar el primer usuario como contractorId para backward compatibility
      const contractorId = formData.linkedUsers.length > 0 ? formData.linkedUsers[0].userId : '';

      const submitData: WorkPermitCreateData = {
        contractorId: contractorId,
        companyId: formData.companyId || user?.company?._id || user?.companyId,
        templateId: formData.templateId || undefined,
        category: formData.category || 'general', // Usar categoría del formulario
        linkedUsers: formData.linkedUsers.length > 0
          ? formData.linkedUsers.map(u => ({
              userId: u.userId,
              role: u.role
            }))
          : undefined,
        workDescription: formData.workDescription,
        location: formData.location, // Siempre enviar objeto completo
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        workHours: {
          start: formData.workHoursStart,
          end: formData.workHoursEnd
        },
        identifiedRisks: formData.identifiedRisks,
        toolsToUse: formData.toolsToUse,
        requiredPPE: formData.requiredPPE,
        safetyControls: (() => {
          const controls = formData.safetyControls.map(control => ({
            item: control.item,
            description: control.notes || control.item, // Agregar description requerida
            checked: control.checked,
            notes: control.notes || ''
          }));

          // Si no hay controles marcados, marcar el primero por defecto
          const hasChecked = controls.some(c => c.checked);
          if (!hasChecked && controls.length > 0) {
            controls[0].checked = true;
            controls[0].notes = 'Control por defecto';
          }

          return controls;
        })(),
        additionalControls: formData.additionalControls || undefined,
        requiredApprovals: formData.requiredApprovals.length > 0
          ? formData.requiredApprovals.map(dept => ({ department: dept }))
          : [],
        requiredForms: formData.templateForms.length > 0
          ? formData.templateForms.map(tf => ({
              form: typeof tf.form === 'string' ? tf.form : tf.form._id,
              mandatory: tf.mandatory,
              order: tf.order,
              condition: tf.condition
            }))
          : undefined,
        formResponses: Object.keys(formData.formResponses).length > 0
          ? formData.formResponses
          : undefined
      };

      console.log('Submit data:', submitData);
      console.log('Category being sent:', submitData.category);
      console.log('Template ID being sent:', submitData.templateId);
      console.log('Required forms being sent:', submitData.requiredForms);
      console.log('Submit data stringified:', JSON.stringify(submitData));
      
      // Las respuestas de formularios ahora se envían como parte del submitData
      // No es necesario hacer una llamada separada

      if (isEdit && id) {
        await WorkPermitApi.updateWorkPermit(id, submitData);
        showSnackbar(
          'Permiso de trabajo actualizado exitosamente',
          'success',
          `Se han guardado todos los cambios realizados en el permiso de trabajo.`
        );
      } else {
        await WorkPermitApi.createWorkPermit(submitData);
        showSnackbar(
          'Permiso de trabajo creado exitosamente',
          'success',
          `Se ha generado un nuevo permiso de trabajo con ${formData.linkedUsers.length} usuario(s) vinculado(s).`
        );
      }
      
      // Delay navigation to show success message
      setTimeout(() => {
        navigate('/work-permits');
      }, 2000);
    } catch (error: any) {
      console.error('Error submitting work permit:', error);
      
      let errorMessage = 'Error al procesar el permiso de trabajo';
      let errorDetails = '';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        switch (status) {
          case 400:
            errorMessage = 'Datos inválidos en el formulario';
            errorDetails = data?.message || data?.error || 'Revise los datos ingresados e intente nuevamente.';
            break;
          case 401:
            errorMessage = 'No autorizado';
            errorDetails = 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.';
            break;
          case 403:
            errorMessage = 'Sin permisos';
            errorDetails = 'No tiene los permisos necesarios para realizar esta acción.';
            break;
          case 404:
            errorMessage = isEdit ? 'Permiso de trabajo no encontrado' : 'Recurso no encontrado';
            errorDetails = isEdit ? 'El permiso que intenta editar ya no existe.' : 'Verifique que todos los recursos necesarios estén disponibles.';
            break;
          case 409:
            errorMessage = 'Conflicto de datos';
            errorDetails = 'Ya existe un permiso similar o hay conflictos con los datos proporcionados.';
            break;
          case 422:
            errorMessage = 'Error de validación';
            errorDetails = data?.message || 'Los datos proporcionados no cumplen con los requisitos del sistema.';
            break;
          case 500:
            errorMessage = 'Error interno del servidor';
            errorDetails = 'Ocurrió un error inesperado. Por favor, contacte al administrador del sistema.';
            break;
          default:
            errorMessage = `Error del servidor (${status})`;
            errorDetails = data?.message || data?.error || 'Error desconocido del servidor.';
        }
      } else if (error.request) {
        errorMessage = 'Error de conexión';
        errorDetails = 'No se pudo conectar con el servidor. Verifique su conexión a internet e intente nuevamente.';
      } else {
        errorMessage = 'Error inesperado';
        errorDetails = error.message || 'Ocurrió un error desconocido al procesar la solicitud.';
      }
      
      setSubmitError(errorMessage + ': ' + errorDetails);
      showSnackbar(errorMessage, 'error', errorDetails);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/work-permits');
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 48%' } }}>
              <Autocomplete
                options={templates}
                getOptionLabel={(option) => option.name}
                value={templates.find(t => t._id === formData.templateId) || null}
                onChange={(_, newValue) => {
                  if (newValue) {
                    applyTemplate(newValue._id);
                  } else {
                    // Limpiar todos los campos del template pero mantener categoría
                    setFormData(prev => ({
                      ...prev,
                      templateId: '',
                      templateForms: [],
                      formResponses: {},
                      requiredApprovals: [], // Limpiar aprobaciones
                      workDescription: '',
                      location: { type: 'area', generalArea: '', notes: '' },
                      identifiedRisks: [],
                      toolsToUse: [],
                      requiredPPE: [],
                      safetyControls: initialFormData.safetyControls // Resetear controles
                      // Nota: NO limpiamos la categoría ya que el usuario pudo haberla seleccionado manualmente
                    }));
                    setTemplateFormsDetail([]);
                  }
                }}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography variant="body1">{option.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.category}
                      </Typography>
                    </Box>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Template de Permiso (Opcional)"
                    placeholder="Seleccione un template para precargar valores"
                    helperText="Seleccionar un template cargará valores predeterminados y formularios asociados"
                  />
                )}
                loading={loadingTemplates}
                noOptionsText="No hay templates disponibles"
              />
            </Box>
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 48%' } }}>
              <FormControl fullWidth required error={!!errors.category}>
                <InputLabel>Categoría de Trabajo</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => {
                    const newCategory = e.target.value;
                    setFormData(prev => ({ ...prev, category: newCategory }));
                    if (errors.category) {
                      setErrors(prev => ({ ...prev, category: '' }));
                    }
                  }}
                  label="Categoría de Trabajo"
                >
                  {categories.map(category => (
                    <MenuItem key={category.value} value={category.value}>
                      {category.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.category && (
                  <FormHelperText>{errors.category}</FormHelperText>
                )}
                {!errors.category && (
                  <FormHelperText>Seleccione la categoría que mejor describa el trabajo</FormHelperText>
                )}
              </FormControl>
            </Box>

            {/* Linked Users Section */}
            <Box sx={{ flex: '1 1 100%', mt: 2 }}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <GroupIcon color="primary" fontSize="medium" />
                      <Typography
                        variant="h6"
                        component="h3"
                        sx={{
                          fontWeight: 600,
                          fontSize: { xs: '1.05rem', sm: '1.15rem' },
                          lineHeight: 1.4
                        }}
                      >
                        Usuarios Vinculados
                      </Typography>
                    </Box>
                  </Box>

                  {/* Selector de Empresa */}
                  <Box sx={{ mb: 3 }}>
                    <Autocomplete
                      options={companies}
                      getOptionLabel={(option) => option.name}
                      value={companies.find(c => c.id === formData.companyId) || null}
                      onChange={(_, newValue) => {
                        setFormData(prev => ({ ...prev, companyId: newValue?.id || '', linkedUsers: [] }));
                        if (errors.companyId) {
                          setErrors(prev => ({ ...prev, companyId: '' }));
                        }
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Espacios de Trabajo"
                          placeholder="Seleccione la empresa"
                          error={!!errors.companyId}
                          helperText={errors.companyId || 'Seleccione la empresa para agregar usuarios'}
                          required
                        />
                      )}
                      noOptionsText="No se encontraron empresas"
                      loading={companies.length === 0}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<PersonAddIcon />}
                      onClick={handleOpenUserSelection}
                      disabled={!formData.companyId}
                      size="medium"
                      sx={{
                        minWidth: { xs: '100%', sm: 'auto' },
                        fontSize: '0.95rem',
                        fontWeight: 500
                      }}
                    >
                      Agregar Usuario
                    </Button>
                  </Box>

                  {formData.linkedUsers.length > 0 ? (
                    <List sx={{ pt: 0 }}>
                      {formData.linkedUsers.map((user) => (
                        <ListItem
                          key={user.userId}
                          sx={{
                            px: { xs: 1, sm: 2 },
                            py: 1.5,
                            '&:hover': { bgcolor: 'action.hover' },
                            borderRadius: 1
                          }}
                          secondaryAction={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Select
                                value={user.role}
                                onChange={(e) => handleChangeUserRole(user.userId, e.target.value as any)}
                                size="small"
                                sx={{
                                  minWidth: 120,
                                  fontSize: '0.9rem',
                                  fontWeight: 500
                                }}
                              >
                                <MenuItem value="principal" sx={{ fontSize: '0.9rem' }}>Principal</MenuItem>
                                <MenuItem value="support" sx={{ fontSize: '0.9rem' }}>Apoyo</MenuItem>
                                <MenuItem value="observer" sx={{ fontSize: '0.9rem' }}>Observador</MenuItem>
                              </Select>
                              <IconButton
                                edge="end"
                                onClick={() => handleRemoveUser(user.userId)}
                                size="medium"
                                aria-label={`Eliminar a ${user.firstName} ${user.lastName}`}
                                sx={{ ml: 0.5 }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          }
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ width: 44, height: 44 }}>
                              {user.firstName && user.lastName
                                ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
                                : 'U'}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography
                                variant="body1"
                                sx={{
                                  fontWeight: 500,
                                  fontSize: '1rem',
                                  lineHeight: 1.5
                                }}
                              >
                                {`${user.firstName} ${user.lastName}`}
                              </Typography>
                            }
                            secondary={
                              <Typography
                                variant="body2"
                                sx={{
                                  fontSize: '0.875rem',
                                  lineHeight: 1.6,
                                  mt: 0.5
                                }}
                              >
                                {user.email}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
                      <Typography
                        variant="body1"
                        color={errors.linkedUsers ? "error" : "text.secondary"}
                        sx={{
                          fontSize: '0.95rem',
                          lineHeight: 1.6
                        }}
                      >
                        {!formData.companyId
                          ? 'Seleccione una empresa para agregar usuarios'
                          : errors.linkedUsers || 'No hay usuarios vinculados. Agregue al menos un usuario para colaborar en este permiso.'}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: '1 1 100%' }}>
              <TextField
                fullWidth
                label="Descripción del Trabajo"
                value={formData.workDescription}
                onChange={handleInputChange('workDescription')}
                error={!!errors.workDescription}
                helperText={errors.workDescription || `${formData.workDescription.length}/500 caracteres`}
                multiline
                rows={isMobile ? 2 : 3}
                required
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />
            </Box>

            {/* Location Section */}
            <Box sx={{ flex: '1 1 100%' }}>
              <Card variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOnIcon color="primary" />
                  <Typography variant="h6" component="h4" sx={{ fontWeight: 600 }}>
                    Ubicación del Trabajo
                  </Typography>
                </Box>

                {/* Location Type Selector */}
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Tipo de Ubicación</InputLabel>
                  <Select
                    value={formData.location.type}
                    onChange={(e) => {
                      const newType = e.target.value as 'area' | 'point' | 'route';
                      setFormData(prev => ({
                        ...prev,
                        location: {
                          type: newType,
                          generalArea: prev.location.generalArea || '',
                          point: newType === 'point' ? { name: '' } : undefined,
                          route: newType === 'route' ? { name: '', points: [] } : undefined,
                          notes: prev.location.notes || ''
                        }
                      }));
                    }}
                    label="Tipo de Ubicación"
                  >
                    <MenuItem value="area">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MyLocationIcon fontSize="small" />
                        Área General
                      </Box>
                    </MenuItem>
                    <MenuItem value="point">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOnIcon fontSize="small" />
                        Punto Específico
                      </Box>
                    </MenuItem>
                    <MenuItem value="route">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <RouteIcon fontSize="small" />
                        Ruta/Recorrido
                      </Box>
                    </MenuItem>
                  </Select>
                  <FormHelperText>
                    {formData.location.type === 'area' && 'Descripción general del área de trabajo'}
                    {formData.location.type === 'point' && 'Punto exacto con detalles y coordenadas'}
                    {formData.location.type === 'route' && 'Ruta con múltiples puntos'}
                  </FormHelperText>
                </FormControl>

                {/* Area Location */}
                {formData.location.type === 'area' && (
                  <TextField
                    fullWidth
                    label="Área General"
                    value={formData.location.generalArea || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      location: { ...prev.location, generalArea: e.target.value }
                    }))}
                    error={!!errors.location}
                    helperText={errors.location || 'Ej: Planta de tratamiento, Sector Norte'}
                    required
                    sx={{ mb: 2 }}
                  />
                )}

                {/* Point Location */}
                {formData.location.type === 'point' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Área General"
                      value={formData.location.generalArea || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        location: { ...prev.location, generalArea: e.target.value }
                      }))}
                      helperText="Ej: Planta de tratamiento de agua"
                    />
                    <TextField
                      fullWidth
                      label="Nombre del Punto"
                      value={formData.location.point?.name || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        location: {
                          ...prev.location,
                          point: { ...prev.location.point, name: e.target.value }
                        }
                      }))}
                      error={!!errors.location}
                      helperText={errors.location || 'Ej: Tanque de almacenamiento #5'}
                      required
                    />
                    <TextField
                      fullWidth
                      label="Descripción"
                      value={formData.location.point?.description || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        location: {
                          ...prev.location,
                          point: { name: prev.location.point?.name || '', ...prev.location.point, description: e.target.value }
                        }
                      }))}
                      multiline
                      rows={2}
                      helperText="Detalles adicionales del punto"
                    />
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <TextField
                        label="Piso/Nivel"
                        value={formData.location.point?.floor || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          location: {
                            ...prev.location,
                            point: { name: prev.location.point?.name || '', ...prev.location.point, floor: e.target.value }
                          }
                        }))}
                        sx={{ flex: '1 1 45%' }}
                      />
                      <TextField
                        label="Área"
                        value={formData.location.point?.area || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          location: {
                            ...prev.location,
                            point: { name: prev.location.point?.name || '', ...prev.location.point, area: e.target.value }
                          }
                        }))}
                        sx={{ flex: '1 1 45%' }}
                      />
                    </Box>
                    <TextField
                      fullWidth
                      label="Referencia"
                      value={formData.location.point?.reference || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        location: {
                          ...prev.location,
                          point: { name: prev.location.point?.name || '', ...prev.location.point, reference: e.target.value }
                        }
                      }))}
                      helperText="Ej: Al lado de la escalera norte"
                    />
                  </Box>
                )}

                {/* Route Location */}
                {formData.location.type === 'route' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Área General"
                      value={formData.location.generalArea || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        location: { ...prev.location, generalArea: e.target.value }
                      }))}
                      helperText="Ej: Sistema de distribución de agua"
                    />
                    <TextField
                      fullWidth
                      label="Nombre de la Ruta"
                      value={formData.location.route?.name || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        location: {
                          ...prev.location,
                          route: { ...prev.location.route, name: e.target.value, points: prev.location.route?.points || [] }
                        }
                      }))}
                      error={!!errors.location}
                      helperText={errors.location || 'Ej: Tubería principal sector norte'}
                      required
                    />
                    <TextField
                      fullWidth
                      label="Descripción"
                      value={formData.location.route?.description || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        location: {
                          ...prev.location,
                          route: { ...prev.location.route, name: prev.location.route?.name || '', points: prev.location.route?.points || [], description: e.target.value }
                        }
                      }))}
                      multiline
                      rows={2}
                      helperText="Descripción del recorrido"
                    />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField
                        type="number"
                        label="Distancia (metros)"
                        value={formData.location.route?.distance || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          location: {
                            ...prev.location,
                            route: { ...prev.location.route, name: prev.location.route?.name || '', points: prev.location.route?.points || [], distance: Number(e.target.value) }
                          }
                        }))}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        type="number"
                        label="Tiempo estimado (min)"
                        value={formData.location.route?.estimatedTime || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          location: {
                            ...prev.location,
                            route: { ...prev.location.route, name: prev.location.route?.name || '', points: prev.location.route?.points || [], estimatedTime: Number(e.target.value) }
                          }
                        }))}
                        sx={{ flex: 1 }}
                      />
                    </Box>
                    <Alert severity="info" icon={<RouteIcon />}>
                      Los puntos de la ruta se pueden agregar en la sección de detalles avanzados
                    </Alert>
                  </Box>
                )}

                {/* Notes (common for all types) */}
                <TextField
                  fullWidth
                  label="Notas adicionales"
                  value={formData.location.notes || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    location: { ...prev.location, notes: e.target.value }
                  }))}
                  multiline
                  rows={2}
                  helperText="Información adicional sobre el acceso, restricciones, etc."
                  sx={{ mt: 2 }}
                />
              </Card>
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 48%', md: '1 1 31%' } }}>
              <TextField
                fullWidth
                label="Fecha de Inicio"
                type="date"
                value={formData.startDate}
                onChange={handleInputChange('startDate')}
                error={!!errors.startDate}
                helperText={errors.startDate || 'Debe ser una fecha futura'}
                required
                slotProps={{
                  htmlInput: {
                    min: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Mañana
                  },
                  inputLabel: { shrink: true }
                }}
              />
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 48%', md: '1 1 31%' } }}>
              <TextField
                fullWidth
                label="Fecha de Fin"
                type="date"
                value={formData.endDate}
                onChange={handleInputChange('endDate')}
                error={!!errors.endDate}
                helperText={errors.endDate || 'Debe ser una fecha futura'}
                required
                slotProps={{
                  htmlInput: {
                    min: formData.startDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                  },
                  inputLabel: { shrink: true }
                }}
              />
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 48%' } }}>
              <TextField
                fullWidth
                label="Hora de Inicio"
                type="time"
                value={formData.workHoursStart}
                onChange={handleInputChange('workHoursStart')}
                error={!!errors.workHoursStart}
                helperText={errors.workHoursStart}
                required
                slotProps={{
                  inputLabel: { shrink: true }
                }}
              />
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 48%' } }}>
              <TextField
                fullWidth
                label="Hora de Fin"
                type="time"
                value={formData.workHoursEnd}
                onChange={handleInputChange('workHoursEnd')}
                error={!!errors.workHoursEnd}
                helperText={errors.workHoursEnd}
                required
                slotProps={{
                  inputLabel: { shrink: true }
                }}
              />
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            <Box >
              <Autocomplete
                multiple
                freeSolo
                options={[...commonRisks, 'Otros (especificar)']}
                value={formData.identifiedRisks}
                onChange={(_, newValue) => {
                  setFormData(prev => ({ ...prev, identifiedRisks: newValue }));
                }}
                renderTags={(value: string[], getTagProps: (params: { index: number }) => any) =>
                  value.map((option, index) => {
                    const isCustom = option === 'Otros (especificar)' || !commonRisks.includes(option);
                    return (
                      <Chip
                        variant={isCustom ? "filled" : "outlined"}
                        color={isCustom ? "secondary" : "default"}
                        label={option}
                        {...getTagProps({ index })}
                        key={option}
                        size="small"
                      />
                    );
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Riesgos Identificados"
                    placeholder="Seleccione de la lista, elija 'Otros' o escriba riesgos personalizados"
                    error={!!errors.identifiedRisks}
                    helperText={errors.identifiedRisks || 'Puede seleccionar de la lista, elegir "Otros (especificar)" o agregar riesgos personalizados'}
                    required
                  />
                )}
              />
            </Box>

            <Box >
              <Autocomplete
                multiple
                freeSolo
                options={[...commonTools, 'Otros (especificar)']}
                value={formData.toolsToUse}
                onChange={(_, newValue) => {
                  setFormData(prev => ({ ...prev, toolsToUse: newValue }));
                }}
                renderTags={(value: string[], getTagProps: (params: { index: number }) => any) =>
                  value.map((option, index) => {
                    const isCustom = option === 'Otros (especificar)' || !commonTools.includes(option);
                    return (
                      <Chip
                        variant={isCustom ? "filled" : "outlined"}
                        color={isCustom ? "secondary" : "default"}
                        label={option}
                        {...getTagProps({ index })}
                        key={option}
                        size="small"
                      />
                    );
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Herramientas a Utilizar"
                    placeholder="Seleccione de la lista, elija 'Otros' o escriba herramientas personalizadas"
                    error={!!errors.toolsToUse}
                    helperText={errors.toolsToUse || 'Puede seleccionar de la lista, elegir "Otros (especificar)" o agregar herramientas personalizadas'}
                    required
                  />
                )}
              />
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            <Box >
              <Autocomplete
                multiple
                freeSolo
                options={commonPPE}
                value={formData.requiredPPE}
                onChange={(_, newValue) => {
                  setFormData(prev => ({ ...prev, requiredPPE: newValue }));
                }}
                renderTags={(value: string[], getTagProps: (params: { index: number }) => any) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                      key={option}
                      size="small"
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="EPP Requerido"
                    placeholder="Seleccione o escriba EPP adicional"
                    error={!!errors.requiredPPE}
                    helperText={errors.requiredPPE || 'Puede seleccionar de la lista o agregar nuevos EPP'}
                    required
                  />
                )}
              />
            </Box>

            <Box >
              <FormControl component="fieldset" error={!!errors.safetyControls}>
                <FormLabel component="legend">Controles de Seguridad Requeridos</FormLabel>
                <FormGroup>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                    {formData.safetyControls.map((control, index) => (
                      <Box  key={index}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          flexDirection: { xs: 'column', sm: 'row' },
                          gap: { xs: 1, sm: 2 },
                          width: '100%'
                        }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={control.checked}
                                name="checked"
                                onChange={handleSafetyControlChange(index)}
                              />
                            }
                            label={control.item}
                          />
                          {control.checked && (
                            <TextField
                              size="small"
                              label="Notas"
                              value={control.notes || ''}
                              name="notes"
                              onChange={handleSafetyControlChange(index)}
                              placeholder="Notas adicionales"
                              sx={{ 
                                minWidth: { xs: 120, sm: 200 },
                                flex: 1
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    ))}

                    <Box >
                      <TextField
                        fullWidth
                        label="Controles Adicionales"
                        value={formData.additionalControls}
                        onChange={handleInputChange('additionalControls')}
                        placeholder="Especifique controles adicionales necesarios"
                        multiline
                        rows={2}
                      />
                    </Box>
                  </Box>
                </FormGroup>
                {errors.safetyControls && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.safetyControls}
                  </Typography>
                )}
              </FormControl>
            </Box>
          </Box>
        );

      case 3: // Formularios
        return (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            <Box sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Formularios {formData.templateId ? 'del Template' : 'del Permiso'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formData.templateId 
                      ? 'Los siguientes formularios están asociados a este tipo de trabajo. Puede agregar o quitar formularios según sea necesario.'
                      : 'Agregue formularios que deben completarse para este permiso de trabajo.'}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setAddFormDialog(true)}
                  size="small"
                >
                  Agregar Formulario
                </Button>
              </Box>
              
              {formData.templateForms.length === 0 ? (
                <Alert severity="info">
                  {formData.templateId 
                    ? 'Este template no tiene formularios asociados. Puede agregar formularios adicionales haciendo clic en "Agregar Formulario".'
                    : 'No se han agregado formularios. Haga clic en "Agregar Formulario" para seleccionar formularios para este permiso.'}
                </Alert>
              ) : (
                <>
                
                
                {loadingForms ? (
                  <Box >
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  </Box>
                ) : (
                  formData.templateForms
                    .sort((a, b) => a.order - b.order)
                    .map((templateForm, index) => {
                      const formId = typeof templateForm.form === 'string' ? templateForm.form : templateForm.form._id;
                      const formDetail = templateFormsDetail.find(f => f._id === formId);
                      
                      if (!formDetail) return null;
                      
                      return (
                        <Box  key={formId}>
                          <Card variant="outlined" sx={{ mb: 2 }}>
                            <CardContent>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="subtitle1">
                                    {index + 1}. {formDetail.name}
                                  </Typography>
                                  {templateForm.mandatory && (
                                    <Chip label="Obligatorio" color="error" size="small" />
                                  )}
                                </Box>
                                <IconButton
                                  color="error"
                                  size="small"
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      templateForms: prev.templateForms.filter((tf) => {
                                        const tfFormId = typeof tf.form === 'string' ? tf.form : tf.form._id;
                                        return tfFormId !== formId;
                                      })
                                    }));
                                    showSnackbar('Formulario removido', 'info');
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                              {formDetail.description && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                  {formDetail.description}
                                </Typography>
                              )}
                              <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                                <Chip
                                  icon={<CheckCircleIcon />}
                                  label={`${formDetail.sections?.length || 0} secciones`}
                                  size="small"
                                  variant="outlined"
                                />
                                {formDetail.metadata?.estimatedCompletionTime && (
                                  <Chip
                                    label={`Tiempo estimado: ${formDetail.metadata.estimatedCompletionTime} min`}
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            </CardContent>
                          </Card>
                        </Box>
                      );
                    })
                )}
                </>
              )}
            </Box>
          </Box>
        );

      case 4: // Aprobaciones Requeridas
        return (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            <Box >
              <Typography variant="h6" gutterBottom>
                Aprobaciones Requeridas
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Seleccione los departamentos que deben aprobar este permiso de trabajo
              </Typography>
              
              {!formData.companyId ? (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  Primero debe seleccionar una empresa para ver los departamentos disponibles
                </Typography>
              ) : departments.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    No hay departamentos de aprobación configurados para esta empresa.
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Puede continuar sin seleccionar aprobaciones. El permiso se creará sin requerir aprobaciones adicionales.
                  </Typography>
                </Alert>
              ) : (
                <FormControl component="fieldset" error={!!errors.requiredApprovals}>
                  <FormGroup>
                    {departments.map((department) => (
                      <FormControlLabel
                        key={department.id}
                        control={
                          <Checkbox
                            checked={formData.requiredApprovals.includes(department.code)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  requiredApprovals: [...prev.requiredApprovals, department.code]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  requiredApprovals: prev.requiredApprovals.filter(dept => dept !== department.code)
                                }));
                              }
                            }}
                          />
                        }
                        label={`${department.name} (${department.code})`}
                      />
                    ))}
                  </FormGroup>
                  {errors.requiredApprovals && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      {errors.requiredApprovals}
                    </Typography>
                  )}
                </FormControl>
              )}
            </Box>
          </Box>
        );

      case 5: // Resumen
        return (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            <Box >
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
              >
                Resumen del Permiso de Trabajo
              </Typography>
              
              <Card variant="outlined" sx={{ overflow: 'auto' }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                    <Box >
                      <Typography variant="subtitle2" color="text.secondary">
                        Descripción del Trabajo
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {formData.workDescription}
                      </Typography>
                    </Box>

                    <Box sx={{ width: { xs: "100%", sm: "48%" } }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Categoría de Trabajo
                      </Typography>
                      <Typography variant="body1">
                        {categories.find(c => c.value === formData.category)?.label || 'No seleccionada'}
                      </Typography>
                    </Box>

                    <Box sx={{ width: { xs: "100%", sm: "48%" } }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Espacios de Trabajo
                      </Typography>
                      <Typography variant="body1">
                        {companies.find(c => c.id === formData.companyId)?.name || 'No seleccionada'}
                      </Typography>
                    </Box>

                    <Box sx={{ width: { xs: "100%", sm: "48%" } }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Usuarios Vinculados
                      </Typography>
                      <Typography variant="body1">
                        {formData.linkedUsers.length > 0
                          ? `${formData.linkedUsers.length} usuario(s)`
                          : 'Ninguno'}
                      </Typography>
                    </Box>

                    <Box sx={{ width: { xs: "100%", sm: "48%" } }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Ubicación
                      </Typography>
                      <Typography variant="body1">
                        {formData.location.type === 'area'
                          ? formData.location.generalArea || 'No especificada'
                          : formData.location.type === 'point'
                          ? formData.location.point?.name || 'Punto específico'
                          : formData.location.route?.name || 'Ruta'}
                      </Typography>
                    </Box>

                    <Box sx={{ width: { xs: "100%", sm: "48%" } }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Horario
                      </Typography>
                      <Typography variant="body1">
                        {`${formData.workHoursStart} - ${formData.workHoursEnd}`}
                      </Typography>
                    </Box>

                    <Box sx={{ width: { xs: "100%", sm: "48%" } }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Fecha de Inicio
                      </Typography>
                      <Typography variant="body1">
                        {new Date(formData.startDate).toLocaleDateString('es-CR')}
                      </Typography>
                    </Box>

                    <Box sx={{ width: { xs: "100%", sm: "48%" } }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Fecha de Fin
                      </Typography>
                      <Typography variant="body1">
                        {new Date(formData.endDate).toLocaleDateString('es-CR')}
                      </Typography>
                    </Box>

                    <Box >
                      <Typography variant="subtitle2" color="text.secondary">
                        Riesgos Identificados
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {formData.identifiedRisks.map((risk, index) => (
                          <Chip key={index} label={risk} size="small" />
                        ))}
                      </Box>
                    </Box>

                    <Box >
                      <Typography variant="subtitle2" color="text.secondary">
                        Herramientas a Utilizar
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {formData.toolsToUse.map((tool, index) => (
                          <Chip key={index} label={tool} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Box>

                    <Box >
                      <Typography variant="subtitle2" color="text.secondary">
                        EPP Requerido
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {formData.requiredPPE.map((epp, index) => (
                          <Chip key={index} label={epp} size="small" color="primary" />
                        ))}
                      </Box>
                    </Box>

                    <Box >
                      <Typography variant="subtitle2" color="text.secondary">
                        Controles de Seguridad Seleccionados
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        {formData.safetyControls.filter(c => c.checked).map((control, index) => (
                          <Typography key={index} variant="body2">
                            • {control.item} {control.notes && `(${control.notes})`}
                          </Typography>
                        ))}
                        {formData.additionalControls && (
                          <Typography variant="body2">
                            • {formData.additionalControls}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Box >
                      <Typography variant="subtitle2" color="text.secondary">
                        Aprobaciones Requeridas
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {formData.requiredApprovals.map((approval, index) => {
                          const department = departments.find(d => d.code === approval);
                          const label = department ? `${department.name} (${department.code})` : approval;
                          return (
                            <Chip 
                              key={index} 
                              label={label} 
                              size="small" 
                              color="secondary" 
                            />
                          );
                        })}
                      </Box>
                    </Box>
                    
                    {formData.templateForms.length > 0 && (
                      <Box >
                        <Typography variant="subtitle2" color="text.secondary">
                          Formularios a llenar
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          {formData.templateForms.map((templateForm) => {
                            const formId = typeof templateForm.form === 'string' ? templateForm.form : templateForm.form._id;
                            const formDetail = templateFormsDetail.find(f => f._id === formId);
                            const isCompleted = formData.formResponses[formId] && formData.formResponses[formId].length > 0;
                            
                            return (
                              <Box key={formId} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Chip 
                                  icon={isCompleted ? <CheckCircleIcon /> : <CloseIcon />}
                                  label={formDetail?.name || 'Formulario'}
                                  color={isCompleted ? 'success' : 'default'}
                                  size="small"
                                  variant={isCompleted ? 'filled' : 'outlined'}
                                />
                                {templateForm.mandatory && !isCompleted && (
                                  <Typography variant="caption" color="error">
                                    (Obligatorio)
                                  </Typography>
                                )}
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  if (loadingData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Verificar permisos de acceso
  if (!canCreateOrEditPermit()) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          No tienes permisos para {isEdit ? 'editar' : 'crear'} permisos de trabajo.
        </Alert>
        <Button
          variant="outlined"
          onClick={() => navigate('/work-permits')}
        >
          Volver a Permisos de Trabajo
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumbs 
        sx={{ 
          mb: 2,
          fontSize: { xs: '0.875rem', sm: '1rem' }
        }}
      >
        <Link
          component="button"
          variant="body1"
          onClick={handleCancel}
          sx={{ 
            textDecoration: 'none',
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }}
        >
          {isMobile ? 'Permisos' : 'Permisos de Trabajo'}
        </Link>
        <Typography 
          color="text.primary"
          sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
        >
          {isEdit ? 'Editar' : 'Nuevo'}
        </Typography>
      </Breadcrumbs>

      <Typography 
        variant="h4" 
        gutterBottom
        sx={{ 
          fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' },
          mb: { xs: 2, sm: 3 }
        }}
      >
        {isEdit ? 'Editar Permiso de Trabajo' : 'Crear Nuevo Permiso de Trabajo'}
      </Typography>

      {submitError && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2,
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }} 
          onClose={() => setSubmitError('')}
        >
          {submitError}
        </Alert>
      )}

      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Progress bar for mobile */}
        {isMobile && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Paso {activeStep + 1} de {steps.length}
              </Typography>
              <Typography 
                variant="subtitle2" 
                fontWeight="medium"
                sx={{ color: 'primary.main' }}
              >
                {stepsMobile[activeStep]}
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={(activeStep + 1) / steps.length * 100} 
              sx={{ 
                height: 8, 
                borderRadius: 1,
                '& .MuiLinearProgress-bar': {
                  borderRadius: 1
                }
              }}
            />
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ mt: 0.5, display: 'block' }}
            >
              {steps[activeStep]}
            </Typography>
          </Box>
        )}
        
        {/* Stepper for desktop/tablet */}
        {!isMobile && (
          <Stepper 
            activeStep={activeStep} 
            sx={{ 
              mb: 4,
              '.MuiStepLabel-label': {
                display: { xs: 'none', md: 'block' }
              },
              '.MuiStepIcon-root': {
                fontSize: { xs: '1.2rem', sm: '1.5rem' }
              }
            }}
            alternativeLabel={isTablet}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}

        {renderStepContent()}

        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          mt: { xs: 3, sm: 4 },
          gap: { xs: 2, sm: 0 }
        }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            sx={{ 
              minWidth: { xs: '100%', sm: 'auto' },
              order: { xs: 2, sm: 1 }
            }}
          >
            Anterior
          </Button>

          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            flexDirection: { xs: 'row', sm: 'row' },
            width: { xs: '100%', sm: 'auto' },
            order: { xs: 1, sm: 2 }
          }}>
            <Button 
              variant="outlined" 
              onClick={handleCancel}
              sx={{ flex: { xs: 1, sm: 'unset' } }}
            >
              Cancelar
            </Button>
            
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                sx={{ flex: { xs: 1, sm: 'unset' } }}
              >
                {loading ? <CircularProgress size={24} /> : (isEdit ? 'Actualizar' : 'Crear Permiso')}
              </Button>
            ) : (
              <Button 
                variant="contained" 
                onClick={handleNext}
                sx={{ flex: { xs: 1, sm: 'unset' } }}
              >
                Siguiente
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Dialog para agregar formularios */}
      <Dialog
        open={addFormDialog}
        onClose={() => {
          setAddFormDialog(false);
          setSelectedFormsToAdd([]);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Agregar Formularios</DialogTitle>
        <DialogContent>
          <List>
            {availableForms
              .filter(form => {
                // Filtrar formularios ya agregados
                const isAlreadyAdded = formData.templateForms.some(tf => {
                  const tfFormId = typeof tf.form === 'string' ? tf.form : tf.form._id;
                  return tfFormId === form._id;
                });
                return !isAlreadyAdded;
              })
              .map(form => (
                <ListItem key={form._id}>
                  <Checkbox
                    edge="start"
                    checked={selectedFormsToAdd.includes(form._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedFormsToAdd(prev => [...prev, form._id]);
                      } else {
                        setSelectedFormsToAdd(prev => prev.filter(id => id !== form._id));
                      }
                    }}
                  />
                  <ListItemText
                    primary={form.name}
                    secondary={
                      <>
                        {form.description && <div>{form.description}</div>}
                        <div>
                          {form.sections?.length || 0} secciones • 
                          {form.metadata?.estimatedCompletionTime && ` ${form.metadata.estimatedCompletionTime} min`}
                        </div>
                      </>
                    }
                  />
                </ListItem>
              ))}
          </List>
          {availableForms.filter(form => {
            const isAlreadyAdded = formData.templateForms.some(tf => {
              const tfFormId = typeof tf.form === 'string' ? tf.form : tf.form._id;
              return tfFormId === form._id;
            });
            return !isAlreadyAdded;
          }).length === 0 && (
            <Alert severity="info">
              No hay más formularios disponibles para agregar
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAddFormDialog(false);
            setSelectedFormsToAdd([]);
          }}>
            Cancelar
          </Button>
          <Button
            onClick={handleAddForms}
            variant="contained"
            disabled={selectedFormsToAdd.length === 0}
            startIcon={<AddIcon />}
          >
            Agregar ({selectedFormsToAdd.length})
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para seleccionar usuarios */}
      <Dialog
        open={userSelectionOpen}
        onClose={handleCloseUserSelection}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: '1.2rem',
              lineHeight: 1.4
            }}
          >
            Seleccionar Usuario
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Buscar por nombre o email..."
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
              sx={{
                mb: 2,
                '& .MuiInputBase-input': {
                  fontSize: '0.95rem',
                  lineHeight: 1.5
                }
              }}
            />

            <FormControl fullWidth>
              <InputLabel sx={{ fontSize: '0.95rem' }}>Rol del Usuario</InputLabel>
              <Select
                value={selectedUserRole}
                onChange={(e) => setSelectedUserRole(e.target.value as any)}
                label="Rol del Usuario"
                sx={{
                  fontSize: '0.95rem',
                  fontWeight: 500
                }}
              >
                <MenuItem value="principal" sx={{ fontSize: '0.95rem', py: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon fontSize="small" />
                    Principal
                  </Box>
                </MenuItem>
                <MenuItem value="support" sx={{ fontSize: '0.95rem', py: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GroupIcon fontSize="small" />
                    Apoyo
                  </Box>
                </MenuItem>
                <MenuItem value="observer" sx={{ fontSize: '0.95rem', py: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon fontSize="small" />
                    Observador
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>

          <List sx={{ maxHeight: 350, overflow: 'auto' }}>
            {getFilteredUsers().map((user) => (
              <ListItemButton
                key={user._id}
                onClick={() => handleAddUser(user._id)}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  py: 1.5,
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ width: 42, height: 42 }}>
                    {user.firstName && user.lastName
                      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
                      : 'U'}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 500,
                        fontSize: '1rem',
                        lineHeight: 1.5
                      }}
                    >
                      {`${user.firstName} ${user.lastName}`}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography
                        variant="body2"
                        component="span"
                        sx={{
                          fontSize: '0.875rem',
                          lineHeight: 1.6
                        }}
                      >
                        {user.email}
                      </Typography>
                      {user.department && (
                        <Typography
                          variant="caption"
                          display="block"
                          color="text.secondary"
                          sx={{
                            fontSize: '0.8rem',
                            lineHeight: 1.5,
                            mt: 0.25
                          }}
                        >
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
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  fontSize: '0.95rem',
                  lineHeight: 1.6
                }}
              >
                {userSearchTerm
                  ? 'No se encontraron usuarios que coincidan con la búsqueda'
                  : 'No hay usuarios disponibles para agregar'}
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={handleCloseUserSelection}
            sx={{
              fontSize: '0.95rem',
              fontWeight: 500
            }}
          >
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
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
          sx={{ width: '100%', minWidth: 300, maxWidth: 500 }}
          icon={
            snackbar.severity === 'success' ? <CheckCircleIcon /> :
            snackbar.severity === 'error' ? <ErrorIcon /> :
            snackbar.severity === 'warning' ? <WarningIcon /> : undefined
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
          <Box>
            <Typography variant="body2" component="div" sx={{ fontWeight: 600 }}>
              {snackbar.message}
            </Typography>
            {snackbar.details && (
              <Typography variant="caption" component="div" sx={{ mt: 0.5, opacity: 0.9 }}>
                {snackbar.details}
              </Typography>
            )}
          </Box>
        </Alert>
      </Snackbar>
    </Box>
  );
};