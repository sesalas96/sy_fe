import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  IconButton,
  Divider,
  Badge,
  Button,
} from '@mui/material';
import {
  Support as SupportIcon,
  Notifications as NotificationIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
} from '@mui/icons-material';

interface Message {
  id: number;
  from: string;
  subject: string;
  preview: string;
  time: string;
  read: boolean;
  type: 'support' | 'notification' | 'system';
  avatar?: string;
}

const HelpCenterMessages: React.FC = () => {
  const [, setSelectedMessage] = useState<number | null>(null);

  const messages: Message[] = [
    {
      id: 1,
      from: 'Equipo de Soporte',
      subject: 'Respuesta a tu consulta sobre permisos',
      preview: 'Hola, hemos revisado tu consulta sobre los permisos de trabajo y...',
      time: 'Hace 2 horas',
      read: false,
      type: 'support',
    },
    {
      id: 2,
      from: 'Sistema',
      subject: 'Actualización de seguridad completada',
      preview: 'Se ha completado la actualización de seguridad programada para...',
      time: 'Hace 5 horas',
      read: true,
      type: 'system',
    },
    {
      id: 3,
      from: 'Notificaciones',
      subject: 'Nuevo procedimiento de emergencia disponible',
      preview: 'Se ha publicado un nuevo procedimiento de emergencia que debes revisar...',
      time: 'Ayer',
      read: false,
      type: 'notification',
    },
    {
      id: 4,
      from: 'Equipo de Soporte',
      subject: 'Tutorial: Cómo usar el nuevo dashboard',
      preview: 'Te enviamos este tutorial paso a paso para que aproveches al máximo...',
      time: 'Hace 2 días',
      read: true,
      type: 'support',
    },
  ];

  const getAvatarIcon = (type: string) => {
    switch (type) {
      case 'support':
        return <SupportIcon />;
      case 'notification':
        return <NotificationIcon />;
      case 'system':
        return <CheckCircleIcon />;
      default:
        return <SupportIcon />;
    }
  };

  const getAvatarColor = (type: string) => {
    switch (type) {
      case 'support':
        return '#2196F3';
      case 'notification':
        return '#FF9800';
      case 'system':
        return '#4CAF50';
      default:
        return '#757575';
    }
  };

  const unreadCount = messages.filter(m => !m.read).length;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ flex: 1 }}>
            Mensajes
          </Typography>
          {unreadCount > 0 && (
            <Chip 
              label={`${unreadCount} sin leer`} 
              color="primary" 
              size="small"
            />
          )}
        </Box>

      </Box>

      <Divider />

      {/* Messages List */}
      <List sx={{ flex: 1, overflow: 'auto', px: 1 }}>
        {messages.map((message) => (
          <React.Fragment key={message.id}>
            <ListItem
              alignItems="flex-start"
              sx={{
                cursor: 'pointer',
                backgroundColor: !message.read ? 'action.hover' : 'transparent',
                borderRadius: 1,
                mb: 0.5,
                '&:hover': {
                  backgroundColor: 'action.selected',
                },
              }}
              onClick={() => setSelectedMessage(message.id)}
              secondaryAction={
                <IconButton edge="end" size="small">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemAvatar>
                <Badge
                  color="error"
                  variant="dot"
                  invisible={message.read}
                >
                  <Avatar 
                    sx={{ 
                      bgcolor: getAvatarColor(message.type),
                      width: 40,
                      height: 40,
                    }}
                  >
                    {getAvatarIcon(message.type)}
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: !message.read ? 600 : 400,
                        flex: 1,
                      }}
                    >
                      {message.subject}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {message.time}
                    </Typography>
                  </Box>
                }
                secondary={
                  <>
                    <Typography variant="caption" color="text.secondary">
                      {message.from}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.primary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        mt: 0.5,
                      }}
                    >
                      {message.preview}
                    </Typography>
                  </>
                }
              />
            </ListItem>
          </React.Fragment>
        ))}
      </List>

      {/* Quick Reply */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<SendIcon />}
          sx={{ textTransform: 'none' }}
        >
          Enviar nuevo mensaje al soporte
        </Button>
      </Box>
    </Box>
  );
};

export default HelpCenterMessages;