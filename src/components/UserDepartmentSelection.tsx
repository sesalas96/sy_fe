import React from 'react';
import {
  Grid,
  Typography,
  Paper,
  Box,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Chip,
  CircularProgress
} from '@mui/material';
import { Department } from '../services/departmentService';

interface UserDepartmentSelectionProps {
  company: string | undefined;
  departments: Department[];
  selectedDepartmentIds: string[];
  setSelectedDepartmentIds: React.Dispatch<React.SetStateAction<string[]>>;
  loadingDepartments: boolean;
}

export const UserDepartmentSelection: React.FC<UserDepartmentSelectionProps> = ({
  company,
  departments,
  selectedDepartmentIds,
  setSelectedDepartmentIds,
  loadingDepartments
}) => {
  return (
    <Grid size={{ xs: 12 }}>
      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        Asignación de Departamentos
      </Typography>
      <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Selecciona los departamentos a los que pertenecerá este usuario
        </Typography>
        
        {!company ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Primero selecciona una empresa para ver los departamentos disponibles
          </Typography>
        ) : loadingDepartments ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={20} />
            <Typography variant="body2">Cargando departamentos...</Typography>
          </Box>
        ) : departments.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            No hay departamentos disponibles para esta empresa
          </Typography>
        ) : (
          <FormGroup>
            {departments.map((department) => (
              <FormControlLabel
                key={department._id}
                control={
                  <Checkbox
                    checked={selectedDepartmentIds.includes(department._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDepartmentIds(prev => [...prev, department._id]);
                      } else {
                        setSelectedDepartmentIds(prev => prev.filter(id => id !== department._id));
                      }
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {department.name} ({department.code})
                    </Typography>
                    {department.description && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {department.description}
                      </Typography>
                    )}
                    {department.approvalAuthority && (
                      <Chip
                        label="Autoridad de Aprobación"
                        size="small"
                        color="primary"
                        sx={{ mt: 0.5 }}
                      />
                    )}
                  </Box>
                }
              />
            ))}
          </FormGroup>
        )}
        
        {selectedDepartmentIds.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="primary">
              {selectedDepartmentIds.length} departamento(s) seleccionado(s)
            </Typography>
          </Box>
        )}
      </Paper>
    </Grid>
  );
};

export default UserDepartmentSelection;