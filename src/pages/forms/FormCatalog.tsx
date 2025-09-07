import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Alert,
  Snackbar,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
  Stack,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Avatar,
  Divider,
  Collapse,
  Drawer,
  Card,
  CardContent,
  LinearProgress,
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as CopyIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Assignment as FormIcon,
  Category as CategoryIcon,
  Clear as ClearIcon,
  ExpandMore,
  ExpandLess,
  FilterAlt as FilterIcon,
  Analytics as StatsIcon,
  Close as CloseIcon,
  ClearAll as ClearAllIcon,
  Tag as TagIcon,
  Timer as TimerIcon,
  Security as ApprovalIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formsApi, Form, FormStats } from '../../services/formsApi';
import { usePageTitle } from '../../hooks/usePageTitle';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';

// Custom hook para debouncing
const useDebouncedValue = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Categories mapping
const categoryLabels: Record<string, string> = {
  analisis_riesgo: 'Análisis de Riesgo',
  verificacion_trabajo: 'Verificación Pre-trabajo',
  control_seguridad: 'Control de Seguridad',
  equipos_herramientas: 'Equipos y Herramientas',
  condiciones_ambientales: 'Condiciones Ambientales',
  procedimientos: 'Procedimientos Específicos',
  emergencias: 'Emergencias',
  inspeccion: 'Inspección',
  certificacion: 'Certificación',
  salud: 'Salud',
  ambiental: 'Ambiental',
  general: 'General',
  otros: 'Otros'
};

export const FormCatalog: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  usePageTitle('Catálogo de Formularios', 'Gestión de formularios del sistema');

  // State
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedLetters, setExpandedLetters] = useState<string[]>([]);
  
  // Drawer states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerContent, setDrawerContent] = useState<'filters' | 'stats'>('filters');
  
  // Stats from API
  const [apiStats, setApiStats] = useState<FormStats | null>(null);
  
  // Dialogs
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; form: Form | null }>({
    open: false,
    form: null
  });
  const [cloneDialog, setCloneDialog] = useState<{ open: boolean; form: Form | null; newName: string }>({
    open: false,
    form: null,
    newName: ''
  });
  
  // Notifications
  const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Debounced search
  const debouncedSearchTerm = useDebouncedValue(searchInput, 500);

  // Load forms and stats
  const loadData = async () => {
    setLoading(true);
    try {
      // Load all forms
      const formsResponse = await formsApi.getAllForms({ 
        limit: 100,
        isActive: undefined 
      });
      
      if (formsResponse.success && formsResponse.data) {
        setForms(formsResponse.data);
      }

      // Load stats
      const statsResponse = await formsApi.getFormStats();
      if (statsResponse.success && statsResponse.data) {
        setApiStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setNotification({
        open: true,
        message: 'Error al cargar los datos',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Group forms alphabetically
  const groupedForms = useMemo(() => {
    const filtered = forms.filter(form => {
      const matchesSearch = form.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                          (form.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ?? false) ||
                          (form.tags?.some(tag => tag.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ?? false);
      const matchesCategory = !selectedCategory || form.category === selectedCategory;
      const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'active' && form.isActive) ||
                          (statusFilter === 'inactive' && !form.isActive);
      
      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Sort forms alphabetically
    const sorted = [...filtered].sort((a, b) => 
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    );

    // Group by first letter
    const grouped: Record<string, Form[]> = {};
    sorted.forEach(form => {
      const firstLetter = form.name.charAt(0).toUpperCase();
      if (!grouped[firstLetter]) {
        grouped[firstLetter] = [];
      }
      grouped[firstLetter].push(form);
    });

    return grouped;
  }, [forms, debouncedSearchTerm, selectedCategory, statusFilter]);

  const alphabet = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');
  const availableLetters = Object.keys(groupedForms);

  // Extract unique categories from forms
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(forms.map(form => form.category))).filter(Boolean);
    return uniqueCategories.sort();
  }, [forms]);

  // Handlers
  const handleLetterClick = (letter: string) => {
    if (availableLetters.includes(letter)) {
      const element = document.getElementById(`letter-${letter}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleLetterExpansion = (letter: string) => {
    setExpandedLetters(prev => 
      prev.includes(letter) 
        ? prev.filter(l => l !== letter)
        : [...prev, letter]
    );
  };

  const handleOpenDrawer = (content: 'filters' | 'stats') => {
    setDrawerContent(content);
    setDrawerOpen(true);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSelectedCategory('');
    setStatusFilter('all');
  };

  const handleDelete = async () => {
    if (!deleteDialog.form) return;

    try {
      const response = await formsApi.deleteForm(deleteDialog.form._id);
      
      if (response.success) {
        setNotification({
          open: true,
          message: 'Formulario desactivado exitosamente',
          severity: 'success'
        });
        loadData();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      setNotification({
        open: true,
        message: 'Error al desactivar el formulario',
        severity: 'error'
      });
    } finally {
      setDeleteDialog({ open: false, form: null });
    }
  };

  const handleClone = async () => {
    if (!cloneDialog.form || !cloneDialog.newName.trim()) return;

    try {
      const response = await formsApi.duplicateForm(
        cloneDialog.form._id,
        cloneDialog.newName
      );
      
      if (response.success) {
        setNotification({
          open: true,
          message: 'Formulario duplicado exitosamente',
          severity: 'success'
        });
        loadData();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      setNotification({
        open: true,
        message: 'Error al duplicar el formulario',
        severity: 'error'
      });
    } finally {
      setCloneDialog({ open: false, form: null, newName: '' });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, any> = {
      analisis_riesgo: 'error',
      verificacion_trabajo: 'warning',
      control_seguridad: 'info',
      equipos_herramientas: 'primary',
      condiciones_ambientales: 'secondary',
      procedimientos: 'success',
      emergencias: 'error',
      inspeccion: 'warning',
      certificacion: 'info',
      salud: 'success',
      ambiental: 'secondary',
      general: 'default'
    };
    return colors[category] || 'default';
  };

  const activeFiltersCount = [
    debouncedSearchTerm,
    selectedCategory,
    statusFilter !== 'all'
  ].filter(Boolean).length;

  const renderFiltersDrawer = () => (
    <Box sx={{ p: 3, width: { xs: '100%', sm: 320 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">Filtros</Typography>
        <IconButton onClick={() => setDrawerOpen(false)}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Stack spacing={3}>
        <TextField
          fullWidth
          label="Buscar"
          placeholder="Buscar formularios..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchInput && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchInput('')}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }
          }}
        />

        <FormControl fullWidth>
          <InputLabel>Categoría</InputLabel>
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            label="Categoría"
          >
            <MenuItem value="">Todas las categorías</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CategoryIcon fontSize="small" />
                  {categoryLabels[cat] || cat}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Estado</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Estado"
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="active">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ActiveIcon fontSize="small" color="success" />
                Activos
              </Box>
            </MenuItem>
            <MenuItem value="inactive">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <InactiveIcon fontSize="small" />
                Inactivos
              </Box>
            </MenuItem>
          </Select>
        </FormControl>

        <Divider />

        <Button
          fullWidth
          variant="outlined"
          startIcon={<ClearAllIcon />}
          onClick={handleClearFilters}
          disabled={activeFiltersCount === 0}
        >
          Limpiar Filtros
        </Button>
      </Stack>
    </Box>
  );

  const renderStatsDrawer = () => (
    <Box sx={{ p: 3, width: { xs: '100%', sm: 400 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">Estadísticas</Typography>
        <IconButton onClick={() => setDrawerOpen(false)}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Total Forms */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Total de Formularios
                </Typography>
                <Typography variant="h4">
                  {apiStats?.totalForms || forms.length}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'primary.light', width: 56, height: 56 }}>
                <FormIcon />
              </Avatar>
            </Box>
          </CardContent>
        </Card>

        {/* Active/Inactive Row */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Activos
              </Typography>
              <Typography variant="h5" color="success.main">
                {apiStats?.activeForms || forms.filter(f => f.isActive).length}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={forms.length > 0 ? (forms.filter(f => f.isActive).length / forms.length) * 100 : 0}
                color="success"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Inactivos
              </Typography>
              <Typography variant="h5" color="text.secondary">
                {forms.filter(f => !f.isActive).length}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={forms.length > 0 ? (forms.filter(f => !f.isActive).length / forms.length) * 100 : 0}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Box>

        {/* Categories Breakdown */}
        {apiStats?.byCategory && apiStats.byCategory.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Formularios por Categoría
              </Typography>
              <Box sx={{ mt: 2 }}>
                {apiStats.byCategory.map(({ category, count }) => (
                  <Box key={category} sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{categoryLabels[category] || category}</Typography>
                      <Typography variant="body2" fontWeight="medium">{count}</Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={apiStats.totalForms > 0 ? (count / apiStats.totalForms) * 100 : 0}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Work Permit Categories */}
        {apiStats?.byWorkPermitCategory && apiStats.byWorkPermitCategory.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Por Categoría de Permiso
              </Typography>
              <Box sx={{ mt: 2 }}>
                {apiStats.byWorkPermitCategory.map(({ category, count }) => (
                  <Box key={category} sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{category}</Typography>
                      <Typography variant="body2" fontWeight="medium">{count}</Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={apiStats.totalForms > 0 ? (count / apiStats.totalForms) * 100 : 0}
                      sx={{ height: 6, borderRadius: 3 }}
                      color="secondary"
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );

  if (loading) {
    return <SkeletonLoader variant="alphabetical-list" />;
  }

  return (
    <Box sx={{ 
      pb: { xs: 40, md: 0 } // Padding bottom solo en móvil para el alfabeto flotante
    }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'stretch', sm: 'center' }, 
          gap: 2 
        }}>
          <Typography variant={isXs ? "h5" : "h4"}>
            Catálogo de Formularios
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {!isMobile && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={() => handleOpenDrawer('filters')}
                  sx={{ position: 'relative' }}
                >
                  Filtros
                  {activeFiltersCount > 0 && (
                    <Badge
                      badgeContent={activeFiltersCount}
                      color="primary"
                      sx={{ position: 'absolute', top: -8, right: -8 }}
                    />
                  )}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<StatsIcon />}
                  onClick={() => handleOpenDrawer('stats')}
                >
                  Estadísticas
                </Button>
              </>
            )}
            <Button
              variant="contained"
              startIcon={!isXs && <AddIcon />}
              onClick={() => navigate('/work-permits/forms/new')}
              size={isXs ? 'small' : 'medium'}
              fullWidth={isXs}
            >
              {isXs ? 'Nuevo' : 'Nuevo Formulario'}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Mobile Filter and Stats Buttons */}
      {isMobile && (
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => handleOpenDrawer('filters')}
            sx={{ position: 'relative' }}
          >
            Filtros
            {activeFiltersCount > 0 && (
              <Badge
                badgeContent={activeFiltersCount}
                color="primary"
                sx={{ position: 'absolute', top: -8, right: -8 }}
              />
            )}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<StatsIcon />}
            onClick={() => handleOpenDrawer('stats')}
          >
            Estadísticas
          </Button>
        </Box>
      )}

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            Filtros activos:
          </Typography>
          {debouncedSearchTerm && (
            <Chip
              size="small"
              label={`Búsqueda: ${debouncedSearchTerm}`}
              onDelete={() => setSearchInput('')}
            />
          )}
          {selectedCategory && (
            <Chip
              size="small"
              label={`Categoría: ${categoryLabels[selectedCategory] || selectedCategory}`}
              onDelete={() => setSelectedCategory('')}
            />
          )}
          {statusFilter !== 'all' && (
            <Chip
              size="small"
              label={`Estado: ${statusFilter === 'active' ? 'Activos' : 'Inactivos'}`}
              onDelete={() => setStatusFilter('all')}
            />
          )}
          <Button
            size="small"
            startIcon={<ClearAllIcon />}
            onClick={handleClearFilters}
          >
            Limpiar todo
          </Button>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Alphabet sidebar - Only on desktop */}
        {!isMobile && Object.keys(groupedForms).length > 0 && (
          <Paper sx={{ p: 1, position: 'sticky', top: 80, height: 'fit-content' }}>
            <List dense sx={{ py: 0 }}>
              {alphabet.map(letter => (
                <ListItem key={letter} disablePadding>
                  <ListItemButton
                    onClick={() => handleLetterClick(letter)}
                    disabled={!availableLetters.includes(letter)}
                    sx={{ 
                      px: 1, 
                      py: 0.5,
                      minWidth: 40,
                      justifyContent: 'center',
                      '&.Mui-disabled': {
                        opacity: 0.3
                      }
                    }}
                  >
                    <Typography variant="body2" fontWeight="medium">
                      {letter}
                    </Typography>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

        {/* Forms list */}
        <Box sx={{ flex: 1 }}>
          {Object.keys(groupedForms).length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No se encontraron formularios
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {activeFiltersCount > 0 
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Comienza creando un nuevo formulario'}
              </Typography>
              {activeFiltersCount === 0 && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/work-permits/forms/new')}
                  sx={{ mt: 2 }}
                >
                  Crear Formulario
                </Button>
              )}
            </Paper>
          ) : (
            <List sx={{ bgcolor: 'background.paper' }}>
              {Object.entries(groupedForms).map(([letter, letterForms]) => (
                <Box key={letter} id={`letter-${letter}`}>
                  {/* Letter header */}
                  <ListItem
                    onClick={() => toggleLetterExpansion(letter)}
                    sx={{ 
                      bgcolor: 'grey.100', 
                      cursor: 'pointer',
                      position: 'sticky',
                      top: 64,
                      zIndex: 1,
                      '&:hover': {
                        bgcolor: 'grey.200'
                      }
                    }}
                  >
                    <Avatar sx={{ 
                      bgcolor: 'primary.main', 
                      mr: { xs: 1, sm: 2 },
                      width: { xs: 32, sm: 40 },
                      height: { xs: 32, sm: 40 },
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}>
                      {letter}
                    </Avatar>
                    <ListItemText 
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant={isXs ? "subtitle1" : "h6"}>{letter}</Typography>
                          <Chip 
                            label={`${letterForms.length} ${isXs ? '' : 'formularios'}`} 
                            size="small" 
                          />
                        </Box>
                      }
                    />
                    {expandedLetters.includes(letter) ? <ExpandLess /> : <ExpandMore />}
                  </ListItem>

                  {/* Forms for this letter */}
                  <Collapse in={!expandedLetters.includes(letter)} timeout="auto" unmountOnExit>
                    {letterForms.map((form, index) => (
                      <React.Fragment key={form._id}>
                        <ListItem
                          sx={{
                            '&:hover': {
                              bgcolor: 'action.hover'
                            },
                            py: { xs: 1.5, sm: 2 },
                            px: { xs: 1, sm: 2 }
                          }}
                        >
                          <ListItemButton
                            onClick={() => navigate(`/work-permits/forms/${form._id}`)}
                            sx={{ flexGrow: 1, pr: 0, px: { xs: 1, sm: 2 } }}
                          >
                            <Avatar sx={{ 
                              bgcolor: 'grey.300', 
                              mr: { xs: 1.5, sm: 2 },
                              width: { xs: 32, sm: 40 },
                              height: { xs: 32, sm: 40 }
                            }}>
                              <FormIcon fontSize={isXs ? "small" : "medium"} />
                            </Avatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flexWrap: 'wrap' }}>
                                  <Typography 
                                    variant={isXs ? "body2" : "body1"} 
                                    fontWeight="medium"
                                    sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                                  >
                                    {form.name}
                                  </Typography>
                                  {form.code && (
                                    <Chip
                                      label={form.code}
                                      size="small"
                                      variant="outlined"
                                    />
                                  )}
                                  <Chip
                                    icon={form.isActive ? <ActiveIcon /> : <InactiveIcon />}
                                    label={form.isActive ? 'Activo' : 'Inactivo'}
                                    color={form.isActive ? 'success' : 'default'}
                                    size="small"
                                  />
                                  {form.metadata?.requiresApproval && (
                                    <Chip
                                      icon={<ApprovalIcon />}
                                      label="Requiere aprobación"
                                      size="small"
                                      color="warning"
                                    />
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box>
                                  {form.description && (
                                    <Typography 
                                      variant="body2" 
                                      color="textSecondary" 
                                      sx={{ 
                                        mb: 0.5,
                                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                        display: { xs: '-webkit-box' },
                                        WebkitLineClamp: { xs: 2, sm: 3 },
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                      }}
                                    >
                                      {form.description}
                                    </Typography>
                                  )}
                                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mt: 0.5 }}>
                                    <Chip
                                      icon={<CategoryIcon />}
                                      label={categoryLabels[form.category] || form.category}
                                      size="small"
                                      color={getCategoryColor(form.category)}
                                      variant="outlined"
                                    />
                                    {form.metadata?.estimatedCompletionTime && (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <TimerIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                        <Typography variant="caption" color="textSecondary">
                                          {form.metadata.estimatedCompletionTime} min
                                        </Typography>
                                      </Box>
                                    )}
                                    {form.tags && form.tags.length > 0 && (
                                      <>
                                        <TagIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                        {form.tags.slice(0, 3).map((tag, i) => (
                                          <Chip 
                                            key={i}
                                            label={tag} 
                                            size="small"
                                            sx={{ height: 20 }}
                                          />
                                        ))}
                                        {form.tags.length > 3 && (
                                          <Typography variant="caption" color="textSecondary">
                                            +{form.tags.length - 3}
                                          </Typography>
                                        )}
                                      </>
                                    )}
                                  </Box>
                                </Box>
                              }
                            />
                          </ListItemButton>
                          
                          {/* Action buttons - Hide on mobile */}
                          {!isMobile && (
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="Editar">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/work-permits/forms/${form._id}/edit`);
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Duplicar">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCloneDialog({ 
                                      open: true, 
                                      form, 
                                      newName: `${form.name} (Copia)` 
                                    });
                                  }}
                                >
                                  <CopyIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Eliminar">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteDialog({ open: true, form });
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          )}
                        </ListItem>
                        {index < letterForms.length - 1 && (
                          <Divider variant="inset" component="li" />
                        )}
                      </React.Fragment>
                    ))}
                  </Collapse>
                  <Divider />
                </Box>
              ))}
            </List>
          )}
        </Box>
      </Box>

      {/* Mobile alphabet - Floating */}
      {isMobile && Object.keys(groupedForms).length > 0 && (
        <Paper
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            p: 1,
            display: 'flex',
            flexWrap: 'wrap',
            maxWidth: 200,
            gap: 0.5,
            boxShadow: theme.shadows[8],
            bgcolor: 'background.paper',
            zIndex: 1200
          }}
        >
          {alphabet.map(letter => (
            <Button
              key={letter}
              size="small"
              variant={availableLetters.includes(letter) ? 'outlined' : 'text'}
              disabled={!availableLetters.includes(letter)}
              onClick={() => handleLetterClick(letter)}
              sx={{ 
                minWidth: 32, 
                p: 0.5,
                fontSize: '0.75rem'
              }}
            >
              {letter}
            </Button>
          ))}
        </Paper>
      )}

      {/* Drawer */}
      <Drawer
        anchor={isMobile ? 'bottom' : 'right'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {drawerContent === 'filters' ? renderFiltersDrawer() : renderStatsDrawer()}
      </Drawer>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, form: null })}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea desactivar el formulario "{deleteDialog.form?.name}"?
            Los formularios desactivados no estarán disponibles para su uso.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, form: null })}>
            Cancelar
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Desactivar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clone Dialog */}
      <Dialog open={cloneDialog.open} onClose={() => setCloneDialog({ open: false, form: null, newName: '' })}>
        <DialogTitle>Duplicar Formulario</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Ingrese el nombre para el nuevo formulario duplicado
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            label="Nombre del nuevo formulario"
            value={cloneDialog.newName}
            onChange={(e) => setCloneDialog(prev => ({ ...prev, newName: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloneDialog({ open: false, form: null, newName: '' })}>
            Cancelar
          </Button>
          <Button 
            onClick={handleClone} 
            variant="contained"
            disabled={!cloneDialog.newName.trim()}
          >
            Duplicar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          severity={notification.severity}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};