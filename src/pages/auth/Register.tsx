import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  DialogActions,
  Menu,
  ListItemText
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
import { useTracking } from '../../hooks/useTracking';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/material.css';
import PhotoCapture from '../../components/PhotoCapture';

// Constantes para índices de pasos (base 0)
const STEP_INDICES = {
  PERSONAL_INFO: 0,
  INVITATION_CODE: 1,
  IDENTITY_VERIFICATION: 2,
  CONTRACTOR_INFO: 3,
  SECURITY: 4
} as const;

const stepTitles = [
  'Información Personal',        // STEP_INDICES.PERSONAL_INFO (0)
  'Código de Invitación',        // STEP_INDICES.INVITATION_CODE (1)
  'Verificación de Identidad',   // STEP_INDICES.IDENTITY_VERIFICATION (2)
  'Datos del Contratista',       // STEP_INDICES.CONTRACTOR_INFO (3)
  'Seguridad'                    // STEP_INDICES.SECURITY (4)
];

// Hook para manejo consistente de errores
const useErrorHandler = () => {
  const handleApiError = React.useCallback((error: any, context: string, showToUser: boolean = true) => {
    console.error(`[${context}] Error:`, error);
    
    if (!showToUser) return null;
    
    if (error.response) {
      // Error de respuesta del servidor
      const status = error.response.status;
      const data = error.response.data;
      const errorDetails = data?.message || data?.error || 'Error del servidor';
      return `Error ${status}: ${errorDetails}`;
    } else if (error.request) {
      // Error de conexión
      return 'Error de conexión: No se pudo conectar con el servidor';
    } else {
      // Otro tipo de error
      return `Error inesperado: ${error.message || 'Error desconocido'}`;
    }
  }, []);
  
  return { handleApiError };
};

// Función para formatear errores del backend de manera legible
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
      // Traducir nombres de campos comunes
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

// Hook para manejar campos de verificación dinámicos
const useVerificationFields = (formData: StepData) => {
  return React.useMemo(() => {
    const fields = [];
    
    // Siempre mostrar selfie primero
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

    // Solo mostrar documento frontal si ya tiene selfie
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

    // Solo mostrar documento trasero si ya tiene frontal
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

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId: urlSessionId } = useParams();
  const { track } = useTracking();
  
  const [sessionId, setSessionId] = useState<string>(urlSessionId || '');
  // Rol quemado - cambiar según necesidad
  const selectedRole = UserRole.CONTRATISTA_HUERFANO;
  const [currentStep, setCurrentStep] = useState<number>(0); // Explicitly typed as number

  // Safety check for currentStep
  const safeCurrentStep = isNaN(currentStep) ? 0 : currentStep;

  // Ref para el contenedor del formulario para scroll automático
  const formContainerRef = React.useRef<HTMLDivElement>(null);

  // Función para hacer scroll automático al último campo capturado
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
    }, 300); // Pequeño delay para permitir que se renderice la imagen
  }, []);

  const loadMockStep = useCallback(async (stepIndex?: number) => {
    // Start loading with minimum time tracking
    if (!loading) {
      setLoading(true);
      setLoadingStartTime(Date.now());
      setMinLoadingTime(true);
    }
    
    const activeStep = stepIndex !== undefined ? stepIndex : currentStep;

    // Inicializar con formData vacío - los datos mock solo se usarán con el botón demo
    setFormData(prev => {
      if (Object.keys(prev).length === 0) {
        console.log('Inicializando con formData vacío');
        return {};
      } else {
        console.log('Manteniendo formData existente:', prev);
        return prev;
      }
    });

    const mockSteps = [
      // Paso 1: Información Básica (basado en curl #4)
      {
        step: STEP_INDICES.PERSONAL_INFO + 1, // +1 para API que espera base 1
        title: 'Información Personal Básica',
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
      // Paso 2: Tipo de Cuenta (basado en curl #5)
      {
        step: STEP_INDICES.INVITATION_CODE + 1, // +1 para API que espera base 1
        title: 'Código de Invitación',
        fields: [
          {
            name: 'invitationCode',
            label: 'Código Temporal',
            type: 'text',
            required: false,
            placeholder: 'Código de 6 caracteres (opcional)',
            helperText: 'Si tienes un código de invitación, ingrésalo para vincularte automáticamente. Si no tienes uno, puedes omitir este paso'
          }
        ]
      },
      // Paso 3: Verificación de Identidad - Los campos se configuran dinámicamente después
      {
        step: STEP_INDICES.IDENTITY_VERIFICATION + 1, // +1 para API que espera base 1
        title: 'Verificación de Identidad',
        fields: [] // Se configurará dinámicamente
      },
      // Paso 4: Datos del Contratista (basado en curl #7)
      {
        step: STEP_INDICES.CONTRACTOR_INFO + 1, // +1 para API que espera base 1
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
      // Paso 5: Seguridad (basado en curl #8)
      {
        step: STEP_INDICES.SECURITY + 1, // +1 para API que espera base 1
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
    
    // Para el paso de verificación de identidad, configurar campos dinámicamente
    let finalStep = { ...currentMockStep };
    if (activeStep === STEP_INDICES.IDENTITY_VERIFICATION) {
      finalStep = {
        ...currentMockStep,
        fields: verificationFields
      };
    }
    
    // Añadir la propiedad data requerida por el tipo StepInfo
    const stepWithData = {
      ...finalStep,
      data: formData
    };
    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setStepInfo(stepWithData);
    console.log('loadMockStep completed, stepInfo set:', stepWithData);
    
    // Ensure minimum loading time before hiding skeleton
    await ensureMinimumLoadingTime();
    setLoading(false);
  }, [currentStep]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Helper function to ensure minimum loading time for better UX
  const ensureMinimumLoadingTime = useCallback(async () => {
    if (loadingStartTime) {
      const elapsedTime = Date.now() - loadingStartTime;
      const minimumLoadingTime = 2000; // 2000ms (2 seconds) minimum loading time
      
      if (elapsedTime < minimumLoadingTime) {
        const remainingTime = minimumLoadingTime - elapsedTime;
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
      setLoadingStartTime(null);
      setMinLoadingTime(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Functions for demo backdoor
  const fillDemoData = useCallback(() => {
    const mockDefaults = {
      firstName: 'Juan Carlos',
      lastName: 'Pérez García',
      email: 'juan.perez@test.com',
      phone: '+50688889999',
      identification: '123456789',
      invitationCode: 'ABC123',
      ordenPatronal: 'OP-2024-001',
      polizaINS: 'INS-567890',
      password: 'Test123!@#',
      confirmPassword: 'Test123!@#',
      acceptTerms: true,
      acceptPrivacyPolicy: true
    };
    
    console.log('Rellenando campos con datos demo:', mockDefaults);
    setFormData(mockDefaults);
    setBackdoorAnchor(null);
  }, []);

  const handleBackdoorClick = (event: React.MouseEvent<HTMLElement>) => {
    setBackdoorAnchor(event.currentTarget);
  };

  const handleBackdoorClose = () => {
    setBackdoorAnchor(null);
  };
  
  // Helper function to determine skeleton field count based on step
  const getSkeletonFieldCount = () => {
    const step = safeCurrentStep;
    switch(step) {
      case STEP_INDICES.PERSONAL_INFO: return 5; // Personal info: name, lastname, email, phone, identification
      case STEP_INDICES.INVITATION_CODE: return 1; // Invitation code
      case STEP_INDICES.IDENTITY_VERIFICATION: return 3; // Identity verification: selfie, id front, id back
      case STEP_INDICES.CONTRACTOR_INFO: return 2; // Contractor info: orden patronal, poliza INS
      case STEP_INDICES.SECURITY: return 4; // Security: password, confirm, 2 checkboxes
      default: return 3;
    }
  };

  // Helper function to calculate progress percentage
  const getProgressPercentage = () => {
    /*
     * Lógica de progreso:
     * - Cada paso completado = 20% (100% / 5 pasos)
     * - Paso actual en progreso = +10% adicional
     * 
     * Ejemplos:
     * currentStep = 0 (Paso 1): 0 completados + 10% actual = 10%
     * currentStep = 1 (Paso 2): 1 completado (20%) + 10% actual = 30%
     * currentStep = 2 (Paso 3): 2 completados (40%) + 10% actual = 50%
     * currentStep = 3 (Paso 4): 3 completados (60%) + 10% actual = 70%
     * currentStep = 4 (Paso 5): 4 completados (80%) + 10% actual = 90%
     * Completado: 100%
     */
    
    // Validar que currentStep sea un número válido
    const safeCurrentStep = isNaN(currentStep) || currentStep === null || currentStep === undefined ? 0 : currentStep;
    
    // Asegurar que esté dentro del rango válido
    const normalizedStep = Math.max(0, Math.min(safeCurrentStep, stepTitles.length - 1));
    
    const stepsCompleted = normalizedStep; // Número de pasos ya completados
    const stepValue = 100 / stepTitles.length; // Valor de cada paso (20%)
    const currentStepProgress = stepValue * 0.5; // Progreso del paso actual (10%)
    
    const totalProgress = (stepsCompleted * stepValue) + currentStepProgress;
    
    // Asegurar que está entre 10% y 90% (nunca 0% ni 100% hasta completar)
    const finalProgress = Math.max(10, Math.min(Math.round(totalProgress), 90));
    
    // Verificar que el resultado no sea NaN
    return isNaN(finalProgress) ? 10 : finalProgress;
  };

  // Debug: Log currentStep changes  
  useEffect(() => {
    console.log('CurrentStep changed to:', currentStep, 'Type:', typeof currentStep, 'isNaN:', isNaN(currentStep));
  }, [currentStep]);
  const [stepInfo, setStepInfo] = useState<StepInfo | null>(null);
  const [formData, setFormData] = useState<StepData>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [successMessages, setSuccessMessages] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  
  // Hooks personalizados
  const verificationFields = useVerificationFields(formData);
  const { handleApiError } = useErrorHandler();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [companies] = useState<any[]>([]);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [validatedCode, setValidatedCode] = useState<string | null>(null);
  const [, setMinLoadingTime] = useState(true);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  const [showRefreshModal, setShowRefreshModal] = useState(false);
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);
  
  // States for demo backdoor button
  const [backdoorAnchor, setBackdoorAnchor] = useState<null | HTMLElement>(null);
  
  // Estado para prevenir loops en photo capture
  const [processingCapture, setProcessingCapture] = useState<string | null>(null);
  
  // Estado para almacenamiento temporal de archivos de imagen durante el registro
  const [temporaryFiles, setTemporaryFiles] = useState<{ [fieldName: string]: File }>({});
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Set page title
  usePageTitle(getPageTitle('Registro'), 'Sistema de Gestión de Seguridad - Registro de usuario');

  // Sistema de gestión de sesiones con timeout y recuperación
  useEffect(() => {
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos
    const ACTIVITY_CHECK_INTERVAL = 60 * 1000; // 1 minuto
    
    let activityCheckId: NodeJS.Timeout;
    let lastActivity = Date.now();

    // Función para actualizar última actividad
    const updateActivity = () => {
      lastActivity = Date.now();
      localStorage.setItem('registrationLastActivity', lastActivity.toString());
    };

    // Función para verificar si la sesión ha expirado
    const checkSessionExpiry = async () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      
      if (timeSinceLastActivity > SESSION_TIMEOUT) {
        // Sesión expirada - limpiar y redirigir
        if (sessionId) {
          try {
            await registrationService.deleteSession(sessionId);
          } catch (error) {
            console.error('Error al eliminar sesión expirada:', error);
          }
        }
        
        // Limpiar estado local
        localStorage.removeItem('registrationSessionId');
        localStorage.removeItem('registrationLastActivity');
        localStorage.removeItem('registrationCurrentStep');
        
        setShowSessionExpiredModal(true);
        return;
      }
    };

    // // Función para recuperar sesión después de refresh
    // const recoverSession = async () => {
    //   // Solo intentar recuperar en casos específicos
    //   if (sessionId || urlSessionId) return;

    //   const savedSessionId = localStorage.getItem('registrationSessionId');
    //   const savedStep = localStorage.getItem('registrationCurrentStep');
    //   const savedActivity = localStorage.getItem('registrationLastActivity');
      
    //   console.log('🔄 Intentando recuperar sesión:', { savedSessionId, savedStep, savedActivity });
      
    //   if (savedSessionId && savedActivity) {
    //     const activityTime = parseInt(savedActivity);
    //     const timeSinceActivity = Date.now() - activityTime;
        
    //     if (timeSinceActivity > SESSION_TIMEOUT) {
    //       // Sesión expirada
    //       console.log('⏰ Sesión expirada, eliminando...');
    //       try {
    //         await registrationService.deleteSession(savedSessionId);
    //       } catch (error) {
    //         console.error('Error al eliminar sesión expirada:', error);
    //       }
          
    //       localStorage.removeItem('registrationSessionId');
    //       localStorage.removeItem('registrationLastActivity');
    //       localStorage.removeItem('registrationCurrentStep');
    //       setShowSessionExpiredModal(true);
    //       return;
    //     }
        
    //     // Recuperar sesión válida
    //     console.log('✅ Recuperando sesión válida:', savedSessionId);
    //     setSessionId(savedSessionId);
        
    //     if (savedStep) {
    //       const step = parseInt(savedStep);
    //       setCurrentStep(step);
    //       await loadMockStep(step);
    //     }
        
    //     lastActivity = activityTime;
    //     updateActivity();
    //   }
    // };

    // Guardar sessionId y step cuando cambien
    if (sessionId) {
      localStorage.setItem('registrationSessionId', sessionId);
      updateActivity();
    }
    
    if (currentStep !== null && currentStep !== undefined) {
      localStorage.setItem('registrationCurrentStep', currentStep.toString());
    }

    // Configurar listeners de actividad
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity);
    });

    // Solo configurar listeners de actividad y verificaciones si hay sesión
    if (sessionId) {
      // Configurar verificación periódica de expiración
      activityCheckId = setInterval(checkSessionExpiry, ACTIVITY_CHECK_INTERVAL);
    } 

    return () => {
      // Limpiar listeners y timeouts
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      
      if (activityCheckId) clearInterval(activityCheckId);
    };
  }, [sessionId, currentStep]);

  // Cleanup al salir del componente
  useEffect(() => {
    // Usar sendBeacon como fallback para navegadores modernos
    if (sessionId && !registrationSuccess) {
      const cleanup = () => {
        if (navigator.sendBeacon) {
          navigator.sendBeacon(
            `${registrationService['apiUrl']}/session/${sessionId}`, 
            JSON.stringify({ action: 'cleanup' })
          );
        }
      };

      window.addEventListener('beforeunload', cleanup);
      
      return () => {
        window.removeEventListener('beforeunload', cleanup);
      };
    }
  }, [sessionId, registrationSuccess]);

  // Reset currentStep cuando se navega directamente al registro
  useEffect(() => {
    const currentPath = window.location.pathname;
    
    if (currentPath === '/register' && (currentStep === null || currentStep === undefined || isNaN(currentStep))) {
      setCurrentStep(0);
    }
  }, [currentStep]); // Incluir currentStep como dependencia

  // Efecto para actualizar campos dinámicos del paso de verificación
  useEffect(() => {
    if (stepInfo && currentStep === STEP_INDICES.IDENTITY_VERIFICATION) {      
      const updatedStepInfo = {
        ...stepInfo,
        fields: verificationFields
      };
      setStepInfo(updatedStepInfo);
    }
  }, [verificationFields, currentStep, stepInfo?.step, formData.idFront, formData.selfie, stepInfo]); // Incluir todas las dependencias

  // Ref para rastrear la inicialización en progreso
  const isInitializing = useRef(false);

  const startRegistration = useCallback(async () => {
    try {
      setLoading(true);
      setLoadingStartTime(Date.now());
      setMinLoadingTime(true);
      
      try {
        // Intentar iniciar sesión con el backend
        const session = await registrationService.startRegistration(selectedRole);
        setSessionId(session.sessionId);
        navigate(`/register/${session.sessionId}`);
        
        // Obtener el primer paso del servidor
        const stepInfo = await registrationService.getCurrentStep(session.sessionId);
        setStepInfo(stepInfo);
        setCurrentStep(stepInfo.step - 1); // Ajustar índice base 0
      } catch (apiError) {
        console.error('Error al iniciar registro con backend, usando modo local:', apiError);
        
        // Fallback: usar datos mock mientras el backend no esté disponible
        const mockSessionId = 'mock-session-' + Date.now();
        setSessionId(mockSessionId);
        navigate(`/register/${mockSessionId}`);
        
        // Asegurar que se carga el primer paso mock
        await loadMockStep(0);
      }
    } catch (error) {
      console.error('Error general al iniciar registro:', error);
      setGeneralError('Error al iniciar el registro');
    } finally {
      await ensureMinimumLoadingTime();
      setLoading(false);
    }
  }, [selectedRole, navigate, loadMockStep, ensureMinimumLoadingTime]);

  // Efecto consolidado para inicialización - evita race conditions y dobles llamadas
  useEffect(() => {
    let mounted = true;
    let initializationTimeout: NodeJS.Timeout;

    const initializeRegistration = async () => {
      if (!mounted) return;
      try {
        if (!sessionId && !urlSessionId && !isInitializing.current) {
          // No hay session ID, iniciar nuevo registro
          isInitializing.current = true;
          if (mounted) {
            setCurrentStep(0); // Asegurar que inicie en paso 0
            await startRegistration();
          }
          isInitializing.current = false;
        } else if (urlSessionId && !sessionId) {
          // Hay sessionId en URL pero no en estado
          if (mounted) {
            setSessionId(urlSessionId);
            await loadMockStep(0);
          }
        } else if (sessionId && !stepInfo) {
          // Ya hay sessionId en estado pero no stepInfo
          if (mounted) await loadMockStep(currentStep);
        }
      } catch (error) {
        console.error('Error en inicialización:', error);
        isInitializing.current = false;
        if (mounted) {
          // Fallback timeout para asegurar que algo se carga
          initializationTimeout = setTimeout(async () => {
            if (mounted && !stepInfo) {
              await loadMockStep(0);
            }
          }, 1000);
        }
      }
    };

    initializeRegistration();

    return () => {
      mounted = false;
      if (initializationTimeout) {
        clearTimeout(initializationTimeout);
      }
    };
  }, [sessionId, urlSessionId, stepInfo, currentStep, loadMockStep, startRegistration]); // Incluir todas las dependencias


  const handleFieldChange = (name: string, value: any) => {
    console.log('Field change:', name, '=', value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value);
    
    setFormData(prev => {
      // Solo actualizar si realmente cambió para prevenir loops
      if (prev[name] !== value) {
        const updated = { ...prev, [name]: value };
        console.log('FormData actualizado:', name, value instanceof File ? `File: ${value.name}` : value);
        return updated;
      } else {
        console.log('Valor no cambió, ignorando actualización para:', name);
        return prev;
      }
    });
    
    setErrors(prev => ({ ...prev, [name]: '' }));
    setSuccessMessages(prev => ({ ...prev, [name]: '' }));

    // No formatting needed for generic identification field

    // Validación en tiempo real para contraseñas
    if (name === 'password' || name === 'confirmPassword') {
      validatePasswords(name, value);
    }

    // Validación en tiempo real para código de invitación
    if (name === 'invitationCode') {
      const trimmedValue = value.trim();
      if (trimmedValue.length > 0 && trimmedValue.length !== 6) {
        setErrors(prev => ({ ...prev, invitationCode: 'El código debe tener exactamente 6 caracteres o dejar vacío' }));
      } else {
        setErrors(prev => ({ ...prev, invitationCode: '' }));
      }
    }
  };

  const analyzeEmail = async (email: string) => {
    if (!email || !email.includes('@')) return;

    try {
      // Validación básica de formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setErrors(prev => ({ ...prev, email: 'Formato de email inválido' }));
        return;
      }

      // Llamar al endpoint para verificar si el email ya existe
      const data = await registrationService.verifyEmail(email);

      if (data.success && data.exists) {
        // Email ya está registrado
        setErrors(prev => ({ 
          ...prev, 
          email: 'Este correo electrónico ya está registrado en el sistema' 
        }));
      } else if (data.success && !data.exists) {
        // Email disponible - limpiar cualquier error anterior
        setErrors(prev => ({ ...prev, email: '' }));
        
        // Analizar dominio para sugerencias
        const domain = email.split('@')[1];
        
        // Detectar empresas conocidas por dominio
        const knownDomains: { [key: string]: string } = {
          'alpha.com': '1',
          'beta.com': '2', 
          'gamma.com': '3'
        };

        if (knownDomains[domain]) {
          // Pre-seleccionar la empresa automáticamente si se reconoce el dominio
          setFormData(prev => ({ ...prev, companyId: knownDomains[domain] }));
        }
      } else if (!data.success && data.retryAfter) {
        // Rate limit excedido
        setErrors(prev => ({ 
          ...prev, 
          email: `${data.error} Intente nuevamente en ${Math.ceil(data?.retryAfter || 0 / 60)} minutos.` 
        }));
      }
    } catch (error) {
      handleApiError(error, 'Verificar Email', false);
      // En caso de error de conexión, limpiar errores pero no mostrar al usuario
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const validateInvitationCode = async (code: string) => {
    if (!code || code.trim() === '') {
      // Si no hay código, limpiar errores y mensajes de éxito
      setErrors(prev => ({ ...prev, invitationCode: '' }));
      setSuccessMessages(prev => ({ ...prev, invitationCode: '' }));
      setValidatedCode(null);
      return;
    }

    // Validar que el código tenga exactamente 6 caracteres
    const trimmedCode = code.trim();
    if (trimmedCode.length !== 6) {
      // Si no tiene exactamente 6 caracteres, mostrar error
      setErrors(prev => ({ ...prev, invitationCode: 'El código debe tener exactamente 6 caracteres' }));
      setSuccessMessages(prev => ({ ...prev, invitationCode: '' }));
      setValidatedCode(null);
      return;
    }

    // Si el código ya fue validado exitosamente, no volver a llamar la API
    if (validatedCode === trimmedCode) {
      return;
    }

    try {
      const data = await registrationService.validateTemporaryCode(code.trim());

      if (data.success && data.data) {
        // Código válido - mostrar información del código y aplicar datos
        const companyName = data.data.company?.name || 'Espacios de Trabajo no especificada';
        const description = data.data.description || '';
        
        // Mostrar información del código válido como mensaje de éxito
        setErrors(prev => ({ ...prev, invitationCode: '' }));
        setSuccessMessages(prev => ({ 
          ...prev, 
          invitationCode: `✓ Código válido - ${companyName}${description ? ` • ${description}` : ''}` 
        }));
        
        // Guardar el código como validado
        setValidatedCode(trimmedCode);
        
        // Pre-llenar información basada en el código temporal
        const updates: { [key: string]: any } = {};
        
        if (data.data.company?.id) {
          updates.companyId = data.data.company.id;
        }
        
        if (Object.keys(updates).length > 0) {
          setFormData(prev => ({ ...prev, ...updates }));
        }

        console.log('Código temporal válido:', {
          company: companyName,
          role: data.data.role,
          expires: data.data.expiresAt,
          usesRemaining: data.data.usesRemaining
        });
      } else if (data.success && !data.data) {
        // Código inválido - limpiar empresa y mostrar error
        setErrors(prev => ({ 
          ...prev, 
          invitationCode: data.message || 'Código temporal inválido o expirado' 
        }));
        setSuccessMessages(prev => ({ ...prev, invitationCode: '' }));
        // Limpiar la selección de empresa
        setFormData(prev => ({ ...prev, companyId: '' }));
      } else if (!data.success) {
        // Error del servidor - limpiar empresa y mostrar error
        setErrors(prev => ({ 
          ...prev, 
          invitationCode: data.error || 'Error al validar el código temporal' 
        }));
        setSuccessMessages(prev => ({ ...prev, invitationCode: '' }));
        // Limpiar la selección de empresa
        setFormData(prev => ({ ...prev, companyId: '' }));
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'Validar Código', true);
      setErrors(prev => ({ 
        ...prev, 
        invitationCode: errorMessage || 'Error de conexión. No se pudo validar el código temporal.' 
      }));
      setSuccessMessages(prev => ({ ...prev, invitationCode: '' }));
      // Limpiar la selección de empresa
      setFormData(prev => ({ ...prev, companyId: '' }));
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

      // Validación de campos requeridos
      if (field.required && !value) {
        newErrors[field.name] = `${field.label} es requerido`;
        isValid = false;
      }

      // Validaciones específicas
      if (field.name === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors[field.name] = 'Email inválido';
          isValid = false;
        }
        
        // Verificar si ya hay un error de email existente
        if (errors.email && errors.email.includes('ya está registrado')) {
          newErrors[field.name] = errors.email;
          isValid = false;
        }
      }

      // Validación específica para código de invitación
      if (field.name === 'invitationCode' && value) {
        const trimmedCode = value.trim();
        if (trimmedCode.length > 0 && trimmedCode.length !== 6) {
          newErrors[field.name] = 'El código debe tener exactamente 6 caracteres o dejar vacío';
          isValid = false;
        }
      }

      if (field.name === 'identification' && value) {
        const cleanValue = value.trim();
        
        // Validar formato general: solo letras, números, espacios y guiones
        if (!/^[A-Za-z0-9\s-]+$/.test(cleanValue)) {
          newErrors[field.name] = 'Solo se permiten letras, números, espacios y guiones';
          isValid = false;
        } else {
          // Contar solo los dígitos para validar cantidad
          const digitsOnly = cleanValue.replace(/[^0-9]/g, '');
          
          if (digitsOnly.length < 9) {
            newErrors[field.name] = 'El documento debe contener al menos 9 dígitos';
            isValid = false;
          } else if (digitsOnly.length > 12) {
            newErrors[field.name] = 'El documento no puede exceder 12 dígitos';
            isValid = false;
          }
          
          // Validar longitud total del documento
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
        // Validar que el número tenga formato internacional válido
        // Debe tener al menos el código de país (+X) y algunos dígitos del número
        const cleanPhone = value.replace(/[\s-()]/g, ''); // Eliminar espacios, guiones y paréntesis
        
        if (!cleanPhone.startsWith('+')) {
          newErrors[field.name] = 'El número debe incluir el código de país (ej: +506 para Costa Rica)';
          isValid = false;
        } else if (cleanPhone.length < 8) { // Mínimo +X XXXX (código país + 4 dígitos)
          newErrors[field.name] = 'Número de teléfono demasiado corto';
          isValid = false;
        } else if (cleanPhone.length > 20) { // Máximo razonable para números internacionales
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

      // Validación para campos de archivo
      if (field.type === 'file' && field.required && !value) {
        newErrors[field.name] = `${field.label} es requerido`;
        isValid = false;
      }

      // Validación de tamaño de archivo (máximo 5MB)
      if (field.type === 'file' && value && value.size > 5 * 1024 * 1024) {
        newErrors[field.name] = 'El archivo no debe exceder 5MB';
        isValid = false;
      }

      // Validación de tipo de archivo
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
      
      // Track step navigation
      track.formEvent('registration_form', 'submit', safeCurrentStep + 1);
      
      // Verificación especial para el paso 1: verificar email antes de continuar
      if (safeCurrentStep === 0) {
        try {
          console.log('Verificando email antes de continuar paso 1:', formData.email);
          const emailVerification = await registrationService.verifyEmail(formData.email);
          
          if (emailVerification.success && emailVerification.exists) {
            setErrors(prev => ({ 
              ...prev, 
              email: 'Este correo electrónico ya está registrado en el sistema' 
            }));
            setLoading(false);
            return;
          }
          
          console.log('Email verificado, continuando con paso 1');
        } catch (emailError) {
          console.error('Error al verificar email:', emailError);
          // Continuar sin verificación si hay error de conexión
        }
      }
      
      // Preparar datos según el paso actual
      const prepareStepData = () => {
        const safeCurrentStep = isNaN(currentStep) ? 0 : currentStep;
        console.log('prepareStepData - currentStep:', currentStep, 'safeCurrentStep:', safeCurrentStep);
        
        switch (safeCurrentStep) {
          case STEP_INDICES.PERSONAL_INFO: // Paso 1 - Información Personal
            return {
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              phone: formData.phone,
              cedula: formData.identification, // Mapear identification a cedula para el backend
              registrationSource: RegistrationSource.NORMAL // Track registration source
            };
          case STEP_INDICES.INVITATION_CODE: // Paso 2 - Código de Invitación
            const code = formData.invitationCode?.trim();
            return code && code.length === 6 ? { temporaryCode: code } : {};
          case STEP_INDICES.IDENTITY_VERIFICATION: // Paso 3 - Verificación de Identidad
            // Solo enviar confirmación de que las imágenes fueron capturadas
            // Los archivos se almacenan temporalmente hasta el registro exitoso
            return {
              identityVerificationCompleted: !!(formData.selfie && formData.idFront),
              documentsCount: Object.keys(temporaryFiles).length
            };
          case STEP_INDICES.CONTRACTOR_INFO: // Paso 4 - Información del Contratista
            return {
              ordenPatronal: formData.ordenPatronal || '',
              polizaINS: formData.polizaINS || '',
              status: 'active'
            };
          case STEP_INDICES.SECURITY: // Paso 5 - Seguridad
            return {
              password: formData.password,
              confirmPassword: formData.confirmPassword,
              acceptTerms: formData.acceptTerms,
              acceptPrivacyPolicy: formData.acceptPrivacyPolicy,
              status: 'active'
            };
          default:
            return {};
        }
      };

      try {
        const stepData = prepareStepData();
        console.log('Payload preparado para paso', currentStep + 1, ':', stepData);
        console.log('FormData actual:', formData);
        
        const response = await registrationService.submitStep(sessionId, stepData);
        
        if (response.success) {
          if (safeCurrentStep === stepTitles.length - 1) {
            // Último paso - registro completado
            console.log('Registro completado, subiendo archivos temporales...', temporaryFiles);
            
            // Si hay archivos temporales, subirlos ahora
            if (Object.keys(temporaryFiles).length > 0) {
              setUploadingFiles(true);
              try {
                // Usar userId del response del registro completado
                const userIdFromResponse = response.userId || response.user?.id;
                console.log('Using userId for file upload:', userIdFromResponse);
                
                if (!userIdFromResponse) {
                  console.error('No userId found in response:', response);
                  setGeneralError('Error: No se pudo obtener el ID del usuario para subir archivos');
                  setUploadingFiles(false);
                  return;
                }
                
                const uploadResponse = await registrationService.uploadUserDocuments(
                  userIdFromResponse,
                  temporaryFiles
                );
                
                if (uploadResponse.success) {
                  console.log('Archivos subidos exitosamente:', uploadResponse.uploadedFiles);
                  // Limpiar archivos temporales después de subida exitosa
                  setTemporaryFiles({});
                } else {
                  console.error('Error subiendo archivos:', uploadResponse.errors);
                  setGeneralError('Registro exitoso, pero hubo problemas subiendo las imágenes. Contacte al administrador.');
                }
              } catch (error) {
                console.error('Error durante subida de archivos:', error);
                setGeneralError('Registro exitoso, pero hubo problemas subiendo las imágenes. Contacte al administrador.');
              } finally {
                setUploadingFiles(false);
              }
            }
            
            track.auth('register', 'form');
            track.event('registration_complete', {
              registration_source: RegistrationSource.NORMAL,
              steps_completed: stepTitles.length,
              session_id: sessionId,
              timestamp: new Date().toISOString()
            });
            track.formEvent('registration_form', 'complete', stepTitles.length);
            setRegistrationSuccess(true);
          } else {
            // Avanzar al siguiente paso
            const nextStep = safeCurrentStep + 1;
            track.formEvent('registration_form', 'complete', nextStep);
            track.event('registration_step_completed', {
              step_number: nextStep,
              step_name: stepTitles[safeCurrentStep],
              session_id: sessionId
            });
            setCurrentStep(nextStep);
            await loadMockStep(nextStep);
          }
        } else {
          if (response.errors) {
            // Verificar si los errores son para campos específicos o generales
            if (typeof response.errors === 'object' && !Array.isArray(response.errors)) {
              // Errores de campos específicos
              setErrors(response.errors);
              console.error('Errores de validación:', response.errors);
            } else {
              // Errores generales (como ID ya inscrito)
              const formattedError = formatBackendErrors(response.errors);
              setGeneralError(formattedError);
              console.error('Errores generales:', response.errors);
            }
          } else {
            const errorMessage = response.message || 'Error al procesar el paso';
            
            // Para el paso de código de invitación, mostrar error en el campo específico
            if (safeCurrentStep === STEP_INDICES.INVITATION_CODE) {
              // Limpiar error general y mostrar en campo específico
              setGeneralError('');
              setErrors(prev => ({ 
                ...prev, 
                invitationCode: errorMessage 
              }));
            } else {
              setGeneralError(`Error en el paso ${safeCurrentStep + 1}: ${errorMessage}`);
            }
            console.error('Error de paso:', response);
          }
        }
      } catch (apiError: any) {
        const errorMessage = handleApiError(apiError, 'Submit Step', true);
        
        // Track registration error
        track.error('registration_step_error', `Step ${safeCurrentStep + 1}: ${errorMessage}`);
        track.formEvent('registration_form', 'error', safeCurrentStep + 1, [errorMessage || 'Unknown error']);
        
        // Para el paso de código de invitación, mostrar error en el campo específico
        if (safeCurrentStep === STEP_INDICES.INVITATION_CODE) {
          setGeneralError('');
          setErrors(prev => ({ 
            ...prev, 
            invitationCode: errorMessage || 'Error de conexión al validar el código' 
          }));
        } else {
          setGeneralError(errorMessage || 'Error al procesar el paso');
        }
      }
    } catch (error) {
      // Para el paso de código de invitación, mostrar error en el campo específico
      if (safeCurrentStep === STEP_INDICES.INVITATION_CODE) {
        setGeneralError('');
        setErrors(prev => ({ 
          ...prev, 
          invitationCode: 'Error inesperado al validar el código' 
        }));
      } else {
        setGeneralError('Error al procesar el paso');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshModalClose = async () => {
    setShowRefreshModal(false);
    // Reiniciar el registro desde el principio
    setCurrentStep(0);
    setSessionId('');
    setFormData({});
    setErrors({});
    setGeneralError('');
    setRegistrationSuccess(false);
    
    // Iniciar una nueva sesión de registro
    try {
      await startRegistration();
    } catch (error) {
      console.error('Error al iniciar nueva sesión después de refresh:', error);
      // Si falla, navegar a registro sin session ID como fallback
      navigate('/register');
    }
  };

  const handleSessionExpiredModalClose = async () => {
    setShowSessionExpiredModal(false);
    
    // Limpiar completamente el estado y localStorage
    setCurrentStep(0);
    setSessionId('');
    setFormData({});
    setErrors({});
    setGeneralError('');
    setRegistrationSuccess(false);
    
    localStorage.removeItem('registrationSessionId');
    localStorage.removeItem('registrationLastActivity');
    localStorage.removeItem('registrationCurrentStep');
    
    // Redirigir al login
    navigate('/login', { 
      state: { 
        message: 'Tu sesión de registro ha expirado por inactividad. Por favor inicia sesión o comienza un nuevo registro.',
        redirectReason: 'session_expired'
      } 
    });
  };

  const handleGoBackToHome = async () => {
    // Eliminar sesión actual si existe
    if (sessionId) {
      try {
        await registrationService.deleteSession(sessionId);
        console.log('Sesión eliminada al regresar al dashboard');
      } catch (error) {
        console.error('Error al eliminar sesión:', error);
        // Continuar navegando aunque falle la eliminación
      }
    }

    // Limpiar estado local y localStorage
    setCurrentStep(0);
    setSessionId('');
    setFormData({});
    setErrors({});
    setGeneralError('');
    setRegistrationSuccess(false);
    
    localStorage.removeItem('registrationSessionId');
    localStorage.removeItem('registrationLastActivity');
    localStorage.removeItem('registrationCurrentStep');
    
    // Navegar al dashboard
    navigate('/dashboard');
  };

  const handleBack = async () => {
    if (currentStep <= 0) return;

    try {
      setLoading(true);
      setGeneralError('');
      
      try {
        // Llamar al API para retroceder un paso
        const response = await registrationService.previousStep(sessionId);
        
        if (response.success) {
          // Convertir de base 1 (API) a base 0 (estado interno)
          const prevStep = response.currentStep - 1;
          setCurrentStep(prevStep);
          await loadMockStep(prevStep);
        } else {
          setGeneralError('No se pudo regresar al paso anterior');
        }
      } catch (apiError: any) {
        handleApiError(apiError, 'Previous Step', false);
        
        // En caso de error, hacer fallback local
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
        // Determinar el tipo de captura basado en el nombre del campo
        let captureType: 'selfie' | 'document_front' | 'document_back';
        if (field.name === 'selfie') {
          captureType = 'selfie';
        } else if (field.name === 'idFront') {
          captureType = 'document_front';
        } else if (field.name === 'idBack') {
          captureType = 'document_back';
        } else {
          captureType = 'document_front'; // Default
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
              console.log('PhotoCapture onCapture called for field:', field.name, 'with:', imageData ? 'data received' : 'no data');
              
              // Prevenir loops - verificar si ya se está procesando este campo
              if (processingCapture === field.name) {
                console.log('Ya se está procesando capture para:', field.name, '- ignorando');
                return;
              }
              
              // Si imageData está vacío, limpiar el campo (botón close)
              if (!imageData || imageData === '') {
                console.log('Limpiando campo:', field.name);
                setProcessingCapture(null);
                handleFieldChange(field.name, '');
                setErrors(prev => ({ ...prev, [field.name]: '' }));
                
                // Limpiar archivo temporal también
                setTemporaryFiles(prev => {
                  const newFiles = { ...prev };
                  delete newFiles[field.name];
                  return newFiles;
                });
                
                return;
              }

              // Verificar que imageData es válido
              if (typeof imageData !== 'string') {
                console.error('imageData inválido:', imageData);
                setProcessingCapture(null);
                return;
              }

              // Prevenir loops - verificar si ya se está procesando
              if (imageData.startsWith('blob:')) {
                console.error('Detectado blob URL, posible loop - ignorando');
                setProcessingCapture(null);
                return;
              }

              // Marcar como procesando
              setProcessingCapture(field.name);

              try {
                // Validar que es base64 válido
                if (!imageData.startsWith('data:image/')) {
                  console.error('ImageData no es base64 válido:', imageData.substring(0, 50));
                  setProcessingCapture(null);
                  return;
                }
                
                console.log('Convirtiendo base64 a File para:', field.name);
                
                // Convertir base64 a File
                let base64Data = imageData;
                
                // Si incluye el prefijo data:image/..., quitarlo
                if (imageData.includes(',')) {
                  base64Data = imageData.split(',')[1];
                }
                
                // Validar que el base64 es válido
                if (!base64Data || base64Data.length === 0) {
                  console.error('Base64 data vacío');
                  setProcessingCapture(null);
                  return;
                }

                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const file = new File([byteArray], `${field.name}.jpg`, { type: 'image/jpeg' });
                
                console.log('Archivo creado exitosamente:', file.name, file.size, 'bytes');
                
                // Almacenar temporalmente el archivo en lugar de enviarlo inmediatamente
                setTemporaryFiles(prev => ({
                  ...prev,
                  [field.name]: file
                }));
                
                // Solo actualizar el campo en el formulario para mostrar la preview
                handleFieldChange(field.name, file);
                
                // Hacer scroll automático al campo recién capturado
                setTimeout(() => {
                  scrollToLastCapturedField(field.name);
                  setProcessingCapture(null);
                }, 100);
                
              } catch (error) {
                console.error('Error convirtiendo base64 a File:', error);
                setErrors(prev => ({ 
                  ...prev, 
                  [field.name]: 'Error al procesar la imagen capturada' 
                }));
                setProcessingCapture(null);
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
                country={'cr'} // Default to Costa Rica, but user can change
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
        
        // Manejo especial para invitationCode
        if (field.name === 'invitationCode') {
          return (
            <Box sx={{ minHeight: '72px' }}>
              <>
                <TextField
                  fullWidth
                  type={field.type}
                  label={field.label}
                  value={value}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  onBlur={(e) => validateInvitationCode(e.target.value)}
                  required={false}
                  error={!!errors[field.name]}
                  helperText={!errors[field.name] ? (successMessages[field.name] || field.helperText) : undefined}
                  placeholder={field.placeholder}
                  sx={{
                    mb: errors[field.name] ? 1 : 2,
                    ...(successMessages[field.name] ? {
                      '& .MuiFormHelperText-root': {
                        color: 'success.main'
                      }
                    } : {})
                  }}
                />
                {errors[field.name] && (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    mb: 2,
                    color: 'error.main'
                  }}>
                    <Box sx={{ fontSize: '16px' }}>⚠️</Box>
                    <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                      {errors[field.name]}
                    </Typography>
                  </Box>
                )}
              </>
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


  // Pantalla de éxito
  if (registrationSuccess) {
    return (
      <Container component="main" maxWidth="sm" disableGutters>
        <Box sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center',
          py: 3,
          px: { xs: 0, md: 3 }
        }}>
          <Card sx={{ 
            width: '100%',
            textAlign: 'center',
            p: 4,
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Logo de marca de agua - Desktop: arriba derecha */}
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
              {/* Ícono de éxito */}
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

              {/* Título de éxito */}
              <Typography variant="h4" gutterBottom sx={{ color: 'success.main', mb: 2 }}>
                ¡Registro Exitoso!
              </Typography>

              {/* Mensaje de éxito */}
              <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
                Tu cuenta ha sido creada exitosamente. 
                {uploadingFiles ? ' Procesando documentos...' : ' Ya puedes iniciar sesión con tus credenciales.'}
              </Typography>

              {/* Indicador de subida de archivos */}
              {uploadingFiles && (
                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">
                    Subiendo documentos de verificación...
                  </Typography>
                </Box>
              )}

              {/* Botón para ir a login */}
              <Button
                variant="contained"
                size="large"
                fullWidth
                disabled={uploadingFiles}
                onClick={() => navigate('/login', { 
                  state: { 
                    message: 'Registro completado exitosamente. Por favor inicia sesión.',
                    email: formData.email 
                  } 
                })}
                sx={{ py: 1.5, mt: uploadingFiles ? 1 : 2 }}
              >
                {uploadingFiles ? 'Procesando...' : 'Ir a Inicio de Sesión'}
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Container>
    );
  }

  // Early loading state to prevent render errors
  if (!stepInfo && loading) {
    return (
      <Container component="main" maxWidth="md" disableGutters>
        <Box sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 0, md: 3 }
        }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Formulario multi-step
  return (
    <>
      {/* Add CSS for skeleton animations */}
      <style>
        {`
          @keyframes progress-skeleton {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          
          @keyframes skeleton-pulse {
            0% { opacity: 1; }
            50% { opacity: 0.4; }
            100% { opacity: 1; }
          }
          
          @keyframes skeleton-wave {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(100%); }
            100% { transform: translateX(100%); }
          }
          
          .skeleton-enhanced {
            position: relative;
            overflow: hidden;
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: skeleton-pulse 1.5s ease-in-out infinite;
          }
          
          .skeleton-enhanced::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
            animation: skeleton-wave 2s ease-in-out infinite;
          }
        `}
      </style>
      <Container component="main" maxWidth="md" disableGutters>
        <Box sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: { xs: 'flex-start', md: 'center' }, 
          py: { xs: 2, md: 3 },
          px: { xs: 0, md: 3 }
        }}>
          <Card sx={{ 
            width: '100%', 
            position: 'relative', 
            pb: { xs: 10, md: 4 },
            boxShadow: { xs: 0, md: 1 },
            border: { xs: 'none', md: '1px solid' },
            borderColor: { xs: 'transparent', md: 'divider' },
            overflow: 'hidden',
            minHeight: { xs: 'calc(100vh - 160px)', md: '600px' },
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Logo de marca de agua - Solo Desktop: arriba derecha */}
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
            
            <CardContent ref={formContainerRef} sx={{ 
              p: { xs: 3, md: 4 }, 
              position: 'relative', 
              zIndex: 1,
              display: { xs: 'block', md: 'flex' },
              flexDirection: { md: 'column' },
              minHeight: { md: '500px' },
              width: { xs: 'auto', md: '100%' },
              maxWidth: { xs: 'none', md: '100%' },
              flex: { xs: 'none', md: 1 },
              boxSizing: 'border-box'
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 3,
                mx: { xs: -3, md: -4 },
                mt: { xs: -3, md: -4 },
                px: { xs: 3, md: 4 },
                py: 3,
                backgroundColor: 'primary.main',
                borderRadius: '8px 8px 0 0'
              }}>
                <IconButton
                  onClick={handleGoBackToHome}
                  size="small"
                  sx={{ mr: 2, color: 'white' }}
                >
                  <ArrowBackIcon />
                </IconButton>
                <Box sx={{ position: 'relative', flex: 1 }}>
                  <Typography 
                    variant="h4"
                    sx={{ 
                      fontSize: { xs: '1.5rem', md: '2.125rem' },
                      color: 'white',
                      fontWeight: 600
                    }}
                  >
                    Registro de Usuario
                  </Typography>
                  
                  {/* Invisible backdoor button */}
                  <Box
                    onClick={handleBackdoorClick}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: 20,
                      height: 20,
                      cursor: 'pointer',
                      opacity: 0,
                      '&:hover': {
                        opacity: 0.1,
                        backgroundColor: 'rgba(255,255,255,0.2)'
                      }
                    }}
                    title="Demo Quick Fill"
                  />
                </Box>
              </Box>

            {loading && (
              <Box sx={{ py: 2 }} data-testid="loading-skeleton">
                {/* Step title skeleton */}
                <Box sx={{ mb: 3 }}>
                  <Skeleton 
                    variant="text" 
                    height={36} 
                    sx={{ 
                      width: { xs: '85%', md: '65%' },
                      fontSize: '1.25rem',
                      transform: 'none',
                      borderRadius: 1,
                      background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'skeleton-pulse 1.5s ease-in-out infinite',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)',
                        animation: 'skeleton-wave 2s ease-in-out infinite'
                      }
                    }} 
                  />
                </Box>
                
                {/* Form fields skeleton */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: {
                    xs: '1fr',
                    md: 'repeat(2, 1fr)'
                  },
                  gap: { xs: 2, md: 3 }, 
                  mb: 4
                }}>
                  {/* Generate realistic number of fields based on current step */}
                  {Array.from({ length: getSkeletonFieldCount() }, (_, i) => (
                    <Box key={i} sx={{ minHeight: '72px' }}>
                      {/* Input field skeleton */}
                      <Skeleton 
                        variant="rounded" 
                        height={56} 
                        sx={{ 
                          borderRadius: 1,
                          transform: 'none',
                          background: 'linear-gradient(90deg, #f5f5f5 25%, #eeeeee 50%, #f5f5f5 75%)',
                          backgroundSize: '200% 100%',
                          animation: 'skeleton-pulse 1.8s ease-in-out infinite',
                          animationDelay: `${i * 0.2}s`,
                          position: 'relative',
                          overflow: 'hidden',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
                            animation: 'skeleton-wave 2.5s ease-in-out infinite',
                            animationDelay: `${i * 0.3}s`
                          }
                        }} 
                      />
                      {/* Helper text skeleton */}
                      <Skeleton 
                        variant="text" 
                        height={14} 
                        width={`${Math.floor(Math.random() * 40) + 40}%`} 
                        sx={{ 
                          mt: 0.75, 
                          fontSize: '0.75rem',
                          transform: 'none',
                          borderRadius: 0.5,
                          background: 'linear-gradient(90deg, #f8f8f8 25%, #f0f0f0 50%, #f8f8f8 75%)',
                          backgroundSize: '200% 100%',
                          animation: 'skeleton-pulse 2s ease-in-out infinite',
                          animationDelay: `${i * 0.25 + 0.5}s`
                        }} 
                      />
                    </Box>
                  ))}
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
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 3, 
                      display: { xs: 'none', md: 'flex' },
                      alignItems: 'center',
                      '& .MuiAlert-icon': {
                        alignSelf: 'flex-start',
                        marginRight: 1,
                        marginTop: 0
                      },
                      '& .MuiAlert-message': {
                        display: 'flex',
                        alignItems: 'center',
                        padding: 0
                      }
                    }}
                  >
                    <Box component="span" sx={{ 
                      fontFamily: 'inherit',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      display: 'inline'
                    }}>
                      {generalError}
                    </Box>
                  </Alert>
                )}

                {/* Botones Desktop */}
                <Box sx={{ display: { xs: 'none', md: 'block' }, mt: 'auto', pt: 4 }}>
                  {loading ? (
                    // Desktop skeleton button - take full width
                    <Skeleton 
                      variant="rounded" 
                      width="100%" 
                      height={38} 
                      sx={{ 
                        borderRadius: 1.5,
                        transform: 'none',
                        background: 'linear-gradient(90deg, #e3f2fd 25%, #bbdefb 50%, #e3f2fd 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'skeleton-pulse 2s ease-in-out infinite',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)',
                          animation: 'skeleton-wave 2.2s ease-in-out infinite'
                        }
                      }} 
                    />
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
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
                      >
                        {currentStep === stepTitles.length - 1 ? 'Completar Registro' : 'Siguiente'}
                      </Button>
                    </Box>
                  )}
                </Box>
              </>
            )}
          </CardContent>

          {/* Botones Mobile - Bottom fixed */}
          <Box sx={{
            display: { xs: 'block', md: 'none' },
            position: 'fixed',
            bottom: 30,
            left: 0,
            right: 0,
            backgroundColor: 'white',
            borderTop: { xs: 'none', md: '1px solid' },
            borderColor: { xs: 'transparent', md: 'divider' },
            zIndex: 999
          }}>
            {/* Logo de marca de agua para mobile */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                py: 1,
                opacity: 0.08
              }}
            >
            </Box>
            
            {/* Error messages for mobile */}
            {generalError && !loading && (
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
            
            {/* Contenedor de botones */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              px: 3
            }}>
            {loading ? (
              // Mobile skeleton buttons - take full width
              <Skeleton 
                variant="rounded" 
                width="100%" 
                height={50} 
                sx={{ 
                  borderRadius: 2,
                  transform: 'none',
                  background: 'linear-gradient(90deg, #e8f5e8 25%, #c8e6c8 50%, #e8f5e8 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'skeleton-pulse 1.8s ease-in-out infinite',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
                    animation: 'skeleton-wave 2.3s ease-in-out infinite'
                  }
                }} 
              />
            ) : (
              // Normal buttons
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
            // Progress bar skeleton
            <>
              <Box sx={{ textAlign: 'center', mb: 0.5 }}>
                <Skeleton 
                  variant="text" 
                  width={35} 
                  height={18} 
                  sx={{ 
                    display: 'inline-block',
                    fontSize: '12px',
                    transform: 'none',
                    borderRadius: 0.5,
                    background: 'linear-gradient(90deg, #f5f5f5 25%, #eeeeee 50%, #f5f5f5 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'skeleton-pulse 1.6s ease-in-out infinite'
                  }} 
                />
              </Box>
              <Skeleton 
                variant="rectangular" 
                height={10} 
                sx={{ 
                  borderRadius: 1.5,
                  transform: 'none',
                  background: 'linear-gradient(90deg, #e1f5fe 0%, #b3e5fc 25%, #4fc3f7 50%, #b3e5fc 75%, #e1f5fe 100%)',
                  backgroundSize: '300% 100%',
                  animation: 'progress-skeleton 2s ease-in-out infinite',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                    animation: 'skeleton-wave 2.5s ease-in-out infinite'
                  }
                }} 
              />
            </>
          ) : (
            // Normal progress bar - solo mostrar si currentStep está inicializado
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

      {/* Modal de Sesión Reiniciada por Refresh */}
      <Dialog
        open={showRefreshModal}
        onClose={handleRefreshModalClose}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 2 }
          }
        }}
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
          <Box sx={{ 
            backgroundColor: 'info.main', 
            color: 'white', 
            borderRadius: 1, 
            p: 2,
            mb: 2
          }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              💡 Consejo: Evita refrescar la página durante el registro para no perder tu progreso.
            </Typography>
          </Box>
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

      {/* Modal de Sesión Expirada */}
      <Dialog
        open={showSessionExpiredModal}
        onClose={handleSessionExpiredModalClose}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 2 }
          }
        }}
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
          <Box sx={{ 
            backgroundColor: 'warning.main', 
            color: 'white', 
            borderRadius: 1, 
            p: 2,
            mb: 2
          }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              🔒 Tus datos están seguros - ninguna información personal se ha perdido permanentemente.
            </Typography>
          </Box>
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

      {/* Demo quick fill menu */}
      <Menu
        anchorEl={backdoorAnchor}
        open={Boolean(backdoorAnchor)}
        onClose={handleBackdoorClose}
      >
        <MenuItem onClick={fillDemoData}>
          <ListItemText primary="Rellenar datos demo" />
        </MenuItem>
      </Menu>
    </>
  );
};