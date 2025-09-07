import React, { useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Card,
  CardContent,
  Button,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  Assignment as AssignmentIcon,
  Settings as SettingsIcon,
  AccountBalance as BillingIcon,
  Build as MaintenanceIcon,
  ContactSupport as ContactIcon,
  Article as ArticleIcon,
  QuestionAnswer as FAQIcon,
} from '@mui/icons-material';

interface HelpCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  articleCount: number;
  articles: string[];
  color: string;
}

const HelpCenterHelp: React.FC = () => {
  const [expandedPanel, setExpandedPanel] = useState<string | false>(false);

  const helpCategories: HelpCategory[] = [
    {
      id: 'security',
      title: 'Seguridad',
      icon: <SecurityIcon />,
      articleCount: 24,
      color: '#4CAF50',
      articles: [
        'Protocolos de seguridad básicos',
        'Equipos de protección personal (EPP)',
        'Procedimientos de emergencia',
        'Evaluación de riesgos',
        'Reportes de incidentes',
      ],
    },
    {
      id: 'permits',
      title: 'Permisos de Trabajo',
      icon: <AssignmentIcon />,
      articleCount: 18,
      color: '#2196F3',
      articles: [
        'Cómo crear un nuevo permiso',
        'Tipos de permisos disponibles',
        'Proceso de aprobación',
        'Permisos en caliente',
        'Permisos en frío',
      ],
    },
    {
      id: 'settings',
      title: 'Configuración',
      icon: <SettingsIcon />,
      articleCount: 15,
      color: '#FF9800',
      articles: [
        'Configurar notificaciones',
        'Cambiar idioma',
        'Gestionar usuarios',
        'Personalizar dashboard',
        'Configuración de seguridad',
      ],
    },
    {
      id: 'billing',
      title: 'Facturación',
      icon: <BillingIcon />,
      articleCount: 12,
      color: '#9C27B0',
      articles: [
        'Ver facturas',
        'Métodos de pago',
        'Historial de pagos',
        'Cambiar plan',
        'Preguntas sobre facturación',
      ],
    },
    {
      id: 'maintenance',
      title: 'Mantenimiento',
      icon: <MaintenanceIcon />,
      articleCount: 20,
      color: '#607D8B',
      articles: [
        'Programar mantenimiento',
        'Checklist de mantenimiento',
        'Reportes de mantenimiento',
        'Mantenimiento preventivo',
        'Historial de equipos',
      ],
    },
  ];

  const handlePanelChange = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedPanel(isExpanded ? panel : false);
  };

  const faqItems = [
    '¿Cómo reseteo mi contraseña?',
    '¿Cómo contacto al soporte técnico?',
    '¿Dónde encuentro mis certificados?',
    '¿Cómo descargo reportes?',
    '¿Qué hacer en caso de emergencia?',
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* FAQ Section */}
      <Card sx={{ mb: 3, backgroundColor: 'primary.main', color: 'primary.contrastText' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FAQIcon sx={{ mr: 1 }} />
            <Typography variant="h6">
              Preguntas Frecuentes
            </Typography>
          </Box>
          <List dense>
            {faqItems.map((item, index) => (
              <ListItem 
                key={index}
                sx={{ 
                  color: 'inherit',
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                }}
              >
                <ListItemText primary={item} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Help Categories */}
      <Typography variant="h6" gutterBottom>
        Categorías de Ayuda
      </Typography>
      
      {helpCategories.map((category) => (
        <Accordion
          key={category.id}
          expanded={expandedPanel === category.id}
          onChange={handlePanelChange(category.id)}
          sx={{ mb: 1 }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              '& .MuiAccordionSummary-content': {
                alignItems: 'center',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: 1,
                  backgroundColor: `${category.color}20`,
                  color: category.color,
                  mr: 2,
                }}
              >
                {category.icon}
              </Box>
              <Typography sx={{ flex: 1 }}>{category.title}</Typography>
              <Chip 
                label={`${category.articleCount} artículos`} 
                size="small" 
                variant="outlined"
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              {category.articles.map((article, index) => (
                <ListItem 
                  key={index}
                  sx={{ pl: 7, cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <ArticleIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={article} />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}

      <Divider sx={{ my: 3 }} />

      {/* Contact Support */}
      <Card sx={{ textAlign: 'center' }}>
        <CardContent>
          <ContactIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            ¿No encuentras lo que buscas?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Nuestro equipo de soporte está aquí para ayudarte
          </Typography>
          <Button variant="contained" fullWidth>
            Contactar Soporte
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default HelpCenterHelp;