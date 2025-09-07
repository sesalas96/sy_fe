import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Breadcrumbs,
  Link,
  IconButton,
  Tooltip,
  CircularProgress,
  Checkbox,
  Menu,
  ListItemIcon,
  ListItemText,
  Badge,
  Divider,
  Pagination,
  Stack,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  MarkEmailRead as MarkEmailReadIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Circle as CircleIcon,
  School as SchoolIcon,
  Description as DescriptionIcon,
  Security as SecurityIcon,
  Work as WorkIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { 
  Notification, 
  NotificationStats, 
  NotificationFilters,
  PaginatedNotifications
} from '../types';
import { notificationService } from '../services/notificationService';

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [, setTotalCount] = useState(0);
  const [filters] = useState<NotificationFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'read'>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);

  const pageSize = 10;

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const appliedFilters: NotificationFilters = {
        ...filters,
        read: filterStatus === 'all' ? undefined : filterStatus === 'read'
      };
      
      const result: PaginatedNotifications = await notificationService.getNotifications(
        currentPage, 
        pageSize, 
        appliedFilters
      );
      
      setNotifications(result.notifications);
      setTotalPages(result.totalPages);
      setTotalCount(result.total);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filters, filterStatus]);


  const loadStats = async () => {
    try {
      const statsData = await notificationService.getNotificationStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      await loadNotifications();
      await loadStats();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      await loadNotifications();
      await loadStats();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      await loadNotifications();
      await loadStats();
      setAnchorEl(null);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await notificationService.bulkDelete({ notificationIds: selectedNotifications });
      setSelectedNotifications([]);
      setBulkDeleteDialog(false);
      await loadNotifications();
      await loadStats();
    } catch (error) {
      console.error('Error bulk deleting:', error);
    }
  };

  const handleSelectNotification = (id: string) => {
    setSelectedNotifications(prev => 
      prev.includes(id) 
        ? prev.filter(nId => nId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n.id));
    }
  };

  const getNotificationIcon = (type: string, priority: string) => {
    const iconProps = { fontSize: 'small' as const };
    
    switch (type) {
      case 'course_expiring':
        return <SchoolIcon {...iconProps} />;
      case 'document_expiring':
        return <DescriptionIcon {...iconProps} />;
      case 'permit_expiring':
        return <SecurityIcon {...iconProps} />;
      case 'work_reminder':
        return <WorkIcon {...iconProps} />;
      case 'system_alert':
        return <SettingsIcon {...iconProps} />;
      default:
        return <InfoIcon {...iconProps} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'course_expiring': 'Curso por vencer',
      'document_expiring': 'Documento por vencer',
      'permit_expiring': 'Permiso por vencer',
      'work_reminder': 'Recordatorio de trabajo',
      'system_alert': 'Alerta del sistema',
      'general': 'General'
    };
    return labels[type] || type;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link color="inherit" href="/dashboard">
          Dashboard
        </Link>
        <Typography color="text.primary">Notificaciones</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Notificaciones
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Actualizar">
            <IconButton onClick={loadNotifications}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filtros
          </Button>
          <Button
            variant="contained"
            startIcon={<MarkEmailReadIcon />}
            onClick={handleMarkAllAsRead}
            disabled={!stats || stats.unread === 0}
          >
            Marcar todas como leídas
          </Button>
        </Box>
      </Box>

      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NotificationsIcon color="primary" />
                  <Typography variant="h6">{stats.total}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Total
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Badge badgeContent={stats.unread} color="error">
                    <NotificationsActiveIcon color="warning" />
                  </Badge>
                  <Typography variant="h6">{stats.unread}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Sin leer
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon color="success" />
                  <Typography variant="h6">{stats.read}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Leídas
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon color="warning" />
                  <Typography variant="h6">{stats.byPriority.urgent || 0}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Urgentes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <ToggleButtonGroup
          value={filterStatus}
          exclusive
          onChange={(_, newStatus) => newStatus && setFilterStatus(newStatus)}
          size="small"
        >
          <ToggleButton value="all">Todas</ToggleButton>
          <ToggleButton value="unread">Sin leer</ToggleButton>
          <ToggleButton value="read">Leídas</ToggleButton>
        </ToggleButtonGroup>

        {selectedNotifications.length > 0 && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setBulkDeleteDialog(true)}
          >
            Eliminar seleccionadas ({selectedNotifications.length})
          </Button>
        )}
      </Stack>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedNotifications.length > 0 && selectedNotifications.length < notifications.length}
                    checked={notifications.length > 0 && selectedNotifications.length === notifications.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Título</TableCell>
                <TableCell>Prioridad</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : notifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No hay notificaciones
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                notifications.map((notification) => (
                  <TableRow
                    key={notification.id}
                    sx={{ 
                      backgroundColor: notification.read ? 'inherit' : 'action.hover',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setSelectedNotification(notification);
                      setDetailDialog(true);
                      if (!notification.read) {
                        handleMarkAsRead(notification.id);
                      }
                    }}
                  >
                    <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={() => handleSelectNotification(notification.id)}
                      />
                    </TableCell>
                    <TableCell>
                      {notification.read ? (
                        <CheckCircleIcon color="success" fontSize="small" />
                      ) : (
                        <CircleIcon color="primary" fontSize="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getNotificationIcon(notification.type, notification.priority)}
                        <Typography variant="body2">
                          {getTypeLabel(notification.type)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}>
                        {notification.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {notification.message.length > 100 
                          ? `${notification.message.substring(0, 100)}...`
                          : notification.message
                        }
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={notification.priority}
                        color={getPriorityColor(notification.priority) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(notification.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          setAnchorEl(e.currentTarget);
                          setSelectedNotification(notification);
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(_, page) => setCurrentPage(page)}
              color="primary"
            />
          </Box>
        )}
      </Paper>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            if (selectedNotification && !selectedNotification.read) {
              handleMarkAsRead(selectedNotification.id);
            }
            setAnchorEl(null);
          }}
          disabled={selectedNotification?.read}
        >
          <ListItemIcon>
            <MarkEmailReadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Marcar como leída</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedNotification) {
              handleDeleteNotification(selectedNotification.id);
            }
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Eliminar</ListItemText>
        </MenuItem>
      </Menu>

      <Dialog
        open={detailDialog}
        onClose={() => setDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedNotification && getNotificationIcon(selectedNotification.type, selectedNotification.priority)}
            Detalle de Notificación
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedNotification && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="h6" gutterBottom>
                {selectedNotification.title}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedNotification.message}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tipo:
                  </Typography>
                  <Typography variant="body2">
                    {getTypeLabel(selectedNotification.type)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Prioridad:
                  </Typography>
                  <Chip
                    label={selectedNotification.priority}
                    color={getPriorityColor(selectedNotification.priority) as any}
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Fecha de creación:
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(selectedNotification.createdAt)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Estado:
                  </Typography>
                  <Typography variant="body2">
                    {selectedNotification.read ? 'Leída' : 'Sin leer'}
                    {selectedNotification.readAt && ` (${formatDate(selectedNotification.readAt)})`}
                  </Typography>
                </Grid>
              </Grid>

              {selectedNotification.actionUrl && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    href={selectedNotification.actionUrl}
                    target="_blank"
                  >
                    Ver detalles
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={bulkDeleteDialog}
        onClose={() => setBulkDeleteDialog(false)}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar {selectedNotifications.length} notificación(es) seleccionada(s)?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={handleBulkDelete} color="error">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Notifications;