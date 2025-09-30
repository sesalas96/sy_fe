import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  Snackbar,
  Alert as MuiAlert,
  useTheme,
  useMediaQuery,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  TablePagination,
  CircularProgress,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  VerifiedUser as VerifiedIcon,
  WorkspacePremium as CertificationIcon,
  Add as AddIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  AccessTime as AccessTimeIcon,
  Badge as BadgeIcon,
  History as HistoryIcon,
  School as SchoolIcon,
  Description as DescriptionIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  PlayArrow as PlayArrowIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Login as LoginIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  CameraAlt as CameraIcon,
  PhotoLibrary as PhotoLibraryIcon,
  RemoveCircleOutline as RemoveCircleOutlineIcon
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { User, UserRole } from '../../types';
import { userApi } from '../../services/userApi';
import { contractorApi } from '../../services/contractorApi';
import { coursesApi } from '../../services/coursesApi';
import { useAuth } from '../../contexts/AuthContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { verificationsApi } from '../../services/verificationsApi';
import { UserVerificationsPanel } from '../../components/verifications/UserVerificationsPanel';
import { UserCompanyVerificationsManager } from '../../components/verifications/UserCompanyVerificationsManager';
import { reviewsApi } from '../../services/reviewsApi';
import { Review, ReviewSummary as ReviewSummaryType } from '../../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pb: 3 }}>{children}</Box>}
    </div>
  );
}

// Interfaces para las nuevas funcionalidades
interface VerificationInfo {
  status: 'unverified' | 'pending' | 'verified' | 'rejected';
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
  documents: {
    type: string;
    name: string;
    status: 'pending' | 'approved' | 'rejected';
    url?: string;
    uploadedAt: Date;
  }[];
}

interface Certification {
  id: string;
  type: string;
  name: string;
  issuedBy: string;
  issueDate: string;
  expiryDate: string;
  certificateNumber: string;
  documentUrl?: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
}

export const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasRole, user: currentUser, impersonateUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [tabValue, setTabValue] = useState(0);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [impersonating, setImpersonating] = useState(false);
  
  // Estados para verificaciones
  const [userHasPendingVerifications, setUserHasPendingVerifications] = useState(false);
  
  // Estados para contratistas
  const [verificationInfo, setVerificationInfo] = useState<VerificationInfo | null>(null);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  
  // Estados para diálogos
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [certificationDialogOpen, setCertificationDialogOpen] = useState(false);
  const [newCertification, setNewCertification] = useState({
    type: '',
    name: '',
    issuedBy: '',
    issueDate: '',
    expiryDate: '',
    certificateNumber: '',
    documentUrl: ''
  });
  
  // Estados para formularios
  const [verificationStatus, setVerificationStatus] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Estados para el historial
  const [historyType, setHistoryType] = useState<'access' | 'permits' | 'equipment' | 'tasks'>('access');
  const [accessFilter, setAccessFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [accessHistory, setAccessHistory] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // Estados para cursos
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [talentLMSProgress, setTalentLMSProgress] = useState<any>(null);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [courseTabValue, setCourseTabValue] = useState(0);
  const [userCourses, setUserCourses] = useState<any>(null);
  const [talentLMSUser, setTalentLMSUser] = useState<any>(null);
  const [checkingTalentLMS, setCheckingTalentLMS] = useState(false);
  const [signingUpToTalentLMS, setSigningUpToTalentLMS] = useState(false);
  
  // Estados para documentos
  const [userDocuments, setUserDocuments] = useState<any[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('');
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [viewDocumentDialog, setViewDocumentDialog] = useState(false);
  const [viewDocumentUrl, setViewDocumentUrl] = useState('');
  const [viewDocumentName, setViewDocumentName] = useState('');
  const [viewDocumentId, setViewDocumentId] = useState('');
  const [deleteDocumentDialog, setDeleteDocumentDialog] = useState(false);
  
  // Estados para el diálogo de imagen del avatar
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [fullscreenAvatar, setFullscreenAvatar] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [avatarUpdateKey, setAvatarUpdateKey] = useState(0);
  const [documentToDelete, setDocumentToDelete] = useState<{id: string, name: string} | null>(null);
  
  // Estados para reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummaryType | null>(null);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  
  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'success' });

  usePageTitle(user ? `${user.firstName} ${user.lastName}` : 'Detalles del Usuario', 'Información completa del usuario');

  // Function to load user avatar (selfie)
  const loadUserAvatar = useCallback(async (userData: User) => {
    try {
      const userId = userData._id || userData.id;
      if (!userId) {
        console.log('No userId available for avatar loading');
        return;
      }

      console.log('Loading avatar for user:', userId);
      
      // Get all contractor files for the user
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://sybe-production.up.railway.app'}/api/contractor-files/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.files) {
          // Find the selfie file
          const selfieFile = data.files.find((f: any) => f.fieldName === 'selfie');
          
          if (selfieFile && selfieFile.id) {
            console.log('Selfie found, downloading for avatar:', selfieFile.id);
            
            // Download the selfie
            const avatarResponse = await fetch(`${process.env.REACT_APP_API_URL || 'https://sybe-production.up.railway.app'}/api/contractor-files/download/${selfieFile.id}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (avatarResponse.ok) {
              const blob = await avatarResponse.blob();
              const avatarUrl = URL.createObjectURL(blob);
              
              // Limpiar URL anterior si existe
              if (userAvatarUrl) {
                URL.revokeObjectURL(userAvatarUrl);
              }
              
              setUserAvatarUrl(avatarUrl);
              setAvatarUpdateKey(prev => prev + 1); // Forzar re-renderizado
              console.log('User avatar loaded successfully, URL:', avatarUrl);
            } else {
              console.error('Error downloading avatar:', avatarResponse.status, avatarResponse.statusText);
              
              // Si es error 500, probablemente es el problema del Content-Disposition
              if (avatarResponse.status === 500) {
                console.warn('Avatar download failed with 500 error - likely filename encoding issue');
              }
              
              setUserAvatarUrl(null);
            }
          } else {
            console.log('No selfie file found for user');
            setUserAvatarUrl(null);
          }
        } else {
          console.log('No files found for user');
          setUserAvatarUrl(null);
        }
      }
    } catch (error) {
      console.error('Error loading user avatar:', error);
      setUserAvatarUrl(null);
    }
  }, []);

  const loadContractorDataFromAPI = useCallback(async (userId: string) => {
    try {
      // Cargar verificación
      const verificationResponse = await contractorApi.getVerification(userId);
      if (verificationResponse.success && verificationResponse.data) {
        setVerificationInfo(verificationResponse.data);
      }

      // Cargar certificaciones
      const certificationsResponse = await contractorApi.getCertifications(userId);
      if (certificationsResponse.success && certificationsResponse.data) {
        setCertifications(certificationsResponse.data);
      }
      
      // El historial de acceso se cargará mediante el useEffect cuando se actualice el user
    } catch (error) {
      console.error('Error loading contractor data:', error);
      // Si falla, usar datos mock
      loadContractorData(userId);
    }
  }, []);

  const isContractor = useCallback((role: UserRole) => {
    return [
      UserRole.CONTRATISTA_ADMIN,
      UserRole.CONTRATISTA_SUBALTERNOS,
      UserRole.CONTRATISTA_HUERFANO
    ].includes(role);
  }, []);

  const loadUserData = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Cargar datos del usuario
      const userResponse = await userApi.getById(id);
      if (userResponse.success && userResponse.data) {
        setUser(userResponse.data);
        
        // Cargar avatar del usuario
        await loadUserAvatar(userResponse.data);
        
        // Si es contratista, cargar datos adicionales
        if (isContractor(userResponse.data.role)) {
          await loadContractorData(id);
          await loadContractorDataFromAPI(id);
        }
      } else {
        setError('Usuario no encontrado');
      }
    } catch (err) {
      console.error('Error loading user:', err);
      setError('Error al cargar los datos del usuario');
    } finally {
      setLoading(false);
    }
  }, [id, loadContractorDataFromAPI, loadUserAvatar, isContractor]);

  const loadContractorData = async (_userId: string) => {
    try {
      // Mock data por ahora
      setVerificationInfo({
        status: 'verified',
        verifiedBy: 'Admin Safety',
        verifiedAt: new Date('2024-01-15'),
        documents: [
          {
            type: 'cedula',
            name: 'Cédula de Identidad',
            status: 'approved',
            url: '#',
            uploadedAt: new Date('2024-01-10')
          },
          {
            type: 'antecedentes',
            name: 'Certificado de Antecedentes',
            status: 'approved',
            url: '#',
            uploadedAt: new Date('2024-01-11')
          },
          {
            type: 'seguro',
            name: 'Póliza de Seguro',
            status: 'approved',
            url: '#',
            uploadedAt: new Date('2024-01-12')
          }
        ]
      });

      setCertifications([
        {
          id: '1',
          type: 'trabajo_altura',
          name: 'Trabajo en Altura',
          issuedBy: 'Instituto de Seguridad',
          issueDate: '2023-06-15',
          expiryDate: '2025-06-15',
          certificateNumber: 'TA-2023-123',
          verified: true,
          verifiedBy: 'Safety Staff',
          verifiedAt: new Date('2023-06-20')
        },
        {
          id: '2',
          type: 'primeros_auxilios',
          name: 'Primeros Auxilios',
          issuedBy: 'Cruz Roja',
          issueDate: '2023-09-01',
          expiryDate: '2024-09-01',
          certificateNumber: 'PA-2023-456',
          verified: true,
          verifiedBy: 'Safety Staff',
          verifiedAt: new Date('2023-09-05')
        }
      ]);
    } catch (err) {
      console.error('Error loading contractor data:', err);
    }
  };


  const canEditUser = () => {
    return hasRole([UserRole.SUPER_ADMIN, UserRole.SAFETY_STAFF]);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };


  const handleEdit = () => {
    navigate(`/users/${id}/edit`);
  };

  const handleImpersonate = async () => {
    if (!user || !impersonateUser) return;
    
    try {
      setImpersonating(true);
      await impersonateUser(user._id || user.id || '');
      // Navigate to dashboard after successful impersonation
      navigate('/dashboard');
    } catch (error) {
      console.error('Error impersonating user:', error);
      setError('Error al impersonar usuario');
    } finally {
      setImpersonating(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleAvatarFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setSnackbar({
          open: true,
          message: 'Por favor selecciona una imagen válida (JPG, PNG, WEBP)',
          severity: 'error'
        });
        return;
      }

      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setSnackbar({
          open: true,
          message: 'La imagen no debe superar los 5MB',
          severity: 'error'
        });
        return;
      }

      setSelectedAvatarFile(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!selectedAvatarFile || !user) return;

    setUploadingAvatar(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('document', selectedAvatarFile);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'https://sybe-production.up.railway.app'}/api/contractor-files/user/${user._id || user.id}/selfie`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Actualizar la imagen del avatar inmediatamente
        if (data.file && data.file.id) {
          try {
            // Cargar la nueva imagen directamente
            const avatarResponse = await fetch(`${process.env.REACT_APP_API_URL || 'https://sybe-production.up.railway.app'}/api/contractor-files/download/${data.file.id}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (avatarResponse.ok) {
              const blob = await avatarResponse.blob();
              const newAvatarUrl = URL.createObjectURL(blob);
              
              // Limpiar la URL anterior si existe
              if (userAvatarUrl) {
                URL.revokeObjectURL(userAvatarUrl);
              }
              
              // Actualizar el estado con la nueva URL
              setUserAvatarUrl(newAvatarUrl);
              setAvatarUpdateKey(prev => prev + 1); // Forzar re-renderizado
              console.log('Avatar URL updated to:', newAvatarUrl);
            } else if (avatarResponse.status === 500) {
              // Si es error 500, podría ser el problema del Content-Disposition
              // Recargar los datos del usuario completo como alternativa
              console.warn('Error downloading avatar, reloading user data');
              await loadUserAvatar(user);
            }
          } catch (downloadError) {
            console.error('Error downloading new avatar:', downloadError);
            // Como fallback, recargar el avatar del usuario
            await loadUserAvatar(user);
          }
        }

        setSnackbar({
          open: true,
          message: 'Imagen actualizada exitosamente',
          severity: 'success'
        });
        
        setAvatarDialogOpen(false);
        setSelectedAvatarFile(null);
        setAvatarPreviewUrl(null);
      } else {
        throw new Error('Error al actualizar la imagen');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setSnackbar({
        open: true,
        message: 'Error al actualizar la imagen',
        severity: 'error'
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarDialogClose = () => {
    setAvatarDialogOpen(false);
    setSelectedAvatarFile(null);
    setFullscreenAvatar(false);
    setCameraActive(false);
    
    // Detener la cámara si está activa
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    // Limpiar la URL del preview si existe
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
      setAvatarPreviewUrl(null);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setStream(mediaStream);
      setCameraActive(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setSnackbar({
        open: true,
        message: 'No se pudo acceder a la cámara',
        severity: 'error'
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    const video = document.getElementById('avatar-video') as HTMLVideoElement;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `selfie_${Date.now()}.jpg`, { type: 'image/jpeg' });
          setSelectedAvatarFile(file);
          setAvatarPreviewUrl(URL.createObjectURL(blob));
          stopCamera();
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const getRoleLabel = (role: UserRole) => {
    const roleLabels: Record<UserRole, string> = {
      [UserRole.SUPER_ADMIN]: 'Super Admin',
      [UserRole.SAFETY_STAFF]: 'Personal de Safety',
      [UserRole.CLIENT_SUPERVISOR]: 'Supervisor',
      [UserRole.CLIENT_APPROVER]: 'Verificador',
      [UserRole.CLIENT_STAFF]: 'Cliente Interno',
      [UserRole.VALIDADORES_OPS]: 'Validador Operaciones',
      [UserRole.CONTRATISTA_ADMIN]: 'Contratista Admin',
      [UserRole.CONTRATISTA_SUBALTERNOS]: 'Contratista Subalterno',
      [UserRole.CONTRATISTA_HUERFANO]: 'Contratista Independiente'
    };
    return roleLabels[role] || role;
  };

  const getVerificationStatusInfo = (status: string) => {
    switch (status) {
      case 'verified':
        return { label: 'Verificado', color: 'success' as const, icon: <CheckCircleIcon /> };
      case 'pending':
        return { label: 'Pendiente', color: 'warning' as const, icon: <WarningIcon /> };
      case 'rejected':
        return { label: 'Rechazado', color: 'error' as const, icon: <ErrorIcon /> };
      default:
        return { label: 'Sin verificar', color: 'default' as const, icon: <InfoIcon /> };
    }
  };


  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCourseTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCourseTabValue(newValue);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysAgo = (date: Date | string) => {
    const now = new Date();
    const past = new Date(date);
    const diffTime = Math.abs(now.getTime() - past.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'hoy';
    if (diffDays === 1) return '1 día';
    return `${diffDays} días`;
  };

  const loadAccessHistory = useCallback(async (filter?: 'all' | 'success' | 'failed') => {
    if (!user?._id && !user?.id) return;
    
    const userId = user._id || user.id || '';
    setHistoryLoading(true);
    
    try {
      const params: any = {
        page: 1,
        limit: 100
      };
      
      if (filter && filter !== 'all') {
        params.success = filter === 'success';
      }
      
      const loginHistoryResponse = await userApi.getLoginHistory(userId, params);
      
      if (loginHistoryResponse.success && loginHistoryResponse.data.logins) {
        const mappedHistory = loginHistoryResponse.data.logins.map(entry => ({
          id: entry.id,
          timestamp: new Date(entry.date),
          status: entry.success ? 'success' : 'failed',
          ip: entry.ipAddress,
          browser: entry.device?.browser || entry.userAgent,
          location: entry.location || 'Desconocida',
          failureReason: entry.failureReason || null
        }));
        setAccessHistory(mappedHistory);
      }
    } catch (error) {
      console.error('Error loading access history:', error);
      setAccessHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [user?._id, user?.id]);

  const checkTalentLMSUser = useCallback(async () => {
    if (!user?.email) return;
    
    setCheckingTalentLMS(true);
    try {
      const response = await coursesApi.searchTalentLMSUser({ email: user.email });
      if (response.success && response.data) {
        setTalentLMSUser(response.data);
      } else {
        setTalentLMSUser(null);
      }
    } catch (error) {
      console.error('Error checking TalentLMS user:', error);
      setTalentLMSUser(null);
    } finally {
      setCheckingTalentLMS(false);
    }
  }, [user?.email]);

  const loadCourseProgress = useCallback(async () => {
    if (!user?._id && !user?.id) return;
    
    const userId = user._id || user.id || '';
    setCoursesLoading(true);
    
    try {
      // Para todos los usuarios, cargar progreso de TalentLMS
      try {
        const talentProgress = await coursesApi.getUserTalentLMSProgress(userId);
        setTalentLMSProgress(talentProgress);
      } catch (error) {
        console.error('Error loading TalentLMS progress:', error);
        // If user is not in TalentLMS yet, it's ok
      }
      
      // Cargar cursos del usuario (iniciales y adicionales)
      try {
        const userCoursesResponse = await coursesApi.getUserCourses(userId);
        if (userCoursesResponse.success && userCoursesResponse.data) {
          setUserCourses(userCoursesResponse.data);
        } else {
          setUserCourses({
            initial: [],
            additional: [],
            enrollments: [],
            stats: null
          });
        }
      } catch (error) {
        console.error('Error loading user courses:', error);
        // Set empty structure instead of leaving null
        setUserCourses({
          initial: [],
          additional: [],
          enrollments: [],
          stats: null
        });
      }
      
      // Cargar cursos disponibles
      try {
        const availableCoursesResponse = await coursesApi.getTalentLMSAvailableCourses();
        if (availableCoursesResponse.success && availableCoursesResponse.data) {
          setAvailableCourses(availableCoursesResponse.data);
        }
      } catch (error) {
        console.error('Error loading available courses:', error);
      }
    } catch (error) {
      console.error('Error loading course progress:', error);
    } finally {
      setCoursesLoading(false);
    }
  }, [user?._id, user?.id]);

  const loadUserDocuments = useCallback(async () => {
    if (!user?._id && !user?.id) return;
    
    const userId = user._id || user.id || '';
    setDocumentsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://sybe-production.up.railway.app'}/api/contractor-files/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.files) {
          setUserDocuments(data.files);
        }
      }
    } catch (error) {
      console.error('Error loading user documents:', error);
      setUserDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  }, [user?._id, user?.id]);

  const loadUserReviews = useCallback(async () => {
    if (!user?._id && !user?.id) return;
    
    const userId = user._id || user.id || '';
    setReviewsLoading(true);
    
    try {
      // Load reviews for the user (as contractor)
      const reviewsResponse = await reviewsApi.getContractorReviews(userId);
      setReviews(reviewsResponse.reviews || []);
      
      // Load review summary - only if reviews exist
      if (reviewsResponse.reviews && reviewsResponse.reviews.length > 0) {
        try {
          const summaryResponse = await reviewsApi.getContractorSummary(userId);
          setReviewSummary(summaryResponse);
        } catch (summaryError) {
          console.error('Error loading review summary:', summaryError);
          // Calculate summary locally if API fails
          const localSummary = calculateLocalSummary(reviewsResponse.reviews);
          setReviewSummary(localSummary);
        }
      }
    } catch (error) {
      console.error('Error loading user reviews:', error);
      // Set empty state instead of retrying
      setReviews([]);
      setReviewSummary(null);
      
      // Show error to user if it's not a 404
      if (error instanceof Error && !error.message.includes('404')) {
        setSnackbar({
          open: true,
          message: 'Error al cargar las evaluaciones',
          severity: 'error'
        });
      }
    } finally {
      setReviewsLoading(false);
    }
  }, [user?._id, user?.id]);
  
  // Helper function to calculate summary locally
  const calculateLocalSummary = (reviews: Review[]): ReviewSummaryType => {
    const totalReviews = reviews.length;
    const ratings = reviews.map(r => r.rating);
    const averageRating = ratings.reduce((a, b) => a + b, 0) / totalReviews;
    
    const metrics = {
      punctuality: reviews.map(r => r.punctuality).reduce((a, b) => a + b, 0) / totalReviews,
      quality: reviews.map(r => r.quality).reduce((a, b) => a + b, 0) / totalReviews,
      safety: reviews.map(r => r.safety).reduce((a, b) => a + b, 0) / totalReviews,
      communication: reviews.map(r => r.communication).reduce((a, b) => a + b, 0) / totalReviews,
      professionalBehavior: reviews.map(r => r.professionalBehavior).reduce((a, b) => a + b, 0) / totalReviews,
    };
    
    const wouldHireAgainCount = reviews.filter(r => r.wouldHireAgain).length;
    const wouldHireAgainPercentage = (wouldHireAgainCount / totalReviews) * 100;
    
    const ratingDistribution = {
      '1': reviews.filter(r => Math.floor(r.rating) === 1).length,
      '2': reviews.filter(r => Math.floor(r.rating) === 2).length,
      '3': reviews.filter(r => Math.floor(r.rating) === 3).length,
      '4': reviews.filter(r => Math.floor(r.rating) === 4).length,
      '5': reviews.filter(r => Math.floor(r.rating) === 5).length,
    };
    
    return {
      totalReviews,
      averageRating,
      wouldHireAgainPercentage,
      metrics,
      ratingDistribution
    };
  };

  useEffect(() => {
    loadUserData();
  }, [id, loadUserData]);

  // Cleanup avatar URL on unmount
  useEffect(() => {
    return () => {
      if (userAvatarUrl) {
        URL.revokeObjectURL(userAvatarUrl);
      }
    };
  }, [userAvatarUrl]);

  // Debug: Log cuando cambia userAvatarUrl
  useEffect(() => {
    console.log('userAvatarUrl changed to:', userAvatarUrl);
  }, [userAvatarUrl]);

  // Configurar el video cuando el stream cambia
  useEffect(() => {
    if (stream && cameraActive) {
      const video = document.getElementById('avatar-video') as HTMLVideoElement;
      if (video) {
        video.srcObject = stream;
      }
    }
  }, [stream, cameraActive]);

  useEffect(() => {
    if (user && historyType === 'access') {
      loadAccessHistory(accessFilter);
    }
  }, [user, accessFilter, historyType, loadAccessHistory]);

  useEffect(() => {
    // Determine if user can view company verifications
    const canView = hasRole([UserRole.SAFETY_STAFF, UserRole.SUPER_ADMIN]);
    const coursesIdx = canView ? 2 : 1;
    
    if (user && tabValue === coursesIdx) { // Tab de Cursos
      loadCourseProgress();
      checkTalentLMSUser();
    }
  }, [user, tabValue, hasRole, loadCourseProgress, checkTalentLMSUser]);

  useEffect(() => {
    // Determine if user can view company verifications
    const canView = hasRole([UserRole.SAFETY_STAFF, UserRole.SUPER_ADMIN]);
    const documentsIdx = canView ? 3 : 2;
    
    if (user && tabValue === documentsIdx) { // Tab de Documentos
      loadUserDocuments();
    }
  }, [user, tabValue, hasRole, loadUserDocuments]);

  // Verificar si el usuario actual (el que está viendo la página) tiene verificaciones pendientes
  useEffect(() => {
    const checkUserVerifications = async () => {
      // Solo mostrar el tab si es el usuario viendo su propio perfil
      // y no es un super_admin o safety_staff
      if (currentUser && user && currentUser._id === user._id && 
          currentUser.role !== UserRole.SUPER_ADMIN && 
          currentUser.role !== UserRole.SAFETY_STAFF) {
        try {
          const hasPending = await verificationsApi.hasPendingVerifications();
          setUserHasPendingVerifications(hasPending);
        } catch (error) {
          console.error('Error checking verifications:', error);
        }
      }
    };

    checkUserVerifications();
  }, [currentUser, user]);

  // Handle navigation from users list to open company verifications tab
  useEffect(() => {
    if (location.state && (location.state as any).openCompanyVerificationsTab && user && !loading) {
      // Calculate the correct tab index for "Verificaciones de Empresa"
      const canViewCompanyVerifications = hasRole([UserRole.SAFETY_STAFF, UserRole.SUPER_ADMIN]);
      
      if (canViewCompanyVerifications) {
        // "Verificaciones de Empresa" is always at index 1 when visible
        setTabValue(1);
      }
    }
  }, [location.state, user, loading, hasRole]);

  // Handle navigation from users list to open evaluations tab
  useEffect(() => {
    if (location.state && (location.state as any).openEvaluationsTab && user && !loading) {
      if (isContractor(user.role)) {
        // For contractors, "Evaluaciones" is in the contractor-specific tabs
        // Base tabs: ['Información General', 'Historial', 'Cursos', 'Documentos'] = 4 tabs
        let evaluationTabIndex = 4;
        
        // Add 1 if "Verificarme" tab is present
        if (userHasPendingVerifications && currentUser && user && currentUser._id === user._id) {
          evaluationTabIndex += 1;
        }
        
        // Add 1 if "Verificaciones de Empresa" tab is present
        const canViewCompanyVerifications = hasRole([UserRole.SAFETY_STAFF, UserRole.SUPER_ADMIN]);
        if (canViewCompanyVerifications) {
          evaluationTabIndex += 1;
        }
        
        // For contractor roles, add 1 for "Verificación" tab before "Evaluaciones"
        evaluationTabIndex += 1;
        
        // Set the tab to the evaluations tab
        setTabValue(evaluationTabIndex);
      } else {
        // For non-contractors, the evaluation information might be in the general info tab
        // or we might want to show it differently. For now, go to the general info tab
        setTabValue(0);
      }
    }
  }, [location.state, user, loading, hasRole, userHasPendingVerifications, currentUser]);

  // Load reviews when evaluations tab is selected
  useEffect(() => {
    if (user && isContractor(user.role)) {
      // Calculate evaluations tab index
      let evaluationTabIndex = 4; // Base tabs
      
      if (userHasPendingVerifications && currentUser && user && currentUser._id === user._id) {
        evaluationTabIndex += 1;
      }
      
      const canViewCompanyVerifications = hasRole([UserRole.SAFETY_STAFF, UserRole.SUPER_ADMIN]);
      if (canViewCompanyVerifications) {
        evaluationTabIndex += 1;
      }
      
      evaluationTabIndex += 1; // "Verificación" tab
      
      if (tabValue === evaluationTabIndex && !reviewsLoaded && !reviewsLoading) {
        loadUserReviews();
        setReviewsLoaded(true);
      }
    }
  }, [user, tabValue, isContractor, userHasPendingVerifications, currentUser, hasRole, reviewsLoaded, reviewsLoading, loadUserReviews]);

  // Reset reviews when user changes
  useEffect(() => {
    setReviewsLoaded(false);
    setReviews([]);
    setReviewSummary(null);
  }, [user?._id]);

  // Connect stream to video element when camera is active
  useEffect(() => {
    if (stream && cameraActive) {
      const video = document.getElementById('avatar-video') as HTMLVideoElement;
      if (video) {
        video.srcObject = stream;
      }
    }
  }, [stream, cameraActive]);


  const handleSignupToTalentLMS = async () => {
    if (!user) return;
    
    setSigningUpToTalentLMS(true);
    try {
      const userData = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        login: user.email.split('@')[0], // Use email prefix as login
        password: `${user._id}_C123!`, // Generate a default password
        userType: 'Learner-Type' as const, // Use Learner-Type for all users as requested
        language: 'es',
        timezone: '(GMT -05:00) Eastern Time (US & Canada)',
        restrictEmail: 'off',
        customFields: {
          custom_field_1: user.company?.name || 'N/A',
          custom_field_2: String(user.role) || 'N/A'
        }
      };
      
      const response = await coursesApi.signupTalentLMSUser(userData);
      if (response.success) {
        setSnackbar({
          open: true,
          message: 'Usuario registrado exitosamente en TalentLMS',
          severity: 'success'
        });
        // Reload TalentLMS user info
        await checkTalentLMSUser();
      }
    } catch (error: any) {
      console.error('Error signing up to TalentLMS:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error al registrar usuario en TalentLMS';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setSigningUpToTalentLMS(false);
    }
  };

  const handleSaveVerification = async () => {
    if (!user || !verificationStatus) return;
    
    try {
      const response = await contractorApi.updateVerification(user._id, {
        status: verificationStatus as 'verified' | 'rejected',
        rejectionReason: verificationStatus === 'rejected' ? rejectionReason : undefined
      });
      
      if (response.success) {
        setSnackbar({
          open: true,
          message: 'Estado de verificación actualizado',
          severity: 'success'
        });
        setVerificationDialogOpen(false);
        // Recargar datos
        await loadContractorDataFromAPI(user._id);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al actualizar verificación',
        severity: 'error'
      });
    }
  };

  const handleViewDocument = async (fileId: string, fileName: string) => {
    try {
      const token = localStorage.getItem('token');
      console.log('Viewing document:', fileId, fileName);
      
      // Show loading state
      setSnackbar({
        open: true,
        message: 'Cargando documento...',
        severity: 'info'
      });
      
      // Always fetch the document with authorization header
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'https://sybe-production.up.railway.app'}/api/contractor-files/download/${fileId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': '*/*'
          }
        }
      );
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        // Check if it's the header encoding issue
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        if (response.status === 500 && errorText.includes('Invalid character in header')) {
          // Try alternative endpoint or method
          throw new Error('Filename encoding issue - trying alternative method');
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      // Get the blob
      const blob = await response.blob();
      console.log('Blob type:', blob.type, 'Size:', blob.size);
      
      // Create object URL from blob
      const url = URL.createObjectURL(blob);
      
      // Open in dialog
      setViewDocumentUrl(url);
      setViewDocumentName(fileName);
      setViewDocumentId(fileId);
      setViewDocumentDialog(true);
      
      // Close loading snackbar
      setSnackbar({ open: false, message: '', severity: 'info' });
      
    } catch (error) {
      console.error('Error viewing document:', error);
      
      // If it's a filename encoding issue, show dialog with error message
      if (error instanceof Error && error.message.includes('Filename encoding issue')) {
        setSnackbar({
          open: true,
          message: 'El archivo tiene caracteres especiales en el nombre. Usa el botón de descarga.',
          severity: 'warning'
        });
        
        // Open dialog without URL to show error message
        setViewDocumentUrl('');
        setViewDocumentName(fileName);
        setViewDocumentId(fileId);
        setViewDocumentDialog(true);
      } else {
        // Other errors
        setSnackbar({
          open: true,
          message: 'No se pudo abrir el documento. Intenta descargarlo.',
          severity: 'error'
        });
      }
    }
  };

  const handleDeleteDocument = async (fileId: string, fileName: string) => {
    setDocumentToDelete({ id: fileId, name: fileName });
    setDeleteDocumentDialog(true);
  };

  const confirmDeleteDocument = async () => {
    if (!documentToDelete) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://sybe-production.up.railway.app'}/api/contractor-files/${documentToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Documento eliminado exitosamente',
          severity: 'success'
        });
        // Recargar documentos
        await loadUserDocuments();
      } else {
        throw new Error('Error al eliminar documento');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      setSnackbar({
        open: true,
        message: 'Error al eliminar el documento',
        severity: 'error'
      });
    } finally {
      setDeleteDocumentDialog(false);
      setDocumentToDelete(null);
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedFile || !documentType || !user) return;

    setUploadingDocument(true);
    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('userId', user._id || user.id || '');
      formData.append('fieldName', documentType);

      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'https://sybe-production.up.railway.app'}/api/contractor-files/user/${user._id || user.id}/${documentType}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Documento actualizado exitosamente',
          severity: 'success'
        });
        setDocumentDialogOpen(false);
        setSelectedFile(null);
        setDocumentType('');
        // Recargar documentos
        await loadUserDocuments();
      } else {
        throw new Error('Error al subir documento');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      setSnackbar({
        open: true,
        message: 'Error al subir el documento',
        severity: 'error'
      });
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleEnrollInCourse = async (courseId: string) => {
    if (!user || !talentLMSUser) return;
    
    try {
      setSnackbar({
        open: true,
        message: 'Inscribiendo en el curso...',
        severity: 'info'
      });
      
      const response = await coursesApi.enrollToCourse({
        userId: talentLMSUser.id,
        courseId: courseId,
        role: 'learner'
      });
      
      if (response.success) {
        setSnackbar({
          open: true,
          message: response.message || 'Inscripción exitosa',
          severity: 'success'
        });
        
        // Recargar el progreso del curso y la información del usuario en TalentLMS
        await loadCourseProgress();
        await checkTalentLMSUser();
      } else {
        setSnackbar({
          open: true,
          message: response.message || 'Error al inscribirse en el curso',
          severity: 'error'
        });
      }
    } catch (error: any) {
      console.error('Error enrolling in course:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error al inscribirse en el curso',
        severity: 'error'
      });
    }
  };

  const handleUnenrollFromCourse = async (courseId: string) => {
    if (!talentLMSUser) return;
    
    try {
      setSnackbar({
        open: true,
        message: 'Desinscribiendo del curso...',
        severity: 'info'
      });
      
      const response = await coursesApi.unenrollFromCourse({
        userId: talentLMSUser.id,
        courseId: courseId
      });
      
      if (response.success) {
        setSnackbar({
          open: true,
          message: response.message || 'Desinscripción exitosa',
          severity: 'success'
        });
        
        // Recargar el progreso del curso y la información del usuario en TalentLMS
        await loadCourseProgress();
        await checkTalentLMSUser();
      } else {
        setSnackbar({
          open: true,
          message: response.message || 'Error al desinscribirse del curso',
          severity: 'error'
        });
      }
    } catch (error: any) {
      console.error('Error unenrolling from course:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error al desinscribirse del curso',
        severity: 'error'
      });
    }
  };

  const handleGoToCourse = async (courseId: string) => {
    if (!talentLMSUser) return;
    
    try {
      // Obtener la URL base de la aplicación
      const appBaseUrl = window.location.origin;
      
      const response = await coursesApi.goToCourse({
        userId: talentLMSUser.id,
        courseId: courseId,
        // Redirigir al dashboard cuando el usuario cierre sesión en TalentLMS
        logoutRedirect: `${appBaseUrl}/dashboard`,
        // Redirigir a la página de cursos cuando complete el curso
        courseCompletedRedirect: `${appBaseUrl}/courses?completed=true`,
        // Ocultar el logo y el menú en TalentLMS para una experiencia más integrada
        headerHiddenOptions: 'logo;menu'
      });
      
      if (response.success && response.data?.goto_url) {
        // Abrir el curso en una nueva pestaña
        window.open(response.data.goto_url, '_blank');
        
        setSnackbar({
          open: true,
          message: 'Abriendo curso en una nueva pestaña...',
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: response.message || 'Error al obtener la URL del curso',
          severity: 'error'
        });
      }
    } catch (error: any) {
      console.error('Error getting course URL:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error al acceder al curso',
        severity: 'error'
      });
    }
  };

  const handleDownloadDocument = async (fileId: string, fileName: string) => {
    try {
      const token = localStorage.getItem('token');
      console.log('Downloading document:', fileId, fileName);
      
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'https://sybe-production.up.railway.app'}/api/contractor-files/download/${fileId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': '*/*'
          }
        }
      );
      
      if (!response.ok) {
        // Check if it's the header encoding issue
        const errorText = await response.text();
        if (response.status === 500 && errorText.includes('Invalid character in header')) {
          // Try alternative download without Content-Disposition header
          throw new Error('Filename encoding issue');
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Sanitize filename for download
      const sanitizedFileName = fileName.replace(/[^\w\s.-]/g, '_');
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = sanitizedFileName || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      setSnackbar({
        open: true,
        message: 'Documento descargado exitosamente',
        severity: 'success'
      });
      
    } catch (error) {
      console.error('Error downloading document:', error);
      
      // If filename encoding issue, try direct browser download
      if (error instanceof Error && error.message.includes('Filename encoding issue')) {
        const downloadUrl = `${process.env.REACT_APP_API_URL || 'https://sybe-production.up.railway.app'}/api/contractor-files/download/${fileId}`;
        
        // Open in new window as fallback
        window.open(downloadUrl, '_blank');
        
        setSnackbar({
          open: true,
          message: 'Abriendo descarga en nueva ventana...',
          severity: 'info'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Error al descargar el documento',
          severity: 'error'
        });
      }
    }
  };


  if (loading) {
    return <SkeletonLoader variant="cards" />;
  }

  if (error || !user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Usuario no encontrado'}</Alert>
      </Box>
    );
  }

  let tabLabels = ['Información General'];
  
  // Add Company Verifications tab for safety staff and admins in second position
  const canViewCompanyVerifications = hasRole([UserRole.SAFETY_STAFF, UserRole.SUPER_ADMIN]);
  if (canViewCompanyVerifications) {
    tabLabels.push('Verificaciones de Empresa');
  }
  
  // Add the rest of the tabs
  tabLabels.push('Cursos', 'Documentos', 'Historial');
  
  // Agregar tab "Verificarme" si el usuario tiene verificaciones pendientes
  // y es el usuario viendo su propio perfil
  if (userHasPendingVerifications && currentUser && user && currentUser._id === user._id) {
    tabLabels.push('Verificarme');
  }
  
  // Note: These offsets were used for tab indexing but are no longer needed
  // Keeping the logic documented for reference
  

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, overflow: 'hidden' }}>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/users" color="inherit">
          Usuarios
        </Link>
        <Typography color="text.primary">
          {user.firstName} {user.lastName}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
        <Grid container spacing={{ xs: 2, md: 3 }} alignItems={isMobile ? 'flex-start' : 'center'}>
          <Grid size={{ xs: 12, md: 'auto' }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: isMobile ? 'center' : 'flex-start',
              mb: isMobile ? 2 : 0 
            }}>
              <Avatar
                key={`avatar-${avatarUpdateKey}`}
                src={userAvatarUrl || undefined}
                onClick={() => setAvatarDialogOpen(true)}
                sx={{
                  width: { xs: 80, md: 100 },
                  height: { xs: 80, md: 100 },
                  bgcolor: 'primary.main',
                  fontSize: { xs: '1.5rem', md: '2rem' },
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: 3
                  }
                }}
              >
                {!userAvatarUrl && `${user.firstName?.charAt(0)}${user.lastName?.charAt(0)}`}
              </Avatar>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 'grow' }}>
            <Typography 
              variant={isMobile ? 'h5' : 'h4'} 
              gutterBottom
              align={isMobile ? 'center' : 'left'}
            >
              {user.firstName} {user.lastName}
            </Typography>
            {!isMobile && (
              <>
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1, 
                  flexWrap: 'wrap', 
                  mb: 2,
                  justifyContent: 'flex-start'
                }}>
                  <Chip
                    icon={<SecurityIcon />}
                    label={getRoleLabel(user.role)}
                    color="primary"
                    variant="outlined"
                    size="medium"
                  />
                  <Chip
                    icon={user.isActive ? <CheckCircleIcon /> : <CancelIcon />}
                    label={user.isActive ? 'Activo' : 'Inactivo'}
                    color={user.isActive ? 'success' : 'default'}
                    size="medium"
                  />
                  {isContractor(user.role) && verificationInfo && (
                    <Chip
                      icon={getVerificationStatusInfo(verificationInfo.status).icon}
                      label={getVerificationStatusInfo(verificationInfo.status).label}
                      color={getVerificationStatusInfo(verificationInfo.status).color}
                      size="medium"
                    />
                  )}
                </Box>
              </>
            )}
            {isMobile && (
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                <Chip
                  label={getRoleLabel(user.role)}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
                {isContractor(user.role) && verificationInfo && (
                  <Chip
                    icon={getVerificationStatusInfo(verificationInfo.status).icon}
                    label={getVerificationStatusInfo(verificationInfo.status).label}
                    color={getVerificationStatusInfo(verificationInfo.status).color}
                    size="small"
                  />
                )}
              </Box>
            )}
          </Grid>
          {/* Action buttons */}
          <Grid size={{ xs: 12, md: 'auto' }}>
            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: isMobile ? 'center' : 'flex-end',
              mt: isMobile ? 2 : 0
            }}>
              {/* Show impersonate button for SUPER_ADMIN, SAFETY_STAFF, and CLIENT_SUPERVISOR */}
              {hasRole && hasRole([UserRole.SUPER_ADMIN, UserRole.SAFETY_STAFF, UserRole.CLIENT_SUPERVISOR]) && 
               user && user._id !== currentUser?._id && (() => {
                 // Apply role-based restrictions
                 const currentRole = currentUser?.role;
                 const targetRole = user.role;
                 
                 if (currentRole === UserRole.SUPER_ADMIN) {
                   // SUPER_ADMIN can impersonate anyone except other SUPER_ADMINs
                   return targetRole !== UserRole.SUPER_ADMIN;
                 } else if (currentRole === UserRole.SAFETY_STAFF) {
                   // SAFETY_STAFF can't impersonate SUPER_ADMIN or other SAFETY_STAFF
                   return targetRole !== UserRole.SUPER_ADMIN && targetRole !== UserRole.SAFETY_STAFF;
                 } else if (currentRole === UserRole.CLIENT_SUPERVISOR) {
                   // CLIENT_SUPERVISOR can only impersonate users from same company with basic roles
                   const allowedRoles = [UserRole.CLIENT_STAFF, UserRole.CONTRATISTA_ADMIN, 
                                       UserRole.CONTRATISTA_SUBALTERNOS, UserRole.CONTRATISTA_HUERFANO,
                                       UserRole.VALIDADORES_OPS];
                   const sameCompany = user.company?._id === currentUser?.company?._id;
                   return sameCompany && allowedRoles.includes(targetRole);
                 }
                 return false;
               })() && (
                <Button
                  variant="outlined"
                  startIcon={<LoginIcon />}
                  onClick={handleImpersonate}
                  disabled={impersonating}
                  size={isMobile ? 'small' : 'medium'}
                >
                  {impersonating ? 'Impersonando...' : 'Impersonar'}
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ 
        mb: 3,
        ...(isMobile && {
          mx: -2,
          width: 'calc(89vw)',
          borderRadius: 0
        })
      }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons={isMobile ? false : "auto"}
          sx={{
            '& .MuiTabs-scrollableX': {
              overflowX: 'auto',
              '&::-webkit-scrollbar': {
                display: 'none'
              }
            },
            '& .MuiTab-root': {
              minWidth: isMobile ? 'auto' : 160,
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              px: isMobile ? 2 : 3
            }
          }}
        >
          {tabLabels.map((label, index) => (
            <Tab key={index} label={label} />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        {/* Información General */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Información Personal
                  </Typography>
                  {false && canEditUser() && !isMobile && (
                    <IconButton
                      onClick={handleEdit}
                      size="small"
                      color="primary"
                      title="Editar información"
                    >
                      <EditIcon />
                    </IconButton>
                  )}
                </Box>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <PersonIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Nombre completo"
                      secondary={`${user.firstName} ${user.lastName}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <EmailIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Correo electrónico"
                      secondary={user.email}
                    />
                  </ListItem>
                  {(user.profile?.phone || user.phone) && (
                    <ListItem>
                      <ListItemIcon>
                        <PhoneIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Teléfono"
                        secondary={user.profile?.phone || user.phone}
                      />
                    </ListItem>
                  )}
                  {user.cedula && (
                    <ListItem>
                      <ListItemIcon>
                        <BadgeIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Cédula"
                        secondary={user.cedula}
                      />
                    </ListItem>
                  )}
                  {/* Verification Status based on verificationSummary */}
                  {isContractor(user.role) && user.verificationSummary && (
                    <ListItem>
                      <ListItemIcon>
                        <VerifiedIcon 
                          color={
                            user.verificationSummary.globalCompliance === 'compliant' ? "success" : 
                            user.verificationSummary.globalCompliance === 'partial' ? "warning" : 
                            "action"
                          } 
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary="Estado de Verificación"
                        secondary={
                          <Box>
                            <Chip
                              size="small"
                              label={
                                user.verificationSummary.globalCompliance === 'compliant' ? "Conforme" : 
                                user.verificationSummary.globalCompliance === 'partial' ? "Parcialmente Conforme" : 
                                "No Conforme"
                              }
                              color={
                                user.verificationSummary.globalCompliance === 'compliant' ? "success" : 
                                user.verificationSummary.globalCompliance === 'partial' ? "warning" : 
                                "error"
                              }
                            />
                            {user.verificationSummary.details && user.verificationSummary.details.length > 0 && (
                              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                {user.verificationSummary.details[0].verificationsCompleted} de {user.verificationSummary.details[0].verificationsTotal} verificaciones completadas
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Información Laboral
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <SecurityIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Rol"
                      secondary={getRoleLabel(user.role)}
                    />
                  </ListItem>
                  {/* Show primary workspace from company field (legacy) */}
                  {user.company && !user.companies && (
                    <ListItem>
                      <ListItemIcon>
                        <BusinessIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Espacios(s) de trabajo"
                        secondary={user.company.name}
                      />
                    </ListItem>
                  )}
                  
                  {/* Show all workspaces from companies array */}
                  {user.companies && user.companies.length > 0 && (
                    <ListItem>
                      <ListItemIcon>
                        <BusinessIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Espacio${user.companies.length > 1 ? 's' : ''} de trabajo (${user.companies.length})`}
                        secondary={
                          <Box>
                            {user.companies.map((company, index) => (
                              <Box key={company.companyId} sx={{ mb: index < user.companies!.length - 1 ? 1 : 0 }}>
                                <Typography variant="body2" component="span">
                                  {company.companyName}
                                  {company.isPrimary && (
                                    <Chip
                                      label="Principal"
                                      size="small"
                                      color="primary"
                                      sx={{ ml: 1, height: 20 }}
                                    />
                                  )}
                                  {!company.isActive && (
                                    <Chip
                                      label="Inactivo"
                                      size="small"
                                      color="error"
                                      sx={{ ml: 1, height: 20 }}
                                    />
                                  )}
                                </Typography>
                                <Typography variant="caption" display="block" color="text.secondary">
                                  {getRoleLabel(company.role)} • Desde {formatDate(company.startDate)}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        }
                      />
                    </ListItem>
                  )}
                  {/* Departments grouped by company */}
                  {user.departments && user.departments.length > 0 && (
                    <ListItem>
                      <ListItemIcon>
                        <AssignmentIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Departamento${user.departments.length > 1 ? 's' : ''} (${user.departments.length})`}
                        secondary={
                          <Box>
                            {(() => {
                              // Group departments by company
                              const departmentsByCompany = user.departments.reduce((acc, dept) => {
                                const companyName = dept.company?.name || 'Sin empresa';
                                if (!acc[companyName]) {
                                  acc[companyName] = [];
                                }
                                acc[companyName].push(dept);
                                return acc;
                              }, {} as Record<string, typeof user.departments>);

                              return Object.entries(departmentsByCompany).map(([companyName, depts], index) => (
                                <Box key={companyName} sx={{ mb: index < Object.keys(departmentsByCompany).length - 1 ? 1 : 0 }}>
                                  <Typography variant="caption" color="text.secondary" display="block" fontWeight="medium">
                                    {companyName}:
                                  </Typography>
                                  <Box sx={{ ml: 1 }}>
                                    {depts.map((dept, deptIndex) => (
                                      <Typography key={dept._id} variant="body2" component="span">
                                        {dept.name}
                                        {dept.code && (
                                          <Typography variant="caption" color="text.secondary" component="span">
                                            {' '}({dept.code})
                                          </Typography>
                                        )}
                                        {deptIndex < depts.length - 1 ? ', ' : ''}
                                      </Typography>
                                    ))}
                                  </Box>
                                </Box>
                              ));
                            })()}
                          </Box>
                        }
                      />
                    </ListItem>
                  )}
                  {/* Account Status */}
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color={user.isActive ? "success" : "error"} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Estado de la cuenta"
                      secondary={
                        <Chip
                          size="small"
                          label={user.isActive ? "Activa" : "Inactiva"}
                          color={user.isActive ? "success" : "error"}
                        />
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <AccessTimeIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Fecha de registro"
                      secondary={`${formatDate(user.createdAt || new Date())} (hace ${getDaysAgo(user.createdAt || new Date())})`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Compliance Information Card - Only for Contractors */}
          {isContractor(user.role) && user.verificationSummary && (
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Estado de Cumplimiento
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h4" color="primary">
                          {user.verificationSummary.totalCompanies}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Empresas Totales
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h4" color="success.main">
                          {user.verificationSummary.compliantCompanies}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Empresas Conformes
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h4" color="warning.main">
                          {user.verificationSummary.partialCompanies}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Cumplimiento Parcial
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h4" color="error.main">
                          {user.verificationSummary.nonCompliantCompanies}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          No Conformes
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  {/* Global Compliance Status */}
                  <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1" fontWeight="medium">
                      Estado Global:
                    </Typography>
                    <Chip
                      icon={
                        user.verificationSummary.globalCompliance === 'compliant' 
                          ? <CheckCircleIcon /> 
                          : user.verificationSummary.globalCompliance === 'partial' 
                          ? <WarningIcon /> 
                          : <CancelIcon />
                      }
                      label={
                        user.verificationSummary.globalCompliance === 'compliant'
                          ? 'Conforme'
                          : user.verificationSummary.globalCompliance === 'partial'
                          ? 'Parcialmente Conforme'
                          : 'No Conforme'
                      }
                      color={
                        user.verificationSummary.globalCompliance === 'compliant'
                          ? 'success'
                          : user.verificationSummary.globalCompliance === 'partial'
                          ? 'warning'
                          : 'error'
                      }
                    />
                  </Box>
                  
                  {/* Terms acceptance status */}
                  <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip
                      size="small"
                      icon={user.acceptedTerms ? <CheckCircleIcon /> : <CancelIcon />}
                      label={user.acceptedTerms ? "Términos Aceptados" : "Términos Pendientes"}
                      color={user.acceptedTerms ? "success" : "default"}
                      variant="outlined"
                    />
                    <Chip
                      size="small"
                      icon={user.acceptedPrivacyPolicy ? <CheckCircleIcon /> : <CancelIcon />}
                      label={user.acceptedPrivacyPolicy ? "Privacidad Aceptada" : "Privacidad Pendiente"}
                      color={user.acceptedPrivacyPolicy ? "success" : "default"}
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={canViewCompanyVerifications ? 4 : 3}>
        {/* Historial de Actividades */}
        <Box>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center', 
            justifyContent: 'space-between', 
            gap: 2,
            mb: 3 
          }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon />
              {!isMobile && 'Historial de Actividades'}
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: 1,
              flexWrap: 'wrap',
              justifyContent: isMobile ? 'center' : 'flex-end'
            }}>
              <Button
                size={isMobile ? 'small' : 'small'}
                variant={historyType === 'access' ? 'contained' : 'outlined'}
                onClick={() => setHistoryType('access')}
                sx={{ flexGrow: isMobile ? 1 : 0, minWidth: isMobile ? 0 : 'auto' }}
              >
                Acceso
              </Button>
              <Button
                size={isMobile ? 'small' : 'small'}
                variant={historyType === 'equipment' ? 'contained' : 'outlined'}
                onClick={() => setHistoryType('equipment')}
                sx={{ flexGrow: isMobile ? 1 : 0, minWidth: isMobile ? 0 : 'auto' }}
              >
                Equipos
              </Button>
            </Box>
          </Box>

          {historyType === 'access' && (
            <Box>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'stretch' : 'center', 
                justifyContent: 'space-between', 
                gap: 2,
                mb: 2 
              }}>
                <Typography variant="subtitle1">Historial de Accesos</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant={accessFilter === 'all' ? 'contained' : 'outlined'}
                    onClick={() => setAccessFilter('all')}
                  >
                    Todos
                  </Button>
                  <Button
                    size="small"
                    variant={accessFilter === 'success' ? 'contained' : 'outlined'}
                    color="success"
                    onClick={() => setAccessFilter('success')}
                  >
                    Exitosos
                  </Button>
                  <Button
                    size="small"
                    variant={accessFilter === 'failed' ? 'contained' : 'outlined'}
                    color="error"
                    onClick={() => setAccessFilter('failed')}
                  >
                    Fallidos
                  </Button>
                </Box>
              </Box>

              {historyLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : isMobile ? (
                // Vista móvil - Cards
                <Stack spacing={2}>
                  {accessHistory.length === 0 ? (
                    <Alert severity="info">
                      No hay registros de acceso disponibles
                    </Alert>
                  ) : (
                    accessHistory
                      .filter(record => accessFilter === 'all' || 
                        (accessFilter === 'success' && record.status === 'success') ||
                        (accessFilter === 'failed' && record.status === 'failed'))
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((record) => (
                        <Card key={record.id} variant="outlined">
                          <CardContent sx={{ pb: 2, '&:last-child': { pb: 2 } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                {formatDateTime(record.timestamp)}
                              </Typography>
                              <Chip
                                label={record.status === 'success' ? 'Exitoso' : 'Fallido'}
                                color={record.status === 'success' ? 'success' : 'error'}
                                size="small"
                              />
                            </Box>
                            <Grid container spacing={1}>
                              <Grid size={6}>
                                <Typography variant="caption" color="text.secondary">IP</Typography>
                                <Typography variant="body2">{record.ip}</Typography>
                              </Grid>
                              <Grid size={6}>
                                <Typography variant="caption" color="text.secondary">Navegador</Typography>
                                <Typography variant="body2">{record.browser}</Typography>
                              </Grid>
                              <Grid size={12}>
                                <Typography variant="caption" color="text.secondary">Ubicación</Typography>
                                <Typography variant="body2">{record.location}</Typography>
                              </Grid>
                              {record.failureReason && (
                                <Grid size={12}>
                                  <Alert severity="error" sx={{ mt: 1 }}>
                                    <Typography variant="caption">{record.failureReason}</Typography>
                                  </Alert>
                                </Grid>
                              )}
                            </Grid>
                          </CardContent>
                        </Card>
                      ))
                  )}
                </Stack>
              ) : (
                // Vista desktop - Tabla
                <TableContainer sx={{ maxHeight: 440 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Fecha y Hora</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>IP</TableCell>
                        <TableCell>Navegador</TableCell>
                        <TableCell>Ubicación</TableCell>
                        <TableCell>Razón de Fallo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {accessHistory.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <Typography variant="body2" color="text.secondary">
                              No hay registros de acceso disponibles
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        accessHistory
                          .filter(record => accessFilter === 'all' || 
                            (accessFilter === 'success' && record.status === 'success') ||
                            (accessFilter === 'failed' && record.status === 'failed'))
                          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                          .map((record) => (
                            <TableRow key={record.id}>
                              <TableCell>{formatDateTime(record.timestamp)}</TableCell>
                              <TableCell>
                                <Chip
                                  label={record.status === 'success' ? 'Exitoso' : 'Fallido'}
                                  color={record.status === 'success' ? 'success' : 'error'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{record.ip}</TableCell>
                              <TableCell>{record.browser}</TableCell>
                              <TableCell>{record.location}</TableCell>
                              <TableCell>{record.failureReason || '-'}</TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {accessHistory.length > 0 && (
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={accessHistory.filter(record => accessFilter === 'all' || 
                    (accessFilter === 'success' && record.status === 'success') ||
                    (accessFilter === 'failed' && record.status === 'failed')).length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              )}
            </Box>
          )}

          {historyType === 'permits' && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No hay permisos de trabajo registrados
              </Typography>
            </Box>
          )}

          {historyType === 'equipment' && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No hay registros de equipos disponibles
              </Typography>
            </Box>
          )}

          {historyType === 'tasks' && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No hay tareas registradas
              </Typography>
            </Box>
          )}
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={canViewCompanyVerifications ? 2 : 1}>
        {/* Cursos */}
        <Grid container spacing={3}>
          <Grid size={12}>
            <Card>
              <CardContent>

                {coursesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    {/* Tabs para Información General, Mis Cursos y Cursos Disponibles */}
                    <Tabs value={courseTabValue} onChange={handleCourseTabChange} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
                      <Tab label="Información General" />
                      <Tab label={`Cursos del usuario ${userCourses ? `(${(userCourses.initial?.length || 0) + (userCourses.additional?.length || 0) + (userCourses.enrollments?.length || 0)})` : ''}`} />
                      <Tab label={`Cursos Disponibles ${availableCourses ? `(${availableCourses.length})` : ''}`} />
                    </Tabs>
                  </>
                )}

                {/* Tab Panel 0: Información General */}
                {courseTabValue === 0 && (
                  <Box>
                    {checkingTalentLMS ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                      </Box>
                    ) : talentLMSUser ? (
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Usuario TalentLMS
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 6 }}>
                              <Typography variant="body2" color="text.secondary">ID</Typography>
                              <Typography variant="body1" gutterBottom>{talentLMSUser.id}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                              <Typography variant="body2" color="text.secondary">Login</Typography>
                              <Typography variant="body1" gutterBottom>{talentLMSUser.login}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                              <Typography variant="body2" color="text.secondary">Email</Typography>
                              <Typography variant="body1" gutterBottom>{talentLMSUser.email}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                              <Typography variant="body2" color="text.secondary">Tipo de Usuario</Typography>
                              <Typography variant="body1" gutterBottom>{talentLMSUser.user_type}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                              <Typography variant="body2" color="text.secondary">Estado</Typography>
                              <Chip 
                                label={talentLMSUser.status === 'active' ? 'Activo' : 'Inactivo'} 
                                color={talentLMSUser.status === 'active' ? 'success' : 'default'}
                                size="small"
                              />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                              <Typography variant="body2" color="text.secondary">Último Acceso</Typography>
                              <Typography variant="body1" gutterBottom>
                                {talentLMSUser.last_login ? formatDate(talentLMSUser.last_login) : 'Nunca'}
                              </Typography>
                            </Grid>
                            {talentLMSUser.login_key && (
                              <Grid size={12}>
                                <Typography variant="body2" color="text.secondary">Login Key</Typography>
                                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                  {talentLMSUser.login_key}
                                </Typography>
                              </Grid>
                            )}
                          </Grid>
                          
                        </CardContent>
                      </Card>
                    ) : (
                      <Alert severity="warning" action={
                        <Button 
                          color="inherit" 
                          size="small"
                          onClick={handleSignupToTalentLMS}
                          disabled={signingUpToTalentLMS}
                          startIcon={signingUpToTalentLMS && <CircularProgress size={16} />}
                        >
                          {signingUpToTalentLMS ? 'Registrando...' : 'Registrar en TalentLMS'}
                        </Button>
                      }>
                        Este usuario no está registrado en TalentLMS. Regístralo para que pueda acceder a los cursos.
                      </Alert>
                    )}
                  </Box>
                )}

                {/* Tab Panel 1: Mis Cursos */}
                {courseTabValue === 1 && (
                  <>
                    {(userCourses && (userCourses.initial?.length > 0 || userCourses.additional?.length > 0)) || 
                     (talentLMSUser && talentLMSUser.courses && talentLMSUser.courses.length > 0) ? (
                      <Stack spacing={3}>
                        {/* Cursos Iniciales */}
                        {userCourses.initial?.length > 0 && (
                          <>
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <SchoolIcon color="primary" />
                              Cursos Iniciales
                            </Typography>
                            <Stack spacing={2}>
                              {userCourses.initial.map((course: any, index: number) => (
                                <Card key={`initial-${index}`} variant="outlined">
                                  <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                      <Box sx={{ flex: 1 }}>
                                        <Typography variant="subtitle1" fontWeight="medium">
                                          {course}
                                        </Typography>
                                        <Chip 
                                          label="Curso Inicial" 
                                          color="primary" 
                                          size="small"
                                          sx={{ mt: 1 }}
                                        />
                                      </Box>
                                    </Box>
                                  </CardContent>
                                </Card>
                              ))}
                            </Stack>
                          </>
                        )}

                        {/* Cursos Adicionales */}
                        {userCourses.additional?.length > 0 && (
                          <>
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3 }}>
                              <SchoolIcon color="secondary" />
                              Cursos Adicionales
                            </Typography>
                            <Stack spacing={2}>
                              {userCourses.additional.map((course: any, index: number) => (
                                <Card key={`additional-${index}`} variant="outlined">
                                  <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                      <Box sx={{ flex: 1 }}>
                                        <Typography variant="subtitle1" fontWeight="medium">
                                          {course.name || course}
                                        </Typography>
                                        {course.expiryDate && (
                                          <Typography variant="body2" color="text.secondary">
                                            Vence: {formatDate(course.expiryDate)}
                                          </Typography>
                                        )}
                                        <Chip 
                                          label="Curso Adicional" 
                                          color="secondary" 
                                          size="small"
                                          sx={{ mt: 1 }}
                                        />
                                      </Box>
                                    </Box>
                                  </CardContent>
                                </Card>
                              ))}
                            </Stack>
                          </>
                        )}


                        {/* Cursos en TalentLMS */}
                        {talentLMSProgress && talentLMSProgress.courses && talentLMSProgress.courses.length > 0 && (
                          <>
                            <Divider sx={{ my: 3 }} />
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <SchoolIcon color="primary" />
                              Progreso en TalentLMS
                            </Typography>
                            <Stack spacing={2}>
                              {talentLMSProgress.courses.map((course: any) => (
                                <Card key={course.id} variant="outlined">
                                  <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                      <Box sx={{ flex: 1 }}>
                                        <Typography variant="h6">
                                          {course.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                          ID: {course.id}
                                        </Typography>
                                        <Box sx={{ mt: 2 }}>
                                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2">Progreso</Typography>
                                            <Typography variant="body2" fontWeight="medium">{course.completionPercentage}%</Typography>
                                          </Box>
                                          <LinearProgress 
                                            variant="determinate" 
                                            value={course.completionPercentage} 
                                            sx={{ height: 8, borderRadius: 4 }}
                                            color={course.status === 'completed' ? 'success' : 'primary'}
                                          />
                                        </Box>
                                      </Box>
                                      <Box sx={{ ml: 2, textAlign: 'right' }}>
                                        <Chip 
                                          label={
                                            course.status === 'completed' ? 'Completado' : 
                                            course.status === 'not_started' ? 'No iniciado' : 
                                            'En Progreso'
                                          } 
                                          color={
                                            course.status === 'completed' ? 'success' : 
                                            course.status === 'not_started' ? 'default' : 
                                            'warning'
                                          } 
                                          size="small"
                                          sx={{ mb: 1 }}
                                        />
                                        <Typography variant="caption" display="block" color="text.secondary">
                                          {course.enrollmentDate && `Inscrito: ${formatDate(course.enrollmentDate)}`}
                                        </Typography>
                                        {course.completionDate && (
                                          <Typography variant="caption" display="block" color="text.secondary">
                                            Completado: {formatDate(course.completionDate)}
                                          </Typography>
                                        )}
                                        {course.status === 'completed' && course.certificateUrl && (
                                          <Button
                                            size="small"
                                            startIcon={<DownloadIcon />}
                                            sx={{ mt: 1 }}
                                            href={course.certificateUrl}
                                            target="_blank"
                                          >
                                            Certificado
                                          </Button>
                                        )}
                                      </Box>
                                    </Box>
                                  </CardContent>
                                </Card>
                              ))}
                            </Stack>
                          </>
                        )}

                        {/* Cursos Inscritos en TalentLMS - Detallado */}
                        {talentLMSUser && talentLMSUser.courses && talentLMSUser.courses.length > 0 && (
                          <>
                            <Divider sx={{ my: 3 }} />
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <SchoolIcon color="info" />
                              Cursos Inscritos en TalentLMS ({talentLMSUser.courses.length})
                            </Typography>
                            <Stack spacing={2}>
                              {talentLMSUser.courses.map((course: any) => (
                                <Card key={course.id} variant="outlined" sx={{ 
                                  borderColor: course.expired_on ? 'error.main' : 
                                              course.completion_percentage === 100 ? 'success.main' : 
                                              'divider' 
                                }}>
                                  <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                      <Box sx={{ flex: 1 }}>
                                        <Typography variant="h6" gutterBottom>
                                          {course.name}
                                        </Typography>
                                        
                                        <Grid container spacing={2} sx={{ mt: 1 }}>
                                          <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="body2" color="text.secondary">
                                              <strong>ID del Curso:</strong> {course.id}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                              <strong>Categoría:</strong> {course.category || 'Sin categoría'}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                              <strong>Inscrito:</strong> {formatDate(course.enrolled_on)}
                                            </Typography>
                                            {course.completed_on && (
                                              <Typography variant="body2" color="text.secondary">
                                                <strong>Completado:</strong> {formatDate(course.completed_on)}
                                              </Typography>
                                            )}
                                            {course.expired_on && (
                                              <Typography variant="body2" color="error">
                                                <strong>Expirado:</strong> {formatDate(course.expired_on)}
                                              </Typography>
                                            )}
                                          </Grid>
                                          
                                          <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="body2" color="text.secondary">
                                              <strong>Estado:</strong> {course.completion_status_formatted || course.completion_status || 'En progreso'}
                                            </Typography>
                                            {course.total_time && (
                                              <Typography variant="body2" color="text.secondary">
                                                <strong>Tiempo Total:</strong> {course.total_time_formatted || course.total_time}
                                              </Typography>
                                            )}
                                            {course.time_spent && (
                                              <Typography variant="body2" color="text.secondary">
                                                <strong>Tiempo Invertido:</strong> {course.time_spent_formatted || course.time_spent}
                                              </Typography>
                                            )}
                                            {course.last_accessed_unit_name && (
                                              <Typography variant="body2" color="text.secondary">
                                                <strong>Última Unidad:</strong> {course.last_accessed_unit_name}
                                              </Typography>
                                            )}
                                          </Grid>
                                        </Grid>

                                        {/* Progress bar */}
                                        <Box sx={{ mt: 2 }}>
                                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2">Progreso</Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                              {course.completion_percentage}%
                                            </Typography>
                                          </Box>
                                          <LinearProgress 
                                            variant="determinate" 
                                            value={course.completion_percentage} 
                                            sx={{ 
                                              height: 10, 
                                              borderRadius: 5,
                                              backgroundColor: 'grey.300',
                                              '& .MuiLinearProgress-bar': {
                                                borderRadius: 5,
                                              }
                                            }}
                                            color={course.completion_percentage === 100 ? 'success' : 'primary'}
                                          />
                                        </Box>

                                        {/* Status chips and actions */}
                                        <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                                          <Chip 
                                            label={`${course.completion_percentage}% Completado`}
                                            color={course.completion_percentage === 100 ? 'success' : 'primary'}
                                            size="small"
                                          />
                                          {course.expired_on && (
                                            <Chip 
                                              label="Expirado"
                                              color="error"
                                              size="small"
                                            />
                                          )}
                                          {course.certification && (
                                            <Chip 
                                              label="Con Certificación"
                                              color="info"
                                              size="small"
                                              variant="outlined"
                                            />
                                          )}
                                        </Box>

                                        {/* Action buttons */}
                                        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                          <Button
                                            size="small"
                                            variant="contained"
                                            color="primary"
                                            startIcon={<VisibilityIcon />}
                                            onClick={() => handleGoToCourse(course.id)}
                                          >
                                            Ir al Curso
                                          </Button>
                                          <Button
                                            size="small"
                                            variant="outlined"
                                            color="error"
                                            startIcon={<RemoveCircleOutlineIcon />}
                                            onClick={() => handleUnenrollFromCourse(course.id)}
                                          >
                                            Desinscribir
                                          </Button>

                                          {course.last_accessed_unit_url && (
                                            <Button
                                              size="small"
                                              variant="outlined"
                                              href={course.last_accessed_unit_url}
                                              target="_blank"
                                              startIcon={<PlayArrowIcon />}
                                            >
                                              Continuar Curso
                                            </Button>
                                          )}
                                          {course.completion_percentage === 100 && course.certification && (
                                            <Button
                                              size="small"
                                              variant="contained"
                                              color="success"
                                              startIcon={<DownloadIcon />}
                                            >
                                              Descargar Certificado
                                            </Button>
                                          )}
                                        </Box>
                                      </Box>
                                    </Box>
                                  </CardContent>
                                </Card>
                              ))}
                            </Stack>
                          </>
                        )}
                      </Stack>
                    ) : (
                      <Alert severity="info">
                        {coursesLoading ? 'Cargando cursos...' : 'No hay cursos asignados a este usuario.'}
                      </Alert>
                    )}
                  </>
                )}

                {/* Tab Panel 2: Cursos Disponibles */}
                {courseTabValue === 2 && (
                  <>
                    {availableCourses && availableCourses.length > 0 ? (
                      <Grid container spacing={2}>
                        {availableCourses.map((course: any) => (
                          <Grid size={{ xs: 12, md: 6 }} key={course.id}>
                            <Card variant="outlined">
                              <CardContent>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                  {/* Avatar del curso */}
                                  <Avatar
                                    src={course.avatar || course.big_avatar}
                                    sx={{ width: 60, height: 60 }}
                                  >
                                    <SchoolIcon />
                                  </Avatar>
                                  
                                  {/* Información del curso */}
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle1" fontWeight="medium">
                                      {course.name}
                                    </Typography>
                                    
                                    {course.description && (
                                      <Typography 
                                        variant="body2" 
                                        color="text.secondary"
                                        sx={{ 
                                          mt: 0.5,
                                          display: '-webkit-box',
                                          WebkitLineClamp: 2,
                                          WebkitBoxOrient: 'vertical',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis'
                                        }}
                                        dangerouslySetInnerHTML={{ __html: course.description }}
                                      />
                                    )}
                                    
                                    <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                                      {course.certification && (
                                        <Chip
                                          icon={<CertificationIcon />}
                                          label={`Certificado: ${course.certification_duration || 'N/A'}`}
                                          size="small"
                                          color="success"
                                        />
                                      )}
                                      
                                      {course.time_limit && course.time_limit !== "0" && (
                                        <Chip
                                          icon={<AccessTimeIcon />}
                                          label={`Límite: ${course.time_limit} horas`}
                                          size="small"
                                        />
                                      )}
                                      
                                      <Chip
                                        label={course.status === 'active' ? 'Activo' : 'Inactivo'}
                                        size="small"
                                        color={course.status === 'active' ? 'primary' : 'default'}
                                      />
                                    </Box>
                                  </Box>
                                  
                                  {/* Acción */}
                                  {course.status === 'active' && (
                                    <Box>
                                      <Button
                                        variant="contained"
                                        size="small"
                                        startIcon={<AddIcon />}
                                        onClick={() => handleEnrollInCourse(course.id)}
                                      >
                                        Inscribirse
                                      </Button>
                                    </Box>
                                  )}
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <Alert severity="info">
                        No hay cursos disponibles en este momento.
                      </Alert>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={canViewCompanyVerifications ? 3 : 2}>
        {/* Documentos */}
        <Grid container spacing={3}>
          <Grid size={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FolderIcon color="primary" />
                    Documentos del Usuario
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip 
                      label={`${userDocuments.length} documentos`} 
                      color="primary" 
                      size="small"
                    />
                    {canEditUser() && (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<CloudUploadIcon />}
                        onClick={() => setDocumentDialogOpen(true)}
                      >
                        Agregar Documento
                      </Button>
                    )}
                  </Box>
                </Box>

                {documentsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : userDocuments.length === 0 ? (
                  <Alert severity="info">
                    No hay documentos disponibles para este usuario
                  </Alert>
                ) : (
                  <Grid container spacing={2}>
                    {userDocuments.map((doc) => {
                      const getDocumentIcon = () => {
                        const ext = doc.originalName?.split('.').pop()?.toLowerCase();
                        if (['pdf'].includes(ext)) return <PdfIcon />;
                        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return <ImageIcon />;
                        return <FileIcon />;
                      };

                      const getDocumentTypeName = (fieldName: string) => {
                        const types: Record<string, string> = {
                          selfie: 'Selfie',
                          idFront: 'Cédula - Frente',
                          idBack: 'Cédula - Reverso',
                          polizaINS: 'Póliza INS',
                          ordenPatronal: 'Orden Patronal',
                          initialCourses: 'Cursos Iniciales',
                          additionalCourses: 'Cursos Adicionales',
                          medicalCertificate: 'Certificado Médico',
                          contractorLicense: 'Licencia de Contratista',
                          backgroundCheck: 'Antecedentes'
                        };
                        return types[fieldName] || fieldName;
                      };

                      return (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={doc.id}>
                          <Card variant="outlined">
                            <CardContent>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                <Box sx={{ 
                                  p: 1, 
                                  bgcolor: 'action.hover', 
                                  borderRadius: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  {getDocumentIcon()}
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography variant="subtitle2" noWrap>
                                    {getDocumentTypeName(doc.fieldName)}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" noWrap>
                                    {doc.originalName}
                                  </Typography>
                                  <Typography variant="caption" display="block" color="text.secondary">
                                    {formatDate(doc.uploadDate)}
                                  </Typography>
                                </Box>
                              </Box>
                              <Box sx={{ mt: 2 }}>
                                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<VisibilityIcon />}
                                    onClick={() => handleViewDocument(doc.id, doc.originalName)}
                                    fullWidth
                                  >
                                    Ver
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<DownloadIcon />}
                                    onClick={() => handleDownloadDocument(doc.id, doc.originalName)}
                                    fullWidth
                                  >
                                    Descargar
                                  </Button>
                                </Box>
                                {canEditUser() && (
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="primary"
                                      startIcon={<RefreshIcon />}
                                      onClick={() => {
                                        setSelectedDocument(doc);
                                        setDocumentType(doc.fieldName);
                                        setDocumentDialogOpen(true);
                                      }}
                                      fullWidth
                                    >
                                      Actualizar
                                    </Button>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="error"
                                      startIcon={<DeleteIcon />}
                                      onClick={() => handleDeleteDocument(doc.id, doc.originalName)}
                                      fullWidth
                                    >
                                      Eliminar
                                    </Button>
                                  </Box>
                                )}
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Certificaciones Section - Only for Contractors */}
          {isContractor(user.role) && (
            <Grid size={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6">
                      Certificaciones Especiales
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setCertificationDialogOpen(true)}
                      size="small"
                    >
                      Agregar Certificación
                    </Button>
                  </Box>

                  {certifications.length === 0 ? (
                    <Alert severity="info">
                      No hay certificaciones registradas
                    </Alert>
                  ) : (
                    <Grid container spacing={2}>
                      {certifications.map((cert) => (
                        <Grid size={{ xs: 12, md: 6 }} key={cert.id}>
                          <Card variant="outlined">
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <CertificationIcon color="primary" />
                                  <Typography variant="h6">
                                    {cert.name}
                                  </Typography>
                                </Box>
                                {cert.verified && (
                                  <Chip
                                    icon={<VerifiedIcon />}
                                    label="Verificado"
                                    color="success"
                                    size="small"
                                  />
                                )}
                              </Box>

                              <Grid container spacing={1}>
                                <Grid size={12}>
                                  <Typography variant="body2" color="text.secondary">
                                    Emitido por: <strong>{cert.issuedBy}</strong>
                                  </Typography>
                                </Grid>
                                <Grid size={12}>
                                  <Typography variant="body2" color="text.secondary">
                                    Número: <strong>{cert.certificateNumber}</strong>
                                  </Typography>
                                </Grid>
                                <Grid size={6}>
                                  <Typography variant="body2" color="text.secondary">
                                    Emisión: {formatDate(cert.issueDate)}
                                  </Typography>
                                </Grid>
                                <Grid size={6}>
                                  <Typography variant="body2" color="text.secondary">
                                    Vence: {formatDate(cert.expiryDate)}
                                  </Typography>
                                </Grid>
                              </Grid>

                              {cert.verified && cert.verifiedBy && (
                                <Box sx={{ mt: 2, p: 1, bgcolor: 'success.50', borderRadius: 1 }}>
                                  <Typography variant="caption" color="success.dark">
                                    Verificado por {cert.verifiedBy} el {formatDate(cert.verifiedAt!)}
                                  </Typography>
                                </Box>
                              )}

                              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                {cert.documentUrl && (
                                  <Button
                                    size="small"
                                    startIcon={<VisibilityIcon />}
                                    variant="outlined"
                                  >
                                    Ver
                                  </Button>
                                )}
                                {!cert.verified && canEditUser() && (
                                  <Button
                                    size="small"
                                    startIcon={<VerifiedIcon />}
                                    variant="outlined"
                                    color="success"
                                  >
                                    Verificar
                                  </Button>
                                )}
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* Tab Verificarme - Solo visible para el usuario viendo su propio perfil */}
      {userHasPendingVerifications && currentUser && user && currentUser._id === user._id && (
        <TabPanel value={tabValue} index={canViewCompanyVerifications ? 5 : 4}>
          <UserVerificationsPanel userId={user._id} />
        </TabPanel>
      )}

      {/* Tab Verificaciones de Empresa - Solo visible para safety staff y admins */}
      {canViewCompanyVerifications && (
        <TabPanel value={tabValue} index={1}>
          <UserCompanyVerificationsManager 
            userId={user._id || user.id || ''} 
            onRefresh={() => {
              // Refresh callback if needed
            }}
          />
        </TabPanel>
      )}


      {/* Diálogo de Verificación */}
      <Dialog
        open={verificationDialogOpen}
        onClose={() => setVerificationDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VerifiedIcon color="primary" />
            Actualizar Estado de Verificación
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={verificationStatus}
                onChange={(e) => setVerificationStatus(e.target.value)}
                label="Estado"
              >
                <MenuItem value="pending">Pendiente</MenuItem>
                <MenuItem value="verified">Verificado</MenuItem>
                <MenuItem value="rejected">Rechazado</MenuItem>
              </Select>
            </FormControl>

            {verificationStatus === 'rejected' && (
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Motivo de rechazo"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                sx={{ mt: 2 }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerificationDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveVerification}
            variant="contained"
            disabled={verificationStatus === 'rejected' && !rejectionReason}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Evaluación */}
      {/* <ReviewForm
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        contractorId={user._id || user.id || ''}
        contractorName={`${user.firstName} ${user.lastName}`}
        onSubmit={async (data: any) => {
          try {
            await reviewsApi.createReview(data as CreateReviewInput);
            await loadUserReviews();
            setReviewDialogOpen(false);
            setSnackbar({
              open: true,
              message: 'Evaluación creada exitosamente',
              severity: 'success'
            });
          } catch (error) {
            setSnackbar({
              open: true,
              message: 'Error al crear la evaluación',
              severity: 'error'
            });
          }
        }}
      /> */}

      {/* Snackbar */}
      {/* Certification Dialog */}
      <Dialog
        open={certificationDialogOpen}
        onClose={() => setCertificationDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CertificationIcon color="primary" />
            Certificaciones Especiales
          </Box>
          <Typography variant="body2" color="text.secondary">
            {user.firstName} {user.lastName}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Lista de certificaciones existentes */}
            {certifications.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Certificaciones Actuales
                </Typography>
                <Grid container spacing={2}>
                  {certifications.map((cert, index) => (
                    <Grid size={{ xs: 12, md: 6 }} key={index}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <BadgeIcon color="primary" sx={{ mr: 1 }} />
                            <Typography variant="subtitle1" fontWeight="medium">
                              {cert.name}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Emitido por: {cert.issuedBy}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Número: {cert.certificateNumber}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Vigente hasta: {formatDate(cert.expiryDate)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Formulario para nueva certificación */}
            <Typography variant="h6" gutterBottom>
              Agregar Nueva Certificación
            </Typography>
            
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Certificación</InputLabel>
                  <Select
                    value={newCertification.type}
                    onChange={(e) => setNewCertification(prev => ({ ...prev, type: e.target.value }))}
                    label="Tipo de Certificación"
                  >
                    <MenuItem value="jefe_mina">Jefe de Mina</MenuItem>
                    <MenuItem value="supervisor_seguridad">Supervisor de Seguridad</MenuItem>
                    <MenuItem value="operador_montacargas">Operador de Montacargas</MenuItem>
                    <MenuItem value="trabajo_altura">Trabajo en Altura</MenuItem>
                    <MenuItem value="espacios_confinados">Espacios Confinados</MenuItem>
                    <MenuItem value="primeros_auxilios">Primeros Auxilios</MenuItem>
                    <MenuItem value="manejo_sustancias_peligrosas">Manejo de Sustancias Peligrosas</MenuItem>
                    <MenuItem value="otro">Otro</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Nombre de la Certificación"
                  value={newCertification.name}
                  onChange={(e) => setNewCertification(prev => ({ ...prev, name: e.target.value }))}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Emitido por"
                  value={newCertification.issuedBy}
                  onChange={(e) => setNewCertification(prev => ({ ...prev, issuedBy: e.target.value }))}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Número de Certificado"
                  value={newCertification.certificateNumber}
                  onChange={(e) => setNewCertification(prev => ({ ...prev, certificateNumber: e.target.value }))}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha de Emisión"
                  value={newCertification.issueDate}
                  onChange={(e) => setNewCertification(prev => ({ ...prev, issueDate: e.target.value }))}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha de Vencimiento"
                  value={newCertification.expiryDate}
                  onChange={(e) => setNewCertification(prev => ({ ...prev, expiryDate: e.target.value }))}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="URL del Documento (opcional)"
                  value={newCertification.documentUrl}
                  onChange={(e) => setNewCertification(prev => ({ ...prev, documentUrl: e.target.value }))}
                  placeholder="https://ejemplo.com/certificado.pdf"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCertificationDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={async () => {
              try {
                // TODO: Implementar lógica para guardar la certificación
                // await contractorApi.addCertification(userId, newCertification);
                
                // Recargar certificaciones
                if (user?._id || user?.id) {
                  const userId = user._id || user.id || '';
                  const certificationsResponse = await contractorApi.getCertifications(userId);
                  if (certificationsResponse.success) {
                    setCertifications(certificationsResponse.data);
                  }
                }
                setCertificationDialogOpen(false);
                setNewCertification({
                  type: '',
                  name: '',
                  issuedBy: '',
                  issueDate: '',
                  expiryDate: '',
                  certificateNumber: '',
                  documentUrl: ''
                });
                setSnackbar({
                  open: true,
                  message: 'Certificación agregada exitosamente',
                  severity: 'success'
                });
              } catch (error) {
                setSnackbar({
                  open: true,
                  message: 'Error al agregar certificación',
                  severity: 'error'
                });
              }
            }}
            disabled={!newCertification.name || !newCertification.issuedBy}
          >
            Agregar Certificación
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Documentos */}
      <Dialog
        open={documentDialogOpen}
        onClose={() => {
          setDocumentDialogOpen(false);
          setSelectedDocument(null);
          setSelectedFile(null);
          setDocumentType('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudUploadIcon color="primary" />
            {selectedDocument ? 'Actualizar Documento' : 'Agregar Documento'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Tipo de Documento</InputLabel>
              <Select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                label="Tipo de Documento"
                disabled={!!selectedDocument}
              >
                <MenuItem value="selfie">Selfie</MenuItem>
                <MenuItem value="idFront">Cédula - Frente</MenuItem>
                <MenuItem value="idBack">Cédula - Reverso</MenuItem>
                <MenuItem value="polizaINS">Póliza INS</MenuItem>
                <MenuItem value="ordenPatronal">Orden Patronal</MenuItem>
                <MenuItem value="initialCourses">Cursos Iniciales</MenuItem>
                <MenuItem value="additionalCourses">Cursos Adicionales</MenuItem>
                <MenuItem value="medicalCertificate">Certificado Médico</MenuItem>
                <MenuItem value="contractorLicense">Licencia de Contratista</MenuItem>
                <MenuItem value="backgroundCheck">Antecedentes</MenuItem>
              </Select>
            </FormControl>

            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'primary.main',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
              onClick={() => document.getElementById('document-upload')?.click()}
            >
              <input
                id="document-upload"
                type="file"
                hidden
                accept=".pdf,.jpg,.jpeg,.png,.gif"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedFile(file);
                  }
                }}
              />
              <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {selectedFile ? selectedFile.name : 'Haz clic para seleccionar un archivo'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Formatos aceptados: PDF, JPG, JPEG, PNG, GIF
              </Typography>
            </Box>

            {selectedDocument && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Estás actualizando el documento: {selectedDocument.originalName}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDocumentDialogOpen(false);
              setSelectedDocument(null);
              setSelectedFile(null);
              setDocumentType('');
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUploadDocument}
            variant="contained"
            disabled={!selectedFile || !documentType || uploadingDocument}
            startIcon={uploadingDocument ? <CircularProgress size={20} /> : <CloudUploadIcon />}
          >
            {uploadingDocument ? 'Subiendo...' : (selectedDocument ? 'Actualizar' : 'Subir')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para Ver Documento */}
      <Dialog
        open={viewDocumentDialog}
        onClose={() => {
          setViewDocumentDialog(false);
          if (viewDocumentUrl && viewDocumentUrl.startsWith('blob:')) {
            URL.revokeObjectURL(viewDocumentUrl);
          }
          setViewDocumentUrl('');
          setViewDocumentName('');
          setViewDocumentId('');
        }}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DescriptionIcon color="primary" />
              <Typography variant="h6">{viewDocumentName || 'Documento'}</Typography>
            </Box>
            <IconButton
              onClick={() => {
                setViewDocumentDialog(false);
                if (viewDocumentUrl && viewDocumentUrl.startsWith('blob:')) {
                  URL.revokeObjectURL(viewDocumentUrl);
                }
                setViewDocumentUrl('');
                setViewDocumentName('');
                setViewDocumentId('');
              }}
              size="small"
            >
              <CancelIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ width: '100%', height: isMobile ? 'calc(100vh - 130px)' : '70vh' }}>
            {viewDocumentUrl ? (
              // If we have a URL, show the document
              (() => {
                const fileExtension = viewDocumentName?.split('.').pop()?.toLowerCase();
                const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension || '');
                const isPdf = fileExtension === 'pdf';
                
                // For blob URLs (fetched files)
                if (viewDocumentUrl.startsWith('blob:')) {
                  if (isPdf) {
                    return (
                      <iframe
                        src={viewDocumentUrl}
                        width="100%"
                        height="100%"
                        style={{ border: 'none' }}
                        title={viewDocumentName}
                      />
                    );
                  } else if (isImage) {
                    return (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        height: '100%',
                        p: 2,
                        bgcolor: 'grey.50'
                      }}>
                        <img
                          src={viewDocumentUrl}
                          alt={viewDocumentName}
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '100%', 
                            objectFit: 'contain',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                          }}
                        />
                      </Box>
                    );
                  } else {
                    // Other file types in iframe
                    return (
                      <iframe
                        src={viewDocumentUrl}
                        width="100%"
                        height="100%"
                        style={{ border: 'none' }}
                        title={viewDocumentName}
                      />
                    );
                  }
                }
                
                // Direct URLs (shouldn't happen with new code, but kept for safety)
                return (
                  <iframe
                    src={viewDocumentUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 'none' }}
                    title={viewDocumentName}
                  />
                );
              })()
            ) : (
              // If no URL, show error message
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                p: 4,
                textAlign: 'center'
              }}>
                <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No se pudo cargar el documento
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  El nombre del archivo contiene caracteres especiales que causan problemas.
                  Por favor, usa el botón de descarga para obtener el archivo.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleDownloadDocument(viewDocumentId, viewDocumentName)}
                >
                  Descargar Documento
                </Button>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            startIcon={<DownloadIcon />}
            onClick={() => handleDownloadDocument(viewDocumentId, viewDocumentName)}
          >
            Descargar
          </Button>
          <Button 
            onClick={() => {
              setViewDocumentDialog(false);
              if (viewDocumentUrl && viewDocumentUrl.startsWith('blob:')) {
                URL.revokeObjectURL(viewDocumentUrl);
              }
              setViewDocumentUrl('');
              setViewDocumentName('');
              setViewDocumentId('');
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Confirmación para Eliminar Documento */}
      <Dialog
        open={deleteDocumentDialog}
        onClose={() => {
          setDeleteDocumentDialog(false);
          setDocumentToDelete(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="error" />
            Confirmar Eliminación
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar el documento "{documentToDelete?.name}"?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Esta acción no se puede deshacer.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDeleteDocumentDialog(false);
              setDocumentToDelete(null);
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmDeleteDocument}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Avatar */}
      <Dialog
        open={avatarDialogOpen}
        onClose={handleAvatarDialogClose}
        maxWidth={fullscreenAvatar ? false : "sm"}
        fullWidth
        fullScreen={fullscreenAvatar}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              Foto de Perfil
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton 
                onClick={() => setFullscreenAvatar(!fullscreenAvatar)} 
                size="small"
                title={fullscreenAvatar ? "Salir de pantalla completa" : "Ver en pantalla completa"}
              >
                {fullscreenAvatar ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
              <IconButton onClick={handleAvatarDialogClose} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          ...(fullscreenAvatar && {
            justifyContent: 'center',
            bgcolor: 'background.default'
          })
        }}>
          <Box sx={{ textAlign: 'center', width: '100%' }}>
            {/* Mostrar cámara si está activa */}
            {cameraActive ? (
              <Box sx={{ position: 'relative', mb: 3 }}>
                <video
                  id="avatar-video"
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    maxWidth: 400,
                    height: 'auto',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    aspectRatio: '1',
                    transform: 'scaleX(-1)' // Espejo para selfie
                  }}
                />
                <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    onClick={capturePhoto}
                    startIcon={<CameraIcon />}
                    size="large"
                  >
                    Capturar Foto
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={stopCamera}
                    color="error"
                  >
                    Cancelar
                  </Button>
                </Box>
              </Box>
            ) : (
              /* Mostrar imagen actual o preview */
              <Avatar
                src={avatarPreviewUrl || userAvatarUrl || undefined}
                sx={{
                  width: fullscreenAvatar 
                    ? { xs: '90vmin', sm: '85vmin', md: '80vmin' }
                    : { xs: 250, sm: 300, md: 350 },
                  height: fullscreenAvatar 
                    ? { xs: '90vmin', sm: '85vmin', md: '80vmin' }
                    : { xs: 250, sm: 300, md: 350 },
                  mx: 'auto',
                  mb: 3,
                  bgcolor: 'primary.main',
                  fontSize: fullscreenAvatar ? '8rem' : '4rem',
                  cursor: fullscreenAvatar ? 'zoom-out' : 'zoom-in'
                }}
                onClick={() => setFullscreenAvatar(!fullscreenAvatar)}
              >
                {!avatarPreviewUrl && !userAvatarUrl && 
                  `${user.firstName?.charAt(0)}${user.lastName?.charAt(0)}`
                }
              </Avatar>
            )}

            {/* Solo mostrar opciones de subida si el usuario puede editar y no está en pantalla completa ni la cámara activa */}
            {canEditUser() && !fullscreenAvatar && !cameraActive && (
              <>
                {!selectedAvatarFile ? (
                  <Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                      {/* Input para seleccionar archivo */}
                      <input
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        style={{ display: 'none' }}
                        id="avatar-file-input"
                        type="file"
                        onChange={handleAvatarFileSelect}
                      />
                      
                      {/* Input para cámara */}
                      <input
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        capture="user"
                        style={{ display: 'none' }}
                        id="avatar-camera-input"
                        type="file"
                        onChange={handleAvatarFileSelect}
                      />
                      
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                        {/* Botón para seleccionar de galería */}
                        <label htmlFor="avatar-file-input">
                          <Button
                            variant="contained"
                            component="span"
                            startIcon={<PhotoLibraryIcon />}
                            sx={{ minWidth: 180 }}
                          >
                            Seleccionar Imagen
                          </Button>
                        </label>
                        
                        {/* Botón para tomar foto - solo mostrar en dispositivos móviles o con cámara */}
                        {(isMobile || 'mediaDevices' in navigator) && (
                          <Button
                            variant="contained"
                            startIcon={<CameraIcon />}
                            color="secondary"
                            sx={{ minWidth: 180 }}
                            onClick={startCamera}
                          >
                            Tomar Foto
                          </Button>
                        )}
                      </Box>
                    </Box>
                    
                    <Typography variant="caption" display="block" sx={{ mt: 2, textAlign: 'center' }}>
                      Formatos permitidos: JPG, PNG, WEBP (máx. 5MB)
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {selectedAvatarFile.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setSelectedAvatarFile(null);
                          setAvatarPreviewUrl(null);
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleAvatarUpload}
                        disabled={uploadingAvatar}
                        startIcon={uploadingAvatar ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                      >
                        {uploadingAvatar ? 'Subiendo...' : 'Actualizar Imagen'}
                      </Button>
                    </Box>
                  </Box>
                )}
              </>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
      
      {/* Floating Action Button for mobile */}
      {canEditUser() && isMobile && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000
          }}
        >
          {tabValue === 0 && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<EditIcon />}
              onClick={handleEdit}
              sx={{
                borderRadius: '28px',
                boxShadow: 3,
                '&:hover': {
                  boxShadow: 6
                }
              }}
            >
              Editar
            </Button>
          )}
          {tabValue === 4 && isContractor(user.role) && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<VerifiedIcon />}
              onClick={() => setVerificationDialogOpen(true)}
              sx={{
                borderRadius: '28px',
                boxShadow: 3,
                '&:hover': {
                  boxShadow: 6
                }
              }}
            >
              Verificar
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
};