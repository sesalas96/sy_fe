import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Collapse,
  Link
} from '@mui/material';
import {
  Cookie as CookieIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  Campaign as CampaignIcon
} from '@mui/icons-material';

interface CookieConsentProps {
  onAccept: (consents: CookieConsents) => void;
}

export interface CookieConsents {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

export const CookieConsent: React.FC<CookieConsentProps> = ({ onAccept }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consents, setConsents] = useState<CookieConsents>({
    necessary: true, // Siempre true, no se puede desactivar
    analytics: true,
    marketing: false,
    preferences: true
  });

  useEffect(() => {
    // Verificar si ya se dio consentimiento
    const hasConsent = localStorage.getItem('cookie-consent');
    if (!hasConsent) {
      // Mostrar después de un pequeño delay para mejor UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const allConsents: CookieConsents = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true
    };
    
    saveConsents(allConsents);
    onAccept(allConsents);
    setIsVisible(false);
  };

  const handleAcceptSelected = () => {
    saveConsents(consents);
    onAccept(consents);
    setIsVisible(false);
  };

  const handleRejectAll = () => {
    const minimalConsents: CookieConsents = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false
    };
    
    saveConsents(minimalConsents);
    onAccept(minimalConsents);
    setIsVisible(false);
  };

  const saveConsents = (consents: CookieConsents) => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      consents,
      timestamp: Date.now(),
      version: '1.0'
    }));
  };

  const handleConsentChange = (type: keyof CookieConsents) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (type === 'necessary') return; // No se puede cambiar
    
    setConsents(prev => ({
      ...prev,
      [type]: event.target.checked
    }));
  };

  if (!isVisible) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)',
        p: { xs: 2, md: 3 }
      }}
    >
      <Card
        sx={{
          maxWidth: 600,
          mx: 'auto',
          boxShadow: 3,
          borderRadius: 2
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CookieIcon sx={{ color: 'primary.main', mr: 1, fontSize: 28 }} />
            <Typography variant="h6" fontWeight="bold">
              Uso de Cookies y Datos
            </Typography>
          </Box>

          {/* Main message */}
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Utilizamos cookies y tecnologías similares para mejorar tu experiencia, 
            analizar el uso del sitio y personalizar el contenido. Tu privacidad es importante para nosotros.
          </Typography>

          {/* Quick actions */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={handleAcceptAll}
              size="small"
              sx={{ flexGrow: { xs: 1, sm: 0 } }}
            >
              Aceptar Todo
            </Button>
            <Button
              variant="outlined"
              onClick={handleRejectAll}
              size="small"
              sx={{ flexGrow: { xs: 1, sm: 0 } }}
            >
              Solo Necesarias
            </Button>
            <Button
              variant="text"
              onClick={() => setShowDetails(!showDetails)}
              size="small"
              endIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ flexGrow: { xs: 1, sm: 0 } }}
            >
              Personalizar
            </Button>
          </Box>

          {/* Detailed settings */}
          <Collapse in={showDetails}>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 2 }}>
              {/* Necessary */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SecurityIcon sx={{ color: 'success.main', mr: 1, fontSize: 20 }} />
                <FormControlLabel
                  control={
                    <Switch
                      checked={consents.necessary}
                      disabled
                      color="success"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        Cookies Necesarias
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Esenciales para el funcionamiento del sitio (autenticación, seguridad)
                      </Typography>
                    </Box>
                  }
                />
              </Box>

              {/* Analytics */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AnalyticsIcon sx={{ color: 'info.main', mr: 1, fontSize: 20 }} />
                <FormControlLabel
                  control={
                    <Switch
                      checked={consents.analytics}
                      onChange={handleConsentChange('analytics')}
                      color="info"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        Cookies de Análisis
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Nos ayudan a entender cómo usas el sitio (Google Analytics, heatmaps)
                      </Typography>
                    </Box>
                  }
                />
              </Box>

              {/* Marketing */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CampaignIcon sx={{ color: 'warning.main', mr: 1, fontSize: 20 }} />
                <FormControlLabel
                  control={
                    <Switch
                      checked={consents.marketing}
                      onChange={handleConsentChange('marketing')}
                      color="warning"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        Cookies de Marketing
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Para mostrarte contenido relevante y medir campañas publicitarias
                      </Typography>
                    </Box>
                  }
                />
              </Box>

              {/* Preferences */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CookieIcon sx={{ color: 'secondary.main', mr: 1, fontSize: 20 }} />
                <FormControlLabel
                  control={
                    <Switch
                      checked={consents.preferences}
                      onChange={handleConsentChange('preferences')}
                      color="secondary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        Cookies de Preferencias
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Recuerdan tus configuraciones y preferencias del sitio
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            </Box>

            <Button
              variant="contained"
              onClick={handleAcceptSelected}
              fullWidth
              sx={{ mb: 1 }}
            >
              Guardar Preferencias
            </Button>
          </Collapse>

          {/* Footer links */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 2, 
            mt: 2,
            flexWrap: 'wrap'
          }}>
            <Link href="/privacy" target="_blank" variant="caption" underline="hover">
              Política de Privacidad
            </Link>
            <Link href="/terms" target="_blank" variant="caption" underline="hover">
              Términos y Condiciones
            </Link>
            <Link href="/cookie-policy" target="_blank" variant="caption" underline="hover">
              Política de Cookies
            </Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CookieConsent;