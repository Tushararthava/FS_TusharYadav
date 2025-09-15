import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

interface NearbyUser {
  _id: string;
  anonymousUsername: string;
  homeLocation: {
    coordinates: [number, number];
  };
  destination: {
    coordinates: [number, number];
  };
  schedule: {
    departureTime: string;
    returnTime: string;
    daysOfWeek: string[];
  };
}

const MapView: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null);
  const [center, setCenter] = useState({ lat: 0, lng: 0 });

  useEffect(() => {
    // Get user's current location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCenter({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Error getting location:', error);
      }
    );

    // Fetch nearby users
    const fetchNearbyUsers = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/routes/nearby', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNearbyUsers(response.data);
      } catch (error) {
        console.error('Error fetching nearby users:', error);
      }
    };

    fetchNearbyUsers();
  }, [token]);

  const handleMarkerClick = (user: NearbyUser) => {
    setSelectedUser(user);
  };

  const startChat = async (userId: string) => {
    try {
      const response = await axios.post(
        'http://localhost:5000/api/chat/start',
        { otherUserId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate(`/chat/${response.data._id}`);
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100vh' }}
        center={center}
        zoom={13}
      >
        {nearbyUsers.map((user) => (
          <React.Fragment key={user._id}>
            {/* Home location marker */}
            <Marker
              position={{
                lat: user.homeLocation.coordinates[1],
                lng: user.homeLocation.coordinates[0]
              }}
              onClick={() => handleMarkerClick(user)}
              icon={{
                url: '/home-marker.png',
                scaledSize: new window.google.maps.Size(30, 30)
              }}
            />
            {/* Destination marker */}
            <Marker
              position={{
                lat: user.destination.coordinates[1],
                lng: user.destination.coordinates[0]
              }}
              onClick={() => handleMarkerClick(user)}
              icon={{
                url: '/destination-marker.png',
                scaledSize: new window.google.maps.Size(30, 30)
              }}
            />
          </React.Fragment>
        ))}

        {selectedUser && (
          <InfoWindow
            position={{
              lat: selectedUser.homeLocation.coordinates[1],
              lng: selectedUser.homeLocation.coordinates[0]
            }}
            onCloseClick={() => setSelectedUser(null)}
          >
            <div>
              <h3>{selectedUser.anonymousUsername}</h3>
              <p>Schedule:</p>
              <p>Departure: {selectedUser.schedule.departureTime}</p>
              <p>Return: {selectedUser.schedule.returnTime}</p>
              <p>Days: {selectedUser.schedule.daysOfWeek.join(', ')}</p>
              <button onClick={() => startChat(selectedUser._id)}>
                Chat with Student
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
};

export default MapView;