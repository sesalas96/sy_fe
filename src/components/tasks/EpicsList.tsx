import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Button,
  IconButton,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
  LinearProgress,
  Alert,
  Snackbar,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  AccountTree as EpicIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Schedule as ScheduleIcon,
  Assignment as TaskIcon,
  Group as TeamIcon
} from '@mui/icons-material';
import { Epic, CreateEpicData, Task } from '../../types/tasks';
import { taskService } from '../../services/taskService';
import { teamService } from '../../services/teamService';

interface EpicsListProps {
  onEpicSelect: (epic: Epic) => void;
  onTaskSelect: (task: Task) => void;
}

export const EpicsList: React.FC<EpicsListProps> = ({ onEpicSelect, onTaskSelect }) => {
  // State
  const [epics, setEpics] = useState<Epic[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Table state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Dialog states
  const [createEpicOpen, setCreateEpicOpen] = useState(false);
  const [editEpicOpen, setEditEpicOpen] = useState(false);
  const [selectedEpic, setSelectedEpic] = useState<Epic | null>(null);
  
  // Form states
  const [createEpicData, setCreateEpicData] = useState<CreateEpicData>({
    title: '',
    description: '',
    team: '',
    priority: 'medium',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    estimatedHours: 0,
    color: '#4ECDC4',
    tags: []
  });
  
  const [editEpicData, setEditEpicData] = useState<CreateEpicData>({
    title: '',
    description: '',
    team: '',
    priority: 'medium',
    dueDate: new Date(Date.now() + 30 * 24 * 60 + 60 * 1000),
    estimatedHours: 0,
    color: '#4ECDC4',
    tags: []
  });
  
  // Menu states
  const [epicMenuAnchor, setEpicMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedEpicForMenu, setSelectedEpicForMenu] = useState<Epic | null>(null);
  
  // Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Epic tasks toggle
  const [expandedEpic, setExpandedEpic] = useState<string | null>(null);
  const [epicTasks, setEpicTasks] = useState<{ [epicId: string]: Task[] }>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [epicsData, teamsData] = await Promise.all([
        taskService.getEpics(),
        teamService.getTeams()
      ]);
      
      setEpics(epicsData);
      setTeams(teamsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(`Error al cargar datos: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchEpicTasks = async (epicId: string) => {
    try {
      const tasks = await taskService.getTasks({ epicId: [epicId] });
      setEpicTasks(prev => ({
        ...prev,
        [epicId]: tasks
      }));
    } catch (err) {
      console.error('Error fetching epic tasks:', err);
      showSnackbar(`Error al cargar tareas del epic: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  const handleCreateEpic = async () => {
    if (!createEpicData.title || !createEpicData.team) {
      showSnackbar('Por favor complete los campos requeridos');
      return;
    }

    try {
      const newEpic = await taskService.createEpic(createEpicData);
      setEpics(prev => [...prev, newEpic]);
      
      setCreateEpicOpen(false);
      setCreateEpicData(prev => ({
        ...prev,
        title: '',
        description: '',
        team: ''
      }));
      
      showSnackbar('Epic creado exitosamente');
    } catch (err) {
      console.error('Error creating epic:', err);
      showSnackbar(`Error al crear epic: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  const handleEditEpic = async () => {
    if (!selectedEpic || !editEpicData.title || !editEpicData.team) {
      showSnackbar('Por favor complete los campos requeridos');
      return;
    }

    try {
      const updatedEpic = await taskService.updateEpic(selectedEpic.id, {
        title: editEpicData.title,
        description: editEpicData.description,
        teamId: editEpicData.team
      });
      
      setEpics(prev => prev.map(epic => epic.id === selectedEpic.id ? updatedEpic : epic));
      
      setEditEpicOpen(false);
      setSelectedEpic(null);
      
      showSnackbar('Epic actualizado exitosamente');
    } catch (err) {
      console.error('Error updating epic:', err);
      showSnackbar(`Error al actualizar epic: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  const handleDeleteEpic = async (epicId: string) => {
    try {
      await taskService.deleteEpic(epicId);
      setEpics(prev => prev.filter(epic => epic.id !== epicId));
      
      showSnackbar('Epic eliminado exitosamente');
      setEpicMenuAnchor(null);
      setSelectedEpicForMenu(null);
    } catch (err) {
      console.error('Error deleting epic:', err);
      showSnackbar(`Error al eliminar epic: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  const handleEpicToggle = async (epic: Epic) => {
    if (expandedEpic === epic.id) {
      setExpandedEpic(null);
    } else {
      setExpandedEpic(epic.id);
      if (!epicTasks[epic.id]) {
        await fetchEpicTasks(epic.id);
      }
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const getStatusColor = (status: Epic['status']) => {
    switch (status) {
      case 'planning': return 'default';
      case 'active': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: Epic['status']) => {
    switch (status) {
      case 'planning': return 'Planificación';
      case 'active': return 'Activo';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Cargando epics...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <EpicIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Epics
          </Typography>
          <Chip
            label={`${epics.length} epics`}
            color="primary"
            variant="outlined"
          />
        </Box>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateEpicOpen(true)}
        >
          Nuevo Epic
        </Button>
      </Box>

      {/* Epics Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Título</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Equipo</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Progreso</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Tareas</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Fechas</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {epics
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((epic) => (
                  <React.Fragment key={epic.id}>
                    <TableRow hover sx={{ cursor: 'pointer' }}>
                      <TableCell onClick={() => onEpicSelect(epic)}>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {epic.title}
                          </Typography>
                          {epic.description && (
                            <Typography variant="caption" color="text.secondary">
                              {epic.description.length > 80 ? `${epic.description.substring(0, 80)}...` : epic.description}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(epic.status)}
                          size="small"
                          color={getStatusColor(epic.status)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TeamIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {epic.teamName || 'Sin equipo'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={epic.progress}
                            sx={{ width: 60, height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="caption">
                            {epic.progress}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<TaskIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEpicToggle(epic);
                          }}
                          variant={expandedEpic === epic.id ? "contained" : "outlined"}
                        >
                          {epic.tasks?.length || 0} tareas
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Box>
                          {epic.startDate && (
                            <Typography variant="caption" display="block">
                              Inicio: {epic.startDate.toLocaleDateString()}
                            </Typography>
                          )}
                          {epic.endDate && (
                            <Typography variant="caption" display="block">
                              Fin: {epic.endDate.toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEpicMenuAnchor(e.currentTarget);
                            setSelectedEpicForMenu(epic);
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded Epic Tasks */}
                    {expandedEpic === epic.id && epicTasks[epic.id] && (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                              Tareas del Epic: {epic.title}
                            </Typography>
                            {epicTasks[epic.id].length > 0 ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {epicTasks[epic.id].map((task) => (
                                  <Box
                                    key={task.id}
                                    sx={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      p: 1,
                                      backgroundColor: 'white',
                                      borderRadius: 1,
                                      cursor: 'pointer',
                                      '&:hover': { backgroundColor: 'grey.100' }
                                    }}
                                    onClick={() => onTaskSelect(task)}
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {task.title}
                                      </Typography>
                                      <Chip
                                        label={
                                          task.status === 'todo' ? 'Por Hacer' :
                                          task.status === 'in_progress' ? 'En Progreso' :
                                          task.status === 'review' ? 'En Revisión' : 'Completado'
                                        }
                                        size="small"
                                        color={
                                          task.status === 'todo' ? 'default' :
                                          task.status === 'in_progress' ? 'info' :
                                          task.status === 'review' ? 'warning' : 'success'
                                        }
                                      />
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Avatar
                                        sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
                                        src={task.assigneeAvatar}
                                      >
                                        {task.assignedToName?.charAt(0)}
                                      </Avatar>
                                      <Typography variant="caption">
                                        {task.assignedToName || 'Sin asignar'}
                                      </Typography>
                                    </Box>
                                  </Box>
                                ))}
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No hay tareas en este epic
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={epics.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>

      {/* Create Epic Dialog */}
      <Dialog open={createEpicOpen} onClose={() => setCreateEpicOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Crear Nuevo Epic</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Título *"
              value={createEpicData.title}
              onChange={(e) => setCreateEpicData(prev => ({ ...prev, title: e.target.value }))}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Descripción"
              value={createEpicData.description}
              onChange={(e) => setCreateEpicData(prev => ({ ...prev, description: e.target.value }))}
            />
            <FormControl fullWidth>
              <InputLabel>Equipo *</InputLabel>
              <Select
                value={createEpicData.team}
                onChange={(e) => setCreateEpicData(prev => ({ ...prev, teamId: e.target.value }))}
                label="Equipo *"
              >
                {teams.map((team) => (
                  <MenuItem key={team.id} value={team.id}>
                    {team.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateEpicOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateEpic}>
            Crear Epic
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Epic Dialog */}
      <Dialog open={editEpicOpen} onClose={() => setEditEpicOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Epic</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Título *"
              value={editEpicData.title}
              onChange={(e) => setEditEpicData(prev => ({ ...prev, title: e.target.value }))}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Descripción"
              value={editEpicData.description}
              onChange={(e) => setEditEpicData(prev => ({ ...prev, description: e.target.value }))}
            />
            <FormControl fullWidth>
              <InputLabel>Equipo *</InputLabel>
              <Select
                value={editEpicData.team}
                onChange={(e) => setEditEpicData(prev => ({ ...prev, team: e.target.value }))}
                label="Equipo *"
              >
                {teams.map((team) => (
                  <MenuItem key={team.id} value={team.id}>
                    {team.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditEpicOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleEditEpic}>
            Actualizar Epic
          </Button>
        </DialogActions>
      </Dialog>

      {/* Epic Menu */}
      <Menu
        anchorEl={epicMenuAnchor}
        open={Boolean(epicMenuAnchor)}
        onClose={() => setEpicMenuAnchor(null)}
      >
        <MenuItem onClick={() => {
          if (selectedEpicForMenu) {
            onEpicSelect(selectedEpicForMenu);
          }
          setEpicMenuAnchor(null);
        }}>
          <ViewIcon sx={{ mr: 1 }} />
          Ver Kanban
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedEpicForMenu) {
            setSelectedEpic(selectedEpicForMenu);
            setEditEpicData(prev => ({
              ...prev,
              title: selectedEpicForMenu.title,
              description: selectedEpicForMenu.description,
              team: selectedEpicForMenu.teamId
            }));
            setEditEpicOpen(true);
          }
          setEpicMenuAnchor(null);
        }}>
          <EditIcon sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedEpicForMenu) {
            handleDeleteEpic(selectedEpicForMenu.id);
          }
        }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Eliminar
        </MenuItem>
      </Menu>

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