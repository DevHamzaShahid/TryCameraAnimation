import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import MapView, { Polyline, Region } from 'react-native-maps';
import {
  WaypointMarker,
  UserLocationMarker,
} from '../components/WaypointMarkers';
import { EnhancedUserLocationMarker } from '../components/EnhancedUserLocationMarker';
import { SimpleCompassIndicator } from '../components/SimpleCompassIndicator';
import { useLocationTracking } from '../hooks/useLocationTracking';
import { useNavigationCamera } from '../hooks/useNavigationCamera';
import { useWaypointNavigation } from '../hooks/useWaypointNavigation';
import { useCompassHeading } from '../hooks/useCompassHeading';
import {
  navigationWaypoints,
  NAVIGATION_SETTINGS,
} from '../data/waypointsData';
import DirectionsService from '../services/DirectionsService';
import { calculateBearing } from '../utils/locationUtils';

const { width, height } = Dimensions.get('window');

const NavigationMapScreen: React.FC = () => {
  const mapRef = useRef<MapView>(null);
  const directionsService = useRef(new DirectionsService()).current;

  // Location tracking
  const { location, isTracking, error, startTracking, stopTracking } =
    useLocationTracking();

  // Compass heading
  const {
    heading: compassHeading,
    isActive: compassActive,
    startCompass,
  } = useCompassHeading();

  // Camera management
  const {
    cameraState,
    isAnimating,
    rotateToNorth,
    followLocation,
    focusOnRoute,
    animateToLocation,
    setBearing,
  } = useNavigationCamera(mapRef);

  // Waypoint navigation
  const {
    waypoints,
    navigationState,
    startNavigation,
    stopNavigation,
    selectWaypoint,
    markWaypointCompleted,
    markWaypointSkipped,
    updateUserLocation,
    recalculateRoute,
  } = useWaypointNavigation(navigationWaypoints, directionsService);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  // State for UI
  const [showWaypointList, setShowWaypointList] = useState(false);
  const [compassBearing, setCompassBearing] = useState(0);

  useEffect(() => {
    // Start location tracking and compass
    startTracking();
    startCompass();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      stopTracking();
      stopNavigation();
    };
  }, []);

  // Update compass bearing when compass heading changes
  useEffect(() => {
    if (compassActive && compassHeading !== undefined) {
      setCompassBearing(compassHeading);
      console.log(
        'NavigationMapScreen - Compass bearing updated:',
        compassHeading,
      );
    }
  }, [compassHeading, compassActive]);

  // Update navigation when location changes
  useEffect(() => {
    if (location) {
      updateUserLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });

      // Calculate bearing for compass - prefer compass heading over GPS heading
      const effectiveHeading =
        compassActive && compassHeading !== undefined
          ? compassHeading
          : location.heading;

      // Follow location if navigating
      if (navigationState.isNavigating) {
        followLocation(
          { latitude: location.latitude, longitude: location.longitude },
          effectiveHeading,
        );
      }
    }
  }, [
    location,
    navigationState.isNavigating,
    updateUserLocation,
    followLocation,
    compassHeading,
    compassActive,
  ]);

  // Auto-rotate camera to north after turns
  useEffect(() => {
    if (navigationState.isNavigating && location) {
      const effectiveHeading =
        compassActive && compassHeading !== undefined
          ? compassHeading
          : location.heading;

      if (effectiveHeading !== undefined) {
        const headingChange = Math.abs(effectiveHeading - compassBearing);

        // If significant turn detected, rotate to north after a delay
        if (headingChange > 30) {
          setTimeout(() => {
            rotateToNorth(true);
          }, 2000);
        }
      }
    }
  }, [
    location?.heading,
    compassHeading,
    navigationState.isNavigating,
    rotateToNorth,
    compassBearing,
    compassActive,
  ]);

  // Handle waypoint marker press
  const handleWaypointPress = useCallback(
    (waypointId: string) => {
      const waypoint = waypoints.find(wp => wp.id === waypointId);
      if (!waypoint) return;

      Alert.alert(
        waypoint.name,
        `${waypoint.description}\n\nType: ${waypoint.type.replace(
          '_',
          ' ',
        )}\nStatus: ${waypoint.status}`,
        [
          { text: 'Cancel', style: 'cancel' },
          ...(waypoint.status !== 'completed'
            ? [
                {
                  text: 'Navigate Here',
                  onPress: () => selectWaypoint(waypointId),
                },
              ]
            : []),
          ...(waypoint.status === 'active'
            ? [
                {
                  text: 'Mark Complete',
                  onPress: () => markWaypointCompleted(waypointId),
                },
                {
                  text: 'Skip',
                  onPress: () => markWaypointSkipped(waypointId),
                },
              ]
            : []),
        ],
      );
    },
    [waypoints, selectWaypoint, markWaypointCompleted, markWaypointSkipped],
  );

  // Start auto navigation
  const handleStartAutoNavigation = useCallback(() => {
    if (waypoints.length === 0) {
      Alert.alert(
        'No Waypoints',
        'Please add waypoints before starting navigation.',
      );
      return;
    }

    startNavigation();
    console.log('NavigationMapScreen - Auto navigation started');
  }, [waypoints.length, startNavigation]);

  // Start manual navigation
  const handleStartManualNavigation = useCallback(() => {
    if (waypoints.length === 0) {
      Alert.alert(
        'No Waypoints',
        'Please add waypoints before starting navigation.',
      );
      return;
    }

    startNavigation();
    console.log('NavigationMapScreen - Manual navigation started');
  }, [waypoints.length, startNavigation]);

  // Focus on route
  const handleFocusRoute = useCallback(() => {
    if (navigationState.activeRoute) {
      focusOnRoute();
      console.log('NavigationMapScreen - Focusing on route');
    }
  }, [navigationState.activeRoute, focusOnRoute]);

  const getRouteColor = () => {
    if (navigationState.navigationMode === 'auto') return '#27AE60';
    if (navigationState.navigationMode === 'manual') return '#3498DB';
    return '#9B59B6';
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.mapContainer, { opacity: fadeAnim }]}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: 37.7849,
            longitude: -122.4094,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          mapType="standard"
          pitchEnabled={true}
          rotateEnabled={true}
          zoomEnabled={true}
          scrollEnabled={true}
        >
          {/* Enhanced User location marker with FOV cone */}
          {location && (
            <EnhancedUserLocationMarker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              heading={location.heading}
              compassHeading={compassActive ? compassHeading : undefined}
              isNavigating={navigationState.isNavigating}
              showFOVCone={true}
              fovAngle={60}
              accuracy={location.accuracy}
            />
          )}

          {/* Waypoint markers */}
          {waypoints.map(waypoint => (
            <WaypointMarker
              key={waypoint.id}
              waypoint={waypoint}
              onPress={() => handleWaypointPress(waypoint.id)}
              isActive={waypoint.id === navigationState.currentWaypoint?.id}
            />
          ))}

          {/* Active route */}
          {navigationState.activeRoute && (
            <Polyline
              coordinates={navigationState.activeRoute}
              strokeColor={getRouteColor()}
              strokeWidth={6}
              lineDashPhase={0}
            />
          )}
        </MapView>
      </Animated.View>

      {/* Navigation Controls */}
      <Animated.View
        style={[
          styles.controlsContainer,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.controlButton,
            {
              backgroundColor: navigationState.isNavigating
                ? '#E74C3C'
                : '#27AE60',
            },
          ]}
          onPress={
            navigationState.isNavigating
              ? stopNavigation
              : handleStartAutoNavigation
          }
        >
          <Text style={styles.controlButtonText}>
            {navigationState.isNavigating ? '⏹️ Stop' : '🎯 Auto Nav'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: '#3498DB' }]}
          onPress={handleStartManualNavigation}
          disabled={navigationState.isNavigating}
        >
          <Text style={styles.controlButtonText}>📍 Manual</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: '#9B59B6' }]}
          onPress={() => rotateToNorth(true)}
        >
          <Text style={styles.controlButtonText}>🧭 North</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: '#F39C12' }]}
          onPress={handleFocusRoute}
          disabled={!navigationState.activeRoute}
        >
          <Text style={styles.controlButtonText}>🗺️ Route</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Navigation Status */}
      <View style={styles.statusContainer}>
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>
            🎯 Mode: {navigationState.navigationMode.toUpperCase()} | 📍
            Waypoints: {waypoints.filter(wp => wp.status === 'pending').length}{' '}
            pending
          </Text>

          {navigationState.currentWaypoint && (
            <Text style={styles.activeWaypointText}>
              → {navigationState.currentWaypoint.name}
            </Text>
          )}

          {navigationState.routeInfo && (
            <Text style={styles.routeInfoText}>
              📏 {navigationState.routeInfo.distance} • ⏱️{' '}
              {navigationState.routeInfo.duration}
            </Text>
          )}

          {location && (
            <Text style={styles.locationText}>
              📊 Accuracy: {location.accuracy.toFixed(0)}m | 🧭 Bearing:{' '}
              {(compassActive && compassHeading !== undefined
                ? compassHeading
                : location.heading
              ).toFixed(0)}
              °{compassActive && ' (Compass)'}
            </Text>
          )}

          {error && <Text style={styles.errorText}>⚠️ {error}</Text>}
        </View>
      </View>

      {/* Compass */}
      <View style={styles.compassContainer}>
        <View
          style={[
            styles.compass,
            { transform: [{ rotate: `${-compassBearing}deg` }] },
          ]}
        >
          <Text style={styles.compassText}>N</Text>
          <View style={styles.compassNeedle} />
        </View>
      </View>

      {/* Waypoint Progress */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>Progress</Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${
                  (waypoints.filter(wp => wp.status === 'completed').length /
                    waypoints.length) *
                  100
                }%`,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {waypoints.filter(wp => wp.status === 'completed').length} /{' '}
          {waypoints.length} completed
        </Text>
      </View>

      {/* Camera Animation Indicator */}
      {isAnimating && (
        <View style={styles.animationIndicator}>
          <Text style={styles.animationText}>📹 Adjusting camera...</Text>
        </View>
      )}

      {/* Simple Compass Indicator */}
      <SimpleCompassIndicator />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mapContainer: {
    flex: 1,
    borderRadius: 15,
    margin: 10,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  map: {
    flex: 1,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 5,
  },
  controlButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 80,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  controlButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusContainer: {
    position: 'absolute',
    bottom: 120,
    left: 10,
    right: 10,
  },
  statusBar: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  activeWaypointText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  routeInfoText: {
    color: '#4ECDC4',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  locationText: {
    color: '#ccc',
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 2,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  compassContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 60,
    height: 60,
  },
  compass: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  compassText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E74C3C',
    position: 'absolute',
    top: 8,
  },
  compassNeedle: {
    width: 2,
    height: 20,
    backgroundColor: '#E74C3C',
    position: 'absolute',
  },
  progressContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 12,
    minWidth: 150,
    elevation: 5,
  },
  progressTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 6,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#ECF0F1',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#27AE60',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 10,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  animationIndicator: {
    position: 'absolute',
    top: 140,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(52, 152, 219, 0.9)',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  animationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  calibrationButton: {
    position: 'absolute',
    bottom: 10,
    left: 20,
    right: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  calibrationButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default NavigationMapScreen;
