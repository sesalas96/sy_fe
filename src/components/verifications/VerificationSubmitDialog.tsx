import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  LinearProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import { userVerificationsApi, VerificationDetail, SubmitVerificationData } from '../../services/userVerificationsApi';

interface VerificationSubmitDialogProps {
  open: boolean;
  onClose: () => void;
  verification: VerificationDetail;
  companyId: string;
  companyName: string;
  onSubmitted: () => void;
}

export const VerificationSubmitDialog: React.FC<VerificationSubmitDialogProps> = ({
  open,
  onClose,
  verification,
  companyId,
  companyName,
  onSubmitted
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState<SubmitVerificationData>({
    documentUrl: verification.documentUrl || '',
    certificateNumber: verification.certificateNumber || '',
    expiryDate: verification.expiryDate || '',
    notes: ''
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('El archivo no puede superar los 10MB');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setError('Solo se permiten archivos PDF, JPG, JPEG o PNG');
        return;
      }
      
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) return;
    
    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);
      
      // Simulate progress (in real implementation, use XMLHttpRequest or axios with progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      const result = await userVerificationsApi.uploadVerificationDocument(selectedFile);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setFormData(prev => ({ ...prev, documentUrl: result.url }));
      setSelectedFile(null);
      setUploading(false);
      
      // Reset progress after a delay
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setError(error.response?.data?.message || 'Error al subir el archivo');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate required fields
      if (!formData.documentUrl) {
        setError('Debe subir un documento');
        setLoading(false);
        return;
      }
      
      if (verification.validityPeriod && !formData.expiryDate) {
        setError('Debe especificar la fecha de vencimiento');
        setLoading(false);
        return;
      }
      
      await userVerificationsApi.submitVerification(
        companyId,
        verification.id,
        formData
      );
      
      setSuccess(true);
      setTimeout(() => {
        onSubmitted();
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error('Error submitting verification:', error);
      setError(error.response?.data?.message || 'Error al enviar la verificación');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = () => {
    switch (verification.status) {
      case 'approved':
        return { color: 'success', label: 'Aprobado' };
      case 'rejected':
        return { color: 'error', label: 'Rechazado' };
      case 'pending':
      case 'in_review':
        return { color: 'warning', label: 'En revisión' };
      case 'expired':
        return { color: 'error', label: 'Expirado' };
      default:
        return { color: 'default', label: 'No enviado' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">
              {verification.status === 'not_submitted' ? 'Enviar' : 'Actualizar'} Verificación
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {companyName}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              {verification.name}
            </Typography>
            <Chip 
              label={statusInfo.label}
              color={statusInfo.color as any}
              size="small"
            />
          </Box>
          
          {verification.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {verification.description}
            </Typography>
          )}
          
          {verification.rejectionReason && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Razón de rechazo:</strong> {verification.rejectionReason}
              </Typography>
            </Alert>
          )}
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Verificación enviada exitosamente
          </Alert>
        )}
        
        {/* Document Upload Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Documento *
          </Typography>
          
          {formData.documentUrl ? (
            <Box sx={{ 
              p: 2, 
              border: '1px solid',
              borderColor: 'success.main',
              borderRadius: 1,
              bgcolor: 'success.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon color="success" />
                <Typography variant="body2">
                  Documento cargado
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  onClick={() => window.open(formData.documentUrl, '_blank')}
                >
                  Ver
                </Button>
                <Button
                  size="small"
                  color="error"
                  onClick={() => setFormData(prev => ({ ...prev, documentUrl: '' }))}
                >
                  Cambiar
                </Button>
              </Box>
            </Box>
          ) : (
            <Box>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                accept=".pdf,.jpg,.jpeg,.png"
              />
              
              {selectedFile ? (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ 
                    p: 2, 
                    border: '1px dashed',
                    borderColor: 'primary.main',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttachFileIcon color="primary" />
                      <Typography variant="body2">
                        {selectedFile.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </Typography>
                    </Box>
                    <IconButton 
                      size="small" 
                      onClick={() => setSelectedFile(null)}
                      disabled={uploading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  
                  {uploading && (
                    <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt: 1 }} />
                  )}
                  
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={handleUploadFile}
                    disabled={uploading}
                    startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                  >
                    {uploading ? 'Subiendo...' : 'Subir Archivo'}
                  </Button>
                </Box>
              ) : (
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => fileInputRef.current?.click()}
                  startIcon={<CloudUploadIcon />}
                  sx={{ py: 2 }}
                >
                  Seleccionar Archivo
                </Button>
              )}
              
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Formatos permitidos: PDF, JPG, PNG. Tamaño máximo: 10MB
              </Typography>
            </Box>
          )}
        </Box>
        
        {/* Certificate Number (optional) */}
        {(verification.type === 'certification' || verification.type === 'course') && (
          <TextField
            fullWidth
            label="Número de Certificado"
            value={formData.certificateNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, certificateNumber: e.target.value }))}
            sx={{ mb: 3 }}
          />
        )}
        
        {/* Expiry Date */}
        {verification.validityPeriod && (
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <DatePicker
              label="Fecha de Vencimiento *"
              value={formData.expiryDate ? new Date(formData.expiryDate) : null}
              onChange={(date) => {
                if (date) {
                  setFormData(prev => ({ ...prev, expiryDate: date.toISOString() }));
                }
              }}
              minDate={new Date()}
              format="dd/MM/yyyy"
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  sx: { mb: 3 }
                }
              }}
            />
          </LocalizationProvider>
        )}
        
        {/* Notes */}
        <TextField
          fullWidth
          label="Notas adicionales"
          multiline
          rows={3}
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          helperText="Información adicional relevante para esta verificación"
        />
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.documentUrl || uploading}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          {loading ? 'Enviando...' : 'Enviar Verificación'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};