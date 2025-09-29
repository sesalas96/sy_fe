import React from 'react';
import { Box, Rating, Typography, Chip } from '@mui/material';
import { Star as StarIcon, StarBorder as StarBorderIcon } from '@mui/icons-material';

interface StarRatingProps {
  value: number;
  size?: 'small' | 'medium' | 'large';
  readOnly?: boolean;
  showLabel?: boolean;
  precision?: number;
  onChange?: (value: number | null) => void;
  max?: number;
  showNumeric?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  size = 'medium',
  readOnly = true,
  showLabel = false,
  precision = 0.5,
  onChange,
  max = 5,
  showNumeric = false
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { fontSize: '1rem' };
      case 'large':
        return { fontSize: '2rem' };
      default:
        return { fontSize: '1.5rem' };
    }
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return { text: 'Excelente', color: 'success' };
    if (rating >= 3.5) return { text: 'Bueno', color: 'primary' };
    if (rating >= 2.5) return { text: 'Regular', color: 'warning' };
    if (rating >= 1.5) return { text: 'Malo', color: 'error' };
    return { text: 'Muy malo', color: 'error' };
  };

  const label = getRatingLabel(value);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Rating
        value={value}
        precision={precision}
        readOnly={readOnly}
        onChange={(_, newValue) => onChange?.(newValue)}
        max={max}
        icon={<StarIcon sx={getSizeStyles()} />}
        emptyIcon={<StarBorderIcon sx={getSizeStyles()} />}
      />
      {showNumeric && (
        <Typography variant="body2" color="text.secondary">
          ({value.toFixed(1)})
        </Typography>
      )}
      {showLabel && (
        <Chip
          label={label.text}
          size="small"
          color={label.color as any}
          variant="outlined"
        />
      )}
    </Box>
  );
};