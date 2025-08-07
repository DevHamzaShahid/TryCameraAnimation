import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';

interface ArrowMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  rotation: number;
  size?: number;
}

interface RestaurantMarkerProps {
  restaurant: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    image: string;
    type: string;
    rating: number;
    distance?: number;
  };
  onPress?: () => void;
}

export const ArrowMarker: React.FC<ArrowMarkerProps> = ({
  coordinate,
  rotation,
  size = 30,
}) => {
  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      flat={true}
      rotation={rotation}
    >
      <View style={[styles.arrowContainer, { width: size, height: size }]}>
        <View style={styles.arrow}>
          <Text style={[styles.arrowText, { fontSize: size * 0.8 }]}>↑</Text>
        </View>
      </View>
    </Marker>
  );
};

export const RestaurantMarker: React.FC<RestaurantMarkerProps> = ({
  restaurant,
  onPress,
}) => {
  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'restaurant':
        return '#FF6B6B';
      case 'cafe':
        return '#4ECDC4';
      case 'fast_food':
        return '#FFE66D';
      case 'bakery':
        return '#FF8B94';
      case 'street_food':
        return '#95E1D3';
      default:
        return '#A8E6CF';
    }
  };

  return (
    <Marker
      coordinate={{
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
      }}
      onPress={onPress}
    >
      <View
        style={[
          styles.restaurantMarker,
          { backgroundColor: getMarkerColor(restaurant.type) },
        ]}
      >
        <Text style={styles.restaurantEmoji}>{restaurant.image}</Text>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>{restaurant.rating}</Text>
        </View>
      </View>
      <View style={styles.callout}>
        <Text style={styles.restaurantName} numberOfLines={1}>
          {restaurant.name}
        </Text>
        {restaurant.distance && (
          <Text style={styles.distanceText}>
            {restaurant.distance.toFixed(1)} km
          </Text>
        )}
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  arrowText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  restaurantMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 3,
    borderColor: 'white',
  },
  restaurantEmoji: {
    fontSize: 24,
  },
  ratingBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FFD700',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  callout: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    marginTop: 5,
    minWidth: 100,
    maxWidth: 150,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  restaurantName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  distanceText: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
});
