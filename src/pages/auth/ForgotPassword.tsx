import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  CircularProgress,
  Link,
  InputAdornment
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  usePageTitle('Recuperar Contraseña', 'Solicitar enlace de recuperación de contraseña');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Por favor ingresa tu email');
      return;
    }

    if (!validateEmail(email)) {
      setError('Por favor ingresa un email válido');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setMessage('');

      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage(data.message || 'Se ha enviado un enlace de recuperación a tu email');
        setEmailSent(true);
        
        // Opcional: redirigir al login después de unos segundos
        setTimeout(() => {
          navigate('/login', {
            state: { 
              message: 'Revisa tu email para el enlace de recuperación de contraseña' 
            }
          });
        }, 5000);
      } else {
        setError(data.error || 'Error al procesar la solicitud');
      }
    } catch (err) {
      console.error('Error en forgot password:', err);
      setError('Error de conexión. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
        py: 3
      }}>
        <Card sx={{ 
          width: '100%',
          textAlign: 'center',
          p: 2,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 3
        }}>
          {/* Logo de marca de agua */}
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              right: 20,
              opacity: 0.08,
              zIndex: 0,
              pointerEvents: 'none'
            }}
          >
            <img 
              src="/safety-logo.png" 
              alt="" 
              style={{ 
                width: '80px',
                height: '80px',
                objectFit: 'contain'
              }}
            />
          </Box>
          
          <CardContent sx={{ position: 'relative', zIndex: 1, p: 4 }}>
            {!emailSent ? (
              <>
                {/* Ícono de email */}
                <Box sx={{ 
                  width: 64, 
                  height: 64, 
                  borderRadius: '50%', 
                  backgroundColor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px auto'
                }}>
                  <EmailIcon sx={{ color: 'white', fontSize: 32 }} />
                </Box>

                <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                  Recuperar Contraseña
                </Typography>

                <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
                  Ingresa tu email y te enviaremos un enlace seguro para restablecer tu contraseña
                </Typography>

                <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    label="Correo Electrónico"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={!!error && !message}
                    placeholder="correo@ejemplo.com"
                    required
                    disabled={loading}
                    sx={{ mb: 3 }}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon color="action" />
                          </InputAdornment>
                        ),
                      }
                    }}
                  />

                  {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {error}
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={loading}
                    endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                    sx={{ py: 1.5, mb: 3 }}
                  >
                    {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
                  </Button>
                </Box>
              </>
            ) : (
              <>
                {/* Estado de email enviado */}
                <Box sx={{ 
                  width: 64, 
                  height: 64, 
                  borderRadius: '50%', 
                  backgroundColor: 'success.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px auto'
                }}>
                  <SendIcon sx={{ color: 'white', fontSize: 32 }} />
                </Box>

                <Typography variant="h4" gutterBottom sx={{ color: 'success.main', mb: 2 }}>
                  ¡Email Enviado!
                </Typography>

                {message && (
                  <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
                    {message}
                  </Alert>
                )}

                <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                  Si el email <strong>{email}</strong> está registrado en nuestro sistema, 
                  recibirás un enlace de recuperación en los próximos minutos.
                </Typography>

                <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary' }}>
                  Revisa tu bandeja de entrada y spam. El enlace expirará en 1 hora por seguridad.
                </Typography>
              </>
            )}

            {/* Botón para volver al login */}
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleBackToLogin}
              disabled={loading}
              sx={{ minWidth: 200 }}
            >
              Volver al Inicio de Sesión
            </Button>

            {!emailSent && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  ¿Recordaste tu contraseña?{' '}
                  <Link
                    component="button"
                    type="button"
                    onClick={handleBackToLogin}
                    underline="hover"
                    color="primary"
                    disabled={loading}
                  >
                    Iniciar sesión
                  </Link>
                </Typography>
              </Box>
            )}

            {emailSent && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  ¿No recibiste el email?{' '}
                  <Link
                    component="button"
                    type="button"
                    onClick={() => {
                      setEmailSent(false);
                      setMessage('');
                      setError('');
                    }}
                    underline="hover"
                    color="primary"
                  >
                    Intentar de nuevo
                  </Link>
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};