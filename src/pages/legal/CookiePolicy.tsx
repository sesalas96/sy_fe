import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent
} from '@mui/material';
import { Cookie as CookieIcon } from '@mui/icons-material';
import { usePageTitle, getPageTitle } from '../../hooks/usePageTitle';

export const CookiePolicy: React.FC = () => {
  // Set page title
  usePageTitle(getPageTitle('Política de Cookies'), 'Política de cookies del Sistema de Gestión de Seguridad');
  const cookieTypes = [
    {
      type: 'Cookies Necesarias',
      description: 'Esenciales para el funcionamiento del sitio',
      purpose: 'Autenticación, seguridad, preferencias básicas',
      duration: 'Sesión o hasta 1 año',
      canDisable: false
    },
    {
      type: 'Cookies de Análisis',
      description: 'Nos ayudan a entender cómo usas el sitio',
      purpose: 'Estadísticas de uso, mejora de la experiencia',
      duration: 'Hasta 2 años',
      canDisable: true
    },
    {
      type: 'Cookies de Marketing',
      description: 'Para mostrarte contenido relevante',
      purpose: 'Personalización de anuncios, campañas publicitarias',
      duration: 'Hasta 1 año',
      canDisable: true
    },
    {
      type: 'Cookies de Preferencias',
      description: 'Recuerdan tus configuraciones',
      purpose: 'Idioma, tema, configuraciones personalizadas',
      duration: 'Hasta 1 año',
      canDisable: true
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CookieIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
          <Typography variant="h3" component="h1" fontWeight="bold">
            Política de Cookies
          </Typography>
        </Box>
        <Typography variant="subtitle1" color="text.secondary">
          Última actualización: {new Date().toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Typography>
      </Box>

      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom fontWeight="medium">
          ¿Qué son las cookies?
        </Typography>
        <Typography sx={{ mb: 2 }}>
          Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando 
          visitas nuestro sitio web. Estas cookies nos permiten reconocerte cuando regresas, 
          personalizar tu experiencia y analizar cómo utilizas nuestros servicios.
        </Typography>
      </Paper>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom fontWeight="medium">
            Tipos de cookies que utilizamos
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Tipo</strong></TableCell>
                  <TableCell><strong>Descripción</strong></TableCell>
                  <TableCell><strong>Propósito</strong></TableCell>
                  <TableCell><strong>Duración</strong></TableCell>
                  <TableCell><strong>¿Se puede desactivar?</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cookieTypes.map((cookie, index) => (
                  <TableRow key={index}>
                    <TableCell>{cookie.type}</TableCell>
                    <TableCell>{cookie.description}</TableCell>
                    <TableCell>{cookie.purpose}</TableCell>
                    <TableCell>{cookie.duration}</TableCell>
                    <TableCell>{cookie.canDisable ? 'Sí' : 'No'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom fontWeight="medium">
          Cookies específicas que utilizamos
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Cookies Necesarias
        </Typography>
        <List>
          <ListItem>
            <ListItemText 
              primary="auth-token"
              secondary="Mantiene tu sesión iniciada de forma segura"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="cookie-consent"
              secondary="Recuerda tus preferencias de cookies"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="csrf-token"
              secondary="Protege contra ataques de falsificación de solicitudes"
            />
          </ListItem>
        </List>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Cookies de Análisis (Google Analytics)
        </Typography>
        <List>
          <ListItem>
            <ListItemText 
              primary="_ga"
              secondary="Distingue usuarios únicos asignando un número generado aleatoriamente"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="_gid"
              secondary="Distingue usuarios únicos durante 24 horas"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="_gat"
              secondary="Limita la tasa de solicitudes"
            />
          </ListItem>
        </List>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Cookies de Marketing
        </Typography>
        <List>
          <ListItem>
            <ListItemText 
              primary="_fbp"
              secondary="Facebook Pixel - Rastrea visitas para publicidad en Facebook"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="ads/ga-audiences"
              secondary="Google Ads - Remarketing basado en comportamiento del visitante"
            />
          </ListItem>
        </List>
      </Paper>

      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom fontWeight="medium">
          ¿Cómo gestionar las cookies?
        </Typography>
        <Typography sx={{ mb: 2 }}>
          Puedes gestionar tus preferencias de cookies de las siguientes maneras:
        </Typography>
        <List>
          <ListItem>
            <ListItemText 
              primary="A través de nuestro banner de cookies"
              secondary="Al visitar nuestro sitio, puedes personalizar qué tipos de cookies aceptar"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Configuración del navegador"
              secondary="Puedes configurar tu navegador para bloquear o eliminar cookies"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Herramientas de opt-out"
              secondary="Google Analytics: tools.google.com/dlpage/gaoptout"
            />
          </ListItem>
        </List>
      </Paper>

      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom fontWeight="medium">
          Consecuencias de desactivar las cookies
        </Typography>
        <Typography sx={{ mb: 2 }}>
          Si decides desactivar ciertas cookies, ten en cuenta que:
        </Typography>
        <List>
          <ListItem>
            <ListItemText primary="Las cookies necesarias no se pueden desactivar sin afectar la funcionalidad básica del sitio" />
          </ListItem>
          <ListItem>
            <ListItemText primary="Sin cookies de preferencias, el sitio no recordará tus configuraciones personalizadas" />
          </ListItem>
          <ListItem>
            <ListItemText primary="Sin cookies de análisis, no podremos mejorar tu experiencia basándonos en datos de uso" />
          </ListItem>
          <ListItem>
            <ListItemText primary="Sin cookies de marketing, podrías ver anuncios menos relevantes" />
          </ListItem>
        </List>
      </Paper>

      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom fontWeight="medium">
          Actualizaciones de esta política
        </Typography>
        <Typography sx={{ mb: 2 }}>
          Podemos actualizar esta política de cookies ocasionalmente para reflejar cambios en 
          nuestras prácticas o por otras razones operativas, legales o regulatorias. Te 
          notificaremos sobre cambios significativos publicando la nueva política en esta página.
        </Typography>
      </Paper>

      <Paper sx={{ p: 4, bgcolor: 'grey.100' }}>
        <Typography variant="h5" gutterBottom fontWeight="medium">
          Contacto
        </Typography>
        <Typography sx={{ mb: 2 }}>
          Si tienes preguntas sobre nuestra política de cookies, puedes contactarnos:
        </Typography>
        <Typography>
          Email: privacidad@safetyapp.com<br />
          Teléfono: +1 (555) 123-4567<br />
          Dirección: 123 Safety Street, Ciudad, País
        </Typography>
      </Paper>
    </Container>
  );
};