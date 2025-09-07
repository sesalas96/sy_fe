import React, { useState } from 'react';
import {
  Box,
  Typography,
  Alert,
  Button,
  Divider
} from '@mui/material';
import {
  Save as SaveIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

// Import role-specific profiles
import {
  SuperAdminProfile,
  SafetyStaffProfile,
  ClientSupervisorProfile,
  ClientApproverProfile,
  ClientStaffProfile,
  ValidadoresOpsProfile,
  ContratistaProfile
} from '../components/Profile';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    // Simulate save operation
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const renderRoleSpecificProfile = () => {
    if (!user) return null;

    switch (user.role) {
      case UserRole.SUPER_ADMIN:
        return <SuperAdminProfile />;
      case UserRole.SAFETY_STAFF:
        return <SafetyStaffProfile />;
      case UserRole.CLIENT_SUPERVISOR:
        return <ClientSupervisorProfile />;
      case UserRole.CLIENT_APPROVER:
        return <ClientApproverProfile />;
      case UserRole.CLIENT_STAFF:
        return <ClientStaffProfile />;
      case UserRole.VALIDADORES_OPS:
        return <ValidadoresOpsProfile />;
      case UserRole.CONTRATISTA_ADMIN:
      case UserRole.CONTRATISTA_SUBALTERNOS:
      case UserRole.CONTRATISTA_HUERFANO:
        return <ContratistaProfile />;
      default:
        return (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="error">
              Perfil no disponible para este rol: {user.role}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              Por favor contacta al administrador del sistema.
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box>
        <Typography variant="h4" gutterBottom>
          Mi Perfil
        </Typography>
      </Box>

      {/* Success Alert */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Configuración guardada correctamente
        </Alert>
      )}

      {/* Profile Content */}
      {renderRoleSpecificProfile()}

      {/* Save Button */}
      <Divider sx={{ my: 3 }} />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          size="large"
        >
          Guardar Cambios del Perfil
        </Button>
      </Box>
    </Box>
  );
};