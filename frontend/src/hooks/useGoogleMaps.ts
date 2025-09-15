import { useState, useCallback, useEffect } from 'react';
import { useLoadScript } from '@react-google-maps/api';

interface Location {
  lat: number;
  lng: number;
}

interface UseGoogleMapsReturn {
  isLoaded: boolean;
  loadError: Error | undefined;
  getCurrentLocation: () => Promise<Location>;
  geocodeAddress: (address: string) => Promise<Location>;
  calculateDistance: (origin: Location, destination: Location) => Promise<number>;
}

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places", "geometry"];

export const useGoogleMaps = (): UseGoogleMapsReturn => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries
  });

  const getCurrentLocation = useCallback((): Promise<Location> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        }
      );
    });
  }, []);

  const geocodeAddress = useCallback(async (address: string): Promise<Location> => {
    if (!isLoaded || !window.google) {
      throw new Error('Google Maps not loaded');
    }

    const geocoder = new window.google.maps.Geocoder();
    
    try {
      const result = await geocoder.geocode({ address });
      if (result.results[0]) {
        const { lat, lng } = result.results[0].geometry.location;
        return { lat: lat(), lng: lng() };
      }
      throw new Error('No results found');
    } catch (error) {
      throw new Error('Geocoding failed');
    }
  }, [isLoaded]);

  const calculateDistance = useCallback(async (
    origin: Location,
    destination: Location
  ): Promise<number> => {
    if (!isLoaded || !window.google) {
      throw new Error('Google Maps not loaded');
    }

    const service = new window.google.maps.DistanceMatrixService();
    
    try {
      const response = await service.getDistanceMatrix({
        origins: [new window.google.maps.LatLng(origin.lat, origin.lng)],
        destinations: [new window.google.maps.LatLng(destination.lat, destination.lng)],
        travelMode: window.google.maps.TravelMode.DRIVING,
      });

      if (response.rows[0].elements[0].status === 'OK') {
        return response.rows[0].elements[0].distance.value; // Returns distance in meters
      }
      throw new Error('Route calculation failed');
    } catch (error) {
      throw new Error('Distance calculation failed');
    }
  }, [isLoaded]);

  return {
    isLoaded,
    loadError,
    getCurrentLocation,
    geocodeAddress,
    calculateDistance
  };
};