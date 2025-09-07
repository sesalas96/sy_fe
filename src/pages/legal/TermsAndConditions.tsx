import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  Divider
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { usePageTitle, getPageTitle } from '../../hooks/usePageTitle';

export const TermsAndConditions: React.FC = () => {

  // Set page title
  usePageTitle(getPageTitle('Términos y Condiciones'), 'Términos y condiciones del Sistema de Gestión de Seguridad');

  return (
      <Container component="main" maxWidth="md">
      <Box sx={{ 
        minHeight: '100vh', 
        py: { xs: 2, md: 4 }
      }}>
        <Card sx={{ 
          width: '100%',
          boxShadow: { xs: 0, md: 1 },
          border: { xs: 'none', md: '1px solid' },
          borderColor: { xs: 'transparent', md: 'divider' }
        }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <IconButton
                onClick={() => window.close()}
                size="small"
                sx={{ mr: 2 }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Typography 
                variant="h4"
                sx={{ 
                  fontSize: { xs: '1.5rem', md: '2.125rem' }
                }}
              >
                Términos y Condiciones
              </Typography>
            </Box>

            {/* Fecha de actualización */}
            <Box sx={{ mb: 4, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-ES', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Typography>
            </Box>

            {/* Contenido */}
            <Box sx={{ '& > *': { mb: 3 } }}>
              <Typography variant="body1" paragraph>
                Bienvenido al Sistema de Gestión de Seguridad. Al utilizar nuestros servicios, usted acepta cumplir con estos términos y condiciones. Por favor, léalos cuidadosamente.
              </Typography>

              <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                1. Aceptación de los Términos
              </Typography>
              <Typography variant="body1" paragraph>
                Al acceder y utilizar este sistema, usted acepta estar sujeto a estos términos y condiciones de uso y todas las leyes y regulaciones aplicables. Si no está de acuerdo con alguno de estos términos, no debe utilizar este sistema.
              </Typography>

              <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                2. Uso del Sistema
              </Typography>
              <Typography variant="body1" paragraph>
                Este sistema está diseñado para la gestión de seguridad, permisos de trabajo y certificaciones. Los usuarios deben:
              </Typography>
              <Box component="ul" sx={{ pl: 3 }}>
                <Typography component="li" variant="body1" paragraph>
                  Proporcionar información precisa y actualizada
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Mantener la confidencialidad de sus credenciales de acceso
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Utilizar el sistema únicamente para fines autorizados
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Cumplir con todas las políticas de seguridad establecidas
                </Typography>
              </Box>

              <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                3. Responsabilidades del Usuario
              </Typography>
              <Typography variant="body1" paragraph>
                Los usuarios son responsables de:
              </Typography>
              <Box component="ul" sx={{ pl: 3 }}>
                <Typography component="li" variant="body1" paragraph>
                  Mantener actualizados sus datos personales y de contacto
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Completar todas las certificaciones y entrenamientos requeridos
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Reportar inmediatamente cualquier incidente de seguridad
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Seguir todos los procedimientos de seguridad establecidos
                </Typography>
              </Box>

              <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                4. Permisos de Trabajo
              </Typography>
              <Typography variant="body1" paragraph>
                Los permisos de trabajo son documentos críticos de seguridad. Los usuarios deben:
              </Typography>
              <Box component="ul" sx={{ pl: 3 }}>
                <Typography component="li" variant="body1" paragraph>
                  Obtener los permisos necesarios antes de iniciar cualquier trabajo
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Seguir estrictamente las condiciones especificadas en cada permiso
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Reportar cualquier cambio en las condiciones de trabajo
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Cerrar adecuadamente los permisos al completar el trabajo
                </Typography>
              </Box>

              <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                5. Certificaciones y Entrenamientos
              </Typography>
              <Typography variant="body1" paragraph>
                Todos los usuarios deben mantener las certificaciones requeridas para su rol y actividades. Las certificaciones vencidas pueden resultar en la suspensión del acceso al sistema hasta que se renueven.
              </Typography>

              <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                6. Confidencialidad
              </Typography>
              <Typography variant="body1" paragraph>
                Toda la información contenida en este sistema es confidencial. Los usuarios no deben divulgar, compartir o utilizar esta información fuera del contexto autorizado de sus funciones laborales.
              </Typography>

              <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                7. Limitación de Responsabilidad
              </Typography>
              <Typography variant="body1" paragraph>
                El sistema se proporciona "tal como está". No garantizamos que esté libre de errores o interrupciones. Los usuarios utilizan el sistema bajo su propio riesgo y responsabilidad.
              </Typography>

              <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                8. Modificaciones
              </Typography>
              <Typography variant="body1" paragraph>
                Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios serán efectivos inmediatamente después de su publicación en el sistema. Es responsabilidad del usuario revisar periódicamente estos términos.
              </Typography>

              <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                9. Terminación
              </Typography>
              <Typography variant="body1" paragraph>
                Podemos terminar o suspender el acceso al sistema inmediatamente, sin previo aviso, por cualquier motivo, incluyendo el incumplimiento de estos términos.
              </Typography>

              <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                10. Contacto
              </Typography>
              <Typography variant="body1" paragraph>
                Si tiene preguntas sobre estos términos y condiciones, puede contactarnos a través del sistema de soporte integrado o mediante los canales de comunicación oficiales de la empresa.
              </Typography>

              <Divider sx={{ my: 4 }} />

              <Box sx={{ textAlign: 'center', p: 3, backgroundColor: 'primary.50', borderRadius: 2 }}>
                <Typography variant="body2" color="primary.main" fontWeight="medium">
                  Al utilizar este sistema, usted confirma que ha leído, entendido y acepta estar sujeto a estos términos y condiciones.
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};