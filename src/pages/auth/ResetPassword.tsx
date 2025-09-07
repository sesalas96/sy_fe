import React, { useState, useEffect } from 'react';
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
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  LockReset as LockResetIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [isTokenValid, setIsTokenValid] = useState(true);
  const [resetSuccess, setResetSuccess] = useState(false);

  usePageTitle('Restablecer Contraseña', 'Crear nueva contraseña segura');

  useEffect(() => {
    // Obtener token de la URL (puede estar en query param o en el path)
    const tokenFromQuery = searchParams.get('token');
    const pathToken = location.pathname.split('/').pop();
    
    const tokenToUse = tokenFromQuery || pathToken;
    
    if (!tokenToUse || tokenToUse.length < 10) {
      setError('Token de recuperación inválido o faltante');
      setIsTokenValid(false);
      return;
    }
    
    setToken(tokenToUse);
  }, [searchParams, location]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'La contraseña debe contener al menos 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'La contraseña debe contener al menos 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'La contraseña debe contener al menos 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial';
    }
    if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) {
      return 'La contraseña debe contener al menos 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones del frontend
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setMessage('');

      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token: token.trim(), 
          password: password 
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage(data.message || 'Contraseña restablecida exitosamente');
        setResetSuccess(true);
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          navigate('/login', {
            state: { 
              message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.',
              type: 'success'
            }
          });
        }, 3000);
      } else {
        if (response.status === 400 && data.error?.includes('inválido')) {
          setError('El enlace de recuperación ha expirado o es inválido. Solicita uno nuevo.');
          setIsTokenValid(false);
        } else {
          setError(data.error || 'Error al restablecer la contraseña');
        }
      }
    } catch (err) {
      console.error('Error en reset password:', err);
      setError('Error de conexión. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  const handleRequestNewLink = () => {
    navigate('/forgot-password');
  };

  if (!isTokenValid) {
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
            boxShadow: 3
          }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ 
                width: 64, 
                height: 64, 
                borderRadius: '50%', 
                backgroundColor: 'error.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px auto'
              }}>
                <LockResetIcon sx={{ color: 'white', fontSize: 32 }} />
              </Box>

              <Typography variant="h4" gutterBottom sx={{ color: 'error.main', mb: 2 }}>
                Enlace Inválido
              </Typography>

              <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                {error}
              </Alert>

              <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
                El enlace de recuperación es inválido, ha expirado o ya fue utilizado. 
                Por seguridad, los enlaces expiran después de 1 hora.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={handleRequestNewLink}
                  sx={{ minWidth: 200 }}
                >
                  Solicitar Nuevo Enlace
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<ArrowBackIcon />}
                  onClick={handleBackToLogin}
                  sx={{ minWidth: 150 }}
                >
                  Volver al Login
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    );
  }

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
            {!resetSuccess ? (
              <>
                {/* Ícono de restablecer */}
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
                  <LockResetIcon sx={{ color: 'white', fontSize: 32 }} />
                </Box>

                <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                  Restablecer Contraseña
                </Typography>

                <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
                  Crea una nueva contraseña segura para tu cuenta
                </Typography>

                <Box component="form" onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    label="Nueva Contraseña"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    sx={{ mb: 3 }}
                    helperText="Mínimo 8 caracteres con 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial"
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              disabled={loading}
                            >
                              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Confirmar Nueva Contraseña"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    sx={{ mb: 3 }}
                    helperText="Repite la misma contraseña"
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              edge="end"
                              disabled={loading}
                            >
                              {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }
                    }}
                  />

                  {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                      {error}
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={loading || !password || !confirmPassword}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LockResetIcon />}
                    sx={{ py: 1.5, mb: 3 }}
                  >
                    {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
                  </Button>
                </Box>
              </>
            ) : (
              <>
                {/* Estado de éxito */}
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
                  <CheckCircleIcon sx={{ color: 'white', fontSize: 32 }} />
                </Box>

                <Typography variant="h4" gutterBottom sx={{ color: 'success.main', mb: 2 }}>
                  ¡Contraseña Restablecida!
                </Typography>

                {message && (
                  <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
                    {message}
                  </Alert>
                )}

                <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                  Tu contraseña ha sido actualizada exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.
                </Typography>

                <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary' }}>
                  Serás redirigido al login en <strong>3 segundos</strong>...
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
              {resetSuccess ? 'Ir al Inicio de Sesión' : 'Cancelar'}
            </Button>

            {!resetSuccess && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  ¿Problemas con el enlace?{' '}
                  <Link
                    component="button"
                    type="button"
                    onClick={handleRequestNewLink}
                    underline="hover"
                    color="primary"
                    disabled={loading}
                  >
                    Solicitar nuevo enlace
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