import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
  Button,
  Alert,
  Paper,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Palette as PaletteIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  SettingsBrightness as AutoModeIcon,
  Save as SaveIcon
} from '@mui/icons-material';

export const ThemeSettings: React.FC = () => {
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'auto'>('light');
  const [primaryColor, setPrimaryColor] = useState('#3462C7');
  const [secondaryColor, setSecondaryColor] = useState('#678966');
  const [borderRadius, setBorderRadius] = useState(4);
  const [compactMode, setCompactMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const colorPresets = [
    { name: 'Safety Corporativo', primary: '#3462C7', secondary: '#678966' },
    { name: 'Verde Natural', primary: '#678966', secondary: '#3462C7' },
    { name: 'Neutro Profesional', primary: '#545454', secondary: '#3462C7' },
    { name: 'Azul Clásico', primary: '#1976d2', secondary: '#dc004e' },
    { name: 'Verde Seguridad', primary: '#2e7d32', secondary: '#ff6f00' },
    { name: 'Rojo Alerta', primary: '#d32f2f', secondary: '#678966' }
  ];

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Implement actual theme saving
      // const themeSettings = {
      //   mode: themeMode,
      //   primaryColor,
      //   secondaryColor,
      //   borderRadius,
      //   compactMode,
      //   highContrast,
      //   reduceMotion,
      //   fontSize
      // };
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Apply theme changes immediately
      document.documentElement.style.setProperty('--primary-color', primaryColor);
      document.documentElement.style.setProperty('--secondary-color', secondaryColor);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving theme settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (preset: typeof colorPresets[0]) => {
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
  };

  const getThemePreview = () => {
    return (
      <Box
        sx={{
          p: 2,
          borderRadius: borderRadius + 'px',
          background: themeMode === 'dark' ? '#121212' : '#ffffff',
          color: themeMode === 'dark' ? '#ffffff' : '#000000',
          border: '1px solid',
          borderColor: themeMode === 'dark' ? '#333' : '#e0e0e0',
          fontSize: fontSize === 'small' ? '0.875rem' : fontSize === 'large' ? '1.125rem' : '1rem'
        }}
      >
        <Typography variant="h6" sx={{ color: primaryColor, mb: 1 }}>
          Vista Previa del Tema
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Así se verá la aplicación con la configuración seleccionada.
        </Typography>
        <Button
          variant="contained"
          size={compactMode ? 'small' : 'medium'}
          sx={{ 
            backgroundColor: primaryColor,
            mr: 1,
            '&:hover': {
              backgroundColor: primaryColor + 'DD'
            }
          }}
        >
          Botón Primario
        </Button>
        <Button
          variant="outlined"
          size={compactMode ? 'small' : 'medium'}
          sx={{ 
            borderColor: secondaryColor,
            color: secondaryColor,
            '&:hover': {
              borderColor: secondaryColor,
              backgroundColor: secondaryColor + '10'
            }
          }}
        >
          Botón Secundario
        </Button>
      </Box>
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Configuración de Tema
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Configuración de tema guardada correctamente
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Theme Mode Selection */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <PaletteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Modo de Tema
              </Typography>
              
              <RadioGroup
                value={themeMode}
                onChange={(e) => setThemeMode(e.target.value as 'light' | 'dark' | 'auto')}
              >
                <FormControlLabel
                  value="light"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LightModeIcon sx={{ mr: 1 }} />
                      Claro
                    </Box>
                  }
                />
                <FormControlLabel
                  value="dark"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <DarkModeIcon sx={{ mr: 1 }} />
                      Oscuro
                    </Box>
                  }
                />
                <FormControlLabel
                  value="auto"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AutoModeIcon sx={{ mr: 1 }} />
                      Automático (sistema)
                    </Box>
                  }
                />
              </RadioGroup>
            </CardContent>
          </Card>
        </Grid>

        {/* Color Presets */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Paletas de Colores
              </Typography>
              
              <Grid container spacing={1}>
                {colorPresets.map((preset, index) => (
                  <Grid size={{ xs: 6 }} key={index}>
                    <Paper
                      sx={{
                        p: 1,
                        cursor: 'pointer',
                        border: primaryColor === preset.primary ? 2 : 1,
                        borderColor: primaryColor === preset.primary ? 'primary.main' : 'divider',
                        '&:hover': {
                          boxShadow: 2
                        }
                      }}
                      onClick={() => handlePresetSelect(preset)}
                    >
                      <Box sx={{ display: 'flex', mb: 1 }}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            backgroundColor: preset.primary,
                            borderRadius: 1,
                            mr: 0.5
                          }}
                        />
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            backgroundColor: preset.secondary,
                            borderRadius: 1
                          }}
                        />
                      </Box>
                      <Typography variant="caption" display="block">
                        {preset.name}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Advanced Settings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Configuración Avanzada
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom>Radio de Bordes: {borderRadius}px</Typography>
                <Slider
                  value={borderRadius}
                  onChange={(_, value) => setBorderRadius(value as number)}
                  min={0}
                  max={20}
                  step={1}
                  marks
                />
              </Box>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Tamaño de Fuente</InputLabel>
                <Select
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  label="Tamaño de Fuente"
                >
                  <MenuItem value="small">Pequeño</MenuItem>
                  <MenuItem value="medium">Medio</MenuItem>
                  <MenuItem value="large">Grande</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={compactMode}
                      onChange={(e) => setCompactMode(e.target.checked)}
                    />
                  }
                  label="Modo compacto"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={highContrast}
                      onChange={(e) => setHighContrast(e.target.checked)}
                    />
                  }
                  label="Alto contraste"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={reduceMotion}
                      onChange={(e) => setReduceMotion(e.target.checked)}
                    />
                  }
                  label="Reducir animaciones"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Theme Preview */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Vista Previa
              </Typography>
              {getThemePreview()}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={loading}
          size="large"
        >
          {loading ? 'Aplicando...' : 'Aplicar Tema'}
        </Button>
      </Box>
    </Box>
  );
};