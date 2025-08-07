import { useState, useEffect, useRef, useCallback } from 'react';
import CompassHeading from 'react-native-compass-heading';
import { throttle, angleDifference } from '../utils/performanceUtils';

interface UseCompassHeadingReturn {
  heading: number;
  accuracy: number;
  isActive: boolean;
  error: string | null;
  startCompass: () => void;
  stopCompass: () => void;
}

export const useCompassHeading = (): UseCompassHeadingReturn => {
  const [heading, setHeading] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<any>(null);
  const smoothingBufferRef = useRef<number[]>([]);
  const lastHeadingRef = useRef<number>(0);
  
  // Throttled heading update to prevent excessive re-renders
  const throttledSetHeading = useCallback(
    throttle((newHeading: number) => {
      setHeading(newHeading);
    }, 100), // Update at most every 100ms
    []
  );

  // Smooth heading changes to prevent jittery rotation
  const smoothHeading = (newHeading: number): number => {
    const buffer = smoothingBufferRef.current;
    buffer.push(newHeading);
    
    // Keep only last 3 readings for smoothing
    if (buffer.length > 3) {
      buffer.shift();
    }
    
    // Calculate weighted average (more weight to recent readings)
    let weightedSum = 0;
    let totalWeight = 0;
    
    buffer.forEach((value, index) => {
      const weight = index + 1; // More recent readings get higher weight
      weightedSum += value * weight;
      totalWeight += weight;
    });
    
    const smoothed = weightedSum / totalWeight;
    
    // Handle 360° wraparound smoothly using utility function
    const lastHeading = lastHeadingRef.current;
    const diff = angleDifference(lastHeading, smoothed);
    const adjustedHeading = lastHeading + diff;
    
    lastHeadingRef.current = adjustedHeading;
    return adjustedHeading;
  };

  const startCompass = () => {
    if (subscriptionRef.current) {
      return; // Already started
    }

    try {
      setError(null);
      setIsActive(true);
      
      subscriptionRef.current = CompassHeading.start(2, (headingData: any) => {
        try {
          const { heading: rawHeading, accuracy: rawAccuracy } = headingData;
          
          // Smooth the heading to prevent jittery animations
          const smoothedHeading = smoothHeading(rawHeading);
          
          // Only update if there's a significant change to prevent excessive updates
          if (Math.abs(angleDifference(lastHeadingRef.current, smoothedHeading)) > 0.5) {
            throttledSetHeading(smoothedHeading);
          }
          setAccuracy(rawAccuracy || 0);
        } catch (err) {
          console.error('Error processing compass data:', err);
          setError('Failed to process compass data');
        }
      });
    } catch (err: any) {
      console.error('Error starting compass:', err);
      setError(`Compass error: ${err.message || 'Unknown error'}`);
      setIsActive(false);
    }
  };

  const stopCompass = () => {
    if (subscriptionRef.current) {
      CompassHeading.stop();
      subscriptionRef.current = null;
    }
    setIsActive(false);
    smoothingBufferRef.current = [];
  };

  useEffect(() => {
    return () => {
      stopCompass();
    };
  }, []);

  return {
    heading,
    accuracy,
    isActive,
    error,
    startCompass,
    stopCompass,
  };
};