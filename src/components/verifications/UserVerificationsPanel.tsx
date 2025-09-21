import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Collapse,
  Stack,
  Divider,
  Badge,
  Tooltip,
  CircularProgress,
  Snackbar,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Description as DescriptionIcon,
  CloudUpload as CloudUploadIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { verificationsApi } from '../../services/verificationsApi';
import { differenceInDays, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface UserVerificationsPanelProps {
  userId: string;
}

interface CompanyVerification {
  company: {
    id: string;
    name: string;
    role: string;
    isActive: boolean;
    isPrimary: boolean;
  };
  verifications: {
    total: number;
    required: number;
    completed: number;
    pending: number;
    expired: number;
    details: VerificationDetail[];
  };
  complianceStatus: 'compliant' | 'non_compliant' | 'partial';
}

interface VerificationDetail {
  id: string;
  name: string;
  type: string;
  isRequired: boolean;
  status: 'approved' | 'pending' | 'rejected' | 'expired' | 'not_submitted';
  expiryDate?: string;
  submittedDate?: string;
  approvedDate?: string;
  rejectedDate?: string;
  rejectionReason?: string;
}

export const UserVerificationsPanel: React.FC<UserVerificationsPanelProps> = ({ userId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [verifications, setVerifications] = useState<CompanyVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedCompanies, setExpandedCompanies] = useState<string[]>([]);
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // Form states
  const [documentUrl, setDocumentUrl] = useState('');
  const [certificateNumber, setCertificateNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  useEffect(() => {
    loadVerifications();
  }, [userId]);

  const loadVerifications = async () => {
    try {
      setLoading(true);
      const data = await verificationsApi.getUserVerifications();
      setVerifications(data);
      
      // Auto-expand companies with pending verifications
      const companiesWithPending = data
        .filter((cv: CompanyVerification) => cv.verifications.pending > 0 || cv.verifications.expired > 0)
        .map((cv: CompanyVerification) => cv.company.id);
      setExpandedCompanies(companiesWithPending);
    } catch (error) {
      console.error('Error loading verifications:', error);
      setError('Error al cargar las verificaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyToggle = (companyId: string) => {
    setExpandedCompanies(prev =>
      prev.includes(companyId)
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon color="success" />;
      case 'pending':
        return <ScheduleIcon color="warning" />;
      case 'rejected':
        return <ErrorIcon color="error" />;
      case 'expired':
        return <WarningIcon color="error" />;
      case 'not_submitted':
        return <DescriptionIcon color="disabled" />;
      default:
        return <InfoIcon />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprobado';
      case 'pending':
        return 'Pendiente de revisión';
      case 'rejected':
        return 'Rechazado';
      case 'expired':
        return 'Expirado';
      case 'not_submitted':
        return 'Sin enviar';
      default:
        return status;
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'success';
      case 'partial':
        return 'warning';
      case 'non_compliant':
        return 'error';
      default:
        return 'default';
    }
  };

  const getComplianceLabel = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'Cumple requisitos';
      case 'partial':
        return 'Cumplimiento parcial';
      case 'non_compliant':
        return 'No cumple requisitos';
      default:
        return status;
    }
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const days = differenceInDays(new Date(expiryDate), new Date());
    return days <= 30 && days > 0;
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: es });
  };

  const handleSubmitVerification = (companyId: string, verification: VerificationDetail) => {
    setSelectedVerification({ companyId, verification });
    setSubmitDialogOpen(true);
    // Reset form
    setDocumentUrl('');
    setCertificateNumber('');
    setExpiryDate('');
    setNotes('');
    setSelectedFile(null);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setUploadingFile(true);

    try {
      // Here you would implement the actual file upload to your storage service
      // For now, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Set a mock URL - in production, this would be the actual uploaded file URL
      setDocumentUrl(`https://storage.example.com/docs/${file.name}`);
      
      // If it's a document with expiry, suggest a date 1 year from now
      if (selectedVerification?.verification.type === 'certification' || 
          selectedVerification?.verification.type === 'document') {
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        setExpiryDate(oneYearFromNow.toISOString().split('T')[0]);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Error al cargar el archivo');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedVerification || !documentUrl) return;

    try {
      setUploadingFile(true);
      
      await verificationsApi.submitVerification(
        selectedVerification.companyId,
        selectedVerification.verification.id,
        {
          documentUrl,
          certificateNumber: certificateNumber || undefined,
          expiryDate: expiryDate || undefined,
          notes: notes || undefined
        }
      );

      setSubmitDialogOpen(false);
      await loadVerifications();
      
      // Show success message
      setError('');
      setSnackbarMessage('Verificación enviada exitosamente');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error submitting verification:', error);
      setError('Error al enviar la verificación');
      setSnackbarMessage('Error al enviar la verificación. Por favor, intente nuevamente.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setUploadingFile(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !verifications.length) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography 
        variant={isMobile ? 'h6' : 'h5'} 
        sx={{ 
          mb: 3, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          fontSize: { xs: '1.1rem', sm: '1.5rem' }
        }}
      >
        <AssignmentIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
        Mis Verificaciones
      </Typography>

      {verifications.length === 0 ? (
        <Alert severity="info">
          No tienes verificaciones pendientes en este momento.
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {verifications.map((companyVer) => (
            <Box key={companyVer.company.id}>
              <Card>
                <CardContent>
                  {/* Company Header */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                      cursor: 'pointer'
                    }}
                    onClick={() => handleCompanyToggle(companyVer.company.id)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
                      <BusinessIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant={isXs ? 'subtitle1' : 'h6'}>
                          {companyVer.company.name}
                        </Typography>
                        <Typography variant={isXs ? 'caption' : 'body2'} color="text.secondary">
                          {companyVer.company.role} • {companyVer.company.isPrimary ? 'Principal' : 'Secundaria'}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Chip
                        label={getComplianceLabel(companyVer.complianceStatus)}
                        color={getComplianceColor(companyVer.complianceStatus) as any}
                        size="small"
                      />
                      <IconButton size="small">
                        {expandedCompanies.includes(companyVer.company.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Progress Bar */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Progreso de verificaciones
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {companyVer.verifications.completed} de {companyVer.verifications.required} completadas
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(companyVer.verifications.completed / companyVer.verifications.required) * 100}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>

                  {/* Stats */}
                  <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                    gap: { xs: 1, sm: 2 },
                    mb: 2
                  }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant={isXs ? 'body1' : 'h6'}>{companyVer.verifications.total}</Typography>
                      <Typography variant={isXs ? 'caption' : 'body2'} color="text.secondary">Total</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant={isXs ? 'body1' : 'h6'} color="warning.main">
                        {companyVer.verifications.pending}
                      </Typography>
                      <Typography variant={isXs ? 'caption' : 'body2'} color="text.secondary">Pendientes</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant={isXs ? 'body1' : 'h6'} color="success.main">
                        {companyVer.verifications.completed}
                      </Typography>
                      <Typography variant={isXs ? 'caption' : 'body2'} color="text.secondary">Completadas</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant={isXs ? 'body1' : 'h6'} color="error.main">
                        {companyVer.verifications.expired}
                      </Typography>
                      <Typography variant={isXs ? 'caption' : 'body2'} color="text.secondary">Expiradas</Typography>
                    </Box>
                  </Box>

                  {/* Verifications List */}
                  <Collapse in={expandedCompanies.includes(companyVer.company.id)}>
                    <Divider sx={{ my: 2 }} />
                    <List>
                      {companyVer.verifications.details.map((verification) => (
                        <ListItem
                          key={verification.id}
                          sx={{
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            mb: 1
                          }}
                          secondaryAction={
                            ['not_submitted', 'rejected', 'expired'].includes(verification.status) && (
                              <Button
                                variant="contained"
                                size={isXs ? "small" : "medium"}
                                startIcon={!isXs && <CloudUploadIcon />}
                                onClick={() => handleSubmitVerification(companyVer.company.id, verification)}
                                sx={{ 
                                  minWidth: { xs: 80, sm: 'auto' },
                                  px: { xs: 1, sm: 2 }
                                }}
                              >
                                {isXs ? 'Subir' : 'Subir documento'}
                              </Button>
                            )
                          }
                        >
                          <ListItemIcon>
                            {getStatusIcon(verification.status)}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle1">
                                  {verification.name}
                                </Typography>
                                {verification.isRequired && (
                                  <Chip label="Requerido" size="small" color="primary" />
                                )}
                                <Chip
                                  label={getStatusLabel(verification.status)}
                                  size="small"
                                  color={
                                    verification.status === 'approved' ? 'success' :
                                    verification.status === 'pending' ? 'warning' :
                                    verification.status === 'rejected' ? 'error' :
                                    'default'
                                  }
                                />
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 1 }}>
                                {verification.status === 'approved' && verification.expiryDate && (
                                  <Typography variant="body2" color={isExpiringSoon(verification.expiryDate) ? 'warning.main' : 'text.secondary'}>
                                    <CalendarIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                                    Expira: {formatDate(verification.expiryDate)}
                                    {isExpiringSoon(verification.expiryDate) && ' (Próximo a expirar)'}
                                  </Typography>
                                )}
                                {verification.status === 'rejected' && verification.rejectionReason && (
                                  <Alert severity="error" sx={{ mt: 1, py: 0.5 }}>
                                    Razón del rechazo: {verification.rejectionReason}
                                  </Alert>
                                )}
                                {verification.submittedDate && (
                                  <Typography variant="caption" color="text.secondary">
                                    Enviado: {formatDate(verification.submittedDate)}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {/* Submit Verification Dialog */}
      <Dialog 
        open={submitDialogOpen} 
        onClose={() => setSubmitDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isXs}
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: 0, sm: '32px' },
            width: { xs: '100%', sm: 'auto' },
            maxHeight: { xs: '100%', sm: '90vh' }
          }
        }}
      >
        <DialogTitle>
          Enviar Verificación: {selectedVerification?.verification.name}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            {/* File Upload */}
            <Box>
              <input
                accept="image/*,application/pdf"
                style={{ display: 'none' }}
                id="verification-file-upload"
                type="file"
                onChange={handleFileUpload}
                disabled={uploadingFile}
              />
              <label htmlFor="verification-file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={uploadingFile ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                  disabled={uploadingFile}
                  fullWidth
                >
                  {uploadingFile ? 'Cargando archivo...' : selectedFile ? selectedFile.name : 'Seleccionar archivo'}
                </Button>
              </label>
            </Box>

            {/* Document URL */}
            <TextField
              fullWidth
              label="URL del documento"
              value={documentUrl}
              onChange={(e) => setDocumentUrl(e.target.value)}
              placeholder="https://ejemplo.com/documento.pdf"
              required
            />

            {/* Certificate Number */}
            {['certification', 'course', 'training'].includes(selectedVerification?.verification.type) && (
              <TextField
                fullWidth
                label="Número de certificado"
                value={certificateNumber}
                onChange={(e) => setCertificateNumber(e.target.value)}
              />
            )}

            {/* Expiry Date */}
            {selectedVerification?.verification.type !== 'background_check' && (
              <TextField
                fullWidth
                type="date"
                label="Fecha de vencimiento"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}

            {/* Notes */}
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notas adicionales (opcional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Información adicional sobre este documento..."
            />

            {error && (
              <Alert severity="error" onClose={() => setError('')}>
                {error}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          gap: { xs: 1, sm: 0 },
          p: { xs: 2, sm: 1 }
        }}>
          <Button 
            onClick={() => setSubmitDialogOpen(false)} 
            disabled={uploadingFile}
            fullWidth={isXs}
            size={isMobile ? 'medium' : 'large'}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!documentUrl || uploadingFile}
            startIcon={uploadingFile ? <CircularProgress size={20} /> : <CloudUploadIcon />}
            fullWidth={isXs}
            size={isMobile ? 'medium' : 'large'}
          >
            {uploadingFile ? 'Enviando...' : 'Enviar verificación'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};