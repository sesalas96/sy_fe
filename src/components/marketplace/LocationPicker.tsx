import React, { useState, useEffect } from 'react';
import {
  TextField,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  MyLocation as MyLocationIcon,
  Map as MapIcon
} from '@mui/icons-material';

interface LocationData {
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface LocationPickerProps {
  value: LocationData;
  onChange: (location: LocationData) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  suggestions?: LocationData[];
  withMap?: boolean;
  withCurrentLocation?: boolean;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  onChange,
  label = 'Location',
  placeholder = 'Enter address or location...',
  required = false,
  error = false,
  helperText,
  suggestions = [],
  withMap = false,
  withCurrentLocation = true
}) => {
  const [inputValue, setInputValue] = useState(value.address || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    setInputValue(value.address || '');
  }, [value]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    setShowSuggestions(newValue.length > 2);
    
    onChange({
      address: newValue,
      coordinates: value.coordinates
    });
  };

  const handleSuggestionSelect = (suggestion: LocationData) => {
    setInputValue(suggestion.address);
    setShowSuggestions(false);
    onChange(suggestion);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Reverse geocoding would typically happen here with a service like Google Maps
        // For now, we'll just use the coordinates
        const newLocation: LocationData = {
          address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          coordinates: {
            lat: latitude,
            lng: longitude
          }
        };
        
        setInputValue(newLocation.address);
        onChange(newLocation);
        setGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to retrieve your location. Please enter manually.');
        setGettingLocation(false);
      }
    );
  };

  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.address.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <Box sx={{ position: 'relative' }}>
      <TextField
        fullWidth
        label={label}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        required={required}
        error={error}
        helperText={helperText}
        slotProps={{
          input: {
            endAdornment: (
              <Box sx={{ display: 'flex', gap: 1 }}>
                {withCurrentLocation && (
                  <IconButton
                    size="small"
                    onClick={getCurrentLocation}
                    disabled={gettingLocation}
                    title="Use current location"
                  >
                    <MyLocationIcon />
                  </IconButton>
                )}
                {withMap && (
                  <IconButton
                    size="small"
                    onClick={() => setMapDialogOpen(true)}
                    title="Open map"
                  >
                    <MapIcon />
                  </IconButton>
                )}
              </Box>
            )
          }
        }}
        onFocus={() => setShowSuggestions(inputValue.length > 2)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
      />

      {showSuggestions && filteredSuggestions.length > 0 && (
        <Paper
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            maxHeight: 200,
            overflow: 'auto'
          }}
        >
          <List dense>
            {filteredSuggestions.map((suggestion, index) => (
              <ListItem
                key={index}
                component="button"
                onClick={() => handleSuggestionSelect(suggestion)}
                sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
              >
                <ListItemIcon>
                  <LocationIcon />
                </ListItemIcon>
                <ListItemText primary={suggestion.address} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {withMap && (
        <Dialog
          open={mapDialogOpen}
          onClose={() => setMapDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Select Location</DialogTitle>
          <DialogContent>
            <Box
              sx={{
                height: 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f5f5f5',
                border: '2px dashed #ddd'
              }}
            >
              <Typography variant="body1" color="text.secondary">
                Map integration would be implemented here
                <br />
                (Google Maps, Leaflet, etc.)
              </Typography>
            </Box>
            {value.coordinates && (
              <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                Current coordinates: {value.coordinates.lat}, {value.coordinates.lng}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMapDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};