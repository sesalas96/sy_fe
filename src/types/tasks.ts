export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: string;
  assignedToName?: string;
  assigneeAvatar?: string;
  createdBy: string;
  createdByName?: string;
  epicId?: string;
  teamId?: string;
  teamName?: string;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  attachments?: string[];
  comments?: TaskComment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: Date;
}

export interface Epic {
  id: string;
  title: string;
  description: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  teamId: string;
  teamName?: string;
  createdBy: string;
  createdByName?: string;
  startDate?: Date;
  endDate?: Date;
  progress: number; // 0-100
  tasks: Task[];
  createdAt: Date;
  updatedAt: Date;
}

export interface KanbanColumn {
  id: string;
  title: string;
  status: Task['status'];
  color: string;
  tasks: Task[];
}

export interface TaskFilters {
  status?: Task['status'][];
  priority?: Task['priority'][];
  assignedTo?: string[];
  epicId?: string[];
  teamId?: string[];
  search?: string;
  dueDate?: {
    from?: Date;
    to?: Date;
  };
}

export interface CreateTaskData {
  title: string;
  description: string;
  assignedTo: string;
  team: string; // Changed from teamId to team to match API
  priority: Task['priority'];
  status: Task['status'];
  dueDate: Date;
  estimatedHours: number;
  storyPoints: number;
  tags: string[];
  epicId?: string; // Optional epic assignment
}

export interface UpdateTaskData {
  id: string;
  title?: string;
  description?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  assignedTo?: string;
  actualHours?: number;
  tags?: string[];
}

export interface CreateEpicData {
  title: string;
  description: string;
  team: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: Date;
  estimatedHours: number;
  color: string;
  tags: string[];
}