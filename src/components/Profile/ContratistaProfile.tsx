import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Card,
  CardContent,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Alert,
  CircularProgress,
  Button,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Tooltip
} from '@mui/material';
import {
  School as CertificationIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Description as DocumentIcon,
  Photo as PhotoIcon,
  Assignment as AssignmentIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { useContractorFiles } from '../../hooks/useContractorFiles';
import { AvatarEditModal } from './AvatarEditModal';

export const ContratistaProfile: React.FC = () => {
  const { user } = useAuth();
  const { loading, error, filesData, downloadFile, refetch } = useContractorFiles();
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [contractorSettings, setContractorSettings] = useState({
    workShift: 'day',
    specializations: ['electrical', 'maintenance'],
    availableForEmergency: true,
    overtimeAvailable: false,
    travelWilling: true,
    preferredProjects: 'industrial'
  });

  const contractorInfo = {
    cedula: '1-2345-6789',
    ordenPatronal: 'OP-2024-001',
    polizaINS: 'INS-2024-12345',
    yearsExperience: 8,
    completedProjects: user?.role === UserRole.CONTRATISTA_HUERFANO ? 47 : 23,
    complianceScore: user?.role === UserRole.CONTRATISTA_HUERFANO ? 96 : 94,
    currentStatus: 'active'
  };

  const certifications = [
    { name: 'Electricista Industrial', status: 'vigente', expiry: '2025-06-15', progress: 100 },
    { name: 'Trabajo en Alturas', status: 'vigente', expiry: '2024-12-20', progress: 100 },
    { name: 'Espacios Confinados', status: 'por_vencer', expiry: '2024-08-15', progress: 85 },
    { name: 'Primeros Auxilios', status: 'vigente', expiry: '2025-03-10', progress: 100 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vigente': return 'success';
      case 'por_vencer': return 'warning';
      case 'vencido': return 'error';
      default: return 'default';
    }
  };

  const getRoleTitle = () => {
    switch (user?.role) {
      case UserRole.CONTRATISTA_ADMIN:
        return { title: 'Contratista Admin', subtitle: 'Líder de Equipo de Trabajo', color: 'primary' };
      case UserRole.CONTRATISTA_SUBALTERNOS:
        return { title: 'Contratista Subalterno', subtitle: 'Trabajador Especializado', color: 'secondary' };
      case UserRole.CONTRATISTA_HUERFANO:
        return { title: 'Contratista Particular', subtitle: 'Profesional Independiente', color: 'info' };
      default:
        return { title: 'CONTRATISTA', subtitle: 'Trabajador', color: 'default' };
    }
  };

  const roleInfo = getRoleTitle();

  return (
    <Box>
      {/* Status Alert for Independent Contractors */}
      {user?.role === UserRole.CONTRATISTA_HUERFANO && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Como Contratista Particular, eres responsable de mantener tus certificaciones actualizadas y gestionar tus propios proyectos.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Contractor Identity */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Tooltip title={filesData.selfieUrl ? "Clic para editar foto" : "Agregar foto de perfil"}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      <IconButton
                        sx={{
                          bgcolor: 'primary.main',
                          color: 'white',
                          width: 28,
                          height: 28,
                          '&:hover': {
                            bgcolor: 'primary.dark',
                          }
                        }}
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAvatarModalOpen(true);
                        }}
                      >
                        <EditIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    }
                  >
                    <Box 
                      sx={{ 
                        position: 'relative', 
                        mr: 2,
                        cursor: 'pointer',
                        '&:hover': {
                          '& .MuiAvatar-root': {
                            opacity: 0.8
                          }
                        }
                      }}
                      onClick={() => setAvatarModalOpen(true)}
                    >
                      <Avatar
                        sx={{ 
                          width: 80, 
                          height: 80, 
                          bgcolor: filesData.selfieUrl ? 'transparent' : `${roleInfo.color}.main`,
                          transition: 'opacity 0.2s',
                          border: !filesData.selfieUrl ? '2px dashed' : 'none',
                          borderColor: 'action.disabled'
                        }}
                        src={filesData.selfieUrl}
                      >
                        {!filesData.selfieUrl && <PhotoIcon sx={{ fontSize: 40 }} />}
                      </Avatar>
                      {loading && (
                        <Box sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'rgba(255,255,255,0.8)',
                          borderRadius: '50%'
                        }}>
                          <CircularProgress size={24} />
                        </Box>
                      )}
                    </Box>
                  </Badge>
                </Tooltip>
                <Box>
                  <Typography variant="h6" color={`${roleInfo.color}.main`}>
                    {user?.name}
                  </Typography>
                  <Chip 
                    label={roleInfo.title}
                    color={roleInfo.color as any}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="textSecondary">
                    {roleInfo.subtitle}
                  </Typography>
                  {!filesData.selfieUrl && (
                    <Typography 
                      variant="caption" 
                      color="primary" 
                      sx={{ 
                        mt: 0.5, 
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        '&:hover': {
                          textDecoration: 'none'
                        }
                      }}
                      onClick={() => setAvatarModalOpen(true)}
                    >
                      Agregar foto
                    </Typography>
                  )}
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Nombre Completo"
                    value={user?.name || ''}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Cédula de Identidad"
                    value={contractorInfo.cedula}
                    disabled
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Orden Patronal"
                    value={contractorInfo.ordenPatronal}
                    disabled
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Póliza INS"
                    value={contractorInfo.polizaINS}
                    disabled
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Professional Stats */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color={`${roleInfo.color}.main`}>
                Estadísticas Profesionales
              </Typography>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="primary">
                      {contractorInfo.yearsExperience}
                    </Typography>
                    <Typography variant="caption">
                      Años de Experiencia
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="success.main">
                      {contractorInfo.completedProjects}
                    </Typography>
                    <Typography variant="caption">
                      Proyectos Completados
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ p: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Puntaje de Cumplimiento: {contractorInfo.complianceScore}%
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={contractorInfo.complianceScore} 
                      color="success"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <InputLabel>Turno de Trabajo Preferido</InputLabel>
                    <Select
                      value={contractorSettings.workShift}
                      onChange={(e) => setContractorSettings(prev => ({...prev, workShift: e.target.value}))}
                      label="Turno de Trabajo Preferido"
                    >
                      <MenuItem value="day">Diurno (6:00 AM - 6:00 PM)</MenuItem>
                      <MenuItem value="night">Nocturno (6:00 PM - 6:00 AM)</MenuItem>
                      <MenuItem value="flexible">Flexible</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Proyectos Preferidos</InputLabel>
                    <Select
                      value={contractorSettings.preferredProjects}
                      onChange={(e) => setContractorSettings(prev => ({...prev, preferredProjects: e.target.value}))}
                      label="Tipo de Proyectos Preferidos"
                    >
                      <MenuItem value="industrial">Industrial</MenuItem>
                      <MenuItem value="residential">Residencial</MenuItem>
                      <MenuItem value="commercial">Comercial</MenuItem>
                      <MenuItem value="infrastructure">Infraestructura</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Work Preferences */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color={`${roleInfo.color}.main`}>
                Preferencias de Trabajo
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={contractorSettings.availableForEmergency}
                      onChange={(e) => setContractorSettings(prev => ({...prev, availableForEmergency: e.target.checked}))}
                      color="error"
                    />
                  }
                  label="Disponible para emergencias"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={contractorSettings.overtimeAvailable}
                      onChange={(e) => setContractorSettings(prev => ({...prev, overtimeAvailable: e.target.checked}))}
                      color="warning"
                    />
                  }
                  label="Disponible para horas extra"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={contractorSettings.travelWilling}
                      onChange={(e) => setContractorSettings(prev => ({...prev, travelWilling: e.target.checked}))}
                      color="info"
                    />
                  }
                  label="Dispuesto a viajar"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Certifications Status */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color={`${roleInfo.color}.main`}>
                Estado de Certificaciones
              </Typography>
              <List>
                {certifications.map((cert, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CertificationIcon color={getStatusColor(cert.status) as any} />
                    </ListItemIcon>
                    <ListItemText
                      primary={cert.name}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            Vence: {cert.expiry}
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={cert.progress} 
                            color={getStatusColor(cert.status) as any}
                            sx={{ mt: 1, height: 4, borderRadius: 2 }}
                          />
                        </Box>
                      }
                    />
                    <Chip 
                      label={cert.status.replace('_', ' ').toUpperCase()} 
                      color={getStatusColor(cert.status) as any}
                      size="small" 
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Documents Section */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" color={`${roleInfo.color}.main`}>
                  Documentos Subidos
                </Typography>
                <IconButton onClick={refetch} disabled={loading} color="primary">
                  <RefreshIcon />
                </IconButton>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Error al cargar documentos: {error}
                </Alert>
              )}

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Identity Files */}
                  {filesData.identityFiles.length > 0 && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <PhotoIcon sx={{ mr: 1, color: 'info.main' }} />
                        <Typography variant="subtitle1">
                          Documentos de Identidad ({filesData.identityFiles.length})
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List>
                          {filesData.identityFiles.map((file) => (
                            <ListItem key={file.id}>
                              <ListItemIcon>
                                <PhotoIcon color="info" />
                              </ListItemIcon>
                              <ListItemText
                                primary={file.fieldName === 'selfie' ? 'Selfie' : 
                                        file.fieldName === 'idFront' ? 'Documento Frontal' : 
                                        'Documento Trasero'}
                                secondary={`Subido: ${new Date(file.uploadDate).toLocaleDateString()}`}
                              />
                              <Button
                                size="small"
                                startIcon={<DownloadIcon />}
                                onClick={() => downloadFile(file.id, file.originalName)}
                                disabled={loading}
                              >
                                Descargar
                              </Button>
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  )}

                  {/* Legal Files */}
                  {filesData.legalFiles.length > 0 && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <DocumentIcon sx={{ mr: 1, color: 'warning.main' }} />
                        <Typography variant="subtitle1">
                          Documentos Legales ({filesData.legalFiles.length})
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List>
                          {filesData.legalFiles.map((file) => (
                            <ListItem key={file.id}>
                              <ListItemIcon>
                                <DocumentIcon color="warning" />
                              </ListItemIcon>
                              <ListItemText
                                primary={file.fieldName === 'polizaINS' ? 'Póliza INS' : 
                                        file.fieldName === 'ordenPatronal' ? 'Orden Patronal' :
                                        file.fieldName === 'contractorLicense' ? 'Licencia de Contratista' :
                                        'Antecedentes Penales'}
                                secondary={`Subido: ${new Date(file.uploadDate).toLocaleDateString()}`}
                              />
                              <Button
                                size="small"
                                startIcon={<DownloadIcon />}
                                onClick={() => downloadFile(file.id, file.originalName)}
                                disabled={loading}
                              >
                                Descargar
                              </Button>
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  )}

                  {/* Medical Files */}
                  {filesData.medicalFiles.length > 0 && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <AssignmentIcon sx={{ mr: 1, color: 'error.main' }} />
                        <Typography variant="subtitle1">
                          Certificados Médicos ({filesData.medicalFiles.length})
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List>
                          {filesData.medicalFiles.map((file) => (
                            <ListItem key={file.id}>
                              <ListItemIcon>
                                <AssignmentIcon color="error" />
                              </ListItemIcon>
                              <ListItemText
                                primary="Certificado Médico"
                                secondary={`Subido: ${new Date(file.uploadDate).toLocaleDateString()}`}
                              />
                              <Button
                                size="small"
                                startIcon={<DownloadIcon />}
                                onClick={() => downloadFile(file.id, file.originalName)}
                                disabled={loading}
                              >
                                Descargar
                              </Button>
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  )}

                  {/* Course Files */}
                  {filesData.courseFiles.length > 0 && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <CertificationIcon sx={{ mr: 1, color: 'success.main' }} />
                        <Typography variant="subtitle1">
                          Certificados de Cursos ({filesData.courseFiles.length})
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List>
                          {filesData.courseFiles.map((file) => (
                            <ListItem key={file.id}>
                              <ListItemIcon>
                                <CertificationIcon color="success" />
                              </ListItemIcon>
                              <ListItemText
                                primary={file.fieldName === 'initialCourses' ? 'Curso Inicial' : 'Curso Adicional'}
                                secondary={`${file.originalName} - Subido: ${new Date(file.uploadDate).toLocaleDateString()}`}
                              />
                              <Button
                                size="small"
                                startIcon={<DownloadIcon />}
                                onClick={() => downloadFile(file.id, file.originalName)}
                                disabled={loading}
                              >
                                Descargar
                              </Button>
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  )}

                  {/* No files message */}
                  {!loading && filesData.files.length === 0 && !error && (
                    <Alert severity="info">
                      No hay documentos subidos. Los documentos se cargan automáticamente después del registro.
                    </Alert>
                  )}
                  
                  {/* Error but show as info if it's about not having files */}
                  {!loading && error && error.includes('archivos subidos') && (
                    <Alert severity="info">
                      {error} Los documentos aparecerán aquí después del registro.
                    </Alert>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Avatar Edit Modal */}
      <AvatarEditModal
        open={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        currentAvatarUrl={filesData.selfieUrl}
        onAvatarUpdated={() => {
          refetch(); // Refresh the files data
        }}
      />
    </Box>
  );
};