import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Tooltip,
  useTheme,
  useMediaQuery,
  Card,
  CardContent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Gavel as ApprovalIcon,
  Business as BusinessIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { DepartmentService, Department, DepartmentCreateData, DepartmentUpdateData } from '../../services/departmentService';
import DepartmentUsersDialog from './DepartmentUsersDialog';

interface CompanyDepartmentsProps {
  companyId: string;
  companyName: string;
}

const roleOptions = [
  { value: 'safety_staff', label: 'Personal de Safety' },
  { value: 'client_supervisor', label: 'Supervisor del Cliente' },
  { value: 'client_approver', label: 'Aprobador del Cliente' },
  { value: 'super_admin', label: 'Super Administrador' }
];

export const CompanyDepartments: React.FC<CompanyDepartmentsProps> = ({ companyId, companyName }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // User management states
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  const [formData, setFormData] = useState<DepartmentCreateData>({
    name: '',
    code: '',
    description: '',
    companyId: companyId,
    approvalAuthority: false,
    requiredRole: '',
    approvalOrder: 1,
    settings: {
      requiresComments: false,
      maxApprovalTimeHours: 24
    }
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadDepartments();
  }, [companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const departmentsList = await DepartmentService.getDepartments({ 
        companyId,
        isActive: true 
      });
      setDepartments(departmentsList.sort((a, b) => (a.approvalOrder || 99) - (b.approvalOrder || 99)));
    } catch (err) {
      setError('Error al cargar los departamentos');
      console.error('Error loading departments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (department?: Department) => {
    if (department) {
      setEditingDepartment(department);
      setFormData({
        name: department.name,
        code: department.code,
        description: department.description || '',
        companyId: department.companyId,
        approvalAuthority: department.approvalAuthority,
        requiredRole: department.requiredRole || '',
        approvalOrder: department.approvalOrder || 1,
        settings: {
          requiresComments: department.settings?.requiresComments || false,
          maxApprovalTimeHours: department.settings?.maxApprovalTimeHours || 24
        }
      });
    } else {
      setEditingDepartment(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        companyId: companyId,
        approvalAuthority: false,
        requiredRole: '',
        approvalOrder: departments.length + 1,
        settings: {
          requiresComments: false,
          maxApprovalTimeHours: 24
        }
      });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingDepartment(null);
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = 'El nombre es requerido';
    if (!formData.code.trim()) errors.code = 'El código es requerido';
    if (formData.code.length > 10) errors.code = 'El código no puede tener más de 10 caracteres';
    if (formData.approvalAuthority && !formData.requiredRole) {
      errors.requiredRole = 'El rol requerido es necesario para departamentos con autoridad de aprobación';
    }
    if (formData.approvalOrder && (formData.approvalOrder < 1 || formData.approvalOrder > 99)) {
      errors.approvalOrder = 'El orden de aprobación debe estar entre 1 y 99';
    }

    // Verificar duplicados
    const isDuplicate = departments.some(dept => 
      dept._id !== editingDepartment?._id && 
      (dept.code.toLowerCase() === formData.code.toLowerCase() ||
       dept.name.toLowerCase() === formData.name.toLowerCase())
    );
    
    if (isDuplicate) {
      errors.code = 'Ya existe un departamento con este código o nombre';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      
      if (editingDepartment) {
        const updateData: DepartmentUpdateData = {
          name: formData.name,
          description: formData.description,
          approvalAuthority: formData.approvalAuthority,
          requiredRole: formData.requiredRole || undefined,
          approvalOrder: formData.approvalOrder,
          settings: formData.settings
        };
        await DepartmentService.updateDepartment(editingDepartment._id, updateData);
      } else {
        await DepartmentService.createDepartment(formData);
      }
      
      await loadDepartments();
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving department:', err);
      setFormErrors({ submit: 'Error al guardar el departamento. Por favor, intente nuevamente.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (department: Department) => {
    setDepartmentToDelete(department);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!departmentToDelete) return;

    try {
      setSubmitting(true);
      await DepartmentService.deleteDepartment(
        departmentToDelete._id, 
        `Departamento eliminado desde la administración de ${companyName}`
      );
      await loadDepartments();
      setDeleteDialogOpen(false);
      setDepartmentToDelete(null);
    } catch (err) {
      console.error('Error deleting department:', err);
      setError('Error al eliminar el departamento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleManageUsers = (department: Department) => {
    setSelectedDepartment(department);
    setUserDialogOpen(true);
  };

  const handleCloseUserDialog = () => {
    setUserDialogOpen(false);
    setSelectedDepartment(null);
  };

  const getStatusChip = (department: Department) => {
    if (!department.isActive) {
      return <Chip label="Inactivo" color="default" size="small" />;
    }
    if (department.approvalAuthority) {
      return <Chip label="Aprobador" color="primary" size="small" icon={<ApprovalIcon />} />;
    }
    return <Chip label="Activo" color="success" size="small" />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' }, 
        gap: { xs: 2, sm: 0 },
        mb: 3 
      }}>
        <Typography 
          variant={isMobile ? 'subtitle1' : 'h6'} 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            order: { xs: 1, sm: 1 }
          }}
        >
          <BusinessIcon />
          {isXs ? `Departamentos` : `Departamentos de ${companyName}`}
        </Typography>
        <Button
          variant="contained"
          startIcon={!isXs ? <AddIcon /> : undefined}
          onClick={() => handleOpenDialog()}
          fullWidth={isXs}
          size={isMobile ? 'medium' : 'large'}
          sx={{ order: { xs: 2, sm: 2 } }}
        >
          {isXs ? 'Agregar' : 'Agregar Departamento'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {isMobile ? (
        // Mobile Card Layout
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {departments.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No hay departamentos configurados para esta empresa
                </Typography>
              </CardContent>
            </Card>
          ) : (
            departments.map((department) => (
              <Card key={department._id}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight="medium" sx={{ mb: 0.5 }}>
                        {department.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                        <Chip label={department.code} variant="outlined" size="small" />
                        {getStatusChip(department)}
                      </Box>
                      {department.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {department.description}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                      <Tooltip title="Usuarios">
                        <IconButton
                          size="small"
                          onClick={() => handleManageUsers(department)}
                          color="primary"
                        >
                          <PeopleIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(department)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(department)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {department.requiredRole && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Rol Requerido
                        </Typography>
                        <Box>
                          <Chip 
                            label={roleOptions.find(r => r.value === department.requiredRole)?.label || department.requiredRole}
                            size="small"
                            color="secondary"
                          />
                        </Box>
                      </Box>
                    )}
                    {department.approvalAuthority && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Orden de Aprobación
                        </Typography>
                        <Box>
                          <Chip 
                            label={department.approvalOrder || '-'} 
                            color="primary" 
                            size="small" 
                          />
                        </Box>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      ) : (
        // Desktop Table Layout
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Código</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Rol Requerido</TableCell>
                <TableCell align="center">Orden</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {departments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No hay departamentos configurados para esta empresa
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                departments.map((department) => (
                  <TableRow key={department._id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{department.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={department.code} variant="outlined" size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {department.description || 'Sin descripción'}
                      </Typography>
                    </TableCell>
                    <TableCell>{getStatusChip(department)}</TableCell>
                    <TableCell>
                      {department.requiredRole ? (
                        <Chip 
                          label={roleOptions.find(r => r.value === department.requiredRole)?.label || department.requiredRole}
                          size="small"
                          color="secondary"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {department.approvalAuthority ? (
                        <Chip 
                          label={department.approvalOrder || '-'} 
                          color="primary" 
                          size="small" 
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Gestionar Usuarios">
                        <IconButton
                          size="small"
                          onClick={() => handleManageUsers(department)}
                          color="primary"
                        >
                          <PeopleIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(department)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(department)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog para crear/editar departamento */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        fullScreen={isXs}
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: 0, sm: '32px' },
            width: { xs: '100%', sm: 'auto' },
            maxHeight: { xs: '100%', sm: '90vh' }
          }
        }}
      >
        <DialogTitle>
          {editingDepartment ? 'Editar Departamento' : 'Crear Departamento'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {formErrors.submit && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formErrors.submit}
              </Alert>
            )}

            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
              <TextField
                label="Nombre del Departamento"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
                fullWidth
              />

              <TextField
                label="Código"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                error={!!formErrors.code}
                helperText={formErrors.code || 'Máximo 10 caracteres'}
                required
                fullWidth
                disabled={!!editingDepartment} // No permitir cambiar el código al editar
              />
            </Box>

            <TextField
              label="Descripción"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={2}
              fullWidth
              sx={{ mt: 2 }}
            />

            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.approvalAuthority}
                    onChange={(e) => setFormData(prev => ({ ...prev, approvalAuthority: e.target.checked }))}
                  />
                }
                label="Tiene autoridad de aprobación para permisos de trabajo"
              />
            </Box>

            {formData.approvalAuthority && (
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, mt: 2 }}>
                <FormControl fullWidth error={!!formErrors.requiredRole}>
                  <InputLabel>Rol Requerido</InputLabel>
                  <Select
                    value={formData.requiredRole}
                    onChange={(e) => setFormData(prev => ({ ...prev, requiredRole: e.target.value }))}
                    label="Rol Requerido"
                  >
                    {roleOptions.map((role) => (
                      <MenuItem key={role.value} value={role.value}>
                        {role.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.requiredRole && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>
                      {formErrors.requiredRole}
                    </Typography>
                  )}
                </FormControl>

                <TextField
                  label="Orden de Aprobación"
                  type="number"
                  value={formData.approvalOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, approvalOrder: parseInt(e.target.value) || 1 }))}
                  error={!!formErrors.approvalOrder}
                  helperText={formErrors.approvalOrder || 'Orden en el proceso de aprobación'}
                  inputProps={{ min: 1, max: 99 }}
                  fullWidth
                />
              </Box>
            )}

            {formData.approvalAuthority && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Configuración de Aprobación
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.settings?.requiresComments || false}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        settings: { ...prev.settings, requiresComments: e.target.checked }
                      }))}
                    />
                  }
                  label="Requiere comentarios al aprobar/rechazar"
                />

                <TextField
                  label="Tiempo máximo de aprobación (horas)"
                  type="number"
                  value={formData.settings?.maxApprovalTimeHours || 24}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, maxApprovalTimeHours: parseInt(e.target.value) || 24 }
                  }))}
                  inputProps={{ min: 1, max: 168 }} // 1 hora a 1 semana
                  fullWidth
                  sx={{ mt: 1 }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          gap: { xs: 1, sm: 0 },
          p: { xs: 2, sm: 1 }
        }}>
          <Button 
            onClick={handleCloseDialog}
            fullWidth={isXs}
            size={isMobile ? 'medium' : 'large'}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={submitting}
            fullWidth={isXs}
            size={isMobile ? 'medium' : 'large'}
          >
            {submitting ? <CircularProgress size={20} /> : (editingDepartment ? 'Actualizar' : 'Crear')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación para eliminar */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        fullScreen={isXs}
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: 0, sm: '32px' },
            width: { xs: '100%', sm: 'auto' },
            maxHeight: { xs: '100%', sm: '90vh' }
          }
        }}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar el departamento "{departmentToDelete?.name}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer y afectará a todos los permisos de trabajo que requieran aprobación de este departamento.
          </Typography>
        </DialogContent>
        <DialogActions sx={{
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          gap: { xs: 1, sm: 0 },
          p: { xs: 2, sm: 1 }
        }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            fullWidth={isXs}
            size={isMobile ? 'medium' : 'large'}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={submitting}
            fullWidth={isXs}
            size={isMobile ? 'medium' : 'large'}
          >
            {submitting ? <CircularProgress size={20} /> : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      <DepartmentUsersDialog
        open={userDialogOpen}
        onClose={handleCloseUserDialog}
        department={selectedDepartment}
        companyId={companyId}
      />    </Box>
  );
};

export default CompanyDepartments;
