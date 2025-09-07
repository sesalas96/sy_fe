import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  IconButton,
  Chip,
  useTheme,
  useMediaQuery,
  Alert,
  CircularProgress,
  InputAdornment,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  PlayArrow as StartIcon,
  Check as CompleteIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ChecklistRtl as InspectionIcon,
  Star as ScoreIcon,
  Assignment as ChecklistIcon,
  LocationOn as LocationIcon,
  Person as InspectorIcon,
  Schedule as ScheduleIcon,
  ReportProblem as NonConformityIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { InspectionApi, Inspection, InspectionFilters, InspectionStats } from '../../services/inspectionApi';
import { StatusBadge } from '../../components/marketplace/StatusBadge';
import { formatDate, truncateText } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';

export const Inspections: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [stats, setStats] = useState<InspectionStats>({
    summary: {
      total: 0,
      programadas: 0,
      en_progreso: 0,
      completadas: 0,
      fallidas: 0,
      canceladas: 0,
      tasaCompletitud: 0,
      tiempoPromedioHoras: 0
    },
    byType: [],
    byStatus: [],
    nonConformitiesByCategory: [],
    monthlyTrend: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [nonConformitiesDialogOpen, setNonConformitiesDialogOpen] = useState(false);

  // Filters
  const [filters, setFilters] = useState<InspectionFilters>({
    search: '',
    type: undefined,
    status: undefined,
    page: 1,
    limit: 10
  });

  // Pagination
  const [totalInspections, setTotalInspections] = useState(0);
  const [, setTotalPages] = useState(0);

  // Permissions
  const canCreateInspections = () => {
    return ['super_admin', 'safety_staff', 'client_supervisor'].includes(user?.role || '');
  };

  const canStartInspections = () => {
    return ['super_admin', 'safety_staff'].includes(user?.role || '');
  };

  const canCompleteInspections = (inspection: Inspection) => {
    if (user?.role === 'super_admin') return true;
    if (inspection.inspector === user?.id) return true;
    return false;
  };

  const canViewStats = useCallback(() => {
    return user?.role !== 'validadores_ops';
  }, [user?.role]);

  // Data loading
  const loadInspections = useCallback(async () => {
    try {
      setLoading(true);
      const response = await InspectionApi.getInspections(filters);
      setInspections(response.inspections);
      setTotalInspections(response.total);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError('Error loading inspections');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadStats = useCallback(async () => {
    if (!canViewStats()) return;
    
    try {
      const statsData = await InspectionApi.getInspectionStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, [canViewStats]);

  useEffect(() => {
    loadInspections();
  }, [filters, loadInspections]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Handlers
  const handleFilterChange = (key: keyof InspectionFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage + 1
    }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({
      ...prev,
      limit: parseInt(event.target.value, 10),
      page: 1
    }));
  };

  const handleStartInspection = async (inspectionId: string) => {
    try {
      await InspectionApi.startInspection(inspectionId);
      loadInspections();
    } catch (err) {
      console.error('Error starting inspection:', err);
    }
  };

  const handleCompleteInspection = async (inspectionId: string) => {
    try {
      await InspectionApi.completeInspection(inspectionId, {
        summary: 'Inspection completed via dashboard'
      });
      loadInspections();
      loadStats();
    } catch (err) {
      console.error('Error completing inspection:', err);
    }
  };

  const getTypeLabel = (type: string): string => {
    const typeLabels: Record<string, string> = {
      'inicial': 'Inicial',
      'progreso': 'Progreso',
      'final': 'Final',
      'seguridad': 'Seguridad',
      'calidad': 'Calidad'
    };
    return typeLabels[type] || type;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'inicial': return 'info';
      case 'progreso': return 'warning';
      case 'final': return 'success';
      case 'seguridad': return 'error';
      case 'calidad': return 'secondary';
      default: return 'default';
    }
  };

  const getScoreColor = (score: number, maxScore: number, passingScore: number): string => {
    const percentage = (score / maxScore) * 100;
    const passingPercentage = (passingScore / maxScore) * 100;
    
    if (percentage >= passingPercentage) return theme.palette.success.main;
    if (percentage >= passingPercentage * 0.8) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critica': return <ErrorIcon color="error" />;
      case 'alta': return <WarningIcon color="error" />;
      case 'media': return <WarningIcon color="warning" />;
      case 'baja': return <WarningIcon color="info" />;
      default: return <WarningIcon />;
    }
  };

  if (loading && inspections.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Inspections</Typography>
        {canCreateInspections() && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/marketplace/inspections/new')}
          >
            Schedule Inspection
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      {canViewStats() && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <InspectionIcon sx={{ fontSize: 40, color: theme.palette.primary.main, mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.summary.total}</Typography>
                  <Typography variant="body2" color="text.secondary">Total</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <ChecklistIcon sx={{ fontSize: 40, color: theme.palette.success.main, mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.summary.completadas}</Typography>
                  <Typography variant="body2" color="text.secondary">Completed</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <ErrorIcon sx={{ fontSize: 40, color: theme.palette.error.main, mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.summary.fallidas}</Typography>
                  <Typography variant="body2" color="text.secondary">Failed</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <ScoreIcon sx={{ fontSize: 40, color: theme.palette.info.main, mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.summary.tasaCompletitud.toFixed(1)}%</Typography>
                  <Typography variant="body2" color="text.secondary">Completion Rate</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <ChecklistIcon sx={{ fontSize: 40, color: theme.palette.warning.main, mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.summary.en_progreso}</Typography>
                  <Typography variant="body2" color="text.secondary">In Progress</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <ScheduleIcon sx={{ fontSize: 40, color: theme.palette.secondary.main, mr: 2 }} />
                <Box>
                  <Typography variant="h4">{Math.round(stats.summary.tiempoPromedioHoras)}h</Typography>
                  <Typography variant="body2" color="text.secondary">Avg Time</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                placeholder="Search inspections..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.type || ''}
                  label="Type"
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="inicial">Inicial</MenuItem>
                  <MenuItem value="progreso">Progreso</MenuItem>
                  <MenuItem value="final">Final</MenuItem>
                  <MenuItem value="seguridad">Seguridad</MenuItem>
                  <MenuItem value="calidad">Calidad</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status || ''}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="programada">Programada</MenuItem>
                  <MenuItem value="en_progreso">En Progreso</MenuItem>
                  <MenuItem value="completada">Completada</MenuItem>
                  <MenuItem value="fallida">Fallida</MenuItem>
                  <MenuItem value="cancelada">Cancelada</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Inspections Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Inspection</TableCell>
                <TableCell>Type</TableCell>
                {!isMobile && <TableCell>Inspector</TableCell>}
                {!isMobile && <TableCell>Location</TableCell>}
                <TableCell>Score</TableCell>
                <TableCell>Status</TableCell>
                {!isMobile && <TableCell>Scheduled</TableCell>}
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && inspections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : inspections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body1" color="text.secondary">
                      No inspections found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                inspections.map((inspection) => (
                  <TableRow key={inspection.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">
                          {inspection.inspectionNumber}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Work Order: {inspection.workOrder}
                        </Typography>
                        {inspection.summary && (
                          <Typography variant="caption" color="text.secondary">
                            {truncateText(inspection.summary, 50)}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getTypeLabel(inspection.type)}
                        size="small"
                        color={getTypeColor(inspection.type)}
                        variant="outlined"
                      />
                    </TableCell>
                    {!isMobile && (
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <InspectorIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {inspection.inspectorData?.name || 'Not Assigned'}
                          </Typography>
                        </Box>
                      </TableCell>
                    )}
                    {!isMobile && (
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocationIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {truncateText(inspection.location || 'N/A', 25)}
                          </Typography>
                        </Box>
                      </TableCell>
                    )}
                    <TableCell>
                      {inspection.status === 'completada' ? (
                        <Box>
                          <Typography 
                            variant="body2" 
                            fontWeight="bold"
                            sx={{ 
                              color: getScoreColor(inspection.score || 0, inspection.maxScore || 100, 70)
                            }}
                          >
                            {inspection.score}/{inspection.maxScore}
                          </Typography>
                          <Typography variant="caption">
                            {inspection.isPassed ? 'PASSED' : 'FAILED'}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Pending
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge 
                        status={inspection.status} 
                        statusType="inspection"
                      />
                    </TableCell>
                    {!isMobile && (
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {formatDate(inspection.scheduledDate)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(inspection.scheduledDate).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Box>
                      </TableCell>
                    )}
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          onClick={() => navigate(`/marketplace/inspections/${inspection.id}`)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      
                      {inspection.nonConformities && inspection.nonConformities.length > 0 && (
                        <Tooltip title="View Non-Conformities">
                          <IconButton 
                            size="small" 
                            color="warning"
                            onClick={() => {
                              setSelectedInspection(inspection);
                              setNonConformitiesDialogOpen(true);
                            }}
                          >
                            <NonConformityIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {inspection.status === 'programada' && canStartInspections() && (
                        <Tooltip title="Start Inspection">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleStartInspection(inspection._id || inspection.id || '')}
                          >
                            <StartIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {inspection.status === 'en_progreso' && canCompleteInspections(inspection) && (
                        <Tooltip title="Complete Inspection">
                          <IconButton 
                            size="small" 
                            color="success"
                            onClick={() => handleCompleteInspection(inspection._id || inspection.id || '')}
                          >
                            <CompleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={totalInspections}
          page={(filters.page || 1) - 1}
          onPageChange={handlePageChange}
          rowsPerPage={filters.limit || 10}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      {/* Non-Conformities Dialog */}
      <Dialog 
        open={nonConformitiesDialogOpen} 
        onClose={() => setNonConformitiesDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Non-Conformities - {selectedInspection?.inspectionNumber}
        </DialogTitle>
        <DialogContent>
          {selectedInspection?.nonConformities && selectedInspection.nonConformities.length > 0 ? (
            <List>
              {selectedInspection.nonConformities.map((nc, index) => (
                <React.Fragment key={nc.id}>
                  {index > 0 && <Divider />}
                  <ListItem>
                    <ListItemIcon>
                      {getSeverityIcon(nc.severity)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2">{nc.category}</Typography>
                          <Chip 
                            label={nc.severity.toUpperCase()} 
                            size="small" 
                            color={nc.severity === 'critica' ? 'error' : nc.severity === 'alta' ? 'warning' : 'default'}
                          />
                          <StatusBadge status={nc.status} statusType="nonConformity" />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {nc.description}
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            Corrective Action: {nc.correctiveAction}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Due: {formatDate(nc.dueDate)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 3 }}>
              No non-conformities found for this inspection
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNonConformitiesDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};