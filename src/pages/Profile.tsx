import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  Button,
  Divider,
  Tabs,
  Tab,
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Save as SaveIcon,
  Person as PersonIcon,
  VerifiedUser as VerifiedUserIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { usePageTitle } from '../hooks/usePageTitle';
import { useLocation } from 'react-router-dom';

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
import { UserVerifications } from '../components/verifications';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  usePageTitle('Mi Perfil', 'Configuración personal y verificaciones');
  
  const [success, setSuccess] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  
  // Check if we should navigate to verifications tab
  useEffect(() => {
    const state = location.state as { tab?: string };
    if (state?.tab === 'verifications') {
      setTabValue(1); // Switch to verifications tab
    }
  }, [location]);

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

  // Check if user should see verifications tab
  const canSeeVerifications = user && [
    UserRole.CLIENT_SUPERVISOR,
    UserRole.CLIENT_APPROVER,
    UserRole.CLIENT_STAFF,
    UserRole.CONTRATISTA_ADMIN,
    UserRole.CONTRATISTA_SUBALTERNOS,
    UserRole.CONTRATISTA_HUERFANO,
    UserRole.VALIDADORES_OPS
  ].includes(user.role);

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

      {/* Tabs */}
      <Paper sx={{ bgcolor: 'background.paper', mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          allowScrollButtonsMobile
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }
          }}
        >
          <Tab 
            icon={<PersonIcon />} 
            iconPosition="start" 
            label="Información Personal" 
          />
          {canSeeVerifications && (
            <Tab 
              icon={<VerifiedUserIcon />} 
              iconPosition="start" 
              label="Verificarme" 
            />
          )}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box role="tabpanel" hidden={tabValue !== 0}>
        {tabValue === 0 && (
          <>
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
          </>
        )}
      </Box>

      <Box role="tabpanel" hidden={tabValue !== 1}>
        {tabValue === 1 && canSeeVerifications && (
          <UserVerifications />
        )}
      </Box>
    </Box>
  );
};