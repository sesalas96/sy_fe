import React from 'react';
import { Chip, ChipProps } from '@mui/material';

interface StatusBadgeProps extends Omit<ChipProps, 'color'> {
  status: string;
  statusType?: 'workRequest' | 'bid' | 'workOrder' | 'inspection' | 'invoice' | 'nonConformity';
}

const getStatusColor = (status: string, statusType?: string): ChipProps['color'] => {
  switch (statusType) {
    case 'workRequest':
      switch (status) {
        case 'draft': return 'default';
        case 'published': return 'info';
        case 'bidding': return 'warning';
        case 'awarded': return 'success';
        case 'completed': return 'success';
        case 'cancelled': return 'error';
        default: return 'default';
      }
    
    case 'bid':
      switch (status) {
        case 'submitted': return 'info';
        case 'under_review': return 'warning';
        case 'accepted': return 'success';
        case 'rejected': return 'error';
        case 'withdrawn': return 'default';
        default: return 'default';
      }
    
    case 'workOrder':
      switch (status) {
        case 'assigned': return 'info';
        case 'in_progress': return 'warning';
        case 'on_hold': return 'default';
        case 'completed': return 'success';
        case 'cancelled': return 'error';
        default: return 'default';
      }
    
    case 'inspection':
      switch (status) {
        case 'scheduled': return 'info';
        case 'in_progress': return 'warning';
        case 'completed': return 'success';
        case 'failed': return 'error';
        case 'cancelled': return 'default';
        default: return 'default';
      }
    
    case 'invoice':
      switch (status) {
        case 'draft': return 'default';
        case 'pending': return 'warning';
        case 'approved': return 'info';
        case 'paid': return 'success';
        case 'overdue': return 'error';
        case 'cancelled': return 'default';
        default: return 'default';
      }
    
    case 'nonConformity':
      switch (status) {
        case 'open': return 'error';
        case 'in_progress': return 'warning';
        case 'closed': return 'info';
        case 'verified': return 'success';
        default: return 'default';
      }
    
    default:
      return 'default';
  }
};

const getStatusLabel = (status: string): string => {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  statusType,
  size = 'small',
  variant = 'filled',
  ...props 
}) => {
  const color = getStatusColor(status, statusType);
  const label = getStatusLabel(status);
  
  return (
    <Chip
      label={label}
      color={color}
      size={size}
      variant={variant}
      {...props}
    />
  );
};