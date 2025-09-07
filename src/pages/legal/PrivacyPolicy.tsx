import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  Divider,
  Alert
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Security as SecurityIcon } from '@mui/icons-material';
import { usePageTitle, getPageTitle } from '../../hooks/usePageTitle';

export const PrivacyPolicy: React.FC = () => {

  // Set page title
  usePageTitle(getPageTitle('Política de Privacidad'), 'Política de privacidad del Sistema de Gestión de Seguridad');

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
                Política de Privacidad
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

            {/* Alert de importancia */}
            <Alert 
              severity="info" 
              icon={<SecurityIcon />}
              sx={{ mb: 4 }}
            >
              Su privacidad es importante para nosotros. Esta política explica cómo recopilamos, utilizamos y protegemos su información personal.
            </Alert>

            {/* Contenido */}
            <Box sx={{ '& > *': { mb: 3 } }}>
              <Typography variant="body1" paragraph>
                Esta Política de Privacidad describe cómo recopilamos, utilizamos, procesamos y protegemos su información personal cuando utiliza nuestro Sistema de Gestión de Seguridad.
              </Typography>

              <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                1. Información que Recopilamos
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ mt: 3, fontSize: '1.1rem' }}>
                1.1 Información Personal
              </Typography>
              <Typography variant="body1" paragraph>
                Recopilamos la siguiente información personal:
              </Typography>
              <Box component="ul" sx={{ pl: 3 }}>
                <Typography component="li" variant="body1" paragraph>
                  Nombre completo y datos de identificación (cédula)
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Información de contacto (email, teléfono, dirección)
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Información laboral (empresa, posición, departamento)
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Certificaciones y entrenamientos de seguridad
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Registros de acceso y actividad en el sistema
                </Typography>
              </Box>

              <Typography variant="h6" gutterBottom sx={{ mt: 3, fontSize: '1.1rem' }}>
                1.2 Información de Emergencia
              </Typography>
              <Typography variant="body1" paragraph>
                Para fines de seguridad y emergencia, también recopilamos información de contactos de emergencia, incluyendo nombres, teléfonos y relación con el usuario.
              </Typography>

              <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                2. Cómo Utilizamos su Información
              </Typography>
              <Typography variant="body1" paragraph>
                Utilizamos su información personal para:
              </Typography>
              <Box component="ul" sx={{ pl: 3 }}>
                <Typography component="li" variant="body1" paragraph>
                  Gestionar su acceso y permisos en el sistema
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Procesar y aprobar permisos de trabajo
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Verificar certificaciones y entrenamientos
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Enviar notificaciones importantes sobre seguridad
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Generar reportes de cumplimiento y auditoría
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Contactar en caso de emergencias
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Mejorar nuestros servicios y funcionalidades
                </Typography>
              </Box>

              <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                3. Base Legal para el Procesamiento
              </Typography>
              <Typography variant="body1" paragraph>
                Procesamos su información personal basándonos en:
              </Typography>
              <Box component="ul" sx={{ pl: 3 }}>
                <Typography component="li" variant="body1" paragraph>
                  <strong>Cumplimiento legal:</strong> Para cumplir con regulaciones de seguridad ocupacional
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  <strong>Intereses legítimos:</strong> Para mantener un ambiente de trabajo seguro
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  <strong>Consentimiento:</strong> Cuando usted nos proporciona información voluntariamente
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  <strong>Ejecución contractual:</strong> Para cumplir con obligaciones laborales
                </Typography>
              </Box>

              <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                4. Compartir Información
              </Typography>
              <Typography variant="body1" paragraph>
                Podemos compartir su información con:
              </Typography>
              <Box component="ul" sx={{ pl: 3 }}>
                <Typography component="li" variant="body1" paragraph>
                  <strong>Supervisores y personal autorizado:</strong> Para aprobaciones y gestión de seguridad
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  <strong>Organismos reguladores:</strong> Cuando sea requerido por ley
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  <strong>Servicios de emergencia:</strong> En caso de incidentes de seguridad
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  <strong>Auditores externos:</strong> Para verificaciones de cumplimiento
                </Typography>
              </Box>
              <Typography variant="body1" paragraph>
                <strong>Nunca vendemos</strong> su información personal a terceros.
              </Typography>

              <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                5. Seguridad de los Datos
              </Typography>
              <Typography variant="body1" paragraph>
                Implementamos medidas de seguridad técnicas y organizacionales para proteger su información:
              </Typography>
              <Box component="ul" sx={{ pl: 3 }}>
                <Typography component="li" variant="body1" paragraph>
                  Cifrado de datos en tránsito y en reposo
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Controles de acceso estrictos basados en roles
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Monitoreo continuo de seguridad
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Copias de seguridad regulares y seguras
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Auditorías de seguridad periódicas
                </Typography>
              </Box>

              <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                6. Retención de Datos
              </Typography>
              <Typography variant="body1" paragraph>
                Conservamos su información personal durante el tiempo necesario para:
              </Typography>
              <Box component="ul" sx={{ pl: 3 }}>
                <Typography component="li" variant="body1" paragraph>
                  Cumplir con los propósitos para los cuales fue recopilada
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Satisfacer requisitos legales y regulatorios
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Mantener registros históricos de seguridad (mínimo 7 años)
                </Typography>
              </Box>

              <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                7. Sus Derechos
              </Typography>
              <Typography variant="body1" paragraph>
                Usted tiene derecho a:
              </Typography>
              <Box component="ul" sx={{ pl: 3 }}>
                <Typography component="li" variant="body1" paragraph>
                  <strong>Acceder</strong> a su información personal
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  <strong>Rectificar</strong> información inexacta o incompleta
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  <strong>Actualizar</strong> sus datos de contacto y emergencia
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  <strong>Solicitar</strong> explicaciones sobre el procesamiento de sus datos
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  <strong>Presentar quejas</strong> ante las autoridades competentes
                </Typography>
              </Box>

              <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                8. Cookies y Tecnologías de Seguimiento
              </Typography>
              <Typography variant="body1" paragraph>
                Utilizamos cookies y tecnologías similares para:
              </Typography>
              <Box component="ul" sx={{ pl: 3 }}>
                <Typography component="li" variant="body1" paragraph>
                  Mantener su sesión activa de manera segura
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Recordar sus preferencias del sistema
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Mejorar la funcionalidad y rendimiento
                </Typography>
                <Typography component="li" variant="body1" paragraph>
                  Generar analíticas de uso del sistema
                </Typography>
              </Box>

              <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                9. Transferencias Internacionales
              </Typography>
              <Typography variant="body1" paragraph>
                Sus datos se procesan y almacenan localmente. En caso de requerir transferencias internacionales, implementaremos las salvaguardas adecuadas según la legislación aplicable.
              </Typography>

              <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                10. Cambios a esta Política
              </Typography>
              <Typography variant="body1" paragraph>
                Podemos actualizar esta política periódicamente. Los cambios significativos serán notificados a través del sistema y requerirán su consentimiento renovado cuando sea legalmente necesario.
              </Typography>

              <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                11. Contacto
              </Typography>
              <Typography variant="body1" paragraph>
                Para preguntas sobre esta política de privacidad o para ejercer sus derechos, contacte:
              </Typography>
              <Box sx={{ pl: 2, py: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Oficial de Protección de Datos</strong><br />
                  Sistema de Gestión de Seguridad<br />
                  Email: privacy@safety-system.com<br />
                  A través del sistema de soporte integrado
                </Typography>
              </Box>

              <Divider sx={{ my: 4 }} />

              <Alert severity="success" sx={{ mt: 4 }}>
                <Typography variant="body2">
                  <strong>Compromiso de Privacidad:</strong> Nos comprometemos a proteger su privacidad y mantener la confidencialidad de su información personal de acuerdo con las mejores prácticas de la industria y el cumplimiento legal.
                </Typography>
              </Alert>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};