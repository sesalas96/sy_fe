import { 
  Notification, 
  NotificationStats, 
  NotificationFilters, 
  PaginatedNotifications,
  BulkDeleteRequest,
  CreateNotificationRequest
} from '../types';

const getCurrentUser = () => ({
  id: 'user1',
  companyId: 'company1',
  isSafetyPersonnel: true,
  name: 'Usuario Demo',
  email: 'demo@example.com'
});

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let mockNotifications: Notification[] = [
  {
    id: '1',
    userId: 'user1',
    companyId: 'company1',
    type: 'course_expiring',
    title: 'Curso de Seguridad próximo a vencer',
    message: 'Tu curso de "Seguridad Industrial Básica" vencerá en 3 días. Por favor, renueva tu certificación.',
    actionUrl: '/courses/safety-basic',
    read: false,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    priority: 'high',
    emailSent: true,
    emailSentAt: new Date('2024-01-15T10:01:00Z'),
    metadata: { courseId: 'course-123', daysUntilExpiry: 3 }
  },
  {
    id: '2',
    userId: 'user1', 
    companyId: 'company1',
    type: 'document_expiring',
    title: 'Documento de Identificación por vencer',
    message: 'Tu documento de identificación vencerá en 7 días. Actualiza tu información.',
    actionUrl: '/profile/documents',
    read: true,
    readAt: new Date('2024-01-14T15:30:00Z'),
    createdAt: new Date('2024-01-14T14:00:00Z'),
    updatedAt: new Date('2024-01-14T15:30:00Z'),
    priority: 'medium',
    emailSent: false,
    metadata: { documentType: 'identification', daysUntilExpiry: 7 }
  },
  {
    id: '3',
    userId: 'user2',
    companyId: 'company1', 
    type: 'permit_expiring',
    title: 'Permiso de Trabajo en Altura próximo a vencer',
    message: 'Tu permiso para trabajo en altura vencerá mañana. Renueva antes de la fecha límite.',
    actionUrl: '/permits/height-work',
    read: false,
    createdAt: new Date('2024-01-16T08:00:00Z'),
    priority: 'urgent',
    emailSent: true,
    emailSentAt: new Date('2024-01-16T08:05:00Z'),
    metadata: { permitId: 'permit-456', daysUntilExpiry: 1 }
  },
  {
    id: '4',
    userId: 'user1',
    companyId: 'company1',
    type: 'system_alert',
    title: 'Mantenimiento del Sistema Programado',
    message: 'El sistema estará en mantenimiento el domingo de 2:00 AM a 4:00 AM.',
    read: false,
    createdAt: new Date('2024-01-16T12:00:00Z'),
    priority: 'low',
    emailSent: false,
    metadata: { maintenanceStart: '2024-01-21T02:00:00Z', maintenanceEnd: '2024-01-21T04:00:00Z' }
  },
  {
    id: '5',
    userId: 'user1',
    companyId: 'company2',
    type: 'work_reminder',
    title: 'Reunión de Seguridad Semanal',
    message: 'Recordatorio: Reunión de seguridad semanal mañana a las 9:00 AM en sala de conferencias.',
    actionUrl: '/calendar/meeting-123',
    read: false,
    createdAt: new Date('2024-01-16T16:00:00Z'),
    priority: 'medium',
    emailSent: true,
    emailSentAt: new Date('2024-01-16T16:01:00Z'),
    metadata: { meetingId: 'meeting-123', meetingTime: '2024-01-17T09:00:00Z' }
  }
];

class NotificationService {
  async getNotifications(
    page: number = 1, 
    limit: number = 10, 
    filters?: NotificationFilters
  ): Promise<PaginatedNotifications> {
    await delay(500);
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    let filteredNotifications = mockNotifications.filter(n => n.userId === currentUser.id);

    if (filters) {
      if (filters.type && filters.type.length > 0) {
        filteredNotifications = filteredNotifications.filter(n => filters.type!.includes(n.type));
      }
      
      if (filters.priority && filters.priority.length > 0) {
        filteredNotifications = filteredNotifications.filter(n => filters.priority!.includes(n.priority));
      }
      
      if (filters.read !== undefined) {
        filteredNotifications = filteredNotifications.filter(n => n.read === filters.read);
      }
      
      if (filters.dateFrom) {
        filteredNotifications = filteredNotifications.filter(n => n.createdAt >= filters.dateFrom!);
      }
      
      if (filters.dateTo) {
        filteredNotifications = filteredNotifications.filter(n => n.createdAt <= filters.dateTo!);
      }
      
      if (filters.companyId) {
        filteredNotifications = filteredNotifications.filter(n => n.companyId === filters.companyId);
      }
    }

    filteredNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = filteredNotifications.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const notifications = filteredNotifications.slice(startIndex, endIndex);

    return {
      notifications,
      total,
      page,
      limit,
      totalPages
    };
  }

  async getNotificationStats(): Promise<NotificationStats> {
    await delay(300);
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    const userNotifications = mockNotifications.filter(n => n.userId === currentUser.id);
    
    const stats: NotificationStats = {
      total: userNotifications.length,
      unread: userNotifications.filter(n => !n.read).length,
      read: userNotifications.filter(n => n.read).length,
      byType: {},
      byPriority: {}
    };

    userNotifications.forEach(notification => {
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
      stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;
    });

    return stats;
  }

  async markAllAsRead(): Promise<void> {
    await delay(400);
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    const now = new Date();
    mockNotifications.forEach(notification => {
      if (notification.userId === currentUser.id && !notification.read) {
        notification.read = true;
        notification.readAt = now;
        notification.updatedAt = now;
      }
    });
  }

  async getNotificationById(id: string): Promise<Notification> {
    await delay(200);
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    const notification = mockNotifications.find(n => n.id === id && n.userId === currentUser.id);
    if (!notification) {
      throw new Error('Notificación no encontrada');
    }

    return notification;
  }

  async markAsRead(id: string): Promise<void> {
    await delay(300);
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    const notification = mockNotifications.find(n => n.id === id && n.userId === currentUser.id);
    if (!notification) {
      throw new Error('Notificación no encontrada');
    }

    if (!notification.read) {
      notification.read = true;
      notification.readAt = new Date();
      notification.updatedAt = new Date();
    }
  }

  async deleteNotification(id: string): Promise<void> {
    await delay(300);
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    const index = mockNotifications.findIndex(n => n.id === id && n.userId === currentUser.id);
    if (index === -1) {
      throw new Error('Notificación no encontrada');
    }

    mockNotifications.splice(index, 1);
  }

  async bulkDelete(request: BulkDeleteRequest): Promise<void> {
    await delay(500);
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    const { notificationIds } = request;
    
    mockNotifications = mockNotifications.filter(notification => 
      !(notificationIds.includes(notification.id) && notification.userId === currentUser.id)
    );
  }

  async createNotification(request: CreateNotificationRequest): Promise<Notification> {
    await delay(400);
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    if (!currentUser.isSafetyPersonnel) {
      throw new Error('Solo el personal de seguridad puede crear notificaciones');
    }

    const newNotification: Notification = {
      id: `notification_${Date.now()}`,
      userId: request.userId || currentUser.id,
      companyId: request.companyId || currentUser.companyId,
      type: request.type,
      title: request.title,
      message: request.message,
      actionUrl: request.actionUrl,
      read: false,
      createdAt: new Date(),
      priority: request.priority || 'medium',
      metadata: request.metadata,
      emailSent: request.sendEmail || false,
      emailSentAt: request.sendEmail ? new Date() : undefined
    };

    mockNotifications.push(newNotification);
    return newNotification;
  }

  async getCompanyNotifications(companyId: string, page: number = 1, limit: number = 10): Promise<PaginatedNotifications> {
    await delay(500);
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    if (!currentUser.isSafetyPersonnel) {
      throw new Error('Solo el personal de seguridad puede acceder a las notificaciones de la empresa');
    }

    const companyNotifications = mockNotifications
      .filter(n => n.companyId === companyId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = companyNotifications.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const notifications = companyNotifications.slice(startIndex, endIndex);

    return {
      notifications,
      total,
      page,
      limit,
      totalPages
    };
  }

  async runExpirationCheck(): Promise<{ message: string; notificationsCreated: number }> {
    await delay(1000);
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    if (!currentUser.isSafetyPersonnel) {
      throw new Error('Solo el personal de seguridad puede ejecutar verificaciones de vencimiento');
    }

    const notificationsCreated = Math.floor(Math.random() * 5) + 1;
    
    for (let i = 0; i < notificationsCreated; i++) {
      const expirationNotification: Notification = {
        id: `exp_check_${Date.now()}_${i}`,
        userId: `user${Math.floor(Math.random() * 10) + 1}`,
        companyId: currentUser.companyId,
        type: ['course_expiring', 'document_expiring', 'permit_expiring'][Math.floor(Math.random() * 3)] as any,
        title: 'Verificación automática de vencimiento',
        message: `Se detectó un elemento próximo a vencer durante la verificación automática.`,
        read: false,
        createdAt: new Date(),
        priority: 'medium',
        emailSent: true,
        emailSentAt: new Date(),
        metadata: { autoGenerated: true, checkType: 'scheduled' }
      };
      
      mockNotifications.push(expirationNotification);
    }

    return {
      message: `Verificación de vencimiento completada. Se crearon ${notificationsCreated} notificaciones.`,
      notificationsCreated
    };
  }

  async resendEmail(id: string): Promise<void> {
    await delay(600);
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    if (!currentUser.isSafetyPersonnel) {
      throw new Error('Solo el personal de seguridad puede reenviar emails');
    }

    const notification = mockNotifications.find(n => n.id === id);
    if (!notification) {
      throw new Error('Notificación no encontrada');
    }

    notification.emailSent = true;
    notification.emailSentAt = new Date();
    notification.updatedAt = new Date();
  }
}

export const notificationService = new NotificationService();
export default notificationService;