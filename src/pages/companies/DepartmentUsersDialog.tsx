import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon
} from '@mui/icons-material';
import { DepartmentUsersService, DepartmentUser } from '../../services/departmentUsersService';
import { UserService, User } from '../../services/userService';
import { Department } from '../../services/departmentService';

interface DepartmentUsersDialogProps {
  open: boolean;
  onClose: () => void;
  department: Department | null;
  companyId: string;
}

export const DepartmentUsersDialog: React.FC<DepartmentUsersDialogProps> = ({
  open,
  onClose,
  department,
  companyId
}) => {
  const [departmentUsers, setDepartmentUsers] = useState<DepartmentUser[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && department) {
      loadUsers();
    }
  }, [open, department]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUsers = async () => {
    if (!department) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [usersResponse, allUsers] = await Promise.all([
        DepartmentUsersService.getDepartmentUsers(department._id),
        UserService.getUsersByCompany(companyId)
      ]);
      
      setDepartmentUsers(usersResponse.users || []);
      
      // Filter out users already in the department
      const assignedUserIds = (usersResponse.users || []).map((u: DepartmentUser) => u._id);
      const available = allUsers.filter(u => !assignedUserIds.includes(u.id));
      setAvailableUsers(available.map(u => ({
        _id: u.id,
        fullName: u.name,
        email: u.email,
        role: u.role,
        isActive: true,
        createdAt: '',
        updatedAt: ''
      })));
      
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Error al cargar los usuarios del departamento');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignUsers = async () => {
    if (!department || selectedUserIds.length === 0) return;
    
    try {
      setSubmitting(true);
      await DepartmentUsersService.assignUsers(department._id, {
        userIds: selectedUserIds
      });
      
      // Refresh the users list
      await loadUsers();
      setSelectedUserIds([]);
    } catch (err) {
      console.error('Error assigning users:', err);
      setError('Error al asignar usuarios al departamento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!department) return;
    
    try {
      setSubmitting(true);
      await DepartmentUsersService.removeUsers(department._id, {
        userIds: [userId]
      });
      
      // Refresh the users list
      await loadUsers();
    } catch (err) {
      console.error('Error removing user:', err);
      setError('Error al remover usuario del departamento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setDepartmentUsers([]);
    setAvailableUsers([]);
    setSelectedUserIds([]);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PeopleIcon />
          Gestionar Usuarios - {department?.name}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
              {/* Usuarios Asignados */}
              <Paper sx={{ p: 2 }} variant="outlined">
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PeopleIcon color="primary" />
                  Usuarios Asignados ({departmentUsers.length})
                </Typography>
                
                {departmentUsers.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No hay usuarios asignados a este departamento
                  </Typography>
                ) : (
                  <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {departmentUsers.map((user) => (
                      <Paper key={user._id} sx={{ p: 2, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} variant="outlined">
                        <Box>
                          <Typography variant="subtitle2">{user.fullName}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {user.email} • {user.role}
                          </Typography>
                        </Box>
                        <Tooltip title="Remover del departamento">
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveUser(user._id)}
                            color="error"
                            disabled={submitting}
                          >
                            <PersonRemoveIcon />
                          </IconButton>
                        </Tooltip>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Paper>

              {/* Usuarios Disponibles */}
              <Paper sx={{ p: 2 }} variant="outlined">
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonAddIcon color="success" />
                  Usuarios Disponibles ({availableUsers.length})
                </Typography>
                
                {availableUsers.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    Todos los Usuarios ya están asignados a este departamento
                  </Typography>
                ) : (
                  <>
                    <Box sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
                      {availableUsers.map((user) => (
                        <FormControlLabel
                          key={user._id}
                          control={
                            <Checkbox
                              checked={selectedUserIds.includes(user._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUserIds(prev => [...prev, user._id]);
                                } else {
                                  setSelectedUserIds(prev => prev.filter(id => id !== user._id));
                                }
                              }}
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="subtitle2">{user.fullName}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {user.email} • {user.role}
                              </Typography>
                            </Box>
                          }
                          sx={{ display: 'block', mb: 1, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}
                        />
                      ))}
                    </Box>
                    
                    <Button
                      variant="contained"
                      startIcon={<PersonAddIcon />}
                      onClick={handleAssignUsers}
                      disabled={selectedUserIds.length === 0 || submitting}
                      fullWidth
                    >
                      {submitting ? (
                        <CircularProgress size={20} />
                      ) : (
                        `Asignar Usuarios Seleccionados (${selectedUserIds.length})`
                      )}
                    </Button>
                  </>
                )}
              </Paper>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DepartmentUsersDialog;