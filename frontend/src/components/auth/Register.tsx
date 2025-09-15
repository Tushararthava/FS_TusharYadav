import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Container, 
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Chip
} from '@mui/material';

interface Location {
  lat: number;
  lng: number;
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [homeLocation, setHomeLocation] = useState<Location>({ lat: 0, lng: 0 });
  const [destination, setDestination] = useState<Location>({ lat: 0, lng: 0 });
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [departureTime, setDepartureTime] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [error, setError] = useState('');
  const [locationStep, setLocationStep] = useState<'home' | 'destination'>('home');
  const { login } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    // Get user's current location for initial map center
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setHomeLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        // Default to a central location if geolocation fails
        setHomeLocation({ lat: 0, lng: 0 });
      }
    );
  }, []);

  const handleDaysChange = (event: SelectChangeEvent<string[]>) => {
    setSelectedDays(event.target.value as string[]);
  };

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return;
    
    const newLocation = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    };

    if (locationStep === 'home') {
      setHomeLocation(newLocation);
    } else {
      setDestination(newLocation);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/users/register', {
        email,
        password,
        homeLocation: [homeLocation.lng, homeLocation.lat], // MongoDB expects [longitude, latitude]
        destination: [destination.lng, destination.lat],
        schedule: {
          departureTime,
          returnTime,
          daysOfWeek: selectedDays
        }
      });

      login(response.data.token, response.data.anonymousUsername);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ 
        marginY: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <Typography component="h1" variant="h5">
          Student Commute Registration
        </Typography>
        {error && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Email Address"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
            {locationStep === 'home' ? 'Select Your Home Location' : 'Select Your Destination'}
          </Typography>
          
          <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''}>
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '300px', marginBottom: '20px' }}
              center={locationStep === 'home' ? homeLocation : destination}
              zoom={13}
              onClick={handleMapClick}
            >
              {locationStep === 'home' ? (
                <Marker position={homeLocation} />
              ) : (
                <Marker position={destination} />
              )}
            </GoogleMap>
          </LoadScript>

          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 1 }}
            onClick={() => setLocationStep(locationStep === 'home' ? 'destination' : 'home')}
          >
            {locationStep === 'home' ? 'Next: Set Destination' : 'Back to Home Location'}
          </Button>

          <FormControl fullWidth sx={{ mt: 3 }}>
            <InputLabel>Schedule Days</InputLabel>
            <Select
              multiple
              value={selectedDays}
              onChange={handleDaysChange}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((day) => (
                    <Chip key={day} label={day} />
                  ))}
                </Box>
              )}
            >
              {days.map((day) => (
                <MenuItem key={day} value={day}>
                  {day}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            margin="normal"
            required
            fullWidth
            type="time"
            label="Departure Time"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            type="time"
            label="Return Time"
            value={returnTime}
            onChange={(e) => setReturnTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Register
          </Button>
          <Button
            fullWidth
            variant="text"
            onClick={() => navigate('/login')}
          >
            Already have an account? Sign In
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Register;