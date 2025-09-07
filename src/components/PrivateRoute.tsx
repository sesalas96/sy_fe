import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Typography, LinearProgress, styled, keyframes } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const AnimatedPaper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(4),
  position: 'relative',
  animation: `${fadeIn} 0.6s ease-out`,
}))

const LogoWrapper = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  animation: `${fadeIn} 0.8s ease-out`,
}))

const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
  width: '100%',
  height: 4,
  borderRadius: 2,
  backgroundColor: 'rgba(30, 41, 59, 0.1)',
  '& .MuiLinearProgress-bar': {
    borderRadius: 2,
    background: 'linear-gradient(90deg, #1e293b 0%, #334155 25%, #1e293b 50%, #334155 75%, #1e293b 100%)',
    backgroundSize: '400% 100%',
    animation: `${shimmer} 2s ease-in-out infinite`,
  },
}))

interface PrivateRouteProps {
  children: React.ReactElement;
  roles?: UserRole[];
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, roles }) => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const [showLoader, setShowLoader] = useState(true);

  // Add a minimum display time for the loader
  useEffect(() => {
    if (!isLoading) {
      // Keep the loader visible for at least 2 seconds
      const timer = setTimeout(() => {
        setShowLoader(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Show loading spinner while checking authentication
  if (isLoading || showLoader) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e2e8f0' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            opacity: 0.5,
          }
        }}
      >
        <AnimatedPaper>
          <LogoWrapper>
            <img 
              src="/safety-logo.png" 
              alt="Safety Logo" 
              style={{ 
                height: 60,
                width: 'auto',
                opacity: 0.9
              }}
            />
          </LogoWrapper>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#64748b',
                fontSize: '0.875rem',
                letterSpacing: '0.5px'
              }}
            >
              Verificando acceso
            </Typography>
          </Box>
          
          <Box sx={{ width: 200 }}>
            <StyledLinearProgress />
          </Box>
        </AnimatedPaper>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role permissions if specified
  if (roles && !roles.some(role => hasRole(role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};