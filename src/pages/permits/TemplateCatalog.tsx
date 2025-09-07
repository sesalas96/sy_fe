import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Breadcrumbs,
  Link,
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
  FileCopy as CloneIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Category as CategoryIcon,
  Clear as ClearIcon,
  ExpandMore,
  ExpandLess,
  Description as TemplateIcon,
  FilterAlt as FilterIcon,
  Analytics as StatsIcon,
  Close as CloseIcon,
  ClearAll as ClearAllIcon,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { workPermitTemplateApi, WorkPermitTemplate, TemplateCategory } from '../../services/workPermitTemplateApi';
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

export const TemplateCatalog: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  usePageTitle('Catálogo de Templates', 'Gestión de templates de permisos');

  // State
  const [templates, setTemplates] = useState<WorkPermitTemplate[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedLetters, setExpandedLetters] = useState<string[]>([]);
  
  // Drawer states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerContent, setDrawerContent] = useState<'filters' | 'stats'>('filters');
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    byCategory: {} as Record<string, number>,
    avgFields: 0,
    recentlyUpdated: 0
  });
  
  // Dialogs
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; template: WorkPermitTemplate | null }>({
    open: false,
    template: null
  });
  const [cloneDialog, setCloneDialog] = useState<{ open: boolean; template: WorkPermitTemplate | null; newName: string }>({
    open: false,
    template: null,
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

  // Load all data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load categories
      const categoriesResponse = await workPermitTemplateApi.getCategories();
      if (categoriesResponse.success && categoriesResponse.data) {
        setCategories(categoriesResponse.data);
      }

      // Load all templates
      const templatesResponse = await workPermitTemplateApi.getAllTemplates({
        limit: 1000 // Get all templates
      });
      
      if (templatesResponse.success && templatesResponse.data) {
        const templatesData = Array.isArray(templatesResponse.data) ? templatesResponse.data : [];
        setTemplates(templatesData);
        
        // Calculate stats
        calculateStats(templatesData);
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
  }, []);

  const calculateStats = (templatesData: WorkPermitTemplate[]) => {
    const activeTemplates = templatesData.filter(t => t.isActive);
    const byCategory: Record<string, number> = {};
    let totalFields = 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    let recentlyUpdated = 0;

    templatesData.forEach(template => {
      // Count by category
      if (template.category) {
        byCategory[template.category] = (byCategory[template.category] || 0) + 1;
      }
      
      // Count fields
      totalFields += template.fields?.length || 0;
      
      // Count recently updated
      if (template.updatedAt && new Date(template.updatedAt) > thirtyDaysAgo) {
        recentlyUpdated++;
      }
    });

    setStats({
      total: templatesData.length,
      active: activeTemplates.length,
      inactive: templatesData.length - activeTemplates.length,
      byCategory,
      avgFields: templatesData.length > 0 ? Math.round(totalFields / templatesData.length) : 0,
      recentlyUpdated
    });
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Group templates alphabetically
  const groupedTemplates = useMemo(() => {
    const filtered = templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                          (template.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ?? false);
      const matchesCategory = !selectedCategory || template.category === selectedCategory;
      const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'active' && template.isActive) ||
                          (statusFilter === 'inactive' && !template.isActive);
      
      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Sort templates alphabetically
    const sorted = [...filtered].sort((a, b) => 
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    );

    // Group by first letter
    const grouped: Record<string, WorkPermitTemplate[]> = {};
    sorted.forEach(template => {
      const firstLetter = template.name.charAt(0).toUpperCase();
      if (!grouped[firstLetter]) {
        grouped[firstLetter] = [];
      }
      grouped[firstLetter].push(template);
    });

    return grouped;
  }, [templates, debouncedSearchTerm, selectedCategory, statusFilter]);

  const alphabet = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');
  const availableLetters = Object.keys(groupedTemplates);

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
    if (!deleteDialog.template) return;

    try {
      const response = await workPermitTemplateApi.deleteTemplate(deleteDialog.template._id);
      
      if (response.success) {
        setNotification({
          open: true,
          message: 'Template eliminado exitosamente',
          severity: 'success'
        });
        loadData();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      setNotification({
        open: true,
        message: 'Error al eliminar el template',
        severity: 'error'
      });
    } finally {
      setDeleteDialog({ open: false, template: null });
    }
  };

  const handleClone = async () => {
    if (!cloneDialog.template || !cloneDialog.newName.trim()) return;

    try {
      const response = await workPermitTemplateApi.cloneTemplate(
        cloneDialog.template._id,
        cloneDialog.newName
      );
      
      if (response.success) {
        setNotification({
          open: true,
          message: 'Template clonado exitosamente',
          severity: 'success'
        });
        loadData();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      setNotification({
        open: true,
        message: 'Error al clonar el template',
        severity: 'error'
      });
    } finally {
      setCloneDialog({ open: false, template: null, newName: '' });
    }
  };

  const handleToggleStatus = async (template: WorkPermitTemplate) => {
    try {
      const response = await workPermitTemplateApi.toggleTemplateStatus(template._id);
      
      if (response.success) {
        setNotification({
          open: true,
          message: `Template ${template.isActive ? 'desactivado' : 'activado'} exitosamente`,
          severity: 'success'
        });
        loadData();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      setNotification({
        open: true,
        message: 'Error al cambiar el estado del template',
        severity: 'error'
      });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = ['primary', 'secondary', 'success', 'warning', 'info', 'error'];
    const index = categories.findIndex(cat => cat.name === category);
    return colors[index % colors.length] as any;
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
          placeholder="Buscar templates..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          InputProps={{
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
              <MenuItem key={cat._id} value={cat.name}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CategoryIcon fontSize="small" />
                  {cat.name}
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
        {/* Total Templates */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Total de Templates
                </Typography>
                <Typography variant="h4">
                  {stats.total}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'primary.light', width: 56, height: 56 }}>
                <TemplateIcon />
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
                {stats.active}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={stats.total > 0 ? (stats.active / stats.total) * 100 : 0}
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
                {stats.inactive}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={stats.total > 0 ? (stats.inactive / stats.total) * 100 : 0}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Box>

        {/* Fields and Updates Row */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Promedio de Campos
              </Typography>
              <Typography variant="h5">
                {stats.avgFields}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Actualizados (30 días)
              </Typography>
              <Typography variant="h5">
                {stats.recentlyUpdated}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Categories Breakdown */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Templates por Categoría
            </Typography>
            <Box sx={{ mt: 2 }}>
              {Object.entries(stats.byCategory).map(([category, count]) => (
                <Box key={category} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">{category}</Typography>
                    <Typography variant="body2" fontWeight="medium">{count}</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.total > 0 ? (count / stats.total) * 100 : 0}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <Box sx={{ 
      pb: { xs: 40, md: 0 } // Padding bottom solo en móvil para el alfabeto flotante
    }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link component={RouterLink} to="/" color="inherit">
            Inicio
          </Link>
          <Link component={RouterLink} to="/permits" color="inherit">
            Permisos
          </Link>
          <Typography color="text.primary">Catálogo de Templates</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4">
            Catálogo de Templates
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
              startIcon={<AddIcon />}
              onClick={() => navigate('/work-permits/templates/new')}
              size={isXs ? 'small' : 'medium'}
            >
              Nuevo Template
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
              label={`Categoría: ${selectedCategory}`}
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
        {!isMobile && Object.keys(groupedTemplates).length > 0 && (
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

        {/* Templates list */}
        <Box sx={{ flex: 1 }}>
          {Object.keys(groupedTemplates).length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No se encontraron templates
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {activeFiltersCount > 0 
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Comienza creando un nuevo template'}
              </Typography>
              {activeFiltersCount === 0 && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/work-permits/templates/new')}
                  sx={{ mt: 2 }}
                >
                  Crear Template
                </Button>
              )}
            </Paper>
          ) : (
            <List sx={{ bgcolor: 'background.paper' }}>
              {Object.entries(groupedTemplates).map(([letter, letterTemplates]) => (
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
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      {letter}
                    </Avatar>
                    <ListItemText 
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6">{letter}</Typography>
                          <Chip label={`${letterTemplates.length} templates`} size="small" />
                        </Box>
                      }
                    />
                    {expandedLetters.includes(letter) ? <ExpandLess /> : <ExpandMore />}
                  </ListItem>

                  {/* Templates for this letter */}
                  <Collapse in={!expandedLetters.includes(letter)} timeout="auto" unmountOnExit>
                    {letterTemplates.map((template, index) => (
                      <React.Fragment key={template._id}>
                        <ListItem
                          sx={{
                            '&:hover': {
                              bgcolor: 'action.hover'
                            },
                            py: 2
                          }}
                        >
                          <ListItemButton
                            onClick={() => navigate(`/work-permits/templates/${template._id}`)}
                            sx={{ flexGrow: 1, pr: 0 }}
                          >
                            <Avatar sx={{ bgcolor: 'grey.300', mr: 2 }}>
                              <TemplateIcon />
                            </Avatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                  <Typography variant="body1" fontWeight="medium">
                                    {template.name}
                                  </Typography>
                                  <Chip
                                    icon={template.isActive ? <ActiveIcon /> : <InactiveIcon />}
                                    label={template.isActive ? 'Activo' : 'Inactivo'}
                                    color={template.isActive ? 'success' : 'default'}
                                    size="small"
                                  />
                                </Box>
                              }
                              secondary={
                                <Box>
                                  {template.description && (
                                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                                      {template.description}
                                    </Typography>
                                  )}
                                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <Chip
                                      icon={<CategoryIcon />}
                                      label={template.category}
                                      size="small"
                                      color={getCategoryColor(template.category)}
                                      variant="outlined"
                                    />
                                    <Typography variant="caption" color="textSecondary">
                                      {template.fields?.length || 0} campos
                                    </Typography>
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
                                    navigate(`/work-permits/templates/${template._id}/edit`);
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Clonar">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCloneDialog({ 
                                      open: true, 
                                      template, 
                                      newName: `${template.name} (Copia)` 
                                    });
                                  }}
                                >
                                  <CloneIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={template.isActive ? 'Desactivar' : 'Activar'}>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleStatus(template);
                                  }}
                                  color={template.isActive ? 'default' : 'success'}
                                >
                                  {template.isActive ? 
                                    <InactiveIcon fontSize="small" /> : 
                                    <ActiveIcon fontSize="small" />
                                  }
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Eliminar">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteDialog({ open: true, template });
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          )}
                        </ListItem>
                        {index < letterTemplates.length - 1 && (
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
      {isMobile && Object.keys(groupedTemplates).length > 0 && (
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
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, template: null })}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea eliminar el template "{deleteDialog.template?.name}"?
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, template: null })}>
            Cancelar
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clone Dialog */}
      <Dialog open={cloneDialog.open} onClose={() => setCloneDialog({ open: false, template: null, newName: '' })}>
        <DialogTitle>Clonar Template</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Ingrese el nombre para el nuevo template clonado
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            label="Nombre del nuevo template"
            value={cloneDialog.newName}
            onChange={(e) => setCloneDialog(prev => ({ ...prev, newName: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloneDialog({ open: false, template: null, newName: '' })}>
            Cancelar
          </Button>
          <Button 
            onClick={handleClone} 
            variant="contained"
            disabled={!cloneDialog.newName.trim()}
          >
            Clonar
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