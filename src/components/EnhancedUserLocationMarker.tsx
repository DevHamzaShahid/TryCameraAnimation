import React, { useRef, useEffect, useMemo } from 'react';
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

export const EnhancedUserLocationMarker: React.FC<
  EnhancedUserLocationMarkerProps
> = ({
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
  const effectiveHeading = useMemo(() => {
    return compassHeading !== undefined ? compassHeading : heading;
  }, [compassHeading, heading]);

  // Smooth rotation animation
  useEffect(() => {
    Animated.timing(rotationAnim, {
      toValue: effectiveHeading,
      duration: 200, // Faster animation for smoother rotation
      useNativeDriver: true,
    }).start();
  }, [effectiveHeading, rotationAnim]);

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
  }, [accuracy, scaleAnim]);

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
                  {
                    rotate: rotationAnim.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    }),
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
                {
                  rotate: rotationAnim.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
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
                          outputRange: [1, 2.5],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </>
          )}
        </Animated.View>
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fovContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationMarker: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  navigatingMarker: {
    // Additional styles for navigation mode
  },
  accuracyRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
  },
  userLocationInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  userLocationIcon: {
    fontSize: 12,
    color: 'white',
  },
  directionPointer: {
    position: 'absolute',
    top: -2,
    width: 0,
    height: 0,
    alignItems: 'center',
  },
  pointerTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'inherit',
  },
  pulseRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
  },
  pulseRing1: {
    // First pulse ring
  },
  pulseRing2: {
    // Second pulse ring
  },
});
