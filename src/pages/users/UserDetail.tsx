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
  Tooltip,
  useTheme,
  useMediaQuery,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  InputAdornment,
  TablePagination,
  CircularProgress,
  LinearProgress
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
  Assessment as AssessmentIcon,
  WorkspacePremium as CertificationIcon,
  Gavel as GavelIcon,
  Add as AddIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  AccessTime as AccessTimeIcon,
  Group as TeamIcon,
  Badge as BadgeIcon,
  History as HistoryIcon,
  School as SchoolIcon,
  Sync as SyncIcon,
  Description as DescriptionIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { User, UserRole } from '../../types';
import { userApi } from '../../services/userApi';
import { contractorApi } from '../../services/contractorApi';
import { coursesApi } from '../../services/coursesApi';
import { useAuth } from '../../contexts/AuthContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { verificationsApi } from '../../services/verificationsApi';
import { UserVerificationsPanel } from '../../components/verifications/UserVerificationsPanel';

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
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
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

interface Evaluation {
  id: string;
  evaluatedBy: string;
  evaluatedAt: Date;
  scores: {
    safety: number;
    quality: number;
    timeliness: number;
    communication: number;
  };
  average: number;
  comments?: string;
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

interface TermsAcceptance {
  termsAndConditions: {
    accepted: boolean;
    version: string;
    acceptedAt?: Date;
    ipAddress?: string;
  };
  privacyPolicy: {
    accepted: boolean;
    version: string;
    acceptedAt?: Date;
    ipAddress?: string;
  };
}

export const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole, user: currentUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [tabValue, setTabValue] = useState(0);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  
  // Estados para verificaciones
  const [userHasPendingVerifications, setUserHasPendingVerifications] = useState(false);
  const [userVerifications, setUserVerifications] = useState<any[]>([]);
  
  // Estados para contratistas
  const [verificationInfo, setVerificationInfo] = useState<VerificationInfo | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [termsAcceptance, setTermsAcceptance] = useState<TermsAcceptance | null>(null);
  
  // Estados para diálogos
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [evaluationDialogOpen, setEvaluationDialogOpen] = useState(false);
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
  const [evaluationScores, setEvaluationScores] = useState({
    safety: 0,
    quality: 0,
    timeliness: 0,
    communication: 0
  });
  const [evaluationComments, setEvaluationComments] = useState('');
  
  // Estados para el historial
  const [historyType, setHistoryType] = useState<'access' | 'permits' | 'equipment' | 'tasks'>('access');
  const [accessFilter, setAccessFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [accessHistory, setAccessHistory] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // Estados para cursos
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [, setCourseProgress] = useState<any>(null);
  const [talentLMSProgress, setTalentLMSProgress] = useState<any>(null);
  const [syncingWithTalentLMS, setSyncingWithTalentLMS] = useState(false);
  
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
  const [documentToDelete, setDocumentToDelete] = useState<{id: string, name: string} | null>(null);
  
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
              
              setUserAvatarUrl(avatarUrl);
              console.log('User avatar loaded successfully');
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

      // Cargar evaluaciones
      const evaluationsResponse = await contractorApi.getEvaluations(userId);
      if (evaluationsResponse.success && evaluationsResponse.data) {
        setEvaluations(evaluationsResponse.data);
      }

      // Cargar certificaciones
      const certificationsResponse = await contractorApi.getCertifications(userId);
      if (certificationsResponse.success && certificationsResponse.data) {
        setCertifications(certificationsResponse.data);
      }

      // Cargar aceptación de términos
      const termsResponse = await contractorApi.getTermsAcceptance(userId);
      if (termsResponse.success && termsResponse.data) {
        setTermsAcceptance(termsResponse.data);
      }
      
      // El historial de acceso se cargará mediante el useEffect cuando se actualice el user
    } catch (error) {
      console.error('Error loading contractor data:', error);
      // Si falla, usar datos mock
      loadContractorData(userId);
    }
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
  }, [id, loadContractorDataFromAPI, loadUserAvatar]);

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

      setEvaluations([
        {
          id: '1',
          evaluatedBy: 'Supervisor Juan',
          evaluatedAt: new Date('2024-02-15'),
          scores: {
            safety: 95,
            quality: 88,
            timeliness: 92,
            communication: 85
          },
          average: 90,
          comments: 'Excelente desempeño en seguridad'
        },
        {
          id: '2',
          evaluatedBy: 'Supervisor María',
          evaluatedAt: new Date('2024-01-20'),
          scores: {
            safety: 90,
            quality: 85,
            timeliness: 88,
            communication: 90
          },
          average: 88.25,
          comments: 'Buen trabajo en equipo'
        }
      ]);

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

      setTermsAcceptance({
        termsAndConditions: {
          accepted: true,
          version: '1.0.0',
          acceptedAt: new Date('2024-01-01'),
          ipAddress: '192.168.1.100'
        },
        privacyPolicy: {
          accepted: true,
          version: '1.0.0',
          acceptedAt: new Date('2024-01-01'),
          ipAddress: '192.168.1.100'
        }
      });
    } catch (err) {
      console.error('Error loading contractor data:', err);
    }
  };

  const isContractor = (role: UserRole) => {
    return [
      UserRole.CONTRATISTA_ADMIN,
      UserRole.CONTRATISTA_SUBALTERNOS,
      UserRole.CONTRATISTA_HUERFANO
    ].includes(role);
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

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
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

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'success.main';
    if (score >= 75) return 'warning.main';
    if (score >= 60) return 'warning.dark';
    return 'error.main';
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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

  const loadCourseProgress = useCallback(async () => {
    if (!user?._id && !user?.id) return;
    
    const userId = user._id || user.id || '';
    setCoursesLoading(true);
    
    try {
      // Cargar progreso de cursos del usuario
      const progressResponse = await coursesApi.getUserProgress(userId);
      if (progressResponse.success) {
        setCourseProgress(progressResponse.data);
      }
      
      // Si es contratista, cargar también el progreso de TalentLMS
      if (isContractor(user.role)) {
        try {
          const talentProgress = await coursesApi.getContractorProgress(userId);
          setTalentLMSProgress(talentProgress);
        } catch (error) {
          console.error('Error loading TalentLMS progress:', error);
        }
      }
    } catch (error) {
      console.error('Error loading course progress:', error);
    } finally {
      setCoursesLoading(false);
    }
  }, [user?._id, user?.id, user?.role]);

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

  useEffect(() => {
    if (user && historyType === 'access') {
      loadAccessHistory(accessFilter);
    }
  }, [user, accessFilter, historyType, loadAccessHistory]);

  useEffect(() => {
    if (user && tabValue === 2) { // Tab de Cursos
      loadCourseProgress();
    }
  }, [user, tabValue, loadCourseProgress]);

  useEffect(() => {
    if (user && tabValue === 3) { // Tab de Documentos
      loadUserDocuments();
    }
  }, [user, tabValue, loadUserDocuments]);

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

  const handleSyncWithTalentLMS = async () => {
    if (!user?._id && !user?.id) return;
    
    const userId = user._id || user.id || '';
    setSyncingWithTalentLMS(true);
    
    try {
      // Sincronizar contratista con TalentLMS
      await coursesApi.syncContractorToTalentLMS(userId, false);
      
      // Sincronizar cursos completados
      await coursesApi.syncContractorCompletions(userId);
      
      // Recargar progreso
      await loadCourseProgress();
      
      setSnackbar({
        open: true,
        message: 'Sincronización con TalentLMS completada',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error syncing with TalentLMS:', error);
      setSnackbar({
        open: true,
        message: 'Error al sincronizar con TalentLMS',
        severity: 'error'
      });
    } finally {
      setSyncingWithTalentLMS(false);
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

  const handleSaveEvaluation = async () => {
    if (!user) return;
    
    try {
      const response = await contractorApi.addEvaluation(user._id, {
        scores: evaluationScores,
        comments: evaluationComments
      });
      
      if (response.success) {
        const average = (evaluationScores.safety + evaluationScores.quality + 
                        evaluationScores.timeliness + evaluationScores.communication) / 4;
        
        setSnackbar({
          open: true,
          message: `Evaluación guardada. Promedio: ${average.toFixed(1)}%`,
          severity: 'success'
        });
        setEvaluationDialogOpen(false);
        // Resetear formulario
        setEvaluationScores({
          safety: 0,
          quality: 0,
          timeliness: 0,
          communication: 0
        });
        setEvaluationComments('');
        // Recargar datos
        await loadContractorDataFromAPI(user._id);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al guardar evaluación',
        severity: 'error'
      });
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

  const tabLabels = ['Información General', 'Historial', 'Cursos', 'Documentos'];
  
  // Agregar tab "Verificarme" si el usuario tiene verificaciones pendientes
  // y es el usuario viendo su propio perfil
  if (userHasPendingVerifications && currentUser && user && currentUser._id === user._id) {
    tabLabels.push('Verificarme');
  }
  
  if (isContractor(user.role)) {
    tabLabels.push('Verificación', 'Evaluaciones', 'Certificaciones', 'Términos');
  }

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
                src={userAvatarUrl || undefined}
                sx={{
                  width: { xs: 80, md: 100 },
                  height: { xs: 80, md: 100 },
                  bgcolor: 'primary.main',
                  fontSize: { xs: '1.5rem', md: '2rem' }
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
                <Box sx={{ 
                  display: 'flex', 
                  gap: 2, 
                  flexWrap: 'wrap',
                  flexDirection: 'row',
                  alignItems: 'flex-start'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <EmailIcon fontSize="small" color="action" />
                    <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                      {user.email}
                    </Typography>
                  </Box>
                  {user.profile?.phone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography variant="body2">{user.profile.phone}</Typography>
                    </Box>
                  )}
                  {user.company && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <BusinessIcon fontSize="small" color="action" />
                      <Typography variant="body2">{user.company.name}</Typography>
                    </Box>
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
                  {canEditUser() && !isMobile && (
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
                  {/* Cédula will be shown in contractor section */}
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
                  {user.company && (
                    <ListItem>
                      <ListItemIcon>
                        <BusinessIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Espacio de trabajo"
                        secondary={user.company.name}
                      />
                    </ListItem>
                  )}
                  {/* Position will be shown in contractor section */}
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
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
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
                variant={historyType === 'permits' ? 'contained' : 'outlined'}
                onClick={() => setHistoryType('permits')}
                sx={{ flexGrow: isMobile ? 1 : 0, minWidth: isMobile ? 0 : 'auto' }}
              >
                {isMobile ? 'Permisos' : 'Permiso de Trabajo'}
              </Button>
              <Button
                size={isMobile ? 'small' : 'small'}
                variant={historyType === 'equipment' ? 'contained' : 'outlined'}
                onClick={() => setHistoryType('equipment')}
                sx={{ flexGrow: isMobile ? 1 : 0, minWidth: isMobile ? 0 : 'auto' }}
              >
                Equipos
              </Button>
              <Button
                size={isMobile ? 'small' : 'small'}
                variant={historyType === 'tasks' ? 'contained' : 'outlined'}
                onClick={() => setHistoryType('tasks')}
                sx={{ flexGrow: isMobile ? 1 : 0, minWidth: isMobile ? 0 : 'auto' }}
              >
                Tareas
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

      <TabPanel value={tabValue} index={2}>
        {/* Cursos */}
        <Grid container spacing={3}>
          <Grid size={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SchoolIcon color="primary" />
                    Cursos y Capacitaciones
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {talentLMSProgress && (
                      <Chip 
                        label={`${talentLMSProgress.inProgressCourses} cursos activos`} 
                        color="primary" 
                        size="small"
                      />
                    )}
                    {isContractor(user.role) && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={handleSyncWithTalentLMS}
                        disabled={syncingWithTalentLMS}
                        startIcon={syncingWithTalentLMS ? <CircularProgress size={16} /> : <SyncIcon />}
                      >
                        {syncingWithTalentLMS ? 'Sincronizando...' : 'Sincronizar con TalentLMS'}
                      </Button>
                    )}
                  </Box>
                </Box>

                {/* Resumen de cursos */}
                {coursesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : talentLMSProgress ? (
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.50', borderRadius: 2 }}>
                        <Typography variant="h4" color="success.main">
                          {talentLMSProgress.completedCourses || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Cursos Completados</Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.50', borderRadius: 2 }}>
                        <Typography variant="h4" color="warning.main">
                          {talentLMSProgress.inProgressCourses || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">En Progreso</Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.50', borderRadius: 2 }}>
                        <Typography variant="h4" color="info.main">
                          {talentLMSProgress.overallProgress || 0}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Tasa de Completación</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                ) : (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    No hay datos de cursos disponibles. {isContractor(user.role) && 'Haz clic en "Sincronizar con TalentLMS" para cargar los datos.'}
                  </Alert>
                )}

                {/* Lista de cursos */}
                {talentLMSProgress && talentLMSProgress.courses && talentLMSProgress.courses.length > 0 && (
                  <>
                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                      Cursos Recientes
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

                    {/* Botón para ver más */}
                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                      <Button variant="outlined" startIcon={<VisibilityIcon />}>
                        Ver Todos los Cursos
                      </Button>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
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
        </Grid>
      </TabPanel>

      {/* Tab Verificarme - Solo visible para el usuario viendo su propio perfil */}
      {userHasPendingVerifications && currentUser && user && currentUser._id === user._id && (
        <TabPanel value={tabValue} index={4}>
          <UserVerificationsPanel userId={user._id} />
        </TabPanel>
      )}

      {isContractor(user.role) && (
        <>
          <TabPanel value={tabValue} index={userHasPendingVerifications && currentUser && user && currentUser._id === user._id ? 5 : 4}>
            {/* Verificación */}
            <Grid container spacing={3}>
              <Grid size={12}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h6">
                          Estado de Verificación
                        </Typography>
                        {verificationInfo && (
                          <Chip
                            icon={getVerificationStatusInfo(verificationInfo.status).icon}
                            label={getVerificationStatusInfo(verificationInfo.status).label}
                            color={getVerificationStatusInfo(verificationInfo.status).color}
                            size="medium"
                          />
                        )}
                      </Box>
                      {canEditUser() && !isMobile && (
                        <Button
                          variant="contained"
                          startIcon={<VerifiedIcon />}
                          onClick={() => setVerificationDialogOpen(true)}
                          size="small"
                        >
                          Verificar
                        </Button>
                      )}
                    </Box>

                    {verificationInfo?.verifiedBy && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          Verificado por: <strong>{verificationInfo.verifiedBy}</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Fecha: {formatDate(verificationInfo.verifiedAt!)}
                        </Typography>
                      </Box>
                    )}

                    {verificationInfo?.rejectionReason && (
                      <Alert severity="error" sx={{ mb: 3 }}>
                        <Typography variant="subtitle2">Motivo de rechazo:</Typography>
                        {verificationInfo.rejectionReason}
                      </Alert>
                    )}

                    <Typography variant="subtitle1" gutterBottom>
                      Documentos de Verificación
                    </Typography>
                    {isMobile ? (
                      // Mobile view - Cards
                      <Stack spacing={2}>
                        {verificationInfo?.documents.map((doc, index) => (
                          <Card key={index} variant="outlined">
                            <CardContent sx={{ pb: 2, '&:last-child': { pb: 2 } }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                  {doc.name}
                                </Typography>
                                <Chip
                                  label={doc.status === 'approved' ? 'Aprobado' : doc.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                                  color={doc.status === 'approved' ? 'success' : doc.status === 'rejected' ? 'error' : 'warning'}
                                  size="small"
                                />
                              </Box>
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                                Cargado: {formatDate(doc.uploadedAt)}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<VisibilityIcon />}
                                  fullWidth
                                >
                                  Ver
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<DownloadIcon />}
                                  fullWidth
                                >
                                  Descargar
                                </Button>
                              </Box>
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    ) : (
                      // Desktop view - Table
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Documento</TableCell>
                              <TableCell>Estado</TableCell>
                              <TableCell>Fecha de carga</TableCell>
                              <TableCell align="center">Acciones</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {verificationInfo?.documents.map((doc, index) => (
                              <TableRow key={index}>
                                <TableCell>{doc.name}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={doc.status === 'approved' ? 'Aprobado' : doc.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                                    color={doc.status === 'approved' ? 'success' : doc.status === 'rejected' ? 'error' : 'warning'}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                                <TableCell align="center">
                                  <Tooltip title="Ver documento">
                                    <IconButton size="small" color="primary">
                                      <VisibilityIcon />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Descargar">
                                    <IconButton size="small">
                                      <DownloadIcon />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={userHasPendingVerifications && currentUser && user && currentUser._id === user._id ? 6 : 5}>
            {/* Evaluaciones */}
            <Grid container spacing={3}>
              <Grid size={12}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6">
                        Historial de Evaluaciones
                      </Typography>
                      {canEditUser() && (
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => setEvaluationDialogOpen(true)}
                          size="small"
                        >
                          Nueva Evaluación
                        </Button>
                      )}
                    </Box>

                    {evaluations.length === 0 ? (
                      <Alert severity="info">
                        No hay evaluaciones registradas
                      </Alert>
                    ) : (
                      <Grid container spacing={2}>
                        {evaluations.map((evaluation) => (
                          <Grid size={{ xs: 12, md: 6 }} key={evaluation.id}>
                            <Card variant="outlined">
                              <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                  <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                      Evaluado por
                                    </Typography>
                                    <Typography variant="body1">
                                      {evaluation.evaluatedBy}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="h4" color={getScoreColor(evaluation.average)}>
                                      {evaluation.average}%
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Promedio
                                    </Typography>
                                  </Box>
                                </Box>

                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(evaluation.evaluatedAt)}
                                </Typography>

                                <Box sx={{ mt: 2 }}>
                                  <Grid container spacing={1}>
                                    <Grid size={6}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <SecurityIcon fontSize="small" color="primary" />
                                        <Typography variant="body2">
                                          Seguridad: {evaluation.scores.safety}%
                                        </Typography>
                                      </Box>
                                    </Grid>
                                    <Grid size={6}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CheckCircleIcon fontSize="small" color="primary" />
                                        <Typography variant="body2">
                                          Calidad: {evaluation.scores.quality}%
                                        </Typography>
                                      </Box>
                                    </Grid>
                                    <Grid size={6}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <AccessTimeIcon fontSize="small" color="primary" />
                                        <Typography variant="body2">
                                          Puntualidad: {evaluation.scores.timeliness}%
                                        </Typography>
                                      </Box>
                                    </Grid>
                                    <Grid size={6}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <TeamIcon fontSize="small" color="primary" />
                                        <Typography variant="body2">
                                          Comunicación: {evaluation.scores.communication}%
                                        </Typography>
                                      </Box>
                                    </Grid>
                                  </Grid>
                                </Box>

                                {evaluation.comments && (
                                  <Box sx={{ mt: 2, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                      Comentarios:
                                    </Typography>
                                    <Typography variant="body2">
                                      {evaluation.comments}
                                    </Typography>
                                  </Box>
                                )}
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={userHasPendingVerifications && currentUser && user && currentUser._id === user._id ? 7 : 6}>
            {/* Certificaciones */}
            <Grid container spacing={3}>
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
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={userHasPendingVerifications && currentUser && user && currentUser._id === user._id ? 8 : 7}>
            {/* Términos y Condiciones */}
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <GavelIcon color="primary" />
                      <Typography variant="h6">
                        Términos y Condiciones
                      </Typography>
                    </Box>
                    
                    {termsAcceptance?.termsAndConditions.accepted ? (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <CheckCircleIcon color="success" />
                          <Typography variant="body1" color="success.main">
                            Aceptados
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Versión: {termsAcceptance.termsAndConditions.version}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Fecha: {formatDate(termsAcceptance.termsAndConditions.acceptedAt!)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          IP: {termsAcceptance.termsAndConditions.ipAddress}
                        </Typography>
                      </Box>
                    ) : (
                      <Alert severity="warning">
                        No ha aceptado los términos y condiciones
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <SecurityIcon color="primary" />
                      <Typography variant="h6">
                        Política de Privacidad
                      </Typography>
                    </Box>
                    
                    {termsAcceptance?.privacyPolicy.accepted ? (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <CheckCircleIcon color="success" />
                          <Typography variant="body1" color="success.main">
                            Aceptada
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Versión: {termsAcceptance.privacyPolicy.version}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Fecha: {formatDate(termsAcceptance.privacyPolicy.acceptedAt!)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          IP: {termsAcceptance.privacyPolicy.ipAddress}
                        </Typography>
                      </Box>
                    ) : (
                      <Alert severity="warning">
                        No ha aceptado la política de privacidad
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </>
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
      <Dialog
        open={evaluationDialogOpen}
        onClose={() => setEvaluationDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssessmentIcon color="primary" />
            Nueva Evaluación
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Seguridad
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    value={evaluationScores.safety}
                    onChange={(e) => setEvaluationScores(prev => ({
                      ...prev,
                      safety: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                    }))}
                    slotProps={{
                      input: {
                        endAdornment: <InputAdornment position="end">%</InputAdornment>
                      },
                      htmlInput: { min: 0, max: 100 }
                    }}
                  />
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Calidad
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    value={evaluationScores.quality}
                    onChange={(e) => setEvaluationScores(prev => ({
                      ...prev,
                      quality: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                    }))}
                    slotProps={{
                      input: {
                        endAdornment: <InputAdornment position="end">%</InputAdornment>
                      },
                      htmlInput: { min: 0, max: 100 }
                    }}
                  />
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Puntualidad
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    value={evaluationScores.timeliness}
                    onChange={(e) => setEvaluationScores(prev => ({
                      ...prev,
                      timeliness: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                    }))}
                    slotProps={{
                      input: {
                        endAdornment: <InputAdornment position="end">%</InputAdornment>
                      },
                      htmlInput: { min: 0, max: 100 }
                    }}
                  />
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Comunicación
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    value={evaluationScores.communication}
                    onChange={(e) => setEvaluationScores(prev => ({
                      ...prev,
                      communication: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                    }))}
                    slotProps={{
                      input: {
                        endAdornment: <InputAdornment position="end">%</InputAdornment>
                      },
                      htmlInput: { min: 0, max: 100 }
                    }}
                  />
                </Box>
              </Grid>

              <Grid size={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Comentarios (opcional)"
                  value={evaluationComments}
                  onChange={(e) => setEvaluationComments(e.target.value)}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.50', borderRadius: 1, textAlign: 'center' }}>
              <Typography variant="h6">
                Promedio: {Math.round(
                  (evaluationScores.safety + evaluationScores.quality + 
                   evaluationScores.timeliness + evaluationScores.communication) / 4
                )}%
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEvaluationDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveEvaluation} variant="contained">
            Guardar Evaluación
          </Button>
        </DialogActions>
      </Dialog>

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