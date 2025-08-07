import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Waypoint,
  NAVIGATION_SETTINGS,
  getNextWaypoint,
} from '../data/waypointsData';
import {
  Coordinate,
  calculateDistance,
  findNearestRestaurants,
} from '../utils/locationUtils';
import DirectionsService from '../services/DirectionsService';

interface NavigationState {
  currentWaypoint: Waypoint | null;
  activeRoute: Coordinate[] | null;
  isNavigating: boolean;
  navigationMode: 'auto' | 'manual';
  routeInfo: {
    distance: string;
    duration: string;
  } | null;
}

interface UseWaypointNavigationReturn {
  waypoints: Waypoint[];
  navigationState: NavigationState;
  setWaypoints: (waypoints: Waypoint[]) => void;
  startNavigation: (mode?: 'auto' | 'manual') => void;
  stopNavigation: () => void;
  selectWaypoint: (waypointId: string) => void;
  markWaypointCompleted: (waypointId: string) => void;
  markWaypointSkipped: (waypointId: string) => void;
  updateUserLocation: (location: Coordinate) => void;
  recalculateRoute: () => Promise<void>;
}

export const useWaypointNavigation = (
  initialWaypoints: Waypoint[],
  directionsService: DirectionsService,
): UseWaypointNavigationReturn => {
  const [waypoints, setWaypoints] = useState<Waypoint[]>(initialWaypoints);
  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentWaypoint: null,
    activeRoute: null,
    isNavigating: false,
    navigationMode: 'auto',
    routeInfo: null,
  });

  const userLocationRef = useRef<Coordinate | null>(null);
  const routeUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Find nearest waypoint to user location
  const findNearestWaypoint = useCallback(
    (
      userLocation: Coordinate,
      availableWaypoints: Waypoint[],
    ): Waypoint | null => {
      const pendingWaypoints = availableWaypoints.filter(
        wp => wp.status === 'pending',
      );

      if (pendingWaypoints.length === 0) return null;

      let nearest = pendingWaypoints[0];
      let minDistance = calculateDistance(userLocation, {
        latitude: nearest.latitude,
        longitude: nearest.longitude,
      });

      for (const waypoint of pendingWaypoints.slice(1)) {
        const distance = calculateDistance(userLocation, {
          latitude: waypoint.latitude,
          longitude: waypoint.longitude,
        });

        if (distance < minDistance) {
          minDistance = distance;
          nearest = waypoint;
        }
      }

      return nearest;
    },
    [],
  );

  // Check if user has arrived at current waypoint
  const checkArrival = useCallback(
    (userLocation: Coordinate, waypoint: Waypoint): boolean => {
      const distance = calculateDistance(userLocation, {
        latitude: waypoint.latitude,
        longitude: waypoint.longitude,
      });

      return distance * 1000 <= NAVIGATION_SETTINGS.ARRIVAL_THRESHOLD; // Convert km to meters
    },
    [],
  );

  // Calculate route to waypoint
  const calculateRoute = useCallback(
    async (
      origin: Coordinate,
      destination: Waypoint,
    ): Promise<{
      coordinates: Coordinate[];
      routeInfo: { distance: string; duration: string };
    } | null> => {
      try {
        const result = await directionsService.getDirections(origin, {
          latitude: destination.latitude,
          longitude: destination.longitude,
        });

        if (result) {
          const routeInfo = {
            distance: result.route.legs[0]?.distance.text || 'Unknown',
            duration: result.route.legs[0]?.duration.text || 'Unknown',
          };

          return {
            coordinates: result.coordinates,
            routeInfo,
          };
        } else {
          // Fallback to simple route
          const fallbackRoute = directionsService.createFallbackRoute(origin, {
            latitude: destination.latitude,
            longitude: destination.longitude,
          });

          const distance = calculateDistance(origin, {
            latitude: destination.latitude,
            longitude: destination.longitude,
          });

          return {
            coordinates: fallbackRoute,
            routeInfo: {
              distance: `${distance.toFixed(1)} km`,
              duration: `${Math.round(distance * 3)} min`, // Rough estimate
            },
          };
        }
      } catch (error) {
        console.error('Error calculating route:', error);
        return null;
      }
    },
    [directionsService],
  );

  // Update navigation based on user location
  const updateNavigation = useCallback(
    async (userLocation: Coordinate) => {
      if (!navigationState.isNavigating) return;

      const currentWaypoint = navigationState.currentWaypoint;

      // Check if arrived at current waypoint
      if (currentWaypoint && checkArrival(userLocation, currentWaypoint)) {
        // Mark current waypoint as completed
        const updatedWaypoints = waypoints.map(wp =>
          wp.id === currentWaypoint.id
            ? { ...wp, status: 'completed' as const }
            : wp,
        );
        setWaypoints(updatedWaypoints);

        // Find next waypoint
        let nextWaypoint: Waypoint | null = null;

        if (navigationState.navigationMode === 'auto') {
          nextWaypoint = findNearestWaypoint(userLocation, updatedWaypoints);
        } else {
          nextWaypoint = getNextWaypoint(updatedWaypoints);
        }

        if (nextWaypoint) {
          // Calculate route to next waypoint
          const routeData = await calculateRoute(userLocation, nextWaypoint);

          if (routeData) {
            setNavigationState(prev => ({
              ...prev,
              currentWaypoint: nextWaypoint,
              activeRoute: routeData.coordinates,
              routeInfo: routeData.routeInfo,
            }));

            // Update waypoint status
            setWaypoints(prev =>
              prev.map(wp =>
                wp.id === nextWaypoint!.id ? { ...wp, status: 'active' } : wp,
              ),
            );
          }
        } else {
          // No more waypoints - end navigation
          setNavigationState(prev => ({
            ...prev,
            isNavigating: false,
            currentWaypoint: null,
            activeRoute: null,
            routeInfo: null,
          }));
        }
      }
    },
    [
      navigationState,
      waypoints,
      checkArrival,
      findNearestWaypoint,
      calculateRoute,
    ],
  );

  // Start navigation
  const startNavigation = useCallback(
    async (mode: 'auto' | 'manual' = 'auto') => {
      if (!userLocationRef.current) {
        console.warn('User location not available');
        return;
      }

      const userLocation = userLocationRef.current;
      let firstWaypoint: Waypoint | null = null;

      if (mode === 'auto') {
        firstWaypoint = findNearestWaypoint(userLocation, waypoints);
      } else {
        firstWaypoint = getNextWaypoint(waypoints);
      }

      if (!firstWaypoint) {
        console.warn('No waypoints available for navigation');
        return;
      }

      const routeData = await calculateRoute(userLocation, firstWaypoint);

      if (routeData) {
        setNavigationState({
          currentWaypoint: firstWaypoint,
          activeRoute: routeData.coordinates,
          isNavigating: true,
          navigationMode: mode,
          routeInfo: routeData.routeInfo,
        });

        // Mark waypoint as active
        setWaypoints(prev =>
          prev.map(wp =>
            wp.id === firstWaypoint!.id ? { ...wp, status: 'active' } : wp,
          ),
        );
      }
    },
    [waypoints, findNearestWaypoint, calculateRoute],
  );

  // Stop navigation
  const stopNavigation = useCallback(() => {
    setNavigationState({
      currentWaypoint: null,
      activeRoute: null,
      isNavigating: false,
      navigationMode: 'auto',
      routeInfo: null,
    });

    // Reset all waypoints to pending (except completed ones)
    setWaypoints(prev =>
      prev.map(wp =>
        wp.status === 'active' ? { ...wp, status: 'pending' } : wp,
      ),
    );

    if (routeUpdateTimeoutRef.current) {
      clearTimeout(routeUpdateTimeoutRef.current);
    }
  }, []);

  // Manually select a waypoint
  const selectWaypoint = useCallback(
    async (waypointId: string) => {
      if (!userLocationRef.current) return;

      const waypoint = waypoints.find(wp => wp.id === waypointId);
      if (!waypoint || waypoint.status === 'completed') return;

      const routeData = await calculateRoute(userLocationRef.current, waypoint);

      if (routeData) {
        // Reset previous active waypoint
        setWaypoints(prev =>
          prev.map(wp => ({
            ...wp,
            status: wp.status === 'active' ? 'pending' : wp.status,
          })),
        );

        setNavigationState(prev => ({
          ...prev,
          currentWaypoint: waypoint,
          activeRoute: routeData.coordinates,
          isNavigating: true,
          navigationMode: 'manual',
          routeInfo: routeData.routeInfo,
        }));

        // Mark selected waypoint as active
        setWaypoints(prev =>
          prev.map(wp =>
            wp.id === waypointId ? { ...wp, status: 'active' } : wp,
          ),
        );
      }
    },
    [waypoints, calculateRoute],
  );

  // Mark waypoint as completed
  const markWaypointCompleted = useCallback(
    (waypointId: string) => {
      setWaypoints(prev =>
        prev.map(wp =>
          wp.id === waypointId ? { ...wp, status: 'completed' } : wp,
        ),
      );

      if (navigationState.currentWaypoint?.id === waypointId) {
        setNavigationState(prev => ({
          ...prev,
          currentWaypoint: null,
          activeRoute: null,
          routeInfo: null,
        }));
      }
    },
    [navigationState.currentWaypoint],
  );

  // Mark waypoint as skipped
  const markWaypointSkipped = useCallback((waypointId: string) => {
    setWaypoints(prev =>
      prev.map(wp =>
        wp.id === waypointId ? { ...wp, status: 'skipped' } : wp,
      ),
    );
  }, []);

  // Update user location and trigger navigation updates
  const updateUserLocation = useCallback(
    (location: Coordinate) => {
      userLocationRef.current = location;

      if (navigationState.isNavigating) {
        updateNavigation(location);
      }
    },
    [navigationState.isNavigating, updateNavigation],
  );

  // Recalculate current route
  const recalculateRoute = useCallback(async () => {
    if (!userLocationRef.current || !navigationState.currentWaypoint) return;

    const routeData = await calculateRoute(
      userLocationRef.current,
      navigationState.currentWaypoint,
    );

    if (routeData) {
      setNavigationState(prev => ({
        ...prev,
        activeRoute: routeData.coordinates,
        routeInfo: routeData.routeInfo,
      }));
    }
  }, [navigationState.currentWaypoint, calculateRoute]);

  // Set up periodic route updates
  useEffect(() => {
    if (navigationState.isNavigating && userLocationRef.current) {
      routeUpdateTimeoutRef.current = setTimeout(() => {
        recalculateRoute();
      }, NAVIGATION_SETTINGS.ROUTE_UPDATE_INTERVAL);
    }

    return () => {
      if (routeUpdateTimeoutRef.current) {
        clearTimeout(routeUpdateTimeoutRef.current);
      }
    };
  }, [navigationState.isNavigating, recalculateRoute]);

  return {
    waypoints,
    navigationState,
    setWaypoints,
    startNavigation,
    stopNavigation,
    selectWaypoint,
    markWaypointCompleted,
    markWaypointSkipped,
    updateUserLocation,
    recalculateRoute,
  };
};
