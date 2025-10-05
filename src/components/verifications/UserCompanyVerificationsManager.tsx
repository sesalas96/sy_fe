import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  LinearProgress,
  Badge,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Divider,
  Snackbar
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Error as ErrorIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Business as BusinessIcon,
  AccessTime as AccessTimeIcon,
  DoNotDisturb as DoNotDisturbIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { userVerificationsApi, UserCompanyVerifications, VerificationDetail } from '../../services/userVerificationsApi';
import { fileService } from '../../services/fileService';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// Import test function for development
import '../../utils/testVerificationReview';
import '../../utils/debugVerifications';

interface UserCompanyVerificationsManagerProps {
  userId: string;
  onRefresh?: () => void;
}

export const UserCompanyVerificationsManager: React.FC<UserCompanyVerificationsManagerProps> = ({
  userId,
  onRefresh
}) => {
  const { hasRole } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyVerifications, setCompanyVerifications] = useState<UserCompanyVerifications[]>([]);
  const [expandedCompany, setExpandedCompany] = useState<string | false>(false);
  
  // Review dialog states
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewingVerification, setReviewingVerification] = useState<{
    verification: VerificationDetail;
    companyName: string;
    userVerificationId?: string;
  } | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalExpiryDate, setApprovalExpiryDate] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);


  // Update dialog states
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updatingVerification, setUpdatingVerification] = useState<{
    verification: VerificationDetail;
    companyId: string;
    companyName: string;
  } | null>(null);
  const [updateData, setUpdateData] = useState({
    certificateNumber: '',
    expiryDate: '',
    notes: '',
    documentoId: '',
    documentUrl: ''
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingVerification, setDeletingVerification] = useState<{
    verification: VerificationDetail;
    companyName: string;
  } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const canReviewVerifications = hasRole([UserRole.SAFETY_STAFF, UserRole.SUPER_ADMIN]);

  const loadVerifications = useCallback(async (keepExpanded: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const data = await userVerificationsApi.getUserVerifications(userId);
      setCompanyVerifications(data);

      // Only auto-expand if not keeping the current expansion state
      if (!keepExpanded) {
        // Auto-expand first non-compliant company
        const firstNonCompliant = data.find(cv => cv.complianceStatus !== 'compliant');
        if (firstNonCompliant) {
          setExpandedCompany(firstNonCompliant.company.id);
        }
      }
    } catch (error) {
      console.error('Error loading verifications:', error);
      setError('Error al cargar las verificaciones');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadVerifications();
  }, [loadVerifications]);

  const getStatusColor = (status: string): any => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending':
      case 'in_review': return 'warning';
      case 'expired': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon color="success" />;
      case 'rejected':
        return <CancelIcon color="error" />;
      case 'pending':
      case 'in_review':
        return <AccessTimeIcon color="warning" />;
      case 'expired':
        return <ErrorIcon color="error" />;
      default:
        return <DoNotDisturbIcon color="disabled" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprobado';
      case 'rejected': return 'Rechazado';
      case 'pending':
      case 'in_review': return 'En revisión';
      case 'expired': return 'Expirado';
      case 'not_submitted': return 'No enviado';
      default: return status;
    }
  };

  const getComplianceColor = (status: string): any => {
    switch (status) {
      case 'compliant': return 'success';
      case 'partial': return 'warning';
      case 'non_compliant': return 'error';
      default: return 'default';
    }
  };

  const getComplianceLabel = (status: string) => {
    switch (status) {
      case 'compliant': return 'Cumple';
      case 'partial': return 'Parcial';
      case 'non_compliant': return 'No cumple';
      default: return status;
    }
  };

  const handleReviewClick = (verification: VerificationDetail, companyName: string, decision: 'approve' | 'reject') => {
    // Use the userCompanyVerificationId field from the API
    const userVerificationId = verification.userCompanyVerificationId;
    
    console.log('Attempting to review verification:', {
      name: verification.name,
      status: verification.status,
      companyVerificationId: verification.id,
      userCompanyVerificationId: userVerificationId,
      submittedDate: verification.submittedAt,
      fullVerification: verification
    });
    
    // Check if we have a valid userCompanyVerificationId
    if (!userVerificationId) {
      console.error('Cannot review verification - no userCompanyVerificationId:', {
        name: verification.name,
        status: verification.status,
        userCompanyVerificationId: userVerificationId
      });
      
      if (verification.status === 'not_submitted') {
        setError('No se puede revisar esta verificación - No ha sido enviada');
      } else {
        setError('No se puede revisar esta verificación - ID de verificación del usuario no disponible');
      }
      return;
    }
    
    setReviewingVerification({ 
      verification, 
      companyName,
      userVerificationId
    });
    setReviewDecision(decision);
    setRejectionReason('');
    
    // Set default expiry date if approving and verification has validity period
    if (decision === 'approve' && verification.validityPeriod) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + verification.validityPeriod);
      setApprovalExpiryDate(expiryDate.toISOString());
    } else if (verification.expiryDate) {
      // Use existing expiry date if available
      setApprovalExpiryDate(verification.expiryDate);
    } else {
      setApprovalExpiryDate('');
    }
    
    setReviewDialogOpen(true);
  };

  const handleReviewSubmit = async () => {
    if (!reviewingVerification || !reviewDecision || !reviewingVerification.userVerificationId) return;

    try {
      setReviewLoading(true);

      await userVerificationsApi.reviewVerification(
        reviewingVerification.userVerificationId,
        reviewDecision,
        reviewDecision === 'reject' ? rejectionReason : undefined,
        reviewDecision === 'approve' ? approvalExpiryDate : undefined
      );

      // Show success message
      setSnackbarMessage(
        reviewDecision === 'approve'
          ? 'Verificación aprobada exitosamente'
          : 'Verificación rechazada exitosamente'
      );
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // Close dialog
      setReviewDialogOpen(false);
      setReviewingVerification(null);

      // Reload verifications, keeping the current accordion expanded
      await loadVerifications(true);

      // Notify parent
      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      console.error('Error reviewing verification:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error al revisar la verificación';
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleViewDocument = async (documentId: string) => {
    try {
      const blob = await fileService.getFile(documentId);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
    }
  };

  const handleDownloadDocument = async (documentId: string, filename: string) => {
    try {
      const blob = await fileService.getFile(documentId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    return differenceInDays(new Date(expiryDate), new Date());
  };

  // Handler for viewing document
  const handleViewDetails = async (verification: VerificationDetail) => {
    if (verification.documentUrl || verification.documentoId) {
      await handleViewDocument(verification.documentoId || verification.documentUrl!);
    } else {
      setError('No hay documento disponible para esta verificación');
    }
  };

  // Handler for updating verification
  const handleUpdateClick = (verification: VerificationDetail, companyId: string, companyName: string) => {
    setUpdatingVerification({ verification, companyId, companyName });
    setUpdateData({
      certificateNumber: verification.certificateNumber || '',
      expiryDate: verification.expiryDate || '',
      notes: '',
      documentoId: verification.documentoId || '',
      documentUrl: verification.documentUrl || ''
    });
    setSelectedFile(null);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setUpdateDialogOpen(true);
  };

  // Handler for file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('El archivo no puede superar los 10MB');
        event.target.value = ''; // Reset input
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setError('Solo se permiten archivos PDF, JPG, JPEG o PNG');
        event.target.value = ''; // Reset input
        return;
      }

      console.log('File selected:', file.name, file.type, file.size);
      setSelectedFile(file);
      setError(null);
    }
  };

  // Handler for submitting update
  const handleUpdateSubmit = async () => {
    if (!updatingVerification) return;

    try {
      setUpdateLoading(true);

      // Upload file if selected
      let documentoId = updateData.documentoId;
      if (selectedFile) {
        console.log('Uploading file:', selectedFile.name);
        const uploadResponse = await fileService.uploadFile(selectedFile);
        console.log('Upload response:', uploadResponse);

        if (!uploadResponse.success) {
          throw new Error(uploadResponse.message || 'Error al subir el archivo');
        }

        documentoId = uploadResponse.fileId;
        console.log('File uploaded successfully, ID:', documentoId);
      } else {
        console.log('No new file selected, using existing documentoId:', documentoId);
      }

      // Only submit if we have a documentoId (either existing or newly uploaded)
      if (!documentoId) {
        setSnackbarMessage('Debe seleccionar un documento o ya debe existir uno');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      // Validate expiry date if required
      if (updatingVerification.verification.validityPeriod && !updateData.expiryDate) {
        setSnackbarMessage('Debe especificar la fecha de vencimiento para esta verificación');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      console.log('Submitting verification with documentoId:', documentoId);
      const response = await userVerificationsApi.submitVerification(
        updatingVerification.companyId,
        updatingVerification.verification.id,
        {
          documentoId: documentoId,
          certificateNumber: updateData.certificateNumber,
          expiryDate: updateData.expiryDate,
          notes: updateData.notes
        }
      );

      console.log('Submit response:', response);

      // Show success message
      setSnackbarMessage('Verificación actualizada exitosamente');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // Close dialog first
      setUpdateDialogOpen(false);
      setUpdatingVerification(null);
      setSelectedFile(null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Reload verifications after closing dialog, keeping the current accordion expanded
      await loadVerifications(true);

      // Notify parent
      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      console.error('Error updating verification:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error al actualizar la verificación';
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Handler for delete confirmation
  const handleDeleteClick = (verification: VerificationDetail, companyName: string) => {
    setDeletingVerification({ verification, companyName });
    setDeleteDialogOpen(true);
  };

  // Handler for deleting verification
  const handleDeleteConfirm = async () => {
    if (!deletingVerification || !deletingVerification.verification.userCompanyVerificationId) {
      setError('No se puede eliminar esta verificación');
      return;
    }

    try {
      setDeleteLoading(true);

      // Note: You'll need to add a delete method to the API
      // For now, this is a placeholder
      console.log('Delete verification:', deletingVerification.verification.userCompanyVerificationId);

      // Reload verifications
      await loadVerifications();

      // Notify parent
      if (onRefresh) {
        onRefresh();
      }

      // Close dialog
      setDeleteDialogOpen(false);
      setDeletingVerification(null);
    } catch (error) {
      console.error('Error deleting verification:', error);
      setError('Error al eliminar la verificación');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <>
      <Box>
        {companyVerifications.length === 0 ? (
          <Alert severity="info">
            No hay verificaciones disponibles para este usuario
          </Alert>
        ) : (
          companyVerifications.map((companyVerif) => (
            <Accordion
              key={companyVerif.company.id}
              expanded={expandedCompany === companyVerif.company.id}
              onChange={(_, isExpanded) => setExpandedCompany(isExpanded ? companyVerif.company.id : false)}
              sx={{ mb: 2 }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{
                  display: 'flex',
                  alignItems: isMobile ? 'flex-start' : 'center',
                  gap: 2,
                  width: '100%',
                  flexDirection: isMobile ? 'column' : 'row'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <BusinessIcon color="action" />
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ wordBreak: 'break-word' }}>
                        {companyVerif.company.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                        <Chip
                          label={companyVerif.company.role}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={getComplianceLabel(
                            companyVerif.verifications.required === 0
                              ? 'compliant'
                              : companyVerif.complianceStatus
                          )}
                          color={getComplianceColor(
                            companyVerif.verifications.required === 0
                              ? 'compliant'
                              : companyVerif.complianceStatus
                          )}
                          size="small"
                        />
                        {companyVerif.verifications.pending > 0 && (
                          <Badge badgeContent={companyVerif.verifications.pending} color="warning">
                            <Chip label="Pendientes" size="small" color="warning" />
                          </Badge>
                        )}
                      </Box>
                    </Box>
                  </Box>
                  <Box sx={{
                    textAlign: isMobile ? 'left' : 'right',
                    width: isMobile ? '100%' : 'auto',
                    pl: isMobile ? 5 : 0
                  }}>
                    <Typography variant="body2" color="text.secondary">
                      {companyVerif.verifications.completed} de {companyVerif.verifications.required} completados
                    </Typography>
                    {companyVerif.verifications.required > 0 ? (
                      <LinearProgress
                        variant="determinate"
                        value={(companyVerif.verifications.completed / companyVerif.verifications.required) * 100}
                        sx={{ mt: 1, width: isMobile ? '100%' : 100 }}
                        color={getComplianceColor(companyVerif.complianceStatus)}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Sin verificaciones requeridas
                      </Typography>
                    )}
                  </Box>
                </Box>
              </AccordionSummary>

              <AccordionDetails>
                {companyVerif.verifications.details.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No hay verificaciones configuradas para este espacio de trabajo
                    </Typography>
                  </Box>
                ) : isMobile ? (
                  // Vista móvil - Cards
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {companyVerif.verifications.details.map((verification) => (
                      <Card key={verification.id} variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
                            {getStatusIcon(verification.status)}
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                {verification.name}
                              </Typography>
                              {verification.certificateNumber && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Cert: {verification.certificateNumber}
                                </Typography>
                              )}
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            <Chip label={verification.type} size="small" variant="outlined" />
                            <Chip
                              label={verification.isRequired ? 'Requerido' : 'No requerido'}
                              color={verification.isRequired ? 'primary' : 'default'}
                              size="small"
                              variant={verification.isRequired ? 'filled' : 'outlined'}
                            />
                            <Chip
                              label={getStatusLabel(verification.status)}
                              color={getStatusColor(verification.status)}
                              size="small"
                            />
                          </Box>

                          {verification.expiryDate && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="caption" color="text.secondary">
                                Vencimiento:
                              </Typography>
                              <Typography variant="body2">
                                {format(new Date(verification.expiryDate), 'dd/MM/yyyy', { locale: es })}
                                {verification.status === 'approved' && (
                                  <Typography
                                    component="span"
                                    variant="caption"
                                    color={getDaysUntilExpiry(verification.expiryDate) < 30 ? 'error' : 'text.secondary'}
                                    sx={{ ml: 1 }}
                                  >
                                    ({getDaysUntilExpiry(verification.expiryDate)} días)
                                  </Typography>
                                )}
                              </Typography>
                            </Box>
                          )}

                          {canReviewVerifications && (
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {(verification.documentUrl || verification.documentoId) && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<ViewIcon />}
                                  onClick={() => handleViewDetails(verification)}
                                >
                                  Ver
                                </Button>
                              )}
                              {verification.status !== 'not_submitted' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="info"
                                  startIcon={<EditIcon />}
                                  onClick={() => handleUpdateClick(verification, companyVerif.company.id, companyVerif.company.name)}
                                >
                                  Editar
                                </Button>
                              )}
                              {verification.status !== 'not_submitted' && verification.status !== 'approved' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  startIcon={<DeleteIcon />}
                                  onClick={() => handleDeleteClick(verification, companyVerif.company.name)}
                                >
                                  Eliminar
                                </Button>
                              )}
                              {(verification.status === 'pending' || verification.status === 'in_review') && (
                                <>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="success"
                                    startIcon={<ThumbUpIcon />}
                                    onClick={() => handleReviewClick(verification, companyVerif.company.name, 'approve')}
                                  >
                                    Aprobar
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="error"
                                    startIcon={<ThumbDownIcon />}
                                    onClick={() => handleReviewClick(verification, companyVerif.company.name, 'reject')}
                                  >
                                    Rechazar
                                  </Button>
                                </>
                              )}
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  // Vista desktop - Tabla
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Verificación</TableCell>
                          <TableCell>Tipo</TableCell>
                          <TableCell>Requerido</TableCell>
                          <TableCell>Estado</TableCell>
                          <TableCell>Vencimiento</TableCell>
                          {canReviewVerifications && <TableCell align="center">Acciones</TableCell>}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {companyVerif.verifications.details.map((verification) => (
                          <TableRow key={verification.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getStatusIcon(verification.status)}
                              <Box>
                                <Typography variant="body2">
                                  {verification.name}
                                </Typography>
                                {verification.certificateNumber && (
                                  <Typography variant="caption" color="text.secondary">
                                    Cert: {verification.certificateNumber}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={verification.type}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={verification.isRequired ? 'Sí' : 'No'}
                              color={verification.isRequired ? 'primary' : 'default'}
                              size="small"
                              variant={verification.isRequired ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getStatusLabel(verification.status)}
                              color={getStatusColor(verification.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {verification.expiryDate ? (
                              <Box>
                                <Typography variant="body2">
                                  {format(new Date(verification.expiryDate), 'dd/MM/yyyy', { locale: es })}
                                </Typography>
                                {verification.status === 'approved' && (
                                  <Typography 
                                    variant="caption" 
                                    color={getDaysUntilExpiry(verification.expiryDate) < 30 ? 'error' : 'text.secondary'}
                                  >
                                    {getDaysUntilExpiry(verification.expiryDate)} días
                                  </Typography>
                                )}
                              </Box>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          {canReviewVerifications && (
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                                {/* Ver documento - solo si hay documento */}
                                {(verification.documentUrl || verification.documentoId) && (
                                  <Tooltip title="Ver documento">
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() => handleViewDetails(verification)}
                                    >
                                      <ViewIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}

                                {/* Actualizar documento - solo si ya está enviada */}
                                {verification.status !== 'not_submitted' && (
                                  <Tooltip title="Actualizar documento">
                                    <IconButton
                                      size="small"
                                      color="info"
                                      onClick={() => handleUpdateClick(
                                        verification,
                                        companyVerif.company.id,
                                        companyVerif.company.name
                                      )}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}

                                {/* Eliminar - solo si está enviada pero no aprobada */}
                                {verification.status !== 'not_submitted' && verification.status !== 'approved' && (
                                  <Tooltip title="Eliminar">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeleteClick(
                                        verification,
                                        companyVerif.company.name
                                      )}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}

                                {/* Botones de revisión - solo para staff en verificaciones pendientes */}
                                {(verification.status === 'pending' || verification.status === 'in_review') && (
                                  <>
                                    <Tooltip title="Aprobar">
                                      <IconButton
                                        size="small"
                                        color="success"
                                        onClick={() => handleReviewClick(
                                          verification,
                                          companyVerif.company.name,
                                          'approve'
                                        )}
                                      >
                                        <ThumbUpIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Rechazar">
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleReviewClick(
                                          verification,
                                          companyVerif.company.name,
                                          'reject'
                                        )}
                                      >
                                        <ThumbDownIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                )}
                              </Box>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                )}
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </Box>

      {/* Update Verification Dialog */}
      <Dialog
        open={updateDialogOpen}
        onClose={() => setUpdateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Actualizar Documento de Verificación</DialogTitle>
        <DialogContent>
          {updatingVerification && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                {updatingVerification.verification.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {updatingVerification.companyName}
              </Typography>

              {/* Current document */}
              {(updateData.documentoId || updateData.documentUrl) && !selectedFile && (
                <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <DescriptionIcon color="primary" />
                    <Typography variant="body2" fontWeight="medium">
                      Documento actual
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ViewIcon />}
                      onClick={() => handleViewDocument(updateData.documentoId || updateData.documentUrl)}
                    >
                      Ver
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownloadDocument(
                        updateData.documentoId || updateData.documentUrl,
                        `${updatingVerification.verification.name}.pdf`
                      )}
                    >
                      Descargar
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Upload new document */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" fontWeight="medium" gutterBottom>
                  Subir nuevo documento
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadIcon />}
                    fullWidth
                  >
                    {selectedFile ? selectedFile.name : 'Seleccionar archivo'}
                    <input
                      ref={fileInputRef}
                      type="file"
                      hidden
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileSelect}
                    />
                  </Button>
                  {selectedFile && (
                    <Tooltip title="Quitar archivo">
                      <IconButton
                        color="error"
                        onClick={() => {
                          setSelectedFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        size="small"
                      >
                        <CancelIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                {selectedFile && (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    Archivo seleccionado: {selectedFile.name}
                  </Alert>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Formatos permitidos: PDF, JPG, PNG. Tamaño máximo: 10MB
                </Typography>
              </Box>

              {/* Certificate Number - Only for certifications and courses */}
              {(updatingVerification.verification.type === 'certification' ||
                updatingVerification.verification.type === 'course') && (
                <TextField
                  fullWidth
                  label="Número de Certificado"
                  value={updateData.certificateNumber}
                  onChange={(e) => setUpdateData({ ...updateData, certificateNumber: e.target.value })}
                  sx={{ mb: 2 }}
                  helperText="Número del certificado o diploma emitido"
                />
              )}

              {/* Expiry Date - Only if verification has validity period */}
              {updatingVerification.verification.validityPeriod && (
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                  <DatePicker
                    label="Fecha de Vencimiento *"
                    value={updateData.expiryDate ? new Date(updateData.expiryDate) : null}
                    onChange={(date) => {
                      if (date) {
                        setUpdateData({ ...updateData, expiryDate: date.toISOString() });
                      }
                    }}
                    minDate={new Date()}
                    format="dd/MM/yyyy"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        sx: { mb: 2 }
                      }
                    }}
                  />
                </LocalizationProvider>
              )}

              {/* Notes */}
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notas adicionales"
                value={updateData.notes}
                onChange={(e) => setUpdateData({ ...updateData, notes: e.target.value })}
                helperText="Información adicional relevante para esta verificación"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialogOpen(false)} disabled={updateLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleUpdateSubmit}
            variant="contained"
            disabled={updateLoading}
            startIcon={updateLoading ? <CircularProgress size={20} /> : <UploadIcon />}
          >
            {updateLoading ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Eliminar Verificación</DialogTitle>
        <DialogContent>
          {deletingVerification && (
            <Box sx={{ pt: 2 }}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                ¿Está seguro que desea eliminar esta verificación?
              </Alert>
              <Typography variant="subtitle2" gutterBottom>
                Verificación: {deletingVerification.verification.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Empresa: {deletingVerification.companyName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Esta acción no se puede deshacer.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} /> : null}
          >
            {deleteLoading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Dialog */}
      <Dialog
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {reviewDecision === 'approve' ? 'Aprobar' : 'Rechazar'} Verificación
        </DialogTitle>
        <DialogContent>
          {reviewingVerification && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Documento: {reviewingVerification.verification.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Empresa: {reviewingVerification.companyName}
              </Typography>
            </Box>
          )}

          {reviewDecision === 'reject' && (
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Razón del rechazo"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
              helperText="Explique por qué se rechaza esta verificación"
            />
          )}

          {reviewDecision === 'approve' && (
            <>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DatePicker
                  label="Fecha de vencimiento"
                  value={approvalExpiryDate ? new Date(approvalExpiryDate) : null}
                  onChange={(date) => {
                    if (date) {
                      setApprovalExpiryDate(date.toISOString());
                    }
                  }}
                  minDate={new Date()}
                  format="dd/MM/yyyy"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      sx: { mb: 2 },
                      helperText: "La fecha de vencimiento es obligatoria"
                    }
                  }}
                />
              </LocalizationProvider>
              <Alert severity="info">
                ¿Está seguro que desea aprobar esta verificación?
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)} disabled={reviewLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleReviewSubmit}
            variant="contained"
            color={reviewDecision === 'approve' ? 'success' : 'error'}
            disabled={
              reviewLoading ||
              (reviewDecision === 'reject' && !rejectionReason.trim()) ||
              (reviewDecision === 'approve' && !approvalExpiryDate)
            }
            startIcon={reviewLoading ? <CircularProgress size={20} /> : null}
          >
            {reviewLoading ? 'Procesando...' : reviewDecision === 'approve' ? 'Aprobar' : 'Rechazar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};