import { useState, useEffect, useRef, useCallback } from 'react';
import CompassHeading from 'react-native-compass-heading';
import { throttle } from '../utils/performanceUtils';

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
  const lastHeadingRef = useRef<number>(0);

  // Throttled heading update
  const throttledSetHeading = useCallback(
    throttle((newHeading: number) => {
      setHeading(newHeading);
    }, 100),
    []
  );

  const startCompass = () => {
    if (subscriptionRef.current) {
      console.log('useCompassHeading - Compass already started');
      return;
    }

    console.log('useCompassHeading - Starting compass...');
    try {
      setError(null);
      setIsActive(true);
      
      // Check if CompassHeading is available
      if (!CompassHeading || typeof CompassHeading.start !== 'function') {
        throw new Error('CompassHeading library not available');
      }
      
      subscriptionRef.current = CompassHeading.start(1, (headingData: any) => {
        try {
          console.log('useCompassHeading - Raw compass data received:', headingData);
          console.log('useCompassHeading - Data type:', typeof headingData);
          console.log('useCompassHeading - Data keys:', Object.keys(headingData || {}));
          
          if (!headingData) {
            console.warn('useCompassHeading - No heading data received');
            return;
          }
          
          const { heading: rawHeading, accuracy: rawAccuracy } = headingData;
          
          console.log('useCompassHeading - Extracted values:', {
            rawHeading,
            rawAccuracy,
            headingType: typeof rawHeading,
            accuracyType: typeof rawAccuracy
          });
          
          // Validate raw heading
          if (typeof rawHeading !== 'number' || isNaN(rawHeading)) {
            console.warn('useCompassHeading - Invalid raw heading:', rawHeading);
            return;
          }
          
          // Normalize heading to 0-360 range
          let normalizedHeading = ((rawHeading % 360) + 360) % 360;
          
          // Simple smoothing to prevent jitter
          const smoothingFactor = 0.3;
          const diff = normalizedHeading - lastHeadingRef.current;
          const smoothedHeading = lastHeadingRef.current + diff * smoothingFactor;
          
          console.log('useCompassHeading - Processing heading:', {
            raw: rawHeading,
            normalized: normalizedHeading,
            smoothed: smoothedHeading,
            accuracy: rawAccuracy,
            diff: diff
          });
          
          // Update heading if there's a significant change
          if (Math.abs(diff) > 0.5) {
            console.log('useCompassHeading - Updating heading to:', smoothedHeading);
            throttledSetHeading(smoothedHeading);
            lastHeadingRef.current = smoothedHeading;
          }
          
          // Update accuracy
          if (typeof rawAccuracy === 'number' && !isNaN(rawAccuracy)) {
            console.log('useCompassHeading - Updating accuracy to:', rawAccuracy);
            setAccuracy(rawAccuracy);
          } else {
            console.warn('useCompassHeading - Invalid accuracy value:', rawAccuracy);
          }
        } catch (err) {
          console.error('useCompassHeading - Error processing compass data:', err);
          setError('Failed to process compass data');
        }
      });
      
      console.log('useCompassHeading - Compass started successfully');
    } catch (err: any) {
      console.error('useCompassHeading - Error starting compass:', err);
      setError(`Compass error: ${err.message || 'Unknown error'}`);
      setIsActive(false);
    }
  };

  const stopCompass = () => {
    console.log('useCompassHeading - Stopping compass...');
    if (subscriptionRef.current) {
      try {
        CompassHeading.stop();
      } catch (err) {
        console.error('useCompassHeading - Error stopping compass:', err);
      }
      subscriptionRef.current = null;
    }
    setIsActive(false);
    lastHeadingRef.current = 0;
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