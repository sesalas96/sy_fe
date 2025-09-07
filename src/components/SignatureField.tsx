import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Box, Button, Paper, Typography, useTheme } from '@mui/material';
import { Clear as ClearIcon, Done as DoneIcon } from '@mui/icons-material';

interface SignatureFieldProps {
  onSave?: (dataUrl: string) => void;
  onChange?: (dataUrl: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  value?: string;
  width?: number;
  height?: number;
}

export interface SignatureFieldRef {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: () => string;
}

export const SignatureField = forwardRef<SignatureFieldRef, SignatureFieldProps>(
  ({ onSave, onChange, label, required, disabled, value, width = 400, height = 200 }, ref) => {
    const sigCanvas = useRef<SignatureCanvas>(null);
    const theme = useTheme();

    useImperativeHandle(ref, () => ({
      clear: () => {
        if (sigCanvas.current) {
          sigCanvas.current.clear();
        }
      },
      isEmpty: () => {
        if (sigCanvas.current) {
          return sigCanvas.current.isEmpty();
        }
        return true;
      },
      toDataURL: () => {
        if (sigCanvas.current) {
          return sigCanvas.current.toDataURL();
        }
        return '';
      }
    }));

    const handleClear = () => {
      if (sigCanvas.current) {
        sigCanvas.current.clear();
        if (onChange) {
          onChange('');
        }
      }
    };

    const handleEnd = () => {
      if (sigCanvas.current && onChange) {
        const dataUrl = sigCanvas.current.toDataURL();
        onChange(dataUrl);
      }
    };

    const handleSave = () => {
      if (sigCanvas.current && onSave) {
        const dataUrl = sigCanvas.current.toDataURL();
        onSave(dataUrl);
      }
    };

    // Si hay un valor inicial (dataURL), lo mostramos
    React.useEffect(() => {
      if (value && sigCanvas.current) {
        sigCanvas.current.fromDataURL(value);
      }
    }, [value]);

    return (
      <Box sx={{ mb: 2 }}>
        {label && (
          <Typography variant="body2" gutterBottom>
            {label}
            {required && <Typography component="span" color="error"> *</Typography>}
          </Typography>
        )}
        
        <Paper 
          elevation={1} 
          sx={{ 
            p: 1,
            position: 'relative',
            opacity: disabled ? 0.6 : 1,
            pointerEvents: disabled ? 'none' : 'auto'
          }}
        >
          <Box
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              backgroundColor: theme.palette.background.paper,
              position: 'relative',
              width: '100%',
              maxWidth: width,
              overflow: 'hidden'
            }}
          >
            <SignatureCanvas
              ref={sigCanvas}
              canvasProps={{
                style: {
                  width: '100%',
                  height: height,
                  cursor: disabled ? 'not-allowed' : 'crosshair'
                }
              }}
              backgroundColor={theme.palette.background.paper}
              penColor={theme.palette.text.primary}
              onEnd={handleEnd}
              clearOnResize={false}
            />
            
            {disabled && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  pointerEvents: 'none'
                }}
              >
                <Typography color="text.secondary">
                  Campo deshabilitado
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={handleClear}
              variant="outlined"
              disabled={disabled}
            >
              Limpiar
            </Button>
            {onSave && (
              <Button
                size="small"
                startIcon={<DoneIcon />}
                onClick={handleSave}
                variant="contained"
                disabled={disabled}
              >
                Guardar Firma
              </Button>
            )}
          </Box>
        </Paper>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          Dibuje su firma en el área de arriba
        </Typography>
      </Box>
    );
  }
);

SignatureField.displayName = 'SignatureField';