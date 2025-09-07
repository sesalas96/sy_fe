import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Container
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

// Import settings components (will be created)
import { UserProfileSettings } from '../components/Settings/UserProfileSettings';
import { CompanySettings } from '../components/Settings/CompanySettings';
import { SecuritySettings } from '../components/Settings/SecuritySettings';
import { NotificationSettings } from '../components/Settings/NotificationSettings';
import { ThemeSettings } from '../components/Settings/ThemeSettings';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Define available tabs based on user role
  const getAvailableTabs = () => {
    const tabs = [
      {
        label: 'Perfil',
        icon: <PersonIcon />,
        component: <UserProfileSettings />,
        roles: [UserRole.CONTRATISTA_ADMIN, UserRole.CONTRATISTA_SUBALTERNOS, UserRole.CLIENT_SUPERVISOR, UserRole.CLIENT_STAFF, UserRole.CLIENT_APPROVER, UserRole.VALIDADORES_OPS, UserRole.SAFETY_STAFF, UserRole.SUPER_ADMIN]
      },
      {
        label: 'Tema',
        icon: <PaletteIcon />,
        component: <ThemeSettings />,
        roles: [UserRole.CONTRATISTA_ADMIN, UserRole.CONTRATISTA_SUBALTERNOS, UserRole.CLIENT_SUPERVISOR, UserRole.CLIENT_STAFF, UserRole.CLIENT_APPROVER, UserRole.VALIDADORES_OPS, UserRole.SAFETY_STAFF, UserRole.SUPER_ADMIN]
      },
      {
        label: 'Notificaciones',
        icon: <NotificationsIcon />,
        component: <NotificationSettings />,
        roles: [UserRole.CONTRATISTA_ADMIN, UserRole.CONTRATISTA_SUBALTERNOS, UserRole.CLIENT_SUPERVISOR, UserRole.CLIENT_STAFF, UserRole.CLIENT_APPROVER, UserRole.VALIDADORES_OPS, UserRole.SAFETY_STAFF, UserRole.SUPER_ADMIN]
      },
      {
        label: 'Espacios de Trabajo',
        icon: <BusinessIcon />,
        component: <CompanySettings />,
        roles: [UserRole.CLIENT_SUPERVISOR, UserRole.SAFETY_STAFF, UserRole.SUPER_ADMIN]
      },
      {
        label: 'Seguridad',
        icon: <SecurityIcon />,
        component: <SecuritySettings />,
        roles: [UserRole.SAFETY_STAFF, UserRole.SUPER_ADMIN]
      }
    ];

    return tabs.filter(tab => tab.roles.includes(user?.role!));
  };

  const availableTabs = getAvailableTabs();

  return (
    <Container maxWidth="lg">
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <SettingsIcon sx={{ mr: 1, fontSize: 32 }} />
          <Typography variant="h4">
            Configuración
          </Typography>
        </Box>

        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="settings tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              {availableTabs.map((tab, index) => (
                <Tab
                  key={index}
                  icon={tab.icon}
                  label={tab.label}
                  iconPosition="start"
                  {...a11yProps(index)}
                  sx={{ minHeight: 72 }}
                />
              ))}
            </Tabs>
          </Box>

          {availableTabs.map((tab, index) => (
            <TabPanel key={index} value={tabValue} index={index}>
              {tab.component}
            </TabPanel>
          ))}
        </Paper>

        {/* User Information Footer */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="textSecondary">
            Configuración para: <strong>{user?.name}</strong> ({user?.email})
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Rol: {user?.role} | Última sesión: {new Date().toLocaleString('es-CR')}
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};