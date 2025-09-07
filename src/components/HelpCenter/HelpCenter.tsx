import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Typography,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useTheme,
  useMediaQuery,
  Fade,
} from '@mui/material';
import {
  Close as CloseIcon,
  Home as HomeIcon,
  Message as MessageIcon,
  Help as HelpIcon,
  Assignment as TasksIcon,
} from '@mui/icons-material';
import HelpCenterHome from './sections/HelpCenterHome';
import HelpCenterMessages from './sections/HelpCenterMessages';
import HelpCenterHelp from './sections/HelpCenterHelp';
import HelpCenterTasks from './sections/HelpCenterTasks';

interface HelpCenterProps {
  open: boolean;
  onClose: () => void;
}

type TabValue = 'home' | 'messages' | 'help' | 'tasks';

const HelpCenter: React.FC<HelpCenterProps> = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabValue>('home');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleTabChange = (_event: React.SyntheticEvent, newValue: TabValue) => {
    setActiveTab(newValue);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HelpCenterHome />;
      case 'messages':
        return <HelpCenterMessages />;
      case 'help':
        return <HelpCenterHelp />;
      case 'tasks':
        return <HelpCenterTasks />;
      default:
        return <HelpCenterHome />;
    }
  };

  const sidebarWidth = 220; // Same width as main sidebar
  const drawerWidth = isMobile ? '100%' : 500;

  return (
    <>
      {/* Backdrop */}
      <Fade in={open} timeout={300}>
        <Box
          onClick={onClose}
          sx={{
            position: 'fixed',
            top: isMobile ? 56 : 0,  // Add AppBar height on mobile
            left: isMobile ? 0 : sidebarWidth,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 99,
            display: open ? 'block' : 'none',
          }}
        />
      </Fade>
      
      {/* Help Center Panel */}
      <Box
        sx={{
          position: 'fixed',
          top: isMobile ? 56 : 0,  // Add AppBar height on mobile
          left: open 
            ? (isMobile ? 0 : sidebarWidth)
            : (isMobile ? '-100%' : `-${drawerWidth}px`),
          width: drawerWidth,
          height: isMobile ? 'calc(100% - 56px)' : '100%',  // Adjust height on mobile
          backgroundColor: 'background.paper',
          boxShadow: '5px 0 15px rgba(0, 0, 0, 0.1)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          transition: theme.transitions.create(['left'], {
            easing: open 
              ? theme.transitions.easing.easeOut 
              : theme.transitions.easing.sharp,
            duration: open 
              ? theme.transitions.duration.enteringScreen 
              : theme.transitions.duration.leavingScreen,
          }),
        }}
      >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          background: '#3c62d3',
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
          Centro de Operaciones
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: 'white',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Content Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: theme.palette.grey[50],
        }}
      >
        <Fade in={true} timeout={300}>
          <Box>{renderContent()}</Box>
        </Fade>
      </Box>

      {/* Bottom Navigation */}
      <Paper 
        elevation={0} 
        sx={{ 
          position: 'sticky', 
          bottom: 0,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: '#3c62d3',
          backdropFilter: 'blur(10px)',
        }}
      >
        <BottomNavigation
          value={activeTab}
          onChange={handleTabChange}
          showLabels
          sx={{
            backgroundColor: 'transparent',
            height: 65,
            '& .MuiBottomNavigationAction-root': {
              color: 'rgba(255, 255, 255, 0.7)',
              minWidth: 'auto',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              },
            },
            '& .MuiBottomNavigationAction-root.Mui-selected': {
              color: '#ffffff',
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.75rem',
                fontWeight: 600,
              },
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.7rem',
              fontWeight: 500,
              marginTop: '4px',
              transition: 'all 0.3s ease',
            },
            '& .MuiSvgIcon-root': {
              fontSize: '1.5rem',
              transition: 'transform 0.3s ease',
            },
            '& .Mui-selected .MuiSvgIcon-root': {
              transform: 'scale(1.1)',
            },
          }}
        >
          <BottomNavigationAction
            label="Inicio"
            value="home"
            icon={<HomeIcon />}
            sx={{
              position: 'relative',
              '&.Mui-selected::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                backgroundColor: 'white',
              },
            }}
          />
          <BottomNavigationAction
            label="Mensajes"
            value="messages"
            icon={<MessageIcon />}
            sx={{
              position: 'relative',
              '&.Mui-selected::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                backgroundColor: 'white',
              },
            }}
          />
          <BottomNavigationAction
            label="Ayuda"
            value="help"
            icon={<HelpIcon />}
            sx={{
              position: 'relative',
              '&.Mui-selected::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                backgroundColor: 'white',
              },
            }}
          />
          <BottomNavigationAction
            label="Tareas"
            value="tasks"
            icon={<TasksIcon />}
            sx={{
              position: 'relative',
              '&.Mui-selected::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                backgroundColor: 'white',
              },
            }}
          />
        </BottomNavigation>
      </Paper>
      </Box>
    </>
  );
};

export default HelpCenter;