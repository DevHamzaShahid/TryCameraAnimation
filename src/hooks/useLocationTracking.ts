import { useState, useEffect, useRef } from 'react';
import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import { calculateBearing } from '../utils/locationUtils';
import { useCompassHeading } from './useCompassHeading';

interface LocationState {
  latitude: number;
  longitude: number;
  heading: number;
  compassHeading?: number; // Device compass heading
  accuracy: number;
  timestamp: number;
}

interface UseLocationTrackingReturn {
  location: LocationState | null;
  isTracking: boolean;
  error: string | null;
  startTracking: () => void;
  stopTracking: () => void;
}

export const useLocationTracking = (): UseLocationTrackingReturn => {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const previousLocationRef = useRef<LocationState | null>(null);
  
  // Use compass heading for more accurate orientation
  const { 
    heading: compassHeading, 
    isActive: compassActive, 
    startCompass, 
    stopCompass,
    error: compassError 
  } = useCompassHeading();

  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message:
              'This app needs access to location to show your position on the map.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS permissions are handled through Info.plist
  };

  const startTracking = async () => {
    const hasPermission = await requestLocationPermission();

    if (!hasPermission) {
      setError('Location permission denied');
      Alert.alert(
        'Permission Required',
        'Please enable location permissions to use this feature.',
      );
      return;
    }

    setError(null);
    setIsTracking(true);

    // Start compass for better orientation
    startCompass();

    // Get initial position
    Geolocation.getCurrentPosition(
      position => {
        const newLocation: LocationState = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          heading: position.coords.heading || 0,
          compassHeading: compassActive ? compassHeading : undefined,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        setLocation(newLocation);
        previousLocationRef.current = newLocation;
      },
      error => {
        console.error('Error getting initial position:', error);
        setError(`Location error: ${error.message}`);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    );

    // Start watching position
    watchIdRef.current = Geolocation.watchPosition(
      position => {
        const newLocation: LocationState = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          heading: position.coords.heading || 0,
          compassHeading: compassActive ? compassHeading : undefined,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };

        // Calculate bearing if heading is not available
        if (!position.coords.heading && previousLocationRef.current) {
          const bearing = calculateBearing(
            {
              latitude: previousLocationRef.current.latitude,
              longitude: previousLocationRef.current.longitude,
            },
            {
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
            },
          );
          newLocation.heading = bearing;
        }

        setLocation(newLocation);
        previousLocationRef.current = newLocation;
      },
      error => {
        console.error('Error watching position:', error);
        setError(`Location tracking error: ${error.message}`);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 1, // Update every 1 meter
        interval: 1000, // Update every second
        fastestInterval: 500,
      },
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    stopCompass();
    setIsTracking(false);
  };

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  return {
    location,
    isTracking,
    error,
    startTracking,
    stopTracking,
  };
};
