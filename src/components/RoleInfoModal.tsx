import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Close as CloseIcon,
  Shield as ShieldIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
  Assignment as TaskIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

interface RoleInfoModalProps {
  open: boolean;
  onClose: () => void;
  role: string | undefined;
  roleName: string;
}

interface RoleInfo {
  title: string;
  description: string;
  responsibilities: string[];
  permissions: string[];
  icon: React.ReactNode;
  color: string;
}

const roleInfoMap: Record<string, RoleInfo> = {
  'super_admin': {
    title: 'Administrador del Sistema',
    description: 'Control total sobre la plataforma con acceso a todas las funcionalidades y configuraciones del sistema.',
    responsibilities: [
      'Gestionar todos los espacios de trabajo y empresas',
      'Configurar ajustes globales del sistema',
      'Administrar usuarios y asignar roles',
      'Supervisar todas las operaciones de seguridad',
      'Generar reportes ejecutivos y análisis',
    ],
    permissions: [
      'Acceso completo a todos los módulos',
      'Crear y eliminar espacios de trabajo',
      'Modificar configuraciones del sistema',
      'Ver toda la información de la plataforma',
      'Gestionar facturación y suscripciones',
    ],
    icon: <ShieldIcon />,
    color: '#9C27B0',
  },
  'safety_staff': {
    title: 'Personal de Safety',
    description: 'Responsable de la gestión operativa de seguridad, supervisión de permisos de trabajo y cumplimiento normativo.',
    responsibilities: [
      'Revisar y aprobar permisos de trabajo',
      'Realizar inspecciones de seguridad',
      'Gestionar incidentes y emergencias',
      'Capacitar al personal en temas de seguridad',
      'Mantener documentación de seguridad actualizada',
    ],
    permissions: [
      'Crear y gestionar permisos de trabajo',
      'Acceder a reportes de seguridad',
      'Gestionar inspecciones y auditorías',
      'Ver información de contratistas',
      'Administrar procedimientos de seguridad',
    ],
    icon: <SecurityIcon />,
    color: '#4CAF50',
  },
  'client_supervisor': {
    title: 'Supervisor de Cliente',
    description: 'Supervisa las operaciones diarias y coordina actividades entre el cliente y los contratistas.',
    responsibilities: [
      'Supervisar trabajos en campo',
      'Coordinar con contratistas',
      'Revisar permisos de trabajo',
      'Reportar incidentes y observaciones',
      'Asegurar cumplimiento de procedimientos',
    ],
    permissions: [
      'Crear permisos de trabajo',
      'Ver reportes de su área',
      'Gestionar personal a su cargo',
      'Aprobar trabajos de bajo riesgo',
      'Acceder a documentación de seguridad',
    ],
    icon: <PeopleIcon />,
    color: '#2196F3',
  },
  'client_approver': {
    title: 'Verificador',
    description: 'Autoridad para aprobar permisos de trabajo y validar cumplimiento de estándares HSE.',
    responsibilities: [
      'Aprobar permisos de trabajo críticos',
      'Validar análisis de riesgos',
      'Revisar documentación HSE',
      'Autorizar trabajos de alto riesgo',
      'Auditar cumplimiento normativo',
    ],
    permissions: [
      'Aprobar todos los permisos de trabajo',
      'Modificar análisis de riesgos',
      'Acceder a todos los reportes HSE',
      'Detener trabajos por seguridad',
      'Validar certificaciones de contratistas',
    ],
    icon: <TaskIcon />,
    color: '#FF9800',
  },
  'client_staff': {
    title: 'Personal Interno',
    description: 'Empleado del cliente con acceso a información básica y capacidad de reportar observaciones.',
    responsibilities: [
      'Reportar condiciones inseguras',
      'Consultar permisos de trabajo activos',
      'Completar capacitaciones asignadas',
      'Seguir procedimientos de seguridad',
      'Participar en simulacros',
    ],
    permissions: [
      'Ver permisos de trabajo de su área',
      'Reportar observaciones de seguridad',
      'Acceder a procedimientos básicos',
      'Consultar calendario de actividades',
      'Ver sus capacitaciones',
    ],
    icon: <PeopleIcon />,
    color: '#607D8B',
  },
  'validadores_ops': {
    title: 'Verificador de Operaciones',
    description: 'Valida y verifica el cumplimiento de requisitos operacionales y documentación.',
    responsibilities: [
      'Verificar documentación de contratistas',
      'Validar certificaciones y competencias',
      'Inspeccionar equipos y herramientas',
      'Confirmar cumplimiento de requisitos',
      'Generar reportes de verificación',
    ],
    permissions: [
      'Acceder a documentación de contratistas',
      'Validar certificaciones',
      'Crear reportes de verificación',
      'Bloquear accesos por incumplimiento',
      'Gestionar check-lists de verificación',
    ],
    icon: <CheckIcon />,
    color: '#00BCD4',
  },
  'contratista_admin': {
    title: 'Administrador de Contratista',
    description: 'Gestiona las operaciones de la empresa contratista y su personal en la plataforma.',
    responsibilities: [
      'Administrar personal de su empresa',
      'Gestionar documentación corporativa',
      'Responder a licitaciones',
      'Coordinar trabajos asignados',
      'Mantener certificaciones vigentes',
    ],
    permissions: [
      'Gestionar usuarios de su empresa',
      'Subir documentación corporativa',
      'Participar en licitaciones',
      'Ver órdenes de trabajo asignadas',
      'Administrar recursos de su empresa',
    ],
    icon: <SettingsIcon />,
    color: '#795548',
  },
  'contratista_subalternos': {
    title: 'Personal de Contratista',
    description: 'Trabajador de empresa contratista que ejecuta trabajos bajo supervisión.',
    responsibilities: [
      'Ejecutar trabajos asignados',
      'Seguir procedimientos de seguridad',
      'Reportar avances de trabajo',
      'Mantener sus certificaciones',
      'Usar EPP correctamente',
    ],
    permissions: [
      'Ver trabajos asignados',
      'Reportar avances',
      'Acceder a procedimientos',
      'Ver sus certificaciones',
      'Consultar órdenes de trabajo',
    ],
    icon: <PeopleIcon />,
    color: '#9E9E9E',
  },
  'contratista_huerfano': {
    title: 'Contratista Independiente',
    description: 'Profesional independiente que ofrece servicios especializados sin pertenecer a una empresa.',
    responsibilities: [
      'Gestionar su perfil profesional',
      'Mantener certificaciones vigentes',
      'Responder a oportunidades de trabajo',
      'Ejecutar trabajos de forma autónoma',
      'Cumplir con requisitos HSE',
    ],
    permissions: [
      'Actualizar perfil profesional',
      'Ver oportunidades de trabajo',
      'Enviar propuestas',
      'Gestionar su documentación',
      'Acceder a trabajos asignados',
    ],
    icon: <PeopleIcon />,
    color: '#3F51B5',
  },
};

const RoleInfoModal: React.FC<RoleInfoModalProps> = ({ open, onClose, role, roleName }) => {
  const theme = useTheme();
  const roleInfo = role ? roleInfoMap[role.toLowerCase()] : null;

  if (!roleInfo) {
    return null;
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${roleInfo.color} 0%, ${alpha(roleInfo.color, 0.8)} 100%)`,
          color: 'white',
          p: 3,
          position: 'relative',
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'white',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            }
          }}
        >
          <CloseIcon />
        </IconButton>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ fontSize: 32 }}>
              {roleInfo.icon}
            </Box>
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
              {roleInfo.title}
            </Typography>
            <Chip 
              label={roleName} 
              size="small" 
              sx={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontWeight: 500,
              }}
            />
          </Box>
        </Box>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {/* Description */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <InfoIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Descripción del Rol
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {roleInfo.description}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Responsibilities */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
            Responsabilidades Principales
          </Typography>
          <List dense sx={{ p: 0 }}>
            {roleInfo.responsibilities.map((resp, index) => (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CheckIcon sx={{ color: roleInfo.color, fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Typography variant="body2">
                      {resp}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Permissions */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
            Permisos en la Plataforma
          </Typography>
          <List dense sx={{ p: 0 }}>
            {roleInfo.permissions.map((perm, index) => (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <ShieldIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Typography variant="body2">
                      {perm}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, pt: 0 }}>
        <Button 
          onClick={onClose} 
          variant="contained"
          sx={{ 
            textTransform: 'none',
            px: 3,
            backgroundColor: roleInfo.color,
            '&:hover': {
              backgroundColor: alpha(roleInfo.color, 0.8),
            }
          }}
        >
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoleInfoModal;