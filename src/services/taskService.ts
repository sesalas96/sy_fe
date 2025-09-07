import { Task, Epic, TaskFilters, CreateTaskData, UpdateTaskData, CreateEpicData, TaskComment } from '../types/tasks';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://sybe-production.up.railway.app';

class TaskService {
  private getAuthToken(): string {
    return localStorage.getItem('token') || '';
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getAuthToken()}`
    };
  }

  // GET /api/tasks - Get tasks based on user permissions and filters
  async getTasks(filters?: TaskFilters): Promise<Task[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.status) filters.status.forEach(s => params.append('status', s));
      if (filters?.priority) filters.priority.forEach(p => params.append('priority', p));
      if (filters?.assignedTo) filters.assignedTo.forEach(a => params.append('assignedTo', a));
      if (filters?.epicId) filters.epicId.forEach(e => params.append('epicId', e));
      if (filters?.teamId) filters.teamId.forEach(t => params.append('teamId', t));
      if (filters?.search) params.append('search', filters.search);
      if (filters?.dueDate?.from) params.append('dueDateFrom', filters.dueDate.from.toISOString());
      if (filters?.dueDate?.to) params.append('dueDateTo', filters.dueDate.to.toISOString());

      const url = `${API_BASE_URL}/api/tasks?${params}`;
      console.log('GET Tasks URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Tasks API response:', data);
      
      // Handle the API response format: { success: true, data: [...] }
      const tasks = data.success && Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      
      return tasks.map((task: any) => ({
        id: task._id || task.id,
        title: task.title || 'Sin título',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        assignedTo: task.assignedTo?._id || task.assignedTo || '',
        assignedToName: task.assignedTo?.fullName || task.assignedToName || 'Sin asignar',
        assigneeAvatar: task.assignedTo?.avatar || task.assigneeAvatar,
        createdBy: task.createdBy?._id || task.createdBy || '',
        createdByName: task.createdBy?.fullName || task.createdByName || 'Sin autor',
        epicId: task.epic?._id || task.epicId,
        teamId: task.team?._id || task.teamId,
        teamName: task.team?.name || task.teamName,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        estimatedHours: task.estimatedHours || 0,
        actualHours: task.actualHours || 0,
        tags: task.tags || [],
        attachments: task.attachments || [],
        comments: task.comments || [],
        createdAt: new Date(task.createdAt || Date.now()),
        updatedAt: new Date(task.updatedAt || Date.now())
      }));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  }

  // GET /api/tasks/epics - Get epics based on user permissions
  async getEpics(teamId?: string): Promise<Epic[]> {
    try {
      const params = new URLSearchParams();
      if (teamId) params.append('teamId', teamId);
      params.append('limit', '20'); // Add default limit

      const url = `${API_BASE_URL}/api/tasks/epics?${params}`;
      console.log('GET Epics URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Epics API response:', data);
      
      const epics = data.success && Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      
      return epics.map((epic: any) => ({
        id: epic._id || epic.id,
        title: epic.title || 'Sin título',
        description: epic.description || '',
        status: epic.status || 'planning',
        teamId: epic.team?._id || epic.teamId || '',
        teamName: epic.team?.name || epic.teamName || 'Sin equipo',
        createdBy: epic.createdBy?._id || epic.createdBy || '',
        createdByName: epic.createdBy?.fullName || epic.createdByName || 'Sin autor',
        startDate: epic.startDate ? new Date(epic.startDate) : undefined,
        endDate: epic.endDate ? new Date(epic.endDate) : undefined,
        progress: epic.progress || 0,
        tasks: epic.tasks || [],
        createdAt: new Date(epic.createdAt || Date.now()),
        updatedAt: new Date(epic.updatedAt || Date.now())
      }));
    } catch (error) {
      console.error('Error fetching epics:', error);
      throw error;
    }
  }

  // POST /api/tasks - Create new task
  async createTask(taskData: CreateTaskData): Promise<Task> {
    try {
      console.log('Creating task with data:', taskData);
      
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(taskData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Create task API response:', data);
      
      const task = data.success ? data.data : (data.task || data);
      
      return {
        id: task._id || task.id,
        title: task.title || taskData.title,
        description: task.description || taskData.description,
        status: task.status || 'todo',
        priority: task.priority || taskData.priority,
        assignedTo: task.assignedTo?._id || task.assignedTo || taskData.assignedTo,
        assignedToName: task.assignedTo?.fullName || task.assignedToName || 'Sin asignar',
        assigneeAvatar: task.assignedTo?.avatar || task.assigneeAvatar,
        createdBy: task.createdBy?._id || task.createdBy || '',
        createdByName: task.createdBy?.fullName || task.createdByName || 'Sin autor',
        epicId: task.epic?._id || task.epicId || taskData.epicId,
        teamId: task.team?._id || task.teamId || task.team || taskData.team,
        teamName: task.team?.name || task.teamName,
        dueDate: task.dueDate ? new Date(task.dueDate) : taskData.dueDate,
        estimatedHours: task.estimatedHours || taskData.estimatedHours || 0,
        actualHours: 0,
        tags: task.tags || taskData.tags || [],
        attachments: [],
        comments: [],
        createdAt: new Date(task.createdAt || Date.now()),
        updatedAt: new Date(task.updatedAt || Date.now())
      };
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  // POST /api/tasks/epics - Create new epic
  async createEpic(epicData: CreateEpicData): Promise<Epic> {
    try {
      console.log('Creating epic with data:', epicData);
      
      const response = await fetch(`${API_BASE_URL}/api/tasks/epics`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(epicData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('Create epic error response:', errorData);
        
        // If we have structured validation errors, throw them as JSON string
        if (errorData.error === 'Validation failed' && errorData.details) {
          throw new Error(JSON.stringify(errorData));
        }
        
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Create epic API response:', data);
      
      const epic = data.success ? data.data : (data.epic || data);
      
      return {
        id: epic._id || epic.id,
        title: epic.title || epicData.title,
        description: epic.description || epicData.description,
        status: epic.status || 'planning',
        teamId: epic.team?._id || epic.teamId || epic.team || epicData.team,
        teamName: epic.team?.name || epic.teamName || 'Sin equipo',
        createdBy: epic.createdBy?._id || epic.createdBy || '',
        createdByName: epic.createdBy?.fullName || epic.createdByName || 'Sin autor',
        startDate: epic.startDate ? new Date(epic.startDate) : undefined,
        endDate: epic.endDate ? new Date(epic.endDate) : undefined,
        progress: 0,
        tasks: [],
        createdAt: new Date(epic.createdAt || Date.now()),
        updatedAt: new Date(epic.updatedAt || Date.now())
      };
    } catch (error) {
      console.error('Error creating epic:', error);
      throw error;
    }
  }

  // PUT /api/tasks/{taskId} - Update task
  async updateTask(updateData: UpdateTaskData): Promise<Task> {
    try {
      console.log('Updating task:', updateData);
      
      const response = await fetch(`${API_BASE_URL}/api/tasks/${updateData.id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Update task API response:', data);
      
      const task = data.success ? data.data : (data.task || data);
      
      return {
        id: task._id || task.id,
        title: task.title || 'Sin título',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        assignedTo: task.assignedTo?._id || task.assignedTo || '',
        assignedToName: task.assignedTo?.fullName || task.assignedToName || 'Sin asignar',
        assigneeAvatar: task.assignedTo?.avatar || task.assigneeAvatar,
        createdBy: task.createdBy?._id || task.createdBy || '',
        createdByName: task.createdBy?.fullName || task.createdByName || 'Sin autor',
        epicId: task.epic?._id || task.epicId,
        teamId: task.team?._id || task.teamId,
        teamName: task.team?.name || task.teamName,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        estimatedHours: task.estimatedHours || 0,
        actualHours: task.actualHours || 0,
        tags: task.tags || [],
        attachments: task.attachments || [],
        comments: task.comments || [],
        createdAt: new Date(task.createdAt || Date.now()),
        updatedAt: new Date(task.updatedAt || Date.now())
      };
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  // DELETE /api/tasks/{taskId} - Delete task
  async deleteTask(taskId: string): Promise<void> {
    try {
      console.log('Deleting task:', taskId);
      
      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      console.log('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  // POST /api/tasks/{taskId}/comments - Add comment to task
  async addTaskComment(taskId: string, content: string): Promise<TaskComment> {
    try {
      console.log('Adding comment to task:', taskId, content);
      
      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ content })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Add comment API response:', data);
      
      const comment = data.success ? data.data : (data.comment || data);
      
      return {
        id: comment._id || comment.id,
        taskId: comment.task || taskId,
        userId: comment.user?._id || comment.userId || '',
        userName: comment.user?.fullName || comment.userName || 'Usuario',
        userAvatar: comment.user?.avatar || comment.userAvatar,
        content: comment.content || content,
        createdAt: new Date(comment.createdAt || Date.now())
      };
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  // PUT /api/tasks/{taskId}/status - Update task status (for Kanban drag & drop)
  async updateTaskStatus(taskId: string, status: Task['status']): Promise<void> {
    try {
      console.log('Updating task status:', taskId, status);
      
      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      console.log('Task status updated successfully');
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }

  // PUT /api/tasks/epics/{epicId} - Update epic
  async updateEpic(epicId: string, epicData: Partial<Epic>): Promise<Epic> {
    try {
      console.log('Updating epic:', epicId, epicData);
      
      const response = await fetch(`${API_BASE_URL}/api/tasks/epics/${epicId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(epicData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Update epic API response:', data);
      
      const epic = data.success ? data.data : (data.epic || data);
      
      return {
        id: epic._id || epic.id,
        title: epic.title || 'Sin título',
        description: epic.description || '',
        status: epic.status || 'planning',
        teamId: epic.team?._id || epic.teamId || '',
        teamName: epic.team?.name || epic.teamName || 'Sin equipo',
        createdBy: epic.createdBy?._id || epic.createdBy || '',
        createdByName: epic.createdBy?.fullName || epic.createdByName || 'Sin autor',
        startDate: epic.startDate ? new Date(epic.startDate) : undefined,
        endDate: epic.endDate ? new Date(epic.endDate) : undefined,
        progress: epic.progress || 0,
        tasks: epic.tasks || [],
        createdAt: new Date(epic.createdAt || Date.now()),
        updatedAt: new Date(epic.updatedAt || Date.now())
      };
    } catch (error) {
      console.error('Error updating epic:', error);
      throw error;
    }
  }

  // DELETE /api/tasks/epics/{epicId} - Delete epic
  async deleteEpic(epicId: string): Promise<void> {
    try {
      console.log('Deleting epic:', epicId);
      
      const response = await fetch(`${API_BASE_URL}/api/tasks/epics/${epicId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      console.log('Epic deleted successfully');
    } catch (error) {
      console.error('Error deleting epic:', error);
      throw error;
    }
  }

  // GET /api/tasks/{taskId} - Get single task by ID
  async getTaskById(taskId: string): Promise<Task | null> {
    try {
      console.log('Getting task by ID:', taskId);
      
      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Get task by ID API response:', data);
      
      const task = data.success ? data.data : (data.task || data);
      
      return {
        id: task._id || task.id,
        title: task.title || 'Sin título',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        assignedTo: task.assignedTo?._id || task.assignedTo || '',
        assignedToName: task.assignedTo?.fullName || task.assignedToName || 'Sin asignar',
        assigneeAvatar: task.assignedTo?.avatar || task.assigneeAvatar,
        createdBy: task.createdBy?._id || task.createdBy || '',
        createdByName: task.createdBy?.fullName || task.createdByName || 'Sin autor',
        epicId: task.epic?._id || task.epicId,
        teamId: task.team?._id || task.teamId,
        teamName: task.team?.name || task.teamName,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        estimatedHours: task.estimatedHours || 0,
        actualHours: task.actualHours || 0,
        tags: task.tags || [],
        attachments: task.attachments || [],
        comments: task.comments || [],
        createdAt: new Date(task.createdAt || Date.now()),
        updatedAt: new Date(task.updatedAt || Date.now())
      };
    } catch (error) {
      console.error('Error fetching task by ID:', error);
      throw error;
    }
  }
}

export const taskService = new TaskService();
export default taskService;