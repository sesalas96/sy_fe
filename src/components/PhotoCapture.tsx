import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  IconButton,
  Alert,
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Check as CheckIcon,
  CameraAlt as CameraAltIcon
} from '@mui/icons-material';
import Webcam from 'react-webcam';

interface PhotoCaptureProps {
  type: 'selfie' | 'document_front' | 'document_back';
  label: string;
  onCapture: (imageData: string) => void;
  value?: string | File;
  error?: string;
  helperText?: string;
  required?: boolean;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  type,
  label,
  onCapture,
  value,
  error,
  helperText,
  required = false
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);

  // Configuración de cámara según el tipo
  const getCameraConfig = () => {
    switch (type) {
      case 'selfie':
        return {
          facingMode: 'user', // Cámara frontal
          width: 400,
          height: 400,
          title: 'Tomar Selfie',
          instruction: 'Posiciona tu rostro dentro del círculo y mantente quieto'
        };
      case 'document_front':
        return {
          facingMode: 'environment', // Cámara trasera
          width: 600,
          height: 400,
          title: 'Foto del Documento (Frente)',
          instruction: 'Coloca tu documento dentro del marco, asegúrate que esté completo y legible'
        };
      case 'document_back':
        return {
          facingMode: 'environment', // Cámara trasera
          width: 600,
          height: 400,
          title: 'Foto del Documento (Reverso)',
          instruction: 'Coloca la parte trasera de tu documento dentro del marco'
        };
    }
  };

  const config = getCameraConfig();

  const handleOpenCamera = () => {
    setIsDialogOpen(true);
    setCapturedImage(null);
    setCameraError(null);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCapturedImage(null);
    setCameraError(null);
  };

  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      setIsCapturing(true);
      setTimeout(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
          setCapturedImage(imageSrc);
        }
        setIsCapturing(false);
      }, 100);
    }
  }, [webcamRef]);

  const handleConfirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      handleCloseDialog();
    }
  };

  const handleRetakePhoto = () => {
    setCapturedImage(null);
  };

  const handleCameraError = (error: any) => {
    console.error('Camera error:', error);
    setCameraError('No se pudo acceder a la cámara. Verifica los permisos.');
  };

  const renderPreview = () => {
    if (!value) return null;
    
    let imageSrc: string;
    if (typeof value === 'string') {
      imageSrc = value;
    } else if (value instanceof File) {
      imageSrc = URL.createObjectURL(value);
    } else {
      return null;
    }

    return (
      <Box sx={{ mt: 2, position: 'relative' }}>
        <img
          src={imageSrc}
          alt={label}
          style={{
            width: '100%',
            maxWidth: type === 'selfie' ? '200px' : '300px',
            height: 'auto',
            borderRadius: '8px',
            border: '2px solid #e0e0e0'
          }}
        />
        <IconButton
          size="small"
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' }
          }}
          onClick={() => onCapture('')}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    );
  };

  const renderGuide = () => {
    if (type === 'selfie') {
      return (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '250px',
            height: '250px',
            border: '3px solid #fff',
            borderRadius: '50%',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
            pointerEvents: 'none',
            zIndex: 1
          }}
        />
      );
    } else {
      return (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            height: '60%',
            border: '3px solid #fff',
            borderRadius: '12px',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
            pointerEvents: 'none',
            zIndex: 1,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '10px',
              left: '10px',
              right: '10px',
              bottom: '10px',
              border: '1px dashed rgba(255, 255, 255, 0.7)',
              borderRadius: '8px'
            }
          }}
        />
      );
    }
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {label} {required && '*'}
      </Typography>
      
      <Button
        variant="outlined"
        fullWidth
        startIcon={<CameraAltIcon />}
        onClick={handleOpenCamera}
        sx={{
          height: '56px',
          justifyContent: 'flex-start',
          borderColor: error ? 'error.main' : 'rgba(0, 0, 0, 0.23)',
          '&:hover': {
            borderColor: error ? 'error.dark' : 'rgba(0, 0, 0, 0.87)'
          }
        }}
      >
        {value ? 'Cambiar foto' : config.title}
      </Button>

      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
          {error}
        </Typography>
      )}

      {helperText && !error && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {helperText}
        </Typography>
      )}

      {renderPreview()}

      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#000' }
        }}
      >
        <DialogTitle sx={{ color: 'white', textAlign: 'center', pb: 1 }}>
          {config.title}
        </DialogTitle>
        
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          {cameraError ? (
            <Alert severity="error" sx={{ m: 2 }}>
              {cameraError}
            </Alert>
          ) : (
            <>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'white', 
                  textAlign: 'center', 
                  p: 2, 
                  backgroundColor: 'rgba(0,0,0,0.7)' 
                }}
              >
                {config.instruction}
              </Typography>
              
              {!capturedImage ? (
                <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    width={config.width}
                    height={config.height}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{
                      facingMode: config.facingMode
                    }}
                    onUserMediaError={handleCameraError}
                    style={{ maxWidth: '100%' }}
                  />
                  {renderGuide()}
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <img 
                    src={capturedImage} 
                    alt="Captured" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '400px',
                      borderRadius: '8px'
                    }} 
                  />
                </Box>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', p: 2, backgroundColor: 'rgba(0,0,0,0.8)' }}>
          {!capturedImage && !cameraError && (
            <>
              <Button onClick={handleCloseDialog} sx={{ color: 'white' }}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={capturePhoto}
                disabled={isCapturing}
                startIcon={<PhotoCameraIcon />}
                sx={{ ml: 2 }}
              >
                {isCapturing ? 'Capturando...' : 'Tomar Foto'}
              </Button>
            </>
          )}
          
          {capturedImage && (
            <>
              <Button
                onClick={handleRetakePhoto}
                startIcon={<RefreshIcon />}
                sx={{ color: 'white' }}
              >
                Repetir
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={handleConfirmPhoto}
                startIcon={<CheckIcon />}
                sx={{ ml: 2 }}
              >
                Confirmar
              </Button>
            </>
          )}
          
          {cameraError && (
            <Button onClick={handleCloseDialog} sx={{ color: 'white' }}>
              Cerrar
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PhotoCapture;