import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Marker } from 'react-native-maps';
import { FieldOfViewCone, SimpleFieldOfViewCone } from './FieldOfViewCone';

interface EnhancedUserLocationMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  heading: number;
  compassHeading?: number; // Device compass heading for more accurate orientation
  isNavigating?: boolean;
  showFOVCone?: boolean;
  fovAngle?: number;
  accuracy?: number;
}

export const EnhancedUserLocationMarker: React.FC<EnhancedUserLocationMarkerProps> = ({
  coordinate,
  heading,
  compassHeading,
  isNavigating = false,
  showFOVCone = true,
  fovAngle = 60,
  accuracy = 0,
}) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Use compass heading if available, otherwise fall back to GPS heading
  const effectiveHeading = compassHeading !== undefined ? compassHeading : heading;

  useEffect(() => {
    // Debug logging
    console.log('EnhancedUserLocationMarker - Heading update:', {
      gpsHeading: heading,
      compassHeading: compassHeading,
      effectiveHeading: effectiveHeading
    });

    // Smooth rotation animation
    Animated.timing(rotationAnim, {
      toValue: effectiveHeading,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [effectiveHeading, heading, compassHeading]);

  useEffect(() => {
    // Pulsing animation for navigation mode
    if (isNavigating) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      );
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    } else {
      pulseAnim.setValue(0);
    }
  }, [isNavigating, pulseAnim]);

  useEffect(() => {
    // Scale animation based on accuracy
    const targetScale = accuracy > 50 ? 0.8 : accuracy > 20 ? 0.9 : 1.0;
    Animated.spring(scaleAnim, {
      toValue: targetScale,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [accuracy]);

  const getMarkerColor = () => {
    if (accuracy > 50) return '#FF6B6B'; // Red for poor accuracy
    if (accuracy > 20) return '#FFD93D'; // Yellow for moderate accuracy
    return '#007AFF'; // Blue for good accuracy
  };

  const getAccuracyIndicator = () => {
    if (accuracy > 50) return '⚠️';
    if (accuracy > 20) return '📍';
    return '🎯';
  };

  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      flat={true}
      zIndex={2000}
    >
      <View style={styles.markerContainer}>
        {/* Field of View Cone */}
        {showFOVCone && (
          <Animated.View 
            style={[
              styles.fovContainer,
              {
                transform: [
                  { rotate: rotationAnim.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    })
                  },
                ],
              },
            ]}
          >
            <SimpleFieldOfViewCone
              heading={0} // Static - rotation handled by parent
              isVisible={true}
              radius={80}
              angle={fovAngle}
              color={getMarkerColor()}
              opacity={0.25}
            />
          </Animated.View>
        )}

        {/* Main marker with orientation */}
        <Animated.View
          style={[
            styles.userLocationMarker,
            isNavigating && styles.navigatingMarker,
            {
              transform: [
                { scale: scaleAnim },
                { rotate: rotationAnim.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  })
                },
              ],
            },
          ]}
        >
          {/* Accuracy ring */}
          <View
            style={[
              styles.accuracyRing,
              { 
                borderColor: getMarkerColor(),
                opacity: accuracy > 20 ? 0.3 : 0,
              },
            ]}
          />

          {/* Main location dot */}
          <View
            style={[
              styles.userLocationInner,
              { backgroundColor: getMarkerColor() },
            ]}
          >
            <Text style={styles.userLocationIcon}>
              {getAccuracyIndicator()}
            </Text>
          </View>

          {/* Direction arrow/pointer */}
          <View
            style={[
              styles.directionPointer,
              { backgroundColor: getMarkerColor() },
            ]}
          >
            <View style={styles.pointerTriangle} />
          </View>

          {/* Navigation pulse rings */}
          {isNavigating && (
            <>
              <Animated.View
                style={[
                  styles.pulseRing,
                  styles.pulseRing1,
                  {
                    borderColor: getMarkerColor(),
                    opacity: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 0],
                    }),
                    transform: [
                      {
                        scale: pulseAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 2],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.pulseRing,
                  styles.pulseRing2,
                  {
                    borderColor: getMarkerColor(),
                    opacity: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.4, 0],
                    }),
                    transform: [
                      {
                        scale: pulseAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1.2, 2.5],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </>
          )}
        </Animated.View>

        {/* Heading display */}
        <View style={styles.headingDisplay}>
          <Text style={styles.headingText}>
            {Math.round(effectiveHeading)}°
          </Text>
          {compassHeading !== undefined && (
            <Text style={styles.compassIndicator}>🧭</Text>
          )}
        </View>
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fovContainer: {
    position: 'absolute',
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  userLocationMarker: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  navigatingMarker: {
    width: 60,
    height: 60,
  },
  accuracyRing: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  userLocationInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
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
    borderColor: '#FFFFFF',
    zIndex: 3,
  },
  userLocationIcon: {
    fontSize: 18,
    color: 'white',
  },
  directionPointer: {
    position: 'absolute',
    top: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 4,
  },
  pointerTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFFFFF',
  },
  pulseRing: {
    position: 'absolute',
    borderRadius: 40,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  pulseRing1: {
    width: 60,
    height: 60,
    top: -5,
    left: -5,
  },
  pulseRing2: {
    width: 80,
    height: 80,
    top: -15,
    left: -15,
  },
  headingDisplay: {
    position: 'absolute',
    bottom: -35,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 5,
  },
  headingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  compassIndicator: {
    fontSize: 10,
    marginLeft: 4,
  },
});