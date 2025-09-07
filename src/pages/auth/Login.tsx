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
  IconButton,
  InputAdornment,
  Link,
  Menu,
  MenuItem,
  ListItemText
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePageTitle, getPageTitle } from '../../hooks/usePageTitle';
import { getDefaultRouteForRole } from '../../utils/roleRedirects';
import { useTracking } from '../../hooks/useTracking';


export const Login: React.FC = () => {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [backdoorAnchor, setBackdoorAnchor] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { track } = useTracking();

  // Get registration data from navigation state
  const registrationState = location.state as { message?: string; email?: string } | null;

  // Set page title
  usePageTitle(getPageTitle('Inicio de Sesión'), 'Sistema de Gestión de Seguridad - Inicio de sesión');

  // Pre-fill email if coming from registration
  useEffect(() => {
    if (registrationState?.email) {
      setEmail(registrationState.email);
      console.log('Pre-llenando email desde registro:', registrationState.email);
    }
  }, [registrationState]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Track form submission start
    track.formEvent('login_form', 'submit');
    
    try {
      const user = await login(email, password);
      
      // Track successful login
      track.auth('login', 'email');
      track.event('login_success', {
        user_role: user.role,
        company: user.company?.name || 'unknown',
        timestamp: new Date().toISOString()
      });
      
      // Redirigir al usuario a su primera página según su rol
      const defaultRoute = getDefaultRouteForRole(user.role);
      navigate(defaultRoute);
    } catch (err) {
      // Track login error
      const errorMessage = err instanceof Error ? err.message : 'Email o contraseña incorrectos';
      track.error('login_failed', errorMessage);
      track.formEvent('login_form', 'error', undefined, [errorMessage]);
      
      setError(errorMessage);
    }
  };


  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    track.buttonClick('toggle_password_visibility', 'login_form');
  };

  // Backdoor test accounts
  const testAccounts = [
    { email: 'admin@safety.com', role: 'super_admin', company: 'Safety Admin' },
    { email: 'safety@alpha.com.pe', role: 'safety_staff', company: 'Alpha' },
    { email: 'supervisor@alpha.com.pe', role: 'client_supervisor', company: 'Alpha' },
    { email: 'approver@beta.com.pe', role: 'client_approver', company: 'Beta' },
    { email: 'staff@alpha.com.pe', role: 'client_staff', company: 'Alpha' },
    { email: 'validator@safety.com', role: 'validadores_ops', company: 'Safety' },
    { email: 'admin@gamma.com.pe', role: 'contratista_admin', company: 'Gamma' },
    { email: 'subalternos@gamma.com.pe', role: 'contratista_subalternos', company: 'Gamma' },
    { email: 'admin-alpha@contratista.com', role: 'contratista_admin', company: 'Alpha' },
    { email: 'admin-beta@contratista.com', role: 'contratista_admin', company: 'Beta' },
    { email: 'subalternos-alpha@contratista.com', role: 'contratista_subalternos', company: 'Alpha' },
    { email: 'subalternos-beta@contratista.com', role: 'contratista_subalternos', company: 'Beta' },
    { email: 'huerfano@freelance.com', role: 'contratista_huerfano', company: 'Particular' },
    { email: 'huerfano2@freelance.com', role: 'contratista_huerfano', company: 'Particular' }
  ];

  const handleBackdoorClick = (event: React.MouseEvent<HTMLElement>) => {
    setBackdoorAnchor(event.currentTarget);
  };

  const handleBackdoorClose = () => {
    setBackdoorAnchor(null);
  };

  const handleSelectTestAccount = (account: typeof testAccounts[0]) => {
    setEmail(account.email);
    setPassword('test');
    setBackdoorAnchor(null);
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 3
        }}
      >

        {/* Centered Login Form */}
        <Card sx={{ width: '100%', maxWidth: 400 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <img 
                src="/safety-logo.png" 
                alt="Safety Logo" 
                style={{ 
                  height: '80px',
                  objectFit: 'contain',
                  marginBottom: '16px'
                }}
              />
              <Typography variant="h5" align="center" fontWeight="bold">
                Inicio de Sesión
              </Typography>
              <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 1 }}>
                Sistema de Gestión de Seguridad
              </Typography>
              
              {/* Invisible backdoor button */}
              <Box
                onClick={handleBackdoorClick}
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 20,
                  height: 20,
                  cursor: 'pointer',
                  opacity: 0,
                  '&:hover': {
                    opacity: 0.1,
                    backgroundColor: 'primary.main'
                  }
                }}
                title="Quick Access"
              />
            </Box>
            
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {registrationState?.message && <Alert severity="success" sx={{ mb: 2 }}>{registrationState.message}</Alert>}
            
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Correo Electrónico"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
              >
                Iniciar Sesión
              </Button>

              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Link 
                  component={RouterLink} 
                  to="/forgot-password" 
                  underline="hover"
                  color="primary"
                  sx={{ fontSize: '0.875rem' }}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </Box>
              
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  ¿No tienes una cuenta?{' '}
                  <Link component={RouterLink} to="/register" underline="hover">
                    Regístrate aquí
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Quick Access Menu */}
        <Menu
          anchorEl={backdoorAnchor}
          open={Boolean(backdoorAnchor)}
          onClose={handleBackdoorClose}
          PaperProps={{
            style: {
              maxHeight: 400,
              width: '300px',
            },
          }}
        >
          {testAccounts.map((account, index) => (
            <MenuItem
              key={index}
              onClick={() => handleSelectTestAccount(account)}
              dense
            >
              <ListItemText
                primary={account.email}
                secondary={`${account.role} - ${account.company}`}
                primaryTypographyProps={{ fontSize: '0.875rem' }}
                secondaryTypographyProps={{ fontSize: '0.75rem' }}
              />
            </MenuItem>
          ))}
        </Menu>
      </Box>
    </Container>
  );
};