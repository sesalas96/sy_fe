import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Grid,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Snackbar,
  Chip,
  Avatar,
  Fab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Assignment as AssignmentIcon,
  CheckCircle as ActiveIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  Task as TaskIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { teamService, Team, TeamMember } from '../../services/teamService';

interface CreateTeamData {
  teamName: string;
  description: string;
  maxMembers: number;
  teamType: string;
  location: string;
  workShift: 'day' | 'morning' | 'afternoon' | 'night' | 'rotating' | 'flexible';
}

interface EditTeamData {
  id: string;
  teamName: string;
  description: string;
  maxMembers: number;
  teamType: string;
  location: string;
  workShift: 'day' | 'morning' | 'afternoon' | 'night' | 'rotating' | 'flexible';
  isActive: boolean;
}

export const MyTeams: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [advancedSearch, setAdvancedSearch] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDeletedTeams, setShowDeletedTeams] = useState(false);
  const [deletedTeams, setDeletedTeams] = useState<Team[]>([]);
  const [performanceFilter, setPerformanceFilter] = useState<string>('');
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  
  // Form states
  const [createFormData, setCreateFormData] = useState<CreateTeamData>({
    teamName: '',
    description: '',
    maxMembers: 10,
    teamType: 'general',
    location: '',
    workShift: 'day'
  });
  const [editFormData, setEditFormData] = useState<EditTeamData>({
    id: '',
    teamName: '',
    description: '',
    maxMembers: 10,
    teamType: 'general',
    location: '',
    workShift: 'day',
    isActive: true
  });
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [availableMembers, ] = useState<TeamMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  
  // Loading states for actions
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  
  // Snackbar states
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    console.log('MyTeams useEffect triggered. User:', user);
    
    // Only fetch teams when user is loaded and is CONTRATISTA_ADMIN
    if (user && user.role === UserRole.CONTRATISTA_ADMIN) {
      console.log('User is CONTRATISTA_ADMIN, fetching teams...');
      fetchTeams();
    } else if (user?.role) {
      console.log('User has different role:', user.role, 'not fetching teams');
    } else {
      console.log('User not loaded yet');
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTeams = async () => {
    // Prevent multiple simultaneous calls
    if (isFetching) {
      console.log('Already fetching teams, skipping...');
      return;
    }
    
    try {
      setIsFetching(true);
      setLoading(true);
      setError(null);
      console.log('Fetching teams for user role:', user?.role);
      const teamsData = await teamService.getMyTeams();
      console.log('Fetched teams data:', teamsData);
      console.log('Teams IDs:', teamsData.map(team => ({ id: team.id, name: team.name, type: typeof team.id })));
      setTeams(teamsData);
    } catch (err) {
      console.error('Error loading teams:', err);
      setError(`Error al cargar los equipos: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  const handleRefresh = async () => {
    // Prevent multiple simultaneous refresh calls
    if (refreshing || isFetching) {
      console.log('Already refreshing or fetching, skipping...');
      return;
    }

    try {
      setRefreshing(true);
      setError(null);
      console.log('Refreshing teams...');
      const teamsData = await teamService.getMyTeams();
      setTeams(teamsData);
      showSnackbar('Equipos actualizados correctamente');
    } catch (err) {
      console.error('Error refreshing teams:', err);
      setError('Error al actualizar los equipos.');
    } finally {
      setRefreshing(false);
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const getTeamTypeLabel = (teamType: string) => {
    const types: Record<string, string> = {
      general: 'General',
      security: 'Seguridad',
      maintenance: 'Mantenimiento',
      construction: 'Construcción',
      operations: 'Operaciones'
    };
    return types[teamType] || teamType || 'General';
  };

  const getWorkShiftLabel = (workShift: string) => {
    const shifts: Record<string, string> = {
      day: 'Diurno',
      night: 'Nocturno',
      morning: 'Mañana',
      afternoon: 'Tarde',
      rotating: 'Rotativo',
      flexible: 'Flexible',
      // Backward compatibility for old Spanish values
      diurno: 'Diurno',
      nocturno: 'Nocturno',
      mañana: 'Mañana',
      tarde: 'Tarde',
      rotativo: 'Rotativo'
    };
    return shifts[workShift] || workShift || 'Diurno';
  };

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'success';
    if (rate >= 60) return 'warning';
    return 'error';
  };

  const getFillRateColor = (rate: number) => {
    if (rate >= 70) return 'success';
    if (rate >= 50) return 'warning';
    return 'error';
  };

  const filteredTeams = useMemo(() => {
    const teamsToFilter = showDeletedTeams ? deletedTeams : teams;
    return teamsToFilter.filter(team => {
      // Smart search across multiple fields
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase().trim();
        
        // Basic text matching
        const matchesName = (team.name || '').toLowerCase().includes(searchLower);
        const matchesDescription = (team.description || '').toLowerCase().includes(searchLower);
        const matchesSupervisor = (team.supervisorName || '').toLowerCase().includes(searchLower);
        const matchesCompany = (team.companyName || team.company || '').toLowerCase().includes(searchLower);
        const matchesLocation = (team.location || '').toLowerCase().includes(searchLower);
        const matchesType = getTeamTypeLabel(team.teamType || '').toLowerCase().includes(searchLower);
        const matchesShift = getWorkShiftLabel(team.workShift || '').toLowerCase().includes(searchLower);
        
        // Smart keyword matching
        const isSearchingByCapacity = searchLower.includes('miembro') || searchLower.includes('capacidad');
        const isSearchingByTasks = searchLower.includes('tarea') || searchLower.includes('trabajo');
        const isSearchingByRating = searchLower.includes('valoracion') || searchLower.includes('rating') || searchLower.includes('estrella');
        // const isSearchingByPerformance = searchLower.includes('rendimiento') || searchLower.includes('performance');
        
        // Performance-based matching
        let matchesPerformance = false;
        if (isSearchingByCapacity && team.membersFillRate !== undefined) {
          const highCapacity = team.membersFillRate >= 70;
          matchesPerformance = searchLower.includes('alto') ? highCapacity : 
                              searchLower.includes('bajo') ? !highCapacity : true;
        }
        
        if (isSearchingByTasks && team.completionRate !== undefined) {
          const highCompletion = team.completionRate >= 80;
          matchesPerformance = searchLower.includes('completad') || searchLower.includes('finaliz') ? highCompletion :
                              searchLower.includes('pendiente') || searchLower.includes('atrasd') ? !highCompletion : true;
        }
        
        if (isSearchingByRating && team.stats?.averageRating) {
          const highRating = team.stats.averageRating >= 4.0;
          matchesPerformance = searchLower.includes('alto') || searchLower.includes('bueno') ? highRating :
                              searchLower.includes('bajo') || searchLower.includes('malo') ? !highRating : true;
        }
        
        // ID-based search (partial match)
        const matchesId = team.id.toLowerCase().includes(searchLower) || 
                         team.id.slice(-6).toLowerCase().includes(searchLower);
        
        // Numeric search for team size
        const numericSearch = searchLower.match(/\d+/);
        let matchesNumeric = false;
        if (numericSearch) {
          const searchNumber = parseInt(numericSearch[0]);
          matchesNumeric = team.teamSize === searchNumber || 
                          team.maxMembers === searchNumber ||
                          (team.stats?.totalTasks === searchNumber) ||
                          (team.stats?.completedTasks === searchNumber);
        }
        
        // Combine all matching conditions
        const basicMatch = matchesName || matchesDescription || matchesSupervisor || 
                          matchesCompany || matchesLocation || matchesType || matchesShift;
        const advancedMatch = matchesPerformance || matchesId || matchesNumeric;
        
        // Return true if any condition matches
        if (!basicMatch && !advancedMatch) return false;
      }
      
      // Status filter (skip for deleted teams view since they're all inactive)
      const matchesStatus = showDeletedTeams || statusFilter === 'all' || team.status === statusFilter;
      return matchesStatus;
    });
  }, [teams, deletedTeams, searchTerm, statusFilter, showDeletedTeams]);

  const handleCreateTeam = async () => {
    if (!createFormData.teamName.trim()) {
      showSnackbar('El nombre del equipo es obligatorio');
      return;
    }

    try {
      setIsCreatingTeam(true);
      console.log('Creating team with data:', {
        supervisorId: user?.id || '',
        teamName: createFormData.teamName,
        description: createFormData.description
      });
      
      const newTeam = await teamService.createTeam({
        supervisorId: user?.id || '',
        teamName: createFormData.teamName,
        description: createFormData.description,
        maxMembers: createFormData.maxMembers,
        teamType: createFormData.teamType,
        location: createFormData.location,
        workShift: createFormData.workShift
      });
      
      console.log('Created team:', newTeam);
      setTeams(prev => [...prev, newTeam]);
      setCreateDialogOpen(false);
      setCreateFormData({ 
        teamName: '', 
        description: '',
        maxMembers: 10,
        teamType: 'general',
        location: '',
        workShift: 'day'
      });
      showSnackbar('Equipo creado exitosamente');
    } catch (err) {
      console.error('Error creating team:', err);
      showSnackbar(`Error al crear el equipo: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleEditTeam = async () => {
    if (!editFormData.teamName.trim()) {
      showSnackbar('El nombre del equipo es obligatorio');
      return;
    }

    try {
      setIsEditingTeam(true);
      console.log('Updating team with data:', {
        id: editFormData.id,
        teamName: editFormData.teamName,
        description: editFormData.description
      });

      // First update the basic team information
      const updatedTeam = await teamService.updateTeam(editFormData.id, {
        teamName: editFormData.teamName,
        description: editFormData.description,
        maxMembers: editFormData.maxMembers,
        teamType: editFormData.teamType,
        location: editFormData.location,
        workShift: editFormData.workShift
      });

      // If the active status changed, toggle it separately
      const currentTeam = teams.find(t => t.id === editFormData.id);
      if (currentTeam && currentTeam.isActive !== editFormData.isActive) {
        await teamService.toggleTeamStatus(editFormData.id, editFormData.isActive);
      }
      
      console.log('Updated team:', updatedTeam);
      console.log('Current teams before update:', teams);
      console.log('Looking for team with ID:', editFormData.id);
      
      setTeams(prev => prev.map(team => 
        team.id === editFormData.id ? { 
          ...updatedTeam, 
          isActive: editFormData.isActive,
          status: editFormData.isActive ? 'active' : 'inactive'
        } : team
      ));
      setEditDialogOpen(false);
      showSnackbar('Equipo actualizado exitosamente');
    } catch (err) {
      console.error('Error updating team:', err);
      showSnackbar(`Error al actualizar el equipo: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setIsEditingTeam(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!selectedTeam) return;

    try {
      setIsDeletingTeam(true);
      console.log('Soft deleting team:', selectedTeam.id, selectedTeam.name);
      
      // Soft delete the team (API handles the soft delete)
      await teamService.deleteTeam(selectedTeam.id);
      
      // Remove the team from the current view since it's now soft deleted
      // User can view deleted teams in a separate section if needed
      setTeams(prev => prev.filter(team => team.id !== selectedTeam.id));
      
      setDeleteDialogOpen(false);
      setSelectedTeam(null);
      showSnackbar('Equipo eliminado exitosamente (eliminación suave)');
      console.log('Team soft deleted successfully from UI');
    } catch (err) {
      console.error('Error soft deleting team:', err);
      showSnackbar(`Error al eliminar el equipo: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setIsDeletingTeam(false);
    }
  };

  const handleReactivateTeam = async (team: Team) => {
    try {
      console.log('Reactivating team:', team.id, team.name);
      
      // Restore the team (API handles the restoration)
      await teamService.reactivateTeam(team.id);
      
      if (showDeletedTeams) {
        // Remove from deleted teams list and refresh active teams
        setDeletedTeams(prev => prev.filter(t => t.id !== team.id));
        fetchTeams(); // Refresh active teams list
      } else {
        // Update the team status to active in the current UI
        setTeams(prev => prev.map(t => 
          t.id === team.id ? { ...t, status: 'active', isActive: true } : t
        ));
      }
      
      showSnackbar('Equipo restaurado exitosamente');
      console.log('Team restored successfully from UI');
    } catch (err) {
      console.error('Error restoring team:', err);
      showSnackbar(`Error al restaurar el equipo: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  const fetchDeletedTeams = async () => {
    try {
      setLoading(true);
      console.log('Fetching deleted teams...');
      const deletedTeamsData = await teamService.getDeletedTeams();
      console.log('Deleted teams data:', deletedTeamsData);
      setDeletedTeams(deletedTeamsData);
    } catch (err) {
      console.error('Error loading deleted teams:', err);
      setError(`Error al cargar equipos eliminados: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDeletedView = async () => {
    const newShowDeletedTeams = !showDeletedTeams;
    setShowDeletedTeams(newShowDeletedTeams);
    
    if (newShowDeletedTeams) {
      await fetchDeletedTeams();
    } else {
      // Switch back to active teams
      setDeletedTeams([]);
      if (teams.length === 0) {
        fetchTeams();
      }
    }
  };

  // const handleToggleTeamStatus = async (team: Team) => {
  //   try {
  //     const newStatus = !team.isActive;
  //     console.log(`Toggling team ${team.id} status to ${newStatus ? 'active' : 'inactive'}`);
      
  //     const updatedTeam = await teamService.toggleTeamStatus(team.id, newStatus);
      
  //     // Update the team in the current list
  //     if (showDeletedTeams) {
  //       setDeletedTeams(prev => prev.map(t => 
  //         t.id === team.id ? updatedTeam : t
  //       ));
  //     } else {
  //       setTeams(prev => prev.map(t => 
  //         t.id === team.id ? updatedTeam : t
  //       ));
  //     }
      
  //     showSnackbar(`Equipo ${newStatus ? 'activado' : 'desactivado'} exitosamente`);
  //     console.log(`Team status toggled successfully`);
  //   } catch (err) {
  //     console.error('Error toggling team status:', err);
  //     showSnackbar(`Error al cambiar el estado del equipo: ${err instanceof Error ? err.message : 'Error desconocido'}`);
  //   }
  // };

  const handleViewMembers = (team: Team) => {
    navigate(`/my-teams/${team.id}/members`);
  };

  const handleAddMember = async () => {
    if (!selectedTeam || !selectedMemberId) return;

    try {
      await teamService.addTeamMember(selectedTeam.id, {
        contractorId: selectedMemberId
      });
      
      // Refresh team members
      const members = await teamService.getTeamMembers(selectedTeam.id);
      setTeamMembers(members);
      setAddMemberDialogOpen(false);
      setSelectedMemberId('');
      showSnackbar('Miembro agregado exitosamente');
    } catch (err) {
      console.error('Error adding team member:', err);
      showSnackbar('Error al agregar el miembro');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedTeam) return;

    try {
      await teamService.removeTeamMember(selectedTeam.id, memberId);
      setTeamMembers(prev => prev.filter(member => member.id !== memberId));
      showSnackbar('Miembro removido exitosamente');
    } catch (err) {
      console.error('Error removing team member:', err);
      showSnackbar('Error al remover el miembro');
    }
  };

  const openEditDialog = (team: Team) => {
    console.log('Opening edit dialog for team:', team);
    setEditFormData({
      id: team.id,
      teamName: team.name || '',
      description: team.description || '',
      maxMembers: team.maxMembers || 10,
      teamType: team.teamType || 'general',
      location: team.location || '',
      workShift: (team.workShift as 'day' | 'morning' | 'afternoon' | 'night' | 'rotating' | 'flexible') || 'day',
      isActive: team.isActive !== false // Default to true if undefined
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (team: Team) => {
    setSelectedTeam(team);
    setDeleteDialogOpen(true);
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    return (status || '') === 'active' ? 'success' : 'default';
  };

  const getStatusLabel = (status: string) => {
    return (status || '') === 'active' ? 'Activo' : 'Inactivo';
  };

  // Check permissions
  if (user?.role !== UserRole.CONTRATISTA_ADMIN) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tiene permisos para acceder a esta sección.
        </Alert>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {showDeletedTeams ? 'Equipos Eliminados' : 'Mis Equipos'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {showDeletedTeams 
              ? 'Visualizar y restaurar equipos que han sido eliminados'
              : 'Gestione y administre sus equipos de trabajo'
            }
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant={showDeletedTeams ? 'contained' : 'outlined'}
            color={showDeletedTeams ? 'warning' : 'primary'}
            startIcon={<DeleteIcon />}
            onClick={handleToggleDeletedView}
            disabled={loading}
          >
            {showDeletedTeams ? 'Ver Activos' : 'Ver Eliminados'}
          </Button>
          <Button 
            variant="outlined" 
            startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={showDeletedTeams ? fetchDeletedTeams : handleRefresh}
            disabled={refreshing || loading}
          >
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </Button>
          <Button 
            variant="outlined" 
            color="secondary"
            onClick={() => {
              console.log('Debug - Current user:', user);
              console.log('Debug - Loading state:', loading);
              console.log('Debug - isFetching state:', isFetching);
              console.log('Debug - Teams:', teams);
              console.log('Debug - Error:', error);
            }}
          >
            Debug
          </Button>
          <Button 
            variant="outlined" 
            color="warning"
            onClick={async () => {
              try {
                console.log('Testing teamService.getMyTeams() directly...');
                const result = await teamService.getMyTeams();
                console.log('Direct service result:', result);
              } catch (err) {
                console.error('Direct service error:', err);
              }
            }}
          >
            Test Service
          </Button>
          <Button 
            variant="outlined" 
            color="info"
            onClick={() => {
              console.log('Forcing fetchTeams...');
              fetchTeams();
            }}
          >
            Force Fetch
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <TextField
            fullWidth
            placeholder="Buscar por nombre, supervisor, ubicación, tipo, rendimiento alto/bajo, tareas completadas, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchTerm('')}
                      sx={{ 
                        padding: '4px',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)'
                        }
                      }}
                    >
                      <ClearIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            helperText={searchTerm ? `${filteredTeams.length} equipo(s) encontrado(s)` : ""}
          />
          
          {/* Quick Search Suggestions */}
          {!searchTerm && (
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mr: 1, alignSelf: 'center' }}>
                Búsquedas rápidas:
              </Typography>
              {[
                'construcción',
                'seguridad', 
                'rendimiento alto',
                'tareas pendientes',
                'edificio principal'
              ].map((suggestion) => (
                <Chip
                  key={suggestion}
                  label={suggestion}
                  size="small"
                  variant="outlined"
                  clickable
                  onClick={() => setSearchTerm(suggestion)}
                  sx={{ 
                    fontSize: '0.7rem',
                    height: 24,
                    '&:hover': { bgcolor: 'primary.50' }
                  }}
                />
              ))}
            </Box>
          )}
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ display: 'flex', gap: 1, height: '100%' }}>
            <FormControl fullWidth>
              <InputLabel>Filtrar por Estado</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Filtrar por Estado"
              >
                <MenuItem value="all">Todos los estados</MenuItem>
                <MenuItem value="active">Activos</MenuItem>
                <MenuItem value="inactive">Inactivos</MenuItem>
              </Select>
            </FormControl>
            
            <Tooltip title="Búsqueda avanzada">
              <IconButton
                onClick={() => setAdvancedSearch(!advancedSearch)}
                color={advancedSearch ? 'primary' : 'default'}
                sx={{ 
                  bgcolor: advancedSearch ? 'primary.50' : 'grey.100',
                  '&:hover': { bgcolor: advancedSearch ? 'primary.100' : 'grey.200' }
                }}
              >
                <TrendingUpIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Grid>
      </Grid>

      {/* Advanced Search Panel */}
      {advancedSearch && (
        <Card sx={{ mb: 3, p: 3, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon color="primary" />
            Búsqueda Avanzada
          </Typography>
          
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Equipo</InputLabel>
                <Select
                  multiple
                  value={[]}
                  label="Tipo de Equipo"
                  renderValue={(selected) => (selected as string[]).join(', ')}
                >
                  <MenuItem value="general">General</MenuItem>
                  <MenuItem value="security">Seguridad</MenuItem>
                  <MenuItem value="maintenance">Mantenimiento</MenuItem>
                  <MenuItem value="construction">Construcción</MenuItem>
                  <MenuItem value="operations">Operaciones</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Rendimiento</InputLabel>
                <Select
                  value={performanceFilter}
                  label="Rendimiento"
                  onChange={(e) => {
                    const value = e.target.value as string;
                    setPerformanceFilter(value);
                    if (value === 'high') setSearchTerm('rendimiento alto');
                    else if (value === 'medium') setSearchTerm('rendimiento medio');
                    else if (value === 'low') setSearchTerm('rendimiento bajo');
                    else setSearchTerm('');
                  }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="high">Alto (≥80%)</MenuItem>
                  <MenuItem value="medium">Medio (60-79%)</MenuItem>
                  <MenuItem value="low">Bajo (&lt;60%)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Capacidad Min"
                type="number"
                placeholder="Ej: 5"
                onChange={(e) => {
                  if (e.target.value) {
                    setSearchTerm(`${e.target.value} miembros`);
                  }
                }}
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Valoración Min"
                type="number"
                inputProps={{ min: 1, max: 5, step: 0.1 }}
                placeholder="Ej: 4.0"
                onChange={(e) => {
                  if (e.target.value) {
                    setSearchTerm(`valoracion ${e.target.value}`);
                  }
                }}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              size="small"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPerformanceFilter('');
              }}
            >
              Limpiar Filtros
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setAdvancedSearch(false)}
            >
              Cerrar
            </Button>
          </Box>
        </Card>
      )}

      {/* Teams Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography>Cargando equipos...</Typography>
          </Box>
        </Box>
      ) : filteredTeams.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <PeopleIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No hay equipos disponibles
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchTerm ? 'No se encontraron equipos que coincidan con la búsqueda.' : 'Comience creando su primer equipo de trabajo.'}
          </Typography>
          {!searchTerm && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Crear Primer Equipo
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredTeams.map((team) => (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={team.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  borderRadius: 3,
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                {/* Header Section */}
                <Box 
                  sx={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    p: 3,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar
                        sx={{ 
                          bgcolor: 'rgba(255,255,255,0.2)', 
                          mr: 2,
                          width: 56,
                          height: 56,
                          fontSize: '1.25rem',
                          fontWeight: 'bold',
                          border: '2px solid rgba(255,255,255,0.3)'
                        }}
                      >
                        {getInitials(team.name)}
                      </Avatar>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }} noWrap>
                          {team.name}
                        </Typography>
                        <Chip 
                          label={team.isActive ? 'Activo' : 'Inactivo'}
                          size="small"
                          sx={{ 
                            bgcolor: team.isActive ? 'rgba(76, 175, 80, 0.9)' : 'rgba(255, 152, 0, 0.9)',
                            color: 'white',
                            fontWeight: 500
                          }}
                        />
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" sx={{ opacity: 0.9, lineHeight: 1.4 }}>
                      {team.description || 'Sin descripción'}
                    </Typography>
                  </Box>
                  
                  {/* Decorative background pattern */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -20,
                      right: -20,
                      width: 100,
                      height: 100,
                      borderRadius: '50%',
                      bgcolor: 'rgba(255,255,255,0.1)',
                      zIndex: 0
                    }}
                  />
                </Box>

                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  {/* Team Type and Details */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      <Chip 
                        label={getTeamTypeLabel(team.teamType || '')}
                        size="small"
                        sx={{ 
                          bgcolor: 'rgba(103, 126, 234, 0.1)',
                          color: 'primary.main',
                          fontWeight: 500
                        }}
                      />
                      {team.location && (
                        <Chip 
                          label={team.location}
                          size="small"
                          variant="outlined"
                          icon={<LocationIcon sx={{ fontSize: 14 }} />}
                          sx={{ fontWeight: 500 }}
                        />
                      )}
                      <Chip 
                        label={getWorkShiftLabel(team.workShift || '')}
                        size="small"
                        variant="outlined"
                        icon={<ScheduleIcon sx={{ fontSize: 14 }} />}
                        sx={{ fontWeight: 500 }}
                      />
                    </Box>
                  </Box>

                  {/* Performance Metrics */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                      Métricas de Rendimiento
                    </Typography>
                    
                    {/* Team Capacity */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      p: 2,
                      bgcolor: 'grey.50',
                      borderRadius: 2,
                      mb: 2
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PeopleIcon color="primary" sx={{ fontSize: 20 }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Capacidad
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {team.teamSize || team.members.length}/{team.maxMembers}
                        </Typography>
                        {team.membersFillRate !== undefined && (
                          <Chip 
                            label={`${team.membersFillRate}%`}
                            size="small"
                            color={getFillRateColor(team.membersFillRate) as any}
                            sx={{ minWidth: 50, fontWeight: 600 }}
                          />
                        )}
                      </Box>
                    </Box>

                    {/* Task Completion */}
                    {team.stats && (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        p: 2,
                        bgcolor: 'grey.50',
                        borderRadius: 2,
                        mb: 2
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TaskIcon color="primary" sx={{ fontSize: 20 }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            Tareas
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {team.stats.completedTasks}/{team.stats.totalTasks}
                          </Typography>
                          {team.completionRate !== undefined && (
                            <Chip 
                              label={`${team.completionRate}%`}
                              size="small"
                              color={getCompletionColor(team.completionRate) as any}
                              sx={{ minWidth: 50, fontWeight: 600 }}
                            />
                          )}
                        </Box>
                      </Box>
                    )}

                    {/* Rating */}
                    {team.stats?.averageRating && (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        p: 2,
                        bgcolor: 'grey.50',
                        borderRadius: 2
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <StarIcon sx={{ color: '#ffc107', fontSize: 20 }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            Valoración
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {team.stats.averageRating.toFixed(1)}/5.0
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Team Information */}
                  <Box sx={{ borderTop: 1, borderColor: 'grey.200', pt: 2 }}>
                    {team.supervisorName && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Supervisor:
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {team.supervisorName}
                        </Typography>
                      </Box>
                    )}
                    
                    {team.companyName && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <BusinessIcon sx={{ fontSize: 14 }} color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {team.companyName}
                        </Typography>
                      </Box>
                    )}
                    
                    <Typography variant="caption" color="text.secondary">
                      Creado: {team.createdAt.toLocaleDateString('es-ES')}
                    </Typography>
                  </Box>
                </CardContent>
                
                {/* Action Buttons */}
                <Box sx={{ 
                  p: 2, 
                  pt: 0,
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Ver miembros">
                      <IconButton 
                        size="small" 
                        onClick={() => handleViewMembers(team)}
                        disabled={team.status === 'inactive'}
                        sx={{ 
                          bgcolor: team.status === 'inactive' ? 'grey.200' : 'primary.main',
                          color: team.status === 'inactive' ? 'grey.500' : 'white',
                          '&:hover': { 
                            bgcolor: team.status === 'inactive' ? 'grey.200' : 'primary.dark' 
                          }
                        }}
                      >
                        <VisibilityIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    
                    {showDeletedTeams ? (
                      // Deleted teams view - only show restore option
                      <Tooltip title="Restaurar equipo">
                        <IconButton 
                          size="small" 
                          color="success"
                          onClick={() => handleReactivateTeam(team)}
                          sx={{ 
                            bgcolor: 'success.50',
                            '&:hover': { bgcolor: 'success.100' }
                          }}
                        >
                          <ActiveIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      // Active teams view - show all management options
                      <>
                        <Tooltip title="Editar equipo">
                          <IconButton 
                            size="small" 
                            onClick={() => openEditDialog(team)}
                            sx={{ 
                              bgcolor: 'grey.100',
                              '&:hover': { bgcolor: 'grey.200' }
                            }}
                          >
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        

                        <Tooltip title="Eliminar equipo (soft delete)">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => openDeleteDialog(team)}
                            sx={{ 
                              bgcolor: 'error.50',
                              '&:hover': { bgcolor: 'error.100' }
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                      ID: {team.id.slice(-6)}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontWeight: 600,
                        color: team.isActive ? 'success.main' : 'warning.main'
                      }}
                    >
                      {team.isActive ? 'ACTIVO' : 'INACTIVO'}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Floating Action Button - Only show for active teams */}
      {!showDeletedTeams && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
          onClick={() => setCreateDialogOpen(true)}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Create Team Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AddIcon color="primary" />
            <Typography variant="h6">Crear Nuevo Equipo</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* Basic Information */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
              Información Básica
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Nombre del Equipo"
                  value={createFormData.teamName}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, teamName: e.target.value }))}
                  required
                  placeholder="Ej: Equipo Construcción Alpha"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Descripción"
                  multiline
                  rows={3}
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe el propósito, objetivos y responsabilidades del equipo..."
                />
              </Grid>
            </Grid>

            {/* Team Configuration */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
              Configuración del Equipo
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Máximo de Miembros"
                  type="number"
                  value={createFormData.maxMembers}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, maxMembers: parseInt(e.target.value) || 10 }))}
                  inputProps={{ min: 1, max: 100 }}
                  helperText="Número máximo de miembros permitidos"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Equipo</InputLabel>
                  <Select
                    value={createFormData.teamType}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, teamType: e.target.value }))}
                    label="Tipo de Equipo"
                  >
                    <MenuItem value="general">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PeopleIcon sx={{ fontSize: 18 }} />
                        General
                      </Box>
                    </MenuItem>
                    <MenuItem value="security">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ActiveIcon sx={{ fontSize: 18 }} />
                        Seguridad
                      </Box>
                    </MenuItem>
                    <MenuItem value="maintenance">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WarningIcon sx={{ fontSize: 18 }} />
                        Mantenimiento
                      </Box>
                    </MenuItem>
                    <MenuItem value="construction">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AssignmentIcon sx={{ fontSize: 18 }} />
                        Construcción
                      </Box>
                    </MenuItem>
                    <MenuItem value="operations">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon sx={{ fontSize: 18 }} />
                        Operaciones
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Work Details */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
              Detalles de Trabajo
            </Typography>
            
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Ubicación de Trabajo"
                  value={createFormData.location}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Ej: Edificio Principal, Planta Norte, Sector A"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Turno de Trabajo</InputLabel>
                  <Select
                    value={createFormData.workShift}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, workShift: e.target.value }))}
                    label="Turno de Trabajo"
                    startAdornment={
                      <InputAdornment position="start">
                        <ScheduleIcon />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="day">Diurno (8:00 - 17:00)</MenuItem>
                    <MenuItem value="morning">Mañana (6:00 - 14:00)</MenuItem>
                    <MenuItem value="afternoon">Tarde (14:00 - 22:00)</MenuItem>
                    <MenuItem value="night">Nocturno (22:00 - 6:00)</MenuItem>
                    <MenuItem value="rotating">Rotativo</MenuItem>
                    <MenuItem value="flexible">Flexible</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Information Box */}
            <Box sx={{ 
              mt: 3, 
              p: 2, 
              bgcolor: 'info.50', 
              borderRadius: 2, 
              border: '1px solid',
              borderColor: 'info.200'
            }}>
              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 500 }}>
                <AssignmentIcon sx={{ fontSize: 16 }} color="info" />
                Nota: Después de crear el equipo, podrás agregar miembros y asignar tareas específicas.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={() => setCreateDialogOpen(false)}
            sx={{ mr: 1 }}
          >
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreateTeam}
            disabled={!createFormData.teamName.trim() || isCreatingTeam}
            startIcon={isCreatingTeam ? <CircularProgress size={16} /> : <AddIcon />}
            sx={{ minWidth: 140 }}
          >
            {isCreatingTeam ? 'Creando...' : 'Crear Equipo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Editar Equipo</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Nombre del Equipo"
              value={editFormData.teamName}
              onChange={(e) => setEditFormData(prev => ({ ...prev, teamName: e.target.value }))}
              sx={{ mb: 3 }}
              required
            />
            <TextField
              fullWidth
              label="Descripción"
              multiline
              rows={3}
              value={editFormData.description}
              onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe el propósito y objetivos del equipo..."
              sx={{ mb: 3 }}
            />
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Máximo de Miembros"
                  type="number"
                  value={editFormData.maxMembers}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, maxMembers: parseInt(e.target.value) || 10 }))}
                  inputProps={{ min: 1, max: 100 }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Equipo</InputLabel>
                  <Select
                    value={editFormData.teamType}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, teamType: e.target.value }))}
                    label="Tipo de Equipo"
                  >
                    <MenuItem value="general">General</MenuItem>
                    <MenuItem value="security">Seguridad</MenuItem>
                    <MenuItem value="maintenance">Mantenimiento</MenuItem>
                    <MenuItem value="construction">Construcción</MenuItem>
                    <MenuItem value="operations">Operaciones</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Ubicación"
                  value={editFormData.location}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Zona de trabajo del equipo"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Turno de Trabajo</InputLabel>
                  <Select
                    value={editFormData.workShift}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, workShift: e.target.value }))}
                    label="Turno de Trabajo"
                  >
                    <MenuItem value="day">Diurno</MenuItem>
                    <MenuItem value="morning">Mañana</MenuItem>
                    <MenuItem value="afternoon">Tarde</MenuItem>
                    <MenuItem value="night">Nocturno</MenuItem>
                    <MenuItem value="rotating">Rotativo</MenuItem>
                    <MenuItem value="flexible">Flexible</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Team Status Toggle */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                Estado del Equipo
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={editFormData.isActive}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    color="success"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {editFormData.isActive ? 'Equipo Activo' : 'Equipo Inactivo'}
                    </Typography>
                  </Box>
                }
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                {editFormData.isActive 
                  ? 'El equipo está operativo y visible para todos los miembros'
                  : 'El equipo está desactivado temporalmente. Los miembros no pueden acceder a sus funciones'
                }
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleEditTeam}
            disabled={!editFormData.teamName.trim() || isEditingTeam}
            startIcon={isEditingTeam ? <CircularProgress size={16} /> : undefined}
          >
            {isEditingTeam ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Team Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <WarningIcon color="warning" />
          <Typography variant="h6">Confirmar Desactivación de Equipo</Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ p: 1 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              ¿Está seguro de que desea desactivar el equipo <strong>"{selectedTeam?.name}"</strong>?
            </Typography>
            
            <Box sx={{ 
              p: 2, 
              bgcolor: 'info.50', 
              borderRadius: 2, 
              border: '1px solid',
              borderColor: 'info.200',
              mb: 2
            }}>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ActiveIcon color="info" sx={{ fontSize: 18 }} />
                <strong>Eliminación Suave (Soft Delete)</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • El equipo se marcará como inactivo pero no se eliminará permanentemente
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Los datos históricos y miembros se conservarán
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • El equipo aparecerá en los filtros como "Inactivo"
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Los administradores pueden reactivar el equipo más tarde
              </Typography>
            </Box>
            
            <Box sx={{ 
              p: 2, 
              bgcolor: 'warning.50', 
              borderRadius: 2, 
              border: '1px solid',
              borderColor: 'warning.200'
            }}>
              <Typography variant="body2" color="warning.dark" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon sx={{ fontSize: 16 }} />
                Los miembros del equipo no podrán acceder a funciones relacionadas con este equipo mientras esté inactivo.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ mr: 1 }}
          >
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            color="warning"
            onClick={handleDeleteTeam}
            disabled={isDeletingTeam}
            startIcon={isDeletingTeam ? <CircularProgress size={16} /> : <WarningIcon />}
            sx={{ minWidth: 140 }}
          >
            {isDeletingTeam ? 'Desactivando...' : 'Desactivar Equipo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Team Members Dialog */}
      <Dialog 
        open={membersDialogOpen} 
        onClose={() => setMembersDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              Miembros del Equipo: {selectedTeam?.name}
            </Typography>
            <Button
              startIcon={<PersonAddIcon />}
              onClick={() => setAddMemberDialogOpen(true)}
            >
              Agregar Miembro
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {teamMembers.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <PeopleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography color="text.secondary">
                No hay miembros en este equipo
              </Typography>
            </Box>
          ) : (
            <List>
              {teamMembers.map((member, index) => (
                <React.Fragment key={member.id}>
                  <ListItem>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {getInitials(member.name)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={member.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {member.email}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Chip 
                              label={getStatusLabel(member.status)}
                              color={getStatusColor(member.status) as any}
                              size="small"
                            />
                            <Chip 
                              label={`${member.complianceScore}% Cumplimiento`}
                              color={member.complianceScore >= 90 ? 'success' : member.complianceScore >= 80 ? 'warning' : 'error'}
                              size="small"
                            />
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Remover del equipo">
                        <IconButton 
                          edge="end" 
                          color="error"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <PersonRemoveIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < teamMembers.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMembersDialogOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog 
        open={addMemberDialogOpen} 
        onClose={() => setAddMemberDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Agregar Miembro al Equipo</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Seleccionar Miembro</InputLabel>
              <Select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                label="Seleccionar Miembro"
              >
                {availableMembers.map((member) => (
                  <MenuItem key={member.id} value={member.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: 'primary.main' }}>
                        {getInitials(member.name)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2">{member.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {member.email}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddMemberDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleAddMember}
            disabled={!selectedMemberId}
          >
            Agregar Miembro
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};