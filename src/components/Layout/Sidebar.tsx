import React, { useState, useEffect } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  Typography,
  Avatar,
  Button,
  Collapse,
  Divider
} from '@mui/material';
import {
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Logout as LogoutIcon,
  SupervisorAccount as SupervisorIcon,
  // Receipt as InvoicesIcon,
  ExpandLess,
  ExpandMore,
  Category as CategoryIcon,
  // Store as MarketplaceIcon,
  // Build as ServicesIcon,
  // RequestPage as RequestsIcon,
  // Work as WorkOrdersIcon,
  // Search as InspectionsIcon,
  // Visibility as ViewIcon,
  // LocalOffer as MyBidsIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

const drawerWidth = 220;

interface MenuItem {
  title: string;
  icon: React.ReactElement;
  path?: string;
  roles: UserRole[];
  children?: MenuItem[];
}

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  isMobile?: boolean;
}

const menuItems: MenuItem[] = [
  // {
  //   title: 'Inicio',
  //   icon: <DashboardIcon />,
  //   path: '/dashboard',
  //   roles: [UserRole.SUPER_ADMIN, UserRole.SAFETY_STAFF, UserRole.CLIENT_SUPERVISOR, UserRole.CLIENT_APPROVER, UserRole.CLIENT_STAFF, UserRole.VALIDADORES_OPS, UserRole.CONTRATISTA_ADMIN, UserRole.CONTRATISTA_SUBALTERNOS, UserRole.CONTRATISTA_HUERFANO]
  // },
  {
    title: 'Usuarios',
    icon: <PeopleIcon />,
    path: '/system-users',
    roles: [UserRole.SUPER_ADMIN, UserRole.SAFETY_STAFF]
  },
  {
    title: 'Usuarios',
    icon: <PeopleIcon />,
    path: '/company-users',
    roles: [UserRole.CLIENT_SUPERVISOR]
  },
  {
    title: 'Validación de Contratistas',
    icon: <SecurityIcon />,
    path: '/contractor-search',
    roles: [UserRole.VALIDADORES_OPS]
  },
  {
    title: 'Contratistas',
    icon: <PeopleIcon />,
    path: '/contractors',
    roles: [UserRole.CLIENT_APPROVER,  UserRole.CONTRATISTA_ADMIN]
  },
  {
    title: 'Contratistas',
    icon: <SupervisorIcon />,
    path: '/supervised-contractors',
    roles: [UserRole.CLIENT_SUPERVISOR]
  },
  // {
  //   title: 'Mis Equipos',
  //   icon: <PeopleIcon />,
  //   path: '/my-teams',
  //   // roles: [UserRole.CLIENT_SUPERVISOR, UserRole.CONTRATISTA_ADMIN]
  //   roles: []
  // },
  // {
  //   title: 'Mis Tareas',
  //   icon: <AssignmentIcon />,
  //   path: '/my-tasks',
  //   roles: [UserRole.CLIENT_STAFF, UserRole.VALIDADORES_OPS, UserRole.CONTRATISTA_ADMIN, UserRole.CONTRATISTA_SUBALTERNOS, UserRole.CONTRATISTA_HUERFANO]
  // },
  {
    title: 'Permisos de Trabajo',
    icon: <AssignmentIcon />,
    roles: [UserRole.SUPER_ADMIN, UserRole.SAFETY_STAFF, UserRole.CLIENT_SUPERVISOR, UserRole.CLIENT_APPROVER, UserRole.VALIDADORES_OPS, UserRole.CONTRATISTA_ADMIN, UserRole.CONTRATISTA_SUBALTERNOS, UserRole.CONTRATISTA_HUERFANO],
    children: [
      {
        title: 'Lista de Permisos',
        icon: <AssignmentIcon />,
        path: '/work-permits',
        roles: [UserRole.SUPER_ADMIN, UserRole.SAFETY_STAFF, UserRole.CLIENT_SUPERVISOR, UserRole.CLIENT_APPROVER, UserRole.VALIDADORES_OPS, UserRole.CONTRATISTA_ADMIN, UserRole.CONTRATISTA_SUBALTERNOS, UserRole.CONTRATISTA_HUERFANO]
      },
      {
        title: 'Catálogo de Templates',
        icon: <CategoryIcon />,
        path: '/work-permits/templates',
        roles: [UserRole.SUPER_ADMIN, UserRole.SAFETY_STAFF, UserRole.CLIENT_SUPERVISOR]
      },
      {
        title: 'Catálogo de Formularios',
        icon: <CategoryIcon />,
        path: '/work-permits/forms',
        roles: [UserRole.SUPER_ADMIN, UserRole.SAFETY_STAFF, UserRole.CLIENT_SUPERVISOR]
      }
    ]
  },
  // TEMPORALMENTE OCULTO - MERCADO DIGITAL
  // {
  //   title: 'Mercado Digital',
  //   icon: <MarketplaceIcon />,
  //   roles: [UserRole.SUPER_ADMIN, UserRole.SAFETY_STAFF, UserRole.CLIENT_SUPERVISOR, UserRole.CONTRATISTA_ADMIN, UserRole.CONTRATISTA_HUERFANO],
  //   children: [
  //     // Management section (for clients)
  //     {
  //       title: 'Órdenes de Trabajo',
  //       icon: <WorkOrdersIcon />,
  //       path: '/marketplace/work-orders',
  //       roles: [UserRole.SUPER_ADMIN, UserRole.SAFETY_STAFF, UserRole.CLIENT_SUPERVISOR, UserRole.CLIENT_APPROVER, UserRole.CONTRATISTA_ADMIN, UserRole.CONTRATISTA_SUBALTERNOS]
  //     },
  //     {
  //       title: 'Solicitudes de Trabajo',
  //       icon: <RequestsIcon />,
  //       path: '/marketplace/work-requests',
  //       roles: [UserRole.SUPER_ADMIN, UserRole.SAFETY_STAFF, UserRole.CLIENT_SUPERVISOR, UserRole.CLIENT_APPROVER]
  //     },
  //     {
  //       title: 'Inspecciones',
  //       icon: <InspectionsIcon />,
  //       path: '/marketplace/inspections',
  //       roles: [UserRole.SUPER_ADMIN, UserRole.SAFETY_STAFF, UserRole.CLIENT_SUPERVISOR, UserRole.CLIENT_APPROVER]
  //     },
  //     {
  //       title: 'Catálogo de Servicios',
  //       icon: <ServicesIcon />,
  //       path: '/marketplace/services',
  //       roles: [UserRole.SUPER_ADMIN, UserRole.SAFETY_STAFF, UserRole.CLIENT_SUPERVISOR, UserRole.CLIENT_APPROVER]
  //     },
  //     // Contractor section
  //     {
  //       title: 'Oportunidades de Licitación',
  //       icon: <ViewIcon />,
  //       path: '/marketplace/opportunities',
  //       roles: [UserRole.CONTRATISTA_ADMIN, UserRole.CONTRATISTA_HUERFANO]
  //     },
  //     {
  //       title: 'Mis Propuestas',
  //       icon: <MyBidsIcon />,
  //       path: '/marketplace/my-bids',
  //       roles: [UserRole.CONTRATISTA_ADMIN, UserRole.CONTRATISTA_HUERFANO]
  //     }
  //   ]
  // },
  // {
  //   title: 'Facturación',
  //   icon: <InvoicesIcon />,
  //   path: '/marketplace/invoices',
  //   roles: [UserRole.SUPER_ADMIN, UserRole.SAFETY_STAFF, UserRole.CLIENT_SUPERVISOR, UserRole.CLIENT_APPROVER, UserRole.CONTRATISTA_ADMIN]
  // },
  // {
  //   title: 'Cursos y Certificaciones',
  //   icon: <SchoolIcon />,
  //   path: '/courses',
  //   roles: [UserRole.SUPER_ADMIN, UserRole.SAFETY_STAFF]
  // },
  {
    title: 'Cursos',
    icon: <SchoolIcon />,
    path: '/courses',
    roles: [UserRole.SUPER_ADMIN, UserRole.SAFETY_STAFF, UserRole.CLIENT_SUPERVISOR, UserRole.CLIENT_APPROVER, UserRole.CLIENT_STAFF, UserRole.CONTRATISTA_ADMIN, UserRole.CONTRATISTA_SUBALTERNOS, UserRole.CONTRATISTA_HUERFANO, UserRole.VALIDADORES_OPS]
  },
  // {
  //   title: 'Notificaciones',
  //   icon: <NotificationsIcon />,
  //   path: '/notifications',
  //   roles: [UserRole.SUPER_ADMIN, UserRole.SAFETY_STAFF, UserRole.CLIENT_SUPERVISOR, UserRole.CLIENT_APPROVER, UserRole.CLIENT_STAFF, UserRole.VALIDADORES_OPS, UserRole.CONTRATISTA_ADMIN, UserRole.CONTRATISTA_SUBALTERNOS, UserRole.CONTRATISTA_HUERFANO]
  // },
  {
    title: 'Administración de Espacios de Trabajos',
    icon: <BusinessIcon />,
    path: '/companies',
    roles: [UserRole.SUPER_ADMIN, UserRole.SAFETY_STAFF]
  },
  // {
  //   title: 'Configuración del Sistema',
  //   icon: <SettingsIcon />,
  //   path: '/settings',
  //   roles: [UserRole.SUPER_ADMIN]
  // },
  // {
  //   title: 'Configuración',
  //   icon: <SettingsIcon />,
  //   path: '/settings',
  //   roles: [UserRole.CLIENT_SUPERVISOR, UserRole.CONTRATISTA_ADMIN]
  // }
];

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen = false,
  onMobileClose,
  isMobile = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasRole, logout, userAvatarUrl, pendingVerifications } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Auto-expand/collapse menus based on current route
  useEffect(() => {
    // Handle "Permisos de Trabajo"
    if (location.pathname.includes('/work-permits')) {
      setExpandedItems(prev => {
        if (!prev.includes('Permisos de Trabajo')) {
          return [...prev, 'Permisos de Trabajo'];
        }
        return prev;
      });
    } else {
      setExpandedItems(prev => prev.filter(item => item !== 'Permisos de Trabajo'));
    }

    // Handle "Mercado Digital"
    if (location.pathname.includes('/marketplace')) {
      setExpandedItems(prev => {
        if (!prev.includes('Mercado Digital')) {
          return [...prev, 'Mercado Digital'];
        }
        return prev;
      });
    } else {
      setExpandedItems(prev => prev.filter(item => item !== 'Mercado Digital'));
    }
  }, [location.pathname]);

  const filteredMenuItems = menuItems.filter(item =>
    item.roles.some(role => hasRole(role))
  );

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };

  const toggleExpanded = (itemTitle: string) => {
    setExpandedItems(prev =>
      prev.includes(itemTitle)
        ? prev.filter(item => item !== itemTitle)
        : [...prev, itemTitle]
    );
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const isExpanded = expandedItems.includes(item.title);
    const hasChildren = item.children && item.children.length > 0;

    // For items that are children of a parent menu (level > 0), use exact match
    // For top-level items without children, allow sub-routes
    const isActive = item.path ? (
      level > 0
        ? location.pathname === item.path  // Exact match for child menu items
        : (
          location.pathname === item.path ||
          (location.pathname.startsWith(item.path) &&
            location.pathname.charAt(item.path.length) === '/' &&
            !hasChildren)
        )
    ) : false;

    const isParentOfActive = hasChildren && item.children!.some(
      child => child.path && location.pathname.startsWith(child.path)
    );

    // Filter children based on user roles
    const filteredChildren = hasChildren
      ? item.children!.filter(child => child.roles.some(role => hasRole(role)))
      : [];

    if (hasChildren && filteredChildren.length === 0) {
      return null; // Don't show parent if no children are visible
    }

    return (
      <React.Fragment key={item.title}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => {
              if (hasChildren) {
                toggleExpanded(item.title);
              } else if (item.path) {
                handleNavigate(item.path);
              }
            }}
            sx={{
              pl: 1.5 + level * 2,
              pr: 1.5,
              py: 0.75,
              borderRadius: 0.5,
              mx: 0.5,
              backgroundColor: isActive ? 'rgba(33, 150, 243, 0.08)' : (isParentOfActive && level === 0 ? 'action.selected' : 'transparent'),
              borderLeft: (isActive || (isParentOfActive && level === 0)) ? '2px solid' : '2px solid transparent',
              borderLeftColor: (
                // Azul para subitems activos dentro de "Permisos de Trabajo"
                (level > 0 && isActive && location.pathname.includes('/work-permits')) ? 'primary.main' :
                  // Azul para otros casos activos
                  ((isActive || (isParentOfActive && level === 0)) ? 'primary.main' : 'transparent')
              ),
              '&:hover': {
                backgroundColor: isActive ? 'rgba(33, 150, 243, 0.12)' : 'action.hover'
              },
              '& .MuiListItemText-primary': {
                color: (
                  // Azul para "Permisos de Trabajo" y "Mercado Digital" cuando están expandidos
                  (level === 0 && (item.title === 'Permisos de Trabajo' || item.title === 'Mercado Digital') && isExpanded) ? 'primary.main' :
                    // Azul para subitems activos dentro de "Permisos de Trabajo"
                    (level > 0 && isActive && location.pathname.includes('/work-permits')) ? 'primary.main' :
                      // Comportamiento por defecto
                      (isActive ? 'primary.main' : 'text.primary')
                ),
                fontWeight: 400,
                fontSize: '0.813rem'
              }
            }}
          >
            <ListItemText primary={item.title} sx={{ ml: 0 }} />
            {hasChildren && (
              <Box sx={{
                color: (level === 0 && (item.title === 'Permisos de Trabajo' || item.title === 'Mercado Digital') && isExpanded) ? 'primary.main' : 'text.secondary',
                '& svg': { fontSize: 18 }
              }}>
                {isExpanded ? <ExpandLess /> : <ExpandMore />}
              </Box>
            )}
          </ListItemButton>
        </ListItem>

        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {filteredChildren.map(child => renderMenuItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const drawerContent = (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      overflow: 'hidden',
      backgroundColor: '#ffffff',
      position: 'relative'
    }}>
      {/* Header */}
      <Box sx={{
        p: 2.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <img
          src="/safety-logo.png"
          alt="Safety Logo"
          style={{
            height: '75px',
            width: 'auto'
          }}
        />
      </Box>

      <Divider />

      {/* Navigation Menu */}
      <Box sx={{
        flexGrow: 1,
        overflow: 'auto',
        px: 1,
        py: 1
      }}>
        <List sx={{ py: 0 }}>
          {filteredMenuItems.map((item) => renderMenuItem(item))}
        </List>
      </Box>

      <Divider />

      {/* User Section and Logout */}
      <Box sx={{
        flexShrink: 0,
        p: 2
      }}>
        {user && (
          <>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 2,
                cursor: 'pointer',
                p: 1,
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
              onClick={() => handleNavigate('/profile')}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  mr: 1.5,
                  bgcolor: userAvatarUrl ? 'transparent' : 'primary.main',
                  fontSize: '0.75rem'
                }}
                src={userAvatarUrl || undefined}
              >
                {!userAvatarUrl && getInitials(user.name)}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0, ml: 0.5 }}>
                <Typography
                  variant="body2"
                  noWrap
                  sx={{
                    fontWeight: 500,
                    color: 'text.primary',
                    fontSize: '0.813rem',
                    lineHeight: 1.2
                  }}
                >
                  {user.name}
                </Typography>
                {pendingVerifications && pendingVerifications.total > 0 && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'error.main',
                      fontSize: '0.688rem',
                      display: 'block'
                    }}
                  >
                    {pendingVerifications.total} documento{pendingVerifications.total !== 1 ? 's' : ''} pendiente{pendingVerifications.total !== 1 ? 's' : ''}
                  </Typography>
                )}
              </Box>
            </Box>

            <Button
              fullWidth
              variant="text"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              size="small"
              sx={{
                justifyContent: 'flex-start',
                textTransform: 'none',
                color: 'text.secondary',
                fontSize: '0.813rem',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  color: 'error.main'
                }
              }}
            >
              Cerrar Sesión
            </Button>
          </>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={onMobileClose}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            zIndex: 1500,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              height: '100dvh',
              overflow: 'hidden',
              borderRight: '1px solid',
              borderColor: 'divider',
              zIndex: 1500
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        /* Desktop Drawer */
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            width: drawerWidth,
            flexShrink: 0,
            zIndex: 150,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              height: '100dvh',
              overflow: 'hidden',
              position: 'fixed',
              top: 0,
              left: 0,
              borderRight: '1px solid',
              borderColor: 'divider',
              zIndex: 150
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
};