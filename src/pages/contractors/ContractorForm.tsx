import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Breadcrumbs,
  Link
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { Contractor } from '../../types';
import { CompanyService } from '../../services/companyService';

interface ContractorFormData {
  fullName: string;
  cedula: string;
  ordenPatronal: string;
  polizaINS: string;
  status: 'active' | 'inactive';
  companyId: string;
}

const initialFormData: ContractorFormData = {
  fullName: '',
  cedula: '',
  ordenPatronal: '',
  polizaINS: '',
  status: 'active',
  companyId: 'particular'
};

// Companies will be loaded from the service

export const ContractorForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<ContractorFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<ContractorFormData>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    loadCompanies();
    
    if (isEdit && id) {
      // TODO: Load contractor data for editing
      // For now, we'll use mock data
      const mockContractor: Contractor = {
        id,
        userId: 'user1',
        fullName: 'Juan Carlos Pérez',
        cedula: '1-2345-6789',
        ordenPatronal: 'OP-001',
        polizaINS: 'INS-12345',
        status: 'active',
        companyId: 'company1',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setFormData({
        fullName: mockContractor.fullName,
        cedula: mockContractor.cedula,
        ordenPatronal: mockContractor.ordenPatronal || '',
        polizaINS: mockContractor.polizaINS || '',
        status: mockContractor.status,
        companyId: mockContractor.companyId
      });
    }
  }, [isEdit, id]);

  const loadCompanies = async () => {
    try {
      const companiesData = await CompanyService.getCompaniesForSelect();
      // Add "Particular" as the first option
      const companiesWithParticular = [
        { id: 'particular', name: 'Particular' },
        ...companiesData
      ];
      setCompanies(companiesWithParticular);
    } catch (error) {
      console.error('Error loading companies:', error);
      // Even on error, include "Particular" option
      setCompanies([{ id: 'particular', name: 'Particular' }]);
    }
  };

  const handleInputChange = (field: keyof ContractorFormData) => (
    event: React.ChangeEvent<HTMLInputElement> | { target: { value: unknown } }
  ) => {
    const value = event.target.value as string;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ContractorFormData> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'El nombre completo es obligatorio';
    }

    if (!formData.cedula.trim()) {
      newErrors.cedula = 'La cédula es obligatoria';
    }

    if (!formData.companyId) {
      newErrors.companyId = 'Debe seleccionar una empresa';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSubmitError('');

    try {
      // TODO: Implement actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      console.log(isEdit ? 'Update contractor:' : 'Create contractor:', formData);
      
      // Navigate back to contractors list
      navigate('/contractors');
    } catch (error) {
      setSubmitError('Error al guardar el contratista. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/contractors');
  };

  const formatCedula = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as X-XXXX-XXXX
    if (digits.length <= 1) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 1)}-${digits.slice(1)}`;
    return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5, 9)}`;
  };

  const handleCedulaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCedula(event.target.value);
    setFormData(prev => ({ ...prev, cedula: formatted }));
    
    if (errors.cedula) {
      setErrors(prev => ({ ...prev, cedula: undefined }));
    }
  };

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link 
          color="inherit" 
          href="#" 
          onClick={(e) => { e.preventDefault(); navigate('/contractors'); }}
        >
          Contratistas
        </Link>
        <Typography color="textPrimary">
          {isEdit ? 'Editar Contratista' : 'Nuevo Contratista'}
        </Typography>
      </Breadcrumbs>

      <Typography variant="h4" gutterBottom>
        {isEdit ? 'Editar Contratista' : 'Nuevo Contratista'}
      </Typography>

      <Paper sx={{ p: 3 }}>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Nombre Completo"
                value={formData.fullName}
                onChange={handleInputChange('fullName')}
                error={!!errors.fullName}
                helperText={errors.fullName}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Cédula"
                value={formData.cedula}
                onChange={handleCedulaChange}
                error={!!errors.cedula}
                helperText={errors.cedula || 'Formato: 1-2345-6789'}
                placeholder="1-2345-6789"
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Orden Patronal"
                value={formData.ordenPatronal}
                onChange={handleInputChange('ordenPatronal')}
                error={!!errors.ordenPatronal}
                helperText={errors.ordenPatronal}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Póliza INS"
                value={formData.polizaINS}
                onChange={handleInputChange('polizaINS')}
                error={!!errors.polizaINS}
                helperText={errors.polizaINS}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required error={!!errors.companyId}>
                <InputLabel>Espacios de Trabajo</InputLabel>
                <Select
                  value={formData.companyId}
                  onChange={(event) => {
                    const value = event.target.value as string;
                    setFormData(prev => ({ ...prev, companyId: value }));
                    if (errors.companyId) {
                      setErrors(prev => ({ ...prev, companyId: undefined }));
                    }
                  }}
                  label="Espacios de Trabajo"
                >
                  {companies.map((company: { id: string; name: string }) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.companyId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.companyId}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(event) => {
                    const value = event.target.value as 'active' | 'inactive';
                    setFormData(prev => ({ ...prev, status: value }));
                  }}
                  label="Estado"
                >
                  <MenuItem value="active">Activo</MenuItem>
                  <MenuItem value="inactive">Inactivo</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Crear')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};