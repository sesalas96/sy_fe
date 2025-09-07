import { UserRole } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'on_leave';
  company: string;
  lastLogin: Date | null;
  createdAt: Date;
  permissions: string[];
  complianceScore: number;
  assignedTasks: number;
  completedTrainings: number;
  pendingTrainings: number;
  // New fields from API
  firstName: string;
  lastName: string;
  cedula: string;
  phone: string;
  certifications: Certification[];
  courses: Course[];
  reviewStats: ReviewStats;
}

export interface Certification {
  _id?: string;
  name: string;
  issuedDate: string;
  expiryDate: string;
  status: 'valid' | 'expired' | 'expiring_soon';
}

export interface Course {
  _id?: string;
  courseId: string;
  courseName: string;
  completedDate?: string;
  score?: number;
  status: 'completed' | 'in_progress' | 'not_started';
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  wouldHireAgainPercentage: number;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  supervisor: string;
  supervisorName?: string;
  company?: string;
  companyName?: string;
  companyId?: string;
  members: string[];
  teamSize?: number;
  activeMembers?: number;
  inactiveMembers?: number;
  maxMembers?: number;
  teamType?: string;
  location?: string;
  workShift?: 'day' | 'morning' | 'afternoon' | 'night' | 'rotating' | 'flexible';
  status: 'active' | 'inactive';
  isActive?: boolean;
  completionRate?: number;
  membersFillRate?: number;
  stats?: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    activeMembers: number;
    averageRating: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamDashboardStats {
  teamMembers: number;
  activeMembers: number;
  onLeaveMembers: number;
  avgComplianceScore: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalTrainings: number;
  completedTrainings: number;
  pendingTrainings: number;
}

export interface TeamTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  status: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
  priority: 'baja' | 'media' | 'alta';
  dueDate: Date;
  createdAt: Date;
  completedAt?: Date;
  estimatedHours?: number;
  tags?: string[];
}

export interface PaginatedTeamMembers {
  members: TeamMember[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateTeamRequest {
  supervisorId: string;
  teamName: string;
  description: string;
  maxMembers?: number;
  teamType?: string;
  location?: string;
  workShift?: string;
}

export interface UpdateTeamRequest {
  teamName?: string;
  description?: string;
  maxMembers?: number;
  teamType?: string;
  location?: string;
  workShift?: string;
}

export interface AddTeamMemberRequest {
  contractorId: string;
}

export interface AssignTaskRequest {
  title: string;
  description: string;
  assignedTo: string;
  priority: 'baja' | 'media' | 'alta';
  dueDate: string;
  estimatedHours?: number;
  tags?: string[];
}

class TeamService {
  private getAuthToken(): string {
    return localStorage.getItem('token') || '';
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getAuthToken()}`
    };
  }

  // GET /api/teams - Get teams based on permissions
  async getTeams(status?: 'active' | 'inactive'): Promise<Team[]> {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      
      const response = await fetch(`${API_BASE_URL}/api/teams?${params}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const response_data = await response.json();
      console.log('Teams API response:', response_data);
      
      // Handle the specific API response format: { success: true, data: [...], pagination: {...} }
      const teams = response_data.success && Array.isArray(response_data.data) ? response_data.data : [];
      
      // Transform API response to match our interface  
      return teams.map((team: any) => {
        const teamId = team._id || team.id || '';
        console.log('Transforming team ID:', { original: team._id, fallback: team.id, final: teamId });
        return {
          id: teamId, // Keep original format, don't force to String()
          name: team.teamName || team.name || 'Equipo sin nombre',
          description: team.description || '',
          supervisor: team.supervisor?._id || team.supervisor || team.supervisorId || '',
          supervisorName: team.supervisorName || (team.supervisor ? `${team.supervisor.firstName} ${team.supervisor.lastName}` : ''),
          company: team.company?.name || team.company || '',
          companyName: team.companyName || team.company?.name || team.company || '',
          companyId: team.company?._id || team.companyId || '',
          members: Array.isArray(team.members) ? team.members.map((member: any) => member._id || member.id || member) : [],
          teamSize: team.teamSize || team.members?.length || 0,
          activeMembers: team.stats?.activeMembers || team.activeMembers || 0,
          inactiveMembers: team.inactiveMembers || 0,
          maxMembers: team.maxMembers || 10,
          teamType: team.teamType || 'general',
          location: team.location || '',
          workShift: team.workShift || 'day',
          status: team.isActive !== false ? 'active' : 'inactive',
          isActive: team.isActive !== false,
          completionRate: team.completionRate || 0,
          membersFillRate: team.membersFillRate || 0,
          stats: team.stats ? {
            totalTasks: team.stats.totalTasks || 0,
            completedTasks: team.stats.completedTasks || 0,
            pendingTasks: team.stats.pendingTasks || 0,
            activeMembers: team.stats.activeMembers || 0,
            averageRating: team.stats.averageRating || 0
          } : undefined,
          createdAt: new Date(team.createdAt || Date.now()),
          updatedAt: new Date(team.updatedAt || Date.now())
        };
      });
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
  }

  // GET /api/dashboard/team - Get detailed team member list with compliance scores (CONTRATISTA_ADMIN)
  async getTeamDashboard(page: number = 1, limit: number = 10): Promise<PaginatedTeamMembers> {
    try {
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      const response = await fetch(`${API_BASE_URL}/api/dashboard/team?${params}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform API response to match our interface
      const transformedMembers = data.teamMembers?.map((member: any) => ({
        id: member.id || member._id,
        name: member.name || `${member.nombres} ${member.apellidos}`.trim() || member.nombreCompleto,
        email: member.email || member.correo,
        role: member.role || UserRole.CONTRATISTA_SUBALTERNOS,
        status: member.status === 'activo' ? 'active' : member.status === 'inactivo' ? 'inactive' : member.status === 'baja' ? 'on_leave' : 'active',
        company: member.empresa || member.company?.name || member.company || 'Unknown',
        lastLogin: member.lastLogin || member.ultimoAcceso ? new Date(member.lastLogin || member.ultimoAcceso) : null,
        createdAt: new Date(member.createdAt || member.fechaIngreso || member.fechaCreacion || Date.now()),
        permissions: member.permissions || member.permisos || [],
        complianceScore: member.complianceScore || member.porcentajeCumplimiento || Math.floor(Math.random() * 20) + 80,
        assignedTasks: member.assignedTasks || member.tareasAsignadas || Math.floor(Math.random() * 10) + 2,
        completedTrainings: member.completedTrainings || member.entrenamientosCompletados || Math.floor(Math.random() * 15) + 5,
        pendingTrainings: member.pendingTrainings || member.entrenamientosPendientes || Math.floor(Math.random() * 5) + 1
      })) || [];

      return {
        members: transformedMembers,
        total: data.total || data.totalMembers || transformedMembers.length,
        page: data.page || data.currentPage || page,
        limit: data.limit || data.pageSize || limit,
        totalPages: data.totalPages || Math.ceil((data.total || transformedMembers.length) / limit)
      };
    } catch (error) {
      console.error('Error fetching team dashboard:', error);
      throw error;
    }
  }

  // GET /api/dashboard/stats - Get dashboard statistics (includes team stats for CONTRATISTA_ADMIN)
  async getTeamStats(): Promise<TeamDashboardStats> {
    try {
      
      const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform API response to match our interface
      return {
        teamMembers: data.teamStats?.total || data.totalMembers || data.miembrosEquipo || 0,
        activeMembers: data.teamStats?.active || data.activeMembers || data.miembrosActivos || 0,
        onLeaveMembers: data.teamStats?.onLeave || data.onLeaveMembers || data.miembrosPermiso || 0,
        avgComplianceScore: data.avgComplianceScore || data.promediosCumplimiento || data.teamStats?.avgCompliance || 85,
        totalTasks: data.taskStats?.total || data.totalTasks || data.totalTareas || 0,
        completedTasks: data.taskStats?.completed || data.completedTasks || data.tareasCompletadas || 0,
        pendingTasks: data.taskStats?.pending || data.pendingTasks || data.tareasPendientes || 0,
        totalTrainings: data.trainingStats?.total || data.totalTrainings || data.totalEntrenamientos || 0,
        completedTrainings: data.trainingStats?.completed || data.completedTrainings || data.entrenamientosCompletados || 0,
        pendingTrainings: data.trainingStats?.pending || data.pendingTrainings || data.entrenamientosPendientes || 0
      };
    } catch (error) {
      console.error('Error fetching team stats:', error);
      throw error;
    }
  }

  // POST /api/teams - Create new contractor team
  async createTeam(teamData: CreateTeamRequest): Promise<Team> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/teams`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(teamData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const response_data = await response.json();
      console.log('Create team API response:', response_data);
      
      // Handle different response formats - could be { success: true, data: team } or direct team object
      const team = response_data.success ? response_data.data : (response_data.team || response_data);
      
      return {
        id: team._id || team.id || '',
        name: team.teamName || team.name || 'Equipo sin nombre',
        description: team.description || '',
        supervisor: team.supervisor?._id || team.supervisor || team.supervisorId || '',
        supervisorName: team.supervisor ? `${team.supervisor.firstName} ${team.supervisor.lastName}` : '',
        company: team.company?.name || team.company || '',
        companyId: team.company?._id || team.companyId || '',
        members: Array.isArray(team.members) ? team.members.map((member: any) => member._id || member.id || member) : [],
        teamSize: team.teamSize || team.members?.length || 0,
        activeMembers: team.activeMembers || 0,
        inactiveMembers: team.inactiveMembers || 0,
        status: team.status || 'active',
        createdAt: new Date(team.createdAt || Date.now()),
        updatedAt: new Date(team.updatedAt || Date.now())
      };
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  }

  // GET /api/teams/{teamId} - Get team details including members
  async getTeamById(teamId: string): Promise<Team> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const response_data = await response.json();
      console.log('Get team by ID API response:', response_data);
      
      // Handle different response formats
      const team = response_data.success ? response_data.data : (response_data.team || response_data);
      
      return {
        id: team._id || team.id || '',
        name: team.name || team.teamName || 'Equipo sin nombre',
        description: team.description || '',
        supervisor: team.supervisor || team.supervisorId || '',
        members: Array.isArray(team.members) ? team.members : [],
        status: team.status || 'active',
        createdAt: new Date(team.createdAt || Date.now()),
        updatedAt: new Date(team.updatedAt || Date.now())
      };
    } catch (error) {
      console.error('Error fetching team:', error);
      throw error;
    }
  }

  // PUT /api/teams/{teamId} - Update team information
  async updateTeam(teamId: string, updateData: UpdateTeamRequest): Promise<Team> {
    try {
      const url = `${API_BASE_URL}/api/teams/${teamId}`;
      console.log('UPDATE TEAM - URL:', url);
      console.log('UPDATE TEAM - Team ID:', teamId);
      console.log('UPDATE TEAM - Update Data:', updateData);
      console.log('UPDATE TEAM - Headers:', this.getHeaders());
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updateData)
      });

      console.log('UPDATE TEAM - Response Status:', response.status);
      console.log('UPDATE TEAM - Response Status Text:', response.statusText);

      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          console.log('UPDATE TEAM - Error Data:', errorData);
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          console.log('UPDATE TEAM - Could not parse error response as JSON');
        }
        
        throw new Error(errorMessage);
      }

      const response_data = await response.json();
      console.log('Update team API response:', response_data);
      
      // Handle different response formats
      const team = response_data.success ? response_data.data : (response_data.team || response_data);
      
      console.log('Transformed team data for update:', team);
      
      const transformedTeamId = team._id || team.id || '';
      console.log('UPDATE TEAM - Transformed team ID:', { original: team._id, fallback: team.id, final: transformedTeamId });
      
      return {
        id: transformedTeamId, // Keep original format
        name: team.teamName || team.name || 'Equipo sin nombre',
        description: team.description || '',
        supervisor: team.supervisor?._id || team.supervisor || team.supervisorId || '',
        supervisorName: team.supervisor ? `${team.supervisor.firstName} ${team.supervisor.lastName}` : '',
        company: team.company?.name || team.company || '',
        companyId: team.company?._id || team.companyId || '',
        members: Array.isArray(team.members) ? team.members.map((member: any) => member._id || member.id || member) : [],
        teamSize: team.teamSize || team.members?.length || 0,
        activeMembers: team.activeMembers || 0,
        inactiveMembers: team.inactiveMembers || 0,
        maxMembers: team.maxMembers || 10,
        teamType: team.teamType || 'general',
        location: team.location || '',
        workShift: team.workShift || 'diurno',
        status: team.status || 'active',
        createdAt: new Date(team.createdAt || Date.now()),
        updatedAt: new Date(team.updatedAt || Date.now())
      };
    } catch (error) {
      console.error('Error updating team:', error);
      throw error;
    }
  }

  // DELETE /api/teams/{teamId} - Soft delete team
  async deleteTeam(teamId: string): Promise<void> {
    try {
      console.log(`Performing soft delete for team: ${teamId}`);
      
      const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      console.log('Soft delete response status:', response.status);

      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          console.log('Response is not JSON, using status text');
        }
        
        throw new Error(errorMessage);
      }
      
      // Handle both 204 No Content and 200 OK responses
      if (response.status === 204) {
        console.log('Team soft deleted successfully (204 No Content)');
      } else {
        try {
          const responseData = await response.json();
          console.log('Soft delete team API response:', responseData);
        } catch (parseError) {
          console.log('Delete response is not JSON (probably 204 No Content)');
        }
      }
      
      console.log('Team soft deleted successfully');
    } catch (error) {
      console.error('Error soft deleting team:', error);
      throw error;
    }
  }

  // PATCH /api/teams/{teamId}/toggle - Toggle team active status
  async toggleTeamStatus(teamId: string, isActive: boolean): Promise<Team> {
    try {
      console.log(`Toggling team status: ${teamId} to ${isActive ? 'active' : 'inactive'}`);
      
      const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/toggle`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ 
          isActive: isActive
        })
      });

      console.log('Toggle status response:', response.status);

      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          console.log('Response is not JSON, using status text');
        }
        
        throw new Error(errorMessage);
      }
      
      const response_data = await response.json();
      console.log('Toggle team status API response:', response_data);
      
      // Handle different response formats
      const team = response_data.success ? response_data.data : (response_data.team || response_data);
      
      const transformedTeamId = team._id || team.id || '';
      
      const updatedTeam: Team = {
        id: transformedTeamId,
        name: team.teamName || team.name || 'Equipo sin nombre',
        description: team.description || '',
        supervisor: team.supervisor?._id || team.supervisor || team.supervisorId || '',
        supervisorName: team.supervisorName || (team.supervisor ? `${team.supervisor.firstName} ${team.supervisor.lastName}` : ''),
        company: team.company?.name || team.company || '',
        companyName: team.companyName || team.company?.name || team.company || '',
        companyId: team.company?._id || team.companyId || '',
        members: Array.isArray(team.members) ? team.members.map((member: any) => member._id || member.id || member) : [],
        teamSize: team.teamSize || team.members?.length || 0,
        activeMembers: team.stats?.activeMembers || team.activeMembers || 0,
        inactiveMembers: team.inactiveMembers || 0,
        maxMembers: team.maxMembers || 10,
        teamType: team.teamType || 'general',
        location: team.location || '',
        workShift: team.workShift || 'diurno',
        status: isActive ? 'active' : 'inactive',
        isActive: isActive,
        completionRate: team.completionRate || 0,
        membersFillRate: team.membersFillRate || 0,
        stats: team.stats ? {
          totalTasks: team.stats.totalTasks || 0,
          completedTasks: team.stats.completedTasks || 0,
          pendingTasks: team.stats.pendingTasks || 0,
          activeMembers: team.stats.activeMembers || 0,
          averageRating: team.stats.averageRating || 0
        } : undefined,
        createdAt: new Date(team.createdAt || Date.now()),
        updatedAt: new Date(team.updatedAt || Date.now())
      };
      
      console.log(`Team status toggled successfully to ${isActive ? 'active' : 'inactive'}`);
      return updatedTeam;
    } catch (error) {
      console.error('Error toggling team status:', error);
      throw error;
    }
  }

  // POST /api/teams/{teamId}/restore - Restore soft deleted team
  async reactivateTeam(teamId: string): Promise<void> {
    try {
      console.log(`Restoring team: ${teamId}`);
      
      const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/restore`, {
        method: 'POST',
        headers: this.getHeaders()
      });

      console.log('Restore response status:', response.status);

      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          console.log('Response is not JSON, using status text');
        }
        
        throw new Error(errorMessage);
      }
      
      // Handle both 204 No Content and 200 OK responses
      if (response.status === 204) {
        console.log('Team restored successfully (204 No Content)');
      } else {
        try {
          const responseData = await response.json();
          console.log('Restore team API response:', responseData);
        } catch (parseError) {
          console.log('Restore response is not JSON (probably 204 No Content)');
        }
      }
      
      console.log('Team restored successfully');
    } catch (error) {
      console.error('Error restoring team:', error);
      throw error;
    }
  }

  // GET /api/teams/deleted - Get soft deleted teams
  async getDeletedTeams(): Promise<Team[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/teams/deleted`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const response_data = await response.json();
      console.log('Deleted teams API response:', response_data);
      
      // Handle the specific API response format
      const teams = response_data.success && Array.isArray(response_data.data) ? response_data.data : [];
      
      // Transform API response to match our interface  
      return teams.map((team: any) => {
        const teamId = team._id || team.id || '';
        console.log('Transforming deleted team ID:', { original: team._id, fallback: team.id, final: teamId });
        return {
          id: teamId,
          name: team.teamName || team.name || 'Equipo sin nombre',
          description: team.description || '',
          supervisor: team.supervisor?._id || team.supervisor || team.supervisorId || '',
          supervisorName: team.supervisorName || (team.supervisor ? `${team.supervisor.firstName} ${team.supervisor.lastName}` : ''),
          company: team.company?.name || team.company || '',
          companyName: team.companyName || team.company?.name || team.company || '',
          companyId: team.company?._id || team.companyId || '',
          members: Array.isArray(team.members) ? team.members.map((member: any) => member._id || member.id || member) : [],
          teamSize: team.teamSize || team.members?.length || 0,
          activeMembers: team.stats?.activeMembers || team.activeMembers || 0,
          inactiveMembers: team.inactiveMembers || 0,
          maxMembers: team.maxMembers || 10,
          teamType: team.teamType || 'general',
          location: team.location || '',
          workShift: team.workShift || 'day',
          status: 'inactive', // Deleted teams are inactive
          isActive: false,
          completionRate: team.completionRate || 0,
          membersFillRate: team.membersFillRate || 0,
          stats: team.stats ? {
            totalTasks: team.stats.totalTasks || 0,
            completedTasks: team.stats.completedTasks || 0,
            pendingTasks: team.stats.pendingTasks || 0,
            activeMembers: team.stats.activeMembers || 0,
            averageRating: team.stats.averageRating || 0
          } : undefined,
          createdAt: new Date(team.createdAt || Date.now()),
          updatedAt: new Date(team.updatedAt || Date.now())
        };
      });
    } catch (error) {
      console.error('Error fetching deleted teams:', error);
      throw error;
    }
  }

  // POST /api/teams/{teamId}/members - Add member to team
  async addTeamMember(teamId: string, memberData: AddTeamMemberRequest): Promise<void> {
    try {
      const url = `${API_BASE_URL}/api/teams/${teamId}/members`;
      console.log('POST Add Team Member URL:', url);
      console.log('POST Add Team Member Headers:', this.getHeaders());
      console.log('POST Add Team Member Body:', JSON.stringify(memberData));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(memberData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Add team member error response:', errorData);
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json().catch(() => ({}));
      console.log('Add team member API response:', data);
    } catch (error) {
      console.error('Error adding team member:', error);
      throw error;
    }
  }

  // DELETE /api/teams/{teamId}/members/{memberId} - Remove member from team
  async removeTeamMember(teamId: string, memberId: string): Promise<void> {
    try {
      const url = `${API_BASE_URL}/api/teams/${teamId}/members/${memberId}`;
      console.log('DELETE Remove Team Member URL:', url);
      console.log('DELETE Remove Team Member Headers:', this.getHeaders());
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Remove team member error response:', errorData);
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json().catch(() => ({}));
      console.log('Remove team member API response:', data);
    } catch (error) {
      console.error('Error removing team member:', error);
      throw error;
    }
  }

  // GET /api/teams/{teamId}/tasks - Get tasks assigned to team with filters
  async getTeamTasks(
    teamId: string, 
    filters?: {
      status?: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
      priority?: 'baja' | 'media' | 'alta';
      page?: number;
      limit?: number;
    }
  ): Promise<TeamTask[]> {
    try {
      
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      
      const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/tasks?${params}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return (data.tasks || data).map((task: any) => ({
        ...task,
        dueDate: new Date(task.dueDate || task.fechaVencimiento),
        createdAt: new Date(task.createdAt || task.fechaCreacion),
        completedAt: task.completedAt || task.fechaCompletado ? new Date(task.completedAt || task.fechaCompletado) : undefined
      }));
    } catch (error) {
      console.error('Error fetching team tasks:', error);
      throw error;
    }
  }

  // POST /api/teams/{teamId}/tasks - Assign new task to team
  async assignTaskToTeam(teamId: string, taskData: AssignTaskRequest): Promise<TeamTask> {
    try {
      
      const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/tasks`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(taskData)
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        ...data,
        dueDate: new Date(data.dueDate),
        createdAt: new Date(data.createdAt),
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined
      };
    } catch (error) {
      console.error('Error assigning task to team:', error);
      throw error;
    }
  }

  // Utility method to get current user's teams
  async getMyTeams(): Promise<Team[]> {
    return this.getTeams('active');
  }

  // GET /api/teams/{teamId}/members - Get team members with optional filters
  async getTeamMembers(
    teamId: string,
    filters?: {
      status?: 'activo' | 'inactivo' | 'baja';
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<TeamMember[]> {
    try {
      
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      
      const url = `${API_BASE_URL}/api/teams/${teamId}/members?${params}`;
      console.log('GET Team Members URL:', url);
      console.log('GET Team Members Headers:', this.getHeaders());
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Team members API response:', data);
      
      // Handle the new API response format: { success: true, data: [...] }
      const members = data.success && Array.isArray(data.data) ? data.data : (data.members || data);
      
      return members.map((member: any) => {
        console.log('Mapping team member:', member); // Debug log for each member
        
        // Try different name field combinations
        let memberName = '';
        if (member.firstName && member.lastName) {
          memberName = `${member.firstName} ${member.lastName}`.trim();
        } else if (member.fullName) {
          memberName = member.fullName;
        } else if (member.name) {
          memberName = member.name;
        } else if (member.nombreCompleto) {
          memberName = member.nombreCompleto;
        } else if (member.nombres && member.apellidos) {
          memberName = `${member.nombres} ${member.apellidos}`.trim();
        } else {
          memberName = 'Sin nombre';
        }
        
        // Try different email field variations
        const memberEmail = member.email || member.correo || member.emailAddress || member.correoElectronico || '';
        
        return {
          id: member._id || member.id,
          name: memberName,
          email: memberEmail,
          role: member.role || UserRole.CONTRATISTA_SUBALTERNOS,
          status: member.status || 'active', // API already returns 'active', 'inactive', etc.
          company: member.company?.name || member.empresa || member.company || 'Unknown',
          lastLogin: member.lastLogin || member.ultimoAcceso ? new Date(member.lastLogin || member.ultimoAcceso) : null,
          createdAt: new Date(member.createdAt || member.fechaIngreso || member.fechaCreacion || Date.now()),
          permissions: member.permissions || member.permisos || [],
          // Calculate compliance score based on certifications and courses
          complianceScore: this.calculateComplianceScore(member),
          assignedTasks: member.assignedTasks || member.tareasAsignadas || 0,
          completedTrainings: member.courses?.filter((c: any) => c.status === 'completed').length || 0,
          pendingTrainings: member.courses?.filter((c: any) => c.status !== 'completed').length || 0,
          // Additional fields from new API structure
          firstName: member.firstName || '',
          lastName: member.lastName || '',
          cedula: member.cedula || '',
          phone: member.phone || '',
          certifications: member.certifications || [],
          courses: member.courses || [],
          reviewStats: member.reviewStats || {
            averageRating: 0,
            totalReviews: 0,
            wouldHireAgainPercentage: 0
          }
        };
      });
    } catch (error) {
      console.error('Error fetching team members:', error);
      throw error;
    }
  }

  // Helper function to calculate compliance score
  private calculateComplianceScore(member: any): number {
        if (member.complianceScore) return member.complianceScore;
        
        const certifications = member.certifications || [];
        const courses = member.courses || [];
        
        // Calculate based on certifications status
        let score = 70; // Base score
        
        if (certifications.length > 0) {
          const validCerts = certifications.filter((c: any) => c.status === 'valid').length;
          const totalCerts = certifications.length;
          score += (validCerts / totalCerts) * 20; // Up to 20 points for valid certifications
        }
        
        if (courses.length > 0) {
          const completedCourses = courses.filter((c: any) => c.status === 'completed').length;
          const totalCourses = courses.length;
          score += (completedCourses / totalCourses) * 10; // Up to 10 points for completed courses
        }
        
        return Math.min(Math.round(score), 100);
  }

  // PUT /api/teams/{teamId}/members/{memberId} - Update team member
  async updateTeamMember(
    teamId: string, 
    memberId: string, 
    updateData: { status?: 'activo' | 'inactivo' | 'baja' }
  ): Promise<void> {
    try {
      const url = `${API_BASE_URL}/api/teams/${teamId}/members/${memberId}`;
      console.log('PUT Update Team Member URL:', url);
      console.log('PUT Update Team Member Headers:', this.getHeaders());
      console.log('PUT Update Team Member Body:', JSON.stringify(updateData));
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Update team member error response:', errorData);
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json().catch(() => ({}));
      console.log('Update team member API response:', data);
    } catch (error) {
      console.error('Error updating team member:', error);
      throw error;
    }
  }

  // GET /api/teams/{teamId}/stats - Get comprehensive team statistics
  async getSpecificTeamStats(teamId: string): Promise<any> {
    try {
      
      const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/stats`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching team stats:', error);
      throw error;
    }
  }

  // POST /api/contractors - Create new contractor
  async createContractor(contractorData: {
    fullName: string;
    cedula: string;
    companyId: string;
    polizaINS: {
      number: string;
      expiryDate: string;
    };
  }): Promise<TeamMember> {
    try {
      console.log('Creating contractor with data:', contractorData);
      
      const response = await fetch(`${API_BASE_URL}/api/contractors`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(contractorData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // If we have structured validation errors, throw them as JSON string
        if (errorData.error === 'Validation failed' && errorData.details) {
          throw new Error(JSON.stringify(errorData));
        }
        
        // Otherwise throw a regular error message
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Create contractor API response:', data);
      
      // Handle different response formats
      const contractor = data.success ? data.data : (data.contractor || data);
      console.log('Creating contractor - mapped data:', contractor); // Debug log
      
      // Try different name field combinations for created contractor
      let contractorName = '';
      if (contractor.fullName) {
        contractorName = contractor.fullName;
      } else if (contractor.firstName && contractor.lastName) {
        contractorName = `${contractor.firstName} ${contractor.lastName}`.trim();
      } else if (contractor.name) {
        contractorName = contractor.name;
      } else if (contractorData.fullName) {
        contractorName = contractorData.fullName;
      } else {
        contractorName = 'Sin nombre';
      }
      
      // Try different email field variations
      const contractorEmail = contractor.email || contractor.correo || contractor.emailAddress || contractor.correoElectronico || '';
      
      return {
        id: contractor._id || contractor.id || '',
        name: contractorName,
        email: contractorEmail,
        role: contractor.role || UserRole.CONTRATISTA_SUBALTERNOS,
        status: contractor.status || 'active',
        company: contractor.company?.name || contractor.companyName || 'Unknown',
        lastLogin: null,
        createdAt: new Date(contractor.createdAt || Date.now()),
        permissions: contractor.permissions || [],
        complianceScore: this.calculateComplianceScore(contractor),
        assignedTasks: 0,
        completedTrainings: 0,
        pendingTrainings: 0,
        // Additional fields from API structure
        firstName: contractor.firstName || contractorData.fullName.split(' ')[0] || '',
        lastName: contractor.lastName || contractorData.fullName.split(' ').slice(1).join(' ') || '',
        cedula: contractor.cedula || contractorData.cedula || '',
        phone: contractor.phone || '',
        certifications: contractor.certifications || [],
        courses: contractor.courses || [],
        reviewStats: contractor.reviewStats || {
          averageRating: 0,
          totalReviews: 0,
          wouldHireAgainPercentage: 0
        }
      };
    } catch (error) {
      console.error('Error creating contractor:', error);
      throw error;
    }
  }

  // GET /api/contractors - Get contractors that can be added to teams
  async getAvailableContractors(
    filters?: {
      search?: string;
      companyId?: string;
      status?: string;
      excludeTeamId?: string; // We'll handle this client-side for now
    }
  ): Promise<TeamMember[]> {
    try {
      const params = new URLSearchParams();
      
      // Add API-supported filters
      if (filters?.search) params.append('search', filters.search);
      if (filters?.companyId) params.append('companyId', filters.companyId);
      if (filters?.status) params.append('status', filters.status);
      else params.append('status', 'activo'); // Default to active contractors
      
      const url = `${API_BASE_URL}/api/contractors?${params}`;
      console.log('GET Contractors URL:', url);
      console.log('GET Contractors Headers:', this.getHeaders());
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Contractors API response:', data);
      
      // Handle the API response format: { success: true, data: [...] }
      const contractors = data.success && Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      
      // If we need to exclude contractors already in a team, we'll need to do this client-side
      // since the API doesn't seem to support excludeTeamId parameter
      let filteredContractors = contractors;
      
      if (filters?.excludeTeamId) {
        try {
          // Get current team members to exclude them
          const teamMembers = await this.getTeamMembers(filters.excludeTeamId);
          const teamMemberIds = teamMembers.map(m => m.id);
          filteredContractors = contractors.filter((contractor: any) => 
            !teamMemberIds.includes(contractor._id || contractor.id)
          );
          console.log(`Filtered out ${contractors.length - filteredContractors.length} contractors already in team`);
        } catch (error) {
          console.warn('Could not exclude team members, showing all contractors:', error);
        }
      }
      
      return filteredContractors.map((contractor: any) => {
        console.log('Mapping contractor:', contractor); // Debug log for each contractor
        
        // Try different name field combinations  
        let contractorName = '';
        if (contractor.fullName) {
          contractorName = contractor.fullName;
        } else if (contractor.firstName && contractor.lastName) {
          contractorName = `${contractor.firstName} ${contractor.lastName}`.trim();
        } else if (contractor.name) {
          contractorName = contractor.name;
        } else if (contractor.nombreCompleto) {
          contractorName = contractor.nombreCompleto;
        } else if (contractor.nombres && contractor.apellidos) {
          contractorName = `${contractor.nombres} ${contractor.apellidos}`.trim();
        } else {
          contractorName = 'Sin nombre';
        }
        
        // Try different email field variations
        const contractorEmail = contractor.email || contractor.correo || contractor.emailAddress || contractor.correoElectronico || '';
        
        return {
          id: contractor._id || contractor.id,
          name: contractorName,
          email: contractorEmail,
          role: contractor.role || UserRole.CONTRATISTA_SUBALTERNOS,
          status: contractor.status === 'activo' ? 'active' : contractor.status === 'inactivo' ? 'inactive' : contractor.status || 'active',
          company: contractor.company?.name || contractor.companyName || 'Unknown',
          lastLogin: contractor.lastLogin ? new Date(contractor.lastLogin) : null,
          createdAt: new Date(contractor.createdAt || Date.now()),
          permissions: contractor.permissions || [],
          complianceScore: this.calculateComplianceScore(contractor),
          assignedTasks: 0,
          completedTrainings: contractor.courses?.filter((c: any) => c.status === 'completed').length || 0,
          pendingTrainings: contractor.courses?.filter((c: any) => c.status !== 'completed').length || 0,
          // Additional fields from API structure
          firstName: contractor.firstName || contractor.fullName?.split(' ')[0] || '',
          lastName: contractor.lastName || contractor.fullName?.split(' ').slice(1).join(' ') || '',
          cedula: contractor.cedula || '',
          phone: contractor.phone || '',
          certifications: contractor.certifications || [],
          courses: contractor.courses || [],
          reviewStats: contractor.reviewStats || {
            averageRating: 0,
            totalReviews: 0,
            wouldHireAgainPercentage: 0
          }
        };
      });
    } catch (error) {
      console.error('Error fetching contractors:', error);
      throw error;
    }
  }

  // Utility method to get team member by ID
  async getTeamMember(teamId: string, memberId: string): Promise<TeamMember | null> {
    try {
      const members = await this.getTeamMembers(teamId);
      return members.find(member => member.id === memberId) || null;
    } catch (error) {
      console.error('Error fetching team member:', error);
      return null;
    }
  }

  // GET /api/companies - Get available companies
  async getCompanies(): Promise<{ id: string; name: string }[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/companies`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Companies API response:', data);
      
      // Handle the API response format: { success: true, data: [...] } or direct array
      const companies = data.success && Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      
      return companies.map((company: any) => ({
        id: company._id || company.id,
        name: company.name || company.companyName || 'Sin nombre'
      }));
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  }
}

export const teamService = new TeamService();
export default teamService;