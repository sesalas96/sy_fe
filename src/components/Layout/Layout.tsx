import React, { useState } from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, useTheme, useMediaQuery, Avatar, Button } from '@mui/material';
import { Menu as MenuIcon, Logout as LogoutIcon, Build as BuildIcon } from '@mui/icons-material';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ImpersonationBanner } from '../ImpersonationBanner';
import { useAuth } from '../../contexts/AuthContext';
import HelpCenter from '../HelpCenter/HelpCenter';
import RoleInfoModal from '../RoleInfoModal';
import { PendingVerificationsPopup } from '../verifications/PendingVerificationsPopup';

const drawerWidth = 220;

export const Layout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hasOpenedOnLogin, setHasOpenedOnLogin] = useState(false);
  const [helpCenterOpen, setHelpCenterOpen] = useState(false);
  const [roleInfoOpen, setRoleInfoOpen] = useState(false);
  const { user, userAvatarUrl, logout } = useAuth();
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleLabel = (role: string | undefined, fullName: boolean = false) => {
    if (!role) return 'Usuario';
    
    const roleLabels: Record<string, { short: string; full: string }> = {
      'super_admin': { short: 'Admin', full: 'Administrador' },
      'safety_staff': { short: 'Seguridad', full: 'Personal de Safety' },
      'client_supervisor': { short: 'Supervisor', full: 'Supervisor' },
      'client_approver': { short: 'Verificador', full: 'Verificador' },
      'client_staff': { short: 'Interno', full: 'Cliente Interno' },
      'validadores_ops': { short: 'Verificador', full: 'Verificadores' },
      'contratista_admin': { short: 'Contratista', full: 'Contratista Admin' },
      'contratista_subalternos': { short: 'Contratista', full: 'Contratista Subalterno' },
      'contratista_huerfano': { short: 'Independiente', full: 'Contratista Independiente' }
    };
    
    const label = roleLabels[role.toLowerCase()];
    if (!label) return role;
    
    return fullName ? label.full : label.short;
  };

  const getRoleColor = (role: string | undefined) => {
    if (!role) return '#9E9E9E';
    
    const roleColors: Record<string, string> = {
      'super_admin': '#9C27B0',
      'safety_staff': '#4CAF50',
      'client_supervisor': '#2196F3',
      'client_approver': '#FF9800',
      'client_staff': '#607D8B',
      'validadores_ops': '#00BCD4',
      'contratista_admin': '#795548',
      'contratista_subalternos': '#9E9E9E',
      'contratista_huerfano': '#3F51B5'
    };
    
    return roleColors[role.toLowerCase()] || '#9E9E9E';
  };

  // Open sidebar on mobile after login
  React.useEffect(() => {
    if (isMobile && user && !hasOpenedOnLogin) {
      setMobileOpen(true);
      setHasOpenedOnLogin(true);
    }
  }, [isMobile, user, hasOpenedOnLogin]);

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          background: {
            xs: 'rgba(103, 149, 102, 0.10)', // Más opacidad en móvil para el efecto vidrio
            md: 'rgba(103, 149, 102, 0.10)'  // Mantiene la transparencia en desktop
          },
          backdropFilter: {
            xs: 'blur(20px) saturate(180%)', // Blur fuerte en móvil
            md: 'blur(20px) saturate(180%)'                      // Sin blur en desktop
          },
          WebkitBackdropFilter: {
            xs: 'blur(20px) saturate(180%)', // Para Safari
            md: 'blur(20px) saturate(180%)'
          },
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Toolbar sx={{
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: { xs: 56, sm: 64 },
          px: { xs: 1, sm: 2 },
          py: { xs: 0.5, sm: 1 },
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)'
          }
        }}>
          {isMobile && (
            <>
              <IconButton
                aria-label="open drawer"
                onClick={handleDrawerToggle}
                sx={{ 
                  mr: 1,
                  ml: 0.5,
                  p: 0.75,
                  color: 'white',
                  backgroundColor: '#679566',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 6px rgba(103, 149, 102, 0.3)',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    backgroundColor: '#5a8459',
                    boxShadow: '0 4px 12px rgba(103, 149, 102, 0.4)',
                  },
                  '&:active': {
                    transform: 'scale(0.95)'
                  }
                }}
              >
                <MenuIcon sx={{
                  fontSize: 20,
                  transition: 'transform 0.3s ease',
                  transform: mobileOpen ? 'rotate(90deg)' : 'rotate(0deg)'
                }} />
              </IconButton>
              
              {/* Mobile Role Display */}
              <Box 
                onClick={() => setRoleInfoOpen(true)}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  px: 1.25,
                  py: 0.4,
                  borderRadius: '14px',
                  background: getRoleColor(user?.role),
                  height: 32,
                  minWidth: 60,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
                  '&:active': {
                    transform: 'scale(0.95)',
                  }
                }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    letterSpacing: '0.3px',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {getRoleLabel(user?.role, false)}
                </Typography>
              </Box>
              
              {/* Mobile Operar Button */}
              <IconButton
                onClick={() => setHelpCenterOpen(true)}
                sx={{
                  ml: 1,
                  color: 'white',
                  backgroundColor: '#3c62d3',
                  boxShadow: '0 2px 6px rgba(60, 98, 211, 0.3)',
                  p: 0.75,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: '#2e50b5',
                    transform: 'scale(1.1)'
                  },
                  '&:active': {
                    transform: 'scale(0.95)'
                  }
                }}
                title="Operar"
              >
                <BuildIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </>
          )}
          
          {!isMobile && (
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 1.5
            }}>
              <Box 
                onClick={() => setRoleInfoOpen(true)}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  px: 2,
                  py: 0.75,
                  borderRadius: '20px',
                  background: getRoleColor(user?.role),
                  height: 40,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                    filter: 'brightness(1.1)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  }
                }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'white',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}
                >
                  {getRoleLabel(user?.role, true)}
                </Typography>
              </Box>
              
              <Button
                variant="contained"
                startIcon={<BuildIcon />}
                onClick={() => setHelpCenterOpen(true)}
                sx={{
                  backgroundColor: '#3c62d3',
                  color: 'white',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 2,
                  borderRadius: '20px',
                  boxShadow: '0 2px 8px rgba(60, 98, 211, 0.3)',
                  transition: 'all 0.3s ease',
                  height: 40,
                  minWidth: 'auto',
                  '&:hover': {
                    backgroundColor: '#2e50b5',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 16px rgba(60, 98, 211, 0.4)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  }
                }}
              >
                Operar
              </Button>
              
              <Box sx={{ flexGrow: 1 }} />
            </Box>
          )}
          
          {isMobile && (
            <>
              <Box sx={{ flexGrow: 1 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <IconButton
                  onClick={handleProfileClick}
                  sx={{
                    p: 0,
                    color: 'white',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.1)'
                    },
                    '&:active': {
                      transform: 'scale(0.95)'
                    }
                  }}
                  title="Mi perfil"
                >
                  <Avatar
                    src={userAvatarUrl || undefined}
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: '#546e7a',
                      border: '2px solid rgba(255, 255, 255, 0.5)',
                      fontSize: '0.8rem',
                    }}
                  >
                    {getInitials(`${user?.firstName} ${user?.lastName}`)}
                  </Avatar>
                </IconButton>
                
                <IconButton
                  onClick={handleLogout}
                  sx={{
                    color: 'white',
                    p: 0.75,
                    backgroundColor: '#ef5350',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 6px rgba(239, 83, 80, 0.3)',
                    '&:hover': {
                      backgroundColor: '#d32f2f',
                      transform: 'rotate(-10deg) scale(1.1)',
                      boxShadow: '0 4px 12px rgba(239, 83, 80, 0.4)',
                    },
                    '&:active': {
                      transform: 'rotate(-10deg) scale(0.95)'
                    }
                  }}
                  title="Cerrar sesión"
                >
                  <LogoutIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Box>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Sidebar 
        mobileOpen={mobileOpen} 
        onMobileClose={() => setMobileOpen(false)}
        isMobile={isMobile}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8
        }}
      >
        <ImpersonationBanner />
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>
      
      {/* Help Center Drawer */}
      <Box sx={{ zIndex: theme.zIndex.drawer - 1 }}>
        <HelpCenter 
          open={helpCenterOpen} 
          onClose={() => setHelpCenterOpen(false)} 
        />
      </Box>
      
      {/* Role Info Modal */}
      <RoleInfoModal
        open={roleInfoOpen}
        onClose={() => setRoleInfoOpen(false)}
        role={user?.role}
        roleName={getRoleLabel(user?.role, true)}
      />
      
      {/* Pending Verifications Popup */}
      <PendingVerificationsPopup />
    </Box>
  );
};