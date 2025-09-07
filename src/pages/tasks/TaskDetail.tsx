import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Avatar,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tooltip,
  Stack
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Flag as FlagIcon,
  Schedule as ScheduleIcon,
  // Person as PersonIcon,
  Comment as CommentIcon,
  Attachment as AttachmentIcon,
  AccountTree as EpicIcon,
  Group as TeamIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { Task, TaskComment, UpdateTaskData } from '../../types/tasks';
import { taskService } from '../../services/taskService';
import { teamService } from '../../services/teamService';

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

export const TaskDetail: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  
  // State
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  // const [teams, setTeams] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  
  // Edit form state
  const [editData, setEditData] = useState<UpdateTaskData>({
    id: '',
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assignedTo: '',
    actualHours: 0,
    tags: []
  });
  
  // Comment state
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<TaskComment[]>([]);
  
  // Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    if (taskId) {
      fetchTaskDetail();
    }
  }, [taskId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchTeamsAndMembers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTaskDetail = async () => {
    if (!taskId) return;
    
    try {
      setLoading(true);
      const foundTask = await taskService.getTaskById(taskId);
      
      if (!foundTask) {
        setError('Tarea no encontrada');
        return;
      }
      
      setTask(foundTask);
      setComments(foundTask.comments || []);
      
      // Set edit data
      setEditData({
        id: foundTask.id,
        title: foundTask.title,
        description: foundTask.description,
        status: foundTask.status,
        priority: foundTask.priority,
        assignedTo: foundTask.assignedTo,
        actualHours: foundTask.actualHours || 0,
        tags: foundTask.tags || []
      });
    } catch (err) {
      console.error('Error fetching task:', err);
      setError(`Error al cargar tarea: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamsAndMembers = async () => {
    try {
      const [teamsData] = await Promise.all([
        teamService.getTeams()
      ]);
      
      // setTeams(teamsData);
      
      // Extract team members from teams
      const allMembers = teamsData.reduce((acc: any[], team: any) => {
        if (team.members) {
          team.members.forEach((member: any) => {
            if (!acc.find(m => m.id === member.id)) {
              acc.push(member);
            }
          });
        }
        return acc;
      }, []);
      
      setTeamMembers(allMembers);
    } catch (err) {
      console.error('Error fetching teams and members:', err);
    }
  };

  const handleUpdateTask = async () => {
    if (!task) return;
    
    try {
      const updatedTask = await taskService.updateTask(editData);
      setTask(updatedTask);
      setEditMode(false);
      showSnackbar('Tarea actualizada exitosamente');
    } catch (err) {
      console.error('Error updating task:', err);
      showSnackbar(`Error al actualizar tarea: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;
    
    const confirmed = window.confirm('¿Estás seguro de que quieres eliminar esta tarea?');
    if (!confirmed) return;
    
    try {
      await taskService.deleteTask(task.id);
      showSnackbar('Tarea eliminada exitosamente');
      navigate('/courses');
    } catch (err) {
      console.error('Error deleting task:', err);
      showSnackbar(`Error al eliminar tarea: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  const handleAddComment = async () => {
    if (!task || !newComment.trim()) return;
    
    try {
      const comment = await taskService.addTaskComment(task.id, newComment);
      setComments(prev => [...prev, comment]);
      setNewComment('');
      showSnackbar('Comentario agregado exitosamente');
    } catch (err) {
      console.error('Error adding comment:', err);
      showSnackbar(`Error al agregar comentario: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'todo': return 'default';
      case 'in_progress': return 'info';
      case 'review': return 'warning';
      case 'done': return 'success';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: Task['status']) => {
    switch (status) {
      case 'todo': return 'Por Hacer';
      case 'in_progress': return 'En Progreso';
      case 'review': return 'En Revisión';
      case 'done': return 'Completado';
      default: return status;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Cargando tarea...</Typography>
      </Box>
    );
  }

  if (error || !task) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Tarea no encontrada'}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/courses')}
          sx={{ mt: 2 }}
        >
          Volver a Mis Tareas
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/courses')}
            variant="outlined"
          >
            Volver
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Detalle de Tarea
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!editMode ? (
            <>
              <Button
                startIcon={<EditIcon />}
                onClick={() => setEditMode(true)}
                variant="outlined"
              >
                Editar
              </Button>
              <Button
                startIcon={<DeleteIcon />}
                onClick={handleDeleteTask}
                color="error"
                variant="outlined"
              >
                Eliminar
              </Button>
            </>
          ) : (
            <>
              <Button
                startIcon={<SaveIcon />}
                onClick={handleUpdateTask}
                variant="contained"
              >
                Guardar
              </Button>
              <Button
                startIcon={<CancelIcon />}
                onClick={() => {
                  setEditMode(false);
                  setEditData({
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    status: task.status,
                    priority: task.priority,
                    assignedTo: task.assignedTo,
                    actualHours: task.actualHours || 0,
                    tags: task.tags || []
                  });
                }}
                variant="outlined"
              >
                Cancelar
              </Button>
            </>
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Main Content */}
        <Box sx={{ flex: 2 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            {/* Title */}
            <Box sx={{ mb: 3 }}>
              {editMode ? (
                <TextField
                  fullWidth
                  label="Título"
                  value={editData.title}
                  onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                  variant="outlined"
                />
              ) : (
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {task.title}
                </Typography>
              )}
            </Box>

            {/* Status and Priority */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              {editMode ? (
                <>
                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Estado</InputLabel>
                    <Select
                      value={editData.status}
                      onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value as Task['status'] }))}
                      label="Estado"
                    >
                      <MenuItem value="todo">Por Hacer</MenuItem>
                      <MenuItem value="in_progress">En Progreso</MenuItem>
                      <MenuItem value="review">En Revisión</MenuItem>
                      <MenuItem value="done">Completado</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Prioridad</InputLabel>
                    <Select
                      value={editData.priority}
                      onChange={(e) => setEditData(prev => ({ ...prev, priority: e.target.value as Task['priority'] }))}
                      label="Prioridad"
                    >
                      <MenuItem value="low">Baja</MenuItem>
                      <MenuItem value="medium">Media</MenuItem>
                      <MenuItem value="high">Alta</MenuItem>
                      <MenuItem value="urgent">Urgente</MenuItem>
                    </Select>
                  </FormControl>
                </>
              ) : (
                <>
                  <Chip
                    label={getStatusLabel(task.status)}
                    color={getStatusColor(task.status)}
                  />
                  <Chip
                    icon={<FlagIcon />}
                    label={PRIORITY_LABELS[task.priority]}
                    sx={{
                      backgroundColor: PRIORITY_COLORS[task.priority],
                      color: 'white'
                    }}
                  />
                </>
              )}
            </Box>

            {/* Description */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Descripción
              </Typography>
              {editMode ? (
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={editData.description}
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                  variant="outlined"
                />
              ) : (
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {task.description || 'Sin descripción'}
                </Typography>
              )}
            </Box>

            {/* Tags */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Etiquetas
              </Typography>
              {task.tags && task.tags.length > 0 ? (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {task.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Sin etiquetas
                </Typography>
              )}
            </Box>
          </Paper>

          {/* Comments Section */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Comentarios ({comments.length})
            </Typography>
            
            {/* Add Comment */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Agregar un comentario..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                variant="outlined"
              />
              <Button
                startIcon={<SendIcon />}
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                sx={{ mt: 1 }}
                variant="contained"
              >
                Comentar
              </Button>
            </Box>

            {/* Comments List */}
            {comments.length > 0 ? (
              <List>
                {comments.map((comment) => (
                  <ListItem key={comment.id} alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar src={comment.userAvatar}>
                        {comment.userName?.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {comment.userName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {comment.createdAt.toLocaleString()}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                          {comment.content}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No hay comentarios aún
              </Typography>
            )}
          </Paper>
        </Box>

        {/* Sidebar */}
        <Box sx={{ flex: 1 }}>
          {/* Task Info */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Información
            </Typography>
            
            <Stack spacing={2}>
              {/* Assigned To */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Asignado a
                </Typography>
                {editMode ? (
                  <FormControl fullWidth>
                    <Select
                      value={editData.assignedTo}
                      onChange={(e) => setEditData(prev => ({ ...prev, assignedTo: e.target.value }))}
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
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      sx={{ width: 32, height: 32 }}
                      src={task.assigneeAvatar}
                    >
                      {task.assignedToName?.charAt(0)}
                    </Avatar>
                    <Typography variant="body2">
                      {task.assignedToName || 'Sin asignar'}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Team */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Equipo
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TeamIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {task.teamName || 'Sin equipo'}
                  </Typography>
                </Box>
              </Box>

              {/* Epic */}
              {task.epicId && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Epic
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EpicIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      Epic
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Due Date */}
              {task.dueDate && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Fecha límite
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {task.dueDate.toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Hours */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Horas
                </Typography>
                {editMode ? (
                  <TextField
                    type="number"
                    label="Horas reales"
                    value={editData.actualHours}
                    onChange={(e) => setEditData(prev => ({ ...prev, actualHours: Number(e.target.value) }))}
                    size="small"
                    fullWidth
                  />
                ) : (
                  <Typography variant="body2">
                    Estimadas: {task.estimatedHours || 0}h | Reales: {task.actualHours || 0}h
                  </Typography>
                )}
              </Box>

              {/* Created */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Creado
                </Typography>
                <Typography variant="body2">
                  {task.createdAt.toLocaleDateString()} por {task.createdByName}
                </Typography>
              </Box>

              {/* Updated */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Actualizado
                </Typography>
                <Typography variant="body2">
                  {task.updatedAt.toLocaleDateString()}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Activity */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Actividad
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Tooltip title="Comentarios">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CommentIcon fontSize="small" color="action" />
                  <Typography variant="body2">{comments.length}</Typography>
                </Box>
              </Tooltip>
              <Tooltip title="Archivos adjuntos">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AttachmentIcon fontSize="small" color="action" />
                  <Typography variant="body2">{task.attachments?.length || 0}</Typography>
                </Box>
              </Tooltip>
            </Box>
          </Paper>
        </Box>
      </Box>

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