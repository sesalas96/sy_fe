import React, { useState, useEffect } from 'react';
import { Alert, Button, Box, Typography, Slide, CircularProgress } from '@mui/material';
import { ExitToApp as ExitIcon, Person as PersonIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

export const ImpersonationBanner: React.FC = () => {
  const { isImpersonating, originalAdmin, endImpersonation, user } = useAuth();
  const [isEnding, setIsEnding] = useState(false);

  // Auto-end impersonation on page unload/refresh - MUST be before any return
  useEffect(() => {
    if (!isImpersonating) return;

    const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
      if (isImpersonating && !isEnding) {
        // Try to end impersonation silently
        try {
          navigator.sendBeacon(
            `${process.env.REACT_APP_API_URL || 'http://localhost:3000/api'}/auth/end-impersonation`,
            JSON.stringify({ silent: true })
          );
        } catch (error) {
          console.warn('Could not end impersonation on page unload:', error);
        }
      }
    };

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden' && isImpersonating && !isEnding) {
        // Page is being hidden/closed, try to end impersonation
        try {
          await endImpersonation();
        } catch (error) {
          console.warn('Could not end impersonation on visibility change:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isImpersonating, isEnding, endImpersonation]);

  const handleEndImpersonation = async () => {
    if (isEnding) return;
    
    try {
      setIsEnding(true);
      await endImpersonation();
      // Redirect to system users after ending impersonation
      window.location.href = '/system-users';
    } catch (error) {
      console.error('Error terminando impersonación:', error);
      setIsEnding(false);
      // You could show a snackbar error here
    }
  };

  if (!isImpersonating) return null;

  return (
    <Slide direction="down" in={isImpersonating} timeout={500}>
      <Alert 
        severity="warning" 
        sx={{ 
          position: 'sticky',
          top: 0,
          zIndex: 1300, // Higher than AppBar
          borderRadius: 0,
          '& .MuiAlert-message': { width: '100%' },
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
          }
        }}
      >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        width: '100%',
        flexWrap: 'wrap',
        gap: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
          <PersonIcon />
          <Typography 
            variant="body2" 
            fontWeight="medium"
            sx={{ 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            Impersonando a: <strong>{user?.firstName} {user?.lastName}</strong>
          </Typography>
          {originalAdmin && (
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                display: { xs: 'none', sm: 'block' },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              (Admin: {originalAdmin.email})
            </Typography>
          )}
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={isEnding ? <CircularProgress size={16} color="inherit" /> : <ExitIcon />}
          onClick={handleEndImpersonation}
          disabled={isEnding}
          sx={{ 
            ml: { xs: 0, sm: 2 },
            minWidth: 'fit-content',
            backgroundColor: 'white',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
            },
            '&:disabled': {
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              borderColor: 'rgba(0, 0, 0, 0.12)'
            }
          }}
        >
          {isEnding ? 'Terminando...' : 'Terminar Impersonación'}
        </Button>
      </Box>
    </Alert>
    </Slide>
  );
};