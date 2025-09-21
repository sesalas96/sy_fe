import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Badge,
  useTheme,
  useMediaQuery,
  Stack,
  Divider,
  Grid
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Upload as UploadIcon,
  Visibility as ViewIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  AccessTime as AccessTimeIcon,
  DoNotDisturb as DoNotDisturbIcon
} from '@mui/icons-material';
import { userVerificationsApi, UserCompanyVerifications, VerificationDetail } from '../../services/userVerificationsApi';
import { VerificationSubmitDialog } from './VerificationSubmitDialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface UserVerificationsProps {
  userId?: string; // Optional, if not provided will use current user
}

export const UserVerifications: React.FC<UserVerificationsProps> = ({ userId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyVerifications, setCompanyVerifications] = useState<UserCompanyVerifications[]>([]);
  const [expandedCompany, setExpandedCompany] = useState<string | false>(false);
  const [selectedVerification, setSelectedVerification] = useState<{
    verification: VerificationDetail;
    companyId: string;
    companyName: string;
  } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadVerifications();
  }, [userId]);

  const loadVerifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = userId 
        ? await userVerificationsApi.getUserVerifications(userId)
        : await userVerificationsApi.getMyVerifications();
        
      setCompanyVerifications(data);
      
      // Auto-expand first non-compliant company
      const firstNonCompliant = data.find(cv => cv.complianceStatus !== 'compliant');
      if (firstNonCompliant) {
        setExpandedCompany(firstNonCompliant.company.id);
      }
    } catch (error) {
      console.error('Error loading verifications:', error);
      setError('Error al cargar las verificaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationClick = (verification: VerificationDetail, companyId: string, companyName: string) => {
    setSelectedVerification({ verification, companyId, companyName });
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedVerification(null);
  };

  const handleVerificationSubmitted = () => {
    loadVerifications();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon color="success" />;
      case 'rejected':
        return <ErrorIcon color="error" />;
      case 'pending':
      case 'in_review':
        return <AccessTimeIcon color="warning" />;
      case 'expired':
        return <WarningIcon color="error" />;
      default:
        return <DoNotDisturbIcon color="disabled" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'not_submitted': 'No enviado',
      'pending': 'Pendiente',
      'in_review': 'En revisión',
      'approved': 'Aprobado',
      'rejected': 'Rechazado',
      'expired': 'Expirado'
    };
    return statusMap[status] || status;
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'success';
      case 'partial':
        return 'warning';
      default:
        return 'error';
    }
  };

  const getComplianceLabel = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'Cumplimiento Total';
      case 'partial':
        return 'Cumplimiento Parcial';
      default:
        return 'No Cumple';
    }
  };

  const calculateProgress = (verifications: UserCompanyVerifications['verifications']) => {
    if (verifications.required === 0) return 100;
    return Math.round((verifications.completed / verifications.required) * 100);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (companyVerifications.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No hay verificaciones pendientes
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {companyVerifications.map((companyData) => (
        <Accordion
          key={companyData.company.id}
          expanded={expandedCompany === companyData.company.id}
          onChange={(_, isExpanded) => setExpandedCompany(isExpanded ? companyData.company.id : false)}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              width: '100%',
              pr: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <BusinessIcon color="primary" />
                <Box>
                  <Typography variant="h6">
                    {companyData.company.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Chip 
                      label={getComplianceLabel(companyData.complianceStatus)}
                      color={getComplianceColor(companyData.complianceStatus)}
                      size="small"
                    />
                    <Chip 
                      label={`${companyData.verifications.completed}/${companyData.verifications.required} completadas`}
                      size="small"
                      variant="outlined"
                    />
                    {companyData.verifications.pending > 0 && (
                      <Badge badgeContent={companyData.verifications.pending} color="warning">
                        <Chip label="Pendientes" size="small" color="warning" variant="outlined" />
                      </Badge>
                    )}
                    {companyData.verifications.expired > 0 && (
                      <Badge badgeContent={companyData.verifications.expired} color="error">
                        <Chip label="Expiradas" size="small" color="error" variant="outlined" />
                      </Badge>
                    )}
                  </Box>
                </Box>
              </Box>
              
              {!isXs && (
                <Box sx={{ minWidth: 200 }}>
                  <Typography variant="caption" color="text.secondary">
                    Progreso de cumplimiento
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={calculateProgress(companyData.verifications)} 
                    sx={{ height: 8, borderRadius: 1 }}
                    color={getComplianceColor(companyData.complianceStatus)}
                  />
                </Box>
              )}
            </Box>
          </AccordionSummary>
          
          <AccordionDetails>
            <Divider sx={{ mb: 2 }} />
            
            {isXs && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Progreso de cumplimiento
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={calculateProgress(companyData.verifications)} 
                  sx={{ height: 8, borderRadius: 1 }}
                  color={getComplianceColor(companyData.complianceStatus)}
                />
              </Box>
            )}
            
            <Grid container spacing={2}>
              {companyData.verifications.details.map((verification) => (
                <Grid item xs={12} sm={6} md={4} key={verification.id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: 3,
                        transform: 'translateY(-2px)'
                      }
                    }}
                    onClick={() => handleVerificationClick(
                      verification, 
                      companyData.company.id,
                      companyData.company.name
                    )}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getStatusIcon(verification.status)}
                          <Chip 
                            label={getStatusLabel(verification.status)}
                            size="small"
                            color={
                              verification.status === 'approved' ? 'success' :
                              verification.status === 'rejected' ? 'error' :
                              verification.status === 'pending' || verification.status === 'in_review' ? 'warning' :
                              'default'
                            }
                          />
                        </Box>
                        {verification.isRequired && (
                          <Chip label="Requerido" size="small" color="error" variant="outlined" />
                        )}
                      </Box>
                      
                      <Typography variant="subtitle1" fontWeight="medium">
                        {verification.name}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {verification.type} {verification.category && `• ${verification.category}`}
                      </Typography>
                      
                      {verification.description && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          {verification.description}
                        </Typography>
                      )}
                      
                      {verification.expiryDate && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(verification.expiryDate) < new Date() ? 'Expiró el:' : 'Expira el:'}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color={new Date(verification.expiryDate) < new Date() ? 'error' : 'text.primary'}
                          >
                            {format(new Date(verification.expiryDate), 'dd/MM/yyyy', { locale: es })}
                          </Typography>
                        </Box>
                      )}
                      
                      {verification.rejectionReason && (
                        <Alert severity="error" sx={{ mt: 2, py: 0 }}>
                          <Typography variant="caption">
                            {verification.rejectionReason}
                          </Typography>
                        </Alert>
                      )}
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                        {verification.documentUrl ? (
                          <Button
                            size="small"
                            startIcon={<ViewIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(verification.documentUrl, '_blank');
                            }}
                          >
                            Ver Documento
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            startIcon={<UploadIcon />}
                            color="primary"
                          >
                            Subir
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}
      
      {selectedVerification && (
        <VerificationSubmitDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          verification={selectedVerification.verification}
          companyId={selectedVerification.companyId}
          companyName={selectedVerification.companyName}
          onSubmitted={handleVerificationSubmitted}
        />
      )}
    </Box>
  );
};