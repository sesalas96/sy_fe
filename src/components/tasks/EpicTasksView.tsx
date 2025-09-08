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
  arrayMove,
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
  Alert,
  Snackbar,
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
  Person as PersonIcon,
  Comment as CommentIcon,
  Attachment as AttachmentIcon,
  Group as GroupIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccountTree as EpicIcon,
  ViewKanban as KanbanIcon,
  TableView as TableIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { Task, Epic, KanbanColumn, CreateTaskData } from '../../types/tasks';
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

interface EpicTasksViewProps {
  epic: Epic;
  onBack: () => void;
  onTaskSelect: (task: Task) => void;
}

export const EpicTasksView: React.FC<EpicTasksViewProps> = ({ epic, onBack, onTaskSelect }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<KanbanColumn[]>(KANBAN_COLUMNS);
  const [teams, setTeams] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string; avatar?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Form states
  const [createTaskData, setCreateTaskData] = useState<CreateTaskData>({
    title: '',
    description: '',
    priority: 'medium',
    assignedTo: '',
    epicId: epic.id,
    team: epic.teamId,
    status: 'todo',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    estimatedHours: 0,
    storyPoints: 0,
    tags: []
  });
  
  // View states
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('table');
  const [sortBy, setSortBy] = useState<keyof Task>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [tablePage, setTablePage] = useState(0);
  const [tableRowsPerPage, setTableRowsPerPage] = useState(10);
  
  // Menu states
  const [taskMenuAnchor, setTaskMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedTaskForMenu, setSelectedTaskForMenu] = useState<Task | null>(null);
  
  // Drag and drop
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, [epic.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [tasksData, teamsData] = await Promise.all([
        taskService.getTasks({ epicId: [epic.id] }),
        teamService.getTeams()
      ]);
      
      setTasks(tasksData);
      setTeams(teamsData);
      
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
      
      // Organize tasks into columns
      const updatedColumns = KANBAN_COLUMNS.map(column => ({
        ...column,
        tasks: tasksData.filter(task => task.status === column.status)
      }));
      
      setColumns(updatedColumns);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(`Error al cargar datos: ${err instanceof Error ? err.message : 'Error desconocido'}`);
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
    if (!createTaskData.title || !createTaskData.assignedTo) {
      showSnackbar('Por favor complete los campos requeridos');
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
      setCreateTaskData(prev => ({
        ...prev,
        title: '',
        description: '',
        priority: 'medium',
        assignedTo: '',
        epicId: epic.id,
        team: epic.teamId,
        estimatedHours: 0,
        tags: []
      }));
      
      showSnackbar('Tarea creada exitosamente');
    } catch (err) {
      console.error('Error creating task:', err);
      showSnackbar(`Error al crear tarea: ${err instanceof Error ? err.message : 'Error desconocido'}`);
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

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
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

          {/* Priority */}
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

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Cargando tareas del epic...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, height: '100dvh', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            variant="outlined"
          >
            Volver
          </Button>
          <EpicIcon color="primary" />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {epic.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tasks.length} tareas
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {/* View Toggle */}
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
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateTaskOpen(true)}
          >
            Nueva Tarea
          </Button>
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
              height: 'calc(100dvh - 200px)',
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
          <TableContainer sx={{ maxHeight: 'calc(100dvh - 280px)' }}>
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
                  .map((task) => (
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
                  ))}
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
        <DialogTitle>Crear Nueva Tarea en {epic.title}</DialogTitle>
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
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateTaskOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateTask}>
            Crear Tarea
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