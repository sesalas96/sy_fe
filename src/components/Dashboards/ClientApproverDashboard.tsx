import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as AccessTimeIcon,
  Visibility as VisibilityIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon
} from '@mui/icons-material';
import { DashboardProps } from '../../types/dashboard';
import { ClientApproverStats } from '../../services/dashboardService';

interface PendingApproval {
  id: string;
  type: 'work_permit' | 'contractor' | 'document';
  title: string;
  contractorName: string;
  requestDate: string;
  priority: 'high' | 'medium' | 'low';
  department: string;
  description: string;
}

export const ClientApproverDashboard: React.FC<DashboardProps> = ({ dashboardData }) => {
  const stats = dashboardData.stats as ClientApproverStats;

  // Default values in case stats are not available
  const displayStats = stats || {
    pendingApprovals: 12,
    approvedToday: 5,
    rejectedToday: 2,
    avgResponseTime: 2.5,
    approvalsByType: {
      work_permit: 6,
      access_request: 4,
      document_validation: 2
    },
    departmentDistribution: {
      maintenance: 5,
      operations: 4,
      administration: 3
    }
  };

  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([
    {
      id: '1',
      type: 'work_permit',
      title: 'Permiso de Trabajo en Alturas',
      contractorName: 'Juan Carlos Pérez',
      requestDate: '2024-01-20T10:30:00Z',
      priority: 'high',
      department: 'Mantenimiento',
      description: 'Trabajo de mantenimiento en torre de comunicaciones de 25 metros de altura.'
    },
    {
      id: '2',
      type: 'contractor',
      title: 'Validación de Contratista',
      contractorName: 'María Elena González',
      requestDate: '2024-01-20T08:15:00Z',
      priority: 'medium',
      department: 'Soldadura',
      description: 'Validación de certificaciones para trabajos de soldadura especializada.'
    },
    {
      id: '3',
      type: 'work_permit',
      title: 'Permiso de Espacio Confinado',
      contractorName: 'Carlos Rodríguez',
      requestDate: '2024-01-19T16:45:00Z',
      priority: 'high',
      department: 'Operaciones',
      description: 'Inspección y limpieza de tanque de almacenamiento de 500 galones.'
    }
  ]);
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [comments, setComments] = useState('');

  const approvalStats = [
    {
      title: 'Pendientes de Aprobación',
      value: displayStats.pendingApprovals,
      icon: <AccessTimeIcon />,
      color: '#ff9800',
      subtitle: 'Requieren tu atención'
    },
    {
      title: 'Aprobados Hoy',
      value: displayStats.approvedToday,
      icon: <CheckCircleIcon />,
      color: '#4caf50',
      subtitle: 'Procesados exitosamente'
    },
    {
      title: 'Rechazados Hoy',
      value: displayStats.rejectedToday,
      icon: <CancelIcon />,
      color: '#f44336',
      subtitle: 'Con observaciones'
    },
    {
      title: 'Tiempo Promedio',
      value: `${displayStats.avgResponseTime}h`,
      icon: <AssignmentIcon />,
      color: '#2196f3',
      subtitle: 'Tiempo de respuesta'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'work_permit': return <AssignmentIcon />;
      case 'contractor': return <CheckCircleIcon />;
      case 'document': return <AssignmentIcon />;
      default: return <AssignmentIcon />;
    }
  };

  const handleViewDetails = (approval: PendingApproval) => {
    setSelectedApproval(approval);
    setDialogOpen(true);
  };

  const handleApprove = async (approvalId: string) => {
    try {
      // API call to approve
      console.log('Approving:', approvalId, comments);
      // Remove from pending list
      setPendingApprovals(prev => prev.filter(a => a.id !== approvalId));
      setDialogOpen(false);
      setComments('');
    } catch (error) {
      console.error('Error approving:', error);
    }
  };

  const handleReject = async (approvalId: string) => {
    try {
      // API call to reject
      console.log('Rejecting:', approvalId, comments);
      // Remove from pending list
      setPendingApprovals(prev => prev.filter(a => a.id !== approvalId));
      setDialogOpen(false);
      setComments('');
    } catch (error) {
      console.error('Error rejecting:', error);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Panel de Aprobaciones HSE
      </Typography>

      {/* Approval Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {approvalStats.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    backgroundColor: stat.color, 
                    borderRadius: '50%', 
                    p: 1, 
                    color: 'white',
                    mr: 2
                  }}>
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography variant="h4">{stat.value}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {stat.subtitle}
                    </Typography>
                  </Box>
                </Box>
                <Typography color="textSecondary">{stat.title}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pending Approvals Table */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Solicitudes Pendientes de Aprobación
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Título</TableCell>
                    <TableCell>Contratista</TableCell>
                    <TableCell>Departamento</TableCell>
                    <TableCell>Fecha Solicitud</TableCell>
                    <TableCell>Prioridad</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingApprovals.map((approval) => (
                    <TableRow key={approval.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getTypeIcon(approval.type)}
                          <Typography variant="caption" sx={{ ml: 1 }}>
                            {approval.type.replace('_', ' ')}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{approval.title}</TableCell>
                      <TableCell>{approval.contractorName}</TableCell>
                      <TableCell>{approval.department}</TableCell>
                      <TableCell>
                        {new Date(approval.requestDate).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={approval.priority} 
                          color={getPriorityColor(approval.priority) as any}
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleViewDetails(approval)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="success"
                            onClick={() => handleApprove(approval.id)}
                          >
                            <ThumbUpIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleReject(approval.id)}
                          >
                            <ThumbDownIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Acciones Rápidas
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button variant="contained" color="success">
                Aprobar Seleccionados
              </Button>
              <Button variant="contained" color="error">
                Rechazar con Observaciones
              </Button>
              <Button variant="outlined">
                Exportar Historial
              </Button>
              <Button variant="outlined">
                Configurar Notificaciones
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Approval Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Detalles de Aprobación: {selectedApproval?.title}
        </DialogTitle>
        <DialogContent>
          {selectedApproval && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Contratista:</strong> {selectedApproval.contractorName}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Departamento:</strong> {selectedApproval.department}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Prioridad:</strong> 
                <Chip 
                  label={selectedApproval.priority} 
                  color={getPriorityColor(selectedApproval.priority) as any}
                  size="small" 
                  sx={{ ml: 1 }}
                />
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Descripción:</strong>
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {selectedApproval.description}
              </Typography>
              <TextField
                label="Comentarios (opcional)"
                multiline
                rows={4}
                fullWidth
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Agregar comentarios sobre la aprobación o rechazo..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={() => selectedApproval && handleReject(selectedApproval.id)}
          >
            Rechazar
          </Button>
          <Button 
            variant="contained" 
            color="success" 
            onClick={() => selectedApproval && handleApprove(selectedApproval.id)}
          >
            Aprobar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};