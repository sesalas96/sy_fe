import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Badge
} from '@mui/material';
import {
  Security as SecurityIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Build as BuildIcon,
  AccessTime as AccessTimeIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { DashboardProps } from '../../types/dashboard';
import { ValidadoresOpsStats } from '../../services/dashboardService';

interface AccessRequest {
  id: string;
  contractorName: string;
  area: string;
  purpose: string;
  requestTime: string;
  status: 'pending' | 'approved' | 'denied';
  priority: 'high' | 'medium' | 'low';
}

interface ToolEntry {
  id: string;
  contractorName: string;
  toolName: string;
  serialNumber: string;
  action: 'entry' | 'exit';
  timestamp: string;
  status: 'verified' | 'pending';
}

export const ValidadoresOpsDashboard: React.FC<DashboardProps> = ({ dashboardData }) => {
  const stats = dashboardData.stats as ValidadoresOpsStats;

  // Default values in case stats are not available
  const displayStats = stats || {
    pendingVerifications: 8,
    accessesGranted: 125,
    incidentsReported: 2,
    toolsRegistered: 45,
    todayStats: {
      entrances: 85,
      exits: 73,
      currentInside: 12,
      violations: 1
    },
    vehicleAccess: {
      pending: 3,
      approved: 42,
      inPremises: 15
    }
  };

  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([
    {
      id: '1',
      contractorName: 'Juan Carlos Pérez',
      area: 'Zona Industrial A',
      purpose: 'Mantenimiento de equipos',
      requestTime: '2024-01-20T08:30:00Z',
      status: 'pending',
      priority: 'high'
    },
    {
      id: '2',
      contractorName: 'María González',
      area: 'Oficinas Administrativas',
      purpose: 'Instalación de cámaras',
      requestTime: '2024-01-20T09:15:00Z',
      status: 'pending',
      priority: 'medium'
    }
  ]);

  const [toolEntries, setToolEntries] = useState<ToolEntry[]>([
    {
      id: '1',
      contractorName: 'Carlos Rodríguez',
      toolName: 'Taladro Industrial',
      serialNumber: 'TI-2023-001',
      action: 'entry',
      timestamp: '2024-01-20T07:45:00Z',
      status: 'verified'
    },
    {
      id: '2',
      contractorName: 'Ana López',
      toolName: 'Soldadora MIG',
      serialNumber: 'SM-2023-045',
      action: 'exit',
      timestamp: '2024-01-20T16:30:00Z',
      status: 'pending'
    }
  ]);

  const securityStats = [
    {
      title: 'Verificaciones Pendientes',
      value: displayStats.pendingVerifications,
      icon: <SecurityIcon />,
      color: '#ff9800',
      badge: displayStats.pendingVerifications > 0
    },
    {
      title: 'Accesos Autorizados',
      value: displayStats.accessesGranted,
      icon: <CheckCircleIcon />,
      color: '#4caf50',
      badge: false
    },
    {
      title: 'Incidentes Reportados',
      value: displayStats.incidentsReported,
      icon: <WarningIcon />,
      color: displayStats.incidentsReported > 0 ? '#f44336' : '#4caf50',
      badge: displayStats.incidentsReported > 0
    },
    {
      title: 'Herramientas Registradas',
      value: displayStats.toolsRegistered,
      icon: <BuildIcon />,
      color: '#2196f3',
      badge: false
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': case 'verified': return 'success';
      case 'pending': return 'warning';
      case 'denied': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const handleApproveAccess = (requestId: string) => {
    setAccessRequests(prev => 
      prev.map(req => 
        req.id === requestId ? { ...req, status: 'approved' } : req
      )
    );
  };

  const handleVerifyTool = (entryId: string) => {
    setToolEntries(prev => 
      prev.map(entry => 
        entry.id === entryId ? { ...entry, status: 'verified' } : entry
      )
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Panel de Seguridad Operacional
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" color="warning">
            Reportar Incidente
          </Button>
          <Button variant="contained" color="primary">
            Ronda de Seguridad
          </Button>
        </Box>
      </Box>

      {/* Security Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {securityStats.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Badge 
                    badgeContent={stat.badge ? "!" : 0} 
                    color="error"
                    invisible={!stat.badge}
                  >
                    <Box sx={{ 
                      backgroundColor: stat.color, 
                      borderRadius: '50%', 
                      p: 1, 
                      color: 'white',
                      mr: 2
                    }}>
                      {stat.icon}
                    </Box>
                  </Badge>
                  <Typography variant="h4">{stat.value}</Typography>
                </Box>
                <Typography color="textSecondary">{stat.title}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Access Requests */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Solicitudes de Acceso
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Contratista</TableCell>
                    <TableCell>Área</TableCell>
                    <TableCell>Propósito</TableCell>
                    <TableCell>Hora</TableCell>
                    <TableCell>Prioridad</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {accessRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.contractorName}</TableCell>
                      <TableCell>{request.area}</TableCell>
                      <TableCell>{request.purpose}</TableCell>
                      <TableCell>
                        {new Date(request.requestTime).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={request.priority} 
                          color={getPriorityColor(request.priority) as any}
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size="small" color="primary">
                            <VisibilityIcon />
                          </IconButton>
                          {request.status === 'pending' && (
                            <Button 
                              size="small" 
                              variant="contained" 
                              color="success"
                              onClick={() => handleApproveAccess(request.id)}
                            >
                              Aprobar
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Tool Registry */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Registro de Herramientas
            </Typography>
            <List>
              {toolEntries.map((entry) => (
                <ListItem key={entry.id} divider>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label={entry.action === 'entry' ? 'ENTRADA' : 'SALIDA'} 
                          color={entry.action === 'entry' ? 'info' : 'warning'}
                          size="small" 
                        />
                        {entry.toolName}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          Contratista: {entry.contractorName}
                        </Typography>
                        <Typography variant="caption" display="block">
                          S/N: {entry.serialNumber}
                        </Typography>
                        <Typography variant="caption" display="block">
                          {new Date(entry.timestamp).toLocaleString('es-ES')}
                        </Typography>
                      </Box>
                    }
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Chip 
                      label={entry.status} 
                      color={getStatusColor(entry.status) as any}
                      size="small" 
                    />
                    {entry.status === 'pending' && (
                      <Button 
                        size="small" 
                        variant="outlined"
                        onClick={() => handleVerifyTool(entry.id)}
                      >
                        Verificar
                      </Button>
                    )}
                  </Box>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Controles de Seguridad
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button variant="contained" color="primary" startIcon={<SecurityIcon />}>
                Iniciar Ronda
              </Button>
              <Button variant="contained" color="secondary" startIcon={<AssignmentIcon />}>
                Registro Manual
              </Button>
              <Button variant="outlined" startIcon={<AccessTimeIcon />}>
                Historial de Accesos
              </Button>
              <Button variant="outlined" startIcon={<BuildIcon />}>
                Inventario Herramientas
              </Button>
              <Button variant="outlined" color="error" startIcon={<WarningIcon />}>
                Emergencia
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};