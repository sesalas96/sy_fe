import React from 'react';
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
  Avatar,
  IconButton
} from '@mui/material';
import {
  Business as BusinessIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardProps } from '../../types/dashboard';
import { ClientSupervisorStats } from '../../services/dashboardService';

interface ContractorSummary {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'pending';
  complianceScore: number;
  lastActivity: string;
  avatar?: string;
}

interface PermitSummary {
  id: string;
  description: string;
  contractorName: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  department: string;
}

export const ClientSupervisorDashboard: React.FC<DashboardProps> = ({ dashboardData }) => {
  const { user } = useAuth();
  const stats = dashboardData.stats as ClientSupervisorStats;

  // Default values in case stats are not available
  const displayStats = stats || {
    totalContractors: 75,
    activePermits: 12,
    complianceRate: 92.3,
    pendingApprovals: 5,
    monthlyGrowth: 15.2,
    contractorsByStatus: {
      active: 65,
      inactive: 8,
      suspended: 2
    },
    departmentStats: {
      maintenance: 25,
      construction: 30,
      cleaning: 20
    },
    trainingCompletion: 85.5
  };

  // Mock contractors data
  const contractors: ContractorSummary[] = [
    {
      id: '1',
      name: 'Juan Carlos Pérez',
      status: 'active',
      complianceScore: 98,
      lastActivity: 'Hace 2 horas'
    },
    {
      id: '2',
      name: 'María Elena González',
      status: 'active',
      complianceScore: 95,
      lastActivity: 'Hace 1 día'
    },
    {
      id: '3',
      name: 'Carlos Alberto Rodríguez',
      status: 'pending',
      complianceScore: 85,
      lastActivity: 'Hace 3 días'
    }
  ];

  // Mock permits data
  const permits: PermitSummary[] = [
    {
      id: '1',
      description: 'Trabajo en alturas - Torre de comunicaciones',
      contractorName: 'Juan Carlos Pérez',
      status: 'pending',
      requestDate: '2024-01-20',
      department: 'Mantenimiento'
    },
    {
      id: '2',
      description: 'Soldadura en tanque de almacenamiento',
      contractorName: 'María Elena González',
      status: 'approved',
      requestDate: '2024-01-19',
      department: 'Producción'
    }
  ];

  const companyStats = [
    {
      title: 'Contratistas Totales',
      value: displayStats.totalContractors,
      icon: <PeopleIcon />,
      color: '#1976d2',
      trend: `+${displayStats.monthlyGrowth}% este mes`
    },
    {
      title: 'Permisos Activos',
      value: displayStats.activePermits,
      icon: <AssignmentIcon />,
      color: '#2e7d32',
      trend: '3 por aprobar'
    },
    {
      title: 'Tasa de Cumplimiento',
      value: `${displayStats.complianceRate}%`,
      icon: <TrendingUpIcon />,
      color: '#ed6c02',
      trend: '+2.3% vs mes anterior'
    },
    {
      title: 'Aprobaciones Pendientes',
      value: displayStats.pendingApprovals,
      icon: <BusinessIcon />,
      color: '#9c27b0',
      trend: 'Requiere atención'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'inactive': case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 95) return 'success';
    if (score >= 85) return 'warning';
    return 'error';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Supervisión de Espacios de Trabajo
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            {user?.name} - Espacios de Trabajo: TechCorp S.A.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined">
            Exportar Reporte
          </Button>
          <Button variant="contained" color="primary">
            Crear Contratista
          </Button>
        </Box>
      </Box>

      {/* Company Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {companyStats.map((stat, index) => (
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
                      {stat.trend}
                    </Typography>
                  </Box>
                </Box>
                <Typography color="textSecondary">{stat.title}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Contractors Overview */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Contratistas de la Espacios de Trabajo
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Contratista</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Cumplimiento</TableCell>
                    <TableCell>Última Actividad</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contractors.map((contractor) => (
                    <TableRow key={contractor.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: '#1976d2' }}>
                            {contractor.name.charAt(0)}
                          </Avatar>
                          {contractor.name}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={contractor.status} 
                          color={getStatusColor(contractor.status) as any}
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ mr: 1 }}>
                            {contractor.complianceScore}%
                          </Typography>
                          <Chip 
                            label="" 
                            color={getComplianceColor(contractor.complianceScore) as any}
                            size="small"
                            sx={{ width: 8, height: 8, minWidth: 8 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>{contractor.lastActivity}</TableCell>
                      <TableCell>
                        <IconButton size="small" color="primary">
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton size="small">
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Permits Status */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Permisos de Trabajo Recientes
            </Typography>
            <List>
              {permits.map((permit) => (
                <ListItem key={permit.id} divider>
                  <ListItemText
                    primary={permit.description}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          Solicitante: {permit.contractorName}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Depto: {permit.department} | {permit.requestDate}
                        </Typography>
                      </Box>
                    }
                  />
                  <Chip 
                    label={permit.status} 
                    color={getStatusColor(permit.status) as any}
                    size="small" 
                  />
                </ListItem>
              ))}
            </List>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button variant="outlined" size="small">
                Ver Todos los Permisos
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Acciones de Supervisión
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button variant="contained" color="primary">
                Revisar Aprobaciones
              </Button>
              <Button variant="contained" color="secondary">
                Generar Reporte Mensual
              </Button>
              <Button variant="outlined">
                Configurar Espacios de Trabajo
              </Button>
              <Button variant="outlined">
                Gestionar Departamentos
              </Button>
              <Button variant="outlined" color="warning">
                Verificar Cumplimiento
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};