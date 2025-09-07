import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  UniqueIdentifier
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Box,
  Card,
  CardContent,
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
  Paper,
  Tooltip,
  Menu,
  LinearProgress,
  CircularProgress,
  Alert,
  Snackbar,
  Drawer,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Badge,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  ToggleButton,
  ToggleButtonGroup,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Assignment as AssignmentIcon,
  Flag as FlagIcon,
  Schedule as ScheduleIcon,
  Comment as CommentIcon,
  Attachment as AttachmentIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  ViewKanban as KanbanIcon,
  AccountTree as EpicIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  TableView as TableIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { Task, Epic, KanbanColumn, TaskFilters, CreateTaskData, CreateEpicData } from '../../types/tasks';
import { taskService } from '../../services/taskService';
import { teamService } from '../../services/teamService';

const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'todo', title: 'Por Hacer', status: 'todo', color: '#f5f5f5', tasks: [] },
  { id: 'in_progress', title: 'En Progreso', status: 'in_progress', color: '#e3f2fd', tasks: [] },
  { id: 'review', title: 'En Revisión', status: 'review', color: '#fff3e0', tasks: [] },
  { id: 'done', title: 'Completado', status: 'done', color: '#e8f5e8', tasks: [] }
];

const PRIORITY_COLORS = {
  low: '#4caf50',
  medium: '#ff9800',
  high: '#f44336',
  urgent: '#9c27b0'
};

const PRIORITY_LABELS = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente'
};

export const MyTasks: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [columns, setColumns] = useState<KanbanColumn[]>(KANBAN_COLUMNS);
  const [teams, setTeams] = useState<any[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string; avatar?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(false);
  // const [tagsInput, setTagsInput] = useState('');
  
  // Dialog states
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createEpicOpen, setCreateEpicOpen] = useState(false);
  const [editEpicOpen, setEditEpicOpen] = useState(false);
  const [epicManagementOpen, setEpicManagementOpen] = useState(false);
  const [selectedEpic, setSelectedEpic] = useState<Epic | null>(null);
  
  // Form states
  const [createTaskData, setCreateTaskData] = useState<CreateTaskData>({
    title: '',
    description: '',
    assignedTo: '',
    team: '',
    priority: 'medium',
    status: 'todo',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días desde hoy
    estimatedHours: 0,
    storyPoints: 1,
    tags: [],
    epicId: ''
  });
  
  const [createEpicData, setCreateEpicData] = useState<CreateEpicData>({
    title: '',
    description: '',
    team: '',
    priority: 'medium',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días desde hoy
    estimatedHours: 0,
    color: '#4ECDC4',
    tags: []
  });
  
  const [editEpicData, setEditEpicData] = useState<CreateEpicData>({
    title: '',
    description: '',
    team: '',
    priority: 'medium',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    estimatedHours: 0,
    color: '#4ECDC4',
    tags: []
  });
  
  // Filters and UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    status: [] as Task['status'][],
    priority: [] as Task['priority'][],
    assignedTo: [] as string[],
    epicId: [] as string[],
    teamId: [] as string[],
    companyId: [] as string[],
    dueDateFrom: null as Date | null,
    dueDateTo: null as Date | null,
    overdue: false,
    unassigned: false
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // View states
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('table');
  const [sortBy, setSortBy] = useState<keyof Task>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [tablePage, setTablePage] = useState(0);
  const [tableRowsPerPage, setTableRowsPerPage] = useState(10);
  
  // Menu states
  const [taskMenuAnchor, setTaskMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedTaskForMenu, setSelectedTaskForMenu] = useState<Task | null>(null);
  const [epicMenuAnchor, setEpicMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedEpicForMenu, setSelectedEpicForMenu] = useState<Epic | null>(null);
  
  // Drag and drop
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Check permissions
  const allowedRoles = [
    UserRole.CLIENT_STAFF,
    UserRole.VALIDADORES_OPS,
    UserRole.CONTRATISTA_ADMIN,
    UserRole.CONTRATISTA_SUBALTERNOS,
    UserRole.CONTRATISTA_HUERFANO
  ];
  
  const hasAccess = user && allowedRoles.includes(user.role);

  useEffect(() => {
    if (!hasAccess) return;
    fetchData();
  }, [hasAccess]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-apply search filter with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasAccess) {
        fetchData();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, hasAccess]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Build filters from active filters
      const taskFilters: TaskFilters = {
        search: searchTerm || undefined,
        status: activeFilters.status.length > 0 ? activeFilters.status : undefined,
        priority: activeFilters.priority.length > 0 ? activeFilters.priority : undefined,
        assignedTo: activeFilters.assignedTo.length > 0 ? activeFilters.assignedTo : undefined,
        epicId: activeFilters.epicId.length > 0 ? activeFilters.epicId : undefined,
        teamId: activeFilters.teamId.length > 0 ? activeFilters.teamId : undefined,
        dueDate: activeFilters.dueDateFrom || activeFilters.dueDateTo ? {
          from: activeFilters.dueDateFrom || undefined,
          to: activeFilters.dueDateTo || undefined
        } : undefined
      };
      
      const [tasksData, epicsData, teamsData, companiesData] = await Promise.all([
        taskService.getTasks(taskFilters),
        taskService.getEpics(),
        teamService.getTeams(),
        teamService.getCompanies()
      ]);
      
      setEpics(epicsData);
      setTeams(teamsData);
      setCompanies(companiesData);
      
      // Extract unique team members from tasks for filter options
      const uniqueMembers = tasksData.reduce((acc: { id: string; name: string; avatar?: string }[], task) => {
        if (task.assignedTo && !acc.find(m => m.id === task.assignedTo)) {
          acc.push({
            id: task.assignedTo,
            name: task.assignedToName || 'Sin nombre',
            avatar: task.assigneeAvatar
          });
        }
        return acc;
      }, []);
      setTeamMembers(uniqueMembers);
      
      // Apply additional client-side filters
      let filteredTasks = tasksData;
      
      if (activeFilters.overdue) {
        const now = new Date();
        filteredTasks = filteredTasks.filter(task => 
          task.dueDate && task.dueDate < now && task.status !== 'done'
        );
      }
      
      if (activeFilters.unassigned) {
        filteredTasks = filteredTasks.filter(task => !task.assignedTo);
      }
      
      // Filter by company (client-side since tasks might not have direct company field)
      if (activeFilters.companyId.length > 0) {
        filteredTasks = filteredTasks.filter(task => {
          const taskTeam = teamsData.find(team => team.id === task.teamId);
          return taskTeam && activeFilters.companyId.includes(taskTeam.companyId || '');
        });
      }
      
      setTasks(filteredTasks);
      
      // Organize tasks into columns
      const updatedColumns = KANBAN_COLUMNS.map(column => ({
        ...column,
        tasks: filteredTasks.filter(task => task.status === column.status)
      }));
      
      setColumns(updatedColumns);
    } catch (err) {
      console.error('Error fetching data:', err);
      showSnackbar(`Error al cargar datos: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    
    // Find the task being moved
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Determine the new column - could be the column itself or a task within the column
    let newColumnId = over.id as string;
    
    // If dragged over another task, find its column
    const overTask = tasks.find(t => t.id === over.id);
    if (overTask) {
      const overColumn = columns.find(col => col.tasks.some(t => t.id === over.id));
      if (overColumn) {
        newColumnId = overColumn.id;
      }
    }

    // Find the new status
    const newColumn = columns.find(col => col.id === newColumnId);
    if (!newColumn || task.status === newColumn.status) return;

    try {
      // Update in backend
      await taskService.updateTaskStatus(task.id, newColumn.status);
      
      // Update local state
      const updatedTask = { ...task, status: newColumn.status };
      const updatedTasks = tasks.map(t => t.id === task.id ? updatedTask : t);
      setTasks(updatedTasks);
      
      // Update columns
      const updatedColumns = columns.map(column => ({
        ...column,
        tasks: updatedTasks.filter(t => t.status === column.status)
      }));
      setColumns(updatedColumns);
      
      showSnackbar('Tarea actualizada exitosamente');
    } catch (err) {
      console.error('Error updating task status:', err);
      showSnackbar(`Error al actualizar tarea: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  const handleCreateTask = async () => {
    if (!createTaskData.title || !createTaskData.assignedTo || !createTaskData.team || !createTaskData.dueDate) {
      showSnackbar('Por favor complete los campos requeridos (título, asignado a, equipo y fecha límite)');
      return;
    }

    try {
      const newTask = await taskService.createTask(createTaskData);
      setTasks(prev => [...prev, newTask]);
      
      // Update columns
      const updatedColumns = columns.map(column => ({
        ...column,
        tasks: column.status === 'todo' ? [...column.tasks, newTask] : column.tasks
      }));
      setColumns(updatedColumns);
      
      setCreateTaskOpen(false);
      setCreateTaskData({
        title: '',
        description: '',
        assignedTo: '',
        team: '',
        priority: 'medium',
        status: 'todo',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        estimatedHours: 0,
        storyPoints: 1,
        tags: [],
        epicId: ''
      });
      
      showSnackbar('Tarea creada exitosamente');
    } catch (err) {
      console.error('Error creating task:', err);
      showSnackbar(`Error al crear tarea: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  const handleCreateEpic = async () => {
    if (!createEpicData.title || !createEpicData.team || !createEpicData.dueDate) {
      showSnackbar('Por favor complete los campos requeridos (título, equipo y fecha límite)');
      return;
    }

    try {
      console.log('Creating epic with data:', createEpicData);
      console.log('Available teams:', teams);
      console.log('Selected team ID:', createEpicData.team);
      
      // Find the selected team to verify it exists
      const selectedTeam = teams.find(team => team.id === createEpicData.team);
      console.log('Selected team object:', selectedTeam);
      
      if (!selectedTeam) {
        showSnackbar('Error: El equipo seleccionado no es válido');
        return;
      }
      
      console.log('Epic data for API:', createEpicData);
      
      const newEpic = await taskService.createEpic(createEpicData);
      setEpics(prev => [...prev, newEpic]);
      
      setCreateEpicOpen(false);
      setCreateEpicData({
        title: '',
        description: '',
        team: '',
        priority: 'medium',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        estimatedHours: 0,
        color: '#4ECDC4',
        tags: []
      });
      
      showSnackbar('Epic creado exitosamente');
    } catch (err) {
      console.error('Error creating epic:', err);
      
      // Parse structured error messages
      if (err instanceof Error) {
        try {
          const errorData = JSON.parse(err.message);
          if (errorData.error === 'Validation failed' && errorData.details) {
            const fieldErrors = errorData.details.map((detail: any) => 
              `${detail.field}: ${detail.message}`
            ).join(', ');
            showSnackbar(`Error de validación: ${fieldErrors}`);
            return;
          }
        } catch (parseError) {
          // Not a JSON error, fall through to default handling
        }
      }
      
      showSnackbar(`Error al crear epic: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  const handleEditEpic = async () => {
    if (!selectedEpic || !editEpicData.title || !editEpicData.team || !editEpicData.dueDate) {
      showSnackbar('Por favor complete los campos requeridos (título, equipo y fecha límite)');
      return;
    }

    try {
      const updatedEpic = await taskService.updateEpic(selectedEpic.id, editEpicData);
      
      setEpics(prev => prev.map(epic => epic.id === selectedEpic.id ? updatedEpic : epic));
      
      setEditEpicOpen(false);
      setSelectedEpic(null);
      
      showSnackbar('Epic actualizado exitosamente');
    } catch (err) {
      console.error('Error updating epic:', err);
      showSnackbar(`Error al actualizar epic: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      const updatedTasks = tasks.filter(t => t.id !== taskId);
      setTasks(updatedTasks);
      
      // Update columns
      const updatedColumns = columns.map(column => ({
        ...column,
        tasks: updatedTasks.filter(t => t.status === column.status)
      }));
      setColumns(updatedColumns);
      
      showSnackbar('Tarea eliminada exitosamente');
      setTaskMenuAnchor(null);
      setSelectedTaskForMenu(null);
    } catch (err) {
      console.error('Error deleting task:', err);
      showSnackbar(`Error al eliminar tarea: ${err instanceof Error ? err.message : 'Error desconocido'}`);
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

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const refreshTeamsForEpicDialog = async () => {
    try {
      setTeamsLoading(true);
      const teamsData = await teamService.getTeams();
      setTeams(teamsData);
      console.log('Teams loaded for epic dialog:', teamsData);
    } catch (err) {
      console.error('Error refreshing teams:', err);
      showSnackbar(`Error al cargar equipos: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setTeamsLoading(false);
    }
  };

  const handleOpenCreateEpicDialog = async () => {
    await refreshTeamsForEpicDialog();
    setCreateEpicOpen(true);
  };

  // Filter management functions
  const handleFilterChange = (filterType: string, value: any, checked?: boolean) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      
      switch (filterType) {
        case 'status':
        case 'priority':
        case 'assignedTo':
        case 'epicId':
        case 'teamId':
        case 'companyId':
          const arrayKey = filterType as keyof Pick<typeof prev, 'status' | 'priority' | 'assignedTo' | 'epicId' | 'teamId' | 'companyId'>;
          if (checked) {
            newFilters[arrayKey] = [...prev[arrayKey], value] as any;
          } else {
            newFilters[arrayKey] = prev[arrayKey].filter(item => item !== value) as any;
          }
          break;
        case 'dueDateFrom':
        case 'dueDateTo':
          newFilters[filterType as 'dueDateFrom' | 'dueDateTo'] = value;
          break;
        case 'overdue':
        case 'unassigned':
          newFilters[filterType as 'overdue' | 'unassigned'] = checked || false;
          break;
      }
      
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setActiveFilters({
      status: [],
      priority: [],
      assignedTo: [],
      epicId: [],
      teamId: [],
      companyId: [],
      dueDateFrom: null,
      dueDateTo: null,
      overdue: false,
      unassigned: false
    });
    setSearchTerm('');
  };

  const getActiveFilterCount = () => {
    const { status, priority, assignedTo, epicId, teamId, companyId, dueDateFrom, dueDateTo, overdue, unassigned } = activeFilters;
    let count = 0;
    count += status.length + priority.length + assignedTo.length + epicId.length + teamId.length + companyId.length;
    count += dueDateFrom ? 1 : 0;
    count += dueDateTo ? 1 : 0;
    count += overdue ? 1 : 0;
    count += unassigned ? 1 : 0;
    count += searchTerm ? 1 : 0;
    return count;
  };

  const applyFilters = () => {
    fetchData();
    setFilterDrawerOpen(false);
  };

  const getPriorityColor = (priority: Task['priority']) => PRIORITY_COLORS[priority];
  const getPriorityLabel = (priority: Task['priority']) => PRIORITY_LABELS[priority];

  const SortableTaskCard: React.FC<{ task: Task }> = ({ task }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: task.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const taskEpic = epics.find(e => e.id === task.epicId);

    return (
      <Card
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        sx={{
          mb: 2,
          cursor: 'grab',
          boxShadow: isDragging ? 4 : 1,
          '&:hover': { boxShadow: 2 }
        }}
        onClick={() => navigate(`/task/${task.id}`)}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1, mr: 1 }}>
              {task.title}
            </Typography>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setTaskMenuAnchor(e.currentTarget);
                setSelectedTaskForMenu(task);
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Description */}
          {task.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {task.description.length > 100 ? `${task.description.substring(0, 100)}...` : task.description}
            </Typography>
          )}

          {/* Priority & Epic */}
          <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            <Chip
              icon={<FlagIcon />}
              label={getPriorityLabel(task.priority)}
              size="small"
              sx={{
                backgroundColor: getPriorityColor(task.priority),
                color: 'white',
                fontSize: '0.75rem'
              }}
            />
            {taskEpic && (
              <Chip
                icon={<EpicIcon />}
                label={taskEpic.title}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
            )}
          </Box>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
              {task.tags.slice(0, 3).map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              ))}
              {task.tags.length > 3 && (
                <Chip
                  label={`+${task.tags.length - 3}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              )}
            </Box>
          )}

          {/* Footer */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                sx={{ width: 24, height: 24, mr: 1, fontSize: '0.75rem' }}
                src={task.assigneeAvatar}
              >
                {task.assignedToName?.charAt(0)}
              </Avatar>
              <Typography variant="caption" color="text.secondary">
                {task.assignedToName}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {task.dueDate && (
                <Tooltip title={`Vence: ${task.dueDate.toLocaleDateString()}`}>
                  <ScheduleIcon fontSize="small" color="action" />
                </Tooltip>
              )}
              {task.comments && task.comments.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CommentIcon fontSize="small" color="action" />
                  <Typography variant="caption" sx={{ ml: 0.5 }}>
                    {task.comments.length}
                  </Typography>
                </Box>
              )}
              {task.attachments && task.attachments.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AttachmentIcon fontSize="small" color="action" />
                  <Typography variant="caption" sx={{ ml: 0.5 }}>
                    {task.attachments.length}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (!hasAccess) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tienes permisos para acceder a esta sección.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Cargando tareas...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AssignmentIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Mis Tareas
          </Typography>
          <Chip
            label={`${tasks.length} tareas`}
            color="primary"
            variant="outlined"
          />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => setEpicManagementOpen(true)}
            sx={{ mr: 1 }}
          >
            Gestionar Epics
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateTaskOpen(true)}
          >
            Nueva Tarea
          </Button>
        </Box>
      </Box>

      {/* Search and Filters Bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Left side - Search and Filters */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
          {/* Search */}
          <TextField
            placeholder="Buscar tareas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="outlined"
            size="small"
            sx={{ minWidth: 300 }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
              endAdornment: searchTerm && (
                <IconButton
                  size="small"
                  onClick={() => setSearchTerm('')}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )
            }}
          />
          
          {/* Filter Button */}
          <Badge badgeContent={getActiveFilterCount()} color="primary">
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setFilterDrawerOpen(true)}
              sx={{ minWidth: 120 }}
            >
              Filtros
            </Button>
          </Badge>
          
          {/* Quick Filter Chips */}
          {getActiveFilterCount() > 0 && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Button
                size="small"
                startIcon={<ClearIcon />}
                onClick={clearAllFilters}
                sx={{ minWidth: 'auto' }}
              >
                Limpiar
              </Button>
              
              {/* Show active filter chips */}
              {activeFilters.overdue && (
                <Chip
                  label="Vencidas"
                  size="small"
                  color="error"
                  onDelete={() => handleFilterChange('overdue', false, false)}
                />
              )}
              {activeFilters.unassigned && (
                <Chip
                  label="Sin asignar"
                  size="small"
                  color="warning"
                  onDelete={() => handleFilterChange('unassigned', false, false)}
                />
              )}
              {activeFilters.epicId.map(epicId => {
                const epic = epics.find(e => e.id === epicId);
                return (
                  <Chip
                    key={epicId}
                    label={epic?.title || 'Epic'}
                    size="small"
                    icon={<EpicIcon />}
                    onDelete={() => handleFilterChange('epicId', epicId, false)}
                  />
                );
              })}
              {activeFilters.status.map(status => (
                <Chip
                  key={status}
                  label={status === 'todo' ? 'Por Hacer' : status === 'in_progress' ? 'En Progreso' : status === 'review' ? 'En Revisión' : 'Completado'}
                  size="small"
                  onDelete={() => handleFilterChange('status', status, false)}
                />
              ))}
              {activeFilters.priority.map(priority => (
                <Chip
                  key={priority}
                  label={getPriorityLabel(priority)}
                  size="small"
                  sx={{ backgroundColor: getPriorityColor(priority), color: 'white' }}
                  onDelete={() => handleFilterChange('priority', priority, false)}
                />
              ))}
            </Box>
          )}
          
          {/* Apply Filters Button */}
          <Button
            variant="contained"
            onClick={applyFilters}
            disabled={getActiveFilterCount() === 0 && !searchTerm}
          >
            Aplicar Filtros
          </Button>
        </Box>
        
        {/* Right side - View Toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newView) => newView && setViewMode(newView)}
            size="small"
          >
            <ToggleButton value="table">
              <TableIcon sx={{ mr: 1 }} />
              Tabla
            </ToggleButton>
            {!isMobile && (
              <ToggleButton value="kanban">
                <KanbanIcon sx={{ mr: 1 }} />
                Kanban
              </ToggleButton>
            )}
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Main Content - Kanban or Table View */}
      {viewMode === 'kanban' ? (
        /* Kanban Board */
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              height: 'calc(100vh - 200px)',
              overflow: 'auto',
              pb: 2
            }}
          >
            {columns.map((column) => (
              <Paper
                key={column.id}
                id={column.id}
                sx={{
                  minWidth: 300,
                  maxWidth: 300,
                  backgroundColor: column.color,
                  p: 2,
                  borderRadius: 2
                }}
              >
                {/* Column Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {column.title}
                  </Typography>
                  <Chip
                    label={column.tasks.length}
                    size="small"
                    sx={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
                  />
                </Box>

                {/* Tasks */}
                <SortableContext
                  items={column.tasks.map(task => task.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <Box
                    sx={{
                      minHeight: 200,
                      borderRadius: 1,
                      p: 1
                    }}
                  >
                    {column.tasks.map((task) => (
                      <SortableTaskCard key={task.id} task={task} />
                    ))}
                  </Box>
                </SortableContext>
              </Paper>
            ))}
          </Box>
          
          <DragOverlay>
            {activeId ? (
              <SortableTaskCard task={tasks.find(t => t.id === activeId)!} />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        /* Table View */
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 280px)' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>
                    <TableSortLabel
                      active={sortBy === 'title'}
                      direction={sortBy === 'title' ? sortDirection : 'asc'}
                      onClick={() => {
                        if (sortBy === 'title') {
                          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('title');
                          setSortDirection('asc');
                        }
                      }}
                    >
                      Título
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Prioridad</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Asignado a</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Epic</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Equipo</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    <TableSortLabel
                      active={sortBy === 'dueDate'}
                      direction={sortBy === 'dueDate' ? sortDirection : 'asc'}
                      onClick={() => {
                        if (sortBy === 'dueDate') {
                          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('dueDate');
                          setSortDirection('asc');
                        }
                      }}
                    >
                      Fecha Límite
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks
                  .sort((a, b) => {
                    const aVal = a[sortBy];
                    const bVal = b[sortBy];
                    if (aVal == null && bVal == null) return 0;
                    if (aVal == null) return 1;
                    if (bVal == null) return -1;
                    
                    let comparison = 0;
                    if (aVal < bVal) comparison = -1;
                    else if (aVal > bVal) comparison = 1;
                    
                    return sortDirection === 'desc' ? -comparison : comparison;
                  })
                  .slice(tablePage * tableRowsPerPage, tablePage * tableRowsPerPage + tableRowsPerPage)
                  .map((task) => {
                    const epic = epics.find(e => e.id === task.epicId);
                    return (
                      <TableRow
                        key={task.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/task/${task.id}`)}
                      >
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {task.title}
                            </Typography>
                            {task.description && (
                              <Typography variant="caption" color="text.secondary">
                                {task.description.length > 50 ? `${task.description.substring(0, 50)}...` : task.description}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<FlagIcon />}
                            label={getPriorityLabel(task.priority)}
                            size="small"
                            sx={{
                              backgroundColor: getPriorityColor(task.priority),
                              color: 'white',
                              fontSize: '0.75rem'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar
                              sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
                              src={task.assigneeAvatar}
                            >
                              {task.assignedToName?.charAt(0)}
                            </Avatar>
                            <Typography variant="body2">
                              {task.assignedToName || 'Sin asignar'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {epic ? (
                            <Chip
                              icon={<EpicIcon />}
                              label={epic.title}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.75rem' }}
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Sin epic
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {task.teamName || 'Sin equipo'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {task.dueDate ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <ScheduleIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                {task.dueDate.toLocaleDateString()}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Sin fecha
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTaskMenuAnchor(e.currentTarget);
                              setSelectedTaskForMenu(task);
                            }}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={tasks.length}
            rowsPerPage={tableRowsPerPage}
            page={tablePage}
            onPageChange={(_, newPage) => setTablePage(newPage)}
            onRowsPerPageChange={(e) => {
              setTableRowsPerPage(parseInt(e.target.value, 10));
              setTablePage(0);
            }}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </Paper>
      )}

      {/* Create Task Dialog */}
      <Dialog open={createTaskOpen} onClose={() => setCreateTaskOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Crear Nueva Tarea</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Título *"
              value={createTaskData.title}
              onChange={(e) => setCreateTaskData(prev => ({ ...prev, title: e.target.value }))}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Descripción"
              value={createTaskData.description}
              onChange={(e) => setCreateTaskData(prev => ({ ...prev, description: e.target.value }))}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Prioridad</InputLabel>
                <Select
                  value={createTaskData.priority}
                  onChange={(e) => setCreateTaskData(prev => ({ ...prev, priority: e.target.value as Task['priority'] }))}
                  label="Prioridad"
                >
                  <MenuItem value="low">Baja</MenuItem>
                  <MenuItem value="medium">Media</MenuItem>
                  <MenuItem value="high">Alta</MenuItem>
                  <MenuItem value="urgent">Urgente</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Equipo</InputLabel>
                <Select
                  value={createTaskData.team}
                  onChange={(e) => setCreateTaskData(prev => ({ ...prev, team: e.target.value }))}
                  label="Equipo"
                >
                  {teams.map((team) => (
                    <MenuItem key={team.id} value={team.id}>
                      {team.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Asignado a *</InputLabel>
                <Select
                  value={createTaskData.assignedTo}
                  onChange={(e) => setCreateTaskData(prev => ({ ...prev, assignedTo: e.target.value }))}
                  label="Asignado a *"
                >
                  {teamMembers.map((member) => (
                    <MenuItem key={member.id} value={member.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 20, height: 20 }} src={member.avatar}>
                          {member.name?.charAt(0)}
                        </Avatar>
                        {member.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Epic (Opcional)</InputLabel>
                <Select
                  value={createTaskData.epicId}
                  onChange={(e) => setCreateTaskData(prev => ({ ...prev, epicId: e.target.value }))}
                  label="Epic (Opcional)"
                >
                  <MenuItem value="">
                    <em>Sin Epic</em>
                  </MenuItem>
                  {epics.map((epic) => (
                    <MenuItem key={epic.id} value={epic.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EpicIcon fontSize="small" />
                        {epic.title}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Estado *</InputLabel>
                <Select
                  value={createTaskData.status}
                  onChange={(e) => setCreateTaskData(prev => ({ ...prev, status: e.target.value as Task['status'] }))}
                  label="Estado *"
                >
                  <MenuItem value="todo">Por Hacer</MenuItem>
                  <MenuItem value="in_progress">En Progreso</MenuItem>
                  <MenuItem value="review">En Revisión</MenuItem>
                  <MenuItem value="done">Completado</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                type="date"
                label="Fecha Límite *"
                value={createTaskData.dueDate.toISOString().split('T')[0]}
                onChange={(e) => setCreateTaskData(prev => ({ ...prev, dueDate: new Date(e.target.value) }))}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                type="number"
                label="Horas Estimadas *"
                value={createTaskData.estimatedHours}
                onChange={(e) => setCreateTaskData(prev => ({ ...prev, estimatedHours: Number(e.target.value) }))}
                inputProps={{ min: 0 }}
              />
              <TextField
                fullWidth
                type="number"
                label="Story Points *"
                value={createTaskData.storyPoints}
                onChange={(e) => setCreateTaskData(prev => ({ ...prev, storyPoints: Number(e.target.value) }))}
                inputProps={{ min: 1, max: 21 }}
              />
            </Box>
            <TextField
              fullWidth
              label="Etiquetas (separadas por comas)"
              value={createTaskData.tags.join(', ')}
              onChange={(e) => setCreateTaskData(prev => ({ ...prev, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) }))}
              placeholder="ej: frontend, urgent, ui"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateTaskOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateTask}>
            Crear Tarea
          </Button>
        </DialogActions>
      </Dialog>

      {/* Epic Management Drawer */}
      <Drawer
        anchor="right"
        open={epicManagementOpen}
        onClose={() => setEpicManagementOpen(false)}
        sx={{ zIndex: 1300 }}
      >
        <Box sx={{ width: 500, p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Gestión de Epics
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreateEpicDialog}
                size="small"
              >
                Nuevo Epic
              </Button>
              <IconButton onClick={() => setEpicManagementOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Epics List */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {epics.length > 0 ? (
              epics.map((epic) => {
                const epicTasks = tasks.filter(t => t.epicId === epic.id);
                return (
                  <Card key={epic.id} variant="outlined">
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {epic.title}
                          </Typography>
                          {epic.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {epic.description}
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Chip
                              label={`${epicTasks.length} tareas`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            <Typography variant="caption" color="text.secondary">
                              {epic.teamName}
                            </Typography>
                          </Box>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            setEpicMenuAnchor(e.currentTarget);
                            setSelectedEpicForMenu(epic);
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Alert severity="info">
                No hay epics creados. Crea un epic para agrupar tus tareas.
              </Alert>
            )}
          </Box>
        </Box>
      </Drawer>

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
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Prioridad *</InputLabel>
                <Select
                  value={createEpicData.priority}
                  onChange={(e) => setCreateEpicData(prev => ({ ...prev, priority: e.target.value as CreateEpicData['priority'] }))}
                  label="Prioridad *"
                >
                  <MenuItem value="low">Baja</MenuItem>
                  <MenuItem value="medium">Media</MenuItem>
                  <MenuItem value="high">Alta</MenuItem>
                  <MenuItem value="urgent">Urgente</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                type="number"
                label="Horas Estimadas *"
                value={createEpicData.estimatedHours}
                onChange={(e) => setCreateEpicData(prev => ({ ...prev, estimatedHours: Number(e.target.value) }))}
                inputProps={{ min: 0 }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                type="date"
                label="Fecha Límite *"
                value={createEpicData.dueDate.toISOString().split('T')[0]}
                onChange={(e) => setCreateEpicData(prev => ({ ...prev, dueDate: new Date(e.target.value) }))}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Color"
                type="color"
                value={createEpicData.color}
                onChange={(e) => setCreateEpicData(prev => ({ ...prev, color: e.target.value }))}
                InputProps={{ sx: { height: 56 } }}
              />
            </Box>
            <TextField
              fullWidth
              label="Etiquetas (separadas por comas)"
              value={createEpicData.tags.join(', ')}
              onChange={(e) => setCreateEpicData(prev => ({ ...prev, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) }))}
              placeholder="ej: backend, security, authentication"
            />
            <FormControl fullWidth>
              <InputLabel>Equipo *</InputLabel>
              <Select
                value={createEpicData.team}
                onChange={(e) => setCreateEpicData(prev => ({ ...prev, team: e.target.value }))}
                label="Equipo *"
                disabled={teamsLoading}
              >
                {teamsLoading ? (
                  <MenuItem disabled>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} />
                      Cargando equipos...
                    </Box>
                  </MenuItem>
                ) : teams.length === 0 ? (
                  <MenuItem disabled>
                    No hay equipos disponibles
                  </MenuItem>
                ) : (
                  teams.map((team) => (
                    <MenuItem key={team.id} value={team.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">
                          {team.name}
                        </Typography>
                        {team.companyName && (
                          <Typography variant="caption" color="text.secondary">
                            ({team.companyName})
                          </Typography>
                        )}
                      </Box>
                    </MenuItem>
                  ))
                )}
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
                disabled={teamsLoading}
              >
                {teams.length === 0 ? (
                  <MenuItem disabled>
                    No hay equipos disponibles
                  </MenuItem>
                ) : (
                  teams.map((team) => (
                    <MenuItem key={team.id} value={team.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">
                          {team.name}
                        </Typography>
                        {team.companyName && (
                          <Typography variant="caption" color="text.secondary">
                            ({team.companyName})
                          </Typography>
                        )}
                      </Box>
                    </MenuItem>
                  ))
                )}
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

      {/* Task Menu */}
      <Menu
        anchorEl={taskMenuAnchor}
        open={Boolean(taskMenuAnchor)}
        onClose={() => setTaskMenuAnchor(null)}
      >
        <MenuItem onClick={() => {
          if (selectedTaskForMenu) {
            navigate(`/task/${selectedTaskForMenu.id}`);
          }
          setTaskMenuAnchor(null);
        }}>
          <EditIcon sx={{ mr: 1 }} />
          Ver Detalles
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedTaskForMenu) {
            handleDeleteTask(selectedTaskForMenu.id);
          }
        }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Eliminar
        </MenuItem>
      </Menu>

      {/* Epic Menu */}
      <Menu
        anchorEl={epicMenuAnchor}
        open={Boolean(epicMenuAnchor)}
        onClose={() => setEpicMenuAnchor(null)}
      >
        <MenuItem onClick={() => {
          if (selectedEpicForMenu) {
            // Filter by this epic
            handleFilterChange('epicId', selectedEpicForMenu.id, true);
            applyFilters();
            setEpicMenuAnchor(null);
            setEpicManagementOpen(false);
          }
        }}>
          <FilterIcon sx={{ mr: 1 }} />
          Filtrar por este Epic
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedEpicForMenu) {
            setSelectedEpic(selectedEpicForMenu);
            setEditEpicData({
              title: selectedEpicForMenu.title,
              description: selectedEpicForMenu.description,
              team: selectedEpicForMenu.teamId,
              priority: 'medium',
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              estimatedHours: 0,
              color: '#4ECDC4',
              tags: []
            });
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

      {/* Filter Drawer */}
      <Drawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        sx={{ zIndex: 1300 }}
      >
        <Box sx={{ width: 400, p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Filtros Avanzados
            </Typography>
            <IconButton onClick={() => setFilterDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Stack spacing={3}>
            {/* Epic Filter */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Epic
              </Typography>
              <FormGroup sx={{ maxHeight: 200, overflow: 'auto' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={activeFilters.epicId.includes('')}
                      onChange={(e) => handleFilterChange('epicId', '', e.target.checked)}
                    />
                  }
                  label="Sin Epic"
                />
                {epics.map(epic => (
                  <FormControlLabel
                    key={epic.id}
                    control={
                      <Checkbox
                        checked={activeFilters.epicId.includes(epic.id)}
                        onChange={(e) => handleFilterChange('epicId', epic.id, e.target.checked)}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EpicIcon fontSize="small" />
                        {epic.title}
                      </Box>
                    }
                  />
                ))}
              </FormGroup>
            </Box>

            {/* Status Filter */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Estado
              </Typography>
              <FormGroup>
                {[
                  { value: 'todo', label: 'Por Hacer' },
                  { value: 'in_progress', label: 'En Progreso' },
                  { value: 'review', label: 'En Revisión' },
                  { value: 'done', label: 'Completado' }
                ].map(status => (
                  <FormControlLabel
                    key={status.value}
                    control={
                      <Checkbox
                        checked={activeFilters.status.includes(status.value as Task['status'])}
                        onChange={(e) => handleFilterChange('status', status.value, e.target.checked)}
                      />
                    }
                    label={status.label}
                  />
                ))}
              </FormGroup>
            </Box>

            {/* Priority Filter */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Prioridad
              </Typography>
              <FormGroup>
                {[
                  { value: 'low', label: 'Baja', color: PRIORITY_COLORS.low },
                  { value: 'medium', label: 'Media', color: PRIORITY_COLORS.medium },
                  { value: 'high', label: 'Alta', color: PRIORITY_COLORS.high },
                  { value: 'urgent', label: 'Urgente', color: PRIORITY_COLORS.urgent }
                ].map(priority => (
                  <FormControlLabel
                    key={priority.value}
                    control={
                      <Checkbox
                        checked={activeFilters.priority.includes(priority.value as Task['priority'])}
                        onChange={(e) => handleFilterChange('priority', priority.value, e.target.checked)}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            backgroundColor: priority.color,
                            borderRadius: '50%'
                          }}
                        />
                        {priority.label}
                      </Box>
                    }
                  />
                ))}
              </FormGroup>
            </Box>

            {/* Company Filter */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Espacios de Trabajo
              </Typography>
              <FormGroup sx={{ maxHeight: 200, overflow: 'auto' }}>
                {companies.map(company => (
                  <FormControlLabel
                    key={company.id}
                    control={
                      <Checkbox
                        checked={activeFilters.companyId.includes(company.id)}
                        onChange={(e) => handleFilterChange('companyId', company.id, e.target.checked)}
                      />
                    }
                    label={company.name}
                  />
                ))}
              </FormGroup>
            </Box>

            {/* Team Filter */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Equipo
              </Typography>
              <FormGroup sx={{ maxHeight: 200, overflow: 'auto' }}>
                {teams.map(team => (
                  <FormControlLabel
                    key={team.id}
                    control={
                      <Checkbox
                        checked={activeFilters.teamId.includes(team.id)}
                        onChange={(e) => handleFilterChange('teamId', team.id, e.target.checked)}
                      />
                    }
                    label={team.name}
                  />
                ))}
              </FormGroup>
            </Box>

            {/* Assignee Filter */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Asignado a
              </Typography>
              <FormGroup sx={{ maxHeight: 200, overflow: 'auto' }}>
                {teamMembers.map(member => (
                  <FormControlLabel
                    key={member.id}
                    control={
                      <Checkbox
                        checked={activeFilters.assignedTo.includes(member.id)}
                        onChange={(e) => handleFilterChange('assignedTo', member.id, e.target.checked)}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          sx={{ width: 20, height: 20, fontSize: '0.7rem' }}
                          src={member.avatar}
                        >
                          {member.name.charAt(0)}
                        </Avatar>
                        {member.name}
                      </Box>
                    }
                  />
                ))}
              </FormGroup>
            </Box>

            {/* Date Filters */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                Fecha de Vencimiento
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Desde"
                  type="date"
                  value={activeFilters.dueDateFrom ? activeFilters.dueDateFrom.toISOString().split('T')[0] : ''}
                  onChange={(e) => handleFilterChange('dueDateFrom', e.target.value ? new Date(e.target.value) : null)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  label="Hasta"
                  type="date"
                  value={activeFilters.dueDateTo ? activeFilters.dueDateTo.toISOString().split('T')[0] : ''}
                  onChange={(e) => handleFilterChange('dueDateTo', e.target.value ? new Date(e.target.value) : null)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Stack>
            </Box>

            {/* Quick Filters */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Filtros Rápidos
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={activeFilters.overdue}
                      onChange={(e) => handleFilterChange('overdue', false, e.target.checked)}
                    />
                  }
                  label="Tareas vencidas"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={activeFilters.unassigned}
                      onChange={(e) => handleFilterChange('unassigned', false, e.target.checked)}
                    />
                  }
                  label="Tareas sin asignar"
                />
              </FormGroup>
            </Box>
          </Stack>

          {/* Filter Actions */}
          <Box sx={{ display: 'flex', gap: 2, mt: 4, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button
              variant="outlined"
              onClick={clearAllFilters}
              startIcon={<ClearIcon />}
              fullWidth
            >
              Limpiar Todo
            </Button>
            <Button
              variant="contained"
              onClick={applyFilters}
              fullWidth
            >
              Aplicar Filtros
            </Button>
          </Box>
        </Box>
      </Drawer>

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