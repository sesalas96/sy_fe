import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  LinearProgress,
  CircularProgress,
  MenuItem,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  IconButton,
  FormHelperText,
  Autocomplete,
  Link,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { registrationService, StepInfo, StepData } from '../../services/registrationService';
import { UserRole, RegistrationSource } from '../../types';
import { usePageTitle, getPageTitle } from '../../hooks/usePageTitle';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/material.css';
import PhotoCapture from '../../components/PhotoCapture';

// Constants for step indices (0-based)
const STEP_INDICES = {
  PERSONAL_INFO: 0,
  IDENTITY_VERIFICATION: 1,
  CONTRACTOR_INFO: 2,
  SECURITY: 3
} as const;

const stepTitles = [
  'Información Personal',          // STEP_INDICES.PERSONAL_INFO (0)
  'Verificación de Identidad',     // STEP_INDICES.IDENTITY_VERIFICATION (1)
  'Datos del Contratista',         // STEP_INDICES.CONTRACTOR_INFO (2)
  'Seguridad'                      // STEP_INDICES.SECURITY (3)
];

// Interface for temporary code data
interface TemporaryCodeData {
  id: string;
  code: string;
  company: {
    id: string;
    name: string;
  };
  role: UserRole;
  description?: string;
  maxUses: number;
  currentUses: number;
  usesRemaining: number;
  isActive: boolean;
  batchId?: string;
  preloadedData?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    cedula?: string;
    ordenPatronal?: string;
    polizaINS?: string;
  };
  invitationStatus?: {
    isInvitationSent: boolean;
    invitationSentAt?: string;
    invitationClicks?: number;
  };
  status: {
    isExpired: boolean;
    isExhausted: boolean;
    isAvailable: boolean;
  };
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

// Hook for consistent error handling
const useErrorHandler = () => {
  const handleApiError = React.useCallback((error: any, context: string, showToUser: boolean = true) => {
    console.error(`[${context}] Error:`, error);
    
    if (!showToUser) return null;
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      const errorDetails = data?.message || data?.error || 'Error del servidor';
      return `Error ${status}: ${errorDetails}`;
    } else if (error.request) {
      return 'Error de conexión: No se pudo conectar con el servidor';
    } else {
      return `Error inesperado: ${error.message || 'Error desconocido'}`;
    }
  }, []);
  
  return { handleApiError };
};

// Format backend errors in a readable way
const formatBackendErrors = (errors: any): string => {
  if (typeof errors === 'string') {
    return errors;
  }
  
  if (Array.isArray(errors)) {
    return errors.map(error => {
      if (typeof error === 'string') return error;
      if (error.message) return error.message;
      if (error.field && error.message) return `${error.field}: ${error.message}`;
      return JSON.stringify(error);
    }).join('\n');
  }
  
  if (typeof errors === 'object' && errors !== null) {
    return Object.entries(errors).map(([field, message]) => {
      const fieldTranslations: { [key: string]: string } = {
        'cedula': 'Cédula/Identificación',
        'identification': 'Cédula/Identificación', 
        'email': 'Correo Electrónico',
        'phone': 'Teléfono',
        'firstName': 'Nombre',
        'lastName': 'Apellidos',
        'password': 'Contraseña',
        'invitationCode': 'Código de Invitación'
      };
      
      const translatedField = fieldTranslations[field] || field;
      return `${translatedField}: ${message}`;
    }).join('\n');
  }
  
  return 'Error desconocido del servidor';
};

// Hook for dynamic verification fields
const useVerificationFields = (formData: StepData) => {
  return React.useMemo(() => {
    const fields = [];
    
    // Always show selfie first
    fields.push({
      name: 'selfie',
      label: 'Selfie',
      type: 'file',
      required: true,
      accept: 'image/*',
      capture: 'user',
      placeholder: 'Tomar selfie',
      helperText: 'Tome una foto de su rostro mirando a la cámara'
    });

    // Only show front document if selfie exists
    if (formData.selfie) {
      fields.push({
        name: 'idFront',
        label: 'Documento de Identidad (Frente)',
        type: 'file',
        required: true,
        accept: 'image/*',
        capture: 'environment',
        placeholder: 'Foto del frente del documento',
        helperText: 'Tome una foto clara del frente de su documento'
      });
    }

    // Only show back document if front exists
    if (formData.selfie && formData.idFront) {
      fields.push({
        name: 'idBack',
        label: 'Documento de Identidad (Reverso)',
        type: 'file',
        required: false,
        accept: 'image/*',
        capture: 'environment',
        placeholder: 'Foto del reverso del documento (opcional)',
        helperText: 'Si su documento tiene información en el reverso, tome una foto'
      });
    }

    return fields;
  }, [formData.selfie, formData.idFront]);
};

export const RegisterWithInvitation: React.FC = () => {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  
  const [sessionId, setSessionId] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [tempCodeData, setTempCodeData] = useState<TemporaryCodeData | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.CONTRATISTA_HUERFANO);

  // Safety check for currentStep
  const safeCurrentStep = isNaN(currentStep) ? 0 : currentStep;

  // Ref for form container for auto scroll
  const formContainerRef = React.useRef<HTMLDivElement>(null);

  // Auto scroll to last captured field
  const scrollToLastCapturedField = useCallback((fieldName: string) => {
    setTimeout(() => {
      const fieldElement = document.querySelector(`[data-field-name="${fieldName}"]`);
      if (fieldElement && formContainerRef.current) {
        fieldElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
    }, 300);
  }, []);

  // Load mock step with pre-filled data from invitation code
  const loadMockStep = useCallback(async (stepIndex?: number) => {
    if (!loading) {
      setLoading(true);
      setLoadingStartTime(Date.now());
      setMinLoadingTime(true);
    }
    
    const activeStep = stepIndex !== undefined ? stepIndex : currentStep;
    console.log('loadMockStep called with stepIndex:', stepIndex, 'activeStep:', activeStep);
    
    // Pre-fill with data from invitation code if available
    const prefilledData = tempCodeData?.preloadedData ? {
      firstName: tempCodeData.preloadedData.firstName || '',
      lastName: tempCodeData.preloadedData.lastName || '',
      email: tempCodeData.preloadedData.email || '',
      phone: tempCodeData.preloadedData.phone || '',
      identification: tempCodeData.preloadedData.cedula || '',
      ordenPatronal: tempCodeData.preloadedData.ordenPatronal || '',
      polizaINS: tempCodeData.preloadedData.polizaINS || '',
      invitationCode: code || '',
      companyId: tempCodeData.company.id,
      batchId: tempCodeData.batchId || '',
      registrationSource: RegistrationSource.INVITATION_CODE, // Track registration source
      password: '',
      confirmPassword: '',
      acceptTerms: false,
      acceptPrivacyPolicy: false
    } : {
      invitationCode: code || '',
      companyId: tempCodeData?.company.id || '',
      batchId: tempCodeData?.batchId || '',
      registrationSource: RegistrationSource.INVITATION_CODE, // Track registration source
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      identification: '',
      ordenPatronal: '',
      polizaINS: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
      acceptPrivacyPolicy: false
    };

    // Only use pre-filled data if formData is empty
    setFormData(prev => {
      if (Object.keys(prev).length === 0) {
        console.log('Inicializando con datos precargados:', prefilledData);
        return prefilledData;
      } else {
        console.log('Manteniendo formData existente:', prev);
        return prev;
      }
    });

    const mockSteps = [
      // Step 1: Personal Information (pre-filled from invitation)
      {
        step: STEP_INDICES.PERSONAL_INFO + 1,
        title: 'Información Personal',
        fields: [
          {
            name: 'firstName',
            label: 'Nombre',
            type: 'text',
            required: true,
            placeholder: 'Ingresa tu nombre'
          },
          {
            name: 'lastName',
            label: 'Apellidos',
            type: 'text',
            required: true,
            placeholder: 'Ingresa tus apellidos'
          },
          {
            name: 'email',
            label: 'Correo Electrónico',
            type: 'email',
            required: true,
            placeholder: 'correo@ejemplo.com'
          },
          {
            name: 'phone',
            label: '',
            type: 'tel',
            required: false,
            placeholder: '8888-8888',
            helperText: 'Selecciona tu país y número de teléfono'
          },
          {
            name: 'identification',
            label: 'Documento de Identificación',
            type: 'text',
            required: true,
            placeholder: 'Ej: Pasaporte, DNI, ID Nacional',
            helperText: 'Ingrese su documento de identificación principal'
          }
        ]
      },
      // Step 2: Identity Verification
      {
        step: STEP_INDICES.IDENTITY_VERIFICATION + 1,
        title: 'Verificación de Identidad',
        fields: []
      },
      // Step 3: Contractor Information (pre-filled from invitation)
      {
        step: STEP_INDICES.CONTRACTOR_INFO + 1,
        title: 'Información Específica del Contratista',
        fields: [
          {
            name: 'ordenPatronal',
            label: 'Orden Patronal',
            type: 'text',
            required: false,
            placeholder: 'OP-XXXX-XXX (opcional)',
            helperText: 'Número de orden patronal asignado'
          },
          {
            name: 'polizaINS',
            label: 'Póliza INS',
            type: 'text',
            required: false,
            placeholder: 'INS-XXXXXX (opcional)',
            helperText: 'Número de póliza del INS'
          }
        ]
      },
      // Step 4: Security
      {
        step: STEP_INDICES.SECURITY + 1,
        title: 'Configuración de Seguridad',
        fields: [
          {
            name: 'password',
            label: 'Contraseña',
            type: 'password',
            required: true,
            placeholder: 'Ingresa una contraseña segura',
            helperText: 'Mínimo 8 caracteres, incluye mayúsculas, minúsculas, números y símbolos'
          },
          {
            name: 'confirmPassword',
            label: 'Confirmar Contraseña',
            type: 'password',
            required: true,
            placeholder: 'Repite la misma contraseña',
            helperText: 'Debe coincidir con la contraseña anterior'
          },
          {
            name: 'acceptTerms',
            label: 'Acepto los términos y condiciones',
            type: 'checkbox',
            required: true,
            linkTo: '/terms'
          },
          {
            name: 'acceptPrivacyPolicy',
            label: 'Acepto la política de privacidad',
            type: 'checkbox',
            required: true,
            linkTo: '/privacy'
          }
        ]
      }
    ];

    const currentMockStep = mockSteps[activeStep] || mockSteps[0];
    
    // For identity verification step, configure fields dynamically
    let finalStep = { ...currentMockStep };
    if (activeStep === STEP_INDICES.IDENTITY_VERIFICATION) {
      finalStep = {
        ...currentMockStep,
        fields: verificationFields
      };
    }
    
    // Add data property required by StepInfo type
    const stepWithData = {
      ...finalStep,
      data: formData
    };

    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setStepInfo(stepWithData);
    console.log('loadMockStep completed, stepInfo set:', stepWithData);
    console.log('Step fields:', stepWithData.fields);
    
    // Ensure minimum loading time before hiding skeleton
    await ensureMinimumLoadingTime();
    setLoading(false);
  }, [currentStep, tempCodeData, code]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Helper function to ensure minimum loading time for better UX
  const ensureMinimumLoadingTime = useCallback(async () => {
    if (loadingStartTime) {
      const elapsedTime = Date.now() - loadingStartTime;
      const minimumLoadingTime = 800; // 800ms minimum loading time
      
      if (elapsedTime < minimumLoadingTime) {
        const remainingTime = minimumLoadingTime - elapsedTime;
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
      setLoadingStartTime(null);
      setMinLoadingTime(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Helper function to determine skeleton field count based on step
  const getSkeletonFieldCount = () => {
    const step = safeCurrentStep;
    switch(step) {
      case STEP_INDICES.PERSONAL_INFO: return 5; // Personal info: name, lastname, email, phone, identification
      case STEP_INDICES.IDENTITY_VERIFICATION: return 3; // Identity verification: selfie, id front, id back
      case STEP_INDICES.CONTRACTOR_INFO: return 2; // Contractor info: orden patronal, poliza INS
      case STEP_INDICES.SECURITY: return 4; // Security: password, confirm, 2 checkboxes
      default: return 3;
    }
  };

  // Helper function to calculate progress percentage
  const getProgressPercentage = () => {
    const safeCurrentStep = isNaN(currentStep) || currentStep === null || currentStep === undefined ? 0 : currentStep;
    const normalizedStep = Math.max(0, Math.min(safeCurrentStep, stepTitles.length - 1));
    const stepsCompleted = normalizedStep;
    const stepValue = 100 / stepTitles.length;
    const currentStepProgress = stepValue * 0.5;
    const totalProgress = (stepsCompleted * stepValue) + currentStepProgress;
    const finalProgress = Math.max(10, Math.min(Math.round(totalProgress), 90));
    return isNaN(finalProgress) ? 10 : finalProgress;
  };

  // State variables
  const [stepInfo, setStepInfo] = useState<StepInfo | null>(null);
  const [formData, setFormData] = useState<StepData>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [successMessages, setSuccessMessages] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  
  // Custom hooks
  const verificationFields = useVerificationFields(formData);
  const { handleApiError } = useErrorHandler();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [companies, setCompanies] = useState<any[]>([]);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [, setMinLoadingTime] = useState(true);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  const [showRefreshModal, setShowRefreshModal] = useState(false);
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);
  const [invitationLoading, setInvitationLoading] = useState(true);
  const [invitationError, setInvitationError] = useState('');

  // Set page title
  usePageTitle(getPageTitle('Registro con Invitación'), 'Sistema de Gestión de Seguridad - Registro con código de invitación');

  // API base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://sybe-production.up.railway.app/api';

  // Load invitation code data on component mount
  useEffect(() => {
    const loadInvitationData = async () => {
      if (!code) {
        setInvitationError('Código de invitación no encontrado en la URL');
        setInvitationLoading(false);
        return;
      }

      try {
        setInvitationLoading(true);
        
        // Get temporary code details with full data
        const response = await fetch(`${API_BASE_URL}/temporary-codes/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            code: code,
            includeFullData: true
          })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Código de invitación inválido');
        }

        if (!result.data || !result.data.status?.isAvailable) {
          throw new Error('Este código de invitación no está disponible o ha expirado');
        }

        console.log('Invitation code data loaded:', result.data);
        setTempCodeData(result.data);
        setSelectedRole(result.data.role);

        // Set company data for form
        if (result.data.company) {
          setCompanies([{
            id: result.data.company.id,
            name: result.data.company.name
          }]);
        }

      } catch (error) {
        console.error('Error loading invitation data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error al cargar el código de invitación';
        
        // If code doesn't exist or is invalid, redirect to normal registration
        if (errorMessage.includes('inválido') || errorMessage.includes('invalid') || 
            errorMessage.includes('no encontrado') || errorMessage.includes('not found') ||
            errorMessage.includes('no está disponible') || errorMessage.includes('not available') ||
            errorMessage.includes('ha expirado') || errorMessage.includes('expired')) {
          console.log('Invalid invitation code, redirecting to normal registration');
          navigate('/register', { 
            state: { 
              message: `Código de invitación "${code}" no válido. Continuando con registro normal.`,
              fromInvalidInvitation: true
            } 
          });
          return;
        }
        
        setInvitationError(errorMessage);
      } finally {
        setInvitationLoading(false);
      }
    };

    loadInvitationData();
  }, [code, API_BASE_URL, navigate]);

  // Start registration after invitation data is loaded
  useEffect(() => {
    if (tempCodeData && !invitationLoading && !invitationError) {
      const initializeRegistration = async () => {
        try {
          setLoading(true);
          setLoadingStartTime(Date.now());
          setMinLoadingTime(true);
          setCurrentStep(0); // Ensure currentStep is initialized
          
          // Try to start session with backend
          try {
            const session = await registrationService.startRegistration(selectedRole);
            setSessionId(session.sessionId);
            
            // Use mock steps for invitation registration (backend step structure may not match)
            console.log('Using mock steps for invitation registration');
            await loadMockStep(0);
          } catch (apiError) {
            console.error('Error starting registration with backend, using local mode:', apiError);
            
            // Fallback: use mock data while backend is unavailable
            const mockSessionId = 'mock-session-' + Date.now();
            setSessionId(mockSessionId);
            
            // Load first mock step
            console.log('Loading mock step after backend error');
            await loadMockStep(0);
          }
        } catch (error) {
          console.error('General error starting registration:', error);
          setGeneralError('Error al iniciar el registro');
        } finally {
          await ensureMinimumLoadingTime();
          setLoading(false);
        }
      };

      initializeRegistration();
    }
  }, [tempCodeData, invitationLoading, invitationError, selectedRole, loadMockStep, ensureMinimumLoadingTime]);

  // Session management with timeout and recovery
  useEffect(() => {
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    const ACTIVITY_CHECK_INTERVAL = 60 * 1000; // 1 minute
    
    let activityCheckId: NodeJS.Timeout;
    let lastActivity = Date.now();

    const updateActivity = () => {
      lastActivity = Date.now();
      localStorage.setItem('registrationLastActivity', lastActivity.toString());
    };

    const checkSessionExpiry = async () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      
      if (timeSinceLastActivity > SESSION_TIMEOUT) {
        if (sessionId) {
          try {
            await registrationService.deleteSession(sessionId);
          } catch (error) {
            console.error('Error deleting expired session:', error);
          }
        }
        
        localStorage.removeItem('registrationSessionId');
        localStorage.removeItem('registrationLastActivity');
        localStorage.removeItem('registrationCurrentStep');
        
        setShowSessionExpiredModal(true);
        return;
      }
    };

    // Save sessionId and step when they change
    if (sessionId) {
      localStorage.setItem('registrationSessionId', sessionId);
      updateActivity();
    }
    
    if (currentStep !== null && currentStep !== undefined) {
      localStorage.setItem('registrationCurrentStep', currentStep.toString());
    }

    // Set up activity listeners
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity);
    });

    // Only set up activity listeners and checks if there's a session
    if (sessionId) {
      activityCheckId = setInterval(checkSessionExpiry, ACTIVITY_CHECK_INTERVAL);
    } 

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      
      if (activityCheckId) clearInterval(activityCheckId);
    };
  }, [sessionId, currentStep]);

  // Debug effect
  useEffect(() => {
    console.log('RegisterWithInvitation Debug:', { 
      loading, 
      stepInfo: !!stepInfo, 
      stepInfoFields: stepInfo?.fields?.length || 0,
      invitationLoading, 
      invitationError,
      tempCodeData: !!tempCodeData,
      currentStep
    });
  }, [loading, stepInfo, invitationLoading, invitationError, tempCodeData, currentStep]);

  // Update dynamic verification fields
  useEffect(() => {
    if (stepInfo && currentStep === STEP_INDICES.IDENTITY_VERIFICATION) {
      console.log('Updating verification fields:', {
        currentFields: stepInfo.fields?.length || 0,
        newFields: verificationFields.length,
        formData: { selfie: !!formData.selfie, idFront: !!formData.idFront }
      });
      
      const updatedStepInfo = {
        ...stepInfo,
        fields: verificationFields
      };
      setStepInfo(updatedStepInfo);
    }
  }, [verificationFields, currentStep, stepInfo?.step, formData.idFront, formData.selfie, stepInfo]);

  const handleFieldChange = (name: string, value: any) => {
    console.log('Field change:', name, '=', value);
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      console.log('FormData updated:', updated);
      return updated;
    });
    setErrors(prev => ({ ...prev, [name]: '' }));
    setSuccessMessages(prev => ({ ...prev, [name]: '' }));

    // Real-time validation for passwords
    if (name === 'password' || name === 'confirmPassword') {
      validatePasswords(name, value);
    }
  };

  const analyzeEmail = async (email: string) => {
    if (!email || !email.includes('@')) return;

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setErrors(prev => ({ ...prev, email: 'Formato de email inválido' }));
        return;
      }

      const data = await registrationService.verifyEmail(email);

      if (data.success && data.exists) {
        setErrors(prev => ({ 
          ...prev, 
          email: 'Este correo electrónico ya está registrado en el sistema' 
        }));
      } else if (data.success && !data.exists) {
        setErrors(prev => ({ ...prev, email: '' }));
      } else if (!data.success && data.retryAfter) {
        setErrors(prev => ({ 
          ...prev, 
          email: `${data.error} Intente nuevamente en ${Math.ceil(data?.retryAfter || 0 / 60)} minutos.` 
        }));
      }
    } catch (error) {
      handleApiError(error, 'Verify Email', false);
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const validatePasswords = (fieldName: string, value: string) => {
    if (fieldName === 'password') {
      const validation = registrationService.validatePassword(value);
      if (!validation.valid) {
        setErrors(prev => ({ ...prev, password: validation.errors[0] }));
      }
    }

    if (fieldName === 'confirmPassword' || (fieldName === 'password' && formData.confirmPassword)) {
      const password = fieldName === 'password' ? value : formData.password;
      const confirmPassword = fieldName === 'confirmPassword' ? value : formData.confirmPassword;
      
      if (confirmPassword && password !== confirmPassword) {
        setErrors(prev => ({ ...prev, confirmPassword: 'Las contraseñas no coinciden' }));
      } else {
        setErrors(prev => ({ ...prev, confirmPassword: '' }));
      }
    }
  };

  const validateCurrentStep = (): boolean => {
    if (!stepInfo || !stepInfo.fields) return false;

    const newErrors: { [key: string]: string } = {};
    let isValid = true;

    stepInfo.fields.forEach(field => {
      const value = formData[field.name];

      // Required field validation
      if (field.required && !value) {
        newErrors[field.name] = `${field.label} es requerido`;
        isValid = false;
      }

      // Specific validations
      if (field.name === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors[field.name] = 'Email inválido';
          isValid = false;
        }
        
        if (errors.email && errors.email.includes('ya está registrado')) {
          newErrors[field.name] = errors.email;
          isValid = false;
        }
      }

      if (field.name === 'identification' && value) {
        const cleanValue = value.trim();
        
        if (!/^[A-Za-z0-9\s-]+$/.test(cleanValue)) {
          newErrors[field.name] = 'Solo se permiten letras, números, espacios y guiones';
          isValid = false;
        } else {
          const digitsOnly = cleanValue.replace(/[^0-9]/g, '');
          
          if (digitsOnly.length < 9) {
            newErrors[field.name] = 'El documento debe contener al menos 9 dígitos';
            isValid = false;
          } else if (digitsOnly.length > 12) {
            newErrors[field.name] = 'El documento no puede exceder 12 dígitos';
            isValid = false;
          }
          
          if (cleanValue.length < 9) {
            newErrors[field.name] = 'El documento es demasiado corto';
            isValid = false;
          } else if (cleanValue.length > 20) {
            newErrors[field.name] = 'El documento es demasiado largo';
            isValid = false;
          }
        }
      }

      if (field.name === 'phone' && value) {
        const cleanPhone = value.replace(/[\s-()]/g, '');
        
        if (!cleanPhone.startsWith('+')) {
          newErrors[field.name] = 'El número debe incluir el código de país (ej: +506 para Costa Rica)';
          isValid = false;
        } else if (cleanPhone.length < 8) {
          newErrors[field.name] = 'Número de teléfono demasiado corto';
          isValid = false;
        } else if (cleanPhone.length > 20) {
          newErrors[field.name] = 'Número de teléfono demasiado largo';
          isValid = false;
        }
      }

      if (field.name === 'password' && value) {
        const validation = registrationService.validatePassword(value);
        if (!validation.valid) {
          newErrors[field.name] = validation.errors.join(', ');
          isValid = false;
        }
      }

      if (field.name === 'confirmPassword' && value !== formData.password) {
        newErrors[field.name] = 'Las contraseñas no coinciden';
        isValid = false;
      }

      if ((field.name === 'acceptTerms' || field.name === 'acceptPrivacyPolicy') && !value) {
        newErrors[field.name] = 'Debes aceptar para continuar';
        isValid = false;
      }

      // File validation
      if (field.type === 'file' && field.required && !value) {
        newErrors[field.name] = `${field.label} es requerido`;
        isValid = false;
      }

      if (field.type === 'file' && value && value.size > 5 * 1024 * 1024) {
        newErrors[field.name] = 'El archivo no debe exceder 5MB';
        isValid = false;
      }

      if (field.type === 'file' && value && !value.type.startsWith('image/')) {
        newErrors[field.name] = 'Solo se permiten archivos de imagen';
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) return;

    try {
      setLoading(true);
      setGeneralError('');
      
      // Email verification for first step
      if (safeCurrentStep === 0) {
        try {
          console.log('Verifying email before continuing step 1:', formData.email);
          const emailVerification = await registrationService.verifyEmail(formData.email);
          
          if (emailVerification.success && emailVerification.exists) {
            setErrors(prev => ({ 
              ...prev, 
              email: 'Este correo electrónico ya está registrado en el sistema' 
            }));
            setLoading(false);
            return;
          }
          
          console.log('Email verified, continuing with step 1');
        } catch (emailError) {
          console.error('Error verifying email:', emailError);
        }
      }
      
      // Prepare data according to current step
      const prepareStepData = () => {
        const safeCurrentStep = isNaN(currentStep) ? 0 : currentStep;
        console.log('prepareStepData - currentStep:', currentStep, 'safeCurrentStep:', safeCurrentStep);
        
        switch (safeCurrentStep) {
          case STEP_INDICES.PERSONAL_INFO: // Step 1 - Personal Information
            return {
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              phone: formData.phone,
              cedula: formData.identification, // Map identification to cedula for backend
              temporaryCode: code, // Include the invitation code
              batchId: formData.batchId, // Include batchId for tracking
              registrationSource: formData.registrationSource // Track how user registered
            };
          case STEP_INDICES.IDENTITY_VERIFICATION: // Step 2 - Identity Verification
            const verificationFormData = new FormData();
            verificationFormData.append('sessionId', sessionId);
            
            if (formData.selfie) {
              verificationFormData.append('selfie', formData.selfie, 'selfie.jpg');
            }
            if (formData.idFront) {
              verificationFormData.append('idFront', formData.idFront, 'documento_frente.jpg');
            }
            if (formData.idBack) {
              verificationFormData.append('idBack', formData.idBack, 'documento_reverso.jpg');
            }
            
            return verificationFormData;
          case STEP_INDICES.CONTRACTOR_INFO: // Step 3 - Contractor Information
            return {
              ordenPatronal: formData.ordenPatronal || '',
              polizaINS: formData.polizaINS || ''
            };
          case STEP_INDICES.SECURITY: // Step 4 - Security
            return {
              password: formData.password,
              confirmPassword: formData.confirmPassword,
              acceptTerms: formData.acceptTerms,
              acceptPrivacyPolicy: formData.acceptPrivacyPolicy
            };
          default:
            return {};
        }
      };

      try {
        const stepData = prepareStepData();
        console.log('Prepared payload for step', currentStep + 1, ':', stepData);
        console.log('Current formData:', formData);
        
        const response = await registrationService.submitStep(sessionId, stepData);
        
        if (response.success) {
          if (safeCurrentStep === stepTitles.length - 1) {
            // Last step - registration completed
            setRegistrationSuccess(true);
          } else {
            // Advance to next step
            const nextStep = safeCurrentStep + 1;
            setCurrentStep(nextStep);
            await loadMockStep(nextStep);
          }
        } else {
          if (response.errors) {
            if (typeof response.errors === 'object' && !Array.isArray(response.errors)) {
              setErrors(response.errors);
              console.error('Validation errors:', response.errors);
            } else {
              const formattedError = formatBackendErrors(response.errors);
              setGeneralError(formattedError);
              console.error('General errors:', response.errors);
            }
          } else {
            const errorMessage = response.message || 'Error al procesar el paso';
            setGeneralError(`Error en el paso ${safeCurrentStep + 1}: ${errorMessage}`);
            console.error('Step error:', response);
          }
        }
      } catch (apiError: any) {
        const errorMessage = handleApiError(apiError, 'Submit Step', true);
        setGeneralError(errorMessage || 'Error al procesar el paso');
      }
    } catch (error) {
      setGeneralError('Error al procesar el paso');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = async () => {
    if (currentStep <= 0) return;

    try {
      setLoading(true);
      setGeneralError('');
      
      try {
        const response = await registrationService.previousStep(sessionId);
        
        if (response.success) {
          const prevStep = response.currentStep - 1;
          setCurrentStep(prevStep);
          await loadMockStep(prevStep);
        } else {
          setGeneralError('No se pudo regresar al paso anterior');
        }
      } catch (apiError: any) {
        handleApiError(apiError, 'Previous Step', false);
        
        const prevStep = Math.max(0, currentStep - 1);
        setCurrentStep(prevStep);
        await loadMockStep(prevStep);
      }
    } catch (error) {
      setGeneralError('Error al regresar al paso anterior');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBackToHome = async () => {
    if (sessionId) {
      try {
        await registrationService.deleteSession(sessionId);
        console.log('Session deleted when returning to dashboard');
      } catch (error) {
        console.error('Error deleting session:', error);
      }
    }

    localStorage.removeItem('registrationSessionId');
    localStorage.removeItem('registrationLastActivity');
    localStorage.removeItem('registrationCurrentStep');
    
    navigate('/dashboard');
  };

  const handleRefreshModalClose = async () => {
    setShowRefreshModal(false);
    setCurrentStep(0);
    setSessionId('');
    setFormData({});
    setErrors({});
    setGeneralError('');
    setRegistrationSuccess(false);
    
    try {
      // Restart registration from beginning
      setLoading(true);
      setLoadingStartTime(Date.now());
      setMinLoadingTime(true);
      
      const session = await registrationService.startRegistration(selectedRole);
      setSessionId(session.sessionId);
      
      const stepInfo = await registrationService.getCurrentStep(session.sessionId);
      setStepInfo(stepInfo);
      setCurrentStep(stepInfo.step - 1);
    } catch (error) {
      console.error('Error starting new session after refresh:', error);
      navigate(`/register/invitation/${code}`);
    } finally {
      await ensureMinimumLoadingTime();
      setLoading(false);
    }
  };

  const handleSessionExpiredModalClose = async () => {
    setShowSessionExpiredModal(false);
    
    localStorage.removeItem('registrationSessionId');
    localStorage.removeItem('registrationLastActivity');
    localStorage.removeItem('registrationCurrentStep');
    
    navigate('/login', { 
      state: { 
        message: 'Tu sesión de registro ha expirado por inactividad. Por favor inicia sesión o comienza un nuevo registro.',
        redirectReason: 'session_expired'
      } 
    });
  };

  const renderField = (field: any) => {
    const value = formData[field.name] || '';

    switch (field.type) {
      case 'select':
        if (field.name === 'companyId') {
          return (
            <Autocomplete
              options={companies}
              getOptionLabel={(option) => option.name}
              value={companies.find(c => c.id === value) || null}
              onChange={(_, newValue) => handleFieldChange(field.name, newValue?.id || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={field.label}
                  required={false}
                  error={!!errors[field.name]}
                  helperText={errors[field.name] || field.helperText}
                  sx={{ minHeight: '72px' }}
                />
              )}
            />
          );
        }
        return (
          <TextField
            select
            fullWidth
            label={field.label}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={false}
            error={!!errors[field.name]}
            helperText={errors[field.name] || field.helperText}
            sx={{ minHeight: '72px' }}
          >
            {field.options?.map((option: any) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        );

      case 'password':
        const isConfirmPassword = field.name === 'confirmPassword';
        return (
          <TextField
            fullWidth
            type={(isConfirmPassword ? showConfirmPassword : showPassword) ? 'text' : 'password'}
            label={field.label}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={false}
            error={!!errors[field.name]}
            helperText={errors[field.name] || field.helperText}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => isConfirmPassword ? setShowConfirmPassword(!showConfirmPassword) : setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {(isConfirmPassword ? showConfirmPassword : showPassword) ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }
            }}
            sx={{ minHeight: '72px' }}
          />
        );

      case 'checkbox':
        return (
          <Box sx={{ minHeight: '72px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!value}
                  onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                  color="primary"
                />
              }
              label={
                field.linkTo ? (
                  <Box component="span">
                    Acepto{' '}
                    <Link 
                      href={field.linkTo} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      underline="hover"
                      color="primary"
                    >
                      {field.name === 'acceptTerms' ? 'los términos y condiciones' : 'la política de privacidad'}
                    </Link>
                  </Box>
                ) : field.label
              }
            />
            {errors[field.name] && (
              <FormHelperText error>{errors[field.name]}</FormHelperText>
            )}
          </Box>
        );

      case 'file':
        let captureType: 'selfie' | 'document_front' | 'document_back';
        if (field.name === 'selfie') {
          captureType = 'selfie';
        } else if (field.name === 'idFront') {
          captureType = 'document_front';
        } else if (field.name === 'idBack') {
          captureType = 'document_back';
        } else {
          captureType = 'document_front';
        }

        return (
          <PhotoCapture
            key={field.name}
            type={captureType}
            label={field.label}
            value={value}
            error={errors[field.name]}
            helperText={field.helperText}
            required={field.required}
            onCapture={(imageData: string) => {
              if (!imageData || imageData === '') {
                handleFieldChange(field.name, '');
                setErrors(prev => ({ ...prev, [field.name]: '' }));
                return;
              }

              if (typeof imageData !== 'string') {
                console.error('Invalid imageData:', imageData);
                return;
              }

              try {
                let base64Data = imageData;
                
                if (imageData.includes(',')) {
                  base64Data = imageData.split(',')[1];
                }
                
                if (!base64Data || base64Data.length === 0) {
                  console.error('Empty base64 data');
                  return;
                }

                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const file = new File([byteArray], `${field.name}.jpg`, { type: 'image/jpeg' });
                handleFieldChange(field.name, file);
                
                scrollToLastCapturedField(field.name);
              } catch (error) {
                console.error('Error converting base64 to File:', error);
                setErrors(prev => ({ 
                  ...prev, 
                  [field.name]: 'Error al procesar la imagen capturada' 
                }));
              }
            }}
          />
        );

      default:
        if (field.name === 'phone') {
          return (
            <Box sx={{ minHeight: '72px' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {field.label} {field.required && '*'}
              </Typography>
              <PhoneInput
                country={'cr'}
                value={value}
                onChange={(phone) => handleFieldChange(field.name, '+' + phone)}
                inputStyle={{
                  width: '100%',
                  height: '56px',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  borderColor: errors[field.name] ? '#d32f2f' : 'rgba(0, 0, 0, 0.23)',
                  borderRadius: '4px'
                }}
                containerStyle={{
                  width: '100%'
                }}
                buttonStyle={{
                  borderColor: errors[field.name] ? '#d32f2f' : 'rgba(0, 0, 0, 0.23)',
                  borderRadius: '4px 0 0 4px'
                }}
                dropdownStyle={{
                  zIndex: 1300
                }}
                enableSearch
                searchPlaceholder="Buscar país..."
                preferredCountries={['cr', 'us', 'mx', 'gt', 'sv', 'hn', 'ni', 'pa']}
                placeholder={field.placeholder}
              />
              {(errors[field.name] || successMessages[field.name] || field.helperText) && (
                <FormHelperText error={!!errors[field.name]} sx={{ 
                  mt: 0.5,
                  ...(successMessages[field.name] ? { color: 'success.main' } : {})
                }}>
                  {errors[field.name] || successMessages[field.name] || field.helperText}
                </FormHelperText>
              )}
            </Box>
          );
        }

        return (
          <TextField
            fullWidth
            type={field.type}
            label={field.label}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            onBlur={
              field.name === 'email' ? (e) => analyzeEmail(e.target.value) :
              undefined
            }
            required={false}
            error={!!errors[field.name]}
            helperText={errors[field.name] || successMessages[field.name] || field.helperText}
            placeholder={field.placeholder}
            sx={{
              minHeight: '72px',
              ...(successMessages[field.name] ? {
                '& .MuiFormHelperText-root': {
                  color: 'success.main'
                }
              } : {})
            }}
          />
        );
    }
  };

  // Show error if invitation loading failed
  if (invitationError) {
    return (
      <Container component="main" maxWidth="sm">
        <Box sx={{ 
          minHeight: '100dvh', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center',
          py: 3
        }}>
          <Card sx={{ 
            width: '100%',
            textAlign: 'center',
            p: 4
          }}>
            <CardContent>
              <Typography variant="h4" gutterBottom sx={{ color: 'error.main', mb: 2 }}>
                Código de Invitación Inválido
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
                {invitationError}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/register')}
                >
                  Registro Normal
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/login')}
                >
                  Iniciar Sesión
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    );
  }

  // Show loading while invitation data is being fetched
  if (invitationLoading) {
    return (
      <Container component="main" maxWidth="md">
        <Box sx={{ 
          minHeight: '100dvh', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Card sx={{ 
            width: '100%',
            textAlign: 'center',
            p: 4
          }}>
            <CardContent>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="h6">
                Cargando código de invitación...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Verificando código: {code}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>
    );
  }

  // Success screen
  if (registrationSuccess) {
    return (
      <Container component="main" maxWidth="sm">
        <Box sx={{ 
          minHeight: '100dvh', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center',
          py: 3
        }}>
          <Card sx={{ 
            width: '100%',
            textAlign: 'center',
            p: 4,
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Box
              sx={{
                position: 'absolute',
                top: 10,
                right: 20,
                opacity: 0.08,
                zIndex: 0,
                pointerEvents: 'none',
                display: { xs: 'none', md: 'block' }
              }}
            >
              <img 
                src="/safety-logo.png" 
                alt="" 
                style={{ 
                  width: '100px',
                  height: '100px',
                  objectFit: 'contain'
                }}
              />
            </Box>
            
            <CardContent sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                backgroundColor: 'success.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px auto'
              }}>
                <Typography 
                  variant="h2" 
                  sx={{ 
                    color: 'white',
                    fontSize: '3rem'
                  }}
                >
                  ✓
                </Typography>
              </Box>

              <Typography variant="h4" gutterBottom sx={{ color: 'success.main', mb: 2 }}>
                ¡Registro Exitoso!
              </Typography>

              <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
                Tu cuenta ha sido creada exitosamente usando el código de invitación.
              </Typography>

              {tempCodeData && (
                <Box sx={{ 
                  backgroundColor: 'primary.light', 
                  color: 'primary.contrastText', 
                  borderRadius: 1, 
                  p: 2,
                  mb: 3
                }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Espacios de Trabajo: {tempCodeData.company.name}
                  </Typography>
                  <Typography variant="body2">
                    Rol asignado: {tempCodeData.role}
                  </Typography>
                </Box>
              )}

              <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary' }}>
                Ya puedes iniciar sesión con tus credenciales.
              </Typography>

              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={() => navigate('/login', { 
                  state: { 
                    message: 'Registro completado exitosamente con código de invitación. Por favor inicia sesión.',
                    email: formData.email 
                  } 
                })}
                sx={{ py: 1.5 }}
              >
                Ir a Inicio de Sesión
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Container>
    );
  }

  // Early loading state
  if (!stepInfo && loading) {
    return (
      <Container component="main" maxWidth="md">
        <Box sx={{ 
          minHeight: '100dvh', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Multi-step form
  return (
    <>
      <style>
        {`
          @keyframes progress-skeleton {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}
      </style>
      <Container component="main" maxWidth="md">
        <Box sx={{ 
          minHeight: '100dvh', 
          display: 'flex', 
          alignItems: { xs: 'flex-start', md: 'center' }, 
          py: { xs: 2, md: 3 }
        }}>
          <Card sx={{ 
            width: '100%', 
            position: 'relative', 
            pb: { xs: 10, md: 4 },
            boxShadow: { xs: 0, md: 1 },
            border: { xs: 'none', md: '1px solid' },
            borderColor: { xs: 'transparent', md: 'divider' },
            overflow: 'hidden',
            minHeight: { xs: 'calc(100dvh - 160px)', md: '600px' }
          }}>
            <Box
              sx={{
                position: 'absolute',
                top: 10,
                right: 20,
                opacity: 0.08,
                zIndex: 0,
                pointerEvents: 'none',
                display: { xs: 'none', md: 'block' }
              }}
            >
              <img 
                src="/safety-logo.png" 
                alt="" 
                style={{ 
                  width: '100px',
                  height: '100px',
                  objectFit: 'contain'
                }}
              />
            </Box>
            
            <CardContent ref={formContainerRef} sx={{ p: { xs: 3, md: 4 }, position: 'relative', zIndex: 1 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 3,
                mx: { xs: -3, md: -4 },
                mt: { xs: -3, md: -4 },
                px: { xs: 3, md: 4 },
                py: 3,
                backgroundColor: 'primary.main',
                borderRadius: '0px 0 0 0'
              }}>
                <IconButton
                  onClick={handleGoBackToHome}
                  size="small"
                  sx={{ mr: 2, color: 'white' }}
                >
                  <ArrowBackIcon />
                </IconButton>
                <Box>
                  <Typography 
                    variant="h4"
                    sx={{ 
                      fontSize: { xs: '1.5rem', md: '2.125rem' },
                      color: 'white',
                      fontWeight: 600
                    }}
                  >
                    Registro con Invitación
                  </Typography>
                  {tempCodeData && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: '0.875rem'
                      }}
                    >
                      {tempCodeData.company.name} • Código: {code}
                    </Typography>
                  )}
                </Box>
              </Box>

            {loading && (
              <Box sx={{ py: 2 }} data-testid="loading-skeleton">
                <Box sx={{ mb: 3 }}>
                  <Skeleton 
                    variant="text" 
                    height={32} 
                    sx={{ 
                      width: { xs: '80%', md: '60%' },
                      fontSize: '1.25rem',
                      transform: 'none',
                      borderRadius: 1
                    }} 
                  />
                </Box>
                
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: {
                    xs: '1fr',
                    md: 'repeat(2, 1fr)'
                  },
                  gap: { xs: 2, md: 3 }, 
                  mb: 4
                }}>
                  {Array.from({ length: getSkeletonFieldCount() }, (_, i) => (
                    <Box key={i} sx={{ minHeight: '72px' }}>
                      <Skeleton 
                        variant="rounded" 
                        height={56} 
                        sx={{ 
                          borderRadius: 1,
                          transform: 'none'
                        }} 
                      />
                      <Skeleton 
                        variant="text" 
                        height={16} 
                        width={Math.random() > 0.5 ? '70%' : '45%'} 
                        sx={{ 
                          mt: 0.5, 
                          fontSize: '0.75rem',
                          transform: 'none',
                          borderRadius: 0.5
                        }} 
                      />
                    </Box>
                  ))}
                </Box>
                
                <Box sx={{ 
                  display: { xs: 'none', md: 'flex' }, 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2
                }}>
                  {(currentStep || 0) > 0 && (
                    <Skeleton 
                      variant="rounded" 
                      width={120} 
                      height={36} 
                      sx={{ borderRadius: 1, transform: 'none' }} 
                    />
                  )}
                  <Box sx={{ flexGrow: 1 }} />
                  <Skeleton 
                    variant="rounded" 
                    width={(currentStep || 0) === 0 ? '100%' : 140} 
                    height={36} 
                    sx={{ 
                      borderRadius: 1, 
                      transform: 'none',
                      ml: (currentStep || 0) > 0 ? 2 : 0
                    }} 
                  />
                </Box>
              </Box>
            )}

            {!loading && stepInfo && (
              <>
                <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                  {stepInfo.title}
                </Typography>

                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: {
                    xs: '1fr',
                    md: (stepInfo.fields?.length || 0) === 1 ? '1fr' : 
                        (stepInfo.fields?.length || 0) === 2 ? 'repeat(2, 1fr)' :
                        'repeat(auto-fit, minmax(280px, 1fr))'
                  },
                  gap: { xs: 2, md: 3 }, 
                  mb: 4,
                  minHeight: {
                    xs: (stepInfo.fields?.length || 2) * 80 + 'px',
                    md: Math.ceil((stepInfo.fields?.length || 2) / 2) * 80 + 'px'
                  }
                }}>
                  {stepInfo.fields && stepInfo.fields.map((field) => (
                    <Box key={field.name} sx={{ minHeight: '72px' }} data-field-name={field.name}>
                      {renderField(field)}
                    </Box>
                  ))}
                </Box>

                {generalError && (
                  <Alert severity="error" sx={{ mb: 3, display: { xs: 'none', md: 'block' } }}>
                    <Box component="pre" sx={{ 
                      fontFamily: 'inherit', 
                      margin: 0, 
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {generalError}
                    </Box>
                  </Alert>
                )}

                {/* Desktop Buttons */}
                <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between' }}>
                  {currentStep > 0 && (
                    <Button
                      variant="outlined"
                      onClick={handleBack}
                      disabled={loading}
                      startIcon={<ArrowBackIcon />}
                    >
                      Anterior
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={loading}
                    endIcon={loading ? <CircularProgress size={20} /> : <ArrowForwardIcon />}
                    fullWidth={currentStep === 0}
                  >
                    {currentStep === stepTitles.length - 1 ? 'Completar Registro' : 'Siguiente'}
                  </Button>
                </Box>
              </>
            )}
          </CardContent>

          {/* Mobile Buttons - Bottom fixed */}
          {((!loading && stepInfo) || loading) && (
            <Box sx={{
              display: { xs: 'block', md: 'none' },
              position: 'fixed',
              bottom: 30,
              left: 0,
              right: 0,
              backgroundColor: 'white',
              zIndex: 999
            }}>
              {generalError && (
                <Box sx={{ px: 3, pb: 2 }}>
                  <Alert severity="error">
                    <Box component="pre" sx={{ 
                      fontFamily: 'inherit', 
                      margin: 0, 
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {generalError}
                    </Box>
                  </Alert>
                </Box>
              )}
              
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                px: 3,
                pb: 2
              }}>
              {loading ? (
                <>
                  {(currentStep || 0) > 0 && (
                    <Skeleton 
                      variant="rounded" 
                      width="48%" 
                      height={48} 
                      sx={{ 
                        mr: 1,
                        borderRadius: 1,
                        transform: 'none'
                      }} 
                    />
                  )}
                  <Skeleton 
                    variant="rounded" 
                    width={(currentStep || 0) > 0 ? "48%" : "100%"} 
                    height={48} 
                    sx={{ 
                      borderRadius: 1,
                      transform: 'none',
                      ml: (currentStep || 0) > 0 ? 1 : 0
                    }} 
                  />
                </>
              ) : (
                <>
                  {currentStep > 0 && (
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={handleBack}
                      disabled={loading}
                      startIcon={<ArrowBackIcon />}
                      fullWidth
                      sx={{ 
                        mr: 2,
                        minHeight: '48px',
                        fontSize: '1rem'
                      }}
                    >
                      Anterior
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleNext}
                    disabled={loading}
                    endIcon={loading ? <CircularProgress size={20} /> : <ArrowForwardIcon />}
                    fullWidth
                    sx={{ 
                      minHeight: '48px',
                      fontSize: '1rem'
                    }}
                  >
                    {currentStep === stepTitles.length - 1 ? 'Completar Registro' : 'Siguiente'}
                  </Button>
                </>
              )}
              </Box>
            </Box>
          )}
        </Card>
      </Box>
    </Container>

      {/* Progress Bar - Bottom of page */}
      <Box sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: 1000,
        backgroundColor: 'white',
        borderTop: 'none'
      }}>
        <Box sx={{ pt: 1 }}>
          {loading ? (
            <>
              <Box sx={{ textAlign: 'center', mb: 0.5 }}>
                <Skeleton 
                  variant="text" 
                  width={30} 
                  height={16} 
                  sx={{ 
                    display: 'inline-block',
                    fontSize: '12px',
                    transform: 'none',
                    borderRadius: 0.5
                  }} 
                />
              </Box>
              <Skeleton 
                variant="rectangular" 
                height={8} 
                sx={{ 
                  borderRadius: 1,
                  transform: 'none',
                  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'progress-skeleton 1.5s ease-in-out infinite'
                }} 
              />
            </>
          ) : (
            <>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                fontWeight="medium"
                sx={{
                  fontSize: '12px',
                  textAlign: 'center',
                  mb: 0.5
                }}
              >
                {currentStep !== null && currentStep !== undefined ? getProgressPercentage() : 10}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={currentStep !== null && currentStep !== undefined ? getProgressPercentage() : 10}
                sx={{ 
                  height: 8,
                  backgroundColor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(45deg, #3462C7 30%, #678966 90%)'
                  }
                }}
              />
            </>
          )}
        </Box>
      </Box>

      {/* Session Refresh Modal */}
      <Dialog
        open={showRefreshModal}
        onClose={handleRefreshModalClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          textAlign: 'center', 
          color: 'primary.main',
          fontWeight: 600,
          pb: 1
        }}>
          ⚠️ Sesión de Registro Reiniciada
        </DialogTitle>
        
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Se detectó que la página fue refrescada durante el proceso de registro.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Para garantizar la seguridad de tus datos, la sesión de registro se ha reiniciado. 
            Deberás comenzar el proceso desde el primer paso.
          </Typography>
        </DialogContent>
        
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            variant="contained"
            onClick={handleRefreshModalClose}
            size="large"
            sx={{ 
              minWidth: '200px',
              py: 1.5
            }}
          >
            Comenzar Nuevo Registro
          </Button>
        </DialogActions>
      </Dialog>

      {/* Session Expired Modal */}
      <Dialog
        open={showSessionExpiredModal}
        onClose={handleSessionExpiredModalClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          textAlign: 'center', 
          color: 'warning.main',
          fontWeight: 600,
          pb: 1
        }}>
          ⏰ Sesión Expirada
        </DialogTitle>
        
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Tu sesión de registro ha expirado por inactividad.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Por seguridad, las sesiones de registro expiran después de 30 minutos de inactividad. 
            Para continuar, deberás iniciar sesión o comenzar un nuevo proceso de registro.
          </Typography>
        </DialogContent>
        
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            variant="contained"
            onClick={handleSessionExpiredModalClose}
            size="large"
            sx={{ 
              minWidth: '200px',
              py: 1.5
            }}
          >
            Ir al Inicio de Sesión
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};