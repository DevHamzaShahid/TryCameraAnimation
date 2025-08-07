import { useState, useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import MapView, { Camera, Region } from 'react-native-maps';
import { NAVIGATION_SETTINGS } from '../data/waypointsData';
import { Coordinate } from '../utils/locationUtils';

interface CameraState {
  center: Coordinate;
  zoom: number;
  bearing: number;
  pitch: number;
}

interface UseNavigationCameraReturn {
  cameraState: CameraState;
  isAnimating: boolean;
  rotateToNorth: (animate?: boolean) => void;
  followLocation: (location: Coordinate, bearing?: number) => void;
  focusOnRoute: (start: Coordinate, end: Coordinate) => void;
  animateToLocation: (location: Coordinate, zoom?: number) => void;
  setBearing: (bearing: number, animate?: boolean) => void;
}

export const useNavigationCamera = (
  mapRef: React.RefObject<MapView>,
): UseNavigationCameraReturn => {
  const [cameraState, setCameraState] = useState<CameraState>({
    center: { latitude: 37.7849, longitude: -122.4094 },
    zoom: NAVIGATION_SETTINGS.DEFAULT_ZOOM,
    bearing: NAVIGATION_SETTINGS.NORTH_BEARING,
    pitch: 0,
  });

  const [isAnimating, setIsAnimating] = useState(false);
  const bearingAnimValue = useRef(new Animated.Value(0)).current;
  const lastBearing = useRef(0);

  // Smoothly rotate camera to north
  const rotateToNorth = useCallback(
    (animate = true) => {
      if (!mapRef.current) return;

      const targetBearing = NAVIGATION_SETTINGS.NORTH_BEARING;

      if (animate) {
        setIsAnimating(true);

        // Animate bearing to north
        Animated.timing(bearingAnimValue, {
          toValue: targetBearing,
          duration: NAVIGATION_SETTINGS.CAMERA_ANIMATION_DURATION,
          useNativeDriver: false,
        }).start(() => {
          setIsAnimating(false);
        });

        // Update map camera
        const camera: Camera = {
          center: cameraState.center,
          zoom: 15,
          heading: targetBearing,
          pitch: 0,
        };

        mapRef.current.animateCamera(
          camera,
          NAVIGATION_SETTINGS.CAMERA_ANIMATION_DURATION,
        );
      } else {
        const camera: Camera = {
          center: cameraState.center,
          zoom: 15,
          heading: targetBearing,
          pitch: 0,
        };
        mapRef.current.setCamera(camera);
      }

      setCameraState(prev => ({ ...prev, bearing: targetBearing }));
      lastBearing.current = targetBearing;
    },
    [cameraState.center, mapRef, bearingAnimValue],
  );

  // Follow user location with optional bearing
  const followLocation = useCallback(
    (location: Coordinate, bearing?: number) => {
      if (!mapRef.current) return;

      const newBearing = bearing !== undefined ? bearing : cameraState.bearing;

      const camera: Camera = {
        center: location,
        zoom: 16,
        heading: newBearing,
        pitch: 45, // Slight tilt for navigation view
      };

      mapRef.current.animateCamera(camera, 800);

      setCameraState({
        center: location,
        zoom: NAVIGATION_SETTINGS.NAVIGATION_ZOOM,
        bearing: newBearing,
        pitch: 45,
      });
    },
    [cameraState.bearing, mapRef],
  );

  // Focus camera to show entire route
  const focusOnRoute = useCallback(
    (start: Coordinate, end: Coordinate) => {
      if (!mapRef.current) return;

      const region: Region = {
        latitude: (start.latitude + end.latitude) / 2,
        longitude: (start.longitude + end.longitude) / 2,
        latitudeDelta: Math.abs(start.latitude - end.latitude) * 1.5,
        longitudeDelta: Math.abs(start.longitude - end.longitude) * 1.5,
      };

      mapRef.current.animateToRegion(
        region,
        NAVIGATION_SETTINGS.CAMERA_ANIMATION_DURATION,
      );

      setCameraState(prev => ({
        ...prev,
        center: {
          latitude: region.latitude,
          longitude: region.longitude,
        },
        zoom: Math.max(region.latitudeDelta, region.longitudeDelta),
        bearing: NAVIGATION_SETTINGS.NORTH_BEARING,
        pitch: 0,
      }));
    },
    [mapRef],
  );

  // Animate to specific location with zoom
  const animateToLocation = useCallback(
    (location: Coordinate, zoom?: number) => {
      if (!mapRef.current) return;

      const targetZoom = zoom || NAVIGATION_SETTINGS.NAVIGATION_ZOOM;

      const region: Region = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: targetZoom,
        longitudeDelta: targetZoom,
      };

      mapRef.current.animateToRegion(
        region,
        NAVIGATION_SETTINGS.CAMERA_ANIMATION_DURATION,
      );

      setCameraState(prev => ({
        ...prev,
        center: location,
        zoom: targetZoom,
      }));
    },
    [mapRef],
  );

  // Set specific bearing with animation
  const setBearing = useCallback(
    (bearing: number, animate = true) => {
      if (!mapRef.current) return;

      // Normalize bearing to 0-360
      const normalizedBearing = ((bearing % 360) + 360) % 360;

      if (animate) {
        setIsAnimating(true);

        // Calculate shortest rotation path
        let targetBearing = normalizedBearing;
        const currentBearing = lastBearing.current;
        const diff = targetBearing - currentBearing;

        if (diff > 180) {
          targetBearing -= 360;
        } else if (diff < -180) {
          targetBearing += 360;
        }

        Animated.timing(bearingAnimValue, {
          toValue: targetBearing,
          duration: 500,
          useNativeDriver: false,
        }).start(() => {
          setIsAnimating(false);
        });

        const camera: Camera = {
          center: cameraState.center,
          zoom: 16,
          heading: normalizedBearing,
          pitch: cameraState.pitch,
        };

        mapRef.current.animateCamera(camera, 500);
      } else {
        const camera: Camera = {
          center: cameraState.center,
          zoom: 16,
          heading: normalizedBearing,
          pitch: cameraState.pitch,
        };
        mapRef.current.setCamera(camera);
      }

      setCameraState(prev => ({ ...prev, bearing: normalizedBearing }));
      lastBearing.current = normalizedBearing;
    },
    [cameraState, mapRef, bearingAnimValue],
  );

  return {
    cameraState,
    isAnimating,
    rotateToNorth,
    followLocation,
    focusOnRoute,
    animateToLocation,
    setBearing,
  };
};
