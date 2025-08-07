import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import MapView, { Polyline, Region, Camera } from 'react-native-maps';
import { ArrowMarker, RestaurantMarker } from '../components/CustomMarkers';
import { useLocationTracking } from '../hooks/useLocationTracking';
import {
  mockRestaurants,
  DEFAULT_LOCATION,
  Restaurant,
} from '../data/mockData';
import {
  findNearestRestaurants,
  createDirectionLine,
  createCurvedPath,
  calculateDistance,
} from '../utils/locationUtils';

const { width, height } = Dimensions.get('window');

interface DirectionLine {
  id: string;
  coordinates: { latitude: number; longitude: number }[];
  color: string;
}

const MapScreen: React.FC = () => {
  const mapRef = useRef<MapView>(null);
  const { location, isTracking, error, startTracking, stopTracking } =
    useLocationTracking();

  const [nearestRestaurants, setNearestRestaurants] = useState<Restaurant[]>(
    [],
  );
  const [directionLines, setDirectionLines] = useState<DirectionLine[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>(DEFAULT_LOCATION);
  const [showDirections, setShowDirections] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Start location tracking when component mounts
    startTracking();

    // Animate UI elements
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      stopTracking();
    };
  }, []);

  useEffect(() => {
    if (location) {
      // Find nearest restaurants when location updates
      const nearest = findNearestRestaurants(
        { latitude: location.latitude, longitude: location.longitude },
        mockRestaurants,
        8,
      );
      setNearestRestaurants(nearest);

      // Animate camera to follow user location with smooth transition
      const newRegion: Region = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      mapRef.current?.animateToRegion(newRegion, 1000);

      // Update direction lines if showing directions
      if (showDirections && nearest.length > 0) {
        const lines = nearest.slice(0, 3).map((restaurant, index) => {
          const path = createCurvedPath(
            { latitude: location.latitude, longitude: location.longitude },
            { latitude: restaurant.latitude, longitude: restaurant.longitude },
          );

          return {
            id: restaurant.id,
            coordinates: path,
            color: getDirectionColor(index),
          };
        });
        setDirectionLines(lines);
      }
    }
  }, [location, showDirections]);

  const getDirectionColor = (index: number): string => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    return colors[index % colors.length];
  };

  const handleRestaurantPress = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);

    // Animate to restaurant location
    const region: Region = {
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };

    mapRef.current?.animateToRegion(region, 1000);

    // Show direction line to selected restaurant
    if (location) {
      const path = createCurvedPath(
        { latitude: location.latitude, longitude: location.longitude },
        { latitude: restaurant.latitude, longitude: restaurant.longitude },
      );

      setDirectionLines([
        {
          id: restaurant.id,
          coordinates: path,
          color: '#FF6B6B',
        },
      ]);
    }

    // Show restaurant details
    Alert.alert(
      restaurant.name,
      `${restaurant.description}\n\nRating: ${
        restaurant.rating
      } ⭐\nDistance: ${restaurant.distance?.toFixed(1)} km\nType: ${
        restaurant.type
      }`,
      [
        { text: 'Close', style: 'cancel' },
        {
          text: 'Navigate',
          onPress: () => console.log('Navigate to', restaurant.name),
        },
      ],
    );
  };

  const toggleDirections = () => {
    setShowDirections(!showDirections);
    if (!showDirections) {
      setDirectionLines([]);
    }
  };

  const centerOnUser = () => {
    if (location && mapRef.current) {
      const region: Region = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      mapRef.current.animateToRegion(region, 1000);
    }
  };

  const clearDirections = () => {
    setDirectionLines([]);
    setSelectedRestaurant(null);
    setShowDirections(false);
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.mapContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={DEFAULT_LOCATION}
          showsUserLocation={false} // We'll use custom marker
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
          mapType="standard"
          onRegionChangeComplete={setMapRegion}
        >
          {/* User location arrow marker */}
          {location && (
            <ArrowMarker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              rotation={location.heading}
              size={35}
            />
          )}

          {/* Restaurant markers */}
          {nearestRestaurants.map(restaurant => (
            <RestaurantMarker
              key={restaurant.id}
              restaurant={restaurant}
              onPress={() => handleRestaurantPress(restaurant)}
            />
          ))}

          {/* Direction lines */}
          {directionLines.map(line => (
            <Polyline
              key={line.id}
              coordinates={line.coordinates}
              strokeColor={line.color}
              strokeWidth={4}
              strokePattern={[20, 10]}
              lineDashPhase={0}
            />
          ))}
        </MapView>
      </Animated.View>

      {/* Control buttons */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: isTracking ? '#FF6B6B' : '#4ECDC4' },
          ]}
          onPress={isTracking ? stopTracking : startTracking}
        >
          <Text style={styles.controlButtonText}>
            {isTracking ? '⏸️ Stop' : '▶️ Start'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: '#45B7D1' }]}
          onPress={centerOnUser}
        >
          <Text style={styles.controlButtonText}>📍 Center</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: showDirections ? '#FF6B6B' : '#96CEB4' },
          ]}
          onPress={toggleDirections}
        >
          <Text style={styles.controlButtonText}>
            {showDirections ? '🚫 Hide' : '🗺️ Directions'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: '#FFEAA7' }]}
          onPress={clearDirections}
        >
          <Text style={styles.controlButtonText}>🧹 Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Status bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          📍 Restaurants: {nearestRestaurants.length} | 🎯 Tracking:{' '}
          {isTracking ? 'ON' : 'OFF'}
        </Text>
        {location && (
          <Text style={styles.locationText}>
            📊 Accuracy: {location.accuracy.toFixed(0)}m | 🧭 Heading:{' '}
            {location.heading.toFixed(0)}°
          </Text>
        )}
        {error && <Text style={styles.errorText}>⚠️ {error}</Text>}
      </View>

      {/* Restaurant count overlay */}
      <View style={styles.restaurantCount}>
        <Text style={styles.countText}>{nearestRestaurants.length}</Text>
        <Text style={styles.countLabel}>Nearby</Text>
      </View>
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
    borderRadius: 10,
    margin: 10,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  map: {
    flex: 1,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  controlButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  controlButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBar: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
  locationText: {
    color: '#ccc',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  restaurantCount: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#FF6B6B',
    borderRadius: 25,
    width: 50,
    height: 50,
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
  },
  countText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  countLabel: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
});

export default MapScreen;
