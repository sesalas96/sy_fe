import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Paper,
  LinearProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  People as PeopleIcon,
  ArrowBack as ArrowBackIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Email as EmailIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  Star as StarIcon,
  AccessTime as TimeIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  Verified as VerifiedIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { teamService, Team, TeamMember } from '../../services/teamService';

interface AddMemberData {
  contractorId: string;
}

interface CreateContractorData {
  fullName: string;
  cedula: string;
  companyId: string;
  polizaNumber: string;
  polizaExpiryDate: string;
}

interface EditMemberData {
  id: string;
  status: 'activo' | 'inactivo' | 'baja';
}

export const TeamMembers: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [availableContractors, setAvailableContractors] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [, setTotalMembers] = useState(0);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Add Member specific states
  const [contractorSearchTerm, setContractorSearchTerm] = useState('');
  const [contractorSearchTimer, setContractorSearchTimer] = useState<NodeJS.Timeout | null>(null);
  const [loadingContractors, setLoadingContractors] = useState(false);
  
  // Dialog states
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [createContractorDialogOpen, setCreateContractorDialogOpen] = useState(false);
  const [editMemberDialogOpen, setEditMemberDialogOpen] = useState(false);
  const [removeMemberDialogOpen, setRemoveMemberDialogOpen] = useState(false);
  
  // Form states
  const [addMemberData, setAddMemberData] = useState<AddMemberData>({
    contractorId: ''
  });
  const [createContractorData, setCreateContractorData] = useState<CreateContractorData>({
    fullName: '',
    cedula: '',
    companyId: '',
    polizaNumber: '',
    polizaExpiryDate: ''
  });
  const [editMemberData, setEditMemberData] = useState<EditMemberData>({
    id: '',
    status: 'activo'
  });
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  
  // Companies data
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([
    { id: 'particular', name: 'Particular' }
  ]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  
  // Loading states
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isCreatingContractor, setIsCreatingContractor] = useState(false);
  const [isEditingMember, setIsEditingMember] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Snackbar states
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Form validation error states
  const [createContractorErrors, setCreateContractorErrors] = useState<{
    fullName?: string;
    cedula?: string;
    companyId?: string;
    polizaNumber?: string;
    polizaExpiryDate?: string;
  }>({});

  // Check permissions
  const hasAccess = user?.role === UserRole.CONTRATISTA_ADMIN;

  useEffect(() => {
    if (!hasAccess || !teamId) return;
    
    fetchTeamData();
    fetchMembers();
  }, [hasAccess, teamId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect for search and filter changes with debouncing
  useEffect(() => {
    if (!hasAccess || !teamId) return;

    // Clear existing timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    // Set new timer for debounced search
    const timer = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
      fetchMembers();
    }, 500); // 500ms debounce

    setSearchDebounceTimer(timer);

    // Cleanup timer on unmount
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [searchTerm, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect for pagination changes
  useEffect(() => {
    if (!hasAccess || !teamId) return;
    if (currentPage > 1) { // Don't fetch on initial load (page 1)
      fetchMembers();
    }
  }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
      if (contractorSearchTimer) clearTimeout(contractorSearchTimer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTeamData = async () => {
    if (!teamId) return;
    
    try {
      const teamData = await teamService.getTeamById(teamId);
      setTeam(teamData);
    } catch (err) {
      console.error('Error fetching team data:', err);
      setError(`Error al cargar datos del equipo: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  const fetchMembers = async () => {
    if (!teamId) return;
    
    try {
      // Show general loading for initial load, search loading for subsequent searches
      if (currentPage === 1 && (searchTerm || statusFilter !== 'all')) {
        setIsSearching(true);
      } else {
        setLoading(true);
      }
      
      // Prepare filters for API call
      const filters: {
        status?: 'activo' | 'inactivo' | 'baja';
        search?: string;
      } = {};
      
      // Only add status filter if not 'all'
      if (statusFilter !== 'all') {
        filters.status = statusFilter as 'activo' | 'inactivo' | 'baja';
      }
      
      // Only add search if there's a search term
      if (searchTerm.trim()) {
        filters.search = searchTerm.trim();
      }
      
      console.log('Fetching members with filters:', filters, 'page:', currentPage);
      
      const membersData = await teamService.getTeamMembers(teamId, filters);
      setMembers(membersData);
      
      // Note: The API doesn't return pagination info yet, so we'll use the array length
      // In a real implementation, the API should return { members: [], total: number, page: number, etc. }
      setTotalMembers(membersData.length);
      
    } catch (err) {
      console.error('Error fetching team members:', err);
      setError(`Error al cargar miembros del equipo: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const fetchAvailableContractors = async (searchTerm?: string) => {
    if (!teamId) return;
    
    try {
      setLoadingContractors(true);
      
      const filters: {
        search?: string;
        excludeTeamId?: string;
      } = {
        excludeTeamId: teamId // Exclude contractors already in this team
      };
      
      if (searchTerm?.trim()) {
        filters.search = searchTerm.trim();
      }
      
      console.log('Fetching available contractors with filters:', filters);
      const available = await teamService.getAvailableContractors(filters);
      
      setAvailableContractors(available);
      console.log('Available contractors loaded:', available.length);
    } catch (err) {
      console.error('Error fetching available contractors:', err);
      showSnackbar('Error al cargar contratistas disponibles');
    } finally {
      setLoadingContractors(false);
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'activo':
        return 'success';
      case 'inactive':
      case 'inactivo':
        return 'warning';
      case 'on_leave':
      case 'baja':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      active: 'Activo',
      activo: 'Activo',
      inactive: 'Inactivo',
      inactivo: 'Inactivo',
      on_leave: 'Baja',
      baja: 'Baja'
    };
    return statusLabels[status] || status;
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 75) return 'warning';
    return 'error';
  };

  const getCertificationStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'success';
      case 'expiring_soon':
        return 'warning';
      case 'expired':
        return 'error';
      default:
        return 'default';
    }
  };

  const getCertificationStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <VerifiedIcon sx={{ fontSize: 16 }} />;
      case 'expiring_soon':
        return <WarningIcon sx={{ fontSize: 16 }} />;
      case 'expired':
        return <ErrorIcon sx={{ fontSize: 16 }} />;
      default:
        return <BadgeIcon sx={{ fontSize: 16 }} />;
    }
  };

  const getCourseStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'not_started':
        return 'error';
      default:
        return 'default';
    }
  };

  // Since we're now doing server-side filtering, we don't need client-side filtering
  const filteredMembers = members;

  const handleAddMember = async () => {
    if (!teamId || !addMemberData.contractorId) return;
    
    try {
      setIsAddingMember(true);
      await teamService.addTeamMember(teamId, { contractorId: addMemberData.contractorId });
      
      // Refresh members list
      await fetchMembers();
      
      // Reset form and close dialog
      setAddMemberData({ contractorId: '' });
      setAddMemberDialogOpen(false);
      showSnackbar('Miembro agregado exitosamente al equipo');
    } catch (err) {
      console.error('Error adding team member:', err);
      showSnackbar(`Error al agregar miembro: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleCreateAndAddContractor = async () => {
    if (!teamId || !createContractorData.fullName || !createContractorData.cedula || !createContractorData.companyId) {
      showSnackbar('Por favor complete los campos requeridos (nombre completo, cédula, empresa)');
      return;
    }
    
    try {
      setIsCreatingContractor(true);
      
      // Prepare poliza expiry date (default to 1 year from now if not provided)
      const expiryDate = createContractorData.polizaExpiryDate || 
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      
      // Step 1: Create the new contractor using exact API structure
      console.log('Creating new contractor:', createContractorData);
      const contractorPayload = {
        fullName: createContractorData.fullName,
        cedula: createContractorData.cedula,
        companyId: createContractorData.companyId,
        polizaINS: {
          number: createContractorData.polizaNumber || `POL-${Date.now()}`,
          expiryDate: expiryDate
        }
      };
      
      console.log('API Payload:', contractorPayload);
      const newContractor = await teamService.createContractor(contractorPayload);
      
      console.log('New contractor created:', newContractor);
      
      // Step 2: Add the new contractor to the team
      await teamService.addTeamMember(teamId, { contractorId: newContractor.id });
      
      // Step 3: Refresh members list
      await fetchMembers();
      
      // Step 4: Reset form and close dialog
      setCreateContractorData({
        fullName: '',
        cedula: '',
        companyId: '',
        polizaNumber: '',
        polizaExpiryDate: ''
      });
      setCreateContractorErrors({});
      setCreateContractorDialogOpen(false);
      
      showSnackbar(`Contratista ${newContractor.name} creado y agregado al equipo exitosamente`);
    } catch (err) {
      console.error('Error creating and adding contractor:', err);
      
      // Parse API validation errors - handle different error response formats
      let errorData: any = null;
      
      // Try to extract error data from different formats
      if (err instanceof Error) {
        try {
          // Case 1: Error message is JSON string
          errorData = JSON.parse(err.message);
        } catch {
          // Case 2: Check if the error has response data (from fetch API)
          if ((err as any).response) {
            try {
              errorData = JSON.parse((err as any).response);
            } catch {
              errorData = (err as any).response;
            }
          }
          // Case 3: Check if the error itself is already parsed JSON
          else if (typeof err === 'object' && (err as any).error) {
            errorData = err;
          }
        }
      }
      
      // Handle structured validation errors
      if (errorData && errorData.error === 'Validation failed' && errorData.details) {
        const fieldErrors: { [key: string]: string } = {};
        errorData.details.forEach((detail: { field: string; message: string }) => {
          fieldErrors[detail.field] = detail.message;
        });
        setCreateContractorErrors(fieldErrors);
        showSnackbar('Por favor corrija los errores en el formulario');
        return;
      }
      
      // Clear any previous field errors and show generic error
      setCreateContractorErrors({});
      showSnackbar(`Error al crear contratista: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setIsCreatingContractor(false);
    }
  };

  // Fetch companies for dropdown
  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const companiesData = await teamService.getCompanies();
      
      // Add "Particular" as the first option (avoid duplication)
      const companiesWithParticular = [
        { id: 'particular', name: 'Particular' },
        ...companiesData.filter(company => company.id !== 'particular')
      ];
      
      setCompanies(companiesWithParticular);
      console.log('Companies loaded with Particular:', companiesWithParticular);
    } catch (err) {
      console.error('Error loading companies:', err);
      showSnackbar('Error al cargar las empresas');
    } finally {
      setLoadingCompanies(false);
    }
  };

  const openCreateContractorDialog = async () => {
    // Pre-fill company ID with "Particular" as default
    setCreateContractorData({
      fullName: '',
      cedula: '',
      companyId: 'particular', // Default to "Particular"
      polizaNumber: '',
      polizaExpiryDate: ''
    });
    // Clear any previous validation errors
    setCreateContractorErrors({});
    
    // Fetch companies if not already loaded
    if (companies.length === 0) {
      await fetchCompanies();
    }
    
    setCreateContractorDialogOpen(true);
  };

  const handleEditMember = async () => {
    if (!teamId || !editMemberData.id) return;
    
    try {
      setIsEditingMember(true);
      await teamService.updateTeamMember(teamId, editMemberData.id, { 
        status: editMemberData.status 
      });
      
      // Update local state
      setMembers(prev => prev.map(m => 
        m.id === editMemberData.id 
          ? { ...m, status: editMemberData.status === 'activo' ? 'active' : editMemberData.status === 'inactivo' ? 'inactive' : 'on_leave' }
          : m
      ));
      
      setEditMemberDialogOpen(false);
      showSnackbar('Estado del miembro actualizado exitosamente');
    } catch (err) {
      console.error('Error updating team member:', err);
      showSnackbar(`Error al actualizar miembro: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setIsEditingMember(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!teamId || !selectedMember) return;
    
    try {
      setIsRemovingMember(true);
      await teamService.removeTeamMember(teamId, selectedMember.id);
      
      // Remove from local state
      setMembers(prev => prev.filter(m => m.id !== selectedMember.id));
      
      setRemoveMemberDialogOpen(false);
      setSelectedMember(null);
      showSnackbar('Miembro removido del equipo exitosamente');
    } catch (err) {
      console.error('Error removing team member:', err);
      showSnackbar(`Error al remover miembro: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setIsRemovingMember(false);
    }
  };

  const openAddMemberDialog = async () => {
    // Reset search and load initial contractors
    setContractorSearchTerm('');
    setAddMemberData({ contractorId: '' });
    await fetchAvailableContractors();
    setAddMemberDialogOpen(true);
  };
  
  // Handle contractor search with debouncing
  const handleContractorSearch = (searchValue: string) => {
    setContractorSearchTerm(searchValue);
    
    // Clear existing timer
    if (contractorSearchTimer) {
      clearTimeout(contractorSearchTimer);
    }
    
    // Set new timer for debounced search
    const timer = setTimeout(() => {
      fetchAvailableContractors(searchValue);
    }, 300); // 300ms debounce for faster response
    
    setContractorSearchTimer(timer);
  };

  const openEditMemberDialog = (member: TeamMember) => {
    setEditMemberData({
      id: member.id,
      status: member.status === 'active' ? 'activo' : member.status === 'inactive' ? 'inactivo' : 'baja'
    });
    setSelectedMember(member);
    setEditMemberDialogOpen(true);
  };

  const openRemoveMemberDialog = (member: TeamMember) => {
    setSelectedMember(member);
    setRemoveMemberDialogOpen(true);
  };

  if (!hasAccess) {
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton 
            onClick={() => navigate('/my-teams')}
            sx={{ 
              bgcolor: 'grey.100',
              '&:hover': { bgcolor: 'grey.200' }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" gutterBottom>
              Miembros del Equipo
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {team ? `${team.name} - Gestionar miembros del equipo` : 'Cargando información del equipo...'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={openAddMemberDialog}
            disabled={loading}
          >
            Agregar Miembro
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AddIcon />}
            onClick={openCreateContractorDialog}
            disabled={loading}
          >
            Crear Nuevo Contratista
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={async () => {
              try {
                console.log('Testing create contractor API...');
                const testContractor = {
                  fullName: `Test Contractor ${Date.now()}`,
                  cedula: `TEST-${Date.now()}`,
                  companyId: team?.companyId || 'test-company-id',
                  polizaINS: {
                    number: `POL-TEST-${Date.now()}`,
                    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
                  }
                };
                console.log('Creating test contractor:', testContractor);
                const result = await teamService.createContractor(testContractor);
                console.log('Create contractor API Response:', result);
                showSnackbar(`Test successful. Created contractor: ${result.name}`);
              } catch (err) {
                console.error('Create contractor API test failed:', err);
                showSnackbar(`API test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
              }
            }}
          >
            Test Create API
          </Button>
        </Box>
      </Box>

      {/* Team Info Card */}
      {team && (
        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid size={{ xs: 12, md: 8 }}>
                <Typography variant="h6" gutterBottom>
                  {team.name}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                  {team.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Chip 
                    icon={<PeopleIcon />} 
                    label={`${members.length}/${team.maxMembers || 'Sin límite'} miembros`}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                  <Chip 
                    icon={<BusinessIcon />} 
                    label={team.companyName || 'Sin empresa'}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {members.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Miembros Totales
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <TextField
            fullWidth
            placeholder="Buscar por nombre, email, empresa o ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              // Clear existing timer when user types
              if (searchDebounceTimer) {
                clearTimeout(searchDebounceTimer);
                setSearchDebounceTimer(null);
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {isSearching ? <CircularProgress size={20} /> : <SearchIcon />}
                </InputAdornment>
              )
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormControl fullWidth>
            <InputLabel>Estado</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Estado"
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="active">Activos</MenuItem>
              <MenuItem value="inactive">Inactivos</MenuItem>
              <MenuItem value="on_leave">Baja</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Members List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredMembers.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <PeopleIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {members.length === 0 ? 'Sin miembros en el equipo' : 'No se encontraron miembros'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {members.length === 0 
              ? 'Comience agregando miembros a este equipo'
              : 'Intente ajustar los filtros de búsqueda'
            }
          </Typography>
          {members.length === 0 && (
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={openAddMemberDialog}
            >
              Agregar Primer Miembro
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredMembers.map((member) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={member.id}>
              <Card sx={{ 
                height: '100%',
                '&:hover': { 
                  boxShadow: 6,
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.2s ease-in-out'
              }}>
                <CardContent>
                  {/* Member Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                      sx={{ 
                        width: 48, 
                        height: 48, 
                        mr: 2,
                        bgcolor: getStatusColor(member.status) + '.main'
                      }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="h6" noWrap>
                        {member.name}
                      </Typography>
                      <Chip 
                        size="small"
                        label={getStatusLabel(member.status)}
                        color={getStatusColor(member.status)}
                      />
                    </Box>
                  </Box>

                  {/* Member Info */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <EmailIcon sx={{ fontSize: 16 }} color="action" />
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {member.email}
                      </Typography>
                    </Box>
                    {member.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <PhoneIcon sx={{ fontSize: 16 }} color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {member.phone}
                        </Typography>
                      </Box>
                    )}
                    {member.cedula && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <BadgeIcon sx={{ fontSize: 16 }} color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Cédula: {member.cedula}
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <BusinessIcon sx={{ fontSize: 16 }} color="action" />
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {member.company}
                      </Typography>
                    </Box>
                    {member.lastLogin && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <TimeIcon sx={{ fontSize: 16 }} color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Último acceso: {member.lastLogin.toLocaleDateString('es-ES')}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Certifications */}
                  {member.certifications && member.certifications.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                        Certificaciones ({member.certifications.length})
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {member.certifications.slice(0, 2).map((cert, index) => (
                          <Chip
                            key={index}
                            icon={getCertificationStatusIcon(cert.status)}
                            label={cert.name}
                            size="small"
                            color={getCertificationStatusColor(cert.status)}
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        ))}
                        {member.certifications.length > 2 && (
                          <Chip
                            label={`+${member.certifications.length - 2} más`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* Courses */}
                  {member.courses && member.courses.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                        Cursos ({member.courses.length})
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {member.courses.slice(0, 2).map((course, index) => (
                          <Chip
                            key={index}
                            icon={<SchoolIcon sx={{ fontSize: 14 }} />}
                            label={`${course.courseName}${course.score ? ` (${course.score}%)` : ''}`}
                            size="small"
                            color={getCourseStatusColor(course.status)}
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        ))}
                        {member.courses.length > 2 && (
                          <Chip
                            label={`+${member.courses.length - 2} más`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* Review Stats */}
                  {member.reviewStats && member.reviewStats.totalReviews > 0 && (
                    <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <StarIcon sx={{ color: '#ffc107', fontSize: 16 }} />
                          <Typography variant="caption" sx={{ fontWeight: 500 }}>
                            {member.reviewStats.averageRating.toFixed(1)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ({member.reviewStats.totalReviews} reseñas)
                          </Typography>
                        </Box>
                        {member.reviewStats.wouldHireAgainPercentage > 0 && (
                          <Typography variant="caption" color="success.main" sx={{ fontWeight: 500 }}>
                            {member.reviewStats.wouldHireAgainPercentage}% recomendado
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* Performance Metrics */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Cumplimiento
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {member.complianceScore}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={member.complianceScore} 
                      color={getComplianceColor(member.complianceScore)}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  {/* Stats */}
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid size={{ xs: 4 }}>
                      <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="h6" color="primary">
                          {member.certifications?.length || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Certificaciones
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="h6" color="success.main">
                          {member.courses?.length || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Cursos
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="h6" color="warning.main">
                          {member.reviewStats?.totalReviews || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Reseñas
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                    <Tooltip title="Editar estado">
                      <IconButton 
                        size="small"
                        onClick={() => openEditMemberDialog(member)}
                        sx={{ 
                          bgcolor: 'primary.50',
                          '&:hover': { bgcolor: 'primary.100' }
                        }}
                      >
                        <EditIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remover del equipo">
                      <IconButton 
                        size="small"
                        color="error"
                        onClick={() => openRemoveMemberDialog(member)}
                        sx={{ 
                          bgcolor: 'error.50',
                          '&:hover': { bgcolor: 'error.100' }
                        }}
                      >
                        <PersonRemoveIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add Member Dialog */}
      <Dialog 
        open={addMemberDialogOpen} 
        onClose={() => setAddMemberDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PersonAddIcon color="primary" />
            <Typography variant="h6">Agregar Miembro al Equipo</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* Search Field */}
            <TextField
              fullWidth
              placeholder="Buscar contratista por nombre, email, cédula..."
              value={contractorSearchTerm}
              onChange={(e) => handleContractorSearch(e.target.value)}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {loadingContractors ? <CircularProgress size={20} /> : <SearchIcon />}
                  </InputAdornment>
                )
              }}
            />

            {/* Contractors List */}
            {loadingContractors ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : availableContractors.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                {contractorSearchTerm 
                  ? `No se encontraron contratistas que coincidan con "${contractorSearchTerm}"`
                  : 'No hay contratistas disponibles para agregar al equipo.'
                }
              </Alert>
            ) : (
              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                  {availableContractors.length} contratista{availableContractors.length !== 1 ? 's' : ''} disponible{availableContractors.length !== 1 ? 's' : ''}
                </Typography>
                <List sx={{ width: '100%' }}>
                  {availableContractors.map((contractor, index) => (
                    <React.Fragment key={contractor.id}>
                      <ListItem
                        onClick={() => setAddMemberData({ contractorId: contractor.id })}
                        sx={{
                          cursor: 'pointer',
                          bgcolor: addMemberData.contractorId === contractor.id ? 'primary.50' : 'transparent',
                          borderRadius: 2,
                          mb: 1,
                          border: addMemberData.contractorId === contractor.id ? '2px solid' : '1px solid transparent',
                          borderColor: addMemberData.contractorId === contractor.id ? 'primary.main' : 'transparent',
                          '&:hover': {
                            bgcolor: addMemberData.contractorId === contractor.id ? 'primary.100' : 'grey.100'
                          }
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar 
                            sx={{ 
                              bgcolor: addMemberData.contractorId === contractor.id ? 'primary.main' : getStatusColor(contractor.status) + '.main',
                              width: 40,
                              height: 40
                            }}
                          >
                            {contractor.name.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                {contractor.name}
                              </Typography>
                              <Chip 
                                size="small"
                                label={getStatusLabel(contractor.status)}
                                color={getStatusColor(contractor.status)}
                              />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <EmailIcon sx={{ fontSize: 14 }} />
                                <Typography variant="body2" color="text.secondary">
                                  {contractor.email}
                                </Typography>
                              </Box>
                              {contractor.phone && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <PhoneIcon sx={{ fontSize: 14 }} />
                                  <Typography variant="body2" color="text.secondary">
                                    {contractor.phone}
                                  </Typography>
                                </Box>
                              )}
                              {contractor.cedula && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <BadgeIcon sx={{ fontSize: 14 }} />
                                  <Typography variant="body2" color="text.secondary">
                                    Cédula: {contractor.cedula}
                                  </Typography>
                                </Box>
                              )}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <BusinessIcon sx={{ fontSize: 14 }} />
                                <Typography variant="body2" color="text.secondary">
                                  {contractor.company}
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                        <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                          <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                            {contractor.complianceScore}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Cumplimiento
                          </Typography>
                        </Box>
                      </ListItem>
                      {index < availableContractors.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Box>
            )}

            {/* Selected Contractor Summary */}
            {addMemberData.contractorId && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'success.50', borderRadius: 2, border: '1px solid', borderColor: 'success.200' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'success.main', mb: 1 }}>
                  Contratista Seleccionado
                </Typography>
                {(() => {
                  const selected = availableContractors.find(c => c.id === addMemberData.contractorId);
                  return selected ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'success.main' }}>
                        {selected.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {selected.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {selected.email} • {selected.company}
                        </Typography>
                      </Box>
                    </Box>
                  ) : null;
                })()}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setAddMemberDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleAddMember}
            disabled={!addMemberData.contractorId || isAddingMember}
            startIcon={isAddingMember ? <CircularProgress size={16} /> : <PersonAddIcon />}
            sx={{ minWidth: 140 }}
          >
            {isAddingMember ? 'Agregando...' : 'Agregar Miembro'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog 
        open={editMemberDialogOpen} 
        onClose={() => setEditMemberDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Editar Estado del Miembro</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {selectedMember && (
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar>{selectedMember.name.charAt(0)}</Avatar>
                  <Box>
                    <Typography variant="subtitle1">{selectedMember.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedMember.email}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
            
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={editMemberData.status}
                onChange={(e) => setEditMemberData(prev => ({ 
                  ...prev, 
                  status: e.target.value as 'activo' | 'inactivo' | 'baja'
                }))}
                label="Estado"
              >
                <MenuItem value="activo">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ActiveIcon color="success" />
                    Activo
                  </Box>
                </MenuItem>
                <MenuItem value="inactivo">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InactiveIcon color="warning" />
                    Inactivo
                  </Box>
                </MenuItem>
                <MenuItem value="baja">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InactiveIcon color="error" />
                    Baja
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditMemberDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleEditMember}
            disabled={isEditingMember}
            startIcon={isEditingMember ? <CircularProgress size={16} /> : <EditIcon />}
          >
            {isEditingMember ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Member Dialog */}
      <Dialog 
        open={removeMemberDialogOpen} 
        onClose={() => setRemoveMemberDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmar Remoción</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Esta acción removerá al miembro del equipo. ¿Está seguro de continuar?
          </Alert>
          {selectedMember && (
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar>{selectedMember.name.charAt(0)}</Avatar>
                <Box>
                  <Typography variant="subtitle1">{selectedMember.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedMember.email} - {selectedMember.company}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveMemberDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleRemoveMember}
            disabled={isRemovingMember}
            startIcon={isRemovingMember ? <CircularProgress size={16} /> : <PersonRemoveIcon />}
          >
            {isRemovingMember ? 'Removiendo...' : 'Remover Miembro'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Contractor Dialog */}
      <Dialog 
        open={createContractorDialogOpen} 
        onClose={() => {
          setCreateContractorDialogOpen(false);
          setCreateContractorErrors({});
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AddIcon color="primary" />
            <Typography variant="h6">Crear Nuevo Contratista</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              Se creará un nuevo contratista y se agregará automáticamente al equipo.
            </Alert>
            
            <Grid container spacing={2}>
              {/* Basic Information */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                  Información Personal
                </Typography>
              </Grid>
              
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Nombre Completo *"
                  value={createContractorData.fullName}
                  onChange={(e) => {
                    setCreateContractorData(prev => ({ ...prev, fullName: e.target.value }));
                    // Clear field error when user starts typing
                    if (createContractorErrors.fullName) {
                      setCreateContractorErrors(prev => ({ ...prev, fullName: undefined }));
                    }
                  }}
                  error={!createContractorData.fullName || !!createContractorErrors.fullName}
                  helperText={createContractorErrors.fullName || (!createContractorData.fullName ? 'Campo requerido' : 'Ej: Juan Carlos Pérez López')}
                  placeholder="Ingrese nombre y apellidos completos"
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Cédula *"
                  value={createContractorData.cedula}
                  onChange={(e) => {
                    setCreateContractorData(prev => ({ ...prev, cedula: e.target.value }));
                    // Clear field error when user starts typing
                    if (createContractorErrors.cedula) {
                      setCreateContractorErrors(prev => ({ ...prev, cedula: undefined }));
                    }
                  }}
                  error={!createContractorData.cedula || !!createContractorErrors.cedula}
                  helperText={createContractorErrors.cedula || (!createContractorData.cedula ? 'Campo requerido' : 'Debe tener entre 9-12 dígitos')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl 
                  fullWidth 
                  error={!createContractorData.companyId || !!createContractorErrors.companyId}
                >
                  <InputLabel>Espacios de Trabajo *</InputLabel>
                  <Select
                    value={createContractorData.companyId}
                    onChange={(e) => {
                      setCreateContractorData(prev => ({ ...prev, companyId: e.target.value }));
                      // Clear field error when user selects
                      if (createContractorErrors.companyId) {
                        setCreateContractorErrors(prev => ({ ...prev, companyId: undefined }));
                      }
                    }}
                    label="Espacios de Trabajo *"
                    startAdornment={
                      <InputAdornment position="start">
                        <BusinessIcon />
                      </InputAdornment>
                    }
                    disabled={loadingCompanies}
                  >
                    {loadingCompanies ? (
                      <MenuItem disabled>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Cargando empresas...
                      </MenuItem>
                    ) : companies.length === 0 ? (
                      <MenuItem disabled>No hay empresas disponibles</MenuItem>
                    ) : (
                      companies.map((company) => (
                        <MenuItem key={company.id} value={company.id}>
                          {company.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  <FormHelperText>
                    {createContractorErrors.companyId || 
                     (!createContractorData.companyId ? 'Campo requerido' : 
                      companies.find(c => c.id === createContractorData.companyId)?.name || 'Espacios de Trabajo seleccionada')}
                  </FormHelperText>
                </FormControl>
              </Grid>

              {/* Poliza Information */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, mt: 2, color: 'primary.main' }}>
                  Póliza INS
                </Typography>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Número de Póliza"
                  value={createContractorData.polizaNumber}
                  onChange={(e) => {
                    setCreateContractorData(prev => ({ ...prev, polizaNumber: e.target.value }));
                    // Clear field error when user starts typing
                    if (createContractorErrors.polizaNumber) {
                      setCreateContractorErrors(prev => ({ ...prev, polizaNumber: undefined }));
                    }
                  }}
                  error={!!createContractorErrors.polizaNumber}
                  placeholder="POL-2024-001"
                  helperText={createContractorErrors.polizaNumber || "Si no se especifica, se generará automáticamente"}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AssignmentIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Fecha de Vencimiento"
                  type="date"
                  value={createContractorData.polizaExpiryDate ? createContractorData.polizaExpiryDate.split('T')[0] : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value).toISOString() : '';
                    setCreateContractorData(prev => ({ ...prev, polizaExpiryDate: date }));
                    // Clear field error when user starts typing
                    if (createContractorErrors.polizaExpiryDate) {
                      setCreateContractorErrors(prev => ({ ...prev, polizaExpiryDate: undefined }));
                    }
                  }}
                  error={!!createContractorErrors.polizaExpiryDate}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  helperText={createContractorErrors.polizaExpiryDate || "Si no se especifica, se establecerá 1 año desde hoy"}
                />
              </Grid>
            </Grid>

            {/* Summary */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Resumen
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Se creará el contratista <strong>{createContractorData.fullName || 'Sin nombre'}</strong>
                {createContractorData.cedula && <> con cédula <strong>{createContractorData.cedula}</strong></>}
                {createContractorData.companyId && (
                  <> de la empresa <strong>{companies.find(c => c.id === createContractorData.companyId)?.name || 'Espacios de Trabajo seleccionada'}</strong></>
                )}
                {team && <> y se agregará automáticamente al equipo <strong>{team.name}</strong></>}.
              </Typography>
              {createContractorData.polizaNumber && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Póliza INS: <strong>{createContractorData.polizaNumber}</strong>
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => {
            setCreateContractorDialogOpen(false);
            setCreateContractorErrors({});
          }}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreateAndAddContractor}
            disabled={!createContractorData.fullName || !createContractorData.cedula || !createContractorData.companyId || isCreatingContractor}
            startIcon={isCreatingContractor ? <CircularProgress size={16} /> : <AddIcon />}
            sx={{ minWidth: 180 }}
          >
            {isCreatingContractor ? 'Creando...' : 'Crear y Agregar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};