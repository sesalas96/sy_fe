import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert
} from '@mui/material';
import {
  Warning as WarningIcon,
  Business as BusinessIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { shouldShowDailyPopup, markDailyPopupShown } from '../../utils/verificationUtils';

export const PendingVerificationsPopup: React.FC = () => {
  const navigate = useNavigate();
  const { user, pendingVerifications } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Only show popup if:
    // 1. User is logged in
    // 2. Has pending verifications
    // 3. Hasn't been shown today
    if (user && pendingVerifications && pendingVerifications.total > 0 && shouldShowDailyPopup()) {
      setOpen(true);
    }
  }, [user, pendingVerifications]);

  const handleClose = () => {
    setOpen(false);
    markDailyPopupShown();
  };

  const handleGoToVerifications = () => {
    handleClose();
    navigate('/profile', { state: { tab: 'verifications' } });
  };

  if (!pendingVerifications || pendingVerifications.total === 0) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningIcon color="warning" />
          <Typography variant="h6">
            Pendientes de Verificación
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Tienes <strong>{pendingVerifications.total}</strong> documento{pendingVerifications.total !== 1 ? 's' : ''} 
          {' '}pendiente{pendingVerifications.total !== 1 ? 's' : ''} de verificación. Es importante que los completes 
          para mantener tu cumplimiento al día.
        </Alert>

        <Typography variant="body2" gutterBottom sx={{ mb: 2 }}>
          Pendientes por empresa:
        </Typography>

        <List sx={{ bgcolor: 'background.paper' }}>
          {pendingVerifications.byCompany.map((company, index) => (
            <React.Fragment key={company.companyId}>
              {index > 0 && <Divider />}
              <ListItem>
                <BusinessIcon sx={{ mr: 2, color: 'text.secondary' }} />
                <ListItemText
                  primary={company.companyName}
                  secondary={`${company.count} documento${company.count !== 1 ? 's' : ''} pendiente${company.count !== 1 ? 's' : ''}`}
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleClose}
          color="inherit"
        >
          Revisar más tarde
        </Button>
        <Button
          onClick={handleGoToVerifications}
          variant="contained"
          color="primary"
          endIcon={<ArrowForwardIcon />}
        >
          Ver Verificaciones
        </Button>
      </DialogActions>
    </Dialog>
  );
};