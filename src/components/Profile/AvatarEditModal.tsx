import React, { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Avatar,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
  CameraAlt as CameraAltIcon
} from '@mui/icons-material';
import Webcam from 'react-webcam';
import { useAuth } from '../../contexts/AuthContext';
import { fileService } from '../../services/fileService';

interface AvatarEditModalProps {
  open: boolean;
  onClose: () => void;
  currentAvatarUrl?: string | null;
  onAvatarUpdated?: () => void;
}

export const AvatarEditModal: React.FC<AvatarEditModalProps> = ({
  open,
  onClose,
  currentAvatarUrl,
  onAvatarUpdated
}) => {
  const { user, refreshUserAvatar } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const webcamRef = useRef<Webcam>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Por favor selecciona un archivo de imagen');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no debe superar los 5MB');
        return;
      }

      setError(null);
      setSelectedFile(file);
      setCapturedImage(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
        setPreviewUrl(imageSrc);
        setShowCamera(false);
        setSelectedFile(null);
        setError(null);
      }
    }
  }, []);

  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleUpload = async () => {
    if ((!selectedFile && !capturedImage) || !user) return;

    setLoading(true);
    setError(null);

    try {
      const userId = user.id || user._id;
      if (!userId) {
        throw new Error('No se pudo obtener el ID del usuario');
      }

      let fileToUpload: File;
      if (selectedFile) {
        fileToUpload = selectedFile;
      } else if (capturedImage) {
        fileToUpload = dataURLtoFile(capturedImage, 'selfie.jpg');
      } else {
        throw new Error('No hay imagen para subir');
      }

      // Update the selfie using the PUT endpoint
      const response = await fileService.updateContractorDocument(
        userId,
        'selfie',
        fileToUpload
      );

      if (response.success) {
        // Refresh the avatar in AuthContext
        await refreshUserAvatar();
        
        // Call the callback if provided
        if (onAvatarUpdated) {
          onAvatarUpdated();
        }
        
        // Close the modal
        handleClose();
      } else {
        setError(response.message || 'Error al actualizar la foto');
      }
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      setError(err.message || 'Error al actualizar la foto');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setPreviewUrl(null);
      setSelectedFile(null);
      setCapturedImage(null);
      setShowCamera(false);
      setError(null);
      onClose();
    }
  };

  const handleRemovePhoto = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setCapturedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            {currentAvatarUrl ? 'Editar Foto de Perfil' : 'Agregar Foto de Perfil'}
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleClose}
            disabled={loading}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: 3,
          py: 2
        }}>
          {/* Camera View or Avatar Preview */}
          {showCamera ? (
            <Box sx={{ position: 'relative', width: '100%', maxWidth: 400, bgcolor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  facingMode: 'user',
                  width: 400,
                  height: 400
                }}
                style={{
                  width: '100%',
                  borderRadius: '8px'
                }}
              />
              {/* Circular guide for selfie */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '200px',
                  height: '200px',
                  border: '3px solid #fff',
                  borderRadius: '50%',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                  pointerEvents: 'none'
                }}
              />
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => setShowCamera(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PhotoCameraIcon />}
                  onClick={capturePhoto}
                >
                  Capturar
                </Button>
              </Box>
            </Box>
          ) : (
            <Avatar
              sx={{ 
                width: 200, 
                height: 200,
                border: '4px solid',
                borderColor: 'divider',
                bgcolor: (previewUrl || currentAvatarUrl) ? 'transparent' : 'action.hover'
              }}
              src={previewUrl || currentAvatarUrl || undefined}
            >
              {!previewUrl && !currentAvatarUrl && <PhotoCameraIcon sx={{ fontSize: 60, color: 'action.active' }} />}
            </Avatar>
          )}

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ width: '100%' }}>
              {error}
            </Alert>
          )}

          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFileSelect}
          />

          {/* Action Buttons */}
          {!showCamera && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<PhotoCameraIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                Seleccionar Foto
              </Button>
              
              <Button
                variant="contained"
                startIcon={<CameraAltIcon />}
                onClick={() => setShowCamera(true)}
                disabled={loading}
              >
                Tomar Foto
              </Button>
              
              {previewUrl && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleRemovePhoto}
                  disabled={loading}
                >
                  Quitar
                </Button>
              )}
            </Box>
          )}

          {/* Instructions */}
          <Typography variant="body2" color="textSecondary" align="center">
            {!currentAvatarUrl && (
              <>
                <Typography variant="subtitle1" color="text.primary" gutterBottom>
                  ¡Personaliza tu perfil!
                </Typography>
              </>
            )}
            Selecciona una imagen JPG, PNG o GIF de máximo 5MB.
            La foto se utilizará como tu avatar en el sistema.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={handleClose}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleUpload}
          variant="contained"
          disabled={(!selectedFile && !capturedImage) || loading}
        >
          {loading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Actualizando...
            </>
          ) : (
            'Actualizar Foto'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};