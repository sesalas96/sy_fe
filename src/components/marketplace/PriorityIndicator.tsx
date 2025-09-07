import React from 'react';
import { 
  Chip, 
  ChipProps, 
  Box,
  Typography
} from '@mui/material';
import {
  KeyboardArrowUp as HighIcon,
  KeyboardDoubleArrowUp as UrgentIcon,
  KeyboardArrowDown as LowIcon,
  Remove as MediumIcon
} from '@mui/icons-material';

interface PriorityIndicatorProps extends Omit<ChipProps, 'color'> {
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'baja' | 'media' | 'alta' | 'urgente';
  showIcon?: boolean;
  showLabel?: boolean;
}

const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case 'urgent':
    case 'urgente':
      return {
        color: 'error' as ChipProps['color'],
        icon: UrgentIcon,
        label: priority === 'urgente' ? 'Urgente' : 'Urgent',
        textColor: '#d32f2f'
      };
    case 'high':
    case 'alta':
      return {
        color: 'warning' as ChipProps['color'],
        icon: HighIcon,
        label: priority === 'alta' ? 'Alta' : 'High',
        textColor: '#ed6c02'
      };
    case 'medium':
    case 'media':
      return {
        color: 'info' as ChipProps['color'],
        icon: MediumIcon,
        label: priority === 'media' ? 'Media' : 'Medium',
        textColor: '#0288d1'
      };
    case 'low':
    case 'baja':
      return {
        color: 'success' as ChipProps['color'],
        icon: LowIcon,
        label: priority === 'baja' ? 'Baja' : 'Low',
        textColor: '#2e7d32'
      };
    default:
      return {
        color: 'default' as ChipProps['color'],
        icon: MediumIcon,
        label: 'Medium',
        textColor: '#666'
      };
  }
};

export const PriorityIndicator: React.FC<PriorityIndicatorProps> = ({ 
  priority, 
  showIcon = true,
  showLabel = true,
  size = 'small',
  variant = 'filled',
  ...props 
}) => {
  const config = getPriorityConfig(priority);
  const Icon = config.icon;

  if (!showLabel && showIcon) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          color: config.textColor
        }}
      >
        <Icon fontSize="small" />
      </Box>
    );
  }

  return (
    <Chip
      label={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {showIcon && <Icon fontSize="small" />}
          {showLabel && <Typography variant="caption">{config.label}</Typography>}
        </Box>
      }
      color={config.color}
      size={size}
      variant={variant}
      {...props}
    />
  );
};