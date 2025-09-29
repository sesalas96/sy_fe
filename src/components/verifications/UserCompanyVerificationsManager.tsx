import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
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
  useMediaQuery
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Business as BusinessIcon,
  AccessTime as AccessTimeIcon,
  DoNotDisturb as DoNotDisturbIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { hasRole } = useAuth();
  
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
  
  const canReviewVerifications = hasRole([UserRole.SAFETY_STAFF, UserRole.SUPER_ADMIN]);

  const loadVerifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await userVerificationsApi.getUserVerifications(userId);
      setCompanyVerifications(data);
      
      // Auto-expand first non-compliant company
      const firstNonCompliant = data.find(cv => cv.complianceStatus !== 'compliant');
      if (firstNonCompliant) {
        setExpandedCompany(firstNonCompliant.company.id);
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
      
      // Reload verifications
      await loadVerifications();
      
      // Notify parent
      if (onRefresh) {
        onRefresh();
      }
      
      // Close dialog
      setReviewDialogOpen(false);
      setReviewingVerification(null);
    } catch (error) {
      console.error('Error reviewing verification:', error);
      setError('Error al revisar la verificación');
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <BusinessIcon color="action" />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">
                      {companyVerif.company.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Chip
                        label={companyVerif.company.role}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={getComplianceLabel(companyVerif.complianceStatus)}
                        color={getComplianceColor(companyVerif.complianceStatus)}
                        size="small"
                      />
                      {companyVerif.verifications.pending > 0 && (
                        <Badge badgeContent={companyVerif.verifications.pending} color="warning">
                          <Chip label="Pendientes" size="small" color="warning" />
                        </Badge>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" color="text.secondary">
                      {companyVerif.verifications.completed} de {companyVerif.verifications.required} completados
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(companyVerif.verifications.completed / companyVerif.verifications.required) * 100}
                      sx={{ mt: 1, width: 100 }}
                      color={getComplianceColor(companyVerif.complianceStatus)}
                    />
                  </Box>
                </Box>
              </AccordionSummary>

              <AccordionDetails>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Verificación</TableCell>
                        <TableCell>Tipo</TableCell>
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
                              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                {(verification.documentUrl || verification.documentoId) && (
                                  <>
                                    <Tooltip title="Ver documento">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleViewDocument(
                                          verification.documentoId || verification.documentUrl!
                                        )}
                                      >
                                        <ViewIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Descargar">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleDownloadDocument(
                                          verification.documentoId || verification.documentUrl!,
                                          `${verification.name}.pdf`
                                        )}
                                      >
                                        <DownloadIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                )}
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
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </Box>

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
    </>
  );
};