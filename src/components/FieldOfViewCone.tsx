import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import Svg, { Path, Defs, RadialGradient, Stop } from 'react-native-svg';

interface FieldOfViewConeProps {
  heading: number;
  isVisible: boolean;
  radius?: number;
  angle?: number;
  color?: string;
  opacity?: number;
}

export const FieldOfViewCone: React.FC<FieldOfViewConeProps> = ({
  heading,
  isVisible,
  radius = 80,
  angle = 45, // Field of view angle in degrees
  color = '#007AFF',
  opacity = 0.3,
}) => {
  const rotationAnim = useRef(new Animated.Value(heading)).current;
  const opacityAnim = useRef(new Animated.Value(isVisible ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(isVisible ? 1 : 0.8)).current;

  useEffect(() => {
    // Smooth rotation animation
    Animated.timing(rotationAnim, {
      toValue: heading,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [heading]);

  useEffect(() => {
    // Fade in/out animation
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: isVisible ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: isVisible ? 1 : 0.8,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  }, [isVisible]);

  // Calculate cone path coordinates
  const createConePath = () => {
    const halfAngle = (angle * Math.PI) / 360; // Half angle in radians
    const centerX = radius;
    const centerY = radius;
    
    // Start from center
    const startX = centerX;
    const startY = centerY;
    
    // Left edge of cone
    const leftX = centerX + radius * Math.sin(-halfAngle);
    const leftY = centerY - radius * Math.cos(-halfAngle);
    
    // Right edge of cone
    const rightX = centerX + radius * Math.sin(halfAngle);
    const rightY = centerY - radius * Math.cos(halfAngle);
    
    // Create arc path for the cone edge
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    return `M ${startX} ${startY} 
            L ${leftX} ${leftY} 
            A ${radius} ${radius} 0 ${largeArcFlag} 1 ${rightX} ${rightY} 
            Z`;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: radius * 2,
          height: radius * 2,
          opacity: opacityAnim,
          transform: [
            { rotate: rotationAnim.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              })
            },
            { scale: scaleAnim },
          ],
        },
      ]}
      pointerEvents="none"
    >
      <Svg
        width={radius * 2}
        height={radius * 2}
        viewBox={`0 0 ${radius * 2} ${radius * 2}`}
      >
        <Defs>
          <RadialGradient
            id="coneGradient"
            cx="50%"
            cy="50%"
            r="50%"
            fx="50%"
            fy="50%"
          >
            <Stop offset="0%" stopColor={color} stopOpacity={opacity * 0.8} />
            <Stop offset="70%" stopColor={color} stopOpacity={opacity * 0.4} />
            <Stop offset="100%" stopColor={color} stopOpacity={opacity * 0.1} />
          </RadialGradient>
        </Defs>
        
        <Path
          d={createConePath()}
          fill="url(#coneGradient)"
          stroke={color}
          strokeWidth={1}
          strokeOpacity={opacity * 0.6}
        />
      </Svg>
    </Animated.View>
  );
};

// Alternative simpler cone using View (fallback if SVG has issues)
export const SimpleFieldOfViewCone: React.FC<FieldOfViewConeProps> = ({
  heading,
  isVisible,
  radius = 80,
  angle = 45,
  color = '#007AFF',
  opacity = 0.3,
}) => {
  const rotationAnim = useRef(new Animated.Value(heading)).current;
  const opacityAnim = useRef(new Animated.Value(isVisible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(rotationAnim, {
      toValue: heading,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [heading]);

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: isVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible]);

  return (
    <Animated.View
      style={[
        styles.simpleCone,
        {
          width: radius * 2,
          height: radius,
          backgroundColor: color,
          opacity: opacityAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, opacity],
          }),
          transform: [
            { rotate: rotationAnim.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              })
            },
          ],
        },
      ]}
      pointerEvents="none"
    />
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  simpleCone: {
    position: 'absolute',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    transformOrigin: 'center bottom',
  },
});